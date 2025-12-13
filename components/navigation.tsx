'use client'

import { useAuth } from '@/components/auth-provider'
import { useActivity } from '@/components/activity-provider'
import { Button } from '@/components/ui/button'
import { useRouter, usePathname } from 'next/navigation'
import { Car, Users, LogOut, GraduationCap } from 'lucide-react'

export function Navigation() {
  const { user, logout } = useAuth()
  const { activity, setActivity } = useActivity()
  const router = useRouter()
  const pathname = usePathname()

  if (!user) return null

  // Check if user is registered for both activities
  const isKidu = user.is_registered_kidu || false
  const isTennis = user.is_registered_tennis || false
  const canSwitchActivities = isKidu && isTennis
  const isOnActivitySelectionPage = pathname === '/select-activity' || pathname?.startsWith('/select-activity')

  const handleActivitySwitch = () => {
    if (activity === 'kidu') {
      setActivity('tennis')
    } else if (activity === 'tennis') {
      setActivity('kidu')
    }
    // Pages will automatically reload via useEffect hooks that depend on activity
  }

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 overflow-x-hidden">
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 max-w-full overflow-x-hidden">
        <div className="flex items-center justify-between flex-wrap gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 overflow-hidden">
            <h1 className={`text-lg sm:text-xl font-bold whitespace-nowrap flex-shrink-0 ${activity === 'tennis' ? 'text-green-600' : 'text-primary'}`}>
              {activity === 'tennis' ? 'TennisRide' : 'KiduRide'}
            </h1>
            <div className="flex gap-1 sm:gap-2 flex-1 min-w-0 overflow-hidden">
              <Button
                variant={pathname === '/driver' ? 'default' : 'outline'}
                size="sm"
                onClick={() => router.push('/driver')}
                className="flex-1 sm:flex-initial text-xs sm:text-sm px-2 sm:px-3"
              >
                <Car className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Driver Mode</span>
                <span className="sm:hidden">Driver</span>
              </Button>
              <Button
                variant={pathname === '/parent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => router.push('/parent')}
                className="flex-1 sm:flex-initial text-xs sm:text-sm px-2 sm:px-3"
              >
                <Users className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Parent Mode</span>
                <span className="sm:hidden">Parent</span>
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {canSwitchActivities && activity && !isOnActivitySelectionPage && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleActivitySwitch}
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                {activity === 'kidu' ? (
                  <>
                    <GraduationCap className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Switch to Tennis</span>
                    <span className="sm:hidden">Tennis</span>
                  </>
                ) : (
                  <>
                    <svg 
                      className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <ellipse cx="12" cy="12" rx="7" ry="5" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <line x1="12" y1="7" x2="12" y2="17" />
                      <line x1="8.5" y1="9" x2="15.5" y2="15" />
                      <line x1="15.5" y1="9" x2="8.5" y2="15" />
                      <line x1="12" y1="17" x2="12" y2="22" />
                      <line x1="10" y1="20" x2="14" y2="20" />
                    </svg>
                    <span className="hidden sm:inline">Switch to Kidu</span>
                    <span className="sm:hidden">Kidu</span>
                  </>
                )}
              </Button>
            )}
            <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">{user.name}</span>
            <Button variant="outline" size="sm" onClick={logout} className="text-xs sm:text-sm">
              <LogOut className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Sign Out</span>
              <span className="sm:hidden">Out</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

