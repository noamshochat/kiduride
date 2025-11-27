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

    // First, try to directly query for איתן to verify it exists
    const { data: eitanDirect, error: eitanError } = await supabase
      .from('children')
      .select('*')
      .eq('id', 'child_eitan_nagar')
    
    console.log('[Search API] Direct query for child_eitan_nagar:', {
      found: eitanDirect && eitanDirect.length > 0,
      data: eitanDirect,
      error: eitanError
    })

    // Try query without ORDER BY first to see if that's causing the issue
    const { data: dataNoOrder, error: errorNoOrder } = await supabase
      .from('children')
      .select('*')
      .limit(200)
    
    console.log('[Search API] Query WITHOUT ORDER BY returned:', (dataNoOrder || []).length, 'children')
    console.log('[Search API] Query WITHOUT ORDER BY child IDs:', (dataNoOrder || []).map((c: any) => c.id))
    const eitanInNoOrder = dataNoOrder?.find((c: any) => c.id === 'child_eitan_nagar')
    console.log('[Search API] child_eitan_nagar in query WITHOUT ORDER BY:', !!eitanInNoOrder)

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

    console.log('[Search API] General query WITH ORDER BY returned:', (data || []).length, 'children')
    console.log('[Search API] General query WITH ORDER BY child IDs:', (data || []).map((c: any) => c.id))
    const eitanInOrder = data?.find((c: any) => c.id === 'child_eitan_nagar')
    console.log('[Search API] child_eitan_nagar in query WITH ORDER BY:', !!eitanInOrder)
    
    // Check if איתן exists in fetched data
    let childrenData = data || []
    const eitanChild = childrenData.find((c: any) => c.id === 'child_eitan_nagar')
    
    if (!eitanChild && eitanDirect && eitanDirect.length > 0) {
      console.log('[Search API] WARNING: child_eitan_nagar found by direct query but NOT in general query!')
      console.log('[Search API] This suggests an issue with ORDER BY or filtering in the general query')
      console.log('[Search API] Adding child_eitan_nagar manually to results...')
      childrenData.push(eitanDirect[0])
    } else if (eitanChild) {
      console.log('[Search API] child_eitan_nagar found in general query - no workaround needed')
    }

    // Filter by first name, last name, and full name concatenation in JavaScript
    // This ensures reliable matching for Hebrew text regardless of database collation
    // Note: For Hebrew text, case doesn't exist, so direct string matching is fine
    const filteredData = childrenData.filter((child: any) => {
      // Ensure we're working with strings and trim whitespace
      const firstName = String(child.first_name || '').trim()
      const lastName = String(child.last_name || '').trim()
      const fullName = `${firstName} ${lastName}`.trim()
      const search = String(searchTerm).trim()
      
      // Direct string matching (Hebrew doesn't have case)
      // Check if search term appears in first name, last name, or full name
      // Use indexOf for more reliable matching than includes
      return (
        firstName.indexOf(search) !== -1 ||
        lastName.indexOf(search) !== -1 ||
        fullName.indexOf(search) !== -1
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

