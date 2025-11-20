'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Ride } from '@/lib/demo-data'
import { supabaseDb } from '@/lib/supabase-db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Users, MapPin, Calendar, ArrowRight, ArrowLeft, Phone } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { useAuth } from '@/components/auth-provider'

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
          
          // Load users map for parent phone numbers
          const users = await supabaseDb.getUsers()
          const map: Record<string, any> = {}
          users.forEach(u => {
            map[u.id] = u
          })
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-lg">Loading ride details...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Ride Not Found</CardTitle>
              <CardDescription>The ride you're looking for doesn't exist or has been removed.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/parent')} className="w-full sm:w-auto">
                Browse Available Rides
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    {format(new Date(ride.date), 'EEEE, MMMM d, yyyy')}
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    {ride.direction === 'to-school' ? (
                      <span className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4" />
                        To university
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        From university
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Driver</p>
                    <p className="text-muted-foreground">{ride.driverName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Pickup Location</p>
                    <p className="text-muted-foreground">{ride.pickupAddress}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Seats</p>
                    <p className="text-muted-foreground">
                      {ride.passengers.length} / {ride.totalSeats} seats filled
                      {ride.availableSeats === 0 && (
                        <span className="text-destructive ml-2">(Full)</span>
                      )}
                    </p>
                  </div>
                </div>

                {ride.notes && (
                  <div>
                    <p className="font-medium mb-2">Notes</p>
                    <p className="text-muted-foreground">{ride.notes}</p>
                  </div>
                )}
              </div>

              {ride.passengers.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="font-medium mb-4">Passengers ({ride.passengers.length})</p>
                  <ul className="space-y-3">
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
                        <li key={passenger.id} className="bg-muted/50 p-3 rounded-md">
                          <div className="font-medium">{passenger.childName}</div>
                          {allParents.length > 0 && (
                            <div className="text-sm mt-2 space-y-1">
                              {allParents.map((p) => (
                                <div key={p.id} className="text-muted-foreground">
                                  <span>הורה: </span>
                                  {p.phone ? (
                                    <a 
                                      href={`tel:${p.phone}`} 
                                      className="hover:text-foreground hover:underline flex items-center gap-1"
                                      title={p.phone}
                                    >
                                      <Phone className="h-3 w-3" />
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
                            <div className="text-sm text-muted-foreground mt-1">
                              הורה: {parentPhone ? (
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
                            <div className="text-xs mt-2 flex items-start gap-1 text-primary">
                              <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                              <span>Home pickup: {passenger.pickupAddress}</span>
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t flex gap-3">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

