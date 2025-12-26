import React from 'react';
import { base44 } from '@/api/base44Client';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StripeCheckout from '@/components/monetization/StripeCheckout';
import GalaxyBackground from '@/components/effects/GalaxyBackground';
import CursorGlow from '@/components/effects/CursorGlow';

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
  'AI-generated notes & flashcards',
  'Detailed progress analytics',
];

export default function Pricing() {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const currentUser = await base44.auth.me();
          setUser(currentUser);
        }
      } catch (e) {
        // Not authenticated
      }
    };
    loadUser();
  }, []);

  const handleGetStarted = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <div className="galaxy-page">
      <GalaxyBackground />
      <CursorGlow />
      <div className="galaxy-content">
      {/* Page Header */}
      <div className="page-header text-center">
        <h1 className="page-title">Pricing Coming Soon</h1>
        <p className="page-description max-w-2xl mx-auto">
          All users currently have Pro access! Enjoy unlimited practice, exams, notes, flashcards, and more.
        </p>
      </div>

      {/* Temporary Pro Access Notice */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-violet-500/20 to-indigo-500/20 backdrop-blur-sm rounded-2xl border-2 border-violet-500/50 p-8 shadow-lg text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-violet-400" />
          <h3 className="text-2xl font-bold text-slate-100 mb-3">You Have Pro Access!</h3>
          <p className="text-slate-200 mb-6">
            While we finalize our pricing plans, all users have full access to Pro features.
          </p>
          <div className="space-y-2 mb-6">
            {PRO_FEATURES.map((feature, i) => (
              <div key={i} className="flex items-start gap-3 justify-center">
                <Check className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-100">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden Pricing Cards for Future */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto hidden">
        {/* Free Plan */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-slate-100 mb-2">Free</h3>
          <p className="text-slate-300 mb-6">Get started with essential tools</p>
          
          <div className="mb-6">
            <p className="text-4xl font-bold text-slate-100">$0</p>
          </div>

          <div className="space-y-3 mb-8">
            {FREE_FEATURES.map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">{feature}</span>
              </div>
            ))}
          </div>

          {!user && (
            <Button onClick={handleGetStarted} variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700/50">
              Get started
            </Button>
          )}
        </div>

        {/* Pro Plan */}
        <div className="bg-gradient-to-br from-violet-500/20 to-indigo-500/20 backdrop-blur-sm rounded-2xl border-2 border-violet-500/50 p-8 shadow-lg relative">
          <div className="absolute top-0 right-0 bg-violet-600 text-white px-4 py-1 text-sm font-semibold rounded-tr-2xl rounded-bl-lg">
            POPULAR
          </div>
          
          <h3 className="text-2xl font-bold text-slate-100 mb-2">Pro</h3>
          <p className="text-slate-200 mb-6">Study smarter with unlimited access</p>
          
          <div className="mb-6">
            <p className="text-4xl font-bold text-slate-100">
              $5.99<span className="text-lg font-normal text-slate-300">/month</span>
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {PRO_FEATURES.map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-100 font-medium">{feature}</span>
              </div>
            ))}
          </div>

          {user ? (
            user.plan === 'pro' ? (
              <Button disabled className="w-full bg-slate-600">
                Current Plan
              </Button>
            ) : (
              <StripeCheckout user={user} onSuccess={() => window.location.reload()} />
            )
          ) : (
            <Button onClick={handleGetStarted} className="w-full bg-violet-600 hover:bg-violet-700">
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>
          )}
        </div>
      </div>

      {/* FAQ or Additional Info */}
      <div className="mt-16 text-center">
        <p className="text-slate-400">
          Cancel anytime. Student-friendly pricing. Questions? <a href="mailto:partnerships@proofly.com" className="text-violet-400 hover:underline">Contact us</a>
        </p>
      </div>
      </div>
    </div>
  );
}