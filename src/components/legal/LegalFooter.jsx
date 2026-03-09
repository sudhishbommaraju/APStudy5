import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ExternalLink, LogOut } from 'lucide-react';

export default function LegalFooter() {
  return (
    <footer className="border-t border-neutral-800 bg-[#0C0C0C] mt-auto" role="contentinfo">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Section 1 — Branding */}
          <div className="lg:col-span-2">
            <span className="text-white font-semibold text-lg tracking-tight block mb-3">Proofly</span>
            <p className="text-neutral-500 text-sm leading-relaxed max-w-xs">
              AI powered study platform for AP, SAT, and ACT success.
            </p>
            <a
              href="https://www.google.com"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-lg border border-neutral-700 text-neutral-400 text-xs hover:border-neutral-500 hover:text-white transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-400"
              aria-label="Leave Proofly and go to Google"
            >
              <LogOut className="w-3.5 h-3.5" />
              Leave Site
            </a>
          </div>

          {/* Section 2 — Product */}
          <div>
            <h3 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">Product</h3>
            <ul className="space-y-3">
              {[
                { label: 'Home', to: createPageUrl('Home') },
                { label: 'Pricing', to: createPageUrl('Pricing') },
                { label: 'About', to: createPageUrl('About') },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-neutral-500 text-sm hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-400 rounded">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3 — Legal */}
          <div>
            <h3 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-500 text-sm hover:text-white transition-colors inline-flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-400 rounded"
                >
                  Terms of Service <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-500 text-sm hover:text-white transition-colors inline-flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-400 rounded"
                >
                  Privacy Policy <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </li>
            </ul>
          </div>

          {/* Section 4 — Support */}
          <div>
            <h3 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <a href="mailto:support@proofly.com" className="text-neutral-500 text-sm hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-400 rounded">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-500 text-sm hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-400 rounded">
                  Help Center
                </a>
              </li>
              <li>
                <a href="mailto:support@proofly.com?subject=Problem Report" className="text-neutral-500 text-sm hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-400 rounded">
                  Report a Problem
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="border-t border-neutral-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-neutral-600 text-xs">© {new Date().getFullYear()} Proofly. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-neutral-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-400 rounded">
              Terms
            </a>
            <span className="text-neutral-800">·</span>
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-neutral-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-400 rounded">
              Privacy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}