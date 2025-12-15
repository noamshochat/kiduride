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
    const activity = searchParams.get('activity') // 'kidu' or 'tennis'

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    const searchTerm = query.trim()

    // Fetch all children with activity registration fields
    // Order by created_at DESC to get newest children first, then by first_name for consistency
    // This ensures newly created children are always included in search results
    const { data, error } = await supabase
      .from('children')
      .select('id, first_name, last_name, created_at, updated_at, is_registered_kidu, is_registered_tennis')
      .order('created_at', { ascending: false })
      .order('first_name', { ascending: true })
      .limit(500) // Limit to 500 to ensure reasonable performance

    if (error) {
      console.error('Error fetching children from database:', error)
      return NextResponse.json({ error: 'Failed to search children', details: error.message }, { status: 500 })
    }

    // Sort in JavaScript to avoid database collation issues with Hebrew text
    // Using localeCompare with Hebrew locale ensures proper sorting
    const childrenData = (data || []).sort((a: any, b: any) => {
      const aFirstName = (a.first_name || '').trim()
      const bFirstName = (b.first_name || '').trim()
      const aLastName = (a.last_name || '').trim()
      const bLastName = (b.last_name || '').trim()
      
      // Compare first names
      if (aFirstName !== bFirstName) {
        return aFirstName.localeCompare(bFirstName, 'he')
      }
      // If first names are equal, compare last names
      return aLastName.localeCompare(bLastName, 'he')
    })

    // Filter by first name, last name, and full name concatenation in JavaScript
    // Also filter by activity registration if activity is specified
    // This ensures reliable matching for Hebrew text regardless of database collation
    // Note: For Hebrew text, case doesn't exist, so direct string matching is fine
    const filteredData = childrenData.filter((child: any) => {
      // Filter by activity registration if activity is specified
      // NULL/undefined should be treated as false (not registered)
      // If activity is null/undefined, don't filter by activity - show all children
      if (activity === 'kidu') {
        const isRegistered = child.is_registered_kidu === true
        if (!isRegistered) {
          return false
        }
      } else if (activity === 'tennis') {
        const isRegistered = child.is_registered_tennis === true
        if (!isRegistered) {
          return false
        }
      }
      
      // Ensure we're working with strings and trim whitespace
      const firstName = String(child.first_name || '').trim()
      const lastName = String(child.last_name || '').trim()
      const fullName = `${firstName} ${lastName}`.trim()
      const search = String(searchTerm).trim()
      
      // Skip children without names
      if (!firstName && !lastName) {
        return false
      }
      
      // Direct string matching (Hebrew doesn't have case)
      // Check if search term appears in first name, last name, or full name
      // Use indexOf for reliable matching
      return (
        firstName.indexOf(search) !== -1 ||
        lastName.indexOf(search) !== -1 ||
        fullName.indexOf(search) !== -1
      )
    }).slice(0, 50) // Limit to 50 results after filtering

    // Transform to match our interface
    const children = filteredData.map((child: any) => ({
      id: child.id,
      firstName: child.first_name || '',
      lastName: child.last_name || undefined,
      is_registered_kidu: child.is_registered_kidu || false,
      is_registered_tennis: child.is_registered_tennis || false,
    }))

    // Prevent caching to ensure fresh results
    return NextResponse.json(children, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Error in children search:', error)
    return NextResponse.json({ error: 'Failed to search children' }, { status: 500 })
  }
}

