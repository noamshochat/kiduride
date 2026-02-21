'use client'

import { useAuth } from '@/components/auth-provider'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense, useCallback } from 'react'
import { Ride, User, Child, Passenger } from '@/lib/demo-data'
import { supabaseDb } from '@/lib/supabase-db'
import { ChildAutocomplete } from '@/components/child-autocomplete'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { format } from 'date-fns'
import { DirectionLabel } from '@/components/direction-label'
import { Calendar, Users, MapPin, CheckCircle2, XCircle, Plus, X, Home, Phone, LayoutDashboard, Table, List, Train } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { AddressLink } from '@/components/address-link'
import { useActivity } from '@/components/activity-provider'
import { getCurrentMonthDates } from '@/lib/utils'
import React from 'react'

interface ChildEntry {
  id: string
  child: Child | null // Selected child from autocomplete (preferred)
  name: string // Fallback name if child is not selected
  pickupFromHome: boolean
  pickupAddress: string
}

type RideGroup = {
  toRides: Ride[]
  fromRides: Ride[]
}

// Table View Component for Parent Page
function ParentTableView({ rides, usersMap, user, isAdmin, activity, onAssignClick, onFullRideClick, onEmptyCellClick }: { 
  rides: Ride[], 
  usersMap: Record<string, User>, 
  user: User,
  isAdmin: boolean,
  activity: string | null,
  onAssignClick: (ride: Ride) => void,
  onFullRideClick: () => void,
  onEmptyCellClick: (date: string, isToSection: boolean) => void
}) {
  const [hoveredRideId, setHoveredRideId] = useState<string | null>(null)
  
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

  // Get all dates in the range
  const dates = Object.keys(ridesByDate).sort()

  // Helper function to determine if date should be red (alternating pattern)
  const isRedDate = (date: string, index: number) => {
    return index % 3 === 2
  }

  if (rides.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No rides available for the selected date range
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0 pb-8">
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
                <th className="border border-gray-300 p-2 bg-green-100 font-medium">Driver</th>
                <th className="border border-gray-300 p-2 bg-green-100 font-medium">Seats</th>
                <th className="border border-gray-300 p-2 bg-green-100 font-medium">Driver</th>
                <th className="border border-gray-300 p-2 bg-green-100 font-medium">Seats</th>
                <th className="border border-gray-300 p-2 bg-purple-100 font-medium">Driver</th>
                <th className="border border-gray-300 p-2 bg-purple-100 font-medium">Seats</th>
                <th className="border border-gray-300 p-2 bg-purple-100 font-medium">Driver</th>
                <th className="border border-gray-300 p-2 bg-purple-100 font-medium">Seats</th>
                <th className="border border-gray-300 p-2 bg-purple-100 font-medium">Driver</th>
                <th className="border border-gray-300 p-2 bg-purple-100 font-medium">Seats</th>
              </tr>
            </thead>
            <tbody>
              {dates.map((date, index) => {
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
                          className={`border border-gray-300 p-2 bg-green-50 ${toRides.length > i ? 'cursor-pointer hover:bg-green-100' : 'text-gray-400 cursor-pointer hover:bg-green-100'}`}
                          onClick={() => {
                            if (toRides.length > i) {
                              const ride = toRides[i]
                              if (ride.availableSeats <= 0) {
                                onFullRideClick()
                              } else {
                                onAssignClick(ride)
                              }
                            } else {
                              onEmptyCellClick(date, true)
                            }
                          }}
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
                          className={`border border-gray-300 p-2 bg-green-50 text-center relative ${toRides.length > i ? 'cursor-pointer hover:bg-green-100' : 'text-gray-400'}`}
                          onMouseEnter={() => toRides.length > i && setHoveredRideId(toRides[i].id)}
                          onMouseLeave={() => setHoveredRideId(null)}
                        >
                          {toRides.length > i ? (
                            <>
                              <div onClick={() => {
                                const ride = toRides[i]
                                if (ride.availableSeats <= 0) {
                                  onFullRideClick()
                                } else {
                                  onAssignClick(ride)
                                }
                              }}>
                                {(() => {
                                  const ride = toRides[i]
                                  const takenSeats = ride.totalSeats - ride.availableSeats
                                  return `${ride.totalSeats}/${takenSeats}`
                                })()}
                              </div>
                              {hoveredRideId === toRides[i].id && toRides[i].passengers.length > 0 && (
                                <div className="absolute z-50 left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs rounded-md shadow-lg p-2 min-w-[150px] max-w-[250px] whitespace-nowrap">
                                  <div className="font-semibold mb-1">Registered Children:</div>
                                  <ul className="space-y-1">
                                    {toRides[i].passengers.map((passenger) => (
                                      <li key={passenger.id}>
                                        {passenger.childName}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </>
                          ) : ''}
                        </td>
                      </React.Fragment>
                    ))}
                    
                    {/* FROM Section - Up to 3 rides */}
                    {[0, 1, 2].map((i) => (
                      <React.Fragment key={i}>
                        <td 
                          className={`border border-gray-300 p-2 bg-purple-50 ${fromRides.length > i ? 'cursor-pointer hover:bg-purple-100' : 'text-gray-400 cursor-pointer hover:bg-purple-100'}`}
                          onClick={() => {
                            if (fromRides.length > i) {
                              const ride = fromRides[i]
                              if (ride.availableSeats <= 0) {
                                onFullRideClick()
                              } else {
                                onAssignClick(ride)
                              }
                            } else {
                              onEmptyCellClick(date, false)
                            }
                          }}
                        >
                          {fromRides.length > i ? fromRides[i].driverName : ''}
                        </td>
                        <td 
                          className={`border border-gray-300 p-2 bg-purple-50 text-center relative ${fromRides.length > i ? 'cursor-pointer hover:bg-purple-100' : 'text-gray-400'}`}
                          onMouseEnter={() => fromRides.length > i && setHoveredRideId(fromRides[i].id)}
                          onMouseLeave={() => setHoveredRideId(null)}
                        >
                          {fromRides.length > i ? (
                            <>
                              <div onClick={() => {
                                const ride = fromRides[i]
                                if (ride.availableSeats <= 0) {
                                  onFullRideClick()
                                } else {
                                  onAssignClick(ride)
                                }
                              }}>
                                {(() => {
                                  const ride = fromRides[i]
                                  const takenSeats = ride.totalSeats - ride.availableSeats
                                  return `${ride.totalSeats}/${takenSeats}`
                                })()}
                              </div>
                              {hoveredRideId === fromRides[i].id && fromRides[i].passengers.length > 0 && (
                                <div className="absolute z-50 left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs rounded-md shadow-lg p-2 min-w-[150px] max-w-[250px] whitespace-nowrap">
                                  <div className="font-semibold mb-1">Registered Children:</div>
                                  <ul className="space-y-1">
                                    {fromRides[i].passengers.map((passenger) => (
                                      <li key={passenger.id}>
                                        {passenger.childName}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </>
                          ) : ''}
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
  )
}

function ParentPageContent() {
  const { user, logout } = useAuth()
  const { activity } = useActivity()
  const router = useRouter()
  const searchParams = useSearchParams()
  // Get current calendar month dates (first day to last day)
  const currentMonth = getCurrentMonthDates()
  const [startDate, setStartDate] = useState(() => {
    const dateParam = searchParams.get('startDate')
    return dateParam || currentMonth.startDate
  })
  const [endDate, setEndDate] = useState(() => {
    const dateParam = searchParams.get('endDate')
    return dateParam || currentMonth.endDate
  })
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table') // Default to table view
  const [rides, setRides] = useState<Ride[]>([])
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)
  const [childrenEntries, setChildrenEntries] = useState<ChildEntry[]>([
    { id: '1', child: null, name: '', pickupFromHome: false, pickupAddress: '' }
  ])
  const [usersMap, setUsersMap] = useState<Record<string, User>>({})
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [selectedPassenger, setSelectedPassenger] = useState<{ rideId: string; passenger: Passenger } | null>(null)
  const [updateEntry, setUpdateEntry] = useState<{ pickupFromHome: boolean; pickupAddress: string }>({
    pickupFromHome: false,
    pickupAddress: ''
  })
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true)
  const [isFullDialogOpen, setIsFullDialogOpen] = useState(false)

  // Check admin status on mount
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsLoadingAdmin(false)
        return
      }
      try {
        const adminStatus = await supabaseDb.checkIsAdmin(user.id)
        setIsAdmin(adminStatus)
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      } finally {
        setIsLoadingAdmin(false)
      }
    }
    checkAdmin()
  }, [user])

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

  // Only load rides on initial mount, not when date changes
  useEffect(() => {
    if (user) {
      loadRides()
    } else if (!user) {
      router.push('/')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router])

  // Load rides when date range or activity changes (but only if user is logged in)
  useEffect(() => {
    if (user) {
      loadRides()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, activity])

  // Handle ride ID from query params - auto-select ride when page loads
  useEffect(() => {
    const rideId = searchParams.get('rideId')
    if (rideId && rides.length > 0) {
      const ride = rides.find(r => r.id === rideId)
      if (ride) {
        setSelectedRide(ride)
        setIsAssignOpen(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rides, searchParams])

  const loadRides = async () => {
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
      return a.direction.localeCompare(b.direction)
    })
    
    setRides(filtered)
  }

  const addChildEntry = () => {
    setChildrenEntries([
      ...childrenEntries,
      { id: Date.now().toString(), child: null, name: '', pickupFromHome: false, pickupAddress: '' }
    ])
  }

  const removeChildEntry = (id: string) => {
    if (childrenEntries.length > 1) {
      setChildrenEntries(childrenEntries.filter(entry => entry.id !== id))
    }
  }

  const updateChildEntry = (id: string, updates: Partial<ChildEntry>) => {
    setChildrenEntries(childrenEntries.map(entry =>
      entry.id === id ? { ...entry, ...updates } : entry
    ))
  }

  const handleAssignChildren = async () => {
    if (!selectedRide || !user) return

    // Filter out entries without a registered child
    const validEntries = childrenEntries.filter(entry => 
      entry.child !== null
    )
    
    if (validEntries.length === 0) {
      alert('Please select at least one registered child')
      return
    }

    // Check if ride has enough seats
    if (selectedRide.availableSeats < validEntries.length) {
      alert(`Not enough seats available. Only ${selectedRide.availableSeats} seat(s) remaining.`)
      return
    }

    // Check for duplicate children in the same ride
    const existingNames = selectedRide.passengers.map(p => p.childName.toLowerCase())
    const existingChildIds = selectedRide.passengers
      .filter(p => p.childId)
      .map(p => p.childId!)
    
    const duplicateNames = validEntries
      .map(e => `${e.child!.firstName}${e.child!.lastName ? ' ' + e.child!.lastName : ''}`.toLowerCase())
      .filter(name => name && existingNames.includes(name))
    
    const duplicateChildIds = validEntries
      .map(e => e.child!.id)
      .filter(id => existingChildIds.includes(id))
    
    if (duplicateNames.length > 0 || duplicateChildIds.length > 0) {
      const duplicates = [...duplicateNames, ...duplicateChildIds.map(id => `Child ID: ${id}`)]
      alert(`The following children are already assigned to this ride: ${duplicates.join(', ')}`)
      return
    }

    // Add all children
    let successCount = 0
    let hasConfigError = false
    
    try {
      for (const entry of validEntries) {
        // Use child from autocomplete (required)
        const childName = `${entry.child!.firstName}${entry.child!.lastName ? ' ' + entry.child!.lastName : ''}`
        
        const passenger = {
          id: `p${Date.now()}-${Math.random()}`,
          childId: entry.child!.id,
          childName: childName,
          parentId: user.id,
          parentName: user.name,
          pickupFromHome: entry.pickupFromHome,
          pickupAddress: entry.pickupFromHome && entry.pickupAddress.trim() 
            ? entry.pickupAddress.trim() 
            : undefined,
        }

        try {
          const success = await supabaseDb.addPassenger(selectedRide.id, passenger)
          if (success) {
            successCount++
          }
        } catch (error: any) {
          if (error?.code === 'GOOGLE_SHEETS_NOT_CONFIGURED') {
            hasConfigError = true
            break
          }
          // Continue trying other children if it's a different error
        }
      }

      if (hasConfigError) {
        alert('Google Sheets is not configured. Please set up GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_SERVICE_ACCOUNT_PATH in your environment variables to assign children to rides.')
      } else if (successCount > 0) {
        await loadRides()
        setIsAssignOpen(false)
        setSelectedRide(null)
        setChildrenEntries([{ id: '1', child: null, name: '', pickupFromHome: false, pickupAddress: '' }])
        alert(`${successCount} child(ren) successfully assigned to ride!`)
      } else {
        alert('Failed to assign children. Ride may be full.')
      }
    } catch (error: any) {
      if (error?.code === 'GOOGLE_SHEETS_NOT_CONFIGURED') {
        alert('Google Sheets is not configured. Please set up GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_SERVICE_ACCOUNT_PATH in your environment variables to assign children to rides.')
      } else {
        alert('Failed to assign children. Please try again.')
      }
      console.error(error)
    }
  }

  const handleRemoveChild = async (rideId: string, passengerId: string) => {
    if (!user) return

    const ride = await supabaseDb.getRideById(rideId)
    if (!ride) return

    const passenger = ride.passengers.find(p => p.id === passengerId)
    if (!passenger) return

    // Check if this passenger belongs to the current user (unless admin)
    if (!isAdmin && passenger.parentId !== user.id) {
      alert('You can only remove your own children from rides')
      return
    }

    const confirmMessage = isAdmin && passenger.parentId !== user.id
      ? `Are you sure you want to remove ${passenger.childName} from this ride? (Admin: removing another parent's child)`
      : 'Are you sure you want to remove this child from the ride?'

    if (confirm(confirmMessage)) {
      try {
        const success = await supabaseDb.removePassenger(rideId, passengerId)
        if (success) {
          await loadRides()
        } else {
          alert('Failed to remove child. Please try again.')
        }
      } catch (error: any) {
        if (error?.code === 'GOOGLE_SHEETS_NOT_CONFIGURED') {
          alert('Google Sheets is not configured. Please set up GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_SERVICE_ACCOUNT_PATH in your environment variables to remove children from rides.')
        } else {
          alert('Failed to remove child from ride. Please try again.')
        }
        console.error(error)
      }
    }
  }

  const openAssignDialog = useCallback((ride: Ride) => {
    setSelectedRide(ride)
    setChildrenEntries([{ id: '1', child: null, name: '', pickupFromHome: false, pickupAddress: '' }])
    setIsAssignOpen(true)
  }, [])

  const handleFullRideClick = useCallback(() => {
    setIsFullDialogOpen(true)
  }, [])

  const handleEmptyCellClick = useCallback((date: string, isToSection: boolean) => {
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
  }, [activity, router])

  const openUpdateDialog = (rideId: string, passenger: Passenger) => {
    setSelectedPassenger({ rideId, passenger })
    setUpdateEntry({
      pickupFromHome: passenger.pickupFromHome || false,
      pickupAddress: passenger.pickupAddress || ''
    })
    setIsUpdateOpen(true)
  }

  const handleUpdatePassenger = async () => {
    if (!selectedPassenger || !user) return

    // Check if this passenger belongs to the current user (unless admin)
    if (!isAdmin && selectedPassenger.passenger.parentId !== user.id) {
      alert('You can only update your own children\'s assignments')
      return
    }

    try {
      const success = await supabaseDb.updatePassenger(
        selectedPassenger.rideId,
        selectedPassenger.passenger.id,
        {
          pickupFromHome: updateEntry.pickupFromHome,
          pickupAddress: updateEntry.pickupFromHome ? updateEntry.pickupAddress : ''
        }
      )

      if (success) {
        setIsUpdateOpen(false)
        setSelectedPassenger(null)
        await loadRides()
      } else {
        alert('Failed to update assignment. Please try again.')
      }
    } catch (error: any) {
      if (error?.code === 'GOOGLE_SHEETS_NOT_CONFIGURED') {
        alert('Google Sheets is not configured. Please set up GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_SERVICE_ACCOUNT_PATH in your environment variables to update assignments.')
      } else {
        alert('Failed to update assignment. Please try again.')
      }
      console.error(error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className={`text-3xl font-bold ${activity === 'tennis' ? 'text-green-600' : 'text-primary'}`}>
              {activity === 'tennis' ? 'TennisRide' : 'KiduRide'} Parent Dashboard
            </h1>
            {isAdmin && (
              <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-md">
                ADMIN MODE
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            {isAdmin ? 'Viewing all assigned children (Admin: can remove any child)' : 'Find and manage rides for your children'}
          </p>
        </div>

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
                  onClick={() => {
                    const month = getCurrentMonthDates()
                    setStartDate(month.startDate)
                    setEndDate(month.endDate)
                  }}
                  className="whitespace-nowrap"
                >
                  Current Month
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Monthly Summary
                </Button>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                onClick={() => setViewMode('table')}
                className="flex items-center gap-2"
              >
                <Table className="h-4 w-4" />
                Table View
              </Button>
              <Button
                variant={viewMode === 'card' ? 'default' : 'outline'}
                onClick={() => setViewMode('card')}
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                Card View
              </Button>
            </div>
          </CardContent>
        </Card>

        {viewMode === 'table' ? (
          <div className="mb-16">
            <ParentTableView 
              rides={rides} 
              usersMap={usersMap} 
              user={user}
              isAdmin={isAdmin}
              activity={activity}
              onAssignClick={openAssignDialog}
              onFullRideClick={handleFullRideClick}
              onEmptyCellClick={handleEmptyCellClick}
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rides.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No rides available for the selected date range
                </CardContent>
              </Card>
            ) : (
              rides.map((ride) => {
              const userPassengers = ride.passengers.filter(p => p.parentId === user.id)
              // If admin, show all passengers; otherwise show only user's passengers
              const displayedPassengers = isAdmin ? ride.passengers : userPassengers
              const isFull = ride.availableSeats <= 0
              const hasUserChild = userPassengers.length > 0
              const driver = usersMap[ride.driverId]

              return (
                <Card key={ride.id} className={isFull ? 'opacity-75' : ''}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          <DirectionLabel direction={ride.direction} />
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(ride.date), 'MMM d, yyyy')} • {ride.driverName}
                        </CardDescription>
                      </div>
                      {isFull ? (
                        <XCircle className="h-5 w-5 text-destructive" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {ride.passengers.length} / {ride.totalSeats} seats
                        {isFull && <span className="text-destructive ml-1">(Full)</span>}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <AddressLink address={ride.pickupAddress} className="text-muted-foreground" />
                    </div>
                    {driver?.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${driver.phone}`} className="text-muted-foreground hover:text-foreground hover:underline">
                          {driver.phone}
                        </a>
                      </div>
                    )}
                    {ride.notes && (
                      <div className="text-sm">
                        <p className="font-medium">Notes:</p>
                        <p className="text-muted-foreground">{ride.notes}</p>
                      </div>
                    )}
                    {displayedPassengers.length > 0 && (
                      <div className="text-sm pt-2 border-t">
                        <p className="font-medium mb-2">
                          {isAdmin ? 'All Assigned Children:' : 'Your Children:'}
                        </p>
                        <ul className="space-y-2">
                          {displayedPassengers.map((passenger) => {
                            const isOwnChild = passenger.parentId === user.id
                            const parent = usersMap[passenger.parentId]
                            return (
                              <li key={passenger.id} className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground font-medium">{passenger.childName}</span>
                                    {isAdmin && !isOwnChild && parent && (
                                      <span className="text-xs text-muted-foreground">
                                        ({parent.name})
                                      </span>
                                    )}
                                  </div>
                                  {passenger.pickupFromHome && passenger.pickupAddress && (
                                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                      <Home className="h-3 w-3 flex-shrink-0" />
                                      <AddressLink address={passenger.pickupAddress} className="text-xs text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  {(isAdmin || isOwnChild) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openUpdateDialog(ride.id, passenger)}
                                      className="h-6 px-2"
                                    >
                                      Update
                                    </Button>
                                  )}
                                  {(isAdmin || isOwnChild) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveChild(ride.id, passenger.id)}
                                      className="text-destructive h-6 px-2"
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}
                    <div className="pt-2">
                      {!isFull && (
                        <Button
                          onClick={() => openAssignDialog(ride)}
                          className="w-full"
                          variant={hasUserChild ? 'outline' : 'default'}
                        >
                          {hasUserChild ? 'Assign More Children' : 'Assign Children'}
                        </Button>
                      )}
                      {isFull && (
                        <Button disabled className="w-full" variant="outline">
                          Ride Full
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
        )}

        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assign Children to Ride</DialogTitle>
              <DialogDescription>
                Enter child names and specify pickup details. You can add multiple children at once.
              </DialogDescription>
            </DialogHeader>
            {selectedRide && (
              <div className="grid gap-4 py-4">
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  <p><strong>Ride Details:</strong></p>
                  <p>Date: {format(new Date(selectedRide.date), 'MMM d, yyyy')}</p>
                  <p>Direction: <DirectionLabel direction={selectedRide.direction} /></p>
                  <p>Pickup Location: {selectedRide.pickupAddress}</p>
                  <p>Available Seats: {selectedRide.availableSeats}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Children</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addChildEntry}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Child
                    </Button>
                  </div>

                  {childrenEntries.map((entry, index) => (
                    <Card key={entry.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 space-y-3">
                            <div>
                              <Label htmlFor={`child-${entry.id}`}>
                                Child {index + 1}
                              </Label>
                              <ChildAutocomplete
                                activity={activity}
                                value={entry.child}
                                onChange={(child) => {
                                  updateChildEntry(entry.id, { 
                                    child,
                                    name: child ? `${child.firstName}${child.lastName ? ' ' + child.lastName : ''}` : ''
                                  })
                                }}
                                placeholder="Search for a registered child..."
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`pickup-${entry.id}`}
                                checked={entry.pickupFromHome}
                                onCheckedChange={(checked) => {
                                  updateChildEntry(entry.id, {
                                    pickupFromHome: checked === true,
                                    pickupAddress: checked === true ? entry.pickupAddress : ''
                                  })
                                }}
                              />
                              <Label
                                htmlFor={`pickup-${entry.id}`}
                                className="text-sm font-normal cursor-pointer flex items-center gap-2"
                              >
                                <Home className="h-4 w-4" />
                                Pickup from home (different address)
                              </Label>
                            </div>

                            {entry.pickupFromHome && (
                              <div>
                                <Label htmlFor={`address-${entry.id}`}>
                                  Home Address
                                </Label>
                                <Input
                                  id={`address-${entry.id}`}
                                  placeholder="Enter home address"
                                  value={entry.pickupAddress}
                                  onChange={(e) => updateChildEntry(entry.id, { pickupAddress: e.target.value })}
                                />
                              </div>
                            )}
                          </div>

                          {childrenEntries.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeChildEntry(entry.id)}
                              className="text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAssignChildren}
                disabled={
                  !selectedRide ||
                  selectedRide.availableSeats <= 0 ||
                  childrenEntries.every(e => !e.child && e.name.trim() === '')
                }
              >
                Assign Children
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Update Child Assignment</DialogTitle>
              <DialogDescription>
                Update pickup details for {selectedPassenger?.passenger.childName}
              </DialogDescription>
            </DialogHeader>
            {selectedPassenger && (
              <div className="grid gap-4 py-4">
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  <p><strong>Child:</strong> {selectedPassenger.passenger.childName}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="update-pickup"
                      checked={updateEntry.pickupFromHome}
                      onCheckedChange={(checked) => {
                        setUpdateEntry({
                          pickupFromHome: checked === true,
                          pickupAddress: checked === true ? updateEntry.pickupAddress : ''
                        })
                      }}
                    />
                    <Label
                      htmlFor="update-pickup"
                      className="text-sm font-normal cursor-pointer flex items-center gap-2"
                    >
                      <Home className="h-4 w-4" />
                      Pickup from home (different address)
                    </Label>
                  </div>

                  {updateEntry.pickupFromHome && (
                    <div className="space-y-2">
                      <Label htmlFor="update-pickup-address">Pickup Address</Label>
                      <Input
                        id="update-pickup-address"
                        placeholder="Enter pickup address"
                        value={updateEntry.pickupAddress}
                        onChange={(e) => {
                          setUpdateEntry({
                            ...updateEntry,
                            pickupAddress: e.target.value
                          })
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsUpdateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdatePassenger}
                disabled={updateEntry.pickupFromHome && !updateEntry.pickupAddress.trim()}
              >
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

export default function ParentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    }>
      <ParentPageContent />
    </Suspense>
  )
}

