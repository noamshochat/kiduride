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
    console.log('=== CHILDREN SEARCH API ===')
    console.log('Query:', searchTerm)
    console.log('Activity filter:', activity)

    // Fetch all children WITHOUT ORDER BY to avoid Hebrew text collation issues
    // We'll sort in JavaScript instead, which handles Hebrew text more reliably
    // Explicitly select all columns including activity registration fields
    const { data, error } = await supabase
      .from('children')
      .select('id, first_name, last_name, created_at, updated_at, is_registered_kidu, is_registered_tennis')
      .limit(200) // Fetch more records to filter client-side

    if (error) {
      console.error('Error fetching children from database:', error)
      return NextResponse.json({ error: 'Failed to search children', details: error.message }, { status: 500 })
    }

    console.log(`Fetched ${data?.length || 0} children from database`)
    if (data && data.length > 0) {
      console.log('Sample child (full object):', JSON.stringify(data[0], null, 2))
      console.log('Sample child first_name:', data[0].first_name)
      console.log('Sample child last_name:', data[0].last_name)
      console.log('Sample child is_registered_tennis:', data[0].is_registered_tennis)
      
      // Check if first_name/last_name columns exist
      const sampleKeys = Object.keys(data[0])
      console.log('Available columns in child object:', sampleKeys)
      
      // Log all children names for debugging
      console.log('All children names:', data.map((c: any) => ({
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        is_registered_tennis: c.is_registered_tennis
      })))
    } else {
      console.log('WARNING: No children found in database!')
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
      // Handle case where columns might not exist yet (migration not run) or are NULL
      // NULL/undefined should be treated as false (not registered)
      // If activity is null/undefined, don't filter by activity
      if (activity === 'kidu') {
        const isRegistered = child.is_registered_kidu === true
        if (!isRegistered) {
          console.log(`Child ${child.first_name || child.id} filtered out: not registered for kidu (is_registered_kidu: ${child.is_registered_kidu})`)
          return false
        }
      } else if (activity === 'tennis') {
        const isRegistered = child.is_registered_tennis === true
        if (!isRegistered) {
          console.log(`Child ${child.first_name || child.id} filtered out: not registered for tennis (is_registered_tennis: ${child.is_registered_tennis})`)
          return false
        }
      }
      // If activity is null/undefined, don't filter by activity - show all children
      
      // Ensure we're working with strings and trim whitespace
      const firstName = String(child.first_name || '').trim()
      const lastName = String(child.last_name || '').trim()
      const fullName = `${firstName} ${lastName}`.trim()
      const search = String(searchTerm).trim()
      
      // Skip children without names
      if (!firstName && !lastName) {
        console.log(`Skipping child ${child.id}: no first_name or last_name`)
        return false
      }
      
      // Direct string matching (Hebrew doesn't have case)
      // Check if search term appears in first name, last name, or full name
      // Use indexOf for more reliable matching than includes
      const matches = (
        firstName.indexOf(search) !== -1 ||
        lastName.indexOf(search) !== -1 ||
        fullName.indexOf(search) !== -1
      )
      
      if (matches) {
        console.log(`Match found: ${firstName} ${lastName} (id: ${child.id})`)
      }
      
      return matches
    }).slice(0, 50) // Limit to 50 results after filtering

    console.log(`After filtering: ${filteredData.length} children match query "${searchTerm}"${activity ? ` and activity "${activity}"` : ''}`)

    // Transform to match our interface
    const children = filteredData.map((child: any) => {
      // Handle case where first_name/last_name might be null or missing
      const firstName = child.first_name || ''
      const lastName = child.last_name || undefined
      
      if (!firstName && !lastName) {
        console.warn(`Child ${child.id} has no first_name or last_name`)
      }
      
      return {
        id: child.id,
        firstName: firstName,
        lastName: lastName,
        is_registered_kidu: child.is_registered_kidu || false,
        is_registered_tennis: child.is_registered_tennis || false,
      }
    })

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

