import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotionImporter({ onImportComplete }) {
  const [databaseId, setDatabaseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [importedCount, setImportedCount] = useState(0);

  const handleImport = async (e) => {
    e.preventDefault();
    
    if (!databaseId.trim()) {
      setStatus({ type: 'error', message: 'Please enter a Notion database ID' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const response = await base44.functions.invoke('notionNotesSync', {
        databaseId: databaseId.trim(),
      });

      setImportedCount(response.data.imported);
      setStatus({
        type: 'success',
        message: `Successfully imported ${response.data.imported} notes from Notion!`,
      });
      
      setDatabaseId('');
      onImportComplete?.();
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to import notes from Notion',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#171717] border border-[#2A2A2A] rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Database className="w-5 h-5 text-[#D6B98C]" />
        <h3 className="text-lg font-semibold text-[#F5F5F5]">Import from Notion</h3>
      </div>

      <p className="text-sm text-[#B5B5B5] mb-4">
        Connect your Notion database with study notes. Your notes will be analyzed and organized into the AP Study Hub.
      </p>

      <form onSubmit={handleImport} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#F5F5F5] mb-2">
            Notion Database ID
          </label>
          <input
            type="text"
            value={databaseId}
            onChange={(e) => setDatabaseId(e.target.value)}
            placeholder="e.g., 5a1234567890abcdef1234567890abcd"
            className="w-full px-4 py-2 bg-[#0C0C0C] border border-[#2A2A2A] rounded-lg text-[#F5F5F5] placeholder-[#8A8A8A] focus:outline-none focus:border-[#D6B98C]"
          />
          <p className="text-xs text-[#8A8A8A] mt-1">
            Find this by opening your Notion database in the browser. It's in the URL after "notion.so/"
          </p>
        </div>

        {status && (
          <div className={`flex items-start gap-3 p-3 rounded-lg ${
            status.type === 'success'
              ? 'bg-[#16A34A]/10 border border-[#16A34A]/30'
              : 'bg-[#DC2626]/10 border border-[#DC2626]/30'
          }`}>
            {status.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-[#16A34A] flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#DC2626] flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${status.type === 'success' ? 'text-[#86EFAC]' : 'text-[#FCA5A5]'}`}>
              {status.message}
            </p>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading || !databaseId.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Import Notes
            </>
          )}
        </Button>
      </form>

      <div className="mt-4 p-3 bg-[#0C0C0C] rounded-lg border border-[#2A2A2A]">
        <p className="text-xs text-[#B5B5B5]">
          <strong>Required Notion database properties:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-[#8A8A8A]">
            <li>Title (or Name) - Note title</li>
            <li>Subject (select) - AP subject (optional)</li>
            <li>YouTube URL - Link to video source (optional)</li>
            <li>PDF URL - Link to PDF source (optional)</li>
          </ul>
        </p>
      </div>
    </div>
  );
}