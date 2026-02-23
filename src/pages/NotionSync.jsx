import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Notion Sync Dashboard
 * Syncs content from Notion CMS to Postgres
 */

export default function NotionSync() {
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  async function triggerSync() {
    setSyncing(true);
    setSyncResult(null);

    try {
      // Call backend function to sync Notion
      const result = await base44.functions.syncNotionQuestions({});
      setSyncResult(result);
    } catch (error) {
      setSyncResult({
        success: false,
        error: error.message,
        synced: 0,
        failed: 0
      });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-4xl mx-auto px-6">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="mb-8 text-neutral-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-12">
          <h1 className="text-3xl font-light text-white mb-2">Notion Sync</h1>
          <p className="text-neutral-400">Sync questions from Notion CMS to database</p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-800/30 rounded-xl p-6 mb-8">
          <h3 className="text-blue-400 font-medium mb-3">Setup Instructions</h3>
          <div className="text-sm text-blue-300/70 space-y-2">
            <p>1. Create a Notion integration at notion.so/my-integrations</p>
            <p>2. Share your "Proofly Question Bank" database with the integration</p>
            <p>3. Add NOTION_API_KEY and NOTION_DATABASE_ID to app secrets</p>
            <p>4. Click "Sync Now" to pull questions into the database</p>
          </div>
        </div>

        {/* Sync Button */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 mb-8">
          <Button
            onClick={triggerSync}
            disabled={syncing}
            className="w-full bg-white text-black hover:bg-neutral-100 py-6 text-lg"
          >
            {syncing ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Syncing from Notion...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 mr-2" />
                Sync Now
              </>
            )}
          </Button>
        </div>

        {/* Sync Result */}
        {syncResult && (
          <div className={`rounded-2xl p-8 ${
            syncResult.success 
              ? 'bg-green-900/20 border border-green-800' 
              : 'bg-red-900/20 border border-red-800'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              {syncResult.success ? (
                <CheckCircle className="w-6 h-6 text-green-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-400" />
              )}
              <h3 className={`text-xl font-medium ${
                syncResult.success ? 'text-green-400' : 'text-red-400'
              }`}>
                {syncResult.success ? 'Sync Complete' : 'Sync Failed'}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-neutral-900/50 rounded-xl p-4">
                <div className="text-2xl font-semibold text-white mb-1">
                  {syncResult.synced || 0}
                </div>
                <div className="text-sm text-neutral-400">Questions Synced</div>
              </div>
              <div className="bg-neutral-900/50 rounded-xl p-4">
                <div className="text-2xl font-semibold text-white mb-1">
                  {syncResult.failed || 0}
                </div>
                <div className="text-sm text-neutral-400">Failed</div>
              </div>
            </div>

            {syncResult.error && (
              <div className="text-sm text-red-300 bg-red-900/20 rounded-lg p-3">
                Error: {syncResult.error}
              </div>
            )}

            {syncResult.errors && syncResult.errors.length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-neutral-400 mb-2">Errors:</div>
                <div className="space-y-1">
                  {syncResult.errors.slice(0, 5).map((err, idx) => (
                    <div key={idx} className="text-xs text-red-300 bg-red-900/20 rounded p-2">
                      {err}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}