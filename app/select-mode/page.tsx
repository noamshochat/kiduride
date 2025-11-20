'use client'

import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Car, Users } from 'lucide-react'
import { useEffect } from 'react'
import { Navigation } from '@/components/navigation'

export default function SelectModePage() {
  const { user, isLoading } = useAuth()
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-64px)]">
        <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Welcome, {user.name}!</CardTitle>
          <CardDescription>
            Choose how you'd like to use KiduRide
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push('/driver')}>
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Car className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-center">Driver Mode</CardTitle>
                <CardDescription className="text-center">
                  Create and manage rides for children
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Create new rides</li>
                  <li>• Manage available seats</li>
                  <li>• View passenger assignments</li>
                  <li>• Set pickup locations</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push('/parent')}>
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Users className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-center">Parent Mode</CardTitle>
                <CardDescription className="text-center">
                  Find rides and assign your children
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Browse available rides</li>
                  <li>• Assign children to rides</li>
                  <li>• Set custom pickup addresses</li>
                  <li>• Manage your bookings</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  )
}

