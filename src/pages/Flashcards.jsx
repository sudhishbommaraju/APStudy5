import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft, Loader2, Brain, Sparkles, RotateCcw, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from '@/lib/utils';
import StudyTimer from '@/components/study/StudyTimer';

export default function Flashcards() {
  const [user, setUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [generating, setGenerating] = useState(false);
  const [topics, setTopics] = useState('');
  const [cardCount, setCardCount] = useState(10);
  const [studyMode, setStudyMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [studyCards, setStudyCards] = useState([]);

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        // User not authenticated, continue without user
      }
    };
    loadUser();
  }, []);

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list('subject_id'),
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units', selectedSubject],
    queryFn: () => base44.entities.Unit.filter({ subject_id: selectedSubject }),
    enabled: !!selectedSubject,
  });

  const { data: flashcards = [] } = useQuery({
    queryKey: ['flashcards', user?.email],
    queryFn: () => base44.entities.Flashcard.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const updateCardMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Flashcard.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flashcards'] }),
  });

  const generateFlashcards = async () => {
    if (!selectedUnit || !topics) return;
    
    setGenerating(true);
    try {
      const subject = subjects.find(s => s.subject_id === selectedSubject);
      const unit = units.find(u => u.id === selectedUnit);
      
      const prompt = `Generate ${cardCount} flashcards for ${subject?.name || 'general topic'}.

Unit: ${unit?.unit_name || 'General'}
Topics: ${topics}

Create high-quality flashcards that:
- Test key concepts and terminology
- Include both factual recall and conceptual understanding
- Match AP exam difficulty
- Have clear, concise fronts and detailed backs

Return an array of flashcard objects.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            flashcards: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  front: { type: 'string' },
                  back: { type: 'string' },
                  topic: { type: 'string' },
                  difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
                },
                required: ['front', 'back', 'topic'],
              },
            },
          },
          required: ['flashcards'],
        },
      });

      const newCards = await Promise.all(
        response.flashcards.map(card =>
          base44.entities.Flashcard.create({
            exam_type: selectedSubject,
            unit_id: selectedUnit,
            unit_name: unit?.unit_name || 'General',
            front: card.front,
            back: card.back,
            topic: card.topic,
            difficulty: card.difficulty || 'medium',
            is_ai_generated: true,
          })
        )
      );

      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      setStudyCards(newCards);
      setStudyMode(true);
      setSelectedUnit('');
      setTopics('');
    } catch (e) {
      console.error('Failed to generate flashcards:', e);
    }
    setGenerating(false);
  };

  const startStudySession = () => {
    // Already filtered by user at query level
    setStudyCards(flashcards);
    setStudyMode(true);
    setCurrentCardIndex(0);
    setFlipped(false);
  };

  const handleKnew = () => {
    const card = studyCards[currentCardIndex];
    updateCardMutation.mutate({
      id: card.id,
      data: {
        times_reviewed: (card.times_reviewed || 0) + 1,
        times_correct: (card.times_correct || 0) + 1,
      },
    });
    nextCard();
  };

  const handleDidntKnow = () => {
    const card = studyCards[currentCardIndex];
    updateCardMutation.mutate({
      id: card.id,
      data: {
        times_reviewed: (card.times_reviewed || 0) + 1,
      },
    });
    nextCard();
  };

  const nextCard = () => {
    setFlipped(false);
    if (currentCardIndex < studyCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setStudyMode(false);
      setCurrentCardIndex(0);
    }
  };

  const currentCard = studyCards[currentCardIndex];

  if (studyMode && studyCards.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => setStudyMode(false)} className="text-slate-200 hover:text-white">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Exit Study Mode
            </Button>
            <span className="text-sm text-slate-200">
              {currentCardIndex + 1} / {studyCards.length}
            </span>
          </div>

          <div
            onClick={() => setFlipped(!flipped)}
            className={cn(
              "bg-slate-800/40 backdrop-blur-sm rounded-2xl border-2 border-slate-700/50 p-12 min-h-[400px] flex items-center justify-center cursor-pointer transition-all hover:border-violet-500/50",
              flipped && "bg-slate-800/60"
            )}
          >
            <div className="text-center">
              {!flipped ? (
                <>
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-4">
                    Question
                  </p>
                  <div className="text-xl font-medium text-slate-100 prose prose-slate max-w-none prose-invert">
                   <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                     {currentCard.front}
                   </ReactMarkdown>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-4">
                    Answer
                  </p>
                  <div className="text-lg text-slate-300 leading-relaxed prose prose-slate max-w-none prose-invert">
                   <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                     {currentCard.back}
                   </ReactMarkdown>
                  </div>
                </>
              )}
            </div>
          </div>

          {flipped && (
            <div className="flex gap-4 mt-6">
              <Button
                onClick={handleDidntKnow}
                variant="outline"
                className="flex-1 h-14 border-rose-200 hover:bg-rose-50"
              >
                <X className="w-5 h-5 mr-2 text-rose-600" />
                Didn't Know
              </Button>
              <Button
                onClick={handleKnew}
                className="flex-1 h-14 bg-emerald-500 hover:bg-emerald-600"
              >
                <Check className="w-5 h-5 mr-2" />
                Knew It
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Flashcards</h1>
          <p className="page-description">Generate and study AI flashcards for any subject</p>
        </div>
        <StudyTimer examType={selectedSubject} activityType="flashcards" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 sticky top-6">
              <h3 className="font-semibold text-slate-100 mb-4">Generate Flashcards</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">
                    Subject
                  </label>
                  <Select value={selectedSubject} onValueChange={(value) => {
                    setSelectedSubject(value);
                    setSelectedUnit('');
                  }}>
                    <SelectTrigger className="w-full bg-slate-900/50 border-slate-700/50 text-slate-200">
                      <SelectValue placeholder="Choose a subject" />
                    </SelectTrigger>
                    <SelectContent className="max-h-96 bg-slate-900/95 backdrop-blur-xl border-slate-700/50">
                      {(() => {
                        const uniqueSubjects = Array.from(
                          new Map(subjects.map(s => [s.subject_id, s])).values()
                        );
                        const grouped = uniqueSubjects.reduce((acc, subject) => {
                          const category = subject.category;
                          if (!acc[category]) acc[category] = [];
                          acc[category].push(subject);
                          return acc;
                        }, {});
                        
                        return Object.entries(grouped).map(([category, categorySubjects]) => (
                          <div key={category}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              {category}
                            </div>
                            {categorySubjects.map((subject) => (
                              <SelectItem key={subject.subject_id} value={subject.subject_id} className="text-slate-200 focus:bg-slate-800/50 focus:text-white">
                                <div className="flex items-center gap-2">
                                  {subject.icon && <span>{subject.icon}</span>}
                                  <span>{subject.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>
                {selectedSubject && (
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1 block">
                      Unit
                    </label>
                    <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                      <SelectTrigger className="w-full bg-slate-900/50 border-slate-700/50 text-slate-200">
                        <SelectValue placeholder="Choose a unit" />
                      </SelectTrigger>
                      <SelectContent className="max-h-96 bg-slate-900/95 backdrop-blur-xl border-slate-700/50">
                        {units.sort((a, b) => a.unit_number - b.unit_number).map((unit) => (
                          <SelectItem key={unit.id} value={unit.id} className="text-slate-200 focus:bg-slate-800/50 focus:text-white">
                            Unit {unit.unit_number}: {unit.unit_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">
                    Topics
                  </label>
                  <Textarea
                    placeholder="What topics should these cards cover?"
                    value={topics}
                    onChange={(e) => setTopics(e.target.value)}
                    rows={3}
                    className="text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">
                    Number of Cards: {cardCount}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={cardCount}
                    onChange={(e) => setCardCount(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={generateFlashcards}
                  disabled={generating || !selectedUnit || !topics}
                  className="w-full bg-violet-600 hover:bg-violet-700"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Cards
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {flashcards.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-slate-400">
                    {flashcards.length} cards
                  </p>
                  <Button onClick={startStudySession} className="bg-violet-600 hover:bg-violet-700">
                    <Brain className="w-4 h-4 mr-2" />
                    Start Studying
                  </Button>
                </div>

                <div className="grid gap-3">
                  {flashcards.map((card) => (
                      <div
                        key={card.id}
                        className="bg-slate-800/40 backdrop-blur-sm rounded-lg border border-slate-700/50 p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs text-slate-400">{card.unit_name}</span>
                          {card.times_reviewed > 0 && (
                            <span className="text-xs text-slate-400">
                              {((card.times_correct / card.times_reviewed) * 100).toFixed(0)}% accuracy
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-slate-100 mb-2">{card.front}</p>
                        <p className="text-sm text-slate-300">{card.back}</p>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-12 text-center">
                <Brain className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-100 mb-2">No flashcards yet</h3>
                <p className="text-slate-400 text-sm">Generate your first set of flashcards</p>
              </div>
            )}
        </div>
      </div>
    </>
  );
}