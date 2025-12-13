'use client'

import { useAuth } from '@/components/auth-provider'
import { useActivity } from '@/components/activity-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Home() {
  const { user, login, isLoading } = useAuth()
  const { activity, setActivity } = useActivity()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => {
    if (user && !isLoading) {
      // Check user's activity registrations
      const isKidu = user.is_registered_kidu || false
      const isTennis = user.is_registered_tennis || false

      if (isKidu && !isTennis) {
        // Only registered for Kidu - go directly to mode selection
        setActivity('kidu')
        router.push('/select-mode')
      } else if (isTennis && !isKidu) {
        // Only registered for Tennis - go directly to mode selection
        setActivity('tennis')
        router.push('/select-mode')
      } else if (isKidu && isTennis) {
        // Registered for both - always show activity selection page
        router.push('/select-activity')
      } else {
        // Not registered for any activity - show mode selection (fallback)
        router.push('/select-mode')
      }
    }
  }, [user, isLoading, router, activity, setActivity])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirecting...</div>
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    try {
      await login(email)
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className={`text-3xl font-bold ${activity === 'tennis' ? 'text-green-600' : 'text-primary'}`}>
            {activity === 'tennis' ? 'TennisRide' : 'KiduRide'}
          </CardTitle>
          <CardDescription>
            Car Pool Coordination Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Sign in with an email that exists in the system. Only registered users can access the platform.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoggingIn}>
              {isLoggingIn ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
