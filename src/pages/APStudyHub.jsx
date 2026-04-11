import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, BookOpen, Upload, Youtube, Sparkles, FileText, Trash2, Search, ChevronRight, Loader2, Brain, Zap, Layers, AlertCircle, X } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import NotesDocumentView from '@/components/studyhub/NotesDocumentView';
import NotesCreateModal from '@/components/studyhub/NotesCreateModal';

export default function APStudyHub() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState(null); // 'ai' | 'upload' | 'youtube'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const saved = await base44.entities.StudyNote.filter({ user_email: user.email }, '-created_date', 50);
      setNotes(saved);
      if (saved.length > 0 && !selectedNote) setSelectedNote(saved[0]);
    } catch (e) {}
    setLoading(false);
  }

  async function deleteNote(id, e) {
    e.stopPropagation();
    await base44.entities.StudyNote.delete(id);
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selectedNote?.id === id) setSelectedNote(notes.find(n => n.id !== id) || null);
  }

  function onNoteCreated(note) {
    setNotes(prev => [note, ...prev]);
    setSelectedNote(note);
    setShowCreate(false);
    setCreateType(null);
  }

  const filtered = notes.filter(n =>
    !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.subject_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <DashboardNavbar />
      <div className="flex h-[calc(100vh-64px)] bg-white overflow-hidden">

        {/* Left Sidebar — Notes List */}
        <div className="w-64 border-r border-gray-200 flex flex-col bg-gray-50 shrink-0">
          <div className="p-3 border-b border-gray-200">
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Note
            </button>
          </div>

          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto py-2">
            {loading ? (
              <div className="flex justify-center mt-8"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No notes yet</p>
                <button onClick={() => setShowCreate(true)} className="mt-3 text-xs text-blue-500 hover:underline font-medium">Create your first note</button>
              </div>
            ) : (
              filtered.map(note => (
                <button
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`w-full text-left px-3 py-3 hover:bg-white border-b border-gray-100 transition-colors group relative ${selectedNote?.id === note.id ? 'bg-white border-l-2 border-l-blue-500' : ''}`}
                >
                  <p className={`text-xs font-semibold truncate leading-tight mb-1 ${selectedNote?.id === note.id ? 'text-blue-700' : 'text-gray-800'}`}>
                    {note.title || 'Untitled'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{note.subject_id || note.exam_type}</p>
                  <button
                    onClick={e => deleteNote(note.id, e)}
                    className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          {selectedNote ? (
            <NotesDocumentView note={selectedNote} onUpdated={loadNotes} />
          ) : (
            <EmptyState onCreate={type => { setCreateType(type); setShowCreate(true); }} />
          )}
        </div>
      </div>

      {showCreate && (
        <NotesCreateModal
          defaultType={createType}
          onClose={() => { setShowCreate(false); setCreateType(null); }}
          onCreated={onNoteCreated}
        />
      )}
    </ProtectedRoute>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-gray-50 px-8">
      <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Your AP Study Notes</h2>
      <p className="text-sm text-gray-400 mb-8 text-center max-w-sm">Generate detailed notes with AI, from a PDF, or from a YouTube video</p>
      <div className="flex gap-3">
        {[
          { type: 'ai', icon: Sparkles, label: 'AI Notes', color: 'bg-blue-500 hover:bg-blue-600' },
          { type: 'upload', icon: Upload, label: 'From PDF', color: 'bg-purple-500 hover:bg-purple-600' },
          { type: 'youtube', icon: Youtube, label: 'From YouTube', color: 'bg-red-500 hover:bg-red-600' },
        ].map(({ type, icon: Icon, label, color }) => (
          <button key={type} onClick={() => onCreate(type)}
            className={`flex items-center gap-2 px-5 py-3 ${color} text-white rounded-xl text-sm font-medium shadow-sm transition-colors`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>
    </div>
  );
}