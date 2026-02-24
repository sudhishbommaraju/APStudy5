import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload as UploadIcon, FileText } from 'lucide-react';

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

export default function Upload() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [noteId, setNoteId] = useState(null);

  async function handleUpload() {
    if (!file || !subject) return;

    setLoading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    
    const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          content: { type: "string" }
        }
      }
    });

    const note = await base44.entities.Note.create({
      exam_type: subject,
      unit_name: 'Custom Upload',
      title: file.name,
      content: extracted.output.content,
      is_ai_generated: false
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

        <h1 className="text-4xl font-light text-white mb-12">Upload Notes</h1>

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
                <label className="text-sm text-neutral-400 mb-2 block">Upload File</label>
                <div className="border-2 border-dashed border-neutral-700 rounded-xl p-12 text-center">
                  <input
                    type="file"
                    accept=".pdf,.txt,.docx"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <UploadIcon className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
                    <p className="text-white">{file ? file.name : 'Click to upload'}</p>
                    <p className="text-neutral-500 text-sm mt-2">PDF, TXT, or DOCX</p>
                  </label>
                </div>
              </div>

              <Button
                onClick={handleUpload}
                disabled={!file || !subject || loading}
                className="w-full bg-blue-600 text-white hover:bg-blue-700 py-6"
              >
                {loading ? 'Processing...' : 'Upload & Process Notes'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
            <FileText className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-medium text-white mb-4">Notes Uploaded!</h2>
            <p className="text-neutral-400 mb-8">Your notes have been processed and saved.</p>
            <Button onClick={generatePractice} className="bg-white text-black hover:bg-neutral-100">
              Generate Practice Questions
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}