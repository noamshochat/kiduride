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

    // Fetch all children and filter in JavaScript for reliable Hebrew text matching
    // This approach is more reliable than relying on Supabase's ilike pattern matching
    // which can have issues with Hebrew characters in production environments
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .order('first_name', { ascending: true })
      .order('last_name', { ascending: true })
      .limit(200) // Fetch more records to filter client-side

    if (error) {
      console.error('Error searching children:', error)
      return NextResponse.json({ error: 'Failed to search children' }, { status: 500 })
    }

    // Filter by first name, last name, and full name concatenation in JavaScript
    // This ensures reliable matching for Hebrew text regardless of database collation
    // Note: For Hebrew text, case doesn't exist, so direct string matching is fine
    const filteredData = (data || []).filter((child: any) => {
      // Ensure we're working with strings and trim whitespace
      const firstName = String(child.first_name || '').trim()
      const lastName = String(child.last_name || '').trim()
      const fullName = `${firstName} ${lastName}`.trim()
      const search = String(searchTerm).trim()
      
      // Direct string matching (Hebrew doesn't have case)
      // Check if search term appears in first name, last name, or full name
      // Use indexOf for more reliable matching than includes
      const matches = (
        firstName.indexOf(search) !== -1 ||
        lastName.indexOf(search) !== -1 ||
        fullName.indexOf(search) !== -1
      )
      
      // Debug logging for production troubleshooting (only for specific search)
      if (search === 'אריאל' && firstName === 'אריאל') {
        console.log('[Search Debug - אריאל]', {
          searchTerm: search,
          searchLength: search.length,
          firstName: firstName,
          firstNameLength: firstName.length,
          charCodes: Array.from(search).map(c => c.charCodeAt(0)),
          firstNameCharCodes: Array.from(firstName).map(c => c.charCodeAt(0)),
          indexOfResult: firstName.indexOf(search),
          matches
        })
      }
      
      return matches
    }).slice(0, 50) // Limit to 50 results after filtering

    // Transform to match our interface
    const children = filteredData.map((child: any) => ({
      id: child.id,
      firstName: child.first_name,
      lastName: child.last_name || undefined,
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

