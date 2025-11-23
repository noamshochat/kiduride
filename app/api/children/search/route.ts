import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Search children by name (first or last name)
 * GET /api/children/search?query=XXX
 * Case-insensitive, supports "contains" matching
 */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    const searchTerm = query.trim()
    const searchPattern = `%${searchTerm}%`

    // Search in first_name and last_name (case-insensitive via ilike)
    // Note: ilike is case-insensitive, so no need for toLowerCase()
    // This is especially important for Hebrew text which doesn't have case
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .or(`first_name.ilike.${searchPattern},last_name.ilike.${searchPattern}`)
      .order('first_name', { ascending: true })
      .order('last_name', { ascending: true })
      .limit(50) // Limit results

    if (error) {
      console.error('Error searching children:', error)
      return NextResponse.json({ error: 'Failed to search children' }, { status: 500 })
    }

    // Also filter by full name concatenation in JavaScript for better Hebrew support
    // This ensures we catch matches like "אריאל ורשבסקי" when searching for "אריאל"
    // Note: For Hebrew text, case doesn't exist, so direct string matching is fine
    const filteredData = (data || []).filter((child: any) => {
      const firstName = child.first_name || ''
      const lastName = child.last_name || ''
      const fullName = `${firstName} ${lastName}`.trim()
      // Direct string matching (Hebrew doesn't have case)
      return (
        firstName.includes(searchTerm) ||
        lastName.includes(searchTerm) ||
        fullName.includes(searchTerm)
      )
    })

    // Transform to match our interface
    const children = filteredData.map((child: any) => ({
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

