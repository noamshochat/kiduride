import { NextRequest, NextResponse } from 'next/server'
import { supabaseDb } from '@/lib/supabase-db'

// POST - Add passenger to a ride
export async function POST(request: NextRequest) {
  try {
    const { rideId, passenger } = await request.json()
    
    // Add passenger (validation happens inside supabaseDb.addPassenger)
    try {
      const success = await supabaseDb.addPassenger(rideId, passenger)
      if (success) {
        // Return success - client will refresh to see updated data
        return NextResponse.json({ success: true })
      } else {
        return NextResponse.json({ error: 'Failed to add passenger' }, { status: 500 })
      }
    } catch (error: any) {
      // Handle validation errors from supabaseDb
      if (error.message === 'Ride is full' || error.message === 'Child already assigned to this ride') {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      throw error
    }
  } catch (error) {
    console.error('Error adding passenger:', error)
    return NextResponse.json({ error: 'Failed to add passenger' }, { status: 500 })
  }
}

// DELETE - Remove passenger from a ride
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rideId = searchParams.get('rideId')
    const passengerId = searchParams.get('passengerId')
    
    if (!rideId || !passengerId) {
      return NextResponse.json({ error: 'Ride ID and Passenger ID required' }, { status: 400 })
    }
    
    const success = await supabaseDb.removePassenger(rideId, passengerId)
    if (success) {
      // Return success - client will refresh to see updated data
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Failed to remove passenger' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error removing passenger:', error)
    return NextResponse.json({ error: 'Failed to remove passenger' }, { status: 500 })
  }
}

