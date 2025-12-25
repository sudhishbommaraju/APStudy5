import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export default function CreateStudyPlanModal({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [targetDate, setTargetDate] = useState('');
  const [questionsTarget, setQuestionsTarget] = useState(50);

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

  const createPlanMutation = useMutation({
    mutationFn: (planData) => base44.entities.StudyPlan.create(planData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyPlans'] });
      resetForm();
      onOpenChange(false);
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedSubject('');
    setSelectedUnits([]);
    setTargetDate('');
    setQuestionsTarget(50);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title || !selectedSubject) {
      alert('Please provide a title and select a subject');
      return;
    }

    const subject = subjects.find(s => s.subject_id === selectedSubject);
    
    createPlanMutation.mutate({
      title,
      description,
      subject_id: selectedSubject,
      subject_name: subject?.name || '',
      unit_ids: selectedUnits,
      target_date: targetDate || null,
      total_questions_target: questionsTarget,
      questions_completed: 0,
      practice_sessions_completed: 0,
      status: 'active',
    });
  };

  const toggleUnit = (unitId) => {
    setSelectedUnits(prev => 
      prev.includes(unitId) 
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-xl border-slate-700/50">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Create Study Plan</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <Label className="text-slate-200">Plan Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., AP Calculus Final Prep"
              className="bg-slate-800/50 border-slate-700/50 text-slate-200"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-slate-200">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this plan for?"
              className="bg-slate-800/50 border-slate-700/50 text-slate-200 h-20"
            />
          </div>

          {/* Subject */}
          <div>
            <Label className="text-slate-200">Subject *</Label>
            <Select value={selectedSubject} onValueChange={(value) => {
              setSelectedSubject(value);
              setSelectedUnits([]);
            }}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-slate-200">
                <SelectValue placeholder="Choose a subject" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-slate-700/50">
                {Array.from(new Map(subjects.map(s => [s.subject_id, s])).values()).map((subject) => (
                  <SelectItem key={subject.subject_id} value={subject.subject_id} className="text-slate-200">
                    <div className="flex items-center gap-2">
                      {subject.icon && <span>{subject.icon}</span>}
                      <span>{subject.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Units */}
          {selectedSubject && units.length > 0 && (
            <div>
              <Label className="text-slate-200 mb-2 block">Units to Cover</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                {units.sort((a, b) => a.unit_number - b.unit_number).map((unit) => (
                  <div key={unit.id} className="flex items-center gap-2">
                    <Checkbox
                      id={unit.id}
                      checked={selectedUnits.includes(unit.id)}
                      onCheckedChange={() => toggleUnit(unit.id)}
                    />
                    <label
                      htmlFor={unit.id}
                      className="text-sm text-slate-300 cursor-pointer"
                    >
                      Unit {unit.unit_number}: {unit.unit_name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Target Date */}
          <div>
            <Label className="text-slate-200">Target Completion Date</Label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="bg-slate-800/50 border-slate-700/50 text-slate-200"
            />
          </div>

          {/* Questions Target */}
          <div>
            <Label className="text-slate-200">Questions Target</Label>
            <Input
              type="number"
              value={questionsTarget}
              onChange={(e) => setQuestionsTarget(parseInt(e.target.value) || 0)}
              min="1"
              className="bg-slate-800/50 border-slate-700/50 text-slate-200"
            />
            <p className="text-xs text-slate-400 mt-1">How many questions you want to complete in this plan</p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createPlanMutation.isPending}
              className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600"
            >
              {createPlanMutation.isPending ? 'Creating...' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}