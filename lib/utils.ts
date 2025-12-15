import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { RideDirection } from "./demo-data"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDirectionLabel(direction: RideDirection): string {
  switch (direction) {
    case 'to-school':
      return 'To university'
    case 'from-school':
      return 'From university'
    case 'to-train-station':
      return 'To train station'
    case 'to-tennis-center':
      return 'To Tennis Center'
    case 'back-home':
      return 'Back Home'
    default:
      return direction
  }
}

/**
 * Get current week dates (Sunday to Friday)
 * Returns { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
 */
export function getCurrentWeekDates(): { startDate: string; endDate: string } {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Calculate days to subtract to get to Sunday
  const daysToSunday = dayOfWeek === 0 ? 0 : dayOfWeek
  
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - daysToSunday)
  sunday.setHours(0, 0, 0, 0)
  
  const friday = new Date(sunday)
  friday.setDate(sunday.getDate() + 5) // Friday is 5 days after Sunday
  friday.setHours(23, 59, 59, 999)
  
  return {
    startDate: sunday.toISOString().split('T')[0],
    endDate: friday.toISOString().split('T')[0],
  }
}

