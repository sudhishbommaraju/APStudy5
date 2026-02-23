import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ArrowLeft, FileText, Sparkles } from 'lucide-react';
import { generateStudyNotes } from '@/components/engine/AIExplanationEngine';
import ReactMarkdown from 'react-markdown';

export default function EngineNotes() {
  const navigate = useNavigate();
  const [examType, setExamType] = useState('SAT');
  const [subjects, setSubjects] = useState([]);
  const [domains, setDomains] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [topicName, setTopicName] = useState('');
  const [generatedNote, setGeneratedNote] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [savedNotes, setSavedNotes] = useState([]);

  useEffect(() => {
    loadData();
  }, [examType]);

  useEffect(() => {
    if (selectedSubject) {
      loadUnits();
    }
  }, [selectedSubject]);

  async function loadData() {
    const user = await base44.auth.me();
    
    if (examType === 'AP') {
      const apSubjects = await base44.entities.APSubject.list();
      setSubjects(apSubjects);
    } else {
      const exams = await base44.entities.Exam.filter({ exam_type: examType });
      if (exams.length > 0) {
        const domainList = await base44.entities.Domain.filter({ exam_id: exams[0].id });
        setDomains(domainList);
      }
    }

    const notes = await base44.entities.StudyNote.filter({
      user_email: user.email,
      exam_type: examType
    });
    setSavedNotes(notes);
  }

  async function loadUnits() {
    const unitList = await base44.entities.APUnit.filter({ subject_id: selectedSubject });
    setUnits(unitList.sort((a, b) => a.order_index - b.order_index));
  }

  async function generateNotes() {
    setGenerating(true);
    const note = await generateStudyNotes({
      examType,
      subjectId: selectedSubject,
      domainId: selectedDomain,
      unitId: selectedUnit,
      topicName: topicName || 'General Overview'
    });
    setGeneratedNote(note);
    setGenerating(false);
    loadData();
  }

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-6xl mx-auto px-6">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('EngineHome'))}
          className="mb-8 text-neutral-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-12">
          <h1 className="text-3xl font-light text-white mb-2">AI Study Notes</h1>
          <p className="text-neutral-400">Generate comprehensive notes for any topic</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generator */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
            <h2 className="text-xl font-medium text-white mb-6">Generate Notes</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-neutral-400 mb-2 block">Exam Type</label>
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger className="bg-black border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAT">SAT</SelectItem>
                    <SelectItem value="ACT">ACT</SelectItem>
                    <SelectItem value="AP">AP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {examType === 'AP' ? (
                <>
                  <div>
                    <label className="text-sm text-neutral-400 mb-2 block">AP Subject</label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger className="bg-black border-neutral-700 text-white">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedSubject && (
                    <div>
                      <label className="text-sm text-neutral-400 mb-2 block">Unit (optional)</label>
                      <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                        <SelectTrigger className="bg-black border-neutral-700 text-white">
                          <SelectValue placeholder="All units" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>All units</SelectItem>
                          {units.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              Unit {u.order_index}: {u.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="text-sm text-neutral-400 mb-2 block">Domain</label>
                  <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                    <SelectTrigger className="bg-black border-neutral-700 text-white">
                      <SelectValue placeholder="Select domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {domains.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm text-neutral-400 mb-2 block">Topic Name</label>
                <Input
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="e.g., Quadratic Functions"
                  className="bg-black border-neutral-700 text-white"
                />
              </div>

              <Button
                onClick={generateNotes}
                disabled={generating || (!selectedSubject && !selectedDomain)}
                className="w-full bg-purple-600 text-white hover:bg-purple-700 py-6"
              >
                {generating ? (
                  'Generating...'
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Study Notes
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Saved Notes */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
            <h2 className="text-xl font-medium text-white mb-6">Saved Notes</h2>
            {savedNotes.length === 0 ? (
              <div className="text-center py-12 text-neutral-400">
                No notes yet. Generate your first one!
              </div>
            ) : (
              <div className="space-y-3">
                {savedNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => setGeneratedNote(note)}
                    className="bg-neutral-800/50 rounded-xl p-4 cursor-pointer hover:bg-neutral-800 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-purple-400 mt-1" />
                      <div className="flex-1">
                        <div className="text-white font-medium mb-1">{note.title}</div>
                        <div className="text-xs text-neutral-400">
                          {note.key_concepts?.length || 0} key concepts
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Generated Note Display */}
        {generatedNote && (
          <div className="mt-8 bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-medium text-white">{generatedNote.title}</h2>
              <Button
                onClick={() => setGeneratedNote(null)}
                variant="ghost"
                className="text-neutral-400"
              >
                Close
              </Button>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{generatedNote.content}</ReactMarkdown>
            </div>

            {generatedNote.key_concepts?.length > 0 && (
              <div className="mt-8 bg-neutral-800/50 rounded-xl p-6">
                <h3 className="text-lg font-medium text-white mb-4">Key Concepts</h3>
                <div className="flex flex-wrap gap-2">
                  {generatedNote.key_concepts.map((concept, idx) => (
                    <span
                      key={idx}
                      className="bg-purple-900/30 text-purple-400 px-3 py-1 rounded-full text-sm"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}