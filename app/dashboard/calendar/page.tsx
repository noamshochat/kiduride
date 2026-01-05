'use client'

import { useAuth } from '@/components/auth-provider'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import React from 'react'
import { Ride, User } from '@/lib/demo-data'
import { supabaseDb } from '@/lib/supabase-db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { Calendar, Train } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { useActivity } from '@/components/activity-provider'
import { getCurrentMonthDates } from '@/lib/utils'

type RideGroup = {
  toRides: Ride[]
  fromRides: Ride[]
}

function CalendarDashboardContent() {
  const { user, logout } = useAuth()
  const { activity } = useActivity()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get current calendar month dates (first day to last day)
  const currentMonth = getCurrentMonthDates()
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || currentMonth.startDate)
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || currentMonth.endDate)
  const [rides, setRides] = useState<Ride[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [usersMap, setUsersMap] = useState<Record<string, User>>({})
  const [isFullDialogOpen, setIsFullDialogOpen] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  // Load users map on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await supabaseDb.getUsers()
        const map: Record<string, User> = {}
        users.forEach(u => {
          map[u.id] = u
        })
        setUsersMap(map)
      } catch (error) {
        console.error('Error loading users:', error)
      }
    }
    loadUsers()
  }, [])

  // Load rides when date range or activity changes
  useEffect(() => {
    if (user) {
      loadRides()
    }
  }, [startDate, endDate, activity, user])

  const loadRides = async () => {
    setIsLoading(true)
    try {
      const allRides = await supabaseDb.getRidesByDateRange(startDate, endDate)
      
      // Filter by activity if activity is set
      let filtered = allRides
      if (activity === 'tennis') {
        filtered = allRides.filter(ride => ride.direction === 'to-tennis-center' || ride.direction === 'back-home')
      } else if (activity === 'kidu') {
        filtered = allRides.filter(ride => ride.direction === 'to-school' || ride.direction === 'from-school' || ride.direction === 'to-train-station')
      }
      
      // Sort by date, then by direction
      filtered.sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date)
        }
        // For tennis activity, prioritize to-tennis-center over back-home
        if (activity === 'tennis') {
          if (a.direction === 'to-tennis-center' && b.direction === 'back-home') {
            return -1
          }
          if (a.direction === 'back-home' && b.direction === 'to-tennis-center') {
            return 1
          }
        }
        return a.direction.localeCompare(b.direction)
      })
      
      setRides(filtered)
    } catch (error) {
      console.error('Error loading rides:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetCurrentMonth = () => {
    const month = getCurrentMonthDates()
    setStartDate(month.startDate)
    setEndDate(month.endDate)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  // Helper function to generate all Thursdays in the date range
  const getAllThursdays = (start: string, end: string): string[] => {
    const thursdays: string[] = []
    const startDate = new Date(start)
    const endDate = new Date(end)
    
    // Find the first Thursday on or after start date
    let currentDate = new Date(startDate)
    const dayOfWeek = currentDate.getDay() // 0 = Sunday, 4 = Thursday
    const daysUntilThursday = dayOfWeek <= 4 ? (4 - dayOfWeek) : (11 - dayOfWeek)
    currentDate.setDate(currentDate.getDate() + daysUntilThursday)
    
    // Add all Thursdays until end date
    while (currentDate <= endDate) {
      thursdays.push(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + 7) // Next Thursday
    }
    
    return thursdays
  }

  // Handle clicking on Car seats cell
  const handleCarSeatsClick = (ride: Ride | null) => {
    if (!ride) return
    
    // Check if ride is full
    if (ride.availableSeats <= 0) {
      setIsFullDialogOpen(true)
      return
    }
    
    // Redirect to parent page with ride ID
    router.push(`/parent?rideId=${ride.id}&date=${ride.date}`)
  }

  // Handle clicking on empty Name cell - redirect to driver page to add ride
  const handleNameCellClick = (date: string, isToSection: boolean) => {
    // Determine direction based on section and activity
    let direction = ''
    if (activity === 'tennis') {
      direction = isToSection ? 'to-tennis-center' : 'back-home'
    } else {
      // kidu activity
      direction = isToSection ? 'to-school' : 'from-school'
    }
    
    // Redirect to driver page with date and direction pre-filled
    router.push(`/driver?date=${date}&direction=${direction}`)
  }

  // Helper function to determine if date should be red (alternating pattern)
  // Based on image pattern: some dates have red background
  const isRedDate = (date: string, index: number) => {
    // Simple pattern: every 3rd date starting from index 2 (0-indexed)
    // This creates a pattern similar to the image
    return index % 3 === 2
  }

  // Group rides by date and separate TO and FROM
  const ridesByDate: Record<string, RideGroup> = {}
  rides.forEach(ride => {
    if (!ridesByDate[ride.date]) {
      ridesByDate[ride.date] = { toRides: [], fromRides: [] }
    }
    
    // Categorize rides as TO or FROM
    const isToRide = ride.direction === 'to-school' || 
                     ride.direction === 'to-tennis-center' || 
                     ride.direction === 'to-train-station'
    
    if (isToRide) {
      ridesByDate[ride.date].toRides.push(ride)
    } else {
      ridesByDate[ride.date].fromRides.push(ride)
    }
  })

  // Get all Thursdays in the date range
  const allThursdays = getAllThursdays(startDate, endDate)
  
  // Merge Thursdays with dates that have rides, ensuring all Thursdays are included
  const allDatesSet = new Set([...allThursdays, ...Object.keys(ridesByDate)])
  const sortedDates = Array.from(allDatesSet).sort()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${activity === 'tennis' ? 'text-green-600' : 'text-primary'}`}>
            {activity === 'tennis' ? 'TennisRide' : 'KiduRide'} Calendar View
          </h1>
          <p className="text-muted-foreground">Calendar view of all rides for the selected date range</p>
        </div>

        {/* Date Range Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date Range
            </CardTitle>
            <CardDescription>
              Select a date range to view rides (default: current calendar month)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSetCurrentMonth}
                  className="whitespace-nowrap"
                >
                  Current Month
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading rides...
            </CardContent>
          </Card>
        )}

        {/* No Rides */}
        {!isLoading && rides.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No rides available for the selected date range
            </CardContent>
          </Card>
        )}

        {/* Calendar Table */}
        {!isLoading && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  {/* Header */}
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-300 p-2 text-left font-semibold">Date</th>
                      <th colSpan={4} className="border border-gray-300 p-2 text-center font-semibold bg-green-100">
                        TO
                      </th>
                      <th colSpan={6} className="border border-gray-300 p-2 text-center font-semibold bg-purple-100">
                        FROM
                      </th>
                    </tr>
                    <tr>
                      <th className="border border-gray-300 p-2 bg-gray-200"></th>
                      <th className="border border-gray-300 p-2 bg-green-100 font-medium">Name</th>
                      <th className="border border-gray-300 p-2 bg-green-100 font-medium">Car seats</th>
                      <th className="border border-gray-300 p-2 bg-green-100 font-medium">Name</th>
                      <th className="border border-gray-300 p-2 bg-green-100 font-medium">Car seats</th>
                      <th className="border border-gray-300 p-2 bg-purple-100 font-medium">Name</th>
                      <th className="border border-gray-300 p-2 bg-purple-100 font-medium">Car seats</th>
                      <th className="border border-gray-300 p-2 bg-purple-100 font-medium">Name</th>
                      <th className="border border-gray-300 p-2 bg-purple-100 font-medium">Car seats</th>
                      <th className="border border-gray-300 p-2 bg-purple-100 font-medium">Name</th>
                      <th className="border border-gray-300 p-2 bg-purple-100 font-medium">Car seats</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDates.map((date, index) => {
                      const dateRides = ridesByDate[date] || { toRides: [], fromRides: [] }
                      const { toRides, fromRides } = dateRides
                      const dateBgColor = isRedDate(date, index) ? 'bg-red-100' : 'bg-white'
                      
                      return (
                        <tr key={date}>
                          {/* Date Column */}
                          <td className={`border border-gray-300 p-2 font-medium ${dateBgColor}`}>
                            {format(new Date(date), 'dd/MM/yyyy')}
                          </td>
                          
                          {/* TO Section - Up to 2 rides */}
                          {[0, 1].map((i) => (
                            <React.Fragment key={i}>
                              <td 
                                className={`border border-gray-300 p-2 bg-green-50 ${toRides.length > i ? '' : 'text-gray-400 cursor-pointer hover:bg-green-100'}`}
                                onClick={() => toRides.length <= i && handleNameCellClick(date, true)}
                              >
                                {toRides.length > i ? (
                                  <div className="flex items-center gap-1">
                                    <span>{toRides[i].driverName}</span>
                                    {toRides[i].direction === 'to-train-station' && (
                                      <Train className="h-3 w-3 text-gray-600" />
                                    )}
                                  </div>
                                ) : ''}
                              </td>
                              <td 
                                className={`border border-gray-300 p-2 bg-green-50 text-center ${toRides.length > i ? 'cursor-pointer hover:bg-green-100' : 'text-gray-400'}`}
                                onClick={() => handleCarSeatsClick(toRides.length > i ? toRides[i] : null)}
                              >
                                {toRides.length > i ? (() => {
                                  const ride = toRides[i]
                                  const takenSeats = ride.totalSeats - ride.availableSeats
                                  return `${ride.totalSeats}/${takenSeats}`
                                })() : ''}
                              </td>
                            </React.Fragment>
                          ))}
                          
                          {/* FROM Section - Up to 3 rides */}
                          {[0, 1, 2].map((i) => (
                            <React.Fragment key={i}>
                              <td 
                                className={`border border-gray-300 p-2 bg-purple-50 ${fromRides.length > i ? '' : 'text-gray-400 cursor-pointer hover:bg-purple-100'}`}
                                onClick={() => fromRides.length <= i && handleNameCellClick(date, false)}
                              >
                                {fromRides.length > i ? fromRides[i].driverName : ''}
                              </td>
                              <td 
                                className={`border border-gray-300 p-2 bg-purple-50 text-center ${fromRides.length > i ? 'cursor-pointer hover:bg-purple-100' : 'text-gray-400'}`}
                                onClick={() => handleCarSeatsClick(fromRides.length > i ? fromRides[i] : null)}
                              >
                                {fromRides.length > i ? (() => {
                                  const ride = fromRides[i]
                                  const takenSeats = ride.totalSeats - ride.availableSeats
                                  return `${ride.totalSeats}/${takenSeats}`
                                })() : ''}
                              </td>
                            </React.Fragment>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ride Full Dialog */}
        <Dialog open={isFullDialogOpen} onOpenChange={setIsFullDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ride is Full</DialogTitle>
              <DialogDescription>
                This ride has no available seats. Please select another ride.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setIsFullDialogOpen(false)}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default function CalendarDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    }>
      <CalendarDashboardContent />
    </Suspense>
  )
}

