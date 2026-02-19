import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { RideDirection } from "./demo-data"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDirectionLabel(direction: RideDirection): string {
  switch (direction) {
    case 'to-school':
      return 'Destination: University'
    case 'from-school':
      return 'Destination: Lehavim'
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

/**
 * Format a Date as 'YYYY-MM-DD' using local time (not UTC)
 */
function localDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Get the next Thursday's date (or today if today is Thursday)
 * Returns 'YYYY-MM-DD'
 */
export function getNextThursday(): string {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

  if (dayOfWeek === 4) {
    return localDateString(today)
  }

  const daysUntilThursday = (4 - dayOfWeek + 7) % 7
  const nextThursday = new Date(today)
  nextThursday.setDate(today.getDate() + daysUntilThursday)
  return localDateString(nextThursday)
}

/**
 * Get current calendar month dates (first day to last day of month)
 * Returns { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
 */
export function getCurrentMonthDates(): { startDate: string; endDate: string } {
  const today = new Date()
  
  // First day of the month
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  firstDay.setHours(0, 0, 0, 0)
  
  // Last day of the month
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  lastDay.setHours(23, 59, 59, 999)
  
  return {
    startDate: firstDay.toISOString().split('T')[0],
    endDate: lastDay.toISOString().split('T')[0],
  }
}

