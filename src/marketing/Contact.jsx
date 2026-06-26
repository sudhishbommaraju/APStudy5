import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, Check, MessageSquare, Sparkles, Twitter, Github } from 'lucide-react';
import MarketingLayout from './MarketingLayout';
import { Reveal, SERIF } from './MarketingBits';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid = form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.message.trim();

  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    setSent(true);
  };

  return (
    <MarketingLayout>
      <section className="relative px-6 pb-8 pt-40 text-center">
        <Reveal>
          <p className="mb-4 text-xs uppercase tracking-widest text-white/40">Contact</p>
          <h1 className="mx-auto max-w-3xl text-5xl leading-[1] tracking-[-1.5px] text-white sm:text-7xl" style={SERIF}>
            Let's <em className="not-italic text-white/55">talk.</em>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-white/65">
            Questions, feedback, or a feature you wish existed? We read everything.
          </p>
        </Reveal>
      </section>

      <section className="relative z-10 px-6 py-12">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Form */}
          <Reveal>
            <div className="liquid-glass liquid-glass-strong rounded-3xl p-8">
              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-[hsl(201,100%,13%)]">
                      <Check className="h-8 w-8" />
                    </div>
                    <h3 className="mt-5 text-3xl text-white" style={SERIF}>
                      Message sent
                    </h3>
                    <p className="mt-2 max-w-sm text-sm text-white/60">
                      Thanks, {form.name.split(' ')[0] || 'friend'} — we'll be in touch soon. In the
                      meantime, your study kit is waiting.
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={submit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="text-sm text-white/70">Name</label>
                      <input
                        value={form.name}
                        onChange={update('name')}
                        placeholder="Ada Lovelace"
                        className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none transition-colors focus:border-white/40"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/70">Email</label>
                      <input
                        value={form.email}
                        onChange={update('email')}
                        placeholder="you@school.edu"
                        className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none transition-colors focus:border-white/40"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/70">Message</label>
                      <textarea
                        value={form.message}
                        onChange={update('message')}
                        rows={5}
                        placeholder="Tell us what's on your mind…"
                        className="mt-2 w-full resize-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none transition-colors focus:border-white/40"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!valid}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-[hsl(201,100%,13%)] transition-transform hover:scale-[1.01] disabled:opacity-40"
                    >
                      <Send className="h-4 w-4" /> Send message
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </Reveal>

          {/* Side info */}
          <Reveal delay={0.1}>
            <div className="space-y-4">
              <div className="liquid-glass rounded-3xl p-6">
                <Mail className="h-5 w-5 text-white/70" />
                <p className="mt-3 text-sm text-white/50">Email us</p>
                <a href="mailto:hello@proofly.app" className="text-lg text-white hover:underline">
                  hello@proofly.app
                </a>
              </div>
              <div className="liquid-glass rounded-3xl p-6">
                <MessageSquare className="h-5 w-5 text-white/70" />
                <p className="mt-3 text-sm text-white/50">Prefer to just start?</p>
                <a href="/Dashboard" className="text-lg text-white hover:underline">
                  Open the app →
                </a>
              </div>
              <div className="liquid-glass rounded-3xl p-6">
                <Sparkles className="h-5 w-5 text-white/70" />
                <p className="mt-3 text-sm text-white/50">Follow along</p>
                <div className="mt-3 flex gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
                    <Twitter className="h-4 w-4" />
                  </span>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
                    <Github className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </MarketingLayout>
  );
}
