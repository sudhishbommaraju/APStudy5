import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Youtube, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function APYoutube() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [subject, setSubject] = useState('');
  const [synthesisType, setSynthesisType] = useState('summary');

  const handleProcess = async () => {
    if (!youtubeUrl || !subject) {
      toast.error('Please provide YouTube URL and subject');
      return;
    }

    if (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    setLoading(true);
    try {
      const synthesisInstructions = {
        summary: 'Create a comprehensive summary organized into digestible bullet points with timestamps',
        flashcards: 'Extract key terms and concepts and format as flashcards (Front: Term/Question | Back: Definition/Answer)',
        detailed: 'Provide detailed lecture notes with explanations, examples, and connections between concepts'
      };

      const prompt = `Analyze this YouTube lecture on AP ${subject} (URL: ${youtubeUrl}) and ${synthesisInstructions[synthesisType]}.

Extract and synthesize:
- Main topics and key concepts
- Important definitions and formulas
- Examples and applications discussed
- Visual/diagram descriptions if mentioned
- Practice problems or questions presented
- Common mistakes highlighted

Organize the information clearly with proper markdown formatting and include timestamps where relevant.`;

      const extractedContent = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true
      });

      // Extract key concepts
      const conceptsPrompt = `From the following lecture content, extract 5-10 key concepts or terms as a JSON array of strings:\n\n${extractedContent}`;
      const conceptsResponse = await base44.integrations.Core.InvokeLLM({
        prompt: conceptsPrompt,
        response_json_schema: {
          type: 'object',
          properties: {
            concepts: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      });

      // Extract video title
      const titleMatch = youtubeUrl.match(/[?&]v=([^&]+)/);
      const videoId = titleMatch ? titleMatch[1] : 'Video';

      // Save personalized notes
      await base44.entities.StudyNote.create({
        user_email: (await base44.auth.me()).email,
        exam_type: 'AP',
        subject_id: subject,
        title: `${subject} - YouTube Lecture (${videoId})`,
        content: extractedContent,
        key_concepts: conceptsResponse.concepts || []
      });

      toast.success('Video processed and notes saved successfully!');
      navigate(createPageUrl('Dashboard'));
    } catch (error) {
      toast.error('Failed to process video');
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-3xl mx-auto px-6">
        <button
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-12"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <Youtube className="w-8 h-8 text-red-500" />
            <div>
              <h1 className="text-3xl font-light text-white">YouTube to Personalized Notes</h1>
              <p className="text-neutral-400 mt-1">AI transforms video lectures into study materials</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">AP Subject</label>
              <Input
                placeholder="e.g., Biology, Physics, World History"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">YouTube URL</label>
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Synthesis Type
              </label>
              <Select value={synthesisType} onValueChange={setSynthesisType}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Bullet Point Summary</SelectItem>
                  <SelectItem value="flashcards">Flashcard Format</SelectItem>
                  <SelectItem value="detailed">Detailed Lecture Notes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-neutral-300 mb-2">AI will extract:</h3>
              <ul className="text-sm text-neutral-400 space-y-1">
                <li>• Key concepts and definitions</li>
                <li>• Important formulas and theories</li>
                <li>• Examples and applications</li>
                <li>• Visual descriptions from the video</li>
                <li>• Timestamps for easy reference</li>
              </ul>
            </div>

            <Button
              onClick={handleProcess}
              disabled={loading || !youtubeUrl || !subject}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  AI Processing Video...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Process & Generate Notes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}