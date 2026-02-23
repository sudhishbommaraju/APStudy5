import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function PracticeErrorState({ 
  title = 'Session Not Found',
  description = 'Unable to load this practice session.',
  showBackButton = true 
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-3">{title}</h1>
          <p className="text-neutral-400 mb-8 leading-relaxed">{description}</p>

          <div className="space-y-3">
            <Button
              onClick={() => navigate(createPageUrl('Dashboard'))}
              className="w-full bg-white text-black hover:bg-neutral-100 h-11"
            >
              Return to Dashboard
            </Button>
            
            {showBackButton && (
              <button
                onClick={() => window.history.back()}
                className="w-full flex items-center justify-center gap-2 text-neutral-400 hover:text-white transition-colors py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}