import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';

const FREE_FEATURES = [
  'Limited daily practice questions',
  'Basic skill mastery tracking',
  'Short diagnostic exams',
  'Study plan previews',
];

const PRO_FEATURES = [
  'Unlimited practice questions',
  'Full adaptive study plans',
  'Personalized multi-unit exams',
  'Advanced error tracking',
  'Focus Mode for exams',
  'Priority AI tutor access',
];

export default function UpgradeModal({ open, onOpenChange }) {
  const handleUpgrade = () => {
    // TODO: Integrate with payment system
    alert('Payment integration coming soon! This will redirect to checkout.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center" style={{ color: 'var(--color-text-primary)' }}>
            Unlock Your Full Potential
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {/* Free Plan */}
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>Free</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>Get started with essential tools</p>
            <div className="space-y-2 mb-6">
              {FREE_FEATURES.map((feature, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5" style={{ color: 'var(--color-text-secondary)' }} />
                  <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{feature}</span>
                </div>
              ))}
            </div>
            <p className="font-bold text-2xl" style={{ color: 'var(--color-text-primary)' }}>$0</p>
          </div>

          {/* Pro Plan */}
          <div className="rounded-xl p-6 border-2 relative overflow-hidden" style={{ borderColor: 'var(--color-accent-primary)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05))' }}>
            <div className="absolute top-0 right-0 px-3 py-1 text-xs font-semibold text-white rounded-bl-lg" style={{ backgroundColor: 'var(--color-accent-secondary)' }}>
              POPULAR
            </div>
            <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>Pro</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>Study smarter with unlimited access</p>
            <div className="space-y-2 mb-6">
              {PRO_FEATURES.map((feature, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5" style={{ color: 'var(--color-accent-primary)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{feature}</span>
                </div>
              ))}
            </div>
            <div className="mb-4">
              <p className="font-bold text-2xl" style={{ color: 'var(--color-text-primary)' }}>
                $9.99<span className="text-sm font-normal" style={{ color: 'var(--color-text-secondary)' }}>/month</span>
              </p>
            </div>
            <Button 
              onClick={handleUpgrade}
              className="w-full h-12 text-base font-semibold"
              style={{ backgroundColor: 'var(--color-accent-primary)' }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>
          </div>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--color-text-secondary)' }}>
          Cancel anytime. Student-friendly pricing.
        </p>
      </DialogContent>
    </Dialog>
  );
}