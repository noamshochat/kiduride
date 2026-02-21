'use client'

import { useAuth } from '@/components/auth-provider'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { Ride, User, Child } from '@/lib/demo-data'
import { ChildAutocomplete } from '@/components/child-autocomplete'
import { Checkbox } from '@/components/ui/checkbox'
import { supabaseDb } from '@/lib/supabase-db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { Calendar, Users, MapPin, Phone, Clock, FileText, ArrowRight, ArrowLeft, Home, Printer, Table, Plus, X } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { AddressLink } from '@/components/address-link'
import { useActivity } from '@/components/activity-provider'
import { getCurrentMonthDates } from '@/lib/utils'
import { DirectionLabel } from '@/components/direction-label'

interface ChildEntry {
  id: string
  child: Child | null
  name: string
  pickupFromHome: boolean
  pickupAddress: string
}

function DashboardContent() {
  const { user } = useAuth()
  const { activity } = useActivity()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get current calendar month dates (first day to last day)
  const currentMonth = getCurrentMonthDates()
  const [startDate, setStartDate] = useState(() => searchParams.get('startDate') || currentMonth.startDate)
  const [endDate, setEndDate] = useState(() => searchParams.get('endDate') || currentMonth.endDate)
  const [rides, setRides] = useState<Ride[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [usersMap, setUsersMap] = useState<Record<string, User>>({})
  const [isAdmin, setIsAdmin] = useState(false)
  const [pendingRemoval, setPendingRemoval] = useState<{ rideId: string; passengerId: string; childName: string } | null>(null)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)
  const [childrenEntries, setChildrenEntries] = useState<ChildEntry[]>([
    { id: '1', child: null, name: '', pickupFromHome: false, pickupAddress: '' }
  ])

  // Determine active view based on current path
  const activeView = pathname === '/dashboard/calendar' ? 'table' : pathname === '/dashboard/print' ? 'print' : 'summary'

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  // Check admin status on mount
  useEffect(() => {
    if (!user) return
    supabaseDb.checkIsAdmin(user.id).then(setIsAdmin).catch(() => setIsAdmin(false))
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
        // For kidu activity, prioritize to-school (to university) over from-school (from university)
        if (activity === 'kidu' || !activity) {
          if (a.direction === 'to-school' && b.direction === 'from-school') {
            return -1
          }
          if (a.direction === 'from-school' && b.direction === 'to-school') {
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

  const handleRemovePassenger = (rideId: string, passengerId: string, childName: string) => {
    setPendingRemoval({ rideId, passengerId, childName })
  }

  const confirmRemoval = async () => {
    if (!pendingRemoval) return
    const { rideId, passengerId } = pendingRemoval
    setPendingRemoval(null)
    try {
      const success = await supabaseDb.removePassenger(rideId, passengerId)
      if (success) {
        await loadRides()
      } else {
        alert('Failed to remove child. Please try again.')
      }
    } catch (error) {
      console.error(error)
      alert('Failed to remove child from ride. Please try again.')
    }
  }

  const openAssignDialog = (ride: Ride) => {
    setSelectedRide(ride)
    setChildrenEntries([{ id: '1', child: null, name: '', pickupFromHome: false, pickupAddress: '' }])
    setIsAssignOpen(true)
  }

  const addChildEntry = () => {
    setChildrenEntries(prev => [...prev, { id: Date.now().toString(), child: null, name: '', pickupFromHome: false, pickupAddress: '' }])
  }

  const removeChildEntry = (id: string) => {
    setChildrenEntries(prev => prev.length > 1 ? prev.filter(e => e.id !== id) : prev)
  }

  const updateChildEntry = (id: string, updates: Partial<ChildEntry>) => {
    setChildrenEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
  }

  const handleAssignChildren = async () => {
    if (!selectedRide || !user) return

    const validEntries = childrenEntries.filter(e => e.child !== null)
    if (validEntries.length === 0) { alert('Please select at least one registered child'); return }
    if (selectedRide.availableSeats < validEntries.length) { alert(`Not enough seats. Only ${selectedRide.availableSeats} available.`); return }

    const existingNames = selectedRide.passengers.map(p => p.childName.toLowerCase())
    const existingChildIds = selectedRide.passengers.filter(p => p.childId).map(p => p.childId!)
    const dupNames = validEntries.map(e => `${e.child!.firstName}${e.child!.lastName ? ' ' + e.child!.lastName : ''}`.toLowerCase()).filter(n => existingNames.includes(n))
    const dupIds = validEntries.map(e => e.child!.id).filter(id => existingChildIds.includes(id))
    if (dupNames.length > 0 || dupIds.length > 0) { alert(`Already assigned: ${[...dupNames].join(', ')}`); return }

    let successCount = 0
    try {
      for (const entry of validEntries) {
        const childName = `${entry.child!.firstName}${entry.child!.lastName ? ' ' + entry.child!.lastName : ''}`
        const passenger = {
          id: `p${Date.now()}-${Math.random()}`,
          childId: entry.child!.id,
          childName,
          parentId: user.id,
          parentName: user.name,
          pickupFromHome: entry.pickupFromHome,
          pickupAddress: entry.pickupFromHome && entry.pickupAddress.trim() ? entry.pickupAddress.trim() : undefined,
        }
        const success = await supabaseDb.addPassenger(selectedRide.id, passenger)
        if (success) successCount++
      }
      if (successCount > 0) {
        await loadRides()
        setIsAssignOpen(false)
        setSelectedRide(null)
        setChildrenEntries([{ id: '1', child: null, name: '', pickupFromHome: false, pickupAddress: '' }])
      } else {
        alert('Failed to assign children. Ride may be full.')
      }
    } catch (error) {
      console.error(error)
      alert('Failed to assign children. Please try again.')
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      <Navigation />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${activity === 'tennis' ? 'text-green-600' : 'text-primary'}`}>
            {activity === 'tennis' ? 'TennisRide' : 'KiduRide'} Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">View all rides for the selected date range</p>
        </div>

        {/* Date Range Selector */}
        <Card className="mb-5 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="startDate" className="text-xs text-muted-foreground">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="endDate" className="text-xs text-muted-foreground">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  variant={activeView === 'summary' ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleSetCurrentMonth}
                  className="whitespace-nowrap h-9"
                >
                  Default View
                </Button>
                <Button
                  type="button"
                  variant={activeView === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => router.push(`/dashboard/calendar?startDate=${startDate}&endDate=${endDate}`)}
                  className="whitespace-nowrap h-9"
                >
                  <Table className="mr-1.5 h-3.5 w-3.5" />
                  Table
                </Button>
                <Button
                  type="button"
                  variant={activeView === 'print' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => router.push(`/dashboard/print?startDate=${startDate}&endDate=${endDate}`)}
                  className="whitespace-nowrap h-9"
                >
                  <Printer className="mr-1.5 h-3.5 w-3.5" />
                  Print
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card className="bg-white/80">
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading rides...
            </CardContent>
          </Card>
        )}

        {/* No Rides */}
        {!isLoading && rides.length === 0 && (
          <Card className="bg-white/80">
            <CardContent className="py-12 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">No rides available for the selected date range</p>
            </CardContent>
          </Card>
        )}

        {/* Rides by Date */}
        {!isLoading && rides.length > 0 && (
          <div className="space-y-5">
            {sortedDates.map(date => (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-base font-semibold text-gray-700">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </h2>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">
                    {ridesByDate[date].length} ride{ridesByDate[date].length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-3">
                  {ridesByDate[date].map((ride) => {
                    const driver = usersMap[ride.driverId]
                    const isFull = ride.availableSeats <= 0
                    const isToRide = ride.direction === 'to-school' || ride.direction === 'to-tennis-center' || ride.direction === 'to-train-station'

                    return (
                      <Card
                        key={ride.id}
                        className={`border-l-4 bg-white/90 shadow-sm hover:shadow-md transition-shadow ${isToRide ? 'border-l-green-500' : 'border-l-purple-500'}`}
                      >
                        <CardContent className="p-4">

                          {/* Top bar: direction badge + time */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isToRide ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                {isToRide
                                  ? <ArrowRight className="h-3 w-3" />
                                  : <ArrowLeft className="h-3 w-3" />
                                }
                                <DirectionLabel direction={ride.direction} />
                              </span>
                              {isFull ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                                  Full
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
                                  {ride.availableSeats} open
                                </span>
                              )}
                            </div>
                            {ride.pickupTime && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                                <Clock className="h-3 w-3" />
                                {ride.pickupTime}
                              </span>
                            )}
                          </div>

                          {/* Info row */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 text-sm">
                            <div className="flex items-start gap-2">
                              <Users className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="font-medium truncate">{ride.driverName}</p>
                                {driver?.phone && (
                                  <a href={`tel:${driver.phone}`} className="text-xs text-primary hover:underline flex items-center gap-0.5 mt-0.5">
                                    <Phone className="h-3 w-3" />{driver.phone}
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <AddressLink address={ride.pickupAddress} className="text-sm text-muted-foreground" />
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {Array.from({ length: ride.totalSeats }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`h-2.5 w-2.5 rounded-full border ${i < ride.passengers.length ? (isToRide ? 'bg-green-500 border-green-500' : 'bg-purple-500 border-purple-500') : 'bg-white border-gray-300'}`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground">{ride.passengers.length}/{ride.totalSeats}</span>
                            </div>
                          </div>

                          {/* Notes */}
                          {ride.notes && (
                            <div className="flex items-start gap-2 mb-3 text-sm">
                              <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <p className="text-muted-foreground">{ride.notes}</p>
                            </div>
                          )}

                          {/* Passengers */}
                          {ride.passengers.length > 0 && (
                            <div className="border-t pt-3 mb-3">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                Passengers ({ride.passengers.length})
                              </p>
                              <div className="space-y-1.5">
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
                                    <div key={passenger.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
                                      <div className="flex items-start gap-2 flex-1 min-w-0">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0 mt-0.5 ${isToRide ? 'bg-green-500' : 'bg-purple-500'}`}>
                                          {passenger.childName.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-sm font-medium">{passenger.childName}</p>
                                          {allParents.length > 0 && (
                                            <div className="flex flex-wrap gap-x-2 mt-0.5">
                                              {allParents.map((p) => (
                                                <span key={p.id} className="text-xs text-muted-foreground">
                                                  {p.phone ? (
                                                    <a href={`tel:${p.phone}`} className="hover:text-primary hover:underline inline-flex items-center gap-0.5">
                                                      <Phone className="h-2.5 w-2.5" />{p.name}
                                                    </a>
                                                  ) : p.name}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                          {allParents.length === 0 && parentPhone && (
                                            <a href={`tel:${parentPhone}`} className="text-xs text-muted-foreground hover:text-primary hover:underline inline-flex items-center gap-0.5 mt-0.5">
                                              <Phone className="h-2.5 w-2.5" />{passenger.parentName}
                                            </a>
                                          )}
                                          {passenger.pickupFromHome && passenger.pickupAddress && (
                                            <div className="flex items-center gap-1 text-xs text-primary mt-2">
                                              <Home className="h-3 w-3 flex-shrink-0" />
                                              <AddressLink address={passenger.pickupAddress} className="text-xs text-primary" />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      {isAdmin && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemovePassenger(ride.id, passenger.id, passenger.childName)}
                                          className="text-destructive h-6 px-2 text-xs flex-shrink-0 ml-2"
                                        >
                                          Remove
                                        </Button>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/ride/${ride.id}`)}
                              className="h-8 text-xs"
                            >
                              View Details
                            </Button>
                            {ride.availableSeats > 0 && (
                              <Button
                                size="sm"
                                onClick={() => openAssignDialog(ride)}
                                className="h-8 text-xs gap-1.5"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Assign Child
                              </Button>
                            )}
                          </div>

                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Child Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Children to Ride</DialogTitle>
            <DialogDescription>
              Select registered children and specify pickup details.
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
                  <Button type="button" variant="outline" size="sm" onClick={addChildEntry} className="gap-2">
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
                            <Label>Child {index + 1}</Label>
                            <ChildAutocomplete
                              activity={activity}
                              value={entry.child}
                              onChange={(child) => updateChildEntry(entry.id, {
                                child,
                                name: child ? `${child.firstName}${child.lastName ? ' ' + child.lastName : ''}` : ''
                              })}
                              placeholder="Search for a registered child..."
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`pickup-${entry.id}`}
                              checked={entry.pickupFromHome}
                              onCheckedChange={(checked) => updateChildEntry(entry.id, {
                                pickupFromHome: checked === true,
                                pickupAddress: checked === true ? entry.pickupAddress : ''
                              })}
                            />
                            <Label htmlFor={`pickup-${entry.id}`} className="text-sm font-normal cursor-pointer flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              Pickup from home (different address)
                            </Label>
                          </div>
                          {entry.pickupFromHome && (
                            <div>
                              <Label>Home Address</Label>
                              <Input
                                placeholder="Enter home address"
                                value={entry.pickupAddress}
                                onChange={(e) => updateChildEntry(entry.id, { pickupAddress: e.target.value })}
                              />
                            </div>
                          )}
                        </div>
                        {childrenEntries.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeChildEntry(entry.id)} className="text-destructive">
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
            <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAssignChildren}
              disabled={!selectedRide || selectedRide.availableSeats <= 0 || childrenEntries.every(e => !e.child)}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Passenger Confirmation Dialog */}
      <Dialog open={!!pendingRemoval} onOpenChange={(open) => { if (!open) setPendingRemoval(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Child</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{pendingRemoval?.childName}</strong> from this ride?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRemoval(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmRemoval}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
