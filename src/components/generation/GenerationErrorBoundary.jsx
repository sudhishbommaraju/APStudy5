import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * ERROR STATE with MANDATORY exit paths
 * User can ALWAYS retry or cancel
 */

export default function GenerationErrorBoundary({ error, onRetry, onCancel }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-rose-500/30 p-8"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-rose-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            Generation Failed
          </h2>
          <p className="text-slate-300 text-sm">
            {error || "We couldn't generate practice questions right now."}
          </p>
        </div>
        
        <div className="space-y-3">
          <Button 
            onClick={onRetry}
            className="w-full h-12 bg-violet-600 hover:bg-violet-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <Button 
            onClick={onCancel}
            variant="outline"
            className="w-full h-12 border-slate-600 text-slate-300 hover:bg-slate-800/60"
          >
            <X className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
        
        <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
          <p className="text-xs text-slate-400 text-center">
            <strong className="text-slate-300">Tip:</strong> Try selecting fewer questions or a different subject/unit
          </p>
        </div>
      </motion.div>
    </div>
  );
}