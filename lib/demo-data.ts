// Demo data storage - simulates a database
// In production, this would be replaced with Supabase

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  child_name?: string; // Added for Supabase compatibility
}

export interface Child {
  id: string;
  name: string;
  parentId: string;
}

export type RideDirection = 'to-school' | 'from-school';

export interface Ride {
  id: string;
  driverId: string;
  driverName: string;
  date: string; // ISO date string
  direction: RideDirection;
  availableSeats: number;
  totalSeats: number;
  pickupAddress: string;
  notes?: string;
  passengers: Passenger[];
  createdAt: string;
}

export interface Passenger {
  id: string;
  childId?: string; // Optional now since children don't need to be pre-registered
  childName: string;
  parentId: string;
  parentName: string;
  pickupFromHome?: boolean;
  pickupAddress?: string; // Custom pickup address if different from ride's pickup address
}

// Helper functions for localStorage persistence
const STORAGE_KEYS = {
  USERS: 'kidoride_users',
  RIDES: 'kidoride_rides',
};

function getStoredUsers(): User[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    if (stored) {
      const users = JSON.parse(stored);
      // Remove roles field if it exists (migration from old format)
      return users.map((user: any) => {
        const { roles, role, ...rest } = user;
        return rest;
      });
    }
  } catch (e) {
    console.error('Error loading users from localStorage:', e);
  }
  return [];
}

function saveUsers(users: User[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Clean up old 'role' and 'roles' properties if they exist
    const cleanedUsers = users.map((user) => {
      const { role, roles, ...rest } = user as any;
      return rest;
    });
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cleanedUsers));
  } catch (e) {
    console.error('Error saving users to localStorage:', e);
  }
}

function getStoredRides(): Ride[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RIDES);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Error loading rides from localStorage:', e);
  }
  return [];
}

function saveRides(rides: Ride[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.RIDES, JSON.stringify(rides));
  } catch (e) {
    console.error('Error saving rides to localStorage:', e);
  }
}

// Initialize with default data if localStorage is empty
const defaultUsers: User[] = [
  {
    id: '1',
    name: 'John Driver',
    email: 'john@example.com',
    phone: '+1-555-0101',
  },
  {
    id: '2',
    name: 'Sarah Parent',
    email: 'sarah@example.com',
    phone: '+1-555-0102',
  },
  {
    id: '3',
    name: 'Mike Driver',
    email: 'mike@example.com',
    phone: '+1-555-0103',
  },
  {
    id: '4',
    name: 'Lisa Parent',
    email: 'lisa@example.com',
    phone: '+1-555-0104',
  },
  {
    id: '5',
    name: 'Alex Driver-Parent',
    email: 'alex@example.com',
    phone: '+1-555-0105',
  },
];

const defaultRides: Ride[] = [];

// Initialize storage (only for users, rides are now stored in file)
function initStorage() {
  if (typeof window === 'undefined') return;
  
  const storedUsers = getStoredUsers();
  
  if (storedUsers.length === 0) {
    saveUsers(defaultUsers);
  }
  
  // Rides are now stored in /data/rides.json via API routes
  // No need to initialize from localStorage
}

// Initialize on first load
if (typeof window !== 'undefined') {
  initStorage();
}

// In-memory storage (synced with localStorage)
let users: User[] = typeof window !== 'undefined' ? getStoredUsers() : defaultUsers;
let rides: Ride[] = typeof window !== 'undefined' ? getStoredRides() : defaultRides;

// Simulate API functions
export const demoData = {
  // User functions
  getUsers: (): User[] => {
    if (typeof window !== 'undefined') {
      users = getStoredUsers();
    }
    return users;
  },
  getUserById: (id: string): User | undefined => {
    if (typeof window !== 'undefined') {
      users = getStoredUsers();
    }
    return users.find(u => u.id === id);
  },
  getUserByEmail: (email: string): User | undefined => {
    if (typeof window !== 'undefined') {
      users = getStoredUsers();
    }
    return users.find(u => u.email === email);
  },
  addUser: (user: Omit<User, 'id'>): User => {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
    };
    users.push(newUser);
    saveUsers(users);
    return newUser;
  },

  // Ride functions - Now using API calls to file storage
  getRides: async (): Promise<Ride[]> => {
    try {
      const response = await fetch('/api/rides');
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching rides:', error);
      return [];
    }
  },
  getRidesByDate: async (date: string): Promise<Ride[]> => {
    try {
      const allRides = await demoData.getRides();
      return allRides.filter(r => r.date === date);
    } catch (error) {
      console.error('Error fetching rides by date:', error);
      return [];
    }
  },
  getRideById: async (id: string): Promise<Ride | undefined> => {
    try {
      const allRides = await demoData.getRides();
      return allRides.find(r => r.id === id);
    } catch (error) {
      console.error('Error fetching ride by id:', error);
      return undefined;
    }
  },
  getRidesByDriver: async (driverId: string): Promise<Ride[]> => {
    try {
      const allRides = await demoData.getRides();
      return allRides.filter(r => r.driverId === driverId);
    } catch (error) {
      console.error('Error fetching rides by driver:', error);
      return [];
    }
  },
  createRide: async (ride: Omit<Ride, 'id' | 'passengers' | 'createdAt'>): Promise<Ride> => {
    try {
      const response = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ride),
      });
      if (!response.ok) throw new Error('Failed to create ride');
      const newRide = await response.json();
      console.log('Ride created:', newRide);
      return newRide;
    } catch (error) {
      console.error('Error creating ride:', error);
      throw error;
    }
  },
  updateRide: async (id: string, updates: Partial<Ride>): Promise<Ride | null> => {
    try {
      const response = await fetch('/api/rides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error updating ride:', error);
      return null;
    }
  },
  deleteRide: async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/rides?id=${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting ride:', error);
      return false;
    }
  },

  // Passenger functions - Now using API calls
  addPassenger: async (rideId: string, passenger: Passenger): Promise<boolean> => {
    try {
      const response = await fetch('/api/rides/passenger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId, passenger }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error adding passenger:', error);
      return false;
    }
  },
  removePassenger: async (rideId: string, passengerId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/rides/passenger?rideId=${rideId}&passengerId=${passengerId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error removing passenger:', error);
      return false;
    }
  },
};

