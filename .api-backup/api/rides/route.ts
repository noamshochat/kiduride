import { NextRequest, NextResponse } from 'next/server'
import { supabaseDb } from '@/lib/supabase-db'

// GET - Read all rides
export async function GET() {
  try {
    const rides = await supabaseDb.getRides()
    return NextResponse.json(rides)
  } catch (error) {
    console.error('Error reading rides:', error)
    return NextResponse.json({ error: 'Failed to read rides' }, { status: 500 })
  }
}

// POST - Create a new ride
export async function POST(request: NextRequest) {
  try {
    const ride = await request.json()
    const newRide = await supabaseDb.createRide(ride)
    return NextResponse.json(newRide)
  } catch (error) {
    console.error('Error creating ride:', error)
    return NextResponse.json({ error: 'Failed to create ride' }, { status: 500 })
  }
}

// PUT - Update a ride (if needed in the future)
export async function PUT(request: NextRequest) {
  try {
    // For now, updates are handled through delete + create
    // This can be implemented if needed
    return NextResponse.json({ error: 'Update not implemented yet' }, { status: 501 })
  } catch (error) {
    console.error('Error updating ride:', error)
    return NextResponse.json({ error: 'Failed to update ride' }, { status: 500 })
  }
}

// DELETE - Delete a ride
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Ride ID required' }, { status: 400 })
    }
    
    const success = await supabaseDb.deleteRide(id)
    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error deleting ride:', error)
    return NextResponse.json({ error: 'Failed to delete ride' }, { status: 500 })
  }
}

