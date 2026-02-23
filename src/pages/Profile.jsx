import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardNavbar from '@/components/layout/DashboardNavbar';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    target_score: '',
    exam_goal: '',
    grade_level: '',
    study_frequency: ''
  });

  const apSubjects = [
    'AP Biology', 'AP Chemistry', 'AP Physics', 'AP Calculus AB', 'AP Calculus BC',
    'AP Statistics', 'AP Computer Science A', 'AP US History', 'AP World History',
    'AP Psychology', 'AP English Language', 'AP English Literature'
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await base44.auth.me();
      setFormData({
        full_name: user.full_name || '',
        target_score: user.target_score || '',
        exam_goal: user.exam_goal || '',
        grade_level: user.grade_level || '',
        study_frequency: user.study_frequency || ''
      });
    } catch (error) {
      toast.error('Failed to load profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      await base44.auth.updateMe({
        full_name: formData.full_name,
        target_score: formData.target_score,
        exam_goal: formData.exam_goal,
        grade_level: formData.grade_level,
        study_frequency: formData.study_frequency
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <DashboardNavbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-white">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black">
        <DashboardNavbar />

        <div className="max-w-2xl mx-auto px-6 py-12">
          {/* Header */}
          <button
            onClick={() => navigate(createPageUrl('Dashboard'))}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <h1 className="text-3xl font-light text-white mb-8">Profile Settings</h1>

          {/* Profile Form */}
          <div className="space-y-6 bg-neutral-900 border border-neutral-800 rounded-lg p-8">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Name
              </label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="bg-neutral-800 border-neutral-700 text-white"
                placeholder="Your full name"
              />
            </div>

            {/* Email (readonly) */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Email
              </label>
              <div className="px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-neutral-400 text-sm">
                {formData.email}
              </div>
              <p className="text-xs text-neutral-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Exam Goal */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Exam Focus
              </label>
              <Select value={formData.exam_goal} onValueChange={(val) => setFormData({ ...formData, exam_goal: val })}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAT">SAT</SelectItem>
                  <SelectItem value="ACT">ACT</SelectItem>
                  <SelectItem value="AP">AP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Score */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Target Score
              </label>
              <Input
                value={formData.target_score}
                onChange={(e) => setFormData({ ...formData, target_score: e.target.value })}
                className="bg-neutral-800 border-neutral-700 text-white"
                placeholder="e.g., 1500 for SAT, 35 for ACT, 5 for AP"
              />
            </div>

            {/* Grade Level */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Grade Level
              </label>
              <Select value={formData.grade_level} onValueChange={(val) => setFormData({ ...formData, grade_level: val })}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                  <SelectValue placeholder="Select grade level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9">9th Grade</SelectItem>
                  <SelectItem value="10">10th Grade</SelectItem>
                  <SelectItem value="11">11th Grade</SelectItem>
                  <SelectItem value="12">12th Grade</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Study Frequency */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Study Frequency per Week
              </label>
              <Select value={formData.study_frequency} onValueChange={(val) => setFormData({ ...formData, study_frequency: val })}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-2">1-2 hours per week</SelectItem>
                  <SelectItem value="3-5">3-5 hours per week</SelectItem>
                  <SelectItem value="5-10">5-10 hours per week</SelectItem>
                  <SelectItem value="10+">10+ hours per week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-white text-black hover:bg-neutral-100 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {/* Info */}
          <p className="text-xs text-neutral-500 mt-8 text-center">
            Changes are saved automatically. Update your profile to help us personalize your experience.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}