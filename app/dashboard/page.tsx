'use client'

import { useAuth } from '@/components/auth-provider'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Ride, User } from '@/lib/demo-data'
import { supabaseDb } from '@/lib/supabase-db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
import { Calendar, Users, MapPin, Phone, Clock, FileText, ArrowRight, ArrowLeft, Home, Printer, Table } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { useActivity } from '@/components/activity-provider'
import { getDirectionLabel, getCurrentMonthDates } from '@/lib/utils'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const { activity } = useActivity()
  const router = useRouter()
  const pathname = usePathname()
  
  // Get current calendar month dates (first day to last day)
  const currentMonth = getCurrentMonthDates()
  const [startDate, setStartDate] = useState(currentMonth.startDate)
  const [endDate, setEndDate] = useState(currentMonth.endDate)
  const [rides, setRides] = useState<Ride[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [usersMap, setUsersMap] = useState<Record<string, User>>({})
  
  // Determine active view based on current path
  const activeView = pathname === '/dashboard/calendar' ? 'table' : pathname === '/dashboard/print' ? 'print' : 'summary'

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
      
      // Sort by date, then by direction (Tennis: to-tennis-center before back-home)
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
    // Navigate to summary view
    router.push(`/dashboard?startDate=${month.startDate}&endDate=${month.endDate}`)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  // Group rides by date
  const ridesByDate: Record<string, Ride[]> = {}
  rides.forEach(ride => {
    if (!ridesByDate[ride.date]) {
      ridesByDate[ride.date] = []
    }
    ridesByDate[ride.date].push(ride)
  })

  const sortedDates = Object.keys(ridesByDate).sort()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${activity === 'tennis' ? 'text-green-600' : 'text-primary'}`}>
            {activity === 'tennis' ? 'TennisRide' : 'KiduRide'} Dashboard
          </h1>
          <p className="text-muted-foreground">View all rides for the selected date range</p>
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
                  variant={activeView === 'summary' ? 'default' : 'outline'}
                  onClick={handleSetCurrentMonth}
                  className="whitespace-nowrap"
                >
                  Current Month
                </Button>
                <Button
                  type="button"
                  variant={activeView === 'table' ? 'default' : 'outline'}
                  onClick={() => router.push(`/dashboard/calendar?startDate=${startDate}&endDate=${endDate}`)}
                  className="whitespace-nowrap flex items-center gap-2"
                >
                  <Table className="mr-2 h-4 w-4" />
                  Table View
                </Button>
                <Button
                  type="button"
                  variant={activeView === 'print' ? 'default' : 'outline'}
                  onClick={() => router.push(`/dashboard/print?startDate=${startDate}&endDate=${endDate}`)}
                  className="whitespace-nowrap flex items-center gap-2"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print View
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

        {/* Rides by Date */}
        {!isLoading && rides.length > 0 && (
          <div className="space-y-6">
            {sortedDates.map(date => (
              <Card key={date}>
                <CardHeader>
                  <CardTitle className="text-xl">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </CardTitle>
                  <CardDescription>
                    {ridesByDate[date].length} ride{ridesByDate[date].length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ridesByDate[date].map((ride) => {
                      const driver = usersMap[ride.driverId]
                      const isFull = ride.availableSeats <= 0

                      return (
                        <Card key={ride.id} className="border-l-4 border-l-primary">
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              {/* Header */}
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    {(ride.direction === 'from-school' || ride.direction === 'back-home') ? (
                                      <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                    )}
                                    <h3 className="text-lg font-semibold">
                                      {getDirectionLabel(ride.direction)}
                                    </h3>
                                    {isFull && (
                                      <span className="px-2 py-1 text-xs font-medium bg-destructive/10 text-destructive rounded">
                                        Full
                                      </span>
                                    )}
                                  </div>
                                  {ride.pickupTime && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                      <Clock className="h-4 w-4" />
                                      <span>Pickup Time: {ride.pickupTime}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Driver Info */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div className="flex items-start gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground mt-1" />
                                    <div>
                                      <p className="text-sm font-medium">Driver</p>
                                      <p className="text-sm text-muted-foreground">{ride.driverName}</p>
                                      {driver?.phone && (
                                        <a 
                                          href={`tel:${driver.phone}`} 
                                          className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                                        >
                                          <Phone className="h-3 w-3" />
                                          {driver.phone}
                                        </a>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                                    <div>
                                      <p className="text-sm font-medium">Pickup Location</p>
                                      <p className="text-sm text-muted-foreground">{ride.pickupAddress}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div className="flex items-start gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground mt-1" />
                                    <div>
                                      <p className="text-sm font-medium">Seats</p>
                                      <p className="text-sm text-muted-foreground">
                                        {ride.passengers.length} / {ride.totalSeats} seats
                                        {ride.availableSeats > 0 && (
                                          <span className="text-green-600 ml-2">
                                            ({ride.availableSeats} available)
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  {ride.notes && (
                                    <div className="flex items-start gap-2">
                                      <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                                      <div>
                                        <p className="text-sm font-medium">Notes</p>
                                        <p className="text-sm text-muted-foreground">{ride.notes}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Passengers */}
                              {ride.passengers.length > 0 && (
                                <div className="pt-4 border-t">
                                  <p className="text-sm font-medium mb-3">
                                    Passengers ({ride.passengers.length})
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {ride.passengers.map((passenger) => {
                                      const parent = usersMap[passenger.parentId]
                                      const parentPhone = parent?.phone
                                      const childParents = passenger.child?.parents || []
                                      const allParents = childParents.length > 0 
                                        ? childParents 
                                        : parent 
                                          ? [{ id: parent.id, name: parent.name, phone: parent.phone }]
                                          : []

                                      return (
                                        <div key={passenger.id} className="bg-muted/50 p-3 rounded-md">
                                          <div className="font-medium text-sm">{passenger.childName}</div>
                                          {allParents.length > 0 && (
                                            <div className="text-xs mt-2 space-y-1">
                                              {allParents.map((p) => (
                                                <div key={p.id} className="text-muted-foreground">
                                                  <span>הורה: </span>
                                                  {p.phone ? (
                                                    <a 
                                                      href={`tel:${p.phone}`} 
                                                      className="hover:text-foreground hover:underline flex items-center gap-1"
                                                      title={p.phone}
                                                    >
                                                      <Phone className="h-3 w-3" />
                                                      {p.name}
                                                    </a>
                                                  ) : (
                                                    <span>{p.name}</span>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {allParents.length === 0 && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                              הורה: {parentPhone ? (
                                                <a 
                                                  href={`tel:${parentPhone}`} 
                                                  className="hover:text-foreground hover:underline"
                                                  title={parentPhone}
                                                >
                                                  {passenger.parentName}
                                                </a>
                                              ) : (
                                                passenger.parentName
                                              )}
                                            </div>
                                          )}
                                          {passenger.pickupFromHome && passenger.pickupAddress && (
                                            <div className="text-xs mt-2 flex items-start gap-1 text-primary">
                                              <Home className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                              <span>Home pickup: {passenger.pickupAddress}</span>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* View Details Link */}
                              <div className="pt-2 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/ride/${ride.id}`)}
                                  className="w-full sm:w-auto"
                                >
                                  View Full Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

