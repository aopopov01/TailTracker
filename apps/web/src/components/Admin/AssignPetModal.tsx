/**
 * Assign Pet Modal Component
 * Admin modal to transfer pet ownership between users
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@tailtracker/shared-services';

interface AssignPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pet: {
    id: string;
    name: string;
    currentOwnerId: string;
    currentOwnerEmail: string;
  } | null;
}

interface UserOption {
  id: string;
  email: string;
  name: string;
}

export const AssignPetModal = ({ isOpen, onClose, onSuccess, pet }: AssignPetModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  // Fetch users for owner selection
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isOpen) return;

      setIsLoadingUsers(true);
      try {
        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('auth_user_id, email, first_name, last_name')
          .order('email');

        if (fetchError) throw fetchError;

        if (data) {
          setUsers(
            data.map((u) => ({
              id: u.auth_user_id,
              email: u.email,
              name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [isOpen]);

  // Set current owner when pet changes
  useEffect(() => {
    if (pet) {
      setSelectedUserId(pet.currentOwnerId);
    }
  }, [pet]);

  const handleAssign = async () => {
    if (!pet || !selectedUserId) return;

    if (selectedUserId === pet.currentOwnerId) {
      setError('Pet is already assigned to this user');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      const { error: updateError } = await supabase
        .from('pets')
        .update({ user_id: selectedUserId })
        .eq('id', pet.id);

      if (updateError) throw updateError;

      // Log the admin action
      const newOwner = users.find((u) => u.id === selectedUserId);
      logAdminAction('assign_pet', 'pet', pet.id, {
        previousOwner: pet.currentOwnerEmail,
        newOwner: newOwner?.email,
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Error assigning pet:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign pet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  if (!isOpen || !pet) return null;

  const newOwner = users.find((u) => u.id === selectedUserId);
  const isChangingOwner = selectedUserId && selectedUserId !== pet.currentOwnerId;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Assign Pet to User</h2>
              <p className="text-sm text-slate-500">Transfer pet ownership</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Pet Info */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Pet</p>
            <p className="font-semibold text-slate-900">{pet.name}</p>
            <p className="text-sm text-slate-500 mt-1">
              Current owner: {pet.currentOwnerEmail}
            </p>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center text-slate-400">
            <ArrowRight className="w-6 h-6" />
          </div>

          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Assign to User
            </label>
            {isLoadingUsers ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                <span className="text-sm text-slate-500">Loading users...</span>
              </div>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  setError(null);
                }}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white disabled:bg-slate-50"
              >
                <option value="">Select new owner...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                    {user.id === pet.currentOwnerId ? ' - Current' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Warning for ownership change */}
          {isChangingOwner && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700">
                <p className="font-medium">Ownership Transfer</p>
                <p className="mt-1">
                  This will transfer <strong>{pet.name}</strong> from{' '}
                  <strong>{pet.currentOwnerEmail}</strong> to{' '}
                  <strong>{newOwner?.email}</strong>. The previous owner will no longer
                  have access to this pet.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={isLoading || isLoadingUsers || !selectedUserId || selectedUserId === pet.currentOwnerId}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Assign Pet
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
