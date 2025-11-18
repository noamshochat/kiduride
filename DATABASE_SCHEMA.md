# Database Schema for KiduRide

This document describes the PostgreSQL database schema for the KiduRide application.

## Overview

The application manages carpool rides for children, where:
- **Users** can be both drivers and parents (no role separation)
- **Rides** are created by drivers for specific dates and directions
- **Passengers** are children assigned to rides by their parents

## Tables

### 1. `users`

Stores all application users (drivers and/or parents).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | Unique user identifier |
| `name` | VARCHAR(255) | NOT NULL | User's full name |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User's email address (used for login) |
| `phone` | VARCHAR(50) | NULL | User's phone number (optional) |
| `child_name` | VARCHAR(255) | NOT NULL | Name of the user's child |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_users_email` on `email` (for login lookups)
- `idx_users_id` on `id` (primary key, automatically indexed)

**Notes:**
- **No role field** - any user can create rides (as a driver) or assign children to rides (as a parent)
- Each user has a `name` field that stores their full name
- Each user has a `child_name` field that stores the name of their child (each user has at least one child)
- The same user can be both a driver (create rides) and a parent (assign children to rides)
- Email must be unique for authentication
- When assigning a child to a ride, the `child_name` from the user's record can be used, or a different name can be entered on-the-fly

---

### 2. `rides`

Stores ride information created by drivers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | Unique ride identifier |
| `driver_id` | UUID | FOREIGN KEY → users(id), NOT NULL | ID of the user who created the ride |
| `driver_name` | VARCHAR(255) | NOT NULL | Driver's name (denormalized for performance) |
| `date` | DATE | NOT NULL | Date of the ride (ISO format: YYYY-MM-DD) |
| `direction` | VARCHAR(20) | NOT NULL, CHECK (direction IN ('to-school', 'from-school')) | Direction of travel |
| `total_seats` | INTEGER | NOT NULL, CHECK (total_seats > 0) | Total number of seats in the vehicle |
| `available_seats` | INTEGER | NOT NULL, CHECK (available_seats >= 0) | Number of available seats |
| `pickup_address` | TEXT | NOT NULL | Default pickup address for the ride |
| `notes` | TEXT | NULL | Optional notes about the ride |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Ride creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_rides_date` on `date` (for filtering rides by date)
- `idx_rides_driver_id` on `driver_id` (for finding rides by driver)
- `idx_rides_date_direction` on `(date, direction)` (composite index for common queries)
- `idx_rides_id` on `id` (primary key, automatically indexed)

**Constraints:**
- `available_seats` must be <= `total_seats` (enforced by application logic or trigger)
- `available_seats` must be >= 0

**Notes:**
- `driver_id` references the user who created the ride (from `users.id`)
- `driver_name` is denormalized from `users.name` to avoid joins when displaying ride lists
  - **Important:** When creating a ride, `driver_name` should be copied from the user's `name` field
  - If a user updates their name, existing rides will still show the old name (historical accuracy)
- `available_seats` is calculated/updated when passengers are added/removed
- `date` is stored as DATE type for proper date operations

---

### 3. `passengers`

Stores children assigned to rides by their parents.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | Unique passenger identifier |
| `ride_id` | UUID | FOREIGN KEY → rides(id) ON DELETE CASCADE, NOT NULL | ID of the ride |
| `child_id` | UUID | NULL | Optional reference to a pre-registered child (not currently used) |
| `child_name` | VARCHAR(255) | NOT NULL | Name of the child (entered on-the-fly) |
| `parent_id` | UUID | FOREIGN KEY → users(id), NOT NULL | ID of the parent who assigned the child |
| `parent_name` | VARCHAR(255) | NOT NULL | Parent's name (denormalized for performance) |
| `pickup_from_home` | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether child should be picked up from home |
| `pickup_address` | TEXT | NULL | Custom pickup address (if different from ride's default) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Assignment timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_passengers_ride_id` on `ride_id` (for finding all passengers on a ride)
- `idx_passengers_parent_id` on `parent_id` (for finding all children assigned by a parent)
- `idx_passengers_ride_parent` on `(ride_id, parent_id)` (composite index for common queries)
- `idx_passengers_id` on `id` (primary key, automatically indexed)

**Constraints:**
- `ride_id` must reference an existing ride (enforced by foreign key)
- `parent_id` must reference an existing user (enforced by foreign key)
- If `pickup_from_home` is TRUE, `pickup_address` should be provided (enforced by application logic)

**Notes:**
- `parent_id` references the user who assigned the child (from `users.id`)
- `child_id` is optional because children don't need to be pre-registered
- `parent_name` is denormalized from `users.name` to avoid joins when displaying passenger lists
  - **Important:** When adding a passenger, `parent_name` should be copied from the user's `name` field
  - If a user updates their name, existing passenger records will still show the old name (historical accuracy)
