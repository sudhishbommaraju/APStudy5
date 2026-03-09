import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Lock } from 'lucide-react';

const CURRENT_VERSION = '1.0';
const EFFECTIVE_DATE = 'March 1, 2026';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0C0C0C] py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link to={createPageUrl('Home')} className="inline-flex items-center gap-2 text-neutral-400 hover:text-white text-sm mb-10 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-3">
          <Lock className="w-6 h-6 text-[#D6B98C]" />
          <span className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Version {CURRENT_VERSION} · Effective {EFFECTIVE_DATE}</span>
        </div>
        <h1 className="text-4xl font-light text-white mb-2">Privacy Policy</h1>
        <p className="text-neutral-400 mb-12">This policy explains how Proofly collects, uses, and protects your personal data.</p>

        <div className="prose prose-invert prose-neutral max-w-none space-y-10 text-neutral-300 leading-relaxed">

          <Section title="1. Who We Are">
            <p>Proofly ("we," "us," "our") operates the Proofly platform at proofly.com. For data protection purposes, Proofly is the data controller for personal data collected through the Service.</p>
          </Section>

          <Section title="2. Data We Collect">
            <p>We collect only what is necessary to operate the Service:</p>
            <Subsection title="Account Data">
              <p>Name, email address, and account credentials provided during registration.</p>
            </Subsection>
            <Subsection title="Usage Data">
              <p>How you interact with the platform: pages visited, features used, practice session data, scores, and study activity. This is used to improve the Service and provide personalized features.</p>
            </Subsection>
            <Subsection title="Device & Technical Data">
              <p>Browser type, operating system, and device type for security and compatibility purposes.</p>
            </Subsection>
            <Subsection title="Customer-Submitted Content">
              <p>Practice responses, notes, flashcards, and other content you create on the platform.</p>
            </Subsection>
            <Subsection title="Consent Records">
              <p>Timestamps and versions of Terms of Service and Privacy Policy you have accepted.</p>
            </Subsection>
            <Subsection title="Billing Data">
              <p>Billing is handled entirely by Stripe. We do not store payment card numbers, bank account details, or other sensitive financial data.</p>
            </Subsection>

            <p className="mt-4 font-medium text-white">We do NOT collect or store:</p>
            <ul className="list-disc pl-6 space-y-1 text-neutral-400">
              <li>Full payment card numbers or financial account credentials</li>
              <li>Government-issued ID numbers</li>
              <li>Biometric data</li>
              <li>Precise geolocation data</li>
              <li>Health or medical data</li>
              <li>Personal data from users known to be under 13</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Data">
            <ul className="list-disc pl-6 space-y-1 text-neutral-400">
              <li>To create and manage your account</li>
              <li>To provide, operate, and improve the Service</li>
              <li>To personalize your study experience and recommendations</li>
              <li>To process payments (via Stripe)</li>
              <li>To communicate service updates, security notices, and support responses</li>
              <li>To detect and prevent fraud, abuse, and unauthorized access</li>
              <li>To comply with legal obligations</li>
            </ul>
            <p>We do not sell your personal data to third parties.</p>
          </Section>

          <Section title="4. Legal Basis for Processing (GDPR)">
            <p>For users in the EU/EEA, we process your data on the following legal bases:</p>
            <ul className="list-disc pl-6 space-y-1 text-neutral-400">
              <li><strong className="text-neutral-300">Contract:</strong> Processing necessary to perform our contract with you (account creation, service delivery)</li>
              <li><strong className="text-neutral-300">Consent:</strong> Where you have explicitly consented (e.g., marketing communications)</li>
              <li><strong className="text-neutral-300">Legitimate Interests:</strong> Analytics and security improvements that do not override your rights</li>
              <li><strong className="text-neutral-300">Legal Obligation:</strong> Compliance with applicable laws</li>
            </ul>
          </Section>

          <Section title="5. Cookies">
            <p>We use cookies and similar technologies for authentication, security, and analytics. You can manage your cookie preferences through the cookie banner on our site.</p>
            <ul className="list-disc pl-6 space-y-1 text-neutral-400">
              <li><strong className="text-neutral-300">Essential cookies:</strong> Required for authentication and security. Cannot be disabled.</li>
              <li><strong className="text-neutral-300">Analytics cookies:</strong> Help us understand usage patterns. You can opt out.</li>
              <li><strong className="text-neutral-300">Preference cookies:</strong> Remember your settings. Optional.</li>
            </ul>
          </Section>

          <Section title="6. Third-Party Services">
            <p>We use the following categories of third-party services:</p>
            <ul className="list-disc pl-6 space-y-1 text-neutral-400">
              <li><strong className="text-neutral-300">Hosting & Infrastructure:</strong> Base44 (platform infrastructure)</li>
              <li><strong className="text-neutral-300">Payment Processing:</strong> Stripe — governed by Stripe's Privacy Policy</li>
              <li><strong className="text-neutral-300">AI Services:</strong> Used to generate study content — no personally identifiable data is included in AI prompts</li>
              <li><strong className="text-neutral-300">Email Delivery:</strong> For transactional emails</li>
            </ul>
            <p>We do not transmit sensitive personal data to third parties unnecessarily.</p>
          </Section>

          <Section title="7. Data Retention">
            <p>We retain your personal data for as long as your account is active. When you delete your account, we will remove your personal data within 30 days, except where retention is required by law (e.g., financial records for tax purposes — typically 7 years).</p>
            <p>Audit logs may be anonymized rather than deleted to preserve system integrity.</p>
          </Section>

          <Section title="8. Your Rights">
            <p>You have the following rights over your personal data:</p>
            <ul className="list-disc pl-6 space-y-1 text-neutral-400">
              <li><strong className="text-neutral-300">Access:</strong> Request a copy of your personal data</li>
              <li><strong className="text-neutral-300">Correction:</strong> Request correction of inaccurate data</li>
              <li><strong className="text-neutral-300">Deletion:</strong> Request deletion of your account and personal data</li>
              <li><strong className="text-neutral-300">Portability:</strong> Request your data in a machine-readable format</li>
              <li><strong className="text-neutral-300">Opt-out:</strong> Opt out of marketing communications at any time</li>
              <li><strong className="text-neutral-300">Withdraw Consent:</strong> Where processing is based on consent, withdraw it at any time</li>
            </ul>
            <p>To exercise your rights, go to your Account Settings or contact us at <span className="text-[#D6B98C]">privacy@proofly.com</span>.</p>
          </Section>

          <Section title="9. Children's Privacy">
            <p>The Service is not directed to children under 13. We do not knowingly collect personal data from children under 13. If we become aware that a user is under 13, we will delete their account and associated data immediately.</p>
            <p>If you believe a child under 13 has created an account, please contact us at <span className="text-[#D6B98C]">privacy@proofly.com</span>.</p>
          </Section>

          <Section title="10. Security">
            <p>We implement industry-standard security measures including encrypted data transmission (HTTPS), hashed credentials, role-based access controls, audit logging, and regular security reviews. However, no system is 100% secure. Please use a strong, unique password and protect your account credentials.</p>
          </Section>

          <Section title="11. Policy Updates">
            <p>We may update this Privacy Policy. When we make material changes, we will notify you in-app and require re-acceptance before continued use. The version and effective date are shown at the top of this page.</p>
          </Section>

          <Section title="12. Contact & Data Protection Officer">
            <p>For privacy-related questions or to exercise your rights, contact us:</p>
            <p className="text-[#D6B98C]">privacy@proofly.com</p>
          </Section>
        </div>

        <div className="mt-16 pt-8 border-t border-neutral-800 flex flex-wrap gap-6 text-sm text-neutral-500">
          <Link to={createPageUrl('TermsOfService')} className="hover:text-neutral-300 transition-colors">Terms of Service</Link>
          <Link to={createPageUrl('Home')} className="hover:text-neutral-300 transition-colors">Home</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Subsection({ title, children }) {
  return (
    <div className="pl-4 border-l-2 border-neutral-800">
      <h3 className="text-sm font-semibold text-neutral-200 mb-1">{title}</h3>
      {children}
    </div>
  );
}