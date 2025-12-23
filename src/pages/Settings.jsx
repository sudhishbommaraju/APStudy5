import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setFullName(currentUser.full_name || '');
        setEmail(currentUser.email || '');
      } catch (e) {
        console.error('Failed to load user:', e);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setUpdating(true);
    try {
      await base44.auth.updateMe({ full_name: fullName });
      toast.success('Profile updated successfully');
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
    } catch (e) {
      toast.error('Failed to update profile');
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setUpdating(true);
    try {
      // Note: This is a placeholder. Base44 may handle password changes differently
      // You might need to use a different API endpoint
      toast.info('Password change functionality requires backend setup');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      toast.error('Failed to change password');
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Account Settings</h1>
        <p className="page-description">Manage your account information</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile Information */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/30 border border-violet-400/30 flex items-center justify-center">
              <User className="w-5 h-5 text-violet-300" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Profile Information</h2>
              <p className="text-sm text-slate-400">Update your personal details</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Full Name</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5 bg-slate-900/50 border-slate-700/50 text-slate-100"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <Label className="text-slate-300">Email Address</Label>
              <Input
                value={email}
                disabled
                className="mt-1.5 bg-slate-900/30 border-slate-700/50 text-slate-400 cursor-not-allowed"
                placeholder="Your email"
              />
              <p className="text-xs text-slate-500 mt-1.5">Email cannot be changed</p>
            </div>

            <div>
              <Label className="text-slate-300">Account Type</Label>
              <div className="mt-1.5 px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg">
                <span className={`inline-flex items-center gap-2 text-sm font-medium ${
                  user?.plan === 'pro' ? 'text-violet-400' : 'text-slate-300'
                }`}>
                  {user?.plan === 'pro' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Pro Plan
                    </>
                  ) : (
                    'Free Plan'
                  )}
                </span>
              </div>
            </div>

            <Button 
              onClick={handleUpdateProfile}
              disabled={updating}
              className="w-full bg-violet-600 hover:bg-violet-700"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>

        {/* Password Change */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500/30 to-orange-500/30 border border-rose-400/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Change Password</h2>
              <p className="text-sm text-slate-400">Update your account password</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1.5 bg-slate-900/50 border-slate-700/50 text-slate-100"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <Label className="text-slate-300">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1.5 bg-slate-900/50 border-slate-700/50 text-slate-100"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <Label className="text-slate-300">Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5 bg-slate-900/50 border-slate-700/50 text-slate-100"
                placeholder="Confirm new password"
              />
            </div>

            <Button 
              onClick={handleChangePassword}
              disabled={updating}
              variant="outline"
              className="w-full border-slate-700/50 hover:bg-slate-800/50"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}