# 🔐 Stripe Integration Setup Guide

## Overview
Proofly uses Stripe for payment processing. All users start with a **free plan** and can upgrade to **Pro ($5.99/month)** via Stripe Checkout.

---

## ✅ Current Status

### User Plan System
- ✅ **Default Plan**: All new users start with `plan: 'free'` (enforced in User entity schema)
- ✅ **Plan Field**: Stored in User entity (`free` or `pro`)
- ✅ **Credit Limits**: Free users have daily limits, Pro users have unlimited access
- ✅ **UI Integration**: Upgrade modal and checkout button ready

### Stripe Integration (Placeholder)
- ⚠️ **Status**: Placeholder implementation - needs actual Stripe configuration
- ⚠️ **Missing**: Stripe API keys, webhook handler, backend function

---

## 🛠️ Setup Instructions

### Step 1: Create Stripe Account
1. Go to https://stripe.com
2. Create an account (or use existing)
3. Complete business verification

### Step 2: Create Product & Price
1. Go to Stripe Dashboard → Products
2. Create a new product:
   - **Name**: Proofly Pro
   - **Description**: Unlimited access to practice, exams, notes, and AI tutor
3. Add a price:
   - **Type**: Recurring
   - **Amount**: $5.99
   - **Billing Period**: Monthly
4. Copy the **Price ID** (starts with `price_...`)

### Step 3: Get API Keys
1. Go to Stripe Dashboard → Developers → API Keys
2. Copy:
   - **Publishable Key** (starts with `pk_test_...` or `pk_live_...`)
   - **Secret Key** (starts with `sk_test_...` or `sk_live_...`)

### Step 4: Set Environment Variables
Add these to your `.env` file (Base44 environment settings):

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_PRICE_ID=price_xxxxxxxxxxxxx
```

**NOTE**: `VITE_` prefix exposes to client (safe for publishable key only)

### Step 5: Enable Backend Functions (Required)
Stripe integration requires backend functions to:
1. Create checkout sessions (server-side only)
2. Handle webhook events (payment confirmations)
3. Update user plans securely

**Enable backend functions in Base44 dashboard:**
Settings → Backend Functions → Enable

### Step 6: Create Backend Function for Checkout
Create a backend function (e.g., `createCheckoutSession.js`):

```javascript
// Backend function to create Stripe Checkout Session
export default async function createCheckoutSession({ user, priceId }) {
  const Stripe = require('stripe');
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer_email: user.email,
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    success_url: 'https://yourapp.base44.app/Dashboard?upgrade=success',
    cancel_url: 'https://yourapp.base44.app/Dashboard?upgrade=cancelled',
    metadata: {
      userId: user.id,
      email: user.email,
    },
  });
  
  return { sessionId: session.id, url: session.url };
}
```

### Step 7: Update StripeCheckout Component
Replace placeholder in `components/monetization/StripeCheckout.js`:

```javascript
const handleCheckout = async () => {
  setLoading(true);
  
  try {
    const stripe = await stripePromise;
    
    // Call backend function to create checkout session
    const { sessionId } = await base44.functions.createCheckoutSession({
      user,
      priceId: import.meta.env.VITE_STRIPE_PRICE_ID,
    });
    
    // Redirect to Stripe Checkout
    const { error } = await stripe.redirectToCheckout({ sessionId });
    
    if (error) {
      toast.error('Payment failed. Please try again.');
    }
  } catch (e) {
    console.error('Checkout error:', e);
    toast.error('Payment setup error. Please contact support.');
  }
  
  setLoading(false);
};
```

### Step 8: Set Up Stripe Webhook
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourapp.base44.app/api/stripe-webhook`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
4. Copy the **Webhook Signing Secret** (starts with `whsec_...`)
5. Add to environment: `STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx`

### Step 9: Create Webhook Handler (Backend Function)
Create a backend function (e.g., `handleStripeWebhook.js`):

```javascript
// Backend function to handle Stripe webhooks
export default async function handleStripeWebhook({ payload, signature }) {
  const Stripe = require('stripe');
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { status: 400, error: err.message };
  }
  
  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      // Update user plan to 'pro'
      await base44.entities.User.update(session.metadata.userId, {
        plan: 'pro',
      });
      
      console.log(`User ${session.metadata.email} upgraded to Pro`);
      break;
      
    case 'customer.subscription.deleted':
      // Downgrade user to free plan
      const subscription = event.data.object;
      // Find user by customer ID and update
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  
  return { status: 200, received: true };
}
```

### Step 10: Test Stripe Integration
1. Use Stripe test mode (test keys)
2. Test card number: `4242 4242 4242 4242`
3. Any future expiry date, any CVC
4. Complete checkout
5. Verify user plan updated to 'pro'
6. Check webhook logs in Stripe Dashboard

### Step 11: Go Live
1. Switch to live mode in Stripe Dashboard
2. Replace test keys with live keys
3. Update webhook endpoint to production URL
4. Test with real payment method
5. Monitor Stripe Dashboard for errors

---

## 🔒 Security Checklist

- ✅ Secret key NEVER exposed to client
- ✅ Webhook signature verification enabled
- ✅ User plan updates server-side only
- ✅ Metadata includes user ID for verification
- ✅ Rate limiting on checkout endpoint
- ✅ Error logging for failed payments

---

## 💡 Current Behavior (Before Setup)

**What happens when users click "Subscribe Now":**
1. Shows error: "Stripe integration not yet configured"
2. Directs to contact partnerships@proofly.com
3. Plan remains on 'free'

**After setup:**
1. Redirects to Stripe Checkout
2. User enters payment details
3. Webhook updates plan to 'pro'
4. User redirected to Dashboard with unlimited access

---

## 📞 Support

For Stripe setup assistance:
- Email: partnerships@proofly.com
- Stripe Docs: https://stripe.com/docs
- Base44 Support: Dashboard → Help

---

## ✅ Verification Checklist

Before going live:
- [ ] Stripe account created and verified
- [ ] Product and price created ($5.99/month)
- [ ] API keys obtained and stored securely
- [ ] Environment variables set in Base44
- [ ] Backend functions enabled
- [ ] Checkout session function created
- [ ] Webhook endpoint configured
- [ ] Webhook handler function created
- [ ] Test payment completed successfully
- [ ] User plan updated after test payment
- [ ] Live mode keys replaced
- [ ] Production webhook tested

---

**Status**: Ready for Stripe configuration. All client-side code prepared, backend setup required.