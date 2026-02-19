'use client'

import { useAuth } from '@/components/auth-provider'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { Ride, User } from '@/lib/demo-data'
import { supabaseDb } from '@/lib/supabase-db'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { NumberInput } from '@/components/ui/number-input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { Plus, Trash2, Users, MapPin, Calendar, Pencil, Table, List, Train, ArrowRight, ArrowLeft, Clock, FileText, Phone, Home } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { ShareButton } from '@/components/share-button'
import { AddToCalendarButton } from '@/components/add-to-calendar-button'
import { Checkbox } from '@/components/ui/checkbox'
import { useActivity } from '@/components/activity-provider'
import { getCurrentMonthDates } from '@/lib/utils'
import { DirectionLabel } from '@/components/direction-label'
import React from 'react'

type RideGroup = {
  toRides: Ride[]
  fromRides: Ride[]
}

// Helper function to generate all Thursdays in the date range
const getAllThursdays = (start: string, end: string): string[] => {
  const thursdays: string[] = []
  const startDate = new Date(start)
  const endDate = new Date(end)
  
  // Find the first Thursday on or after start date
  let currentDate = new Date(startDate)
  const dayOfWeek = currentDate.getDay() // 0 = Sunday, 4 = Thursday
  const daysUntilThursday = dayOfWeek <= 4 ? (4 - dayOfWeek) : (11 - dayOfWeek)
  currentDate.setDate(currentDate.getDate() + daysUntilThursday)
  
  // Add all Thursdays until end date
  while (currentDate <= endDate) {
    thursdays.push(currentDate.toISOString().split('T')[0])
    currentDate.setDate(currentDate.getDate() + 7) // Next Thursday
  }
  
  return thursdays
}

