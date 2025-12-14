import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validatePassword } from '@/lib/password-utils'

/**
 * Validate backoffice password
 * POST /api/backoffice/validate-password
 * Body: { password: string }
 */
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    // Fetch the backoffice password from database
    const { data, error } = await supabase
      .from('passwords')
      .select('encrypted_password')
      .eq('user_identifier', 'noamshochat@gmail.com')
      .single()

    if (error || !data) {
      console.error('Error fetching password:', error)
      return NextResponse.json({ error: 'Failed to validate password' }, { status: 500 })
    }

    // Validate password
    const isValid = validatePassword(password, data.encrypted_password)

    if (isValid) {
      return NextResponse.json({ valid: true })
    } else {
      return NextResponse.json({ valid: false, error: 'Invalid password' }, { status: 401 })
    }
  } catch (error) {
    console.error('Error validating password:', error)
    return NextResponse.json({ error: 'Failed to validate password' }, { status: 500 })
  }
}

