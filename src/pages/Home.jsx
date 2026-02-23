import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowRight, TrendingUp, Target, BarChart3 } from 'lucide-react';

const satData = [
  { week: 'Week 0', score: 1180, label: 'Diagnostic: 1180' },
  { week: 'Week 1', score: 1220 },
  { week: 'Week 2', score: 1260 },
  { week: 'Week 3', score: 1300 },
  { week: 'Week 4', score: 1340 },
  { week: 'Week 5', score: 1370 },
  { week: 'Week 6', score: 1380, label: 'Projected: 1380' }
];

const actData = [
  { week: 'Week 0', score: 23, label: 'Diagnostic: 23' },
  { week: 'Week 1', score: 25 },
  { week: 'Week 2', score: 26 },
  { week: 'Week 3', score: 27 },
  { week: 'Week 4', score: 28 },
  { week: 'Week 5', score: 29 },
  { week: 'Week 6', score: 30, label: 'Projected: 30' }
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
  const minScore = activeTest === 'SAT' ? 400 : activeTest === 'ACT' ? 1 : 0;

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
      <div 
        className="rounded-2xl p-8 shadow-2xl"
        style={{
          background: 'rgba(23, 26, 33, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}
      >
        {/* Toggle Tabs */}
        <div className="flex gap-1 mb-8 p-1 rounded-lg" style={{ background: '#171A21' }}>
          {['SAT', 'ACT', 'AP'].map((test) => (
            <button
              key={test}
              onClick={() => setActiveTest(test)}
              className="flex-1 py-3 rounded-md text-sm font-semibold transition-all duration-300"
              style={{
                background: activeTest === test ? '#2F6DF6' : 'transparent',
                color: activeTest === test ? '#F3F4F6' : '#9CA3AF',
                border: activeTest === test ? 'none' : '1px solid rgba(255, 255, 255, 0.06)'
              }}
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
                stroke="rgba(255, 255, 255, 0.3)"
                style={{ fontSize: '11px', fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.05)' }}
              />
              <YAxis
                domain={[minScore, maxScore]}
                stroke="rgba(255, 255, 255, 0.3)"
                style={{ fontSize: '11px', fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.05)' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#171A21',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#2F6DF6"
                strokeWidth={2.5}
                dot={{ 
                  fill: '#2F6DF6', 
                  r: 6,
                  strokeWidth: 2,
                  stroke: '#4CC9F0'
                }}
                activeDot={{ 
                  r: 8, 
                  fill: '#4CC9F0',
                  stroke: '#2F6DF6',
                  strokeWidth: 2
                }}
                animationDuration={2000}
                animationBegin={isVisible ? 0 : 10000}
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(76, 201, 240, 0.3))'
                }}
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
              <div className="mb-1" style={{ 
                color: '#2F6DF6',
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '30px',
                fontWeight: '700'
              }}>
                {stat.value}
              </div>
              <div style={{ 
                color: '#9CA3AF',
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px'
              }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: '#0F1115', color: '#F3F4F6' }}>

      {/* HERO SECTION */}
      <motion.section
        style={{ y: heroY, paddingTop: '140px', paddingBottom: '160px' }}
        className="min-h-screen flex items-center justify-center px-6"
      >
        <div className="w-full grid lg:grid-cols-2 gap-24 items-center" style={{ maxWidth: '1200px' }}>
          <div className="text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              style={{ 
                color: '#F3F4F6',
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '72px',
                fontWeight: '300',
                lineHeight: '1.1',
                letterSpacing: '0.04em',
                maxWidth: '650px',
                marginBottom: '32px'
              }}
            >
              WELCOME TO<br />PROOFLY
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ 
                color: '#9CA3AF',
                fontFamily: 'Inter, sans-serif',
                fontSize: '24px',
                fontWeight: '400',
                lineHeight: '1.7',
                maxWidth: '650px',
                marginBottom: '40px'
              }}
            >
              Your test performance, engineered.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8"
            >
              <Link to={createPageUrl('Dashboard')}>
                <Button
                  className="rounded-lg transition-all duration-200 hover:scale-103"
                  style={{
                    background: '#2F6DF6',
                    color: '#F3F4F6',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: '22px',
                    fontWeight: '500',
                    padding: '16px 32px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#3C7CFF'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#2F6DF6'}
                >
                  Start Your Diagnostic
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="#features" className="transition-all duration-200">
                <Button
                  variant="ghost"
                  className="rounded-lg"
                  style={{
                    color: '#F3F4F6',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '18px',
                    fontWeight: '500',
                    padding: '16px 32px',
                    textDecoration: 'underline',
                    textUnderlineOffset: '4px'
                  }}
                >
                  Explore Features
                </Button>
              </a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              style={{ 
                color: '#6B7280',
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                fontWeight: '400',
                lineHeight: '1.7'
              }}
            >
              Built as a nonprofit. Focused on access, not profit.
            </motion.p>
          </div>

          <div style={{ maxWidth: '650px' }}>
            <PerformanceEngine />
          </div>
        </div>
      </motion.section>

      {/* THE PROBLEM */}
      <section className="px-6" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
        <div className="mx-auto text-center" style={{ maxWidth: '1200px' }}>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
            style={{ 
              color: '#F3F4F6',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '48px',
              fontWeight: '400',
              lineHeight: '1.1',
              letterSpacing: '0.04em'
            }}
          >
            Most students practice without measurement.
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-16" style={{ marginTop: '64px' }}>
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
                style={{ 
                  color: '#6B7280',
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '36px',
                  fontWeight: '400',
                  lineHeight: '1.1',
                  letterSpacing: '0.04em'
                }}
              >
                {item.text}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW THE ENGINE WORKS */}
      <section id="features" className="px-6" style={{ background: '#171A21', paddingTop: '120px', paddingBottom: '120px' }}>
        <div className="mx-auto" style={{ maxWidth: '1200px' }}>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
            style={{ 
              color: '#F3F4F6',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '48px',
              fontWeight: '400',
              lineHeight: '1.1',
              letterSpacing: '0.04em'
            }}
          >
            How the Engine Works
          </motion.h2>

          <div className="space-y-8 mt-16">
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
                className="flex items-center gap-8 p-8 rounded-xl transition-all cursor-pointer"
                style={{
                  background: 'rgba(15, 17, 21, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(47, 109, 246, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'}
              >
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(47, 109, 246, 0.1)' }}
                >
                  <span style={{ 
                    color: '#2F6DF6',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: '24px',
                    fontWeight: '700'
                  }}>
                    {step.num}
                  </span>
                </div>
                <div>
                  <h3 className="mb-2" style={{ 
                    color: '#F3F4F6',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: '24px',
                    fontWeight: '400',
                    lineHeight: '1.1',
                    letterSpacing: '0.04em'
                  }}>
                    {step.title}
                  </h3>
                  <p style={{ 
                    color: '#9CA3AF',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '18px',
                    fontWeight: '400',
                    lineHeight: '1.7'
                  }}>
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BUILT FOR REAL EXAMS */}
      <section className="px-6" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
        <div className="mx-auto" style={{ maxWidth: '1200px' }}>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
            style={{ 
              color: '#F3F4F6',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '48px',
              fontWeight: '400',
              lineHeight: '1.1',
              letterSpacing: '0.04em'
            }}
          >
            Built for Real Exams
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-12 mt-16">
            {[
              {
                title: 'SAT',
                icon: <TrendingUp className="w-10 h-10" />,
                features: [
                  '1600 scale tracking',
                  'Section-level analytics',
                  'Timing efficiency modeling'
                ]
              },
              {
                title: 'ACT',
                icon: <BarChart3 className="w-10 h-10" />,
                features: [
                  'Composite + subscore modeling',
                  '36-scale adaptive tracking',
                  'Science reasoning analysis'
                ]
              },
              {
                title: 'AP',
                icon: <Target className="w-10 h-10" />,
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
                className="rounded-xl p-8 transition-all"
                style={{
                  background: '#171A21',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(47, 109, 246, 0.5)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(47, 109, 246, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ color: '#2F6DF6' }} className="mb-6">
                  {exam.icon}
                </div>
                <h3 className="mb-6" style={{ 
                  color: '#F3F4F6',
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '24px',
                  fontWeight: '400',
                  lineHeight: '1.1',
                  letterSpacing: '0.04em'
                }}>
                  {exam.title}
                </h3>
                <ul className="space-y-4">
                  {exam.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3" style={{ 
                      color: '#9CA3AF',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '18px',
                      fontWeight: '400',
                      lineHeight: '1.7'
                    }}>
                      <span style={{ color: '#2F6DF6', fontSize: '20px' }}>•</span>
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
      <section id="about" className="px-6" style={{ background: '#171A21', paddingTop: '120px', paddingBottom: '120px' }}>
        <div className="mx-auto" style={{ maxWidth: '1200px' }}>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
            style={{ 
              color: '#F3F4F6',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '48px',
              fontWeight: '400',
              lineHeight: '1.1',
              letterSpacing: '0.04em'
            }}
          >
            Why Proofly Exists
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8 mt-16 mx-auto"
            style={{ maxWidth: '650px' }}
          >
            <p style={{ 
              color: '#F3F4F6',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '24px',
              fontWeight: '400',
              lineHeight: '1.7',
              letterSpacing: '0.04em',
              textAlign: 'center'
            }}>
              Most test prep is built for the top 10%.<br />
              Proofly was built for the other 90%.
            </p>

            <p style={{ 
              color: '#9CA3AF',
              fontFamily: 'Inter, sans-serif',
              fontSize: '18px',
              fontWeight: '400',
              lineHeight: '1.7'
            }}>
              The founder and lead developer struggled academically — not from lack of effort, but from lack of precise feedback. Studying felt random. Improvement felt unpredictable.
            </p>

            <p style={{ 
              color: '#9CA3AF',
              fontFamily: 'Inter, sans-serif',
              fontSize: '18px',
              fontWeight: '400',
              lineHeight: '1.7'
            }}>
              Proofly was built to solve that problem:
            </p>

            <div className="grid md:grid-cols-3 gap-12 pt-8">
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
                  className="text-center p-8 rounded-xl"
                  style={{
                    background: 'rgba(15, 17, 21, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <div style={{ 
                    color: '#2F6DF6',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: '24px',
                    fontWeight: '400',
                    lineHeight: '1.1',
                    letterSpacing: '0.04em'
                  }}>
                    {text}
                  </div>
                </motion.div>
              ))}
            </div>

            <ul className="space-y-4 pt-8">
              <li className="flex items-start gap-4" style={{ 
                color: '#9CA3AF',
                fontFamily: 'Inter, sans-serif',
                fontSize: '18px',
                fontWeight: '400',
                lineHeight: '1.7'
              }}>
                <span style={{ color: '#2F6DF6', fontSize: '20px' }}>•</span>
                <span>Built around real exam skill frameworks</span>
              </li>
              <li className="flex items-start gap-4" style={{ 
                color: '#9CA3AF',
                fontFamily: 'Inter, sans-serif',
                fontSize: '18px',
                fontWeight: '400',
                lineHeight: '1.7'
              }}>
                <span style={{ color: '#2F6DF6', fontSize: '20px' }}>•</span>
                <span>Designed by someone who needed it</span>
              </li>
              <li className="flex items-start gap-4" style={{ 
                color: '#9CA3AF',
                fontFamily: 'Inter, sans-serif',
                fontSize: '18px',
                fontWeight: '400',
                lineHeight: '1.7'
              }}>
                <span style={{ color: '#2F6DF6', fontSize: '20px' }}>•</span>
                <span>Developed as a nonprofit to maximize access</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
        <div className="mx-auto text-center" style={{ maxWidth: '1200px' }}>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
            style={{ 
              color: '#F3F4F6',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '48px',
              fontWeight: '400',
              lineHeight: '1.1',
              letterSpacing: '0.04em'
            }}
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
                className="rounded-lg transition-all duration-200 hover:scale-103"
                style={{
                  background: '#2F6DF6',
                  color: '#F3F4F6',
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '22px',
                  fontWeight: '500',
                  padding: '16px 32px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#3C7CFF'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#2F6DF6'}
              >
                Start Your Diagnostic
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#features">
              <Button
                variant="ghost"
                className="rounded-lg"
                style={{
                  color: '#F3F4F6',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '18px',
                  fontWeight: '500',
                  padding: '16px 32px',
                  textDecoration: 'underline',
                  textUnderlineOffset: '4px'
                }}
              >
                Explore Features
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div className="max-w-7xl mx-auto text-center" style={{ 
          color: '#6B7280',
          fontFamily: 'Inter, sans-serif',
          fontSize: '16px'
        }}>
          <p>© 2026 Proofly. A nonprofit organization.</p>
          <p className="mt-2">Built to increase access to measurable, high-quality exam preparation.</p>
        </div>
      </footer>
    </div>
  );
}