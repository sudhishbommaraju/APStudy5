import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Folder, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
];

export default function CourseManager({ courses, onCoursesUpdated, userEmail }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setLoading(true);
    try {
      await base44.entities.Course.create({
        user_email: userEmail,
        title,
        color,
        order: courses.length,
      });
      setTitle('');
      setColor(COLORS[0]);
      setShowForm(false);
      onCoursesUpdated?.();
    } catch (e) {
      console.error('Failed to create course:', e);
    }
    setLoading(false);
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Delete this course? Notes will remain.')) return;
    try {
      await base44.entities.Course.delete(courseId);
      onCoursesUpdated?.();
    } catch (e) {
      console.error('Failed to delete course:', e);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">My Courses</h2>
        {!showForm && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowForm(true)}
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> New Course
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Course name (e.g., Spring 2026 AP Biology)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex gap-2 mb-3">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  backgroundColor: c,
                  borderWidth: color === c ? 3 : 1,
                  borderColor: color === c ? '#1F2937' : '#D1D5DB',
                }}
                className="w-6 h-6 rounded-full transition-all"
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !title.trim()} size="sm">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {courses.map(course => (
          <div
            key={course.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:shadow-sm transition-all"
            style={{ borderLeftColor: course.color, borderLeftWidth: 4 }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: course.color + '20' }}
            >
              <Folder className="w-5 h-5" style={{ color: course.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{course.title}</p>
              {course.semester && <p className="text-xs text-gray-500">{course.semester}</p>}
            </div>
            <button
              onClick={() => handleDelete(course.id)}
              className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {courses.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 text-center py-4">No courses yet. Create one to organize your notes!</p>
      )}
    </div>
  );
}