import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowRight, TrendingUp, Target, BarChart3 } from 'lucide-react';

const satData = [
  { week: 'Week 0', score: 1180, label: 'Diagnostic' },
  { week: 'Week 1', score: 1220 },
  { week: 'Week 2', score: 1260 },
  { week: 'Week 3', score: 1300 },
  { week: 'Week 4', score: 1340 },
  { week: 'Week 5', score: 1370 },
  { week: 'Week 6', score: 1380, label: 'Projected' }
];

const actData = [
  { week: 'Week 0', score: 23, label: 'Diagnostic' },
  { week: 'Week 1', score: 25 },
  { week: 'Week 2', score: 26 },
  { week: 'Week 3', score: 27 },
  { week: 'Week 4', score: 28 },
  { week: 'Week 5', score: 29 },
  { week: 'Week 6', score: 30, label: 'Projected' }
];

const apData = [
  { week: 'Week 0', score: 42, label: '42% Prob. 4+' },
  { week: 'Week 1', score: 51 },
  { week: 'Week 2', score: 59 },
  { week: 'Week 3', score: 66 },
  { week: 'Week 4', score: 73 },
  { week: 'Week 5', score: 78 },
  { week: 'Week 6', score: 81, label: '81% Prob. 4+' }
];

function PerformanceEngine() {
  const [activeTest, setActiveTest] = useState('SAT');
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      setTimeout(() => setIsVisible(true), 300);
    }
  }, [inView]);

  const currentData = activeTest === 'SAT' ? satData : activeTest === 'ACT' ? actData : apData;
  const maxScore = activeTest === 'SAT' ? 1600 : activeTest === 'ACT' ? 36 : 100;

  const stats = {
    SAT: [
      { label: 'Reading Accuracy', value: '+19%' },
      { label: 'Math Accuracy', value: '+14%' },
      { label: 'Timing Efficiency', value: '+22%' }
    ],
    ACT: [
      { label: 'English', value: '+4' },
      { label: 'Math', value: '+5' },
      { label: 'Reading', value: '+3' }
    ],
    AP: [
      { label: 'Unit Mastery', value: '+38%' },
      { label: 'FRQ Accuracy', value: '+29%' },
      { label: 'Timing Control', value: '+31%' }
    ]
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      className="relative"
    >
      <div className="bg-[#0C0C0C]/80 backdrop-blur-xl border border-[#2A2A2A] rounded-2xl p-8 shadow-2xl">
        {/* Toggle Tabs */}
        <div className="flex gap-1 mb-8 bg-[#171717] rounded-lg p-1">
          {['SAT', 'ACT', 'AP'].map((test) => (
            <button
              key={test}
              onClick={() => setActiveTest(test)}
              className={`flex-1 py-3 rounded-md text-sm font-semibold transition-all duration-300 ${
                activeTest === test
                  ? 'bg-[#D6B98C] text-[#0C0C0C]'
                  : 'text-[#8A8A8A] hover:text-[#F5F5F5]'
              }`}
            >
              {test}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="h-64 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={currentData}>
              <XAxis
                dataKey="week"
                stroke="#4A4A4A"
                style={{ fontSize: '12px' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, maxScore]}
                stroke="#4A4A4A"
                style={{ fontSize: '12px' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#171717',
                  border: '1px solid #2A2A2A',
                  borderRadius: '8px',
                  color: '#F5F5F5'
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#D6B98C"
                strokeWidth={3}
                dot={{ fill: '#D6B98C', r: 6 }}
                animationDuration={2000}
                animationBegin={isVisible ? 0 : 10000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {stats[activeTest].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 + 0.5 }}
              className="text-center"
            >
              <div className="text-2xl font-bold text-[#D6B98C] mb-1">{stat.value}</div>
              <div className="text-xs text-[#8A8A8A]">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ScrollNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0C0C0C]/80 backdrop-blur-xl border-b border-[#2A2A2A]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to={createPageUrl('Home')} className="text-2xl font-bold text-[#F5F5F5]">
          PROOFLY
        </Link>

        <div className="flex items-center gap-8">
          <a href="#about" className="text-sm text-[#B5B5B5] hover:text-[#F5F5F5] transition-colors relative group">
            About
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#D6B98C] transition-all group-hover:w-full" />
          </a>
          <a href="#features" className="text-sm text-[#B5B5B5] hover:text-[#F5F5F5] transition-colors relative group">
            Explore Features
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#D6B98C] transition-all group-hover:w-full" />
          </a>
          <Link to={createPageUrl('Dashboard')}>
            <Button className="bg-[#D6B98C] hover:bg-[#C9A96A] text-[#0C0C0C] font-semibold">
              Start Diagnostic
            </Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

export default function Home() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div className="min-h-screen bg-[#0C0C0C] text-[#F5F5F5] overflow-hidden">
      <ScrollNavbar />

      {/* HERO SECTION */}
      <motion.section
        style={{ y: heroY }}
        className="min-h-screen flex items-center justify-center px-6 pt-20"
      >
        <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              WELCOME TO<br />PROOFLY
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-2xl text-[#B5B5B5] mb-8"
            >
              Your test performance, engineered.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-6"
            >
              <Link to={createPageUrl('Dashboard')}>
                <Button
                  size="lg"
                  className="bg-[#D6B98C] hover:bg-[#C9A96A] text-[#0C0C0C] font-semibold text-lg px-8 py-6 hover:scale-105 transition-transform"
                >
                  Start Your Diagnostic
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[#2A2A2A] text-[#F5F5F5] hover:bg-[#1E1E1E] text-lg px-8 py-6"
                >
                  Explore Features
                </Button>
              </a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-sm text-[#8A8A8A]"
            >
              Built as a nonprofit. Focused on access, not profit.
            </motion.p>
          </div>

          <div>
            <PerformanceEngine />
          </div>
        </div>
      </motion.section>

      {/* THE PROBLEM */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold mb-16"
          >
            Most students practice without measurement.
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { text: 'No baseline.' },
              { text: 'No precision.' },
              { text: 'No projection.' }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="text-2xl font-semibold text-[#8A8A8A]"
              >
                {item.text}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW THE ENGINE WORKS */}
      <section id="features" className="py-32 px-6 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-20"
          >
            How the Engine Works
          </motion.h2>

          <div className="space-y-8">
            {[
              { num: '1', title: 'Diagnostic Baseline', desc: 'Measure current performance across all sections' },
              { num: '2', title: 'Weakness Mapping', desc: 'Identify precise skill gaps and timing inefficiencies' },
              { num: '3', title: 'Targeted Drills', desc: 'Practice questions calibrated to your weak points' },
              { num: '4', title: 'Timed Simulation', desc: 'Full-length exams under real conditions' },
              { num: '5', title: 'Projection Update', desc: 'Track improvement and recalculate score trajectory' }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ x: 10 }}
                className="flex items-center gap-6 p-6 bg-[#0C0C0C]/50 border border-[#2A2A2A] rounded-xl hover:border-[#D6B98C]/30 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-[#D6B98C]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-[#D6B98C]">{step.num}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-[#8A8A8A]">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BUILT FOR REAL EXAMS */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-20"
          >
            Built for Real Exams
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'SAT',
                icon: <TrendingUp className="w-8 h-8" />,
                features: [
                  '1600 scale tracking',
                  'Section-level analytics',
                  'Timing efficiency modeling'
                ]
              },
              {
                title: 'ACT',
                icon: <BarChart3 className="w-8 h-8" />,
                features: [
                  'Composite + subscore modeling',
                  '36-scale adaptive tracking',
                  'Science reasoning analysis'
                ]
              },
              {
                title: 'AP',
                icon: <Target className="w-8 h-8" />,
                features: [
                  '1–5 readiness modeling',
                  'Unit-weighted mastery mapping',
                  'FRQ timing calibration'
                ]
              }
            ].map((exam, i) => (
              <motion.div
                key={exam.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                whileHover={{ y: -5 }}
                className="bg-[#0C0C0C]/80 backdrop-blur-xl border border-[#2A2A2A] rounded-xl p-8 hover:border-[#D6B98C]/50 hover:shadow-2xl hover:shadow-[#D6B98C]/10 transition-all"
              >
                <div className="text-[#D6B98C] mb-4">{exam.icon}</div>
                <h3 className="text-2xl font-bold mb-6">{exam.title}</h3>
                <ul className="space-y-3">
                  {exam.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-[#B5B5B5]">
                      <span className="text-[#D6B98C] mt-1">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT + MISSION */}
      <section id="about" className="py-32 px-6 bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-12"
          >
            Why Proofly Exists
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6 text-lg text-[#B5B5B5] leading-relaxed"
          >
            <p className="text-xl text-[#F5F5F5] font-semibold">
              Most test prep is built for the top 10%.<br />
              Proofly was built for the other 90%.
            </p>

            <p>
              The founder and lead developer struggled academically — not from lack of effort, but from lack of precise feedback. Studying felt random. Improvement felt unpredictable.
            </p>

            <p>
              Proofly was built to solve that problem:
            </p>

            <div className="grid md:grid-cols-3 gap-8 pt-8">
              {[
                'Measure performance.',
                'Identify weaknesses.',
                'Engineer improvement.'
              ].map((text, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center p-6 bg-[#0C0C0C]/50 border border-[#2A2A2A] rounded-xl"
                >
                  <div className="text-xl font-semibold text-[#D6B98C]">{text}</div>
                </motion.div>
              ))}
            </div>

            <ul className="space-y-3 pt-8">
              <li className="flex items-start gap-3">
                <span className="text-[#D6B98C]">•</span>
                <span>Built around real exam skill frameworks</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#D6B98C]">•</span>
                <span>Designed by someone who needed it</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#D6B98C]">•</span>
                <span>Developed as a nonprofit to maximize access</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl font-bold mb-12"
          >
            Ready to measure your performance?
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to={createPageUrl('Dashboard')}>
              <Button
                size="lg"
                className="bg-[#D6B98C] hover:bg-[#C9A96A] text-[#0C0C0C] font-semibold text-lg px-10 py-7 hover:scale-105 transition-transform"
              >
                Start Your Diagnostic
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#features">
              <Button
                size="lg"
                variant="outline"
                className="border-[#2A2A2A] text-[#F5F5F5] hover:bg-[#1E1E1E] text-lg px-10 py-7"
              >
                Explore Features
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2A2A2A] py-12 px-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-[#8A8A8A]">
          <p>© 2026 Proofly. A nonprofit organization.</p>
          <p className="mt-2">Built to increase access to measurable, high-quality exam preparation.</p>
        </div>
      </footer>
    </div>
  );
}