# Architecture Refactor - Children Management System

## Overview

This document describes the refactored architecture that adds a proper children table with many-to-many relationships to parents, enabling better child management and parent contact information display.

## Database Schema (Updated)

### New Tables

#### `children`
Stores registered children with first and last names.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique child identifier |
| `first_name` | VARCHAR(255) | NOT NULL | Child's first name |
| `last_name` | VARCHAR(255) | NULL | Child's last name (optional) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_children_first_name` on `first_name`
- `idx_children_last_name` on `last_name`
- `idx_children_name_search` - Full-text search index

#### `child_parents` (Junction Table)
Many-to-many relationship between children and parents.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `child_id` | TEXT | PRIMARY KEY, FK → children(id) | Reference to child |
| `parent_id` | TEXT | PRIMARY KEY, FK → users(id) | Reference to parent |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Link creation timestamp |

**Indexes:**
- `idx_child_parents_child_id` on `child_id`
- `idx_child_parents_parent_id` on `parent_id`

### Updated Tables

#### `passengers`
Now supports linking to registered children via `child_id`.

- `child_id` - Now actively used to reference registered children
- `child_name` - Still required for display (denormalized)

## Entity Relationship Diagram (ERD)

```
┌─────────────┐
│    users    │
├─────────────┤
│ id (PK)     │◄─────┐
│ name        │      │
│ email       │      │
│ phone       │      │
│ is_admin    │      │
└─────────────┘      │
                     │
┌─────────────┐      │      ┌──────────────┐
│  children   │      │      │ child_parents│
├─────────────┤      │      ├──────────────┤
│ id (PK)     │◄─────┼──────┤ child_id (FK)│
│ first_name  │      │      │ parent_id(FK)│
│ last_name   │      │      └──────────────┘
└─────────────┘      │
      │              │
      │              │
      ▼              │
┌─────────────┐      │
│ passengers  │      │
├─────────────┤      │
│ id (PK)     │      │
│ ride_id(FK) │      │
│ child_id(FK)├──────┘
│ child_name  │
│ parent_id(FK)├──────┐
│ parent_name │      │
└─────────────┘      │
      │              │
      │              │
      ▼              │
┌─────────────┐      │
│    rides    │      │
├─────────────┤      │
│ id (PK)     │      │
│ driver_id(FK)├─────┘
│ driver_name │
│ date        │
│ direction   │
│ total_seats │
│ available_seats│
└─────────────┘
```

## Relationships

1. **Users ↔ Children** (Many-to-Many via `child_parents`)
   - A child can have multiple parents
   - A parent can have multiple children

2. **Children ↔ Passengers** (One-to-Many)
   - A child can be a passenger on multiple rides
   - Each passenger can reference a registered child (optional)

3. **Users ↔ Passengers** (One-to-Many)
   - A parent can assign multiple children to rides
   - Each passenger has one assigning parent

4. **Users ↔ Rides** (One-to-Many)
   - A driver can create multiple rides
   - Each ride has one driver

5. **Rides ↔ Passengers** (One-to-Many)
   - A ride can have multiple passengers
   - Each passenger belongs to one ride

## API Specification

### Children Endpoints

#### `POST /api/children`
Create a child and link to one or more parents.

**Request Body:**
```json
{
  "firstName": "Daniel",
  "lastName": "Cohen",
  "parentIds": ["user1", "user2"]
}
```

**Response:** `201 Created`
```json
{
  "id": "child_1234567890_abc123",
  "firstName": "Daniel",
  "lastName": "Cohen",
  "parentIds": ["user1", "user2"],
  "parents": [
    {
      "id": "user1",
      "name": "Yael Cohen",
      "email": "yael@example.com",
      "phone": "0501234567"
    },
    {
      "id": "user2",
      "name": "Tomer Cohen",
      "email": "tomer@example.com",
      "phone": "0549876543"
    }
  ]
}
```

#### `POST /api/children/{childId}/parents/{parentId}`
Link an additional parent to a child.

**Response:** `200 OK`
```json
{
  "id": "child_1234567890_abc123",
  "firstName": "Daniel",
  "lastName": "Cohen",
  "parentIds": ["user1", "user2", "user3"],
  "parents": [...]
}
```

#### `GET /api/children/search?query=XXX`
Search children by name (case-insensitive, contains matching).

**Query Parameters:**
- `query` (required) - Search term (minimum 2 characters)

