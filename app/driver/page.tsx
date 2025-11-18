'use client'

import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Ride } from '@/lib/demo-data'
import { supabaseDb } from '@/lib/supabase-db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { NumberInput } from '@/components/ui/number-input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { Plus, Trash2, Users, MapPin } from 'lucide-react'
import { Navigation } from '@/components/navigation'

export default function DriverPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [rides, setRides] = useState<Ride[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    direction: 'to-school' as 'to-school' | 'from-school',
    totalSeats: 0,
    pickupAddress: '',
    notes: '',
  })

  useEffect(() => {
    if (user) {
      loadRides()
    } else if (!user) {
      router.push('/')
    }
  }, [user, router])

  const loadRides = async () => {
    if (user) {
      const driverRides = await supabaseDb.getRidesByDriver(user.id)
      setRides(driverRides)
    }
  }

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-x-hidden">
      <Navigation />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-full overflow-x-hidden">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary break-words">Driver Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground break-words">Manage your rides and passengers</p>
        </div>

        <div className="mb-4 sm:mb-6">
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

        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 w-full">
          {rides.length === 0 ? (
            <Card className="col-span-full w-full">
              <CardContent className="py-8 text-center text-muted-foreground">
                No rides created yet. Create your first ride to get started!
              </CardContent>
            </Card>
          ) : (
            rides.map((ride) => (
              <Card key={ride.id} className="w-full max-w-full overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex justify-between items-start gap-2 min-w-0">
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <CardTitle className="text-base sm:text-lg break-words">
                        {format(new Date(ride.date), 'MMM d, yyyy')}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm break-words">
                        {ride.direction === 'to-school' ? 'To university' : 'From university'}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRide(ride.id)}
                      className="text-destructive flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
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
                        {ride.passengers.map((passenger) => (
                          <li key={passenger.id} className="text-muted-foreground min-w-0 overflow-hidden">
                            <div className="font-medium break-words">{passenger.childName}</div>
                            <div className="text-xs break-words">{passenger.parentName}</div>
                            {passenger.pickupFromHome && passenger.pickupAddress && (
                              <div className="text-xs mt-1 flex items-start gap-1 text-primary min-w-0">
                                <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                <span className="break-words break-all">Home pickup: {passenger.pickupAddress}</span>
                              </div>
                            )}
                          </li>
                        ))}
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

