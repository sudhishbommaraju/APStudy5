import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowRight, TrendingUp, Target, BarChart3, Activity, Search, Clock } from 'lucide-react';
import { AuroraBackground } from '@/components/ui/animated-background';
import { base44 } from '@/api/base44Client';

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
        className="rounded-2xl shadow-2xl"
        style={{
          background: 'rgba(23, 26, 33, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          width: '100%',
          minHeight: '520px',
          padding: '24px'
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
        <div style={{ width: '100%', height: '360px', marginBottom: '24px' }}>
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
    <AuroraBackground>

      {/* HERO SECTION */}
      <motion.section
        style={{ y: heroY, paddingTop: '120px', paddingBottom: '140px' }}
        className="min-h-screen flex items-center justify-center"
      >
        <div className="w-full" style={{ maxWidth: '1500px', margin: '0 auto', padding: '0 40px', display: 'grid', gridTemplateColumns: '0.9fr 1.6fr', gap: '80px', alignItems: 'center' }}>
          <div className="text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              style={{ 
                color: '#F3F4F6',
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '72px',
                fontWeight: '400',
                lineHeight: '1.05',
                letterSpacing: '-0.02em',
                maxWidth: '700px',
                marginBottom: '28px'
              }}
            >
              Study smarter.<br />Improve predictably.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ 
                color: '#9CA3AF',
                fontFamily: 'Inter, sans-serif',
                fontSize: '20px',
                fontWeight: '400',
                lineHeight: '1.6',
                maxWidth: '600px',
                marginBottom: '56px'
              }}
            >
              Engineered around real exam skill frameworks, adaptive practice, and measurable progress.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8"
            >
              <Button
                onClick={() => {
                  base44.auth.isAuthenticated().then(isAuth => {
                    if (isAuth) {
                      base44.auth.me().then(user => {
                        if (user.onboarding_complete) {
                          window.location.href = createPageUrl('Dashboard');
                        } else {
                          window.location.href = createPageUrl('Onboarding');
                        }
                      });
                    } else {
                      base44.auth.redirectToLogin(createPageUrl('Onboarding'));
                    }
                  });
                }}
                className="rounded-xl transition-all duration-200"
                style={{
                  background: '#FFFFFF',
                  color: '#0C0C0C',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '18px',
                  fontWeight: '500',
                  padding: '14px 32px',
                  border: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F5F5F5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FFFFFF';
                }}
              >
                Get Started
              </Button>
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

          <div>
            <PerformanceEngine />
          </div>
        </div>
      </motion.section>

      {/* THE PROBLEM */}
      <section style={{ paddingTop: '120px', paddingBottom: '120px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
            style={{ 
              color: '#F3F4F6',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '48px',
              fontWeight: '400',
              lineHeight: '1.1',
              letterSpacing: '0.04em',
              maxWidth: '800px',
              margin: '0 auto'
            }}
          >
            Most students practice without measurement.
          </motion.h2>

          <div className="flex justify-center gap-10" style={{ marginTop: '64px', flexWrap: 'wrap' }}>
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
                  letterSpacing: '0.04em',
                  width: '280px',
                  textAlign: 'center'
                }}
              >
                {item.text}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW THE ENGINE WORKS */}
      <section id="features" style={{ background: '#171A21', paddingTop: '120px', paddingBottom: '120px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
            style={{ 
              color: '#F3F4F6',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '48px',
              fontWeight: '400',
              lineHeight: '1.1',
              letterSpacing: '0.04em',
              maxWidth: '800px',
              margin: '0 auto 64px auto'
            }}
          >
            How the Engine Works
          </motion.h2>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '32px',
            maxWidth: '1100px',
            margin: '0 auto'
          }}>
            {[
              { num: '1', icon: Activity, title: 'Diagnostic Baseline', desc: 'Measure current performance across all sections' },
              { num: '2', icon: Search, title: 'Weakness Mapping', desc: 'Identify precise skill gaps and timing inefficiencies' },
              { num: '3', icon: Target, title: 'Targeted Drills', desc: 'Practice questions calibrated to your weak points' },
              { num: '4', icon: Clock, title: 'Timed Simulation', desc: 'Full-length exams under real conditions' },
              { num: '5', icon: TrendingUp, title: 'Projection Update', desc: 'Track improvement and recalculate score trajectory' },
              { num: '6', icon: BarChart3, title: 'Performance Review', desc: 'Analyze trends and adjust strategy weekly' }
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '16px',
                    padding: '28px',
                    width: '100%',
                    minHeight: '280px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    transition: 'all 0.3s ease'
                  }}
                  whileHover={{
                    boxShadow: '0 8px 30px rgba(47, 109, 246, 0.15)'
                  }}
                >
                  <Icon 
                    size={28} 
                    strokeWidth={1.5}
                    style={{ 
                      color: '#2F6DF6',
                      opacity: 0.85,
                      marginBottom: '16px'
                    }}
                  />
                  <div 
                    className="mb-4"
                    style={{ 
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(47, 109, 246, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span style={{ 
                      color: '#2F6DF6',
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: '20px',
                      fontWeight: '700'
                    }}>
                      {step.num}
                    </span>
                  </div>
                  <h3 className="mb-3" style={{ 
                    color: '#F3F4F6',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: '20px',
                    fontWeight: '500',
                    lineHeight: '1.2'
                  }}>
                    {step.title}
                  </h3>
                  <div style={{
                    width: '40px',
                    height: '2px',
                    background: '#2F6DF6',
                    opacity: 0.3,
                    margin: '12px 0'
                  }} />
                  <p style={{ 
                    color: '#9CA3AF',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '15px',
                    fontWeight: '400',
                    lineHeight: '1.5'
                  }}>
                    {step.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BUILT FOR REAL EXAMS */}
      <section style={{ paddingTop: '120px', paddingBottom: '120px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
            style={{ 
              color: '#F3F4F6',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '48px',
              fontWeight: '400',
              lineHeight: '1.1',
              letterSpacing: '0.04em',
              maxWidth: '800px',
              margin: '0 auto 64px auto'
            }}
          >
            Built for Real Exams
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-12">
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
      <section id="about" style={{ background: '#171A21', paddingTop: '120px', paddingBottom: '120px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
            style={{ 
              color: '#F3F4F6',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '48px',
              fontWeight: '400',
              lineHeight: '1.1',
              letterSpacing: '0.04em',
              maxWidth: '800px',
              margin: '0 auto'
            }}
          >
            Why Proofly Exists
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
            style={{ maxWidth: '700px', margin: '24px auto 0 auto' }}
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

            <div className="flex justify-center gap-10 pt-8" style={{ flexWrap: 'wrap' }}>
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
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    width: '280px'
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
      <section style={{ 
        minHeight: '70vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center',
        padding: '120px 24px'
      }}>
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ 
              color: '#F3F4F6',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '60px',
              fontWeight: '400',
              lineHeight: '1.05',
              letterSpacing: '-0.02em',
              maxWidth: '800px',
              margin: '0 auto 24px auto'
            }}
          >
            Take control of your performance.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            style={{ 
              color: '#9CA3AF',
              fontFamily: 'Inter, sans-serif',
              fontSize: '18px',
              fontWeight: '400',
              lineHeight: '1.6',
              maxWidth: '600px',
              margin: '0 auto 40px auto'
            }}
          >
            No guesswork. No random studying. Just measurable improvement.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Button
              onClick={() => {
                base44.auth.isAuthenticated().then(isAuth => {
                  if (isAuth) {
                    base44.auth.me().then(user => {
                      if (user.onboarding_complete) {
                        window.location.href = createPageUrl('Dashboard');
                      } else {
                        window.location.href = createPageUrl('Onboarding');
                      }
                    });
                  } else {
                    base44.auth.redirectToLogin(createPageUrl('Onboarding'));
                  }
                });
              }}
              className="transition-all duration-200"
              style={{
                background: '#2F6DF6',
                color: '#FFFFFF',
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                fontWeight: '500',
                padding: '14px 36px',
                borderRadius: '999px',
                border: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3C7CFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2F6DF6';
              }}
            >
              Get Started
            </Button>
          </motion.div>
        </div>
      </section>
    </AuroraBackground>
  );
}