**Response:** `200 OK`
```json
[
  {
    "id": "child_1234567890_abc123",
    "firstName": "Daniel",
    "lastName": "Cohen"
  },
  {
    "id": "child_1234567891_def456",
    "firstName": "Dana",
    "lastName": "Cohen"
  }
]
```

### Updated Trip Endpoints

#### `GET /api/admin/rides?userId=XXX`
Returns rides with enriched passenger data including child and parent information.

**Response:**
```json
[
  {
    "id": "ride123",
    "driverId": "user1",
    "driverName": "Driver Name",
    "date": "2025-01-15",
    "direction": "to-school",
    "passengers": [
      {
        "id": "passenger1",
        "childId": "child_1234567890_abc123",
        "childName": "Daniel Cohen",
        "child": {
          "id": "child_1234567890_abc123",
          "firstName": "Daniel",
          "lastName": "Cohen",
          "parents": [
            {
              "id": "user2",
              "name": "Yael Cohen",
              "phone": "0501234567"
            },
            {
              "id": "user3",
              "name": "Tomer Cohen",
              "phone": "0549876543"
            }
          ]
        },
        "parentId": "user2",
        "parentName": "Yael Cohen",
        "pickupFromHome": false
      }
    ]
  }
]
```

## Frontend Components

### ChildAutocomplete Component
Reusable auto-complete component for searching and selecting registered children.

**Props:**
- `value: Child | null` - Currently selected child
- `onChange: (child: Child | null) => void` - Callback when child is selected
- `placeholder?: string` - Input placeholder text
- `className?: string` - Additional CSS classes
- `disabled?: boolean` - Disable the input

**Features:**
- Real-time search as user types (debounced)
- Minimum 2 characters to search
- Dropdown with search results
- Click outside to close
- Clear button when child is selected

### Updated Pages

#### Parent Page (`app/parent/page.tsx`)
- Replaced free-text child input with `ChildAutocomplete`
- Supports both registered children (via autocomplete) and manual entry
- When registered child is selected, uses `child_id` when adding passenger
- Validates for duplicate children (by ID or name)

#### Driver Page (`app/driver/page.tsx`)
- Displays all parents for each child in trip details
- Shows parents from `child.parents` array if child is registered
- Falls back to assigning parent if child is not registered
- Each parent name is a clickable `tel:` link with hover tooltip showing phone number

## Data Flow

### Adding a Child to a Ride

1. **Parent searches for child** using `ChildAutocomplete`
2. **Component calls** `GET /api/children/search?query=XXX`
3. **Parent selects child** from results
4. **Parent submits form** with child selection
5. **Frontend creates passenger** with `childId` and `childName`
6. **API call** `addPassenger()` with passenger data
7. **Backend validates** child exists and ride has available seats
8. **Backend inserts** passenger record with `child_id` populated

### Displaying Trip Details

1. **Frontend fetches rides** via `getRides()` or admin endpoint
2. **Backend queries** passengers with `child_id`
3. **Backend fetches** children with parents for passengers that have `child_id`
4. **Backend enriches** passenger objects with `child` data including `parents` array
5. **Frontend displays** child name with list of all parents
6. **Each parent** is displayed as clickable phone link

## Migration Strategy

### Step 1: Run Migration
```sql
-- Run migrations/009_create_children_table.sql
```

### Step 2: Register Children
- Use `POST /api/children` to register children
- Link parents using `POST /api/children/{childId}/parents/{parentId}`

### Step 3: Gradual Adoption
- Existing passengers continue to work (no `child_id` required)
- New passengers can use registered children via autocomplete
- Manual entry still supported for unregistered children

## Benefits

1. **Better Data Integrity**
   - Children are registered once, referenced many times
   - Consistent child names across rides

2. **Parent Contact Information**
   - All parents for a child are visible
   - Easy contact via phone links

3. **Search Functionality**
   - Quick child lookup via autocomplete
   - Reduces typos and inconsistencies

4. **Scalability**
   - Many-to-many relationship supports complex family structures
   - Easy to add/remove parents from children

5. **Backward Compatibility**
   - Existing passengers without `child_id` still work
   - Manual entry still supported

## Future Enhancements

1. **Child Profile Pages**
   - View all rides a child has been on
   - View all parents linked to child

2. **Parent Management UI**
   - Add/remove parents from child profile
   - Manage parent contact information

3. **Child Registration Flow**
   - Dedicated form for registering new children
   - Bulk import from existing data

4. **Notifications**
   - Notify all parents when child is added to ride
   - Notify parents when ride details change

