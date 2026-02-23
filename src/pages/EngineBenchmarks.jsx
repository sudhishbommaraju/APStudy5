import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ExternalLink, Plus, Calendar } from 'lucide-react';

/**
 * Benchmark Tracking - Link-Out Model (Compliance)
 * We DO NOT ingest official questions
 * We link to official materials and track user-entered results
 */

export default function EngineBenchmarks() {
  const navigate = useNavigate();
  const [benchmarks, setBenchmarks] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [showAddScore, setShowAddScore] = useState(null);
  const [score, setScore] = useState('');

  useEffect(() => {
    loadBenchmarks();
    loadUserResults();
  }, []);

  async function loadBenchmarks() {
    const allBenchmarks = await base44.entities.BenchmarkTest.list();
    setBenchmarks(allBenchmarks);
  }

  async function loadUserResults() {
    const user = await base44.auth.me();
    const results = await base44.entities.BenchmarkResult.filter({
      user_email: user.email
    });
    setUserResults(results);
  }

  async function saveScore(benchmarkId) {
    const user = await base44.auth.me();
    await base44.entities.BenchmarkResult.create({
      user_email: user.email,
      benchmark_test_id: benchmarkId,
      score: parseFloat(score),
      metadata: {},
      taken_at: new Date().toISOString()
    });
    setShowAddScore(null);
    setScore('');
    loadUserResults();
  }

  const getUserScore = (benchmarkId) => {
    const result = userResults.find(r => r.benchmark_test_id === benchmarkId);
    return result?.score;
  };

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-4xl mx-auto px-6">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="mb-8 text-neutral-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-12">
          <h1 className="text-3xl font-light text-white mb-2">Official Benchmarks</h1>
          <p className="text-neutral-400">
            Track your performance on official College Board practice materials
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-900/20 border border-blue-800/30 rounded-xl p-6 mb-8">
          <div className="text-blue-400 font-medium mb-2">Link-Out Model</div>
          <div className="text-sm text-blue-300/70 leading-relaxed">
            We link to official College Board materials but do not store or ingest copyrighted questions.
            Take practice tests through official channels, then record your results here for tracking.
          </div>
        </div>

        {/* Benchmarks List */}
        <div className="space-y-4">
          {benchmarks.map((benchmark) => {
            const userScore = getUserScore(benchmark.id);
            return (
              <div
                key={benchmark.id}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      {benchmark.title}
                    </h3>
                    <p className="text-sm text-neutral-400">{benchmark.description}</p>
                  </div>
                  {benchmark.is_official && (
                    <span className="bg-blue-900/30 text-blue-400 text-xs px-3 py-1 rounded-full">
                      Official
                    </span>
                  )}
                </div>

                {userScore !== undefined ? (
                  <div className="bg-neutral-800/50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Your Score:</span>
                      <span className="text-2xl font-semibold text-white">{userScore}</span>
                    </div>
                  </div>
                ) : showAddScore === benchmark.id ? (
                  <div className="bg-neutral-800/50 rounded-xl p-4 mb-4">
                    <div className="flex gap-3">
                      <Input
                        type="number"
                        placeholder="Enter your score"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        className="bg-black border-neutral-700 text-white"
                      />
                      <Button
                        onClick={() => saveScore(benchmark.id)}
                        className="bg-white text-black hover:bg-neutral-100"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => setShowAddScore(null)}
                        variant="ghost"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowAddScore(benchmark.id)}
                    variant="outline"
                    className="w-full mb-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Score
                  </Button>
                )}

                <a
                  href={benchmark.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Take Test on College Board
                </a>
              </div>
            );
          })}
        </div>

        {benchmarks.length === 0 && (
          <div className="text-center py-12 text-neutral-400">
            No benchmarks available yet
          </div>
        )}
      </div>
    </div>
  );
}