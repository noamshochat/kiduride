'use client'

import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Ride, User } from '@/lib/demo-data'
import { supabaseDb } from '@/lib/supabase-db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { format } from 'date-fns'
import { Calendar, Users, MapPin, CheckCircle2, XCircle, Plus, X, Home, Phone } from 'lucide-react'
import { Navigation } from '@/components/navigation'

interface ChildEntry {
  id: string
  name: string
  pickupFromHome: boolean
  pickupAddress: string
}

export default function ParentPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [rides, setRides] = useState<Ride[]>([])
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)
  const [childrenEntries, setChildrenEntries] = useState<ChildEntry[]>([
    { id: '1', name: '', pickupFromHome: false, pickupAddress: '' }
  ])
  const [usersMap, setUsersMap] = useState<Record<string, User>>({})

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

  // Load rides when date changes (but only if user is logged in)
  useEffect(() => {
    if (user) {
      loadRides()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  const loadRides = async () => {
    const dateRides = await supabaseDb.getRidesByDate(selectedDate)
    setRides(dateRides)
  }

  const addChildEntry = () => {
    setChildrenEntries([
      ...childrenEntries,
      { id: Date.now().toString(), name: '', pickupFromHome: false, pickupAddress: '' }
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

    // Filter out empty names
    const validEntries = childrenEntries.filter(entry => entry.name.trim() !== '')
    
    if (validEntries.length === 0) {
      alert('Please enter at least one child name')
      return
    }

    // Check if ride has enough seats
    if (selectedRide.availableSeats < validEntries.length) {
      alert(`Not enough seats available. Only ${selectedRide.availableSeats} seat(s) remaining.`)
      return
    }

    // Check for duplicate names in the same ride
    const existingNames = selectedRide.passengers.map(p => p.childName.toLowerCase())
    const duplicateNames = validEntries
      .map(e => e.name.trim().toLowerCase())
      .filter(name => existingNames.includes(name))
    
    if (duplicateNames.length > 0) {
      alert(`The following children are already assigned to this ride: ${duplicateNames.join(', ')}`)
      return
    }

    // Add all children
    let successCount = 0
    let hasConfigError = false
    
    try {
      for (const entry of validEntries) {
        const passenger = {
          id: `p${Date.now()}-${Math.random()}`,
          childName: entry.name.trim(),
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
        setChildrenEntries([{ id: '1', name: '', pickupFromHome: false, pickupAddress: '' }])
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

    // Check if this passenger belongs to the current user
    const ride = await supabaseDb.getRideById(rideId)
    if (!ride) return

    const passenger = ride.passengers.find(p => p.id === passengerId)
    if (!passenger || passenger.parentId !== user.id) {
      alert('You can only remove your own children from rides')
      return
    }

    if (confirm('Are you sure you want to remove this child from the ride?')) {
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
    setChildrenEntries([{ id: '1', name: '', pickupFromHome: false, pickupAddress: '' }])
    setIsAssignOpen(true)
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
          <h1 className="text-3xl font-bold text-primary">Parent Dashboard</h1>
          <p className="text-muted-foreground">Find and manage rides for your children</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs"
            />
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
              const isFull = ride.availableSeats <= 0
              const hasUserChild = userPassengers.length > 0
              const driver = usersMap[ride.driverId]

              return (
                <Card key={ride.id} className={isFull ? 'opacity-75' : ''}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {ride.direction === 'to-school' ? 'To university' : 'From university'}
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
                    {hasUserChild && (
                      <div className="text-sm pt-2 border-t">
                        <p className="font-medium mb-2">Your Children:</p>
                        <ul className="space-y-2">
                          {userPassengers.map((passenger) => (
                            <li key={passenger.id} className="flex justify-between items-start">
                              <div className="flex-1">
                                <span className="text-muted-foreground font-medium">{passenger.childName}</span>
                                {passenger.pickupFromHome && passenger.pickupAddress && (
                                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                    <Home className="h-3 w-3" />
                                    <span>{passenger.pickupAddress}</span>
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveChild(ride.id, passenger.id)}
                                className="text-destructive h-6 px-2"
                              >
                                Remove
                              </Button>
                            </li>
                          ))}
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
                  <p>Direction: {selectedRide.direction === 'to-school' ? 'To university' : 'From university'}</p>
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
                              <Label htmlFor={`name-${entry.id}`}>
                                Child Name {index + 1}
                              </Label>
                              <Input
                                id={`name-${entry.id}`}
                                placeholder="Enter child's name"
                                value={entry.name}
                                onChange={(e) => updateChildEntry(entry.id, { name: e.target.value })}
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
                  childrenEntries.every(e => e.name.trim() === '')
                }
              >
                Assign Children
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

