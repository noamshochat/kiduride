'use client'

import { useAuth } from '@/components/auth-provider'
import { useActivity } from '@/components/activity-provider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Car, Users } from 'lucide-react'
import { useEffect } from 'react'
import { Navigation } from '@/components/navigation'
import { getNextThursday } from '@/lib/utils'

export default function SelectModePage() {
  const { user, isLoading } = useAuth()
  const { activity } = useActivity()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      <Navigation />
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-2xl space-y-6">

          {/* Header */}
          <div className="text-center">
            <h1 className={`text-3xl font-bold ${activity === 'tennis' ? 'text-green-600' : 'text-primary'}`}>
              Welcome, {user.name}!
            </h1>
            <p className="text-muted-foreground mt-2">
              Choose how you'd like to use {activity === 'tennis' ? 'TennisRide' : 'KiduRide'}
            </p>
          </div>

          {/* Mode cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card
              className="cursor-pointer border-2 border-transparent hover:border-primary/30 hover:shadow-xl transition-all duration-200 bg-white/80 backdrop-blur-sm"
              onClick={() => router.push('/driver')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
                    <Car className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-center text-xl">Driver Mode</CardTitle>
                <CardDescription className="text-center">
                  Create and manage rides for children
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {['Create new rides', 'Manage available seats', 'View passenger assignments', 'Set pickup locations'].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/50 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer border-2 border-transparent hover:border-primary/30 hover:shadow-xl transition-all duration-200 bg-white/80 backdrop-blur-sm"
              onClick={() => { const d = getNextThursday(); router.push(`/dashboard?startDate=${d}&endDate=${d}`) }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
                    <Users className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-center text-xl">Parent Mode</CardTitle>
                <CardDescription className="text-center">
                  Find rides and assign your children
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {['Browse available rides', 'Assign children to rides', 'Set custom pickup addresses', 'Manage your bookings'].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/50 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}

