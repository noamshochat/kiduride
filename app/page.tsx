'use client'

import { useAuth } from '@/components/auth-provider'
import { useActivity } from '@/components/activity-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Car } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Brand mark */}
        <div className="text-center space-y-3">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-1 ${activity === 'tennis' ? 'bg-green-500 shadow-green-500/30' : 'bg-primary shadow-primary/30'}`}>
            <Car className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${activity === 'tennis' ? 'text-green-600' : 'text-gray-900'}`}>
              {activity === 'tennis' ? 'TennisRide' : 'KiduRide'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Car Pool Coordination</p>
          </div>
        </div>

        {/* Login card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6 pb-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Sign in with your registered email address.
                </p>
              </div>
              <Button type="submit" className="w-full h-11 font-medium" disabled={isLoggingIn}>
                {isLoggingIn ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