- `pickup_address` is optional - if not provided, uses the ride's default `pickup_address`
- CASCADE delete: if a ride is deleted, all its passengers are automatically deleted

---

## Relationships

### Users ↔ Rides (One-to-Many)
- **One user can create many rides (as a driver)**
- Each ride belongs to exactly one driver
- **Foreign Key:** `rides.driver_id` → `users.id`
- The same user can also be a parent (assign children to other rides)

### Users ↔ Passengers (One-to-Many)
- **One user can assign many children to rides (as a parent)**
- Each passenger belongs to exactly one parent
- **Foreign Key:** `passengers.parent_id` → `users.id`
- The same user can also be a driver (create their own rides)

### Key Point: Dual Role Support
- **Any user can be both a driver AND a parent**
- A user can create rides (driver role) and also assign their children to other users' rides (parent role)
- There is no role separation - all users have the same capabilities
- Each user has a single `name` field in the `users` table that is used for both roles

### Rides ↔ Passengers (One-to-Many)
- One ride can have many passengers
- Each passenger belongs to exactly one ride
- **Foreign Key:** `passengers.ride_id` → `rides.id` (with CASCADE DELETE)

### Diagram

```
users
  ├── id (PK)
  ├── name
  ├── email (UNIQUE)
  └── phone

rides
  ├── id (PK)
  ├── driver_id (FK → users.id)
  ├── driver_name (denormalized)
  ├── date
  ├── direction
  ├── total_seats
  ├── available_seats
  ├── pickup_address
  └── notes

passengers
  ├── id (PK)
  ├── ride_id (FK → rides.id, CASCADE DELETE)
  ├── child_id (optional, not currently used)
  ├── child_name
  ├── parent_id (FK → users.id)
  ├── parent_name (denormalized)
  ├── pickup_from_home
  └── pickup_address
```

---

## Data Integrity Rules

1. **Seat Availability:**
   - `available_seats` must be recalculated when passengers are added/removed
   - `available_seats` cannot exceed `total_seats`
   - Cannot add a passenger if `available_seats` is 0

2. **Passenger Assignment:**
   - A passenger must have a valid `ride_id` and `parent_id`
   - If `pickup_from_home` is TRUE, `pickup_address` should be provided

3. **Ride Deletion:**
   - Deleting a ride automatically deletes all associated passengers (CASCADE)

4. **User Deletion:**
   - If a user is deleted, their rides should be handled (either prevent deletion or CASCADE)
   - If a user is deleted, their passenger assignments should be handled

---

## Common Queries

### Get all rides for a specific date
```sql
SELECT * FROM rides WHERE date = '2025-11-20' ORDER BY direction, created_at;
```

### Get all passengers for a ride
```sql
SELECT * FROM passengers WHERE ride_id = '...' ORDER BY created_at;
```

### Get all rides created by a driver
```sql
SELECT * FROM rides WHERE driver_id = '...' ORDER BY date DESC;
```

### Get all children assigned by a parent
```sql
SELECT p.*, r.date, r.direction, r.driver_name 
FROM passengers p
JOIN rides r ON p.ride_id = r.id
WHERE p.parent_id = '...'
ORDER BY r.date DESC;
```

### Get available rides (with seat availability)
```sql
SELECT * FROM rides 
WHERE date = '2025-11-20' 
  AND available_seats > 0
ORDER BY direction, created_at;
```

### Update available seats after passenger addition
```sql
UPDATE rides 
SET available_seats = available_seats - 1,
    updated_at = NOW()
WHERE id = '...' AND available_seats > 0;
```

---

## Migration Considerations

### From Google Sheets to PostgreSQL

1. **ID Generation:**
   - Current: String IDs (e.g., "r1234567890", "p1234567890")
   - PostgreSQL: UUIDs (recommended) or keep string IDs for compatibility

2. **Date Storage:**
   - Current: ISO date strings ("2025-11-20")
   - PostgreSQL: DATE type (native date operations)

3. **Denormalized Fields:**
   - `driver_name` in `rides` table
   - `parent_name` in `passengers` table
   - These can be kept for performance or removed and joined when needed

4. **Seat Management:**
   - Current: `available_seats` is calculated and stored
   - PostgreSQL: Can use triggers or application logic to maintain consistency

5. **Optional Fields:**
   - `child_id` in passengers (currently not used, can be removed or kept for future use)
   - `phone` in users (optional, can be NULL)

---

## Future Enhancements

1. **Children Table** (if pre-registration is needed):
   - `id`, `name`, `parent_id`, `date_of_birth`, etc.
   - Would link to `passengers.child_id`

2. **Ride Updates/Edits:**
   - Currently rides are created and deleted, but not updated
   - May need to track ride modifications

3. **Notifications:**
   - Track when parents are notified about ride changes
   - Track when drivers are notified about new passengers

4. **Audit Log:**
   - Track all changes to rides and passengers
   - Useful for debugging and compliance

