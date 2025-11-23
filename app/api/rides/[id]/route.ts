import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/rides/[id]
 * Delete a ride
 * Requires userId query param to verify ownership (or admin status)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const rideId = params.id

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!rideId) {
      return NextResponse.json({ error: 'Ride ID is required' }, { status: 400 })
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isAdmin = userData.is_admin === true

    // If not admin, verify ownership
    if (!isAdmin) {
      const { data: ride, error: rideError } = await supabaseAdmin
        .from('rides')
        .select('driver_id')
        .eq('id', rideId)
        .single()

      if (rideError || !ride) {
        return NextResponse.json({ error: 'Ride not found' }, { status: 404 })
      }

      if (ride.driver_id !== userId) {
        return NextResponse.json({ error: 'Unauthorized: You can only delete your own rides' }, { status: 403 })
      }
    }

    // Delete the ride using admin client to bypass RLS
    const { error: deleteError } = await supabaseAdmin
      .from('rides')
      .delete()
      .eq('id', rideId)

    if (deleteError) {
      console.error('Error deleting ride:', deleteError)
      return NextResponse.json({ error: 'Failed to delete ride' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in delete ride endpoint:', error)
    return NextResponse.json({ error: 'Failed to delete ride' }, { status: 500 })
  }
}

