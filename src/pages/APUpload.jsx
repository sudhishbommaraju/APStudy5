import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, Loader2, FileText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function APUpload() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState('');
  const [synthesisType, setSynthesisType] = useState('summary');

  const apSubjects = [
    { id: 'biology', name: 'AP Biology' },
    { id: 'chemistry', name: 'AP Chemistry' },
    { id: 'physics_1', name: 'AP Physics 1' },
    { id: 'physics_2', name: 'AP Physics 2' },
    { id: 'physics_c_mech', name: 'AP Physics C: Mechanics' },
    { id: 'physics_c_em', name: 'AP Physics C: E&M' },
    { id: 'environmental_science', name: 'AP Environmental Science' },
    { id: 'calc_ab', name: 'AP Calculus AB' },
    { id: 'calc_bc', name: 'AP Calculus BC' },
    { id: 'statistics', name: 'AP Statistics' },
    { id: 'cs_a', name: 'AP Computer Science A' },
    { id: 'cs_principles', name: 'AP Computer Science Principles' },
    { id: 'us_history', name: 'AP US History' },
    { id: 'world_history', name: 'AP World History: Modern' },
    { id: 'european_history', name: 'AP European History' },
    { id: 'us_gov', name: 'AP US Government & Politics' },
    { id: 'comp_gov', name: 'AP Comparative Government & Politics' },
    { id: 'macro', name: 'AP Macroeconomics' },
    { id: 'micro', name: 'AP Microeconomics' },
    { id: 'psychology', name: 'AP Psychology' },
    { id: 'human_geo', name: 'AP Human Geography' },
    { id: 'english_lang', name: 'AP English Language & Composition' },
    { id: 'english_lit', name: 'AP English Literature & Composition' },
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUploadAndProcess = async () => {
    if (!file || !subject) {
      toast.error('Please select a file and subject');
      return;
    }

    setLoading(true);
    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // AI-powered extraction and synthesis
      const synthesisInstructions = {
        summary: 'Create a comprehensive summary with key points organized into digestible bullet points. Use clear headings and concise explanations.',
        flashcards: 'Extract 15-25 key terms, concepts, and questions. Format each as:\n\n**Front:** [Question/Term]\n**Back:** [Answer/Definition with brief explanation]\n\nPrioritize high-yield concepts for exam preparation.',
        detailed: 'Provide an in-depth analysis with detailed explanations, examples, and connections between concepts'
      };

      const prompt = `Analyze this AP ${subject} study material and ${synthesisInstructions[synthesisType]}. 
      
Focus on:
- Main concepts and definitions
- Important formulas or theories
- Key examples and applications
- Common mistakes or misconceptions
- Practice recommendations

Format the output as structured markdown notes.`;

      const extractedContent = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [file_url],
        add_context_from_internet: true
      });

      // Extract key concepts
      const conceptsPrompt = `From the following content, extract 5-10 key concepts or terms as a JSON array of strings:\n\n${extractedContent}`;
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

      // Save personalized notes
      const user = await base44.auth.me();
      await base44.entities.StudyNote.create({
        user_email: user.email,
        exam_type: 'AP',
        subject_id: subject,
        title: `${file.name.replace('.pdf', '')} - AI Summary`,
        content: extractedContent,
        key_concepts: conceptsResponse.concepts || []
      });

      // Sync to Notion if connected
      if (user.notion_practice_page) {
        toast.info('Syncing to Notion...');
        // Note: Actual Notion API integration would happen here
        // For now, we're storing the reference and marking as ready for sync
        console.log('Notes ready for Notion sync:', user.notion_practice_page);
      }

      toast.success('Notes processed and saved successfully!');
      navigate(createPageUrl('Dashboard'));
    } catch (error) {
      toast.error('Failed to process file');
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
            <Upload className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-light text-white">Upload & AI-Personalize Notes</h1>
              <p className="text-neutral-400 mt-1">Transform PDFs into personalized study materials</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">AP Subject</label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                  <SelectValue placeholder="Select AP Subject" />
                </SelectTrigger>
                <SelectContent>
                  {apSubjects.map((subj) => (
                    <SelectItem key={subj.id} value={subj.id}>
                      {subj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <SelectItem value="flashcards">Generate Flashcards</SelectItem>
                  <SelectItem value="detailed">Detailed Analysis</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-neutral-500 mt-1">
                {synthesisType === 'flashcards' ? 'Creates Q&A flashcards for active recall' : 'Structured notes for study'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-3">
                Upload PDF File
              </label>
              <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center hover:border-neutral-600 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FileText className="w-12 h-12 text-neutral-500 mx-auto mb-3" />
                  {file ? (
                    <p className="text-white font-medium">{file.name}</p>
                  ) : (
                    <>
                      <p className="text-neutral-300 font-medium mb-1">Click to upload PDF</p>
                      <p className="text-sm text-neutral-500">AI will extract and synthesize key information</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <Button
              onClick={handleUploadAndProcess}
              disabled={loading || !file || !subject}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  AI Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Upload & Personalize
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}