import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function StripeCheckout({ user, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    
    try {
      // Create a checkout session (you'll need to implement this with your backend)
      // For now, simulate upgrade
      await base44.auth.updateMe({
        plan: 'pro',
      });
      
      toast.success('Upgraded to Pro!');
      onSuccess?.();
    } catch (e) {
      console.error('Checkout error:', e);
      toast.error('Payment failed. Please try again.');
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