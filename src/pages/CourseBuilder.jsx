import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, BookOpen, Target, CheckCircle, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CourseBuilder() {
  const [user, setUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseDepth, setCourseDepth] = useState('intermediate');
  const [moduleCount, setModuleCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCourse, setGeneratedCourse] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        console.error('Failed to load user:', e);
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

  const createCourseMutation = useMutation({
    mutationFn: (courseData) => base44.entities.Course.create(courseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setGeneratedCourse(null);
      setCourseTitle('');
      setCourseDescription('');
      alert('Course created successfully!');
    },
  });

  const generateCourse = async () => {
    if (!selectedSubject || !courseTitle) {
      alert('Please select a subject and provide a course title');
      return;
    }

    setIsGenerating(true);

    try {
      const subject = subjects.find(s => s.subject_id === selectedSubject);
      
      const prompt = `You are an expert curriculum designer. Create a comprehensive course structure for: "${courseTitle}"

Subject: ${subject.name}
Description: ${courseDescription || 'Comprehensive course'}
Depth Level: ${courseDepth} (beginner/intermediate/advanced)
Number of Modules: ${moduleCount}

Available Units from curriculum: ${units.map(u => u.unit_name).join(', ')}

Create a structured course with:
1. ${moduleCount} main modules, each with 3-5 lessons
2. Each lesson should have: title, description, key concepts (array), learning objectives (array), estimated_minutes
3. Each module should have a quiz with 5 questions
4. Practice questions for each module (5 per module)

Return ONLY valid JSON matching this exact structure:
{
  "modules": [
    {
      "module_number": 1,
      "module_title": "string",
      "module_description": "string",
      "lessons": [
        {
          "lesson_number": 1,
          "lesson_title": "string",
          "description": "string",
          "key_concepts": ["string"],
          "learning_objectives": ["string"],
          "estimated_minutes": 30
        }
      ],
      "quiz_questions": [
        {
          "question": "string",
          "options": ["A", "B", "C", "D"],
          "correct_answer": "A",
          "explanation": "string"
        }
      ],
      "practice_questions": [
        {
          "question": "string",
          "difficulty": "easy/medium/hard",
          "skill": "string"
        }
      ]
    }
  ],
  "total_questions": 0,
  "estimated_hours": 0
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            modules: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  module_number: { type: 'number' },
                  module_title: { type: 'string' },
                  module_description: { type: 'string' },
                  lessons: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        lesson_number: { type: 'number' },
                        lesson_title: { type: 'string' },
                        description: { type: 'string' },
                        key_concepts: { type: 'array', items: { type: 'string' } },
                        learning_objectives: { type: 'array', items: { type: 'string' } },
                        estimated_minutes: { type: 'number' }
                      }
                    }
                  },
                  quiz_questions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        question: { type: 'string' },
                        options: { type: 'array', items: { type: 'string' } },
                        correct_answer: { type: 'string' },
                        explanation: { type: 'string' }
                      }
                    }
                  },
                  practice_questions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        question: { type: 'string' },
                        difficulty: { type: 'string' },
                        skill: { type: 'string' }
                      }
                    }
                  }
                }
              }
            },
            total_questions: { type: 'number' },
            estimated_hours: { type: 'number' }
          }
        }
      });

      setGeneratedCourse(response);
    } catch (e) {
      console.error('Failed to generate course:', e);
      alert('Failed to generate course. Please try again.');
    }

    setIsGenerating(false);
  };

  const saveCourse = async () => {
    if (!generatedCourse) return;

    const courseData = {
      title: courseTitle,
      description: courseDescription,
      subject_id: selectedSubject,
      subject_name: subjects.find(s => s.subject_id === selectedSubject)?.name,
      modules: generatedCourse.modules,
      total_questions: generatedCourse.total_questions,
      estimated_hours: generatedCourse.estimated_hours,
      difficulty_level: courseDepth,
      is_published: true,
      created_by: user.email,
    };

    createCourseMutation.mutate(courseData);
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Course Builder</h1>
        <p className="page-description">Create AI-powered courses with structured lessons and quizzes</p>
      </div>

      <div className="space-y-6">
        {!generatedCourse ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
          >
            <div className="space-y-4">
              {/* Subject Selection */}
              <div>
                <label className="text-sm font-medium text-slate-200 mb-2 block">Subject</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-700/50 text-slate-200">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {subjects.map((subject) => (
                      <SelectItem key={subject.subject_id} value={subject.subject_id} className="text-slate-200">
                        {subject.icon} {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Course Title */}
              <div>
                <label className="text-sm font-medium text-slate-200 mb-2 block">Course Title</label>
                <Input
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g., Complete AP Calculus AB Prep"
                  className="bg-slate-900/50 border-slate-700/50 text-slate-200"
                />
              </div>

              {/* Course Description */}
              <div>
                <label className="text-sm font-medium text-slate-200 mb-2 block">Description (Optional)</label>
                <Textarea
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  placeholder="Describe what this course covers..."
                  className="bg-slate-900/50 border-slate-700/50 text-slate-200"
                />
              </div>

              {/* Depth Level */}
              <div>
                <label className="text-sm font-medium text-slate-200 mb-2 block">Course Depth</label>
                <Select value={courseDepth} onValueChange={setCourseDepth}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-700/50 text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="beginner" className="text-slate-200">Beginner - Foundations</SelectItem>
                    <SelectItem value="intermediate" className="text-slate-200">Intermediate - Standard Curriculum</SelectItem>
                    <SelectItem value="advanced" className="text-slate-200">Advanced - Deep Dive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Module Count */}
              <div>
                <label className="text-sm font-medium text-slate-200 mb-2 block">Number of Modules</label>
                <div className="flex gap-2">
                  {[3, 5, 8, 10].map((count) => (
                    <button
                      key={count}
                      onClick={() => setModuleCount(count)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        moduleCount === count
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-900/50 text-slate-300 hover:bg-slate-900/70 border border-slate-700/50'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={generateCourse}
                disabled={isGenerating || !selectedSubject || !courseTitle}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Course...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Course
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Course Overview */}
            <div className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-xl border border-violet-500/30 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-100 mb-2">{courseTitle}</h2>
                  <p className="text-slate-300">{courseDescription}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-slate-800/60 rounded-lg">
                  <div className="text-2xl font-bold text-violet-400">{generatedCourse.modules.length}</div>
                  <div className="text-xs text-slate-400">Modules</div>
                </div>
                <div className="text-center p-3 bg-slate-800/60 rounded-lg">
                  <div className="text-2xl font-bold text-violet-400">{generatedCourse.total_questions}</div>
                  <div className="text-xs text-slate-400">Questions</div>
                </div>
                <div className="text-center p-3 bg-slate-800/60 rounded-lg">
                  <div className="text-2xl font-bold text-violet-400">{generatedCourse.estimated_hours}h</div>
                  <div className="text-xs text-slate-400">Est. Time</div>
                </div>
              </div>
            </div>

            {/* Modules Preview */}
            <div className="space-y-4">
              {generatedCourse.modules.map((module, idx) => (
                <div key={idx} className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-5">
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">
                    Module {module.module_number}: {module.module_title}
                  </h3>
                  <p className="text-sm text-slate-400 mb-3">{module.module_description}</p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <BookOpen className="w-4 h-4" />
                      {module.lessons?.length || 0} Lessons
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Target className="w-4 h-4" />
                      {module.quiz_questions?.length || 0} Quiz Questions
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Plus className="w-4 h-4" />
                      {module.practice_questions?.length || 0} Practice
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => setGeneratedCourse(null)}
                variant="outline"
                className="flex-1"
              >
                Generate New Course
              </Button>
              <Button
                onClick={saveCourse}
                disabled={createCourseMutation.isLoading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {createCourseMutation.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save Course
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}