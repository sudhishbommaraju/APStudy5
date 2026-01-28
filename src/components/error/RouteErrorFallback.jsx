import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function RouteErrorFallback({ error, resetError }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-slate-800/40 backdrop-blur-sm rounded-xl border border-orange-500/30 p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">
          Unable to load this page
        </h2>
        <p className="text-slate-400 mb-6">
          {error?.message || 'An unexpected error occurred while loading this content.'}
        </p>

        <div className="flex gap-3 justify-center">
          {resetError && (
            <Button onClick={resetError} className="bg-violet-600 hover:bg-violet-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}