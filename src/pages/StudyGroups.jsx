import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus, Crown, TrendingUp, Target, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { motion } from 'framer-motion';

export default function StudyGroups() {
  const [user, setUser] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        console.error('Failed to load user:', e);
      }
    };
    loadUser();
  }, []);

  const { data: myGroups = [] } = useQuery({
    queryKey: ['myGroups', user?.email],
    queryFn: async () => {
      const groups = await base44.entities.StudyGroup.list();
      return groups.filter(g => 
        g.member_emails?.includes(user.email) || g.admin_email === user.email
      );
    },
    enabled: !!user,
  });

  const { data: publicGroups = [] } = useQuery({
    queryKey: ['publicGroups'],
    queryFn: async () => {
      const groups = await base44.entities.StudyGroup.list();
      return groups.filter(g => g.is_public && !g.member_emails?.includes(user?.email));
    },
    enabled: !!user,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (groupData) => {
      return await base44.entities.StudyGroup.create(groupData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGroups'] });
      setCreateDialogOpen(false);
      setNewGroupName('');
      setNewGroupDescription('');
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (group) => {
      const updatedMembers = [...(group.member_emails || []), user.email];
      await base44.entities.StudyGroup.update(group.id, {
        member_emails: updatedMembers,
      });
      
      await base44.entities.GroupActivity.create({
        group_id: group.id,
        user_email: user.email,
        activity_type: 'joined',
        details: `${user.full_name} joined the group`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGroups'] });
      queryClient.invalidateQueries({ queryKey: ['publicGroups'] });
    },
  });

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    
    createGroupMutation.mutate({
      name: newGroupName,
      description: newGroupDescription,
      admin_email: user.email,
      member_emails: [user.email],
      is_public: true,
      total_points: 0,
    });
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Study Groups</h1>
        <p className="page-description">Learn together, achieve together</p>
      </div>

      <div className="space-y-6">
        {/* Create Group Button */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-violet-600 hover:bg-violet-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Study Group
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-100">Create New Study Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Group Name</label>
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., AP Calculus Study Squad"
                  className="bg-slate-900 border-slate-700 text-slate-100"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Description</label>
                <Textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="What's this group about?"
                  className="bg-slate-900 border-slate-700 text-slate-100"
                />
              </div>
              <Button onClick={handleCreateGroup} className="w-full">
                Create Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* My Groups */}
        <div>
          <h2 className="text-xl font-semibold text-slate-100 mb-4">My Groups</h2>
          {myGroups.length === 0 ? (
            <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-8 text-center">
              <Users className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">You're not in any study groups yet</p>
              <p className="text-sm text-slate-500 mt-1">Create or join a group to start learning together</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {myGroups.map((group) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5 hover:border-violet-500/50 transition-all cursor-pointer"
                  onClick={() => window.location.href = `/group/${group.id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                        {group.name}
                        {group.admin_email === user?.email && (
                          <Crown className="w-4 h-4 text-amber-400" />
                        )}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">{group.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {group.member_emails?.length || 0} members
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {group.total_points} pts
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Public Groups */}
        {publicGroups.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-slate-100 mb-4">Discover Groups</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {publicGroups.map((group) => (
                <div
                  key={group.id}
                  className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5"
                >
                  <h3 className="font-semibold text-slate-100 mb-2">{group.name}</h3>
                  <p className="text-sm text-slate-400 mb-4">{group.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                      {group.member_emails?.length || 0} members
                    </span>
                    <Button
                      size="sm"
                      onClick={() => joinGroupMutation.mutate(group)}
                      disabled={joinGroupMutation.isLoading}
                    >
                      Join Group
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}