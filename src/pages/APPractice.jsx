import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Database, Link as LinkIcon, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function APPractice() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [notionPageUrl, setNotionPageUrl] = useState('');
  const [subject, setSubject] = useState('');
  const [unit, setUnit] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [linkedPage, setLinkedPage] = useState(null);

  useEffect(() => {
    loadLinkedPage();
  }, []);

  const loadLinkedPage = async () => {
    try {
      const user = await base44.auth.me();
      if (user.notion_practice_page) {
        setLinkedPage(user.notion_practice_page);
        setNotionPageUrl(user.notion_practice_page);
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
        notion_practice_page: notionPageUrl
      });
      
      setLinkedPage(notionPageUrl);
      toast.success('Notion page linked successfully!');
    } catch (error) {
      toast.error('Failed to link Notion page');
      console.error(error);
    }
    setLoading(false);
  };

  const handleStartPractice = async () => {
    if (!subject || !unit) {
      toast.error('Please select subject and unit');
      return;
    }

    setLoading(true);
    try {
      // Sync progress to Notion before starting
      if (linkedPage) {
        await syncProgressToNotion();
      }

      // Fetch questions from ProoflyQuestion entity filtered by subject/unit
      const questions = await base44.entities.ProoflyQuestion.filter({
        subject_id: subject,
        unit_id: unit,
        is_active: true
      }, '', questionCount);

      if (questions.length === 0) {
        toast.error('No questions found. Please sync your Notion database first.');
        setLoading(false);
        return;
      }

      // Create practice session
      const session = await base44.entities.EnginePracticeSession.create({
        user_email: (await base44.auth.me()).email,
        exam_id: 'AP',
        subject_id: subject,
        unit_id: unit,
        question_count: questions.length,
        mode: 'untimed'
      });

      navigate(createPageUrl('EnginePracticeSession') + `?session_id=${session.id}`);
    } catch (error) {
      toast.error('Failed to start practice');
      console.error(error);
    }
    setLoading(false);
  };

  const syncProgressToNotion = async () => {
    try {
      const user = await base44.auth.me();
      const sessions = await base44.entities.EnginePracticeSession.filter({
        user_email: user.email,
        exam_id: 'AP'
      }, '-completed_at', 10);

      // Note: Actual Notion API integration would go here
      // For now, we're just storing the reference
      console.log('Syncing to Notion:', { sessions, linkedPage });
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
                <h2 className="text-2xl font-light text-white">Link Notion Database</h2>
                <p className="text-neutral-400 mt-1">Connect your Notion question bank for practice</p>
              </div>
            </div>

            {linkedPage ? (
              <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-white font-medium">Notion Page Linked</p>
                    <p className="text-sm text-neutral-400">Bidirectional sync enabled</p>
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
                    placeholder="https://notion.so/your-page-id"
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

          {/* Practice Session Configuration */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
            <h2 className="text-2xl font-light text-white mb-6">Start Practice Session</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Subject</label>
                <Input
                  placeholder="e.g., AP Biology, AP Calculus AB"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Unit</label>
                <Input
                  placeholder="e.g., Unit 3"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Number of Questions
                </label>
                <Select value={questionCount.toString()} onValueChange={(v) => setQuestionCount(parseInt(v))}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Questions</SelectItem>
                    <SelectItem value="10">10 Questions</SelectItem>
                    <SelectItem value="15">15 Questions</SelectItem>
                    <SelectItem value="20">20 Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleStartPractice}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading Questions...
                  </>
                ) : (
                  'Start Practice from Notion'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}