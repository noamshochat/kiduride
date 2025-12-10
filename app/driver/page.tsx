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
import { NumberInput } from '@/components/ui/number-input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { Plus, Trash2, Users, MapPin, Calendar, Pencil } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { ShareButton } from '@/components/share-button'
import { AddToCalendarButton } from '@/components/add-to-calendar-button'
import { Checkbox } from '@/components/ui/checkbox'

export default function DriverPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showAllRides, setShowAllRides] = useState(false) // Admin: show all rides or filter by date
  const [allRides, setAllRides] = useState<Ride[]>([]) // Store all rides
  const [rides, setRides] = useState<Ride[]>([]) // Filtered rides by date
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)
  const [usersMap, setUsersMap] = useState<Record<string, User>>({})
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    direction: 'to-school' as 'to-school' | 'from-school' | 'to-train-station',
    totalSeats: 0,
    pickupAddress: '',
    pickupTime: '',
    notes: '',
  })
  const [updateData, setUpdateData] = useState({
    totalSeats: 0,
    pickupAddress: '',
    pickupTime: '',
    notes: '',
  })

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

  useEffect(() => {
    if (user) {
      checkAdminAndLoadRides()
    } else if (!user) {
      router.push('/')
    }
  }, [user, router])

  const checkAdminAndLoadRides = async () => {
    if (!user) return

    setIsLoadingAdmin(true)
    let adminStatus = false
    try {
      // Check admin status via backend API (never trust frontend)
      adminStatus = await supabaseDb.checkIsAdmin(user.id)
      setIsAdmin(adminStatus)

      // Load rides based on admin status
      if (adminStatus) {
        // Admin: Load all rides from all drivers
        const loadedRides = await supabaseDb.getAllRidesAdmin(user.id)
        setAllRides(loadedRides)
      } else {
        // Regular user: Load only their own rides
        const driverRides = await supabaseDb.getRidesByDriver(user.id)
        setAllRides(driverRides)
      }
    } catch (error: any) {
      console.error('Error loading rides:', error)
      // If we confirmed admin status but API failed, don't fall back to user rides
      // Show empty state instead so user knows something is wrong
      if (adminStatus) {
        console.error('Admin API failed, but admin status confirmed. Not falling back to user rides.')
        setAllRides([])
      } else {
        // If not admin or admin check failed, try to load user's own rides as fallback
        try {
          const driverRides = await supabaseDb.getRidesByDriver(user.id)
          setAllRides(driverRides)
        } catch (fallbackError) {
          console.error('Error loading fallback rides:', fallbackError)
          setAllRides([])
        }
      }
    } finally {
      setIsLoadingAdmin(false)
    }
  }

  const loadRides = async () => {
    if (!user) return

    if (isAdmin) {
      // Admin: Reload all rides
      try {
        const loadedRides = await supabaseDb.getAllRidesAdmin(user.id)
        setAllRides(loadedRides)
      } catch (error) {
        console.error('Error loading admin rides:', error)
      }
    } else {
      // Regular user: Load only their own rides
      const driverRides = await supabaseDb.getRidesByDriver(user.id)
      setAllRides(driverRides)
    }
  }

  // Filter rides by selected date (date filter always applies)
  useEffect(() => {
    // Always filter by selected date
    const dateFiltered = allRides.filter(ride => ride.date === selectedDate)
    console.log('Driver mode - Filtering rides:', {
      totalRides: allRides.length,
      selectedDate,
      filteredCount: dateFiltered.length,
      rideDates: allRides.map(r => ({ id: r.id, date: r.date, direction: r.direction, driverId: r.driverId })),
      filteredRides: dateFiltered.map(r => ({ id: r.id, date: r.date, direction: r.direction }))
    })
    setRides(dateFiltered)
  }, [allRides, selectedDate])

  const handleCreateRide = async () => {
    if (!user) return
    
    // Validate required fields
    if (!formData.totalSeats || formData.totalSeats < 1) {
      alert('Please enter the number of available seats (minimum 1)')
      return
    }
    
    if (!formData.pickupAddress.trim()) {
      alert('Please enter a pickup address')
      return
    }

    try {
      const createdRide = await supabaseDb.createRide({
        driverId: user.id,
        driverName: user.name,
        date: formData.date,
        direction: formData.direction,
        availableSeats: formData.totalSeats,
        totalSeats: formData.totalSeats,
        pickupAddress: formData.pickupAddress,
        pickupTime: formData.pickupTime || undefined,
        notes: formData.notes || undefined,
      })

      // Update selected date to match the created ride's date so it appears immediately
      setSelectedDate(createdRide.date)
      
      // Reload rides from storage to ensure consistency
      await loadRides()
      setIsCreateOpen(false)
      setFormData({
        date: new Date().toISOString().split('T')[0],
        direction: 'to-school',
        totalSeats: 0,
        pickupAddress: '',
        pickupTime: '',
        notes: '',
      })
    } catch (error: any) {
      if (error?.code === 'GOOGLE_SHEETS_NOT_CONFIGURED') {
        alert('Google Sheets is not configured. Please set up GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_SERVICE_ACCOUNT_PATH in your environment variables to create rides.')
      } else {
        alert('Failed to create ride. Please try again.')
      }
      console.error(error)
    }
  }

  const openUpdateDialog = (ride: Ride) => {
    setSelectedRide(ride)
    setUpdateData({
      totalSeats: ride.totalSeats,
      pickupAddress: ride.pickupAddress,
      pickupTime: ride.pickupTime || '',
      notes: ride.notes || '',
    })
    setIsUpdateOpen(true)
  }

  const handleUpdateRide = async () => {
    if (!selectedRide || !user) return

    // Check if user owns the ride
    if (selectedRide.driverId !== user.id) {
      alert('You can only update your own rides.')
      return
    }

    try {
      const success = await supabaseDb.updateRide(selectedRide.id, {
        totalSeats: updateData.totalSeats,
        pickupAddress: updateData.pickupAddress,
        pickupTime: updateData.pickupTime || undefined,
        notes: updateData.notes || undefined,
      })

      if (success) {
        setIsUpdateOpen(false)
        setSelectedRide(null)
        await loadRides()
      } else {
        alert('Failed to update ride. Please try again.')
      }
    } catch (error: any) {
      alert(`Failed to update ride: ${error?.message || 'Unknown error'}`)
      console.error('Error updating ride:', error)
    }
  }

  const handleDeleteRide = async (rideId: string, rideDriverId?: string) => {
    // Check if user owns the ride or is admin
    if (!isAdmin && rideDriverId !== user?.id) {
      alert('You can only delete your own rides.')
      return
    }

    const confirmMessage = isAdmin 
      ? 'Are you sure you want to delete this ride? (Admin: deleting any ride)'
      : 'Are you sure you want to delete this ride?'
    
    if (confirm(confirmMessage)) {
      try {
        // Optimistically remove the ride from state immediately
        setAllRides(prevRides => prevRides.filter(ride => ride.id !== rideId))
        
        const success = await supabaseDb.deleteRide(rideId, user?.id, isAdmin)
        if (success) {
          // Reload rides to ensure we have the latest data from the server
          await loadRides()
        } else {
          // If deletion failed, reload to restore the ride
          alert('Failed to delete ride. Please check the console for details.')
          await loadRides()
        }
      } catch (error: any) {
        console.error('Error deleting ride:', error)
        alert(`Failed to delete ride: ${error?.message || 'Unknown error'}`)
        // Reload on error to ensure state is correct
        await loadRides()
      }
    }
  }

  if (!user || isLoadingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-x-hidden w-full max-w-full">
      <Navigation />
      <div className="w-full max-w-full px-3 sm:px-4 py-4 sm:py-8 mx-auto overflow-x-hidden">
        <div className="mb-4 sm:mb-8 w-full max-w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary break-words">Driver Dashboard</h1>
            {isAdmin && (
              <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-md">
                ADMIN MODE
              </span>
            )}
          </div>
          <p className="text-sm sm:text-base text-muted-foreground break-words">
            {isAdmin ? 'Viewing all rides from all drivers' : 'Manage your rides and passengers'}
          </p>
        </div>

        <Card className="mb-4 sm:mb-6 w-full max-w-full">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              {isAdmin ? 'Filter Rides' : 'Select Date'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
            {isAdmin && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-all-rides"
                  checked={showAllRides}
                  onCheckedChange={(checked) => setShowAllRides(checked === true)}
                />
                <Label
                  htmlFor="show-all-rides"
                  className="text-sm font-normal cursor-pointer"
                >
                  Show all drivers' rides for selected date ({allRides.filter(r => r.date === selectedDate).length} rides)
                </Label>
              </div>
            )}
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs"
            />
          </CardContent>
        </Card>

        <div className="mb-4 sm:mb-6 w-full max-w-full">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create New Ride
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader className="px-1 sm:px-0">
                <DialogTitle className="text-lg sm:text-xl">Create New Ride</DialogTitle>
                <DialogDescription className="text-sm">
                  Fill in the details for your ride. Seats will be assigned on a first-come, first-served basis.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 sm:gap-4 py-2 sm:py-4 px-1 sm:px-0">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="direction">Direction</Label>
                  <Select
                    value={formData.direction}
                    onValueChange={(value: 'to-school' | 'from-school' | 'to-train-station') =>
                      setFormData({ ...formData, direction: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="to-school">To university</SelectItem>
                      <SelectItem value="from-school">From university</SelectItem>
                      <SelectItem value="to-train-station">To train station</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="seats">Total Seats</Label>
                  <NumberInput
                    id="seats"
                    min={1}
                    max={10}
                    value={formData.totalSeats}
                    onChange={(value) => setFormData({ ...formData, totalSeats: value })}
                    className="w-full"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Pickup Address</Label>
                  <Input
                    id="address"
                    value={formData.pickupAddress}
                    onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                    placeholder="123 Main St, City"
                    className="w-full"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pickupTime">Pickup Time (Optional)</Label>
                  <Input
                    id="pickupTime"
                    type="time"
                    value={formData.pickupTime}
                    onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    If not specified, default times will be used (8:00 AM for to-school, 3:00 PM for from-school)
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional information..."
                    className="w-full"
                  />
                </div>
              </div>
              <DialogFooter className="px-1 sm:px-0 gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleCreateRide} disabled={!formData.pickupAddress || !formData.totalSeats || formData.totalSeats < 1} className="w-full sm:w-auto">
                  Create Ride
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Update Ride</DialogTitle>
                <DialogDescription>
                  Update ride details. Note: You cannot reduce total seats below the number of assigned passengers ({selectedRide?.passengers.length || 0}).
                </DialogDescription>
              </DialogHeader>
              {selectedRide && (
                <div className="grid gap-3 sm:gap-4 py-2 sm:py-4 px-1 sm:px-0">
                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    <p><strong>Ride Details:</strong></p>
                    <p>Date: {format(new Date(selectedRide.date), 'MMM d, yyyy')}</p>
                    <p>Direction: {selectedRide.direction === 'to-school'  
                            ? 'To university' 
                            : selectedRide.direction === 'to-train-station'
                            ? 'To train station'
                            : 'From university'}
                    </p>
                    <p>Assigned Passengers: {selectedRide.passengers.length}</p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="update-seats">Total Seats</Label>
                    <NumberInput
                      id="update-seats"
                      min={selectedRide.passengers.length}
                      max={10}
                      value={updateData.totalSeats}
                      onChange={(value) => setUpdateData({ ...updateData, totalSeats: value })}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum: {selectedRide.passengers.length} (number of assigned passengers)
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="update-address">Pickup Address</Label>
                    <Input
                      id="update-address"
                      value={updateData.pickupAddress}
                      onChange={(e) => setUpdateData({ ...updateData, pickupAddress: e.target.value })}
                      placeholder="123 Main St, City"
                      className="w-full"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="update-pickupTime">Pickup Time (Optional)</Label>
                    <Input
                      id="update-pickupTime"
                      type="time"
                      value={updateData.pickupTime}
                      onChange={(e) => setUpdateData({ ...updateData, pickupTime: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="update-notes">Notes (Optional)</Label>
                    <Input
                      id="update-notes"
                      value={updateData.notes}
                      onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                      placeholder="Additional notes..."
                      className="w-full"
                    />
                  </div>
                </div>
              )}
              <DialogFooter className="px-1 sm:px-0 gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setIsUpdateOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateRide} 
                  disabled={!updateData.pickupAddress || !updateData.totalSeats || updateData.totalSeats < (selectedRide?.passengers.length || 0)} 
                  className="w-full sm:w-auto"
                >
                  Update Ride
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 w-full max-w-full">
          {rides.length === 0 ? (
            <Card className="col-span-full w-full">
              <CardContent className="py-8 text-center text-muted-foreground">
                {allRides.length === 0 
                  ? 'No rides created yet. Create your first ride to get started!'
                  : isAdmin && showAllRides
                    ? 'No rides found. Create a ride to get started!'
                    : `No rides found for ${format(new Date(selectedDate), 'MMM d, yyyy')}. Try selecting a different date.`
                }
              </CardContent>
            </Card>
          ) : (
            rides.map((ride) => (
              <Card key={ride.id} className="w-full max-w-full overflow-hidden min-w-0">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex justify-between items-start gap-2 min-w-0">
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <CardTitle className="text-base sm:text-lg break-words">
                        {format(new Date(ride.date), 'MMM d, yyyy')}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm break-words">
                        {ride.direction === 'to-school' 
                          ? 'To university' 
                          : ride.direction === 'to-train-station'
                          ? 'To train station'
                          : 'From university'}
                      </CardDescription>
                      {isAdmin && ride.driverId !== user.id && (
                        <CardDescription className="text-xs text-muted-foreground mt-1 break-words">
                          Driver: {ride.driverName}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {ride.driverId === user.id && (
                        <>
                          <AddToCalendarButton
                            ride={ride}
                            driverName={ride.driverName}
                            className="h-8 w-8 sm:h-10 sm:w-auto"
                          />
                          <ShareButton
                            ride={ride}
                            driverName={ride.driverName}
                            className="h-8 w-8 sm:h-10 sm:w-auto"
                          />
                        </>
                      )}
                      {ride.driverId === user.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openUpdateDialog(ride)}
                          className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                          title="Update ride"
                        >
                          <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                      {(isAdmin || ride.driverId === user.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRide(ride.id, ride.driverId)}
                          className="text-destructive flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                          title="Delete ride"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0 overflow-hidden">
                  <div className="flex items-center gap-2 text-sm min-w-0">
                    <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="break-words">
                      {ride.passengers.length} / {ride.totalSeats} seats filled
                    </span>
                  </div>
                  <div className="text-sm min-w-0 overflow-hidden">
                    <p className="font-medium break-words">Pickup:</p>
                    <p className="text-muted-foreground break-words break-all">{ride.pickupAddress}</p>
                  </div>
                  {ride.notes && (
                    <div className="text-sm min-w-0 overflow-hidden">
                      <p className="font-medium break-words">Notes:</p>
                      <p className="text-muted-foreground break-words break-all">{ride.notes}</p>
                    </div>
                  )}
                  {ride.passengers.length > 0 && (
                    <div className="text-sm pt-2 border-t min-w-0 overflow-hidden">
                      <p className="font-medium mb-2 break-words">Passengers:</p>
                      <ul className="space-y-2">
                        {ride.passengers.map((passenger) => {
                          const parent = usersMap[passenger.parentId]
                          const parentPhone = parent?.phone
                          // Get parents from child if available, otherwise just show the assigning parent
                          const childParents = passenger.child?.parents || []
                          const allParents = childParents.length > 0 
                            ? childParents 
                            : parent 
                              ? [{ id: parent.id, name: parent.name, phone: parent.phone }]
                              : []
                          
                          return (
                            <li key={passenger.id} className="text-muted-foreground min-w-0 overflow-hidden">
                              <div className="font-medium break-words">{passenger.childName}</div>
                              {allParents.length > 0 && (
                                <div className="text-xs mt-1 space-y-1">
                                  {allParents.map((p) => (
                                    <div key={p.id} className="break-words">
                                      <span className="text-muted-foreground">הורה: </span>
                                      {p.phone ? (
                                        <a 
                                          href={`tel:${p.phone}`} 
                                          className="hover:text-foreground hover:underline"
                                          title={p.phone}
                                        >
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
                                <div className="text-xs break-words">
                                  הורה:{' '}
                                  {parentPhone ? (
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
                              <div className="text-xs mt-1 flex items-start gap-1 text-primary min-w-0">
                                <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                <span className="break-words break-all">Home pickup: {passenger.pickupAddress}</span>
                              </div>
                            )}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

