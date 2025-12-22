import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

// NOTE: Set STRIPE_PUBLISHABLE_KEY in Base44 secrets
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export default function StripeCheckout({ user, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    
    try {
      const stripe = await stripePromise;
      
      if (!stripe) {
        toast.error('Stripe not configured. Please contact support.');
        setLoading(false);
        return;
      }

      // Create Stripe Checkout Session via backend function
      // NOTE: You need to create a backend function that:
      // 1. Creates a Stripe Checkout Session
      // 2. Returns the session ID
      // 3. Updates user.plan to 'pro' after successful payment
      
      // For now, this is a placeholder. You'll need to:
      // 1. Add STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_PRICE_ID to Base44 secrets
      // 2. Create a backend function to handle Stripe checkout
      // 3. Set up Stripe webhook to update user plan on successful payment
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `This is a placeholder for Stripe integration. 
        
To enable payments:
1. Set secrets in Base44 dashboard:
   - STRIPE_SECRET_KEY (from Stripe Dashboard)
   - STRIPE_PUBLISHABLE_KEY (from Stripe Dashboard)  
   - STRIPE_PRICE_ID (create a $5.99/month recurring price in Stripe)
   
2. Create a backend function to create Stripe Checkout Sessions
3. Set up Stripe webhook to update user.plan after successful payment
4. Replace this placeholder with actual Stripe checkout redirect

User email: ${user.email}`,
      });
      
      toast.error('Stripe integration not yet configured. Please contact support at partnerships@proofly.com');
      
    } catch (e) {
      console.error('Checkout error:', e);
      toast.error('Payment setup in progress. Please contact partnerships@proofly.com');
    }
    
    setLoading(false);
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="w-5 h-5 mr-2" />
          Subscribe Now - $5.99/mo
        </>
      )}
    </Button>
  );
}