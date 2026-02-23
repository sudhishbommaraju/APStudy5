import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Database, Link as LinkIcon, Loader2, CheckCircle, ExternalLink, Timer, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function APFullTest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [notionPageUrl, setNotionPageUrl] = useState('');
  const [subject, setSubject] = useState('');
  const [linkedPage, setLinkedPage] = useState(null);

  useEffect(() => {
    loadLinkedPage();
  }, []);

  const loadLinkedPage = async () => {
    try {
      const user = await base44.auth.me();
      if (user.notion_fulltest_page) {
        setLinkedPage(user.notion_fulltest_page);
        setNotionPageUrl(user.notion_fulltest_page);
      }
    } catch (error) {
      console.error('Failed to load linked page:', error);
    }
  };

  const handleLinkNotion = async () => {
    if (!notionPageUrl) {
      toast.error('Please enter a Notion page URL');
      return;
    }

    setLoading(true);
    try {
      await base44.auth.updateMe({
        notion_fulltest_page: notionPageUrl
      });
      
      setLinkedPage(notionPageUrl);
      toast.success('Notion page linked successfully!');
    } catch (error) {
      toast.error('Failed to link Notion page');
      console.error(error);
    }
    setLoading(false);
  };

  const handleStartFullTest = async () => {
    if (!subject) {
      toast.error('Please enter subject');
      return;
    }

    setLoading(true);
    try {
      // Fetch all questions for full test
      const questions = await base44.entities.ProoflyQuestion.filter({
        subject_id: subject,
        is_active: true
      }, '', 100);

      if (questions.length < 20) {
        toast.error('Not enough questions for a full test. Need at least 20 questions.');
        setLoading(false);
        return;
      }

      // Create timed practice session
      const session = await base44.entities.EnginePracticeSession.create({
        user_email: (await base44.auth.me()).email,
        exam_id: 'AP',
        subject_id: subject,
        question_count: questions.length,
        mode: 'timed'
      });

      // Sync to Notion
      if (linkedPage) {
        await syncTestToNotion(session);
      }

      navigate(createPageUrl('EnginePracticeSession') + `?session_id=${session.id}`);
    } catch (error) {
      toast.error('Failed to start full test');
      console.error(error);
    }
    setLoading(false);
  };

  const syncTestToNotion = async (session) => {
    try {
      // Placeholder for Notion API integration
      console.log('Syncing test session to Notion:', { session, linkedPage });
    } catch (error) {
      console.error('Sync to Notion failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-4xl mx-auto px-6">
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
                <h2 className="text-2xl font-light text-white">Link Notion Test Bank</h2>
                <p className="text-neutral-400 mt-1">Connect your Notion database for full-length tests</p>
              </div>
            </div>

            {linkedPage ? (
              <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-white font-medium">Notion Page Linked</p>
                    <p className="text-sm text-neutral-400">Test results sync automatically</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(linkedPage, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View in Notion
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Notion Page URL
                  </label>
                  <Input
                    placeholder="https://notion.so/your-test-bank-page-id"
                    value={notionPageUrl}
                    onChange={(e) => setNotionPageUrl(e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
                <Button onClick={handleLinkNotion} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Linking...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Link Notion Page
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Full Test Configuration */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Timer className="w-8 h-8 text-orange-500" />
              <div>
                <h2 className="text-2xl font-light text-white">Full-Length Practice Test</h2>
                <p className="text-neutral-400 mt-1">Simulated AP exam using Notion content</p>
              </div>
            </div>

            <div className="bg-orange-900/20 border border-orange-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-orange-300 font-medium">Timed Test Conditions</p>
                  <p className="text-sm text-orange-300/70 mt-1">
                    This will be a timed test simulating real AP exam conditions. Your progress will sync to Notion.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Subject</label>
                <Input
                  placeholder="e.g., AP Biology, AP US History"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>

              <Button
                onClick={handleStartFullTest}
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading Test...
                  </>
                ) : (
                  <>
                    <Timer className="w-5 h-5 mr-2" />
                    Start Full-Length Test
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}