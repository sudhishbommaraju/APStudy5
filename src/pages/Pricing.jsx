import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle2, X, Crown, Zap, ChevronLeft } from 'lucide-react';
import UpgradeModal from '@/components/monetization/UpgradeModal';
import StripeCheckout from '@/components/monetization/StripeCheckout';

export default function Pricing() {
  const [user, setUser] = useState(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const handleUpgradeSuccess = () => {
    window.location.reload();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #e8f1f8, #d9e9f5)', fontFamily: 'Georgia, serif' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Choose Your Plan</h1>
            <p className="text-slate-500">Unlock your full learning potential</p>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <div className="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-2xl font-bold text-slate-900">Free</h4>
              <div className="text-3xl font-bold text-slate-900">$0</div>
            </div>
            <p className="text-slate-600 text-sm mb-6">Perfect for getting started</p>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">5 practice exams per day</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">3 custom timed exams per day</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">5 AI tutor questions per day</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">5 note sets per day</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">Flashcards</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">Progress tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">Generate from notes/videos</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">All core features</span>
              </li>
            </ul>

            {user?.plan === 'free' ? (
              <div className="text-center py-3 text-sm text-slate-500 font-medium border-2 border-slate-200 rounded-lg">
                Current Plan
              </div>
            ) : (
              <Button variant="outline" className="w-full" disabled>
                Current: Pro Plan
              </Button>
            )}
          </div>

          {/* Pro Plan */}
          <div className="bg-white border-2 border-purple-500 rounded-xl p-6 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-lg">
              POPULAR
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h4 className="text-2xl font-bold text-slate-900">Pro</h4>
                <Crown className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">$5.99</div>
                <div className="text-xs text-slate-500">/month</div>
              </div>
            </div>
            <p className="text-slate-600 text-sm mb-6">Unlock your full potential</p>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 font-medium">Unlimited practice exams</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 font-medium">Unlimited custom timed exams</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 font-medium">Unlimited AI tutor questions</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 font-medium">Unlimited note generation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 font-medium">Unlimited flashcards</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 font-medium">Advanced analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 font-medium">Priority support</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 font-medium">Export study materials</span>
              </li>
            </ul>

            {user?.plan === 'free' ? (
              <StripeCheckout user={user} onSuccess={handleUpgradeSuccess} />
            ) : (
              <div className="text-center py-3 text-sm text-purple-600 font-medium border-2 border-purple-200 rounded-lg bg-purple-50">
                Current Plan
              </div>
            )}
          </div>
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Why upgrade to Pro?</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-slate-600">
            <div>
              <p className="font-medium text-slate-900 mb-1">🎯 Unlimited Practice</p>
              <p>Generate as many questions as you need to master every topic</p>
            </div>
            <div>
              <p className="font-medium text-slate-900 mb-1">🤖 AI Tutor</p>
              <p>Get instant help and explanations whenever you're stuck</p>
            </div>
            <div>
              <p className="font-medium text-slate-900 mb-1">📝 Custom Materials</p>
              <p>Turn your own notes and videos into practice questions</p>
            </div>
            <div>
              <p className="font-medium text-slate-900 mb-1">📊 Advanced Insights</p>
              <p>Track your progress with detailed analytics and recommendations</p>
            </div>
          </div>
        </div>
      </div>

      <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
    </div>
  );
}