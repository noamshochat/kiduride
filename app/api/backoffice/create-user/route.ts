import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Create a new user (parent) and optionally their children
 * POST /api/backoffice/create-user
 * Body: { 
 *   name: string, 
 *   email: string, 
 *   phone?: string, 
 *   childName?: string,
 *   children?: Array<{ firstName: string, lastName?: string }>,
 *   isRegisteredKidu?: boolean,
 *   isRegisteredTennis?: boolean
 * }
 */
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('=== BACKOFFICE CREATE USER REQUEST ===')
    console.log('Full request body:', JSON.stringify(body, null, 2))
    const { name, email, phone, childName, children, isRegisteredKidu, isRegisteredTennis } = body
    console.log('Extracted children:', JSON.stringify(children))
    console.log('Children type:', typeof children)
    console.log('Children is array?', Array.isArray(children))
    console.log('Children length:', children?.length)
    console.log('Service role key available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log('Using supabaseAdmin:', supabaseAdmin !== undefined)

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!email || email.trim().length === 0) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
    }

    // Generate user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`

    // Determine child_name - use first child's name if provided, otherwise use childName
    let finalChildName = childName?.trim() || ''
    if (!finalChildName && children && children.length > 0) {
      const firstChild = children[0]
      finalChildName = `${firstChild.firstName}${firstChild.lastName ? ' ' + firstChild.lastName : ''}`
    }
    
    // If still no child name, use a default
    if (!finalChildName) {
      finalChildName = name.trim() // Fallback to parent name
    }

    // Create user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        child_name: finalChildName,
        is_registered_kidu: isRegisteredKidu === true,
        is_registered_tennis: isRegisteredTennis === true,
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user:', userError)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Create children if provided
    const createdChildren = []
    console.log('Children array received:', JSON.stringify(children))
    
    if (children && Array.isArray(children) && children.length > 0) {
      console.log(`Processing ${children.length} children`)
      
      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        console.log(`Processing child ${i + 1}:`, JSON.stringify(child))
        
        if (!child.firstName || child.firstName.trim().length === 0) {
          console.log(`Skipping child ${i + 1}: missing firstName`)
          continue // Skip invalid children
        }

        // Generate unique child ID with timestamp, index, and random string
        // Add small delay to ensure unique timestamps if creating multiple children
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }
        const childId = `child_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`
        console.log(`Generated child ID: ${childId}`)

        // Create child
        const childInsertData = {
          id: childId,
          first_name: child.firstName.trim(),
          last_name: child.lastName?.trim() || null,
        }
        console.log('Inserting child with data:', JSON.stringify(childInsertData))
        
        const { data: childData, error: childError } = await supabaseAdmin
          .from('children')
          .insert(childInsertData)
          .select()
          .single()

        if (childError) {
          console.error(`Error creating child ${i + 1}:`, childError)
          console.error('Child error details:', JSON.stringify(childError))
          // Return error instead of silently continuing
          return NextResponse.json({ 
            error: `Failed to create child: ${child.firstName}. ${childError.message || 'Unknown error'}`,
            details: childError 
          }, { status: 500 })
        }

        console.log(`Successfully created child: ${childData.id}`)

        // Link child to parent
        const linkInsertData = {
          child_id: childId,
          parent_id: userId,
        }
        console.log('Linking child to parent with data:', JSON.stringify(linkInsertData))
        
        const { error: linkError } = await supabaseAdmin
          .from('child_parents')
          .insert(linkInsertData)

        if (linkError) {
          console.error(`Error linking child ${i + 1} to parent:`, linkError)
          console.error('Link error details:', JSON.stringify(linkError))
          // Delete the child if linking fails
          await supabaseAdmin.from('children').delete().eq('id', childId)
          return NextResponse.json({ 
            error: `Failed to link child to parent: ${child.firstName}. ${linkError.message || 'Unknown error'}`,
            details: linkError 
          }, { status: 500 })
        }

        console.log(`Successfully linked child ${childData.id} to parent ${userId}`)

        createdChildren.push({
          id: childData.id,
          firstName: childData.first_name,
          lastName: childData.last_name || undefined,
        })
      }
      
      console.log(`Successfully created ${createdChildren.length} children`)
    } else {
      console.log('No children array provided or array is empty')
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || undefined,
        childName: user.child_name,
      },
      children: createdChildren,
    }, { status: 201 })
  } catch (error) {
    console.error('Error in create user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

