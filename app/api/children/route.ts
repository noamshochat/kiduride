import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Create a child and link to one or more parents
 * POST /api/children
 * Body: { firstName: string, lastName?: string, parentIds: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, parentIds } = body

    // Validation
    if (!firstName || firstName.trim().length === 0) {
      return NextResponse.json({ error: 'First name is required' }, { status: 400 })
    }

    if (!parentIds || !Array.isArray(parentIds) || parentIds.length === 0) {
      return NextResponse.json({ error: 'At least one parent ID is required' }, { status: 400 })
    }

    // Verify all parents exist
    const { data: parents, error: parentsError } = await supabase
      .from('users')
      .select('id')
      .in('id', parentIds)

    if (parentsError) {
      console.error('Error verifying parents:', parentsError)
      return NextResponse.json({ error: 'Failed to verify parents' }, { status: 500 })
    }

    if (!parents || parents.length !== parentIds.length) {
      return NextResponse.json({ error: 'One or more parent IDs are invalid' }, { status: 400 })
    }

    // Generate child ID
    const childId = `child_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`

    // Create child
    const { data: child, error: childError } = await supabase
      .from('children')
      .insert({
        id: childId,
        first_name: firstName.trim(),
        last_name: lastName?.trim() || null,
      })
      .select()
      .single()

    if (childError) {
      console.error('Error creating child:', childError)
      return NextResponse.json({ error: 'Failed to create child' }, { status: 500 })
    }

    // Link parents (create junction table entries)
    const childParentLinks = parentIds.map((parentId: string) => ({
      child_id: childId,
      parent_id: parentId,
    }))

    const { error: linksError } = await supabase
      .from('child_parents')
      .insert(childParentLinks)

    if (linksError) {
      console.error('Error linking parents:', linksError)
      // Rollback: delete the child if parent linking fails
      await supabase.from('children').delete().eq('id', childId)
      return NextResponse.json({ error: 'Failed to link parents' }, { status: 500 })
    }

    // Fetch child with parents
    const { data: childWithParents, error: fetchError } = await supabase
      .from('children')
      .select(`
        *,
        child_parents (
          parent_id,
          users:parent_id (
            id,
            name,
            email,
            phone
          )
        )
      `)
      .eq('id', childId)
      .single()

    if (fetchError) {
      console.error('Error fetching child with parents:', fetchError)
      // Child was created successfully, return basic info
      return NextResponse.json({
        id: child.id,
        firstName: child.first_name,
        lastName: child.last_name || undefined,
        parentIds: parentIds,
      })
    }

    // Transform response
    const response = {
      id: childWithParents.id,
      firstName: childWithParents.first_name,
      lastName: childWithParents.last_name || undefined,
      parentIds: parentIds,
      parents: childWithParents.child_parents?.map((cp: any) => ({
        id: cp.users.id,
        name: cp.users.name,
        email: cp.users.email,
        phone: cp.users.phone || undefined,
      })) || [],
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error in create child:', error)
    return NextResponse.json({ error: 'Failed to create child' }, { status: 500 })
  }
}

