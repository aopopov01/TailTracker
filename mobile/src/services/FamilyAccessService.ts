// TailTracker Family Access Service with QR Code Invitation System
import { randomBytes } from 'expo-crypto';
import * as Crypto from 'expo-crypto';
import { supabase } from '@/lib/supabase';

export type AccessLevel = 'read' | 'read_write';
export type UserRole = 'owner' | 'member' | 'viewer';

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: UserRole;
  access_level: AccessLevel;
  invited_by: string;
  invite_token?: string;
  invite_expires_at?: string;
  joined_at: string;
  user?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface FamilyInviteData {
  family_id: string;
  family_name: string;
  invited_by_name: string;
  invite_token: string;
  expires_at: string;
}

class FamilyAccessService {
  /**
   * Generate QR code data for family member invitation
   * Only the main user (family owner) can generate invites
   */
  async generateFamilyInvite(familyId: string): Promise<{
    qrCodeData: string;
    inviteToken: string;
    expiresAt: Date;
  }> {
    try {
      // Verify user is family owner
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('id, name, owner_id')
        .eq('id', familyId)
        .single();

      if (familyError || !family) {
        throw new Error('Family not found or access denied');
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user || family.owner_id !== user.user.id) {
        throw new Error('Only family owners can generate invites');
      }

      // Check subscription limits for family members
      await this.checkFamilyMemberLimit(familyId);

      // Generate secure invite token
      const inviteToken = await this.generateSecureToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Get inviter info
      const { data: inviterProfile } = await supabase
        .from('users')
        .select('full_name')
        .eq('auth_user_id', user.user.id)
        .single();

      // Create QR code data payload
      const inviteData: FamilyInviteData = {
        family_id: familyId,
        family_name: family.name,
        invited_by_name: inviterProfile?.full_name || 'Family Member',
        invite_token: inviteToken,
        expires_at: expiresAt.toISOString()
      };

      const qrCodeData = JSON.stringify({
        type: 'tailtracker_family_invite',
        version: '1.0',
        data: inviteData
      });

      return {
        qrCodeData,
        inviteToken,
        expiresAt
      };

    } catch (error) {
      console.error('Error generating family invite:', error);
      throw error;
    }
  }

  /**
   * Process scanned QR code and validate invitation
   */
  async processScannedInvite(qrData: string): Promise<{
    isValid: boolean;
    inviteData?: FamilyInviteData;
    error?: string;
  }> {
    try {
      const parsed = JSON.parse(qrData);
      
      if (parsed.type !== 'tailtracker_family_invite' || !parsed.data) {
        return { isValid: false, error: 'Invalid QR code format' };
      }

      const inviteData: FamilyInviteData = parsed.data;
      
      // Check if invite is expired
      if (new Date(inviteData.expires_at) < new Date()) {
        return { isValid: false, error: 'Invite has expired' };
      }

      // Verify family still exists
      const { data: family } = await supabase
        .from('families')
        .select('id, name')
        .eq('id', inviteData.family_id)
        .single();

      if (!family) {
        return { isValid: false, error: 'Family no longer exists' };
      }

      return { isValid: true, inviteData };

    } catch (error) {
      return { isValid: false, error: 'Invalid QR code format' };
    }
  }

