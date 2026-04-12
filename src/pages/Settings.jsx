import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Database, Bell, Layout, User, Loader2, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AccountManagement from '@/components/settings/AccountManagement';

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    notion_practice_page: '',
    notion_fulltest_page: '',
    notion_progress_page: '',
    notification_preferences: {
      email_reminders: true,
      practice_suggestions: true,
      progress_updates: true,
      weekly_reports: true
    },
    dashboard_layout: {
      default_tab: 'SAT',
      show_stats: true,
      show_streak: true,
      show_recommendations: true
    }
  });

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      setSettings({
        notion_practice_page: userData.notion_practice_page || '',
        notion_fulltest_page: userData.notion_fulltest_page || '',
        notion_progress_page: userData.notion_progress_page || '',
        notification_preferences: userData.notification_preferences || settings.notification_preferences,
        dashboard_layout: userData.dashboard_layout || settings.dashboard_layout
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    setLoading(false);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe(settings);
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error(error);
    }
    setSaving(false);
  };

  const handleUnlinkNotion = async (field) => {
    try {
      await base44.auth.updateMe({ [field]: null });
      setSettings({ ...settings, [field]: '' });
      toast.success('Notion page unlinked');
    } catch (error) {
      toast.error('Failed to unlink page');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-6">
        <button
          onClick={() => navigate('/Dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-12 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-light text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-500">Manage your profile and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-light text-gray-900">Profile</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <Input value={user?.email || ''} disabled className="bg-gray-50 border-gray-200 text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <Input value={user?.full_name || ''} disabled className="bg-gray-50 border-gray-200 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Notion Integration */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-light text-gray-900">Notion Integration</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Practice Page URL</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://notion.so/your-practice-page"
                    value={settings.notion_practice_page}
                    onChange={(e) => setSettings({ ...settings, notion_practice_page: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                  {settings.notion_practice_page && (
                    <Button variant="outline" size="icon" onClick={() => handleUnlinkNotion('notion_practice_page')}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Test Page URL</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://notion.so/your-fulltest-page"
                    value={settings.notion_fulltest_page}
                    onChange={(e) => setSettings({ ...settings, notion_fulltest_page: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                  {settings.notion_fulltest_page && (
                    <Button variant="outline" size="icon" onClick={() => handleUnlinkNotion('notion_fulltest_page')}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Progress Tracking Page URL</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://notion.so/your-progress-page"
                    value={settings.notion_progress_page}
                    onChange={(e) => setSettings({ ...settings, notion_progress_page: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                  {settings.notion_progress_page && (
                    <Button variant="outline" size="icon" onClick={() => handleUnlinkNotion('notion_progress_page')}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-light text-gray-900">Notifications</h2>
            </div>
            <div className="space-y-4">
              {Object.entries(settings.notification_preferences).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-sm text-gray-700 capitalize">{key.replace(/_/g, ' ')}</label>
                  <button
                    onClick={() => setSettings({
                      ...settings,
                      notification_preferences: { ...settings.notification_preferences, [key]: !value }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard Layout */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Layout className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-light text-gray-900">Dashboard Layout</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Tab</label>
                <Select
                  value={settings.dashboard_layout.default_tab}
                  onValueChange={(val) => setSettings({
                    ...settings,
                    dashboard_layout: { ...settings.dashboard_layout, default_tab: val }
                  })}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAT">SAT</SelectItem>
                    <SelectItem value="ACT">ACT</SelectItem>
                    <SelectItem value="AP">AP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {Object.entries(settings.dashboard_layout).filter(([key]) => key !== 'default_tab').map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-sm text-gray-700 capitalize">{key.replace(/_/g, ' ')}</label>
                  <button
                    onClick={() => setSettings({
                      ...settings,
                      dashboard_layout: { ...settings.dashboard_layout, [key]: !value }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Account Management */}
          <AccountManagement user={user} />

          {/* Save Button */}
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            {saving ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Save className="w-5 h-5 mr-2" />Save Settings</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}