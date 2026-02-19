'use client'

import { useAuth } from '@/components/auth-provider'
import { useActivity } from '@/components/activity-provider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap } from 'lucide-react'
import { useEffect } from 'react'
import { Navigation } from '@/components/navigation'

export default function SelectActivityPage() {
  const { user, isLoading } = useAuth()
  const { activity, setActivity } = useActivity()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
      return
    }

    // Verify user is registered for both activities
    if (user) {
      const isKidu = user.is_registered_kidu || false
      const isTennis = user.is_registered_tennis || false
      
      // If not registered for both, redirect appropriately
      if (isKidu && !isTennis) {
        setActivity('kidu')
        router.push('/select-mode')
      } else if (isTennis && !isKidu) {
        setActivity('tennis')
        router.push('/select-mode')
      } else if (!isKidu && !isTennis) {
        // Not registered for any activity
        router.push('/select-mode')
      }
      // If registered for both, stay on this page
    }
  }, [user, isLoading, router, setActivity])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  // Verify user is registered for both activities before showing page
  const isKidu = user.is_registered_kidu || false
  const isTennis = user.is_registered_tennis || false
  if (!(isKidu && isTennis)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirecting...</div>
      </div>
    )
  }

  const handleSelectActivity = (activity: 'kidu' | 'tennis') => {
    setActivity(activity)
    router.push('/select-mode')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      <Navigation />
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-2xl space-y-6">

          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary">Welcome, {user.name}!</h1>
            <p className="text-muted-foreground mt-2">
              Select which activity you'd like to manage rides for
            </p>
          </div>

          {/* Activity cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card
              className="cursor-pointer border-2 border-transparent hover:border-primary/30 hover:shadow-xl transition-all duration-200 bg-white/80 backdrop-blur-sm"
              onClick={() => handleSelectActivity('kidu')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
                    <GraduationCap className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-center text-xl">Kidumathematics</CardTitle>
                <CardDescription className="text-center">
                  Manage rides for Kidumathematics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {['Create and manage rides', 'Assign children to rides', 'Coordinate transportation'].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/50 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer border-2 border-transparent hover:border-green-400/50 hover:shadow-xl transition-all duration-200 bg-white/80 backdrop-blur-sm"
              onClick={() => handleSelectActivity('tennis')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-green-200 to-green-50">
                    <svg
                      className="h-10 w-10 text-green-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M 7.5 5.5 Q 12 12 16.5 18.5" />
                      <path d="M 16.5 5.5 Q 12 12 7.5 18.5" />
                    </svg>
                  </div>
                </div>
                <CardTitle className="text-center text-xl">Tennis Hanuka Camp</CardTitle>
                <CardDescription className="text-center">
                  Manage rides for Tennis Camp
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {['Create and manage rides', 'Assign children to rides', 'Coordinate transportation'].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500/50 flex-shrink-0" />
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

