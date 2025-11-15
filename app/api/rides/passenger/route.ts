import { NextRequest, NextResponse } from 'next/server'
import { googleSheets } from '@/lib/google-sheets'

// POST - Add passenger to a ride
export async function POST(request: NextRequest) {
  try {
    const { rideId, passenger } = await request.json()
    
    // Check if ride exists and get current state
    const rides = await googleSheets.getRides()
    const ride = rides.find((r: any) => r.id === rideId)
    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 })
    }
    
    // Check if ride is full
    if (ride.passengers.length >= ride.totalSeats) {
      return NextResponse.json({ error: 'Ride is full' }, { status: 400 })
    }
    
    // Check for duplicate child name
    const existingName = ride.passengers.find(
      (p: any) => p.childName.toLowerCase() === passenger.childName.toLowerCase()
    )
    if (existingName) {
      return NextResponse.json({ error: 'Child already assigned to this ride' }, { status: 400 })
    }
    
    // Add passenger
    const success = await googleSheets.addPassenger(rideId, passenger)
    if (success) {
      // Get updated ride
      const updatedRides = await googleSheets.getRides()
      const updatedRide = updatedRides.find((r: any) => r.id === rideId)
      return NextResponse.json({ success: true, ride: updatedRide })
    } else {
      return NextResponse.json({ error: 'Failed to add passenger' }, { status: 500 })
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
    
    const success = await googleSheets.removePassenger(rideId, passengerId)
    if (success) {
      // Get updated ride
      const rides = await googleSheets.getRides()
      const ride = rides.find((r: any) => r.id === rideId)
      return NextResponse.json({ success: true, ride })
    } else {
      return NextResponse.json({ error: 'Failed to remove passenger' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error removing passenger:', error)
    return NextResponse.json({ error: 'Failed to remove passenger' }, { status: 500 })
  }
}

