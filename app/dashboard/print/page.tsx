'use client'

import { useAuth } from '@/components/auth-provider'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Ride, User } from '@/lib/demo-data'
import { supabaseDb } from '@/lib/supabase-db'
import { Button } from '@/components/ui/button'
import { format, parseISO } from 'date-fns'
import { Printer, ArrowLeft, ArrowRight, Users, MapPin, Phone, Clock, Home } from 'lucide-react'
import { useActivity } from '@/components/activity-provider'
import { getDirectionLabel, getCurrentWeekDates } from '@/lib/utils'

export default function PrintDashboardPage() {
  const { user } = useAuth()
  const { activity } = useActivity()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get date range from query params or use current week
  const currentWeek = getCurrentWeekDates()
  const startDateParam = searchParams.get('startDate') || currentWeek.startDate
  const endDateParam = searchParams.get('endDate') || currentWeek.endDate
  
  const [startDate] = useState(startDateParam)
  const [endDate] = useState(endDateParam)
  const [rides, setRides] = useState<Ride[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [usersMap, setUsersMap] = useState<Record<string, User>>({})

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

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
        return a.direction.localeCompare(b.direction)
      })
      
      setRides(filtered)
    } catch (error) {
      console.error('Error loading rides:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
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
    <div className="min-h-screen bg-white">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          
          body {
            background: white !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-page {
            page-break-after: always;
          }
          
          .print-page:last-child {
            page-break-after: auto;
          }
          
          .ride-box {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
        
        @media screen {
          .print-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            background: white;
          }
        }
      `,
        }}
      />
        {/* Header - Hidden when printing */}
        <div className="no-print bg-gradient-to-br from-blue-50 to-indigo-100 p-4 border-b">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        <div className="print-container">
          {/* Title */}
          <div className="mb-6 text-center">
            <h1 className={`text-3xl font-bold ${activity === 'tennis' ? 'text-green-600' : 'text-primary'}`}>
              {activity === 'tennis' ? 'TennisRide' : 'KiduRide'} - Weekly Summary
            </h1>
            <p className="text-muted-foreground mt-2">
              {format(parseISO(startDate), 'MMM d')} - {format(parseISO(endDate), 'MMM d, yyyy')}
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8 text-lg text-muted-foreground">
              Loading rides...
            </div>
          )}

          {/* No Rides */}
          {!isLoading && rides.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No rides available for the selected date range
            </div>
          )}

          {/* Rides by Date - Print Layout */}
          {!isLoading && rides.length > 0 && (
            <div className="space-y-6">
              {sortedDates.map((date, dateIndex) => (
                <div key={date} className="print-page">
                  <h2 className="text-xl font-semibold mb-4 pb-2 border-b">
                    {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                  </h2>
                  
                  {/* Grid layout: 2 columns for A4 */}
                  <div className="grid grid-cols-2 gap-3">
                    {ridesByDate[date].map((ride) => {
                      const driver = usersMap[ride.driverId]
                      const isFull = ride.availableSeats <= 0

                      return (
                        <div
                          key={ride.id}
                          className="ride-box border border-gray-300 rounded p-2.5 bg-white"
                        >
                          {/* Direction Header */}
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                            {(ride.direction === 'from-school' || ride.direction === 'back-home') ? (
                              <ArrowLeft className="h-4 w-4 text-gray-600" />
                            ) : (
                              <ArrowRight className="h-4 w-4 text-gray-600" />
                            )}
                            <h3 className="text-sm font-semibold flex-1">
                              {getDirectionLabel(ride.direction)}
                            </h3>
                            {isFull && (
                              <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                                Full
                              </span>
                            )}
                          </div>

                          {/* Driver */}
                          <div className="mb-2 text-xs">
                            <div className="font-medium text-gray-700">Driver:</div>
                            <div className="text-gray-900">{ride.driverName}</div>
                            {driver?.phone && (
                              <div className="text-gray-600 flex items-center gap-1 mt-0.5">
                                <Phone className="h-3 w-3" />
                                {driver.phone}
                              </div>
                            )}
                          </div>

                          {/* Pickup Time */}
                          {ride.pickupTime && (
                            <div className="mb-2 text-xs">
                              <div className="font-medium text-gray-700 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Pickup Time:
                              </div>
                              <div className="text-gray-900">{ride.pickupTime}</div>
                            </div>
                          )}

                          {/* Pickup Location */}
                          <div className="mb-2 text-xs">
                            <div className="font-medium text-gray-700 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Pickup:
                            </div>
                            <div className="text-gray-900">{ride.pickupAddress}</div>
                          </div>

                          {/* Seats */}
                          <div className="mb-2 text-xs">
                            <div className="font-medium text-gray-700 flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Seats:
                            </div>
                            <div className="text-gray-900">
                              {ride.passengers.length} / {ride.totalSeats}
                              {ride.availableSeats > 0 && (
                                <span className="text-green-600 ml-1">
                                  ({ride.availableSeats} available)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Passengers */}
                          {ride.passengers.length > 0 && (
                            <div className="mt-3 pt-2 border-t">
                              <div className="font-medium text-gray-700 text-xs mb-1">
                                Passengers ({ride.passengers.length}):
                              </div>
                              <div className="space-y-1">
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
                                    <div key={passenger.id} className="text-xs bg-gray-50 p-1.5 rounded">
                                      <div className="font-medium text-gray-900">{passenger.childName}</div>
                                      {allParents.length > 0 && (
                                        <div className="text-gray-600 mt-0.5">
                                          {allParents.map((p, idx) => (
                                            <span key={p.id}>
                                              {idx > 0 && ', '}
                                              {p.name}
                                              {p.phone && ` (${p.phone})`}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      {allParents.length === 0 && parentPhone && (
                                        <div className="text-gray-600 mt-0.5">
                                          {passenger.parentName} ({parentPhone})
                                        </div>
                                      )}
                                      {passenger.pickupFromHome && passenger.pickupAddress && (
                                        <div className="text-primary text-xs mt-0.5 flex items-start gap-1">
                                          <Home className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                          <span>Home: {passenger.pickupAddress}</span>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {ride.notes && (
                            <div className="mt-2 pt-2 border-t text-xs">
                              <div className="font-medium text-gray-700">Notes:</div>
                              <div className="text-gray-900">{ride.notes}</div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  )
}

