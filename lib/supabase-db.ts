import { supabase } from './supabase'
import { Ride, Passenger, User } from './demo-data'

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

    // Group passengers by ride_id
    const passengersByRideId: Record<string, Passenger[]> = {}
    if (passengers) {
      passengers.forEach((passenger: any) => {
        if (!passengersByRideId[passenger.ride_id]) {
          passengersByRideId[passenger.ride_id] = []
        }
        passengersByRideId[passenger.ride_id].push({
          id: passenger.id,
          childId: passenger.child_id || undefined,
          childName: passenger.child_name,
          parentId: passenger.parent_id,
          parentName: passenger.parent_name,
          pickupFromHome: passenger.pickup_from_home || false,
          pickupAddress: passenger.pickup_address || undefined,
        })
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
      notes: data.notes || undefined,
      passengers: [],
      createdAt: data.created_at,
    }
  },

  async deleteRide(rideId: string): Promise<boolean> {
    // Passengers will be deleted automatically due to CASCADE DELETE
    const { error } = await supabase
      .from('rides')
      .delete()
      .eq('id', rideId)

    if (error) {
      console.error('Error deleting ride:', error)
      return false
    }

    return true
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

    // Check for duplicate child name
    const existingName = ride.passengers.find(
      (p) => p.childName.toLowerCase() === passenger.childName.toLowerCase()
    )
    if (existingName) {
      throw new Error('Child already assigned to this ride')
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
        child_name: passenger.childName,
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
}

