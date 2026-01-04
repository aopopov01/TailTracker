/**
 * Family Sharing Page
 * Main page for managing family sharing - invite family members, manage shared pets
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Loader2,
  Clock,
  CheckCircle,
  Mail,
  Crown,
  Eye,
  Settings,
  Trash2,
  X,
  Dog,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  useMyFamilyShares,
  usePendingInvitations,
  useFamilySharingSummary,
  useInviteFamilyMember,
  useRespondToInvitation,
  useRemoveFamilyMember,
  useSharedPetsForShare,
  useUpdateSharedPets,
  type FamilyShare,
} from '@/hooks';
import { useSubscription } from '@/hooks/useSubscription';
import { getPets } from '@tailtracker/shared-services';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Status badge component
const StatusBadge = ({ status }: { status: FamilyShare['status'] }) => {
  const statusConfig = {
    pending: {
      icon: Clock,
      label: 'Pending',
      className: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    accepted: {
      icon: CheckCircle,
      label: 'Active',
      className: 'bg-green-100 text-green-700 border-green-200',
    },
    declined: {
      icon: X,
      label: 'Declined',
      className: 'bg-red-100 text-red-700 border-red-200',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
};

// Invite Member Modal
const InviteMemberModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [email, setEmail] = useState('');
  const inviteMutation = useInviteFamilyMember();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      const result = await inviteMutation.mutateAsync({ email: email.trim() });
      if (result.success) {
        toast.success('Invitation sent successfully!');
        setEmail('');
        onClose();
      } else {
        toast.error(result.error || 'Failed to send invitation');
      }
    } catch (error) {
      toast.error('Failed to send invitation');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-100">
              <UserPlus className="h-5 w-5 text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              Invite Family Member
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Read-only access</p>
                <p className="text-sm text-blue-700 mt-1">
                  Family members can view your pets' profiles, vaccinations, and
                  medical records, but cannot make changes.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
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
                disabled={inviteMutation.isPending}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              They'll receive an invitation to view your pets.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviteMutation.isPending || !email.trim()}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {inviteMutation.isPending ? (
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
      </div>
    </div>
  );
};

// Manage Shared Pets Modal
const ManageSharedPetsModal = ({
  isOpen,
  onClose,
  familyShare,
}: {
  isOpen: boolean;
  onClose: () => void;
  familyShare: FamilyShare | null;
}) => {
  const { user } = useAuth();
  const { data: allPets } = useQuery({
    queryKey: ['pets', user?.id],
    queryFn: getPets,
    enabled: !!user?.id,
  });

  const { sharedPets, isLoading: loadingSharedPets } = useSharedPetsForShare(
    familyShare?.id
  );
  const updateSharedPets = useUpdateSharedPets();

  const [selectedPets, setSelectedPets] = useState<Set<string>>(new Set());
  const [petSettings, setPetSettings] = useState<
    Record<string, { shareCalendar: boolean; shareVaccinations: boolean; shareMedicalRecords: boolean }>
  >({});

  // Initialize selected pets and settings when modal opens
  useState(() => {
    if (sharedPets) {
      const ids = new Set(sharedPets.map((sp) => sp.petId));
      setSelectedPets(ids);
      const settings: typeof petSettings = {};
      sharedPets.forEach((sp) => {
        settings[sp.petId] = {
          shareCalendar: sp.shareCalendar,
          shareVaccinations: sp.shareVaccinations,
          shareMedicalRecords: sp.shareMedicalRecords,
        };
      });
      setPetSettings(settings);
    }
  });

  const togglePet = (petId: string) => {
    const newSelected = new Set(selectedPets);
    if (newSelected.has(petId)) {
      newSelected.delete(petId);
    } else {
      newSelected.add(petId);
      // Add default settings for new pet
      if (!petSettings[petId]) {
        setPetSettings((prev) => ({
          ...prev,
          [petId]: {
            shareCalendar: true,
            shareVaccinations: true,
            shareMedicalRecords: true,
          },
        }));
      }
    }
    setSelectedPets(newSelected);
  };

  const toggleSetting = (
    petId: string,
    setting: 'shareCalendar' | 'shareVaccinations' | 'shareMedicalRecords'
  ) => {
    setPetSettings((prev) => ({
      ...prev,
      [petId]: {
        ...prev[petId],
        [setting]: !prev[petId]?.[setting],
      },
    }));
  };

  const handleSave = async () => {
    if (!familyShare) return;

    const petsToShare = Array.from(selectedPets).map((petId) => ({
      petId,
      shareCalendar: petSettings[petId]?.shareCalendar ?? true,
      shareVaccinations: petSettings[petId]?.shareVaccinations ?? true,
      shareMedicalRecords: petSettings[petId]?.shareMedicalRecords ?? true,
    }));

    try {
      const result = await updateSharedPets.mutateAsync({
        familyShareId: familyShare.id,
        pets: petsToShare,
      });

      if (result.success) {
        toast.success('Shared pets updated!');
        onClose();
      } else {
        toast.error(result.error || 'Failed to update');
      }
    } catch (error) {
      toast.error('Failed to update shared pets');
    }
  };

  if (!isOpen || !familyShare) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-100">
              <Settings className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Manage Shared Pets
              </h2>
              <p className="text-sm text-slate-500">
                Sharing with {familyShare.sharedWithEmail}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loadingSharedPets ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            </div>
          ) : allPets && allPets.length > 0 ? (
            <div className="space-y-4">
              {allPets.map((pet) => (
                <div
                  key={pet.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    selectedPets.has(pet.id)
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedPets.has(pet.id)}
                      onChange={() => togglePet(pet.id)}
                      className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <Dog className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{pet.name}</p>
                        <p className="text-sm text-slate-500 capitalize">
                          {pet.species}
                          {pet.breed && ` - ${pet.breed}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedPets.has(pet.id) && (
                    <div className="mt-4 ml-8 space-y-2">
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={petSettings[pet.id]?.shareCalendar ?? true}
                          onChange={() => toggleSetting(pet.id, 'shareCalendar')}
                          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        Share calendar events
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={petSettings[pet.id]?.shareVaccinations ?? true}
                          onChange={() => toggleSetting(pet.id, 'shareVaccinations')}
                          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        Share vaccinations
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={petSettings[pet.id]?.shareMedicalRecords ?? true}
                          onChange={() => toggleSetting(pet.id, 'shareMedicalRecords')}
                          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        Share medical records
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Dog className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No pets to share</p>
              <Link
                to="/pets/new"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 inline-block"
              >
                Add your first pet
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateSharedPets.isPending}
            className="btn-primary flex items-center gap-2"
          >
            {updateSharedPets.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Family Member Card
const FamilyMemberCard = ({
  share,
  onManagePets,
  onRemove,
  isRemoving,
}: {
  share: FamilyShare;
  onManagePets: () => void;
  onRemove: () => void;
  isRemoving: boolean;
}) => {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-semibold text-primary-600">
              {share.sharedWithName?.[0]?.toUpperCase() ||
                share.sharedWithEmail[0].toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-slate-900">
                {share.sharedWithName || share.sharedWithEmail}
              </h3>
              <StatusBadge status={share.status} />
            </div>
            <p className="text-sm text-slate-500">{share.sharedWithEmail}</p>
            {share.sharedPetsCount !== undefined && share.sharedPetsCount > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                {share.sharedPetsCount} pet{share.sharedPetsCount !== 1 ? 's' : ''} shared
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {share.status === 'accepted' && (
            <button
              onClick={onManagePets}
              className="p-2 text-slate-400 hover:text-primary-600 transition-colors"
              title="Manage shared pets"
            >
              <Settings className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={onRemove}
            disabled={isRemoving}
            className="p-2 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
            title="Remove family member"
          >
            {isRemoving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Trash2 className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Pending Invitation Card (for invitations TO the current user)
const PendingInvitationCard = ({
  invitation,
  onAccept,
  onDecline,
  isResponding,
}: {
  invitation: FamilyShare;
  onAccept: () => void;
  onDecline: () => void;
  isResponding: boolean;
}) => {
  return (
    <div className="card p-4 border-l-4 border-l-amber-400">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Mail className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900">Family Sharing Invitation</h3>
            <p className="text-sm text-slate-500">
              <span className="font-medium">{invitation.ownerName || invitation.ownerEmail}</span> wants
              to share their pets with you
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onDecline}
            disabled={isResponding}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            disabled={isResponding}
            className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isResponding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Accept'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Page Component
export const FamilySharingPage = () => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [managePetsShare, setManagePetsShare] = useState<FamilyShare | null>(null);
  const [removingShareId, setRemovingShareId] = useState<string | null>(null);

  const { tier } = useSubscription();
  const { shares: myShares, isLoading: loadingMyShares } = useMyFamilyShares();
  const { invitations, isLoading: loadingInvitations } = usePendingInvitations();
  const { summary, canInviteMore, isLoading: loadingSummary } = useFamilySharingSummary();
  const removeMutation = useRemoveFamilyMember();
  const respondMutation = useRespondToInvitation();

  const handleRemove = async (shareId: string) => {
    if (!window.confirm('Are you sure you want to remove this family member?')) {
      return;
    }

    setRemovingShareId(shareId);
    try {
      const result = await removeMutation.mutateAsync(shareId);
      if (result.success) {
        toast.success('Family member removed');
      } else {
        toast.error(result.error || 'Failed to remove');
      }
    } catch (error) {
      toast.error('Failed to remove family member');
    } finally {
      setRemovingShareId(null);
    }
  };

  const handleAcceptInvitation = async (shareId: string) => {
    try {
      const result = await respondMutation.mutateAsync({
        shareId,
        response: 'accept',
      });
      if (result.success) {
        toast.success('Invitation accepted!');
      } else {
        toast.error(result.error || 'Failed to accept');
      }
    } catch (error) {
      toast.error('Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async (shareId: string) => {
    try {
      const result = await respondMutation.mutateAsync({
        shareId,
        response: 'decline',
      });
      if (result.success) {
        toast.info('Invitation declined');
      } else {
        toast.error(result.error || 'Failed to decline');
      }
    } catch (error) {
      toast.error('Failed to decline invitation');
    }
  };

  const isLoading = loadingMyShares || loadingSummary;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Family Sharing</h1>
        <p className="text-slate-600 mt-1">
          Share your pets with family members for read-only access
        </p>
      </div>

      {/* Usage Indicator */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-100">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Family Members</h2>
              <p className="text-sm text-slate-500">
                {tier === 'pro' ? 'Unlimited family sharing' : `${tier} plan`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            disabled={!canInviteMore || isLoading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="h-4 w-4" />
            Invite Member
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-slate-600">
              {summary.acceptedShares} of {summary.maxAllowed >= 999 ? 'unlimited' : summary.maxAllowed} slots used
            </span>
            {summary.pendingInvitations > 0 && (
              <span className="text-amber-600">
                {summary.pendingInvitations} pending
              </span>
            )}
          </div>
          {summary.maxAllowed < 999 && (
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{
                  width: `${Math.min((summary.acceptedShares / summary.maxAllowed) * 100, 100)}%`,
                }}
              />
            </div>
          )}
        </div>

        {!canInviteMore && summary.maxAllowed < 999 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  Family member limit reached
                </p>
                <p className="text-sm text-amber-700">
                  Upgrade your plan to add more family members.
                </p>
              </div>
              <Link
                to="/pricing"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Upgrade
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Pending Invitations TO Me */}
      {loadingInvitations ? (
        <div className="card p-8 flex items-center justify-center mb-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        </div>
      ) : invitations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Pending Invitations
          </h2>
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <PendingInvitationCard
                key={invitation.id}
                invitation={invitation}
                onAccept={() => handleAcceptInvitation(invitation.id)}
                onDecline={() => handleDeclineInvitation(invitation.id)}
                isResponding={respondMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* My Family Members */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          People I'm Sharing With
        </h2>

        {isLoading ? (
          <div className="card p-12 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-3" />
            <p className="text-slate-500 text-sm">Loading family members...</p>
          </div>
        ) : myShares.length > 0 ? (
          <div className="space-y-4">
            {myShares.map((share) => (
              <FamilyMemberCard
                key={share.id}
                share={share}
                onManagePets={() => setManagePetsShare(share)}
                onRemove={() => handleRemove(share.id)}
                isRemoving={removingShareId === share.id}
              />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No family members yet
            </h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Invite family members to share read-only access to your pets'
              profiles and health records.
            </p>
            <button
              onClick={() => setShowInviteModal(true)}
              disabled={!canInviteMore}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
            >
              <UserPlus className="h-5 w-5" />
              Invite Your First Family Member
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
      <ManageSharedPetsModal
        isOpen={!!managePetsShare}
        onClose={() => setManagePetsShare(null)}
        familyShare={managePetsShare}
      />
    </div>
  );
};
