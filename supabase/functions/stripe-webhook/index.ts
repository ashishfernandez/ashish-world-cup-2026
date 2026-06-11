import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { promotePendingSubmission } from '../_shared/promote.ts';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return new Response('Webhook not configured', { status: 503 });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature', { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const pendingId =
      session.metadata?.pending_id || session.client_reference_id || '';

    if (!pendingId) {
      console.warn('checkout.session.completed without pending_id:', session.id);
    } else {
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      const result = await promotePendingSubmission(supabase, pendingId);
      if (!result.ok) {
        // Acknowledge to Stripe so disabled endpoints are not caused by retries on
        // already-processed or missing rows (verify-checkout-session may have run first).
        const retryable =
          !result.error.includes('not found') &&
          !result.error.includes('Invalid pending submission');
        console.error('Promote pending submission:', result.error, {
          pendingId,
          sessionId: session.id,
          retryable,
        });
        if (retryable) {
          return new Response(result.error, { status: 500 });
        }
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
