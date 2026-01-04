/**
 * Family Sharing Modal
 * Allows pet owners to invite family members with read-only access
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { invalidateFamilyData } from '@/lib/cacheUtils';
import {
  X,
  Users,
  Mail,
  Loader2,
  Trash2,
  Crown,
  UserPlus,
  Eye,
} from 'lucide-react';
import {
  inviteFamilyMember,
  removeFamilyMember,
  type FamilyMember,
} from '@tailtracker/shared-services';

interface FamilySharingModalProps {
  isOpen: boolean;
  onClose: () => void;
  petId: string;
  petName: string;
  currentFamilyMembers: FamilyMember[];
  maxFamilyMembers: number;
  isLoading?: boolean;
}

export const FamilySharingModal = ({
  isOpen,
  onClose,
  petId: _petId, // Reserved for future per-pet sharing
  petName,
  currentFamilyMembers,
  maxFamilyMembers,
  isLoading = false,
}: FamilySharingModalProps) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canAddMore = currentFamilyMembers.length < maxFamilyMembers;

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      if (!email.trim()) throw new Error('Email is required');

      const result = await inviteFamilyMember({ email: email.trim() });
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      // Invalidate all family-related caches
      invalidateFamilyData();
      setEmail('');
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const result = await removeFamilyMember(memberId);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      // Invalidate all family-related caches
      invalidateFamilyData();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    addMemberMutation.mutate();
  };

  const handleRemove = (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this family member?')) {
      removeMemberMutation.mutate(memberId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-100">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Family Sharing
              </h2>
              <p className="text-sm text-slate-500">
                Share {petName}'s profile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={addMemberMutation.isPending}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Read-only access
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Family members can view {petName}'s profile, vaccinations, and
                  medical records, but cannot make changes.
                </p>
              </div>
            </div>
          </div>

          {/* Current Family Members */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-slate-900">
                Family Members
              </h3>
              <span className="text-sm text-slate-500">
                {currentFamilyMembers.length} / {maxFamilyMembers >= 999 ? 'Unlimited' : maxFamilyMembers}
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
              </div>
            ) : currentFamilyMembers.length > 0 ? (
              <div className="space-y-2">
                {currentFamilyMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600">
                          {member.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {member.email}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">
                          {member.status === 'pending' ? 'Invitation pending' : 'Active'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(member.id)}
                      disabled={removeMemberMutation.isPending}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Remove access"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-lg">
                <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  No family members yet
                </p>
              </div>
            )}
          </div>

          {/* Add Family Member Form */}
          {canAddMore ? (
            <form onSubmit={handleSubmit}>
              <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Invite Family Member
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Send an invitation to a family member. They will receive
                read-only access to your pets once they accept.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="family@example.com"
                      required
                      className="input pl-10"
                      disabled={addMemberMutation.isPending}
                    />
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={addMemberMutation.isPending}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {addMemberMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center p-6 bg-amber-50 border border-amber-200 rounded-lg">
              <Crown className="h-8 w-8 text-amber-500 mx-auto mb-3" />
              <p className="font-medium text-amber-800 mb-2">
                Family member limit reached
              </p>
              <p className="text-sm text-amber-700 mb-4">
                Your current plan allows {maxFamilyMembers} family member
                {maxFamilyMembers !== 1 ? 's' : ''}.
              </p>
              <Link
                to="/pricing"
                onClick={onClose}
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Upgrade to add more
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            disabled={addMemberMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
