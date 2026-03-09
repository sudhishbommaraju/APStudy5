import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LegalFooter() {
  return (
    <footer className="border-t border-neutral-800 bg-[#0C0C0C] py-8 px-6 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-neutral-600">
          © {new Date().getFullYear()} Proofly. All rights reserved.
        </p>
        <div className="flex flex-wrap gap-5 text-xs text-neutral-500">
          <Link to={createPageUrl('TermsOfService')} className="hover:text-neutral-300 transition-colors">
            Terms of Service
          </Link>
          <Link to={createPageUrl('PrivacyPolicy')} className="hover:text-neutral-300 transition-colors">
            Privacy Policy
          </Link>
          <span className="text-neutral-700">v1.0</span>
        </div>
      </div>
    </footer>
  );
}