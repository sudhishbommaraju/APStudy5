import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Youtube as YoutubeIcon, FileText } from 'lucide-react';

const SUBJECTS = [
  { id: 'sat_math', name: 'SAT Math' },
  { id: 'sat_reading', name: 'SAT Reading' },
  { id: 'act_math', name: 'ACT Math' },
  { id: 'act_english', name: 'ACT English' },
  { id: 'ap_calculus', name: 'AP Calculus' },
  { id: 'ap_biology', name: 'AP Biology' },
  { id: 'ap_chemistry', name: 'AP Chemistry' },
  { id: 'ap_physics', name: 'AP Physics' },
  { id: 'ap_history', name: 'AP History' },
  { id: 'ap_english', name: 'AP English' },
];

export default function Youtube() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [noteId, setNoteId] = useState(null);

  async function handleProcess() {
    if (!url || !subject) return;

    setLoading(true);
    
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Convert this YouTube video into detailed study notes: ${url}

Generate comprehensive notes covering all key concepts.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" }
        }
      }
    });

    const note = await base44.entities.Note.create({
      exam_type: subject,
      unit_name: 'YouTube Video',
      title: result.title,
      content: result.content,
      is_ai_generated: true
    });

    setNoteId(note.id);
    setLoading(false);
  }

  async function generatePractice() {
    navigate(createPageUrl('SATAdaptivePractice') + `?noteId=${noteId}`);
  }

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

        <h1 className="text-4xl font-light text-white mb-12">YouTube to Notes</h1>

        {!noteId ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
            <div className="space-y-6">
              <div>
                <label className="text-sm text-neutral-400 mb-2 block">Select Subject</label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="bg-black border-neutral-700 text-white">
                    <SelectValue placeholder="Choose subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-neutral-400 mb-2 block">YouTube URL</label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="bg-black border-neutral-700 text-white"
                />
              </div>

              <Button
                onClick={handleProcess}
                disabled={!url || !subject || loading}
                className="w-full bg-red-600 text-white hover:bg-red-700 py-6"
              >
                <YoutubeIcon className="w-5 h-5 mr-2" />
                {loading ? 'Processing Video...' : 'Convert to Notes'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
            <FileText className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-medium text-white mb-4">Notes Created!</h2>
            <p className="text-neutral-400 mb-8">Video has been converted to study notes.</p>
            <Button onClick={generatePractice} className="bg-white text-black hover:bg-neutral-100">
              Generate Practice Questions
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}