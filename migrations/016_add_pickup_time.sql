-- Add pickup_time column to rides table
-- This stores the pickup time in HH:MM format (24-hour format)

ALTER TABLE rides 
ADD COLUMN IF NOT EXISTS pickup_time TIME;

-- Add index for better query performance if needed
CREATE INDEX IF NOT EXISTS idx_rides_pickup_time ON rides(pickup_time);

