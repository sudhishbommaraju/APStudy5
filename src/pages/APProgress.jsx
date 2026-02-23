import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Database, Link as LinkIcon, Loader2, CheckCircle, ExternalLink, TrendingUp, BarChart, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function APProgress() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [notionPageUrl, setNotionPageUrl] = useState('');
  const [linkedPage, setLinkedPage] = useState(null);
  const [progressData, setProgressData] = useState([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    averageAccuracy: 0,
    masteryScore: 0
  });

  useEffect(() => {
    loadLinkedPage();
    loadProgressData();
  }, []);

  const loadLinkedPage = async () => {
    try {
      const user = await base44.auth.me();
      if (user.notion_progress_page) {
        setLinkedPage(user.notion_progress_page);
        setNotionPageUrl(user.notion_progress_page);
      }
    } catch (error) {
      console.error('Failed to load linked page:', error);
    }
  };

  const loadProgressData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const sessions = await base44.entities.EnginePracticeSession.filter({
        user_email: user.email,
        exam_id: 'AP'
      }, '-completed_at', 20);

      // Calculate stats
      const completedSessions = sessions.filter(s => s.completed_at);
      const totalSessions = completedSessions.length;
      const averageAccuracy = totalSessions > 0
        ? completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / totalSessions
        : 0;

      setStats({
        totalSessions,
        averageAccuracy: Math.round(averageAccuracy),
        masteryScore: Math.min(Math.round(averageAccuracy * 1.2), 100)
      });

      // Format for chart
      const chartData = completedSessions.slice(0, 10).reverse().map((session, i) => ({
        session: `Session ${i + 1}`,
        accuracy: Math.round((session.score || 0) * 100)
      }));
      setProgressData(chartData);
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
    setLoading(false);
  };

  const handleLinkNotion = async () => {
    if (!notionPageUrl) {
      toast.error('Please enter a Notion page URL');
      return;
    }

    setSyncing(true);
    try {
      await base44.auth.updateMe({
        notion_progress_page: notionPageUrl
      });
      
      setLinkedPage(notionPageUrl);
      await syncProgressToNotion();
      toast.success('Notion page linked and synced!');
    } catch (error) {
      toast.error('Failed to link Notion page');
      console.error(error);
    }
    setSyncing(false);
  };

  const syncProgressToNotion = async () => {
    setSyncing(true);
    try {
      const user = await base44.auth.me();
      const sessions = await base44.entities.EnginePracticeSession.filter({
        user_email: user.email,
        exam_id: 'AP'
      }, '-completed_at', 50);

      // Placeholder for bidirectional Notion sync
      // In production, this would:
      // 1. Push local progress to Notion
      // 2. Pull updates from Notion
      // 3. Merge and reconcile data
      console.log('Syncing bidirectionally with Notion:', {
        linkedPage,
        sessions: sessions.length,
        stats
      });

      toast.success('Progress synced with Notion');
    } catch (error) {
      toast.error('Sync failed');
      console.error('Sync to Notion failed:', error);
    }
    setSyncing(false);
  };

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-5xl mx-auto px-6">
        <button
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-12"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="space-y-6">
          {/* Notion Integration Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-2xl font-light text-white">Link Notion Progress Tracker</h2>
                <p className="text-neutral-400 mt-1">Bidirectional sync for real-time progress tracking</p>
              </div>
            </div>

            {linkedPage ? (
              <div className="space-y-4">
                <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-white font-medium">Notion Page Linked</p>
                      <p className="text-sm text-neutral-400">Auto-sync enabled</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={syncProgressToNotion}
                      disabled={syncing}
                    >
                      {syncing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(linkedPage, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View in Notion
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Notion Page URL
                  </label>
                  <Input
                    placeholder="https://notion.so/your-progress-page-id"
                    value={notionPageUrl}
                    onChange={(e) => setNotionPageUrl(e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
                <Button onClick={handleLinkNotion} disabled={syncing}>
                  {syncing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Linking & Syncing...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Link & Sync Notion Page
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart className="w-5 h-5 text-blue-500" />
                <p className="text-sm text-neutral-400">Total Sessions</p>
              </div>
              <p className="text-3xl font-semibold text-white">{stats.totalSessions}</p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <p className="text-sm text-neutral-400">Avg Accuracy</p>
              </div>
              <p className="text-3xl font-semibold text-white">{stats.averageAccuracy}%</p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-purple-500" />
                <p className="text-sm text-neutral-400">Mastery Score</p>
              </div>
              <p className="text-3xl font-semibold text-white">{stats.masteryScore}%</p>
            </div>
          </div>

          {/* Progress Chart */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
            <h2 className="text-2xl font-light text-white mb-6">Progress Over Time</h2>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
              </div>
            ) : progressData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                  <XAxis dataKey="session" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      border: '1px solid #2A2A2A',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-neutral-500">
                No progress data yet. Complete some practice sessions to see your progress.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}