import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import LegalFooter from '@/components/legal/LegalFooter';

const EFFECTIVE_DATE = 'March 1, 2026';
const VERSION = '1.0';

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0C0C0C]">
      {/* Top nav */}
      <nav className="border-b border-neutral-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-white font-semibold text-base tracking-tight">Proofly</Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-400 rounded"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 py-16 px-6">
        <div className="max-w-[900px] mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <Lock className="w-5 h-5 text-[#D6B98C]" />
            <span className="text-xs text-neutral-500 uppercase tracking-wider font-medium">
              Version {VERSION} · Effective {EFFECTIVE_DATE}
            </span>
          </div>
          <h1 className="text-4xl font-light text-white mb-3">Privacy Policy</h1>
          <p className="text-neutral-400 text-base leading-relaxed mb-12 max-w-2xl">
            This policy explains how Proofly collects, uses, and protects your personal data. Please read it carefully.
          </p>

          <div className="space-y-10 text-neutral-300">

            <Section title="1. Who We Are">
              <P>Proofly ("we," "us," "our") operates the Proofly platform at proofly.com. For data protection purposes, Proofly is the data controller for personal data collected through the Service.</P>
            </Section>

            <Section title="2. Data We Collect">
              <P>We collect only what is necessary to operate the Service:</P>
              <Subsection title="Account Data">
                <P>Name, email address, and account credentials provided during registration.</P>
              </Subsection>
              <Subsection title="Usage Data">
                <P>How you interact with the platform: pages visited, features used, practice session data, scores, and study activity. This is used to improve the Service and provide personalized features.</P>
              </Subsection>
              <Subsection title="Device & Technical Data">
                <P>Browser type, operating system, and device type for security and compatibility purposes.</P>
              </Subsection>
              <Subsection title="Customer-Submitted Content">
                <P>Practice responses, notes, flashcards, and other content you create on the platform.</P>
              </Subsection>
              <Subsection title="Consent Records">
                <P>Timestamps and versions of Terms of Service and Privacy Policy you have accepted.</P>
              </Subsection>
              <Subsection title="Billing Data">
                <P>Billing is handled entirely by Stripe. We do not store payment card numbers, bank account details, or other sensitive financial data.</P>
              </Subsection>
              <P className="font-medium text-white mt-4">We do NOT collect or store:</P>
              <ul className="list-disc pl-6 space-y-1.5 text-neutral-400 text-sm leading-relaxed">
                <li>Full payment card numbers or financial account credentials</li>
                <li>Government-issued ID numbers</li>
                <li>Biometric data</li>
                <li>Precise geolocation data</li>
                <li>Health or medical data</li>
                <li>Personal data from users known to be under 13</li>
              </ul>
            </Section>

            <Section title="3. How We Use Your Data">
              <ul className="list-disc pl-6 space-y-1.5 text-neutral-400 text-sm leading-relaxed">
                <li>To create and manage your account</li>
                <li>To provide, operate, and improve the Service</li>
                <li>To personalize your study experience and recommendations</li>
                <li>To process payments (via Stripe)</li>
                <li>To communicate service updates, security notices, and support responses</li>
                <li>To detect and prevent fraud, abuse, and unauthorized access</li>
                <li>To comply with legal obligations</li>
              </ul>
              <P>We do not sell your personal data to third parties.</P>
            </Section>

            <Section title="4. Legal Basis for Processing (GDPR)">
              <P>For users in the EU/EEA, we process your data on the following legal bases:</P>
              <ul className="list-disc pl-6 space-y-1.5 text-neutral-400 text-sm leading-relaxed">
                <li><strong className="text-neutral-300">Contract:</strong> Processing necessary to perform our contract with you</li>
                <li><strong className="text-neutral-300">Consent:</strong> Where you have explicitly consented (e.g., marketing communications)</li>
                <li><strong className="text-neutral-300">Legitimate Interests:</strong> Analytics and security improvements</li>
                <li><strong className="text-neutral-300">Legal Obligation:</strong> Compliance with applicable laws</li>
              </ul>
            </Section>

            <Section title="5. Cookies">
              <P>We use cookies and similar technologies for authentication, security, and analytics. You can manage your cookie preferences through the cookie banner on our site.</P>
              <ul className="list-disc pl-6 space-y-1.5 text-neutral-400 text-sm leading-relaxed">
                <li><strong className="text-neutral-300">Essential cookies:</strong> Required for authentication and security. Cannot be disabled.</li>
                <li><strong className="text-neutral-300">Analytics cookies:</strong> Help us understand usage patterns. You can opt out.</li>
                <li><strong className="text-neutral-300">Preference cookies:</strong> Remember your settings. Optional.</li>
              </ul>
            </Section>

            <Section title="6. Third-Party Services">
              <ul className="list-disc pl-6 space-y-1.5 text-neutral-400 text-sm leading-relaxed">
                <li><strong className="text-neutral-300">Hosting & Infrastructure:</strong> Base44 (platform infrastructure)</li>
                <li><strong className="text-neutral-300">Payment Processing:</strong> Stripe — governed by Stripe's Privacy Policy</li>
                <li><strong className="text-neutral-300">AI Services:</strong> Used to generate study content — no personally identifiable data is included in AI prompts</li>
                <li><strong className="text-neutral-300">Email Delivery:</strong> For transactional emails</li>
              </ul>
              <P>We do not transmit sensitive personal data to third parties unnecessarily.</P>
            </Section>

            <Section title="7. Data Retention">
              <P>We retain your personal data for as long as your account is active. When you delete your account, we will remove your personal data within 30 days, except where retention is required by law (e.g., financial records — typically 7 years). Audit logs may be anonymized rather than deleted to preserve system integrity.</P>
            </Section>

            <Section title="8. Your Rights">
              <P>You have the following rights over your personal data:</P>
              <ul className="list-disc pl-6 space-y-1.5 text-neutral-400 text-sm leading-relaxed">
                <li><strong className="text-neutral-300">Access:</strong> Request a copy of your personal data</li>
                <li><strong className="text-neutral-300">Correction:</strong> Request correction of inaccurate data</li>
                <li><strong className="text-neutral-300">Deletion:</strong> Request deletion of your account and personal data</li>
                <li><strong className="text-neutral-300">Portability:</strong> Request your data in a machine-readable format</li>
                <li><strong className="text-neutral-300">Opt-out:</strong> Opt out of marketing communications at any time</li>
                <li><strong className="text-neutral-300">Withdraw Consent:</strong> Withdraw consent at any time where processing is consent-based</li>
              </ul>
              <P>To exercise your rights, go to your Account Settings or contact us at <a href="mailto:privacy@proofly.com" className="text-[#D6B98C] hover:underline">privacy@proofly.com</a>.</P>
            </Section>

            <Section title="9. Children's Privacy">
              <P>The Service is not directed to children under 13. We do not knowingly collect personal data from children under 13. If we become aware that a user is under 13, we will delete their account and associated data immediately. Contact us at <a href="mailto:privacy@proofly.com" className="text-[#D6B98C] hover:underline">privacy@proofly.com</a> if you believe a child under 13 has registered.</P>
            </Section>

            <Section title="10. Security">
              <P>We implement industry-standard security measures including encrypted data transmission (HTTPS), hashed credentials, role-based access controls, audit logging, and regular security reviews. No system is 100% secure — please use a strong, unique password and protect your account credentials.</P>
            </Section>

            <Section title="11. Policy Updates">
              <P>We may update this Privacy Policy. When we make material changes, we will notify you in-app and require re-acceptance before continued use. The version and effective date are shown at the top of this page.</P>
            </Section>

            <Section title="12. Contact">
              <P>For privacy-related questions or to exercise your rights:</P>
              <P><a href="mailto:privacy@proofly.com" className="text-[#D6B98C] hover:underline">privacy@proofly.com</a></P>
            </Section>

          </div>

          {/* Bottom links */}
          <div className="mt-16 pt-8 border-t border-neutral-800 flex flex-wrap gap-6 text-sm text-neutral-500">
            <a href="/terms" className="hover:text-neutral-300 transition-colors">Terms of Service</a>
            <Link to="/" className="hover:text-neutral-300 transition-colors">Home</Link>
          </div>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-neutral-800">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Subsection({ title, children }) {
  return (
    <div className="pl-4 border-l-2 border-neutral-800 py-1">
      <h3 className="text-sm font-semibold text-neutral-200 mb-1">{title}</h3>
      {children}
    </div>
  );
}

function P({ children, className = '' }) {
  return <p className={`text-neutral-400 text-sm leading-relaxed ${className}`}>{children}</p>;
}