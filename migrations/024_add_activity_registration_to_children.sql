-- Add activity registration columns to children table
-- Children can be registered for Kidu, Tennis, or both

-- ============================================
-- Add columns to children table
-- ============================================
ALTER TABLE children 
ADD COLUMN IF NOT EXISTS is_registered_kidu BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_registered_tennis BOOLEAN NOT NULL DEFAULT FALSE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_children_registered_kidu ON children(is_registered_kidu) WHERE is_registered_kidu = TRUE;
CREATE INDEX IF NOT EXISTS idx_children_registered_tennis ON children(is_registered_tennis) WHERE is_registered_tennis = TRUE;

