import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft, Loader2, Brain, Sparkles, RotateCcw, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from '@/lib/utils';
import StudyTimer from '@/components/study/StudyTimer';

export default function Flashcards() {
  const [user, setUser] = useState(null);
  const [selectedExam, setSelectedExam] = useState('');
  const [generating, setGenerating] = useState(false);
  const [unitName, setUnitName] = useState('');
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
        setSelectedExam(currentUser.primary_exam || currentUser.selected_exams?.[0]);
      } catch (e) {
        // User not authenticated, continue without user
      }
    };
    loadUser();
  }, []);

  const { data: flashcards = [] } = useQuery({
    queryKey: ['flashcards', selectedExam, user?.email],
    queryFn: () => base44.entities.Flashcard.filter({ exam_type: selectedExam, created_by: user.email }),
    enabled: !!selectedExam && !!user,
  });

  const updateCardMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Flashcard.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flashcards'] }),
  });

  const generateFlashcards = async () => {
    if (!unitName || !topics) return;
    
    setGenerating(true);
    try {
      const prompt = `Generate ${cardCount} flashcards for ${selectedExam.replace(/_/g, ' ').toUpperCase()}.

Unit: ${unitName}
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
            exam_type: selectedExam,
            unit_name: unitName,
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
      setUnitName('');
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
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #e8f1f8, #d9e9f5)', fontFamily: 'Georgia, serif' }}>
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => setStudyMode(false)}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Exit Study Mode
            </Button>
            <span className="text-sm text-slate-500">
              {currentCardIndex + 1} / {studyCards.length}
            </span>
          </div>

          <div
            onClick={() => setFlipped(!flipped)}
            className={cn(
              "bg-white rounded-2xl border-2 border-slate-200 p-12 min-h-[400px] flex items-center justify-center cursor-pointer transition-all hover:border-slate-300",
              flipped && "bg-slate-50"
            )}
          >
            <div className="text-center">
              {!flipped ? (
                <>
                  <p className="text-xs uppercase tracking-wider text-slate-500 mb-4">
                    Question
                  </p>
                  <div className="text-xl font-medium text-slate-900 prose prose-slate max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {currentCard.front}
                    </ReactMarkdown>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-wider text-slate-500 mb-4">
                    Answer
                  </p>
                  <div className="text-lg text-slate-700 leading-relaxed prose prose-slate max-w-none">
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
                className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700"
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #e8f1f8, #d9e9f5)', fontFamily: 'Georgia, serif' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Flashcards</h1>
              <p className="text-slate-500">Generate and study with AI flashcards</p>
            </div>
          </div>
          <StudyTimer examType={selectedExam} activityType="flashcards" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-6">
              <h3 className="font-semibold text-slate-900 mb-4">Generate Flashcards</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Unit Name
                  </label>
                  <Input
                    placeholder="e.g., Unit 2: Cell Structure"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Topics
                  </label>
                  <Textarea
                    placeholder="What topics should these cards cover?"
                    value={topics}
                    onChange={(e) => setTopics(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
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
                  disabled={generating || !unitName || !topics}
                  className="w-full"
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
                  <p className="text-sm text-slate-500">
                    {flashcards.length} cards
                  </p>
                  <Button onClick={startStudySession}>
                    <Brain className="w-4 h-4 mr-2" />
                    Start Studying
                  </Button>
                </div>

                <div className="grid gap-3">
                  {flashcards.map((card) => (
                      <div
                        key={card.id}
                        className="bg-white rounded-lg border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs text-slate-500">{card.unit_name}</span>
                          {card.times_reviewed > 0 && (
                            <span className="text-xs text-slate-500">
                              {((card.times_correct / card.times_reviewed) * 100).toFixed(0)}% accuracy
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-slate-900 mb-2">{card.front}</p>
                        <p className="text-sm text-slate-600">{card.back}</p>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <Brain className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-900 mb-2">No flashcards yet</h3>
                <p className="text-slate-500 text-sm">Generate your first set of flashcards</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}