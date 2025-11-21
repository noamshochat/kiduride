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
import { Plus, Trash2, Users, MapPin, Calendar } from 'lucide-react'
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
  const [usersMap, setUsersMap] = useState<Record<string, User>>({})
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    direction: 'to-school' as 'to-school' | 'from-school',
    totalSeats: 0,
    pickupAddress: '',
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
      console.log('Checking admin status for user:', user.id, user.email)
      adminStatus = await supabaseDb.checkIsAdmin(user.id)
      console.log('Admin status result:', adminStatus)
      setIsAdmin(adminStatus)

      // Load rides based on admin status
      if (adminStatus) {
        // Admin: Load all rides from all drivers
        console.log('Loading all rides as admin...')
        const loadedRides = await supabaseDb.getAllRidesAdmin(user.id)
        console.log('Loaded admin rides:', loadedRides.length, 'rides')
        console.log('Admin rides details:', loadedRides.map(r => ({ id: r.id, date: r.date, driver: r.driverName })))
        setAllRides(loadedRides)
      } else {
        // Regular user: Load only their own rides
        console.log('Loading user rides (not admin)...')
        const driverRides = await supabaseDb.getRidesByDriver(user.id)
        console.log('Loaded user rides:', driverRides.length, 'rides')
        setAllRides(driverRides)
      }
    } catch (error: any) {
      console.error('Error loading rides:', error)
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        adminStatus,
        userId: user.id
      })
      // If we confirmed admin status but API failed, don't fall back to user rides
      // Show empty state instead so user knows something is wrong
      if (adminStatus) {
        console.error('Admin API failed, but admin status confirmed. Not falling back to user rides.')
        console.error('This might indicate an API route issue on Vercel. Check server logs.')
        setAllRides([])
      } else {
        // If not admin or admin check failed, try to load user's own rides as fallback
        try {
          console.log('Falling back to user rides (not admin)')
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
    console.log('Filtering rides - Total:', allRides.length, 'Filtered by date:', dateFiltered.length, 'Date:', selectedDate, 'IsAdmin:', isAdmin)
    setRides(dateFiltered)
  }, [allRides, selectedDate, isAdmin])

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
      await supabaseDb.createRide({
        driverId: user.id,
        driverName: user.name,
        date: formData.date,
        direction: formData.direction,
        availableSeats: formData.totalSeats,
        totalSeats: formData.totalSeats,
        pickupAddress: formData.pickupAddress,
        notes: formData.notes || undefined,
      })

      // Reload rides from storage to ensure consistency
      await loadRides()
      setIsCreateOpen(false)
      setFormData({
        date: new Date().toISOString().split('T')[0],
        direction: 'to-school',
        totalSeats: 0,
        pickupAddress: '',
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

  const handleDeleteRide = async (rideId: string) => {
    if (confirm('Are you sure you want to delete this ride?')) {
      try {
        const success = await supabaseDb.deleteRide(rideId)
        if (success) {
          await loadRides()
        } else {
          alert('Failed to delete ride. Please try again.')
        }
      } catch (error: any) {
        if (error?.code === 'GOOGLE_SHEETS_NOT_CONFIGURED') {
          alert('Google Sheets is not configured. Please set up GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_SERVICE_ACCOUNT_PATH in your environment variables to delete rides.')
        } else {
          alert('Failed to delete ride. Please try again.')
        }
        console.error(error)
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
                    onValueChange={(value: 'to-school' | 'from-school') =>
                      setFormData({ ...formData, direction: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="to-school">To university</SelectItem>
                      <SelectItem value="from-school">From university</SelectItem>
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
                        {ride.direction === 'to-school' ? 'To university' : 'From university'}
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRide(ride.id)}
                        className="text-destructive flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
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

