import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Video, MessageCircle, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CollaborativeSession({ open, onOpenChange, user, currentTopic }) {
  const [sessionType, setSessionType] = useState('ai'); // 'ai' or 'group'
  const [selectedGroup, setSelectedGroup] = useState('');
  const [sessionLink, setSessionLink] = useState('');

  const { data: myGroups = [] } = useQuery({
    queryKey: ['myGroups', user?.email],
    queryFn: async () => {
      const groups = await base44.entities.StudyGroup.list();
      return groups.filter(g => 
        g.member_emails?.includes(user.email) || g.admin_email === user.email
      );
    },
    enabled: !!user && open,
  });

  const startAiSession = () => {
    // Generate a unique session ID
    const sessionId = `ai-${Date.now()}`;
    setSessionLink(`/ai-session/${sessionId}?topic=${encodeURIComponent(currentTopic)}`);
  };

  const inviteGroupMembers = async () => {
    if (!selectedGroup) return;
    
    // Create a virtual session for the group
    const session = await base44.entities.VirtualSession.create({
      group_id: selectedGroup,
      title: `Study Session: ${currentTopic}`,
      description: `Collaborative problem-solving session on ${currentTopic}`,
      host_email: user.email,
      participants: [user.email],
      scheduled_time: new Date().toISOString(),
      duration_minutes: 60,
      status: 'live',
    });

    setSessionLink(`/group-session/${session.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Start Collaborative Session</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Session Type Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSessionType('ai')}
              className={`p-4 rounded-lg border-2 transition-all ${
                sessionType === 'ai'
                  ? 'bg-violet-500/20 border-violet-500'
                  : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
              }`}
            >
              <MessageCircle className="w-6 h-6 mx-auto mb-2 text-violet-400" />
              <p className="text-sm font-medium text-slate-200">AI Tutor</p>
              <p className="text-xs text-slate-400 mt-1">1-on-1 with AI</p>
            </button>
            <button
              onClick={() => setSessionType('group')}
              className={`p-4 rounded-lg border-2 transition-all ${
                sessionType === 'group'
                  ? 'bg-violet-500/20 border-violet-500'
                  : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
              }`}
            >
              <Users className="w-6 h-6 mx-auto mb-2 text-violet-400" />
              <p className="text-sm font-medium text-slate-200">Study Group</p>
              <p className="text-xs text-slate-400 mt-1">Invite members</p>
            </button>
          </div>

          {/* Topic Display */}
          <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Session Topic</p>
            <p className="text-sm text-slate-200 font-medium">{currentTopic || 'General Study Session'}</p>
          </div>

          {/* Group Selection */}
          {sessionType === 'group' && (
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Select Study Group</label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200">
                  <SelectValue placeholder="Choose a group" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {myGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id} className="text-slate-200">
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Session Link Display */}
          {sessionLink && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <p className="text-xs text-emerald-300 mb-2">Session Created!</p>
              <div className="flex items-center gap-2">
                <Input
                  value={window.location.origin + sessionLink}
                  readOnly
                  className="bg-slate-900 border-slate-700 text-slate-200 text-xs"
                />
                <Button
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(window.location.origin + sessionLink)}
                >
                  Copy
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={onOpenChange}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={sessionType === 'ai' ? startAiSession : inviteGroupMembers}
              disabled={(sessionType === 'group' && !selectedGroup) || sessionLink}
              className="flex-1 bg-violet-600 hover:bg-violet-700"
            >
              <Video className="w-4 h-4 mr-2" />
              {sessionLink ? 'Session Active' : 'Start Session'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}