import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Search children by name (first or last name)
 * GET /api/children/search?query=XXX
 * Case-insensitive, supports "contains" matching
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    const searchTerm = query.trim().toLowerCase()

    // Search in both first_name and last_name (case-insensitive)
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
      .order('first_name', { ascending: true })
      .order('last_name', { ascending: true })
      .limit(50) // Limit results

    if (error) {
      console.error('Error searching children:', error)
      return NextResponse.json({ error: 'Failed to search children' }, { status: 500 })
    }

    // Transform to match our interface
    const children = (data || []).map((child: any) => ({
      id: child.id,
      firstName: child.first_name,
      lastName: child.last_name || undefined,
    }))

    return NextResponse.json(children)
  } catch (error) {
    console.error('Error in children search:', error)
    return NextResponse.json({ error: 'Failed to search children' }, { status: 500 })
  }
}

