'use client'

import { Calendar } from 'lucide-react'
import { Button } from './ui/button'
import { Ride } from '@/lib/demo-data'
import { format, parseISO } from 'date-fns'

interface AddToCalendarButtonProps {
  ride: Ride
  driverName: string
  className?: string
}

export function AddToCalendarButton({ ride, driverName, className }: AddToCalendarButtonProps) {
  const generateICSFile = (): string => {
    // Parse the ride date (ISO format: YYYY-MM-DD)
    const rideDate = parseISO(ride.date)
    
    // Use pickup time if available, otherwise use default times based on direction
    const startTime = new Date(rideDate)
    if (ride.pickupTime) {
      // Parse pickup time (HH:MM format)
      const [hours, minutes] = ride.pickupTime.split(':').map(Number)
      startTime.setHours(hours, minutes || 0, 0, 0)
    } else {
      // Default times: To school: 8:00 AM, From school: 3:00 PM
      if (ride.direction === 'to-school') {
        startTime.setHours(8, 0, 0, 0)
      } else {
        startTime.setHours(15, 0, 0, 0)
      }
    }
    
    // End time: 1 hour later
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
    
    // Format dates for ICS (YYYYMMDDTHHmmssZ)
    const formatICSDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }
    
    const startDateStr = formatICSDate(startTime)
    const endDateStr = formatICSDate(endTime)
    const createdDateStr = formatICSDate(new Date())
    
    // Format date for description
    const formattedDate = format(startTime, 'MMM d, yyyy')
    const formattedTime = format(startTime, 'h:mm a')
    const direction = ride.direction === 'to-school' ? 'To university' : 'From university'
    
    // Generate ride URL
    const rideUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/ride/${ride.id}`
      : ''
    
    // Build description
    const description = [
      `Ride: ${direction}`,
      `Driver: ${driverName}`,
      ride.pickupAddress ? `Pickup: ${ride.pickupAddress}` : '',
      ride.notes ? `Notes: ${ride.notes}` : '',
      `\nView details: ${rideUrl}`,
    ].filter(Boolean).join('\\n')
    
    // ICS file content
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Kiduride//Ride Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:ride-${ride.id}@kiduride`,
      `DTSTAMP:${createdDateStr}`,
      `DTSTART:${startDateStr}`,
      `DTEND:${endDateStr}`,
      `SUMMARY:Ride - ${direction}`,
      `DESCRIPTION:${description}`,
      ride.pickupAddress ? `LOCATION:${ride.pickupAddress}` : '',
      `URL:${rideUrl}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n')
    
    return icsContent
  }

  const handleAddToCalendar = () => {
    try {
      const icsContent = generateICSFile()
      
      // Create a blob with the ICS content
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
      
      // Create a temporary URL
      const url = URL.createObjectURL(blob)
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = `ride-${ride.id}-${ride.date}.ics`
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating calendar file:', error)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAddToCalendar}
      className={className}
      title="Add to calendar"
    >
      <Calendar className="h-4 w-4 mr-2" />
      <span className="hidden sm:inline">Add to Calendar</span>
    </Button>
  )
}

