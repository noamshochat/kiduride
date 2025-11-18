-- KiduRide Database Schema
-- PostgreSQL Migration Script
-- Run this script to create the initial database schema

-- Enable UUID extension (for future use if switching to UUIDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: users
-- ============================================
-- Note: Each user can be both a driver (create rides) and a parent (assign children to rides)
-- There is no role separation - all users have the same capabilities
-- The 'name' field stores the user's full name, which is used for both driver and parent roles
-- The 'child_name' field stores the name of the user's child (each user has at least one child)
-- Note: Using TEXT for id to match existing demo data format. Can switch to UUID later.
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL, -- User's full name (used for both driver and parent roles)
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    child_name VARCHAR(255) NOT NULL, -- Name of the user's child
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_id ON users(id); -- Primary key is automatically indexed, but explicit for clarity

-- ============================================
-- Table: rides
-- ============================================
CREATE TABLE rides (
    id TEXT PRIMARY KEY,
    driver_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- References users.id (user can be both driver and parent)
    driver_name VARCHAR(255) NOT NULL, -- Denormalized from users.name (copied when ride is created)
    date DATE NOT NULL,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('to-school', 'from-school')),
    total_seats INTEGER NOT NULL CHECK (total_seats > 0),
    available_seats INTEGER NOT NULL CHECK (available_seats >= 0),
    pickup_address TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Ensure available_seats doesn't exceed total_seats
    CONSTRAINT check_available_seats CHECK (available_seats <= total_seats)
);

-- Indexes for rides
CREATE INDEX idx_rides_date ON rides(date);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_date_direction ON rides(date, direction);
CREATE INDEX idx_rides_id ON rides(id); -- Primary key is automatically indexed

-- ============================================
-- Table: passengers
-- ============================================
CREATE TABLE passengers (
    id TEXT PRIMARY KEY,
    ride_id TEXT NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    child_id TEXT, -- Optional, for future use if children are pre-registered
    child_name VARCHAR(255) NOT NULL,
    parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- References users.id (user can be both driver and parent)
    parent_name VARCHAR(255) NOT NULL, -- Denormalized from users.name (copied when passenger is added)
    pickup_from_home BOOLEAN NOT NULL DEFAULT FALSE,
    pickup_address TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for passengers
CREATE INDEX idx_passengers_ride_id ON passengers(ride_id);
CREATE INDEX idx_passengers_parent_id ON passengers(parent_id);
CREATE INDEX idx_passengers_ride_parent ON passengers(ride_id, parent_id);
CREATE INDEX idx_passengers_id ON passengers(id); -- Primary key is automatically indexed

-- ============================================
-- Triggers for updated_at timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON rides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_passengers_updated_at BEFORE UPDATE ON passengers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Function to update available_seats when passenger is added
-- ============================================
CREATE OR REPLACE FUNCTION update_ride_available_seats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Decrease available seats when passenger is added
        UPDATE rides 
        SET available_seats = available_seats - 1,
            updated_at = NOW()
        WHERE id = NEW.ride_id AND available_seats > 0;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Increase available seats when passenger is removed
        UPDATE rides 
        SET available_seats = available_seats + 1,
            updated_at = NOW()
        WHERE id = OLD.ride_id AND available_seats < total_seats;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger to automatically update available_seats
CREATE TRIGGER update_available_seats_on_passenger_change
    AFTER INSERT OR DELETE ON passengers
    FOR EACH ROW EXECUTE FUNCTION update_ride_available_seats();

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE users IS 'Stores all application users (drivers and/or parents)';
COMMENT ON TABLE rides IS 'Stores ride information created by drivers';
COMMENT ON TABLE passengers IS 'Stores children assigned to rides by their parents';

COMMENT ON COLUMN users.email IS 'Unique email address used for authentication';
COMMENT ON COLUMN users.phone IS 'Optional phone number for contact';
COMMENT ON COLUMN rides.driver_name IS 'Denormalized driver name for performance';
COMMENT ON COLUMN rides.available_seats IS 'Automatically updated when passengers are added/removed';
COMMENT ON COLUMN passengers.child_id IS 'Optional reference to pre-registered child (not currently used)';
COMMENT ON COLUMN passengers.parent_name IS 'Denormalized parent name for performance';
COMMENT ON COLUMN passengers.pickup_address IS 'Custom pickup address if different from ride default';

