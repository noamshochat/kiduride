import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import twilio from 'twilio'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/send-weekly-drivers-whatsapp
 * Send WhatsApp messages to all drivers with rides this week
 * Admin only
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, templateSid, contentVariables } = body

    // Verify user is admin
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (userError || !userData || !userData.is_admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }

    // Get current week start and end dates
    const today = new Date()
    const dayOfWeek = today.getDay()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - dayOfWeek) // Sunday
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // Saturday

    const startDateStr = startOfWeek.toISOString().split('T')[0]
    const endDateStr = endOfWeek.toISOString().split('T')[0]

    // Get all unique drivers with rides this week
    const { data: rides, error: ridesError } = await supabaseAdmin
      .from('rides')
      .select('driver_id, users:driver_id(id, name, phone)')
      .gte('date', startDateStr)
      .lte('date', endDateStr)

    if (ridesError) {
      console.error('Error fetching rides:', ridesError)
      return NextResponse.json({ error: 'Failed to fetch rides' }, { status: 500 })
    }

    if (!rides || rides.length === 0) {
      return NextResponse.json({ 
        message: 'No drivers with rides this week',
        driversMessaged: 0 
      }, { status: 200 })
    }

    // Get unique drivers
    const uniqueDrivers = Array.from(
      new Map(rides.map((ride: any) => [ride.driver_id, ride])).values()
    )

    // Initialize Twilio client
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioWhatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER

    if (!accountSid || !authToken || !twilioWhatsappNumber) {
      console.error('Missing Twilio credentials')
      return NextResponse.json({ error: 'Twilio credentials not configured' }, { status: 500 })
    }

    const client = twilio(accountSid, authToken)
    let successCount = 0
    const errors: any[] = []

    // Send messages to each driver
    for (const rideData of uniqueDrivers) {
      const driver = rideData.users
      if (!driver || !driver.phone) {
        console.warn(`Driver ${rideData.driver_id} missing phone number`)
        continue
      }

      try {
        // Convert phone to WhatsApp format (international format with country code)
        let whatsappPhone = driver.phone
        if (!whatsappPhone.startsWith('whatsapp:+')) {
          // Clean the phone number and add whatsapp: prefix
          whatsappPhone = 'whatsapp:+' + whatsappPhone.replace(/\D/g, '')
        }

        // Send WhatsApp message with content template
        const message = await client.messages.create({
          from: twilioWhatsappNumber,
          contentSid: templateSid, // Template SID from Twilio
          contentVariables: contentVariables || '{}', // JSON string with template variables
          to: whatsappPhone,
        })

        console.log(`Message sent to ${driver.name} (${driver.phone}):`, message.sid)
        successCount++
      } catch (error: any) {
        console.error(`Failed to send message to ${driver.name}:`, error.message)
        errors.push({
          driverId: rideData.driver_id,
          driverName: driver.name,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      message: 'WhatsApp messages sent to drivers',
      driversMessaged: successCount,
      totalDrivers: uniqueDrivers.length,
      errors: errors.length > 0 ? errors : undefined,
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error in send-weekly-drivers-whatsapp:', error)
    return NextResponse.json({ error: error.message || 'Failed to send messages' }, { status: 500 })
  }
}
