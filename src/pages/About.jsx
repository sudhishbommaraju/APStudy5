import React from 'react';
import { Sparkles, Code, GraduationCap, Heart } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen galaxy-page">
      <div className="max-w-4xl mx-auto px-6 py-16 galaxy-content">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-6xl font-bold text-white">SB</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-100 mb-4">About the Creator</h1>
          <div className="h-1 w-24 bg-gradient-to-r from-violet-500 to-purple-500 mx-auto rounded-full"></div>
        </div>

        {/* Main Content */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 mb-8 shadow-xl">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">Sudhish Bommaraju</h2>
              <p className="text-lg text-slate-300 leading-relaxed mb-4">
                Hi, I'm Sudhish Bommaraju and I have aspirations to becoming a tech entrepreneur. I built Proofly to combine my passion for technology with my commitment to helping students succeed academically.
              </p>
              <p className="text-lg text-slate-300 leading-relaxed">
                This platform reflects my belief that with the right tools, anyone can achieve their academic goals while pursuing their dreams.
              </p>
            </div>
          </div>
        </div>

        {/* Mission Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
              <Code className="w-6 h-6 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Innovation</h3>
            <p className="text-sm text-slate-400">
              Leveraging cutting-edge AI technology to revolutionize how students learn and prepare for exams
            </p>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Education</h3>
            <p className="text-sm text-slate-400">
              Making quality test prep accessible to every student, regardless of their background or resources
            </p>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Passion</h3>
            <p className="text-sm text-slate-400">
              Driven by a genuine commitment to empowering students to achieve their academic and career goals
            </p>
          </div>
        </div>

        {/* Vision Section */}
        <div className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl border border-violet-500/30 p-8 text-center">
          <Sparkles className="w-12 h-12 text-violet-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-slate-100 mb-3">The Vision</h3>
          <p className="text-slate-300 text-lg leading-relaxed max-w-2xl mx-auto">
            Proofly is more than just a study platform—it's a testament to the belief that technology can democratize education. 
            Every feature, from AI-powered tutoring to adaptive practice, is designed with one goal in mind: helping you succeed.
          </p>
        </div>
      </div>
    </div>
  );
}