import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * ERROR BOUNDARY FOR PRACTICE GENERATION
 * Prevents blank screens - always shows actionable UI
 */

export default function GenerationErrorBoundary({ error, onRetry, onCancel }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md bg-rose-50 border-2 border-rose-300 rounded-2xl p-8 text-center">
        <AlertCircle className="w-20 h-20 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-rose-800 mb-3">
          Generation Failed
        </h2>
        <p className="text-slate-700 mb-6">
          {error || 'We couldn\'t generate valid practice questions right now. This might be due to temporary issues with the AI service.'}
        </p>
        
        <div className="flex gap-3">
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 border-slate-300"
            >
              Go Back
            </Button>
          )}
          <Button
            onClick={onRetry}
            className="flex-1 bg-violet-600 hover:bg-violet-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
        
        <div className="mt-6 pt-6 border-t border-rose-200">
          <p className="text-xs text-slate-500">
            If this persists, please contact support at theproofly.com@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}