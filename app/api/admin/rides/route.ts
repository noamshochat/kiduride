import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Get all rides (admin only)
 * This endpoint validates admin status before returning all rides
 * Frontend must provide userId, and backend validates admin status from database
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // CRITICAL: Check admin status directly from database - never trust frontend
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      console.error('Error checking admin status:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only proceed if user is actually an admin (verified in database)
    if (userData.is_admin !== true) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }

    // User is confirmed admin - fetch all rides
    const { data: rides, error: ridesError } = await supabase
      .from('rides')
      .select('*')
      .order('date', { ascending: true })
      .order('created_at', { ascending: true })

    if (ridesError) {
      console.error('Error fetching rides:', ridesError)
      return NextResponse.json({ error: 'Failed to fetch rides' }, { status: 500 })
    }

    if (!rides || rides.length === 0) {
      return NextResponse.json([])
    }

    // Fetch passengers for all rides
    const { data: passengers, error: passengersError } = await supabase
      .from('passengers')
      .select('*')

    if (passengersError) {
      console.error('Error fetching passengers:', passengersError)
      // Return rides without passengers if passenger fetch fails
      return NextResponse.json(
        rides.map((ride: any) => ({
          id: ride.id,
          driverId: ride.driver_id,
          driverName: ride.driver_name,
          date: ride.date,
          direction: ride.direction,
          availableSeats: ride.available_seats,
          totalSeats: ride.total_seats,
          pickupAddress: ride.pickup_address,
          notes: ride.notes || undefined,
          passengers: [],
          createdAt: ride.created_at,
        }))
      )
    }

    // Group passengers by ride_id
    const passengersByRideId: Record<string, any[]> = {}
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
    const ridesWithPassengers = rides.map((ride: any) => ({
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

    return NextResponse.json(ridesWithPassengers)
  } catch (error) {
    console.error('Error in admin rides endpoint:', error)
    return NextResponse.json({ error: 'Failed to fetch admin rides' }, { status: 500 })
  }
}

