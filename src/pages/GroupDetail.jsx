import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Crown, Target, Trophy, Calendar, Video, BookOpen, Plus, Loader2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import VirtualSessionModal from '@/components/groups/VirtualSessionModal';
import GroupChallengeCard from '@/components/groups/GroupChallengeCard';
import { format } from 'date-fns';

export default function GroupDetail() {
  const { groupId } = useParams();
  const [user, setUser] = useState(null);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  const [sharedPlanDialogOpen, setSharedPlanDialogOpen] = useState(false);
  const [newChallenge, setNewChallenge] = useState({ title: '', description: '', challenge_type: 'questions_goal', target_value: 100, reward_points: 50 });
  const [newPlan, setNewPlan] = useState({ plan_name: '', description: '', subject_id: '', target_date: '' });
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

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => base44.entities.StudyGroup.filter({ id: groupId }).then(g => g[0]),
    enabled: !!groupId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: async () => {
      if (!group?.member_emails) return [];
      const allUsers = await base44.entities.User.list();
      return allUsers.filter(u => group.member_emails.includes(u.email));
    },
    enabled: !!group,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['groupActivities', groupId],
    queryFn: () => base44.entities.GroupActivity.filter({ group_id: groupId }),
    enabled: !!groupId,
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['groupChallenges', groupId],
    queryFn: () => base44.entities.GroupChallenge.filter({ group_id: groupId }),
    enabled: !!groupId,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['virtualSessions', groupId],
    queryFn: () => base44.entities.VirtualSession.filter({ group_id: groupId }),
    enabled: !!groupId,
  });

  const { data: sharedPlans = [] } = useQuery({
    queryKey: ['sharedPlans', groupId],
    queryFn: () => base44.entities.SharedStudyPlan.filter({ group_id: groupId }),
    enabled: !!groupId,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list('subject_id'),
  });

  const createChallengeMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.GroupChallenge.create({
        ...data,
        group_id: groupId,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupChallenges'] });
      setChallengeDialogOpen(false);
      setNewChallenge({ title: '', description: '', challenge_type: 'questions_goal', target_value: 100, reward_points: 50 });
    },
  });

  const createSharedPlanMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.SharedStudyPlan.create({
        ...data,
        group_id: groupId,
        contributors: [user.email],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedPlans'] });
      setSharedPlanDialogOpen(false);
      setNewPlan({ plan_name: '', description: '', subject_id: '', target_date: '' });
    },
  });

  if (!group || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  const isAdmin = group.admin_email === user.email;
  const leaderboard = members.map(member => {
    const memberActivities = activities.filter(a => a.user_email === member.email);
    const points = memberActivities.reduce((sum, a) => sum + (a.points_earned || 0), 0);
    return { ...member, points };
  }).sort((a, b) => b.points - a.points);

  return (
    <>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title flex items-center gap-3">
              {group.name}
              {isAdmin && <Crown className="w-6 h-6 text-amber-400" />}
            </h1>
            <p className="page-description">{group.description}</p>
          </div>
          <Link to={createPageUrl('StudyGroups')}>
            <Button variant="outline">← Back to Groups</Button>
          </Link>
        </div>
      </div>

      {/* Group Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-slate-400">Members</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{members.length}</p>
        </div>
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-slate-400">Group Points</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{group.total_points}</p>
        </div>
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-slate-400">Active Challenges</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{challenges.filter(c => c.status === 'active').length}</p>
        </div>
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Video className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-slate-400">Scheduled Sessions</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{sessions.filter(s => s.status === 'scheduled').length}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-800/40 border border-slate-700/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="sessions">Virtual Sessions</TabsTrigger>
          <TabsTrigger value="plans">Shared Plans</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Group Info */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Group Information</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-slate-400">Owner:</span>
                <p className="text-slate-100 font-medium">{members.find(m => m.email === group.admin_email)?.full_name || group.admin_email}</p>
              </div>
              <div>
                <span className="text-sm text-slate-400">Created:</span>
                <p className="text-slate-100">{format(new Date(group.created_date), 'PPP')}</p>
              </div>
              <div>
                <span className="text-sm text-slate-400">Members:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {members.map(member => (
                    <div key={member.email} className="px-3 py-1 bg-slate-900/50 rounded-full text-sm text-slate-300">
                      {member.full_name}
                      {member.email === group.admin_email && ' 👑'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {activities.slice(0, 10).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-violet-400">
                      {members.find(m => m.email === activity.user_email)?.full_name?.[0] || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-300">{activity.details}</p>
                    <p className="text-xs text-slate-500 mt-1">{format(new Date(activity.created_date), 'PPp')}</p>
                  </div>
                  {activity.points_earned > 0 && (
                    <span className="text-xs text-amber-400">+{activity.points_earned} pts</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-6">
          {isAdmin && (
            <Dialog open={challengeDialogOpen} onOpenChange={setChallengeDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Challenge
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-slate-100">Create Group Challenge</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    placeholder="Challenge Title"
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-slate-100"
                  />
                  <Textarea
                    placeholder="Description"
                    value={newChallenge.description}
                    onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-slate-100"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      placeholder="Target"
                      value={newChallenge.target_value}
                      onChange={(e) => setNewChallenge({ ...newChallenge, target_value: parseInt(e.target.value) })}
                      className="bg-slate-900 border-slate-700 text-slate-100"
                    />
                    <Input
                      type="number"
                      placeholder="Reward Points"
                      value={newChallenge.reward_points}
                      onChange={(e) => setNewChallenge({ ...newChallenge, reward_points: parseInt(e.target.value) })}
                      className="bg-slate-900 border-slate-700 text-slate-100"
                    />
                  </div>
                  <Button onClick={() => createChallengeMutation.mutate(newChallenge)} className="w-full">
                    Create Challenge
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            {challenges.map(challenge => (
              <GroupChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </TabsContent>

        {/* Virtual Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <Button onClick={() => setSessionModalOpen(true)} className="w-full">
            <Video className="w-4 h-4 mr-2" />
            Schedule New Session
          </Button>
          <div className="space-y-4">
            {sessions.map(session => (
              <div key={session.id} className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-100">{session.title}</h4>
                    <p className="text-sm text-slate-400 mt-1">{session.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    session.status === 'live' ? 'bg-emerald-500/20 text-emerald-300' :
                    session.status === 'scheduled' ? 'bg-violet-500/20 text-violet-300' :
                    'bg-slate-500/20 text-slate-300'
                  }`}>
                    {session.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span>🎯 Host: {members.find(m => m.email === session.host_email)?.full_name}</span>
                  <span>👥 {session.participants?.length || 0} participants</span>
                  <span>📅 {format(new Date(session.scheduled_time), 'PPp')}</span>
                  <span>⏱️ {session.duration_minutes}min</span>
                </div>
                {session.status === 'scheduled' && (
                  <Button size="sm" className="w-full mt-3">
                    Join Session
                  </Button>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Shared Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <Dialog open={sharedPlanDialogOpen} onOpenChange={setSharedPlanDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Shared Study Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-slate-100">Create Shared Study Plan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Plan Name"
                  value={newPlan.plan_name}
                  onChange={(e) => setNewPlan({ ...newPlan, plan_name: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-slate-100"
                />
                <Textarea
                  placeholder="Description"
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-slate-100"
                />
                <Input
                  type="date"
                  value={newPlan.target_date}
                  onChange={(e) => setNewPlan({ ...newPlan, target_date: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-slate-100"
                />
                <Button onClick={() => createSharedPlanMutation.mutate(newPlan)} className="w-full">
                  Create Plan
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <div className="space-y-4">
            {sharedPlans.map(plan => (
              <div key={plan.id} className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
                <h4 className="font-semibold text-slate-100">{plan.plan_name}</h4>
                <p className="text-sm text-slate-400 mt-1">{plan.description}</p>
                <div className="flex items-center gap-4 text-sm text-slate-400 mt-3">
                  <span>🎯 Target: {format(new Date(plan.target_date), 'PP')}</span>
                  <span>👥 {plan.contributors?.length} contributors</span>
                  <span>📊 {plan.group_progress}% complete</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Group Leaderboard</h3>
            <div className="space-y-3">
              {leaderboard.map((member, index) => (
                <div key={member.email} className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg">
                  <span className={`text-2xl font-bold ${
                    index === 0 ? 'text-amber-400' :
                    index === 1 ? 'text-slate-300' :
                    index === 2 ? 'text-amber-700' :
                    'text-slate-500'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-100">
                      {member.full_name}
                      {member.email === group.admin_email && ' 👑'}
                    </p>
                    <p className="text-sm text-slate-400">{member.points} points</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <VirtualSessionModal
        open={sessionModalOpen}
        onOpenChange={setSessionModalOpen}
        groupId={groupId}
        user={user}
      />
    </>
  );
}