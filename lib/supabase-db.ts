import { supabase } from './supabase'
import { Ride, Passenger, User, Child } from './demo-data'

// Database service using Supabase
export const supabaseDb = {
  // User functions
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return []
    }

    return data || []
  },

  async getUserById(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return undefined
    }

    return data || undefined
  },

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      console.error('Error fetching user by email:', error)
      return undefined
    }

    return data || undefined
  },

  // Ride functions
  async getRides(): Promise<Ride[]> {
    // Fetch rides with their passengers
    const { data: rides, error: ridesError } = await supabase
      .from('rides')
      .select('*')
      .order('date', { ascending: true })
      .order('created_at', { ascending: true })

    if (ridesError) {
      console.error('Error fetching rides:', ridesError)
      return []
    }

    if (!rides || rides.length === 0) {
      return []
    }

    // Fetch passengers for all rides
    const { data: passengers, error: passengersError } = await supabase
      .from('passengers')
      .select('*')

    if (passengersError) {
      console.error('Error fetching passengers:', passengersError)
      // Return rides without passengers if passenger fetch fails
      return rides.map(ride => ({
        ...ride,
        passengers: [],
      }))
    }

    // Fetch children with parents for passengers that have child_id
    const childIds = passengers
      ?.filter((p: any) => p.child_id)
      .map((p: any) => p.child_id)
      .filter((id: string, index: number, self: string[]) => self.indexOf(id) === index) || []

    const childrenWithParents: Record<string, Child> = {}
    if (childIds.length > 0) {
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select(`
          *,
          child_parents (
            parent_id,
            users:parent_id (
              id,
              name,
              email,
              phone
            )
          )
        `)
        .in('id', childIds)

      if (!childrenError && childrenData) {
        childrenData.forEach((child: any) => {
          childrenWithParents[child.id] = {
            id: child.id,
            firstName: child.first_name,
            lastName: child.last_name || undefined,
            parentIds: child.child_parents?.map((cp: any) => cp.parent_id) || [],
            parents: child.child_parents?.map((cp: any) => ({
              id: cp.users.id,
              name: cp.users.name,
              email: cp.users.email,
              phone: cp.users.phone || undefined,
            })) || [],
          }
        })
      }
    }

    // Group passengers by ride_id and enrich with child/parent data
    const passengersByRideId: Record<string, Passenger[]> = {}
    if (passengers) {
      passengers.forEach((passenger: any) => {
        if (!passengersByRideId[passenger.ride_id]) {
          passengersByRideId[passenger.ride_id] = []
        }
        
        const passengerData: Passenger = {
          id: passenger.id,
          childId: passenger.child_id || undefined,
          childName: passenger.child_name,
          parentId: passenger.parent_id,
          parentName: passenger.parent_name,
          pickupFromHome: passenger.pickup_from_home || false,
          pickupAddress: passenger.pickup_address || undefined,
        }

        // If passenger has a child_id, attach child with parents
        if (passenger.child_id && childrenWithParents[passenger.child_id]) {
          passengerData.child = childrenWithParents[passenger.child_id]
        }

        passengersByRideId[passenger.ride_id].push(passengerData)
      })
    }

    // Attach passengers to rides
    return rides.map((ride: any) => ({
      id: ride.id,
      driverId: ride.driver_id,
      driverName: ride.driver_name,
      date: ride.date,
      direction: ride.direction,
      availableSeats: ride.available_seats,
      totalSeats: ride.total_seats,
      pickupAddress: ride.pickup_address,
      pickupTime: ride.pickup_time || undefined,
      notes: ride.notes || undefined,
      passengers: passengersByRideId[ride.id] || [],
      createdAt: ride.created_at,
    }))
  },

  async getRidesByDate(date: string): Promise<Ride[]> {
    const allRides = await this.getRides()
    return allRides.filter(ride => ride.date === date)
  },

  async getRideById(id: string): Promise<Ride | undefined> {
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', id)
      .single()

    if (rideError || !ride) {
      console.error('Error fetching ride:', rideError)
      return undefined
    }

    // Fetch passengers for this ride
    const { data: passengers, error: passengersError } = await supabase
      .from('passengers')
      .select('*')
      .eq('ride_id', id)

    const ridePassengers: Passenger[] = passengers
      ? passengers.map((p: any) => ({
          id: p.id,
          childId: p.child_id || undefined,
          childName: p.child_name,
          parentId: p.parent_id,
          parentName: p.parent_name,
          pickupFromHome: p.pickup_from_home || false,
          pickupAddress: p.pickup_address || undefined,
        }))
      : []

    return {
      id: ride.id,
      driverId: ride.driver_id,
      driverName: ride.driver_name,
      date: ride.date,
      direction: ride.direction,
      availableSeats: ride.available_seats,
      totalSeats: ride.total_seats,
      pickupAddress: ride.pickup_address,
      pickupTime: ride.pickup_time || undefined,
      notes: ride.notes || undefined,
      passengers: ridePassengers,
      createdAt: ride.created_at,
    }
  },

  async getRidesByDriver(driverId: string): Promise<Ride[]> {
    const allRides = await this.getRides()
    return allRides.filter(ride => ride.driverId === driverId)
  },

  async createRide(ride: Omit<Ride, 'id' | 'passengers' | 'createdAt'>): Promise<Ride> {
    // Generate ID in the same format as demo data (r + timestamp)
    const rideId = `r${Date.now()}`
    
    const { data, error } = await supabase
      .from('rides')
      .insert({
        id: rideId,
        driver_id: ride.driverId,
        driver_name: ride.driverName,
        date: ride.date,
        direction: ride.direction,
        total_seats: ride.totalSeats,
        available_seats: ride.availableSeats,
        pickup_address: ride.pickupAddress,
        pickup_time: ride.pickupTime || null,
        notes: ride.notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating ride:', error)
      throw error
    }

    return {
      id: data.id,
      driverId: data.driver_id,
      driverName: data.driver_name,
      date: data.date,
      direction: data.direction,
      availableSeats: data.available_seats,
      totalSeats: data.total_seats,
      pickupAddress: data.pickup_address,
      pickupTime: data.pickup_time || undefined,
      notes: data.notes || undefined,
      passengers: [],
      createdAt: data.created_at,
    }
  },

  async deleteRide(rideId: string, userId?: string, isAdmin?: boolean): Promise<boolean> {
    try {
      // Use API route for deletion to ensure proper authorization and bypass RLS when needed
      const url = `/api/rides/${rideId}?userId=${encodeURIComponent(userId || '')}`
      const response = await fetch(url, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error deleting ride:', errorData.error || response.statusText)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deleting ride:', error)
      return false
    }
  },

  // Passenger functions
  async addPassenger(rideId: string, passenger: Passenger): Promise<boolean> {
    // First, get the ride to validate and get parent name
    const ride = await this.getRideById(rideId)
    if (!ride) {
      return false
    }

    // Check if ride is full
    if (ride.availableSeats <= 0) {
      throw new Error('Ride is full')
    }

    // If child_id is provided, fetch child name and validate
    let childName = passenger.childName
    if (passenger.childId) {
      const child = await this.getChildWithParents(passenger.childId)
      if (!child) {
        throw new Error('Child not found')
      }
      // Use child's full name if not provided
      childName = childName || `${child.firstName}${child.lastName ? ' ' + child.lastName : ''}`
    }

    // Check for duplicate child (by child_id if provided, or by name)
    if (passenger.childId) {
      const existingChild = ride.passengers.find((p) => p.childId === passenger.childId)
      if (existingChild) {
        throw new Error('Child already assigned to this ride')
      }
    } else {
      const existingName = ride.passengers.find(
        (p) => p.childName.toLowerCase() === childName.toLowerCase()
      )
      if (existingName) {
        throw new Error('Child already assigned to this ride')
      }
    }

    // Generate passenger ID in the same format as demo data (p + timestamp)
    const passengerId = passenger.id || `p${Date.now()}`

    // Insert passenger
    const { error: passengerError } = await supabase
      .from('passengers')
      .insert({
        id: passengerId,
        ride_id: rideId,
        child_id: passenger.childId || null,
        child_name: childName,
        parent_id: passenger.parentId,
        parent_name: passenger.parentName,
        pickup_from_home: passenger.pickupFromHome || false,
        pickup_address: passenger.pickupAddress || null,
      })

    if (passengerError) {
      console.error('Error adding passenger:', passengerError)
      return false
    }

    // Update available seats (trigger should handle this, but we'll do it explicitly too)
    const { error: updateError } = await supabase
      .from('rides')
      .update({ available_seats: ride.availableSeats - 1 })
      .eq('id', rideId)

    if (updateError) {
      console.error('Error updating available seats:', updateError)
      // Passenger was added, so we'll continue even if seat update fails
    }

    return true
  },

  async removePassenger(rideId: string, passengerId: string): Promise<boolean> {
    // Get ride to update available seats
    const ride = await this.getRideById(rideId)
    if (!ride) {
      return false
    }

    // Delete passenger
    const { error } = await supabase
      .from('passengers')
      .delete()
      .eq('id', passengerId)
      .eq('ride_id', rideId)

    if (error) {
      console.error('Error removing passenger:', error)
      return false
    }

    // Update available seats (trigger should handle this, but we'll do it explicitly too)
    const { error: updateError } = await supabase
      .from('rides')
      .update({ available_seats: ride.availableSeats + 1 })
      .eq('id', rideId)

    if (updateError) {
      console.error('Error updating available seats:', updateError)
      // Passenger was removed, so we'll continue even if seat update fails
    }

    return true
  },

  // Admin functions - these check admin status via API (backend validation)
  async checkIsAdmin(userId: string): Promise<boolean> {
    try {
      // Call backend API to check admin status - never trust frontend
      const response = await fetch('/api/admin/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      return data.isAdmin === true
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  },

  async getAllRidesAdmin(userId: string): Promise<Ride[]> {
    try {
      // Call backend API - backend validates admin status before returning data
      const response = await fetch(`/api/admin/rides?userId=${encodeURIComponent(userId)}`)

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Unauthorized: Admin access required')
        }
        throw new Error('Failed to fetch admin rides')
      }

      const rides = await response.json()
      console.log('[getAllRidesAdmin] Received rides from API:', rides.length, 'rides')
      console.log('[getAllRidesAdmin] Ride directions:', rides.map((r: Ride) => ({ id: r.id, direction: r.direction, date: r.date })))
      return rides
    } catch (error) {
      console.error('Error fetching admin rides:', error)
      throw error
    }
  },

  // Children functions
  async searchChildren(query: string): Promise<Child[]> {
    try {
      const response = await fetch(`/api/children/search?query=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error('Failed to search children')
      }
      return await response.json()
    } catch (error) {
      console.error('Error searching children:', error)
      throw error
    }
  },

  async createChild(child: { firstName: string; lastName?: string; parentIds: string[] }): Promise<Child> {
    try {
      const response = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(child),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create child')
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating child:', error)
      throw error
    }
  },

  async linkParentToChild(childId: string, parentId: string): Promise<Child> {
    try {
      const response = await fetch(`/api/children/${childId}/parents/${parentId}`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to link parent')
      }

      return await response.json()
    } catch (error) {
      console.error('Error linking parent:', error)
      throw error
    }
  },

  async getChildWithParents(childId: string): Promise<Child | undefined> {
    try {
      const { data, error } = await supabase
        .from('children')
        .select(`
          *,
          child_parents (
            parent_id,
            users:parent_id (
              id,
              name,
              email,
              phone
            )
          )
        `)
        .eq('id', childId)
        .single()

      if (error || !data) {
        return undefined
      }

      return {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name || undefined,
        parentIds: data.child_parents?.map((cp: any) => cp.parent_id) || [],
        parents: data.child_parents?.map((cp: any) => ({
          id: cp.users.id,
          name: cp.users.name,
          email: cp.users.email,
          phone: cp.users.phone || undefined,
        })) || [],
      }
    } catch (error) {
      console.error('Error fetching child with parents:', error)
      return undefined
    }
  },
}

