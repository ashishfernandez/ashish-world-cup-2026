# Stripe payment setup (Submit Picks)

The wizard adds **Step 6: Payment** after the review step. Entries are written to the global leaderboard only after Stripe confirms payment.

## Architecture

1. User completes steps 1–5 (profile → groups → 3rd places → bracket → review).
2. **Step 6** calls the `create-checkout-session` Edge Function, which stores a `pending_submissions` row and returns a Stripe Checkout URL.
3. After payment, Stripe redirects to `?payment=success&session_id=...`.
4. The site calls `verify-checkout-session`, which promotes the pending row into `submissions`.
5. The `stripe-webhook` function also promotes on `checkout.session.completed` (backup if the user closes the tab early).

## 1. Stripe Dashboard

1. Create a [Stripe account](https://dashboard.stripe.com/) (use **Test mode** first).
2. **Developers → API keys**: copy **Publishable key** and **Secret key**.
3. **Developers → Webhooks → Add endpoint**:
   - URL: `https://ovfmmszhlkedypfveyxj.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`
   - Copy the **Signing secret** (`whsec_...`).

## 2. Supabase

### Run SQL migration

In **SQL Editor**, run:

`supabase/migrations/20260602_stripe_payments.sql`

### Edge Function secrets

**Project Settings → Edge Functions → Secrets** (or CLI):

| Secret | Value |
|--------|--------|
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `STRIPE_ENTRY_FEE_CENTS` | `1500` (= $15.00) |
| `STRIPE_PRODUCT_NAME` | `Ash's WC Tourney Pool Entry` (optional) |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically in Edge Functions.

### Deploy functions

Install [Supabase CLI](https://supabase.com/docs/guides/cli), link the project, then:

```bash
supabase functions deploy create-checkout-session --no-verify-jwt
supabase functions deploy verify-checkout-session --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
```

## 3. Entry fee on the site

Edit `PAYMENT_CONFIG` in `app.js`:

```javascript
const PAYMENT_CONFIG = {
    required: true,
    entryFeeDisplay: '$15.00',
    productLabel: "Ash's WC Tourney Pool Entry",
};
```

Set `required: false` only for local testing without Stripe (submits without payment).

## 4. Test flow

1. Use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC.
2. Submit picks through the wizard → Pay on step 6.
3. After redirect, you should see a success message and the new name on the leaderboard.

## 5. Go live

1. Toggle Stripe to **Live mode**.
2. **Developers → Webhooks → Add endpoint** (live mode has its **own** endpoint and signing secret — test `whsec_` will not work):
   - URL: `https://ovfmmszhlkedypfveyxj.supabase.co/functions/v1/stripe-webhook`
   - Event: `checkout.session.completed`
   - Copy the **live** signing secret (`whsec_...`).
3. In **Supabase → Project Settings → Edge Functions → Secrets**, set:
   - `STRIPE_SECRET_KEY` = `sk_live_...`
   - `STRIPE_WEBHOOK_SECRET` = live `whsec_...` (must match the live webhook endpoint above)
4. Redeploy: `supabase functions deploy stripe-webhook --no-verify-jwt` (or run `scripts/deploy-stripe-functions.ps1`).
5. In Stripe, open the webhook endpoint and click **Enable** if Stripe disabled it after failures.
6. Use **Send test webhook** or **Recent deliveries** on that endpoint — a successful delivery shows **200**.

Confirm `worldcupofash.com` is allowed in Stripe Checkout redirect URLs (same origin as the site).

## 6. Webhook disabled email (troubleshooting)

Stripe disables endpoints that return non-2xx responses for many days in a row. Common causes for this project:

| Stripe delivery response | Likely cause | Fix |
|--------------------------|--------------|-----|
| **400** Invalid signature | `STRIPE_WEBHOOK_SECRET` in Supabase does not match the **live** webhook signing secret | Copy `whsec_...` from **Live** → Webhooks → your endpoint → Signing secret; update Supabase secret |
| **503** Webhook not configured | `STRIPE_WEBHOOK_SECRET` missing in Supabase | Add the secret and redeploy |
| **500** | Database error promoting `pending_submissions` | Check Supabase logs for `stripe-webhook`; confirm migration `20260602_stripe_payments.sql` was run |
| Connection / timeout | Function not deployed | Run `scripts/deploy-stripe-functions.ps1` |

**Note:** Payments can still succeed without the webhook. After checkout, the site calls `verify-checkout-session` on redirect, which also promotes the entry. The webhook is a **backup** if the user closes the tab before returning to the site.

**Quick health check:** In Stripe Dashboard → Webhooks → your endpoint → **Recent deliveries**, open a failed event and read the HTTP status and response body.

**Re-enable after fix:** Webhooks → select endpoint → **Enable** → optionally **Resend** a recent `checkout.session.completed` event to confirm **200**.
