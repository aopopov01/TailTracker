-- ============================================
-- Family Sharing System
-- Allows pet owners to share pet access with family members
-- ============================================

-- Create family_shares table
CREATE TABLE IF NOT EXISTS family_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  access_level TEXT NOT NULL DEFAULT 'reader' CHECK (access_level IN ('reader')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(owner_id, shared_with_email)
);

-- Create shared_pets table (which pets are shared with which family member)
CREATE TABLE IF NOT EXISTS shared_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_share_id UUID NOT NULL REFERENCES family_shares(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  share_calendar BOOLEAN DEFAULT TRUE,
  share_vaccinations BOOLEAN DEFAULT TRUE,
  share_medical_records BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_share_id, pet_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_family_shares_owner ON family_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_family_shares_shared_user ON family_shares(shared_with_user_id) WHERE shared_with_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_family_shares_email ON family_shares(shared_with_email);
CREATE INDEX IF NOT EXISTS idx_family_shares_status ON family_shares(status);
CREATE INDEX IF NOT EXISTS idx_shared_pets_family_share ON shared_pets(family_share_id);
CREATE INDEX IF NOT EXISTS idx_shared_pets_pet ON shared_pets(pet_id);

-- Enable Row Level Security
ALTER TABLE family_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_pets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for family_shares
-- ============================================

-- Owners can view their own shares
CREATE POLICY "Owners can view their shares"
  ON family_shares FOR SELECT
  USING (owner_id = auth.uid());

-- Owners can create shares
CREATE POLICY "Owners can create shares"
  ON family_shares FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Owners can update their shares
CREATE POLICY "Owners can update their shares"
  ON family_shares FOR UPDATE
  USING (owner_id = auth.uid());

-- Owners can delete their shares
CREATE POLICY "Owners can delete their shares"
  ON family_shares FOR DELETE
  USING (owner_id = auth.uid());

-- Shared users can view shares with them
CREATE POLICY "Users can view shares with them"
  ON family_shares FOR SELECT
  USING (shared_with_user_id = auth.uid());

-- Shared users can update their share status (accept/decline)
CREATE POLICY "Users can update share status"
  ON family_shares FOR UPDATE
  USING (shared_with_user_id = auth.uid())
  WITH CHECK (
    shared_with_user_id = auth.uid()
    AND (
      status IN ('accepted', 'declined')
    )
  );

-- ============================================
-- RLS Policies for shared_pets
-- ============================================

-- Owners can manage shared pets
CREATE POLICY "Owners can manage shared pets"
  ON shared_pets FOR ALL
  USING (
    family_share_id IN (
      SELECT id FROM family_shares WHERE owner_id = auth.uid()
    )
  );

-- Family members can view shared pets they have access to
CREATE POLICY "Family members can view shared pets"
  ON shared_pets FOR SELECT
  USING (
    family_share_id IN (
      SELECT id FROM family_shares
      WHERE shared_with_user_id = auth.uid()
      AND status = 'accepted'
    )
  );

-- ============================================
-- Function to update timestamps
-- ============================================

CREATE OR REPLACE FUNCTION update_family_sharing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_family_shares_timestamp ON family_shares;
CREATE TRIGGER update_family_shares_timestamp
  BEFORE UPDATE ON family_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_family_sharing_updated_at();

DROP TRIGGER IF EXISTS update_shared_pets_timestamp ON shared_pets;
CREATE TRIGGER update_shared_pets_timestamp
  BEFORE UPDATE ON shared_pets
  FOR EACH ROW
  EXECUTE FUNCTION update_family_sharing_updated_at();

-- ============================================
-- Function to link user when they register
-- ============================================

CREATE OR REPLACE FUNCTION link_family_shares_on_user_create()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new user is created, check if they have pending family shares
  UPDATE family_shares
  SET
    shared_with_user_id = NEW.id,
    updated_at = NOW()
  WHERE
    shared_with_email = LOWER(NEW.email)
    AND shared_with_user_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-link family shares when user signs up
DROP TRIGGER IF EXISTS link_family_shares_trigger ON auth.users;
CREATE TRIGGER link_family_shares_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION link_family_shares_on_user_create();

-- ============================================
-- Helper function to count family members for a user
-- ============================================

CREATE OR REPLACE FUNCTION get_family_member_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO count_result
  FROM family_shares
  WHERE owner_id = user_id
  AND status IN ('pending', 'accepted');

  RETURN COALESCE(count_result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Helper function to get shared pets for a family share
-- ============================================

CREATE OR REPLACE FUNCTION get_shared_pets_for_share(share_id UUID)
RETURNS TABLE (
  pet_id UUID,
  pet_name TEXT,
  pet_species TEXT,
  share_calendar BOOLEAN,
  share_vaccinations BOOLEAN,
  share_medical_records BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.species,
    sp.share_calendar,
    sp.share_vaccinations,
    sp.share_medical_records
  FROM shared_pets sp
  JOIN pets p ON p.id = sp.pet_id
  WHERE sp.family_share_id = share_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON TABLE family_shares IS 'Stores family sharing relationships between pet owners and family members';
COMMENT ON TABLE shared_pets IS 'Stores which specific pets are shared with each family member';
COMMENT ON COLUMN family_shares.status IS 'pending = invited but not responded, accepted = actively sharing, declined = rejected invitation';
COMMENT ON COLUMN family_shares.access_level IS 'reader = read-only access (only option for now)';
COMMENT ON COLUMN shared_pets.share_calendar IS 'Whether calendar events for this pet are visible to the family member';
COMMENT ON COLUMN shared_pets.share_vaccinations IS 'Whether vaccination records for this pet are visible to the family member';
COMMENT ON COLUMN shared_pets.share_medical_records IS 'Whether medical records for this pet are visible to the family member';
