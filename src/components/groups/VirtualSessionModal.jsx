import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Video, Users, Calendar, Clock } from 'lucide-react';

export default function VirtualSessionModal({ open, onOpenChange, groupId, user }) {
  const [sessionData, setSessionData] = useState({
    title: '',
    description: '',
    scheduled_time: '',
    duration_minutes: 60,
  });
  const queryClient = useQueryClient();

  const createSessionMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.VirtualSession.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['virtualSessions'] });
      onOpenChange(false);
      setSessionData({ title: '', description: '', scheduled_time: '', duration_minutes: 60 });
    },
  });

  const handleCreate = () => {
    if (!sessionData.title || !sessionData.scheduled_time) {
      alert('Please fill in title and schedule time');
      return;
    }

    createSessionMutation.mutate({
      group_id: groupId,
      title: sessionData.title,
      description: sessionData.description,
      host_email: user.email,
      scheduled_time: sessionData.scheduled_time,
      duration_minutes: sessionData.duration_minutes,
      status: 'scheduled',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-100 flex items-center gap-2">
            <Video className="w-5 h-5" />
            Schedule Virtual Study Session
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm text-slate-300 mb-2 block">Session Title</label>
            <Input
              value={sessionData.title}
              onChange={(e) => setSessionData({ ...sessionData, title: e.target.value })}
              placeholder="e.g., AP Calc Problem Solving Session"
              className="bg-slate-900 border-slate-700 text-slate-100"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 mb-2 block">Description</label>
            <Textarea
              value={sessionData.description}
              onChange={(e) => setSessionData({ ...sessionData, description: e.target.value })}
              placeholder="What will you work on together?"
              className="bg-slate-900 border-slate-700 text-slate-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-300 mb-2 block">
                <Calendar className="w-3 h-3 inline mr-1" />
                Date & Time
              </label>
              <Input
                type="datetime-local"
                value={sessionData.scheduled_time}
                onChange={(e) => setSessionData({ ...sessionData, scheduled_time: e.target.value })}
                className="bg-slate-900 border-slate-700 text-slate-100"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-2 block">
                <Clock className="w-3 h-3 inline mr-1" />
                Duration (min)
              </label>
              <Input
                type="number"
                value={sessionData.duration_minutes}
                onChange={(e) => setSessionData({ ...sessionData, duration_minutes: parseInt(e.target.value) })}
                className="bg-slate-900 border-slate-700 text-slate-100"
              />
            </div>
          </div>
          <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-3 text-sm text-slate-300">
            <p className="font-semibold mb-1">✨ Features included:</p>
            <ul className="text-xs space-y-1 text-slate-400">
              <li>• 🎨 Real-time collaborative whiteboard</li>
              <li>• 💬 Group chat and messaging</li>
              <li>• 🖥️ Screen sharing capabilities</li>
              <li>• 📹 Video/Audio chat integration</li>
              <li>• 📝 Shared note-taking</li>
              <li>• 🎥 Session recording (optional)</li>
            </ul>
            <p className="text-xs text-amber-400 mt-2">💡 Members can join via the group page when session goes live</p>
          </div>
          <Button onClick={handleCreate} disabled={createSessionMutation.isLoading} className="w-full">
            <Video className="w-4 h-4 mr-2" />
            Schedule Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}