  /**
   * Show access level confirmation to family owner
   */
  async confirmFamilyMemberAccess(
    inviteToken: string,
    newMemberUserId: string,
    accessLevel: AccessLevel
  ): Promise<{ success: boolean; familyMemberId?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Find pending invite
      const { data: existingInvite } = await supabase
        .from('family_invites_pending')
        .select('*')
        .eq('invite_token', inviteToken)
        .single();

      if (!existingInvite) {
        throw new Error('Invite not found');
      }

      // Verify user is family owner
      const { data: family } = await supabase
        .from('families')
        .select('owner_id')
        .eq('id', existingInvite.family_id)
        .single();

      if (!family || family.owner_id !== user.user.id) {
        throw new Error('Only family owners can confirm access');
      }

      // Add family member with specified access level
      const { data: familyMember, error } = await supabase
        .from('family_members')
        .insert({
          family_id: existingInvite.family_id,
          user_id: newMemberUserId,
          access_level: accessLevel,
          invited_by: user.user.id,
          role: 'member'
        })
        .select()
        .single();

      if (error) throw error;

      // Clean up pending invite
      await supabase
        .from('family_invites_pending')
        .delete()
        .eq('invite_token', inviteToken);

      return { success: true, familyMemberId: familyMember.id };

    } catch (error) {
      console.error('Error confirming family member access:', error);
      return { success: false };
    }
  }

  /**
   * Join family using scanned QR code
   */
  async joinFamilyWithQRCode(qrData: string): Promise<{
    success: boolean;
    requiresConfirmation?: boolean;
    inviteToken?: string;
    error?: string;
  }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Validate QR code
      const { isValid, inviteData, error } = await this.processScannedInvite(qrData);
      if (!isValid) {
        return { success: false, error };
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_id', inviteData!.family_id)
        .eq('user_id', user.user.id)
        .single();

      if (existingMember) {
        return { success: false, error: 'Already a member of this family' };
      }

      // Create pending invite record for owner confirmation
      const { error: insertError } = await supabase
        .from('family_invites_pending')
        .insert({
          family_id: inviteData!.family_id,
          potential_member_id: user.user.id,
          invite_token: inviteData!.invite_token,
          expires_at: inviteData!.expires_at
        });

      if (insertError) throw insertError;

      // Send notification to family owner for confirmation
      await this.notifyOwnerOfPendingMember(
        inviteData!.family_id,
        user.user.id,
        inviteData!.invite_token
      );

      return {
        success: true,
        requiresConfirmation: true,
        inviteToken: inviteData!.invite_token
      };

    } catch (error) {
      console.error('Error joining family:', error);
      return { success: false, error: 'Failed to join family' };
    }
  }

  /**
   * Get family members with their access levels
   */
  async getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select(`
          *,
          user:users!inner(full_name, email, avatar_url)
        `)
        .eq('family_id', familyId);

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error fetching family members:', error);
      return [];
    }
  }

  /**
   * Update family member access level (owner only)
   */
  async updateMemberAccessLevel(
    familyMemberId: string,
    newAccessLevel: AccessLevel
  ): Promise<{ success: boolean }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Verify user is family owner
      const { data: member } = await supabase
        .from('family_members')
        .select('family_id, families!inner(owner_id)')
        .eq('id', familyMemberId)
        .single();

      if (!member || member.families.owner_id !== user.user.id) {
        throw new Error('Only family owners can update access levels');
      }

      const { error } = await supabase
        .from('family_members')
        .update({ access_level: newAccessLevel })
        .eq('id', familyMemberId);

      if (error) throw error;
      return { success: true };

    } catch (error) {
      console.error('Error updating member access level:', error);
      return { success: false };
    }
  }

  /**
   * Remove family member (owner only)
   */
  async removeFamilyMember(familyMemberId: string): Promise<{ success: boolean }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Verify user is family owner
      const { data: member } = await supabase
        .from('family_members')
        .select('family_id, families!inner(owner_id)')
        .eq('id', familyMemberId)
        .single();

      if (!member || member.families.owner_id !== user.user.id) {
        throw new Error('Only family owners can remove members');
      }

      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', familyMemberId);

      if (error) throw error;
      return { success: true };

    } catch (error) {
      console.error('Error removing family member:', error);
      return { success: false };
    }
  }

  /**
   * Check if user can perform write operations based on access level
   */
  async canWriteData(userId: string, familyId: string): Promise<boolean> {
    try {
      // Check if user is owner
      const { data: family } = await supabase
        .from('families')
        .select('owner_id')
        .eq('id', familyId)
        .single();

      if (family?.owner_id === userId) {
        return true; // Owners always have write access
      }

      // Check member access level
      const { data: member } = await supabase
        .from('family_members')
        .select('access_level')
        .eq('family_id', familyId)
        .eq('user_id', userId)
        .single();

      return member?.access_level === 'read_write';

    } catch (error) {
      console.error('Error checking write permissions:', error);
      return false;
    }
  }

  // Private helper methods

  private async generateSecureToken(): Promise<string> {
    const bytes = await Crypto.getRandomBytesAsync(32);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private async checkFamilyMemberLimit(familyId: string): Promise<void> {
    const { data: family } = await supabase
      .from('families')
      .select('owner_id, users!inner(subscription_status)')
      .eq('id', familyId)
      .single();

    if (!family) throw new Error('Family not found');

    const { data: memberCount } = await supabase
      .from('family_members')
      .select('id', { count: 'exact' })
      .eq('family_id', familyId);

    const count = memberCount?.length || 0;
    const subscriptionStatus = family.users.subscription_status;

    if (subscriptionStatus === 'free' && count >= 1) {
      throw new Error('Free tier allows main user + 1 additional family member (2 total). Upgrade to Premium for main user + 2 additional members (3 total) or Pro for unlimited members.');
    } else if (subscriptionStatus === 'premium' && count >= 2) {
      throw new Error('Premium tier allows main user + 2 additional family members (3 total). Upgrade to Pro for unlimited family members.');
    }
  }

  private async notifyOwnerOfPendingMember(
    familyId: string,
    potentialMemberId: string,
    inviteToken: string
  ): Promise<void> {
    // Implementation would send push notification or create in-app notification
    // For now, just log the action
    console.log(`Notifying owner of family ${familyId} about pending member ${potentialMemberId}`);
  }
}

export const familyAccessService = new FamilyAccessService();