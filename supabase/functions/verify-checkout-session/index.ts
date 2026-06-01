import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { handleOptions, jsonResponse } from '../_shared/cors.ts';
import { promotePendingSubmission } from '../_shared/promote.ts';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    const { sessionId } = await req.json();
    if (!sessionId) {
      return jsonResponse({ error: 'sessionId is required' }, 400);
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return jsonResponse({ ok: false, error: 'Payment not completed' }, 402);
    }

    const pendingId =
      session.metadata?.pending_id || session.client_reference_id || '';
    if (!pendingId) {
      return jsonResponse({ error: 'Missing pending reference on checkout session' }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const result = await promotePendingSubmission(supabase, pendingId);

    if (!result.ok) {
      return jsonResponse({ error: result.error }, 500);
    }

    return jsonResponse({
      ok: true,
      pendingId,
      submissionId: result.submissionId,
      participantName: result.participantName,
      alreadyPaid: result.alreadyPaid || false,
    });
  } catch (err) {
    console.error('verify-checkout-session error:', err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Verification failed' },
      500
    );
  }
});
