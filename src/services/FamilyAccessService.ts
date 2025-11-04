// TailTracker Family Access Service (Simplified - Non-existent features removed)
import { supabase } from '@/lib/supabase';

export type UserRole = 'owner' | 'member' | 'viewer';

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: UserRole | null;
  invited_by: string | null;
  joined_at: string | null;
  user?: {
    full_name: string;
    email: string;
  };
}

class FamilyAccessService {
  /**
   * Get all members of a family
   */
  async getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', familyId);

      if (error) throw error;
      return (data as FamilyMember[]) || [];
    } catch (error) {
      console.error('Error fetching family members:', error);
      return [];
    }
  }

  /**
   * Add a family member (simplified - no invite system)
   */
  async addFamilyMember(
    familyId: string,
    userId: string,
    role: UserRole = 'member'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase.from('family_members').insert({
        family_id: familyId,
        user_id: userId,
        role: role,
        invited_by: user.user.id,
        joined_at: new Date().toISOString(),
      });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error adding family member:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove a family member
   */
  async removeFamilyMember(
    familyId: string,
    memberId: string
  ): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId)
        .eq('family_id', familyId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error removing family member:', error);
      return { success: false };
    }
  }

  /**
   * Check if user can write to family
   */
  async checkMemberWriteAccess(
    userId: string,
    familyId: string
  ): Promise<boolean> {
    try {
      const { data: member } = await supabase
        .from('family_members')
        .select('role')
        .eq('user_id', userId)
        .eq('family_id', familyId)
        .single();

      return member?.role === 'owner' || member?.role === 'member';
    } catch (error) {
      return false;
    }
  }

  // NOTE: The following features are not implemented due to missing database schema:
  // - QR code invite system (requires family_invites_pending table)
  // - Access level management (requires access_level field)
  // - Invite token generation and validation
  //
  // These can be implemented when the database schema is updated
}

export default new FamilyAccessService();
