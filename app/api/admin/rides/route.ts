import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Get all rides (admin only)
 * This endpoint validates admin status before returning all rides
 * Frontend must provide userId, and backend validates admin status from database
 */
export const dynamic = 'force-dynamic'

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

    console.log('[admin/rides API] Fetched rides from DB:', rides?.length || 0, 'rides')
    if (rides && rides.length > 0) {
      console.log('[admin/rides API] Ride directions:', rides.map((r: any) => ({ id: r.id, direction: r.direction, date: r.date })))
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

    // Fetch children with parents for passengers that have child_id
    const childIds = passengers
      ?.filter((p: any) => p.child_id)
      .map((p: any) => p.child_id)
      .filter((id: string, index: number, self: string[]) => self.indexOf(id) === index) || []

    const childrenWithParents: Record<string, any> = {}
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
    const passengersByRideId: Record<string, any[]> = {}
    if (passengers) {
      passengers.forEach((passenger: any) => {
        if (!passengersByRideId[passenger.ride_id]) {
          passengersByRideId[passenger.ride_id] = []
        }
        
        const passengerData: any = {
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
    const ridesWithPassengers = rides.map((ride: any) => ({
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

    return NextResponse.json(ridesWithPassengers)
  } catch (error) {
    console.error('Error in admin rides endpoint:', error)
    return NextResponse.json({ error: 'Failed to fetch admin rides' }, { status: 500 })
  }
}

