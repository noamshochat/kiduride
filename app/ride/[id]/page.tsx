'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Ride } from '@/lib/demo-data'
import { supabaseDb } from '@/lib/supabase-db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Users, MapPin, ArrowRight, ArrowLeft, Phone, Clock, Home } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { useAuth } from '@/components/auth-provider'
import { DirectionLabel } from '@/components/direction-label'

export default function RideDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [ride, setRide] = useState<Ride | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [usersMap, setUsersMap] = useState<Record<string, any>>({})

  useEffect(() => {
    const loadRide = async () => {
      if (!params.id || typeof params.id !== 'string') {
        setIsLoading(false)
        return
      }

      try {
        const foundRide = await supabaseDb.getRideById(params.id)
        if (foundRide) {
          setRide(foundRide)
          const users = await supabaseDb.getUsers()
          const map: Record<string, any> = {}
          users.forEach(u => { map[u.id] = u })
          setUsersMap(map)
        }
      } catch (error) {
        console.error('Error loading ride:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadRide()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading ride details...</p>
        </div>
      </div>
    )
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-lg mx-auto bg-white/90 text-center">
            <CardContent className="py-12">
              <p className="font-semibold text-lg mb-1">Ride Not Found</p>
              <p className="text-muted-foreground text-sm mb-6">This ride doesn't exist or has been removed.</p>
              <Button onClick={() => router.push('/parent')}>Browse Available Rides</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const isToRide = ride.direction !== 'from-school' && ride.direction !== 'back-home'
  const isFull = ride.availableSeats <= 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      <Navigation />
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Header card */}
          <Card className="bg-white/90 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground font-medium mb-1">
                    {format(new Date(ride.date), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${isToRide ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                      {isToRide ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}
                      <DirectionLabel direction={ride.direction} />
                    </span>
                    {isFull ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">Full</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">{ride.availableSeats} seats open</span>
                    )}
                  </div>
                </div>
              </div>

              {ride.pickupTime && (
                <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Pickup at {ride.pickupTime}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info card */}
          <Card className="bg-white/90 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Driver</p>
                  <p className="font-medium mt-0.5">{ride.driverName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Pickup Location</p>
                  <p className="font-medium mt-0.5">{ride.pickupAddress}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Seats</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: ride.totalSeats }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2.5 w-2.5 rounded-full border ${i < ride.passengers.length ? (isToRide ? 'bg-green-500 border-green-500' : 'bg-purple-500 border-purple-500') : 'bg-white border-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">{ride.passengers.length} / {ride.totalSeats} filled</span>
                  </div>
                </div>
              </div>

              {ride.notes && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{ride.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Passengers card */}
          {ride.passengers.length > 0 && (
            <Card className="bg-white/90 shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-3">
                  Passengers ({ride.passengers.length})
                </p>
                <div className="space-y-2">
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
                      <div key={passenger.id} className="flex items-start gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0 ${isToRide ? 'bg-green-500' : 'bg-purple-500'}`}>
                          {passenger.childName.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{passenger.childName}</p>
                          {allParents.length > 0 && (
                            <div className="space-y-0.5 mt-0.5">
                              {allParents.map((p) => (
                                <div key={p.id} className="text-xs text-muted-foreground">
                                  {p.phone ? (
                                    <a href={`tel:${p.phone}`} className="hover:text-primary hover:underline inline-flex items-center gap-1">
                                      <Phone className="h-3 w-3" />{p.name}
                                    </a>
                                  ) : (
                                    <span>{p.name}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {allParents.length === 0 && parentPhone && (
                            <a href={`tel:${parentPhone}`} className="text-xs text-muted-foreground hover:text-primary hover:underline inline-flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3" />{passenger.parentName}
                            </a>
                          )}
                          {passenger.pickupFromHome && passenger.pickupAddress && (
                            <div className="flex items-center gap-1 text-xs text-primary mt-1">
                              <Home className="h-3 w-3 flex-shrink-0" />
                              {passenger.pickupAddress}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 pb-4">
            {user ? (
              <>
                <Button onClick={() => router.push('/parent')} variant="outline" className="flex-1">
                  Browse More Rides
                </Button>
                {ride.driverId === user.id && (
                  <Button onClick={() => router.push('/driver')} className="flex-1">
                    Back to My Rides
                  </Button>
                )}
              </>
            ) : (
              <Button onClick={() => router.push('/')} className="w-full">
                Sign In to Join Rides
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
