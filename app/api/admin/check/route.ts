import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Check if a user is an admin
 * This endpoint validates admin status directly from the database
 * Frontend should never trust its own admin status - always check with backend
 */
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check admin status directly from database
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (error || !data) {
      console.error('Error checking admin status:', error)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return admin status from database (never trust frontend)
    return NextResponse.json({ isAdmin: data.is_admin === true })
  } catch (error) {
    console.error('Error in admin check:', error)
    return NextResponse.json({ error: 'Failed to check admin status' }, { status: 500 })
  }
}

