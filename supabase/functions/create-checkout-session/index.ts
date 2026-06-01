import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { handleOptions, jsonResponse } from '../_shared/cors.ts';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const entryFeeCents = parseInt(Deno.env.get('STRIPE_ENTRY_FEE_CENTS') || '2000', 10);
const productName = Deno.env.get('STRIPE_PRODUCT_NAME') || "Ash's WC Tourney Pool Entry";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  if (!stripeSecret) {
    return jsonResponse({ error: 'Stripe is not configured on the server' }, 503);
  }

  try {
    const body = await req.json();
    const participant = body?.participant;
    const successUrl = body?.successUrl;
    const cancelUrl = body?.cancelUrl;

    if (!participant?.name || !participant?.bracketPicks) {
      return jsonResponse({ error: 'Invalid submission payload' }, 400);
    }
    if (!successUrl || !cancelUrl) {
      return jsonResponse({ error: 'successUrl and cancelUrl are required' }, 400);
    }

    const pendingId = `pending_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const submissionId = body?.submissionId || `sub_${Date.now()}`;
    participant.id = submissionId;
    participant.submitted = true;
    participant.onboarded = true;

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { error: insertError } = await supabase.from('pending_submissions').insert({
      id: pendingId,
      data: { participant, targetSubmissionId: submissionId },
      status: 'pending',
    });

    if (insertError) {
      return jsonResponse({ error: insertError.message }, 500);
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: pendingId,
      metadata: {
        pending_id: pendingId,
        submission_id: submissionId,
        participant_name: String(participant.name),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: entryFeeCents,
            product_data: {
              name: productName,
              description: 'Locked entry for the World Cup 2026 prediction pool',
            },
          },
        },
      ],
    });

    await supabase
      .from('pending_submissions')
      .update({ stripe_session_id: session.id })
      .eq('id', pendingId);

    return jsonResponse({
      pendingId,
      submissionId,
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    console.error('create-checkout-session error:', err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Checkout creation failed' },
      500
    );
  }
});
