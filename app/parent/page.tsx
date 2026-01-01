'use client'

import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
import { Calendar, Users, MapPin, CheckCircle2, XCircle, Plus, X, Home, Phone, LayoutDashboard } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { useActivity } from '@/components/activity-provider'

interface ChildEntry {
  id: string
  child: Child | null // Selected child from autocomplete (preferred)
  name: string // Fallback name if child is not selected
  pickupFromHome: boolean
  pickupAddress: string
}

export default function ParentPage() {
  const { user, logout } = useAuth()
  const { activity } = useActivity()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
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

  // Load rides when date changes or activity changes (but only if user is logged in)
  useEffect(() => {
    if (user) {
      loadRides()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, activity])

  const loadRides = async () => {
    const dateRides = await supabaseDb.getRidesByDate(selectedDate)
    
    // Filter by activity if activity is set
    let filtered = dateRides
    if (activity === 'tennis') {
      filtered = dateRides.filter(ride => ride.direction === 'to-tennis-center' || ride.direction === 'back-home')
    } else if (activity === 'kidu') {
      filtered = dateRides.filter(ride => ride.direction === 'to-school' || ride.direction === 'from-school' || ride.direction === 'to-train-station')
    }
    
    setRides(filtered)
  }

  // Get direction display label
  const getDirectionLabel = (direction: string) => {
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

  const openAssignDialog = (ride: Ride) => {
    setSelectedRide(ride)
    setChildrenEntries([{ id: '1', child: null, name: '', pickupFromHome: false, pickupAddress: '' }])
    setIsAssignOpen(true)
  }

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
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 justify-between">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="max-w-xs"
              />
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Monthly Summary
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rides.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center text-muted-foreground">
                No rides available for {format(new Date(selectedDate), 'MMM d, yyyy')}
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
                          {getDirectionLabel(ride.direction)}
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
                      <span className="text-muted-foreground">{ride.pickupAddress}</span>
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
                                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                      <Home className="h-3 w-3" />
                                      <span>{passenger.pickupAddress}</span>
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
                  <p>Direction: {getDirectionLabel(selectedRide.direction)}</p>
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
      </div>
    </div>
  )
}

