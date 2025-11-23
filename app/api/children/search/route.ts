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
      const firstName = (child.first_name || '').trim()
      const lastName = (child.last_name || '').trim()
      const fullName = `${firstName} ${lastName}`.trim()
      
      // Direct string matching (Hebrew doesn't have case)
      // Check if search term appears in first name, last name, or full name
      return (
        firstName.includes(searchTerm) ||
        lastName.includes(searchTerm) ||
        fullName.includes(searchTerm)
      )
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

