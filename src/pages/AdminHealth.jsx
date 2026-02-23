import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function AdminHealth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.role !== 'admin') {
        navigate(createPageUrl('Dashboard'));
        return;
      }

      // Test AI integration
      let aiStatus = 'unknown';
      let aiError = null;
      try {
        await base44.integrations.Core.InvokeLLM({
          prompt: 'Test connection. Reply with: OK'
        });
        aiStatus = 'ok';
      } catch (error) {
        aiStatus = 'error';
        aiError = error.message;
      }

      // Fetch recent generation logs
      const recentLogs = await base44.entities.GenerationLog.list('-created_date', 20);

      setHealthData({
        ai_integration: { status: aiStatus, error: aiError },
        timestamp: new Date().toISOString()
      });
      setLogs(recentLogs);
    } catch (error) {
      console.error('Health check failed:', error);
    }
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    if (status === 'ok') return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-6xl mx-auto px-6">
        <button
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-12"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-light text-white mb-2">System Health</h1>
            <p className="text-neutral-400">Generation system status and logs</p>
          </div>
          <Button onClick={checkHealth} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Health Status */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-light text-white mb-6">Service Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {healthData?.ai_integration && getStatusIcon(healthData.ai_integration.status)}
                <div>
                  <div className="text-white font-medium">AI Integration (OpenAI)</div>
                  {healthData?.ai_integration?.error && (
                    <div className="text-sm text-red-400">{healthData.ai_integration.error}</div>
                  )}
                </div>
              </div>
              <div className="text-sm text-neutral-400">
                {healthData?.ai_integration?.status === 'ok' ? 'Connected' : 'Error'}
              </div>
            </div>
          </div>
          {healthData?.timestamp && (
            <div className="mt-6 text-sm text-neutral-500">
              Last checked: {new Date(healthData.timestamp).toLocaleString()}
            </div>
          )}
        </div>

        {/* Recent Generation Logs */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
          <h2 className="text-2xl font-light text-white mb-6">Recent Generation Logs</h2>
          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="text-neutral-500 text-center py-8">No logs yet</div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {log.status === 'SUCCESS' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : log.status === 'RETRY' ? (
                        <RefreshCw className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <div>
                        <div className="text-white font-medium">{log.type}</div>
                        <div className="text-sm text-neutral-400">{log.user_email}</div>
                      </div>
                    </div>
                    <div className="text-xs text-neutral-500">
                      {new Date(log.created_date).toLocaleString()}
                    </div>
                  </div>
                  {log.error_message && (
                    <div className="mt-2 text-sm text-red-400 bg-red-900/20 rounded px-3 py-2">
                      {log.error_code}: {log.error_message}
                    </div>
                  )}
                  {log.result_ids?.length > 0 && (
                    <div className="mt-2 text-sm text-green-400">
                      Created {log.result_ids.length} {log.type.toLowerCase()}
                    </div>
                  )}
                  {log.attempt_number > 1 && (
                    <div className="mt-2 text-xs text-yellow-400">
                      Attempt {log.attempt_number}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}