import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Link an additional parent to a child
 * POST /api/children/{childId}/parents/{parentId}
 */
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { childId: string; parentId: string } }
) {
  try {
    const { childId, parentId } = params

    if (!childId || !parentId) {
      return NextResponse.json({ error: 'Child ID and Parent ID are required' }, { status: 400 })
    }

    // Verify child exists
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id')
      .eq('id', childId)
      .single()

    if (childError || !child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    // Verify parent exists
    const { data: parent, error: parentError } = await supabase
      .from('users')
      .select('id')
      .eq('id', parentId)
      .single()

    if (parentError || !parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    // Check if link already exists
    const { data: existingLink, error: checkError } = await supabase
      .from('child_parents')
      .select('*')
      .eq('child_id', childId)
      .eq('parent_id', parentId)
      .single()

    if (existingLink) {
      return NextResponse.json({ error: 'Parent is already linked to this child' }, { status: 409 })
    }

    // Create the link
    const { error: linkError } = await supabase
      .from('child_parents')
      .insert({
        child_id: childId,
        parent_id: parentId,
      })

    if (linkError) {
      console.error('Error linking parent:', linkError)
      return NextResponse.json({ error: 'Failed to link parent' }, { status: 500 })
    }

    // Fetch updated child with all parents
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
      return NextResponse.json({ message: 'Parent linked successfully' }, { status: 200 })
    }

    // Transform response
    const response = {
      id: childWithParents.id,
      firstName: childWithParents.first_name,
      lastName: childWithParents.last_name || undefined,
      parentIds: childWithParents.child_parents?.map((cp: any) => cp.parent_id) || [],
      parents: childWithParents.child_parents?.map((cp: any) => ({
        id: cp.users.id,
        name: cp.users.name,
        email: cp.users.email,
        phone: cp.users.phone || undefined,
      })) || [],
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in link parent:', error)
    return NextResponse.json({ error: 'Failed to link parent' }, { status: 500 })
  }
}

