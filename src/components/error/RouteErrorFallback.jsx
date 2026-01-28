import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { createPageUrl } from '@/utils';

/**
 * ROUTE-LEVEL ERROR FALLBACK
 * Catches navigation/rendering errors
 */

export default function RouteErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 text-center">
        <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-rose-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-100 mb-3">
          Something went wrong
        </h1>
        
        <p className="text-slate-300 mb-6">
          {error?.message || "We encountered an unexpected error."}
        </p>
        
        <div className="flex gap-3 justify-center">
          <Button 
            onClick={resetErrorBoundary}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <Button 
            onClick={() => window.location.href = createPageUrl('Dashboard')}
            variant="outline"
            className="border-slate-600 text-slate-300"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
        
        {process.env.NODE_ENV === 'development' && error?.stack && (
          <details className="mt-6 text-left">
            <summary className="text-xs text-slate-400 cursor-pointer mb-2">Error Details</summary>
            <pre className="text-xs bg-slate-900 p-4 rounded-lg overflow-auto text-slate-300">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}