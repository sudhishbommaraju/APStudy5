import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldAlert, Trash2, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';

function ConfirmModal({ title, description, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl p-8 relative"
        style={{ background: '#171717', border: '1px solid #2A2A2A' }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
          <p className="text-neutral-400 text-sm leading-relaxed">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AccountManagement({ user }) {
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      await base44.auth.updateMe({ account_status: 'deactivated' });
      toast.success('Account deactivated. Log in again to reactivate.');
      setShowDeactivate(false);
      setTimeout(() => base44.auth.logout(), 1500);
    } catch {
      toast.error('Failed to deactivate account');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    setLoading(true);
    try {
      // Delete user-owned data
      const [history, flashcards, decks, sessions, attempts] = await Promise.all([
        base44.entities.PracticeHistory.filter({ user_email: user.email }),
        base44.entities.Flashcard.filter({ created_by: user.email }),
        base44.entities.FlashcardDeck.filter({ user_email: user.email }),
        base44.entities.Session.filter({ created_by: user.email }),
        base44.entities.Attempt.filter({ created_by: user.email }),
      ]);

      await Promise.all([
        ...history.map(r => base44.entities.PracticeHistory.delete(r.id)),
        ...flashcards.map(r => base44.entities.Flashcard.delete(r.id)),
        ...decks.map(r => base44.entities.FlashcardDeck.delete(r.id)),
        ...sessions.map(r => base44.entities.Session.delete(r.id)),
        ...attempts.map(r => base44.entities.Attempt.delete(r.id)),
      ]);

      // Mark account as deleted and log out
      await base44.auth.updateMe({ account_status: 'deleted' });
      toast.success('Account permanently deleted.');
      setTimeout(() => base44.auth.logout(), 1500);
    } catch {
      toast.error('Failed to delete account. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <ShieldAlert className="w-6 h-6 text-red-500" />
        <h2 className="text-2xl font-light text-white">Account Management</h2>
      </div>

      <div className="space-y-4">
        {/* Deactivate */}
        <div className="flex items-start justify-between p-4 rounded-xl"
          style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
          <div>
            <p className="text-white font-medium mb-1">Deactivate Account</p>
            <p className="text-neutral-400 text-sm">Temporarily disable your account. Your data will be saved.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowDeactivate(true)}
            className="ml-4 shrink-0 border-neutral-600 text-neutral-300 hover:border-amber-500 hover:text-amber-400"
          >
            Deactivate
          </Button>
        </div>

        {/* Delete */}
        <div className="flex items-start justify-between p-4 rounded-xl"
          style={{ background: '#1A0A0A', border: '1px solid #3A1A1A' }}>
          <div>
            <p className="text-red-400 font-medium mb-1">Delete Account</p>
            <p className="text-neutral-400 text-sm">Permanently remove your account and all associated data.</p>
          </div>
          <Button
            onClick={() => setShowDelete(true)}
            className="ml-4 shrink-0 bg-red-600 hover:bg-red-700 text-white border-none"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Deactivate Modal */}
      {showDeactivate && (
        <ConfirmModal
          title="Deactivate your account?"
          description="Your data will be saved, but your account will be hidden until you log in again."
          onClose={() => setShowDeactivate(false)}
        >
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowDeactivate(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white border-none"
              onClick={handleDeactivate}
              disabled={loading}
            >
              {loading ? 'Deactivating...' : 'Deactivate'}
            </Button>
          </div>
        </ConfirmModal>
      )}

      {/* Delete Modal */}
      {showDelete && (
        <ConfirmModal
          title="Delete your account permanently?"
          description="This action cannot be undone. All your practice history, flashcards, and data will be permanently removed."
          onClose={() => { setShowDelete(false); setDeleteConfirmText(''); }}
        >
          <div className="mb-5 p-3 rounded-lg flex items-start gap-3"
            style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)' }}>
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">
              Type <span className="font-mono font-bold">DELETE</span> to confirm permanent deletion.
            </p>
          </div>
          <Input
            placeholder="Type DELETE to confirm"
            value={deleteConfirmText}
            onChange={e => setDeleteConfirmText(e.target.value)}
            className="mb-4 bg-neutral-800 border-neutral-700 text-white font-mono"
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1"
              onClick={() => { setShowDelete(false); setDeleteConfirmText(''); }}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none"
              onClick={handleDelete}
              disabled={loading || deleteConfirmText !== 'DELETE'}
            >
              {loading ? 'Deleting...' : 'Permanently Delete'}
            </Button>
          </div>
        </ConfirmModal>
      )}
    </div>
  );
}