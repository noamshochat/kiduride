'use client'

import { useAuth } from '@/components/auth-provider'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import React from 'react'
import { Ride, User } from '@/lib/demo-data'
import { supabaseDb } from '@/lib/supabase-db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { Calendar, Train, List, Table } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { useActivity } from '@/components/activity-provider'
import { getCurrentMonthDates, getNextThursday } from '@/lib/utils'

type RideGroup = {
  toRides: Ride[]
  fromRides: Ride[]
}

function CalendarDashboardContent() {
  const { user } = useAuth()
  const { activity } = useActivity()
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentMonth = getCurrentMonthDates()
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || currentMonth.startDate)
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || currentMonth.endDate)
  const [rides, setRides] = useState<Ride[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [usersMap, setUsersMap] = useState<Record<string, User>>({})
  const [isFullDialogOpen, setIsFullDialogOpen] = useState(false)

  useEffect(() => {
    if (!user) router.push('/')
  }, [user, router])

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await supabaseDb.getUsers()
        const map: Record<string, User> = {}
        users.forEach(u => { map[u.id] = u })
        setUsersMap(map)
      } catch (error) {
        console.error('Error loading users:', error)
      }
    }
    loadUsers()
  }, [])

  useEffect(() => {
    if (user) loadRides()
  }, [startDate, endDate, activity, user])

  const loadRides = async () => {
    setIsLoading(true)
    try {
      const allRides = await supabaseDb.getRidesByDateRange(startDate, endDate)
      let filtered = allRides
      if (activity === 'tennis') {
        filtered = allRides.filter(r => r.direction === 'to-tennis-center' || r.direction === 'back-home')
      } else if (activity === 'kidu') {
        filtered = allRides.filter(r => r.direction === 'to-school' || r.direction === 'from-school' || r.direction === 'to-train-station')
      }
      filtered.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date)
        if (activity === 'tennis') {
          if (a.direction === 'to-tennis-center' && b.direction === 'back-home') return -1
          if (a.direction === 'back-home' && b.direction === 'to-tennis-center') return 1
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

  const getAllThursdays = (start: string, end: string): string[] => {
    const thursdays: string[] = []
    const startDate = new Date(start)
    const endDate = new Date(end)
    let currentDate = new Date(startDate)
    const dayOfWeek = currentDate.getDay()
    const daysUntilThursday = dayOfWeek <= 4 ? (4 - dayOfWeek) : (11 - dayOfWeek)
    currentDate.setDate(currentDate.getDate() + daysUntilThursday)
    while (currentDate <= endDate) {
      thursdays.push(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + 7)
    }
    return thursdays
  }

  const handleCarSeatsClick = (ride: Ride | null) => {
    if (!ride) return
    if (ride.availableSeats <= 0) { setIsFullDialogOpen(true); return }
    router.push(`/parent?rideId=${ride.id}&date=${ride.date}`)
  }

  const handleNameCellClick = (date: string, isToSection: boolean) => {
    let direction = ''
    if (activity === 'tennis') {
      direction = isToSection ? 'to-tennis-center' : 'back-home'
    } else {
      direction = isToSection ? 'to-school' : 'from-school'
    }
    router.push(`/driver?date=${date}&direction=${direction}`)
  }

  const isRedDate = (date: string, index: number) => index % 3 === 2

  const ridesByDate: Record<string, RideGroup> = {}
  rides.forEach(ride => {
    if (!ridesByDate[ride.date]) ridesByDate[ride.date] = { toRides: [], fromRides: [] }
    const isToRide = ride.direction === 'to-school' || ride.direction === 'to-tennis-center' || ride.direction === 'to-train-station'
    if (isToRide) ridesByDate[ride.date].toRides.push(ride)
    else ridesByDate[ride.date].fromRides.push(ride)
  })

  const allThursdays = getAllThursdays(startDate, endDate)
  const allDatesSet = new Set([...allThursdays, ...Object.keys(ridesByDate)])
  const sortedDates = Array.from(allDatesSet).sort()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      <Navigation />
      <div className="container mx-auto px-4 py-6">

        <div className="mb-5">
          <h1 className={`text-2xl font-bold ${activity === 'tennis' ? 'text-green-600' : 'text-primary'}`}>
            {activity === 'tennis' ? 'TennisRide' : 'KiduRide'} Table View
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Click a driver name to view details, or a seat count to join a ride</p>
        </div>

        {/* Date Range Selector */}
        <Card className="mb-5 bg-white/80 dark:bg-card/80 backdrop-blur-sm shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="startDate" className="text-xs text-muted-foreground">Start Date</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9" />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="endDate" className="text-xs text-muted-foreground">End Date</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9" />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { const d = getNextThursday(); router.push(`/dashboard?startDate=${d}&endDate=${d}`) }}
                  className="h-9 whitespace-nowrap"
                >
                  <List className="mr-1.5 h-3.5 w-3.5" />
                  Default View
                </Button>
                <Button type="button" variant="default" size="sm" className="h-9 whitespace-nowrap">
                  <Table className="mr-1.5 h-3.5 w-3.5" />
                  Table View
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleSetCurrentMonth} className="h-9 whitespace-nowrap">
                  This Month
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {isLoading && (
          <Card className="bg-white/80 dark:bg-card/80">
            <CardContent className="py-10 text-center text-muted-foreground">Loading rides...</CardContent>
          </Card>
        )}

        {/* Empty */}
        {!isLoading && rides.length === 0 && (
          <Card className="bg-white/80 dark:bg-card/80">
            <CardContent className="py-10 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">No rides available for the selected date range</p>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        {!isLoading && (
          <Card className="bg-white/90 dark:bg-card shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="border border-border bg-muted/60 p-2.5 text-left font-semibold text-foreground" rowSpan={2}>
                        Date
                      </th>
                      <th colSpan={4} className="border border-border p-2 text-center font-semibold text-green-700 dark:text-green-400 bg-green-100/70 dark:bg-green-900/30">
                        TO
                      </th>
                      <th colSpan={6} className="border border-border p-2 text-center font-semibold text-purple-700 dark:text-purple-400 bg-purple-100/70 dark:bg-purple-900/30">
                        FROM
                      </th>
                    </tr>
                    <tr>
                      {[0, 1].map(i => (
                        <React.Fragment key={i}>
                          <th className="border border-border p-2 font-medium text-green-700 dark:text-green-400 bg-green-50/80 dark:bg-green-900/20 text-xs whitespace-nowrap">Name</th>
                          <th className="border border-border p-2 font-medium text-green-700 dark:text-green-400 bg-green-50/80 dark:bg-green-900/20 text-xs whitespace-nowrap">Seats</th>
                        </React.Fragment>
                      ))}
                      {[0, 1, 2].map(i => (
                        <React.Fragment key={i}>
                          <th className="border border-border p-2 font-medium text-purple-700 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-900/20 text-xs whitespace-nowrap">Name</th>
                          <th className="border border-border p-2 font-medium text-purple-700 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-900/20 text-xs whitespace-nowrap">Seats</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDates.map((date, index) => {
                      const dateRides = ridesByDate[date] || { toRides: [], fromRides: [] }
                      const { toRides, fromRides } = dateRides
                      const isAlt = isRedDate(date, index)

                      return (
                        <tr key={date} className={isAlt ? 'bg-red-50/60 dark:bg-red-950/20' : ''}>
                          {/* Date */}
                          <td className={`border border-border p-2 font-medium text-foreground whitespace-nowrap ${isAlt ? 'bg-red-50/60 dark:bg-red-950/20' : 'bg-muted/30'}`}>
                            {format(new Date(date), 'dd/MM/yyyy')}
                          </td>

                          {/* TO: up to 2 rides */}
                          {[0, 1].map((i) => (
                            <React.Fragment key={i}>
                              <td
                                className={`border border-border p-2 bg-green-50/60 dark:bg-green-950/20 text-foreground ${toRides.length <= i ? 'cursor-pointer hover:bg-green-100/70 dark:hover:bg-green-900/30' : ''}`}
                                onClick={() => toRides.length <= i && handleNameCellClick(date, true)}
                              >
                                {toRides.length > i ? (
                                  <div className="flex items-center gap-1">
                                    <span>{toRides[i].driverName}</span>
                                    {toRides[i].direction === 'to-train-station' && (
                                      <Train className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground/40 text-xs">+ add</span>
                                )}
                              </td>
                              <td
                                className={`border border-border p-2 bg-green-50/60 dark:bg-green-950/20 text-center ${toRides.length > i ? 'cursor-pointer hover:bg-green-100/70 dark:hover:bg-green-900/30' : 'text-muted-foreground/40'}`}
                                onClick={() => handleCarSeatsClick(toRides.length > i ? toRides[i] : null)}
                              >
                                {toRides.length > i ? (() => {
                                  const ride = toRides[i]
                                  const taken = ride.totalSeats - ride.availableSeats
                                  const isFull = ride.availableSeats <= 0
                                  return (
                                    <span className={`font-medium tabular-nums ${isFull ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                                      {ride.totalSeats}/{taken}
                                    </span>
                                  )
                                })() : ''}
                              </td>
                            </React.Fragment>
                          ))}

                          {/* FROM: up to 3 rides */}
                          {[0, 1, 2].map((i) => (
                            <React.Fragment key={i}>
                              <td
                                className={`border border-border p-2 bg-purple-50/60 dark:bg-purple-950/20 text-foreground ${fromRides.length <= i ? 'cursor-pointer hover:bg-purple-100/70 dark:hover:bg-purple-900/30' : ''}`}
                                onClick={() => fromRides.length <= i && handleNameCellClick(date, false)}
                              >
                                {fromRides.length > i ? (
                                  <span>{fromRides[i].driverName}</span>
                                ) : (
                                  <span className="text-muted-foreground/40 text-xs">+ add</span>
                                )}
                              </td>
                              <td
                                className={`border border-border p-2 bg-purple-50/60 dark:bg-purple-950/20 text-center ${fromRides.length > i ? 'cursor-pointer hover:bg-purple-100/70 dark:hover:bg-purple-900/30' : 'text-muted-foreground/40'}`}
                                onClick={() => handleCarSeatsClick(fromRides.length > i ? fromRides[i] : null)}
                              >
                                {fromRides.length > i ? (() => {
                                  const ride = fromRides[i]
                                  const taken = ride.totalSeats - ride.availableSeats
                                  const isFull = ride.availableSeats <= 0
                                  return (
                                    <span className={`font-medium tabular-nums ${isFull ? 'text-red-600 dark:text-red-400' : 'text-purple-700 dark:text-purple-400'}`}>
                                      {ride.totalSeats}/{taken}
                                    </span>
                                  )
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