// Full Scheduled Summary View Component (like Monthly Summary)
function FullScheduledSummaryView({ rides, usersMap, activity, user, isAdmin, onDeleteRide }: { rides: Ride[], usersMap: Record<string, User>, activity: string | null, user: User | null, isAdmin: boolean, onDeleteRide: (rideId: string, rideDriverId?: string) => Promise<void> }) {
  // Group rides by date
  const ridesByDate: Record<string, Ride[]> = {}
  rides.forEach(ride => {
    if (!ridesByDate[ride.date]) {
      ridesByDate[ride.date] = []
    }
    ridesByDate[ride.date].push(ride)
  })

  const sortedDates = Object.keys(ridesByDate).sort()

  if (rides.length === 0) {
    return (
      <Card className="bg-white/80">
        <CardContent className="py-12 text-center text-muted-foreground">
          No scheduled rides found.
        </CardContent>
      </Card>
    )
  }

  return (
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
                <Card key={ride.id} className={`border-l-4 bg-white/90 shadow-sm hover:shadow-md transition-shadow ${isToRide ? 'border-l-green-500' : 'border-l-purple-500'}`}>
                  <CardContent className="p-4">

                    {/* Top bar: direction badge + time + delete */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isToRide ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                          {isToRide ? <ArrowRight className="h-3 w-3" /> : <ArrowLeft className="h-3 w-3" />}
                          <DirectionLabel direction={ride.direction} />
                        </span>
                        {isFull ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">Full</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">{ride.availableSeats} open</span>
                        )}
                        {ride.pickupTime && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />{ride.pickupTime}
                          </span>
                        )}
                      </div>
                      {(isAdmin || ride.driverId === user?.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteRide(ride.id, ride.driverId)}
                          className="text-destructive flex-shrink-0 h-7 w-7"
                          title="Delete ride"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
                        <p className="text-sm text-muted-foreground">{ride.pickupAddress}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {Array.from({ length: ride.totalSeats }).map((_, i) => (
                            <div key={i} className={`h-2.5 w-2.5 rounded-full border ${i < ride.passengers.length ? (isToRide ? 'bg-green-500 border-green-500' : 'bg-purple-500 border-purple-500') : 'bg-white border-gray-300'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{ride.passengers.length}/{ride.totalSeats}</span>
                      </div>
                    </div>

                    {ride.notes && (
                      <div className="flex items-start gap-2 mb-3 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-muted-foreground">{ride.notes}</p>
                      </div>
                    )}

                    {/* Passengers */}
                    {ride.passengers.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Passengers ({ride.passengers.length})
                        </p>
                        <div className="space-y-1.5">
                          {ride.passengers.map((passenger) => {
                            const parent = usersMap[passenger.parentId]
                            const childParents = passenger.child?.parents || []
                            const allParents = childParents.length > 0
                              ? childParents
                              : parent ? [{ id: parent.id, name: parent.name, phone: parent.phone }] : []

                            return (
                              <div key={passenger.id} className="flex items-start gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
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
                                  {passenger.pickupFromHome && passenger.pickupAddress && (
                                    <div className="flex items-center gap-1 text-xs text-primary mt-0.5">
                                      <Home className="h-3 w-3 flex-shrink-0" />{passenger.pickupAddress}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// Full Scheduled Table View Component (like Calendar View)
function FullScheduledTableView({ rides, activity }: { rides: Ride[], activity: string | null }) {
  // Group rides by date and separate TO and FROM
  const ridesByDate: Record<string, RideGroup> = {}
  rides.forEach(ride => {
    if (!ridesByDate[ride.date]) {
      ridesByDate[ride.date] = { toRides: [], fromRides: [] }
    }
    
    // Categorize rides as TO or FROM
    const isToRide = ride.direction === 'to-school' || 
                     ride.direction === 'to-tennis-center' || 
                     ride.direction === 'to-train-station'
    
    if (isToRide) {
      ridesByDate[ride.date].toRides.push(ride)
    } else {
      ridesByDate[ride.date].fromRides.push(ride)
    }
  })

  // Get date range from rides
  const dates = Object.keys(ridesByDate).sort()
  const startDate = dates.length > 0 ? dates[0] : new Date().toISOString().split('T')[0]
  const endDate = dates.length > 0 ? dates[dates.length - 1] : new Date().toISOString().split('T')[0]
  
  // Get all Thursdays in the date range
  const allThursdays = getAllThursdays(startDate, endDate)
  
  // Merge Thursdays with dates that have rides
  const allDatesSet = new Set([...allThursdays, ...dates])
  const sortedDates = Array.from(allDatesSet).sort()

  // Helper function to determine if date should be red
  const isRedDate = (date: string, index: number) => {
    return index % 3 === 2
  }

  if (rides.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No scheduled rides found.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Header */}
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2 text-left font-semibold">Date</th>
                <th colSpan={4} className="border border-gray-300 p-2 text-center font-semibold bg-green-100">
                  TO
                </th>
                <th colSpan={6} className="border border-gray-300 p-2 text-center font-semibold bg-purple-100">
                  FROM
                </th>
              </tr>
              <tr>
                <th className="border border-gray-300 p-2 bg-gray-200"></th>
                <th className="border border-gray-300 p-2 bg-green-100 font-medium">Name</th>
                <th className="border border-gray-300 p-2 bg-green-100 font-medium">Car seats</th>
                <th className="border border-gray-300 p-2 bg-green-100 font-medium">Name</th>
                <th className="border border-gray-300 p-2 bg-green-100 font-medium">Car seats</th>
                <th className="border border-gray-300 p-2 bg-purple-100 font-medium">Name</th>
                <th className="border border-gray-300 p-2 bg-purple-100 font-medium">Car seats</th>
                <th className="border border-gray-300 p-2 bg-purple-100 font-medium">Name</th>
                <th className="border border-gray-300 p-2 bg-purple-100 font-medium">Car seats</th>
                <th className="border border-gray-300 p-2 bg-purple-100 font-medium">Name</th>
                <th className="border border-gray-300 p-2 bg-purple-100 font-medium">Car seats</th>
              </tr>
            </thead>
            <tbody>
              {sortedDates.map((date, index) => {
                const dateRides = ridesByDate[date] || { toRides: [], fromRides: [] }
                const { toRides, fromRides } = dateRides
                const dateBgColor = isRedDate(date, index) ? 'bg-red-100' : 'bg-white'
                
                return (
                  <tr key={date}>
                    {/* Date Column */}
                    <td className={`border border-gray-300 p-2 font-medium ${dateBgColor}`}>
                      {format(new Date(date), 'dd/MM/yyyy')}
                    </td>
                    
                    {/* TO Section - Up to 2 rides */}
                    {[0, 1].map((i) => (
                      <React.Fragment key={i}>
                        <td className={`border border-gray-300 p-2 bg-green-50 ${toRides.length > i ? '' : 'text-gray-400'}`}>
                          {toRides.length > i ? (
                            <div className="flex items-center gap-1">
                              <span>{toRides[i].driverName}</span>
                              {toRides[i].direction === 'to-train-station' && (
                                <Train className="h-3 w-3 text-gray-600" />
                              )}
                            </div>
                          ) : ''}
                        </td>
                        <td className={`border border-gray-300 p-2 bg-green-50 text-center ${toRides.length > i ? '' : 'text-gray-400'}`}>
                          {toRides.length > i ? (() => {
                            const ride = toRides[i]
                            const takenSeats = ride.totalSeats - ride.availableSeats
                            return `${ride.totalSeats}/${takenSeats}`
                          })() : ''}
                        </td>
                      </React.Fragment>
                    ))}
                    
                    {/* FROM Section - Up to 3 rides */}
                    {[0, 1, 2].map((i) => (
                      <React.Fragment key={i}>
                        <td className={`border border-gray-300 p-2 bg-purple-50 ${fromRides.length > i ? '' : 'text-gray-400'}`}>
                          {fromRides.length > i ? fromRides[i].driverName : ''}
                        </td>
                        <td className={`border border-gray-300 p-2 bg-purple-50 text-center ${fromRides.length > i ? '' : 'text-gray-400'}`}>
                          {fromRides.length > i ? (() => {
                            const ride = fromRides[i]
                            const takenSeats = ride.totalSeats - ride.availableSeats
                            return `${ride.totalSeats}/${takenSeats}`
                          })() : ''}
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function DriverPageContent() {
  const { user, logout } = useAuth()
  const { activity } = useActivity()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedDate, setSelectedDate] = useState(() => {
    const dateParam = searchParams.get('date')
    return dateParam || new Date().toISOString().split('T')[0]
  })
  const [showAllRides, setShowAllRides] = useState(false) // Admin: show all rides or filter by date
  const [showFullScheduled, setShowFullScheduled] = useState(false) // Show all driver's scheduled rides
  const [viewMode, setViewMode] = useState<'summary' | 'table'>('summary') // View mode: summary or table
  const [allRides, setAllRides] = useState<Ride[]>([]) // Store all rides
  const [rides, setRides] = useState<Ride[]>([]) // Filtered rides by date
  const [fullScheduledRides, setFullScheduledRides] = useState<Ride[]>([]) // All driver's rides for full scheduled view
  const currentMonth = getCurrentMonthDates()
  const [fullScheduledStartDate, setFullScheduledStartDate] = useState(currentMonth.startDate)
  const [fullScheduledEndDate, setFullScheduledEndDate] = useState(currentMonth.endDate)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)
  const [usersMap, setUsersMap] = useState<Record<string, User>>({})
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false)
  const [whatsAppTemplateSid, setWhatsAppTemplateSid] = useState('')
  const [whatsAppContentVariables, setWhatsAppContentVariables] = useState('')
  const [formData, setFormData] = useState(() => {
    const dateParam = searchParams.get('date')
    const directionParam = searchParams.get('direction') as 'to-school' | 'from-school' | 'to-train-station' | 'to-tennis-center' | 'back-home' | null
    
    // Get default direction based on activity
    let defaultDirection: 'to-school' | 'from-school' | 'to-train-station' | 'to-tennis-center' | 'back-home' = 'to-school'
    if (activity === 'tennis') {
      defaultDirection = 'to-tennis-center'
    }
    
    return {
      date: dateParam || new Date().toISOString().split('T')[0],
      direction: directionParam || defaultDirection,
      totalSeats: 0,
      pickupAddress: '',
      pickupTime: '',
      notes: '',
    }
  })

  // Get valid directions based on activity
  const getValidDirections = () => {
    if (activity === 'tennis') {
      return [
        { value: 'to-tennis-center' as const, label: 'To Tennis Center' },
        { value: 'back-home' as const, label: 'Back Home' },
      ]
    } else {
      // Default to kidu directions
      return [
        { value: 'to-school' as const, label: 'To university' },
        { value: 'from-school' as const, label: 'From university' },
        { value: 'to-train-station' as const, label: 'To train station' },
      ]
    }
  }


  // Initialize form direction based on activity
  useEffect(() => {
    if (activity === 'tennis') {
      setFormData(prev => ({ ...prev, direction: 'to-tennis-center' }))
    } else {
      setFormData(prev => ({ ...prev, direction: 'to-school' }))
    }
  }, [activity])
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

  // Handle query parameters - open create dialog if date and direction are provided
  useEffect(() => {
    const dateParam = searchParams.get('date')
    const directionParam = searchParams.get('direction')
    if (dateParam && directionParam && user) {
      // Get default direction based on activity if not provided
      let defaultDirection: 'to-school' | 'from-school' | 'to-train-station' | 'to-tennis-center' | 'back-home' = 'to-school'
      if (activity === 'tennis') {
        defaultDirection = 'to-tennis-center'
      }
      
      // Update form data with query params
      setFormData(prev => ({
        ...prev,
        date: dateParam,
        direction: (directionParam as any) || defaultDirection,
      }))
      // Set selected date to match
      setSelectedDate(dateParam)
      // Open create dialog
      setIsCreateOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user, activity])

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

  // Filter rides by selected date and activity (date filter always applies)
  useEffect(() => {
    if (showFullScheduled) {
      // Show driver's rides filtered by date range and activity
      let filtered = allRides.filter(ride => {
        return ride.date >= fullScheduledStartDate && ride.date <= fullScheduledEndDate
      })
      
      // Filter by activity if activity is set
      if (activity === 'tennis') {
        filtered = filtered.filter(ride => ride.direction === 'to-tennis-center' || ride.direction === 'back-home')
      } else if (activity === 'kidu') {
        filtered = filtered.filter(ride => ride.direction === 'to-school' || ride.direction === 'from-school' || ride.direction === 'to-train-station')
      }
      
      // Sort by date, then by direction
      filtered.sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date)
        }
        if (activity === 'tennis') {
          if (a.direction === 'to-tennis-center' && b.direction === 'back-home') {
            return -1
          }
          if (a.direction === 'back-home' && b.direction === 'to-tennis-center') {
            return 1
          }
        }
        return a.direction.localeCompare(b.direction)
      })
      
      setFullScheduledRides(filtered)
    } else {
      // First filter by date
      let filtered = allRides.filter(ride => ride.date === selectedDate)
      
      // Then filter by activity if activity is set
      if (activity === 'tennis') {
        filtered = filtered.filter(ride => ride.direction === 'to-tennis-center' || ride.direction === 'back-home')
      } else if (activity === 'kidu') {
        filtered = filtered.filter(ride => ride.direction === 'to-school' || ride.direction === 'from-school' || ride.direction === 'to-train-station')
      }
      
      setRides(filtered)
    }
  }, [allRides, selectedDate, activity, showFullScheduled, fullScheduledStartDate, fullScheduledEndDate])

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

  const handleSendWeeklyWhatsApp = async () => {
    if (!whatsAppTemplateSid) {
      alert('Please enter the Twilio Template SID')
      return
    }

    if (confirm('Send WhatsApp messages to all drivers with rides this week?')) {
      setIsSendingWhatsApp(true)
      try {
        const response = await fetch('/api/admin/send-weekly-drivers-whatsapp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user?.id,
            templateSid: whatsAppTemplateSid,
            contentVariables: whatsAppContentVariables || '{}',
          }),
        })

        const data = await response.json()

        if (response.ok) {
          alert(`Success! Messages sent to ${data.driversMessaged}/${data.totalDrivers} drivers.${
            data.errors && data.errors.length > 0
              ? `\n\nFailed: ${data.errors.map((e: any) => `${e.driverName}: ${e.error}`).join('\n')}`
              : ''
          }`)
          setWhatsAppTemplateSid('')
          setWhatsAppContentVariables('')
        } else {
          alert(`Failed: ${data.error || 'Unknown error'}`)
        }
      } catch (error: any) {
        console.error('Error sending WhatsApp:', error)
        alert(`Error: ${error.message || 'Failed to send messages'}`)
      } finally {
        setIsSendingWhatsApp(false)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 overflow-x-hidden w-full max-w-full">
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

        {!isAdmin && (
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2">
            <Button
              variant={showFullScheduled ? 'default' : 'outline'}
              onClick={() => {
                setShowFullScheduled(!showFullScheduled)
                if (!showFullScheduled) {
                  setViewMode('summary') // Default to summary view
                  // Initialize date range to current month
                  const month = getCurrentMonthDates()
                  setFullScheduledStartDate(month.startDate)
                  setFullScheduledEndDate(month.endDate)
                }
              }}
              className="w-full sm:w-auto"
            >
              {showFullScheduled ? 'Hide Full Scheduled Rides' : 'Show My Full Scheduled Rides'}
            </Button>
            {showFullScheduled && (
              <>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'summary' ? 'default' : 'outline'}
                    onClick={() => setViewMode('summary')}
                    className="flex-1 sm:flex-initial"
                  >
                    <List className="mr-2 h-4 w-4" />
                    Summary View
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    onClick={() => setViewMode('table')}
                    className="flex-1 sm:flex-initial"
                  >
                    <Table className="mr-2 h-4 w-4" />
                    Table View
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {showFullScheduled && !isAdmin && (
          <Card className="mb-4 sm:mb-6 w-full max-w-full bg-white/80 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground flex-shrink-0">
                  <Calendar className="h-4 w-4" />
                  Date Range
                </div>
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="fullScheduledStartDate" className="text-xs">From</Label>
                    <Input
                      id="fullScheduledStartDate"
                      type="date"
                      value={fullScheduledStartDate}
                      onChange={(e) => setFullScheduledStartDate(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="fullScheduledEndDate" className="text-xs">To</Label>
                    <Input
                      id="fullScheduledEndDate"
                      type="date"
                      value={fullScheduledEndDate}
                      onChange={(e) => setFullScheduledEndDate(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const month = getCurrentMonthDates()
                        setFullScheduledStartDate(month.startDate)
                        setFullScheduledEndDate(month.endDate)
                      }}
                      className="whitespace-nowrap h-9"
                    >
                      This Month
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!showFullScheduled && (
        <Card className="mb-4 sm:mb-6 w-full max-w-full bg-white/80 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground flex-shrink-0">
                <Calendar className="h-4 w-4" />
                {isAdmin ? 'Filter Rides' : 'Select Date'}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 flex-1 items-end">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-9 max-w-xs"
                />
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
                      All drivers ({allRides.filter(r => r.date === selectedDate).length} rides)
                    </Label>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        <div className="mb-4 sm:mb-6 w-full max-w-full">
          {isAdmin && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto mb-4 sm:mb-0 bg-green-50 hover:bg-green-100">
                  📱 Send WhatsApp to This Week's Drivers
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Send Weekly Schedule to Drivers</DialogTitle>
                  <DialogDescription>
                    Send WhatsApp messages to all drivers with rides this week using a Twilio template
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="templateSid">Twilio Template SID</Label>
                    <Input
                      id="templateSid"
                      placeholder="HXb5b62575e6e4ff6129ad7c8efe1f983e"
                      value={whatsAppTemplateSid}
                      onChange={(e) => setWhatsAppTemplateSid(e.target.value)}
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Get this from your Twilio console → Content Templates
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contentVariables">Content Variables (JSON, optional)</Label>
                    <Input
                      id="contentVariables"
                      placeholder='{"1":"12/1","2":"3pm"}'
                      value={whatsAppContentVariables}
                      onChange={(e) => setWhatsAppContentVariables(e.target.value)}
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Variables to fill template placeholders (e.g., date, time)
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleSendWeeklyWhatsApp}
                    disabled={isSendingWhatsApp || !whatsAppTemplateSid}
                    className="w-full sm:w-auto"
                  >
                    {isSendingWhatsApp ? 'Sending...' : 'Send WhatsApp Messages'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
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
                    onValueChange={(value: 'to-school' | 'from-school' | 'to-train-station' | 'to-tennis-center' | 'back-home') =>
                      setFormData({ ...formData, direction: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getValidDirections().map(dir => (
                        <SelectItem key={dir.value} value={dir.value}>
                          {dir.label}
                        </SelectItem>
                      ))}
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
                    <p>Direction: <DirectionLabel direction={selectedRide.direction} /></p>
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

        {/* Full Scheduled Rides View */}
        {showFullScheduled && !isAdmin && (
          <>
            {viewMode === 'summary' ? (
              <FullScheduledSummaryView rides={fullScheduledRides} usersMap={usersMap} activity={activity} user={user} isAdmin={isAdmin} onDeleteRide={handleDeleteRide} />
            ) : (
              <FullScheduledTableView rides={fullScheduledRides} activity={activity} />
            )}
          </>
        )}

        {/* Regular Date-Filtered View */}
        {!showFullScheduled && (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 w-full max-w-full">
          {rides.length === 0 ? (
            <Card className="col-span-full w-full bg-white/80">
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
            rides.map((ride) => {
              const isToRide = ride.direction === 'to-school' || ride.direction === 'to-tennis-center' || ride.direction === 'to-train-station'
              const isFull = ride.availableSeats <= 0
              return (
              <Card key={ride.id} className={`border-l-4 bg-white/90 shadow-sm hover:shadow-md transition-shadow w-full max-w-full overflow-hidden min-w-0 ${isToRide ? 'border-l-green-500' : 'border-l-purple-500'}`}>
                <CardContent className="p-4">

                  {/* Top bar: direction badge + time + delete */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isToRide ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                        {isToRide ? <ArrowRight className="h-3 w-3" /> : <ArrowLeft className="h-3 w-3" />}
                        <DirectionLabel direction={ride.direction} />
                      </span>
                      {isFull ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">Full</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">{ride.availableSeats} open</span>
                      )}
                      {ride.pickupTime && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />{ride.pickupTime}
                        </span>
                      )}
                    </div>
                    {(isAdmin || ride.driverId === user.id) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRide(ride.id, ride.driverId)}
                        className="text-destructive h-7 w-7 flex-shrink-0"
                        title="Delete ride"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  {/* Action buttons row (own rides only) */}
                  {ride.driverId === user.id && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <AddToCalendarButton
                        ride={ride}
                        driverName={ride.driverName}
                        className="h-8 w-8 sm:w-auto"
                      />
                      <ShareButton
                        ride={ride}
                        driverName={ride.driverName}
                        className="h-8 w-8 sm:w-auto"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openUpdateDialog(ride)}
                        className="h-8 w-8"
                        title="Update ride"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}

                  {/* Info rows */}
                  <div className="space-y-2 mb-3 text-sm">
                    {isAdmin && ride.driverId !== user.id && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium">{ride.driverName}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p className="text-muted-foreground break-words break-all">{ride.pickupAddress}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: ride.totalSeats }).map((_, i) => (
                          <div key={i} className={`h-2.5 w-2.5 rounded-full border ${i < ride.passengers.length ? (isToRide ? 'bg-green-500 border-green-500' : 'bg-purple-500 border-purple-500') : 'bg-white border-gray-300'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{ride.passengers.length}/{ride.totalSeats}</span>
                    </div>
                  </div>

                  {ride.notes && (
                    <div className="flex items-start gap-2 mb-3 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-muted-foreground">{ride.notes}</p>
                    </div>
                  )}

                  {/* Passengers */}
                  {ride.passengers.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Passengers ({ride.passengers.length})
                      </p>
                      <div className="space-y-1.5">
                        {ride.passengers.map((passenger) => {
                          const parent = usersMap[passenger.parentId]
                          const childParents = passenger.child?.parents || []
                          const allParents = childParents.length > 0
                            ? childParents
                            : parent
                              ? [{ id: parent.id, name: parent.name, phone: parent.phone }]
                              : []

                          return (
                            <div key={passenger.id} className="flex items-start gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
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
                                {passenger.pickupFromHome && passenger.pickupAddress && (
                                  <div className="flex items-center gap-1 text-xs text-primary mt-0.5">
                                    <Home className="h-3 w-3 flex-shrink-0" />{passenger.pickupAddress}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              )
            })
          )}
        </div>
        )}
      </div>
    </div>
  )
}

export default function DriverPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    }>
      <DriverPageContent />
    </Suspense>
  )
}

