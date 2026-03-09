import React, { useState, useEffect } from 'react';
import { X, Cookie, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COOKIE_CONSENT_KEY = 'proofly_cookie_consent';
const COOKIE_CONSENT_VERSION = '1.0';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState({ analytics: true, preferences: true });

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      // Small delay so banner doesn't flash on first paint
      setTimeout(() => setVisible(true), 1200);
    } else {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.version !== COOKIE_CONSENT_VERSION) {
          // Policy updated — re-ask
          setTimeout(() => setVisible(true), 1200);
        }
      } catch {
        setTimeout(() => setVisible(true), 1200);
      }
    }
  }, []);

  function saveConsent(analytics, preferences) {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      version: COOKIE_CONSENT_VERSION,
      accepted_at: new Date().toISOString(),
      analytics,
      preferences,
      essential: true
    }));
    setVisible(false);
  }

  function acceptAll() { saveConsent(true, true); }
  function rejectNonEssential() { saveConsent(false, false); }
  function saveCustom() { saveConsent(prefs.analytics, prefs.preferences); }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-[#171717] border border-neutral-700 rounded-2xl shadow-2xl p-6">
        <div className="flex items-start gap-4">
          <Cookie className="w-5 h-5 text-[#D6B98C] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-white font-medium mb-1">Cookie Preferences</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              We use cookies to keep you logged in and to understand how you use Proofly.{' '}
              <span className="text-neutral-300">Essential cookies</span> are always on.{' '}
              You can choose whether to allow analytics and preference cookies.
            </p>

            {/* Expandable details */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 mt-2 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Manage preferences
            </button>

            {expanded && (
              <div className="mt-4 space-y-3 border-t border-neutral-800 pt-4">
                {/* Essential — always on */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">Essential Cookies</p>
                    <p className="text-xs text-neutral-500">Login sessions, security tokens. Required.</p>
                  </div>
                  <div className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded">Always On</div>
                </div>

                {/* Analytics */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">Analytics Cookies</p>
                    <p className="text-xs text-neutral-500">Helps us understand how the platform is used.</p>
                  </div>
                  <button
                    onClick={() => setPrefs(p => ({ ...p, analytics: !p.analytics }))}
                    className={`w-10 h-5 rounded-full transition-colors relative ${prefs.analytics ? 'bg-blue-600' : 'bg-neutral-700'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${prefs.analytics ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                {/* Preferences */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">Preference Cookies</p>
                    <p className="text-xs text-neutral-500">Remembers your settings and choices.</p>
                  </div>
                  <button
                    onClick={() => setPrefs(p => ({ ...p, preferences: !p.preferences }))}
                    className={`w-10 h-5 rounded-full transition-colors relative ${prefs.preferences ? 'bg-blue-600' : 'bg-neutral-700'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${prefs.preferences ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={rejectNonEssential} className="text-xs border-neutral-700 text-neutral-300">
              Reject Optional
            </Button>
            {expanded && (
              <Button size="sm" variant="outline" onClick={saveCustom} className="text-xs border-neutral-700 text-neutral-300">
                Save Choices
              </Button>
            )}
            <Button size="sm" onClick={acceptAll} className="text-xs bg-[#D6B98C] text-black hover:bg-[#C9A96A]">
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}