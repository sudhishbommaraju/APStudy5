import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Upload, Youtube, FileText } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  const cards = [
    {
      icon: Upload,
      title: 'Upload Notes',
      description: 'Upload PDFs or documents to extract structured study notes.',
      route: 'Upload'
    },
    {
      icon: Youtube,
      title: 'Paste YouTube URL',
      description: 'Convert lecture videos into summarized, structured notes.',
      route: 'Youtube'
    },
    {
      icon: FileText,
      title: 'Create Custom Notes',
      description: 'Start from scratch with structured formatting and smart organization.',
      route: 'CreateNotes'
    }
  ];

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white mb-4">
            Notes Workspace
          </h1>
          <p className="text-lg text-neutral-400">
            Upload, generate, or build structured notes instantly.
          </p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                onClick={() => navigate(createPageUrl(card.route))}
                className="bg-neutral-900 border border-neutral-800 hover:border-neutral-600 rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:scale-[1.02]"
              >
                <Icon className="w-8 h-8 mb-6 text-white" />
                <h3 className="text-xl font-medium text-white mb-3">
                  {card.title}
                </h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}