import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Upload, Youtube, FileText } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import APNotesGenerator from '@/components/studyhub/APNotesGenerator';
import APUploadPractice from '@/components/studyhub/APUploadPractice';
import APYoutubePractice from '@/components/studyhub/APYoutubePractice';

const TABS = [
  { id: 'notes', label: 'Notes Generator', icon: BookOpen },
  { id: 'upload', label: 'Upload → Practice', icon: Upload },
  { id: 'youtube', label: 'YouTube → Practice', icon: Youtube },
];

export default function APStudyHub() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('notes');

  return (
    <ProtectedRoute>
      <DashboardNavbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <button
            onClick={() => navigate('/Dashboard')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">AP Study Hub</h1>
            <p className="text-gray-500">Generate notes, practice from uploads, or convert YouTube videos into AP-style questions.</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm w-fit">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'notes' && <APNotesGenerator />}
          {activeTab === 'upload' && <APUploadPractice />}
          {activeTab === 'youtube' && <APYoutubePractice />}
        </div>
      </div>
    </ProtectedRoute>
  );
}