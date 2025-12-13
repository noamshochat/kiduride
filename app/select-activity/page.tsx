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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-64px)]">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">Welcome, {user.name}!</CardTitle>
            <CardDescription>
              Select which activity you'd like to manage rides for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleSelectActivity('kidu')}>
                <CardHeader>
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-4 rounded-full bg-primary/10">
                      <GraduationCap className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-center">Kidumathematics</CardTitle>
                  <CardDescription className="text-center">
                    Manage rides for Kidumathematics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Create and manage rides</li>
                    <li>• Assign children to rides</li>
                    <li>• Coordinate transportation</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleSelectActivity('tennis')}>
                <CardHeader>
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-4 rounded-full bg-primary/10">
                      <svg 
                        className="h-12 w-12 text-primary" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        {/* Tennis Ball Circle */}
                        <circle cx="12" cy="12" r="10" />
                        {/* First curved seam - from top-left (10 o'clock) to bottom-right (4 o'clock) */}
                        <path d="M 7.5 5.5 Q 12 12 16.5 18.5" />
                        {/* Second curved seam - from top-right (2 o'clock) to bottom-left (8 o'clock) */}
                        <path d="M 16.5 5.5 Q 12 12 7.5 18.5" />
                      </svg>
                    </div>
                  </div>
                  <CardTitle className="text-center">Tennis Hanuka Camp</CardTitle>
                  <CardDescription className="text-center">
                    Manage rides for Tennis Camp
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Create and manage rides</li>
                    <li>• Assign children to rides</li>
                    <li>• Coordinate transportation</li>
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

