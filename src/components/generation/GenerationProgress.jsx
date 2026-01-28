import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * HONEST PROGRESS INDICATOR
 * Only shows real progress or indeterminate spinner
 * NO fake percentages
 */

export default function GenerationProgress({ progress }) {
  if (!progress) return null;
  
  const { phase, current, total, message, validCount, errorCount, attempt, maxAttempts } = progress;
  
  // REAL PROGRESS ONLY
  const hasRealProgress = total > 0 && current >= 0;
  const percentage = hasRealProgress ? Math.round((current / total) * 100) : 0;
  
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8"
      >
        <div className="text-center mb-6">
          <Loader2 className="w-16 h-16 text-violet-400 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            Generating Practice Questions
          </h2>
          <p className="text-slate-300 text-sm">
            {message || 'Please wait while we create your questions...'}
          </p>
        </div>
        
        {/* Progress Bar - Real or Indeterminate */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            {hasRealProgress ? (
              <>
                <span>{current} of {total}</span>
                <span>{percentage}%</span>
              </>
            ) : (
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Processing...
              </span>
            )}
          </div>
          
          {hasRealProgress ? (
            <div className="h-3 bg-slate-900/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-gradient-to-r from-violet-600 to-purple-600 rounded-full"
              />
            </div>
          ) : (
            <div className="h-3 bg-slate-900/50 rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full animate-pulse" />
            </div>
          )}
        </div>
        
        {/* Retry Indicator */}
        {attempt && maxAttempts && (
          <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <p className="text-sm text-orange-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Retry {attempt}/{maxAttempts}
            </p>
          </div>
        )}

        {/* Status Counts - ONLY if real data */}
        {(validCount > 0 || errorCount > 0) && (
          <div className="grid grid-cols-2 gap-3">
            {validCount > 0 && (
              <div className="bg-emerald-500/10 rounded-lg border border-emerald-500/30 p-3 text-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <div className="text-sm font-semibold text-emerald-300">{validCount} Valid</div>
              </div>
            )}
            {errorCount > 0 && (
              <div className="bg-amber-500/10 rounded-lg border border-amber-500/30 p-3 text-center">
                <AlertCircle className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <div className="text-sm font-semibold text-amber-300">{errorCount} Retrying</div>
              </div>
            )}
          </div>
        )}
        
        <p className="text-xs text-slate-400 text-center mt-6">
          Maximum 60 seconds
        </p>
      </motion.div>
    </div>
  );
}