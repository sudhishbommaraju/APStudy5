import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Plus, Sparkles, Target, Clock, Award, Loader2, Trophy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

export default function Courses() {
  const [user, setUser] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ 
    title: '', 
    description: '', 
    subject_id: '', 
    difficulty_level: 'intermediate',
    learning_objectives: '',
    specific_units: [],
    specific_skills: [],
    assessment_types: []
  });
  const [isGenerating, setIsGenerating] = useState(false);
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

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.filter({ is_published: true }),
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list('subject_id'),
  });

  const { data: allUnits = [] } = useQuery({
    queryKey: ['units', newCourse.subject_id],
    queryFn: () => base44.entities.Unit.filter({ subject_id: newCourse.subject_id }),
    enabled: !!newCourse.subject_id,
  });

  const { data: allSkills = [] } = useQuery({
    queryKey: ['skills', newCourse.subject_id],
    queryFn: () => base44.entities.Skill.filter({ subject_id: newCourse.subject_id }),
    enabled: !!newCourse.subject_id,
  });

  const { data: myEnrollments = [] } = useQuery({
    queryKey: ['enrollments', user?.email],
    queryFn: () => base44.entities.CourseEnrollment.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const createCourseMutation = useMutation({
    mutationFn: async (courseData) => {
      return await base44.entities.Course.create(courseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setCreateDialogOpen(false);
      setNewCourse({ title: '', description: '', subject_id: '', difficulty_level: 'intermediate' });
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async (courseId) => {
      return await base44.entities.CourseEnrollment.create({
        course_id: courseId,
        user_email: user.email,
        started_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });

  const handleGenerateCourse = async () => {
    if (!newCourse.subject_id || !newCourse.title) {
      alert('Please fill in subject and title');
      return;
    }

    setIsGenerating(true);

    try {
      const subject = subjects.find(s => s.subject_id === newCourse.subject_id);
      const units = await base44.entities.Unit.filter({ subject_id: newCourse.subject_id });
      const skills = await base44.entities.Skill.filter({ subject_id: newCourse.subject_id });

      const specificUnits = newCourse.specific_units.length > 0 
        ? units.filter(u => newCourse.specific_units.includes(u.id))
        : units;
      
      const specificSkills = newCourse.specific_skills.length > 0
        ? skills.filter(s => newCourse.specific_skills.includes(s.id))
        : skills;

      const assessmentTypes = newCourse.assessment_types.length > 0
        ? newCourse.assessment_types
        : ['quiz', 'practice'];

      const prompt = `Generate a structured course for: ${newCourse.title}
Subject: ${subject.name}
Difficulty: ${newCourse.difficulty_level}
Description: ${newCourse.description}

${newCourse.learning_objectives ? `Learning Objectives:\n${newCourse.learning_objectives}\n` : ''}

Units to Include: ${specificUnits.map(u => u.unit_name).join(', ')}
Skills to Cover: ${specificSkills.slice(0, 20).map(s => s.skill_name).join(', ')}
Assessment Types to Use: ${assessmentTypes.join(', ')}

Create a course with 5-8 modules. Each module should have:
- Module title
- Learning objectives (3-5 bullets, aligned with course objectives)
- Topics to cover
- Assessment type (${assessmentTypes.join(' or ')})
- Practice question count
- Estimated time
- Badge criteria for completion

Return as JSON array of modules with structure:
{
  "title": "string",
  "objectives": ["string"],
  "topics": ["string"],
  "assessment_type": "string",
  "practice_questions": number,
  "estimated_hours": number,
  "completion_badge": "string"
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
                  title: { type: 'string' },
                  objectives: { type: 'array', items: { type: 'string' } },
                  topics: { type: 'array', items: { type: 'string' } },
                  assessment_type: { type: 'string' },
                  practice_questions: { type: 'number' },
                  estimated_hours: { type: 'number' },
                  completion_badge: { type: 'string' },
                },
              },
            },
          },
        },
      });

      const totalQuestions = response.modules.reduce((sum, m) => sum + m.practice_questions, 0);
      const totalHours = response.modules.reduce((sum, m) => sum + m.estimated_hours, 0);

      await createCourseMutation.mutateAsync({
        title: newCourse.title,
        description: newCourse.description,
        subject_id: newCourse.subject_id,
        subject_name: subject.name,
        unit_ids: units.map(u => u.id),
        skill_ids: skills.map(s => s.id),
        modules: response.modules,
        total_questions: totalQuestions,
        estimated_hours: totalHours,
        difficulty_level: newCourse.difficulty_level,
        is_published: true,
        created_by: user.email,
      });

      alert('Course created successfully!');
    } catch (e) {
      console.error('Failed to generate course:', e);
      alert('Failed to generate course. Please try again.');
    }

    setIsGenerating(false);
  };

  const enrolledCourseIds = myEnrollments.map(e => e.course_id);
  const availableCourses = courses.filter(c => !enrolledCourseIds.includes(c.id));
  const myCourses = courses.filter(c => enrolledCourseIds.includes(c.id));

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Courses</h1>
        <p className="page-description">Structured learning paths with gamification</p>
      </div>

      <div className="space-y-6">
        {/* Create Course (Admin/Teacher) */}
        {user?.role === 'admin' && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4 mr-2" />
                Create AI-Generated Course
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-slate-100">Create New Course</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Course Title</label>
                  <Input
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    placeholder="e.g., Complete AP Calculus AB Course"
                    className="bg-slate-900 border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Subject</label>
                  <Select value={newCourse.subject_id} onValueChange={(v) => setNewCourse({ ...newCourse, subject_id: v })}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {subjects.map(s => (
                        <SelectItem key={s.subject_id} value={s.subject_id} className="text-slate-200">
                          {s.icon} {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Difficulty Level</label>
                  <Select value={newCourse.difficulty_level} onValueChange={(v) => setNewCourse({ ...newCourse, difficulty_level: v })}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      <SelectItem value="beginner" className="text-slate-200">Beginner</SelectItem>
                      <SelectItem value="intermediate" className="text-slate-200">Intermediate</SelectItem>
                      <SelectItem value="advanced" className="text-slate-200">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Description</label>
                  <Textarea
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    placeholder="What will students learn?"
                    className="bg-slate-900 border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Learning Objectives (Optional)</label>
                  <Textarea
                    value={newCourse.learning_objectives}
                    onChange={(e) => setNewCourse({ ...newCourse, learning_objectives: e.target.value })}
                    placeholder="Enter specific learning objectives, one per line"
                    className="bg-slate-900 border-slate-700 text-slate-100 h-24"
                  />
                </div>
                {newCourse.subject_id && allUnits.length > 0 && (
                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Specific Units to Include (Optional)</label>
                    <div className="max-h-32 overflow-y-auto bg-slate-900/50 rounded-lg p-2 border border-slate-700">
                      {allUnits.map(unit => (
                        <label key={unit.id} className="flex items-center gap-2 p-1 hover:bg-slate-800/50 rounded">
                          <input
                            type="checkbox"
                            checked={newCourse.specific_units.includes(unit.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewCourse({ ...newCourse, specific_units: [...newCourse.specific_units, unit.id] });
                              } else {
                                setNewCourse({ ...newCourse, specific_units: newCourse.specific_units.filter(id => id !== unit.id) });
                              }
                            }}
                            className="w-3 h-3"
                          />
                          <span className="text-xs text-slate-300">{unit.unit_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {newCourse.subject_id && allSkills.length > 0 && (
                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Specific Skills to Include (Optional)</label>
                    <div className="max-h-32 overflow-y-auto bg-slate-900/50 rounded-lg p-2 border border-slate-700">
                      {allSkills.slice(0, 30).map(skill => (
                        <label key={skill.id} className="flex items-center gap-2 p-1 hover:bg-slate-800/50 rounded">
                          <input
                            type="checkbox"
                            checked={newCourse.specific_skills.includes(skill.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewCourse({ ...newCourse, specific_skills: [...newCourse.specific_skills, skill.id] });
                              } else {
                                setNewCourse({ ...newCourse, specific_skills: newCourse.specific_skills.filter(id => id !== skill.id) });
                              }
                            }}
                            className="w-3 h-3"
                          />
                          <span className="text-xs text-slate-300">{skill.skill_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Assessment Types</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['quiz', 'practice', 'project', 'coding_challenge'].map(type => (
                      <label key={type} className="flex items-center gap-2 p-2 bg-slate-900/50 hover:bg-slate-800/50 rounded border border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newCourse.assessment_types.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewCourse({ ...newCourse, assessment_types: [...newCourse.assessment_types, type] });
                            } else {
                              setNewCourse({ ...newCourse, assessment_types: newCourse.assessment_types.filter(t => t !== type) });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-slate-300 capitalize">{type.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button onClick={handleGenerateCourse} disabled={isGenerating} className="w-full">
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Course with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Course
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* My Courses */}
        {myCourses.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-slate-100 mb-4">My Courses</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {myCourses.map((course) => {
                const enrollment = myEnrollments.find(e => e.course_id === course.id);
                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5 hover:border-violet-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-100">{course.title}</h3>
                        <p className="text-sm text-slate-400 mt-1">{course.subject_name}</p>
                      </div>
                      <span className="px-2 py-1 bg-violet-500/20 text-violet-300 text-xs rounded">
                        {course.difficulty_level}
                      </span>
                    </div>
                    <Progress value={enrollment?.progress_percentage || 0} className="mb-3" />
                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {course.modules?.length || 0} modules
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {course.estimated_hours}h
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {enrollment?.progress_percentage || 0}%
                      </span>
                    </div>
                    <Button size="sm" className="w-full">Continue Learning</Button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Courses */}
        {availableCourses.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-slate-100 mb-4">Available Courses</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {availableCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-100">{course.title}</h3>
                      <p className="text-sm text-slate-400 mt-1">{course.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                    <span>{course.modules?.length || 0} modules</span>
                    <span>{course.estimated_hours}h</span>
                    <span className="capitalize">{course.difficulty_level}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => enrollMutation.mutate(course.id)}
                    disabled={enrollMutation.isLoading}
                    className="w-full"
                  >
                    Enroll Now
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {myCourses.length === 0 && availableCourses.length === 0 && (
          <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-12 text-center">
            <BookOpen className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No courses available yet</p>
            <p className="text-sm text-slate-500 mt-2">Check back soon for new courses!</p>
          </div>
        )}
      </div>
    </>
  );
}