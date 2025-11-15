'use client'

import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { demoData, Ride } from '@/lib/demo-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
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
    totalSeats: 4,
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
      const driverRides = await demoData.getRidesByDriver(user.id)
      setRides(driverRides)
    }
  }

  const handleCreateRide = async () => {
    if (!user) return

    try {
      await demoData.createRide({
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
        totalSeats: 4,
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
        const success = await demoData.deleteRide(rideId)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Driver Dashboard</h1>
          <p className="text-muted-foreground">Manage your rides and passengers</p>
        </div>

        <div className="mb-6">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create New Ride
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Ride</DialogTitle>
                <DialogDescription>
                  Fill in the details for your ride. Seats will be assigned on a first-come, first-served basis.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="to-school">To School</SelectItem>
                      <SelectItem value="from-school">From School</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="seats">Total Seats</Label>
                  <Input
                    id="seats"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.totalSeats}
                    onChange={(e) => setFormData({ ...formData, totalSeats: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Pickup Address</Label>
                  <Input
                    id="address"
                    value={formData.pickupAddress}
                    onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                    placeholder="123 Main St, City"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional information..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRide} disabled={!formData.pickupAddress}>
                  Create Ride
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rides.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center text-muted-foreground">
                No rides created yet. Create your first ride to get started!
              </CardContent>
            </Card>
          ) : (
            rides.map((ride) => (
              <Card key={ride.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {format(new Date(ride.date), 'MMM d, yyyy')}
                      </CardTitle>
                      <CardDescription>
                        {ride.direction === 'to-school' ? 'To School' : 'From School'}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRide(ride.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {ride.passengers.length} / {ride.totalSeats} seats filled
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Pickup:</p>
                    <p className="text-muted-foreground">{ride.pickupAddress}</p>
                  </div>
                  {ride.notes && (
                    <div className="text-sm">
                      <p className="font-medium">Notes:</p>
                      <p className="text-muted-foreground">{ride.notes}</p>
                    </div>
                  )}
                  {ride.passengers.length > 0 && (
                    <div className="text-sm pt-2 border-t">
                      <p className="font-medium mb-2">Passengers:</p>
                      <ul className="space-y-2">
                        {ride.passengers.map((passenger) => (
                          <li key={passenger.id} className="text-muted-foreground">
                            <div className="font-medium">{passenger.childName}</div>
                            <div className="text-xs">{passenger.parentName}</div>
                            {passenger.pickupFromHome && passenger.pickupAddress && (
                              <div className="text-xs mt-1 flex items-center gap-1 text-primary">
                                <MapPin className="h-3 w-3" />
                                <span>Home pickup: {passenger.pickupAddress}</span>
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

