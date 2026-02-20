'use client'

import { useAuth } from '@/components/auth-provider'
import { useActivity } from '@/components/activity-provider'
import { Button } from '@/components/ui/button'
import { useRouter, usePathname } from 'next/navigation'
import { Car, Users, LogOut, GraduationCap, Sun, Moon } from 'lucide-react'
import { getNextThursday, cn } from '@/lib/utils'
import { useTheme } from 'next-themes'

export function Navigation() {
  const { user, logout } = useAuth()
  const { activity, setActivity } = useActivity()
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  if (!user) return null

  const isKidu = user.is_registered_kidu || false
  const isTennis = user.is_registered_tennis || false
  const canSwitchActivities = isKidu && isTennis
  const isOnActivitySelectionPage = pathname === '/select-activity' || pathname?.startsWith('/select-activity')
  const isTennisMode = activity === 'tennis'

  const handleActivitySwitch = () => {
    if (activity === 'kidu') {
      setActivity('tennis')
    } else if (activity === 'tennis') {
      setActivity('kidu')
    }
  }

  const isDriverActive = pathname === '/driver'
  const isParentActive = pathname === '/parent' || pathname === '/dashboard' || pathname?.startsWith('/dashboard')

  return (
    <nav className="border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 py-2.5 max-w-full overflow-x-hidden">
        <div className="flex items-center justify-between gap-2 min-w-0">

          {/* Left: Brand + Nav links */}
          <div className="flex items-center gap-1 sm:gap-4 min-w-0 overflow-hidden">

            {/* Brand mark */}
            <button
              onClick={() => router.push('/select-mode')}
              className="flex items-center gap-2 flex-shrink-0 group"
            >
              <div className={cn(
                'p-1.5 rounded-xl',
                isTennisMode ? 'bg-green-100 group-hover:bg-green-200' : 'bg-blue-100 group-hover:bg-blue-200'
              )}>
                <Car className={cn('h-4 w-4 sm:h-5 sm:w-5', isTennisMode ? 'text-green-600' : 'text-primary')} />
              </div>
              <span className={cn(
                'text-base sm:text-lg font-bold hidden sm:block',
                isTennisMode ? 'text-green-600' : 'text-primary'
              )}>
                {isTennisMode ? 'TennisRide' : 'KiduRide'}
              </span>
            </button>

            {/* Divider */}
            <div className="h-5 w-px bg-border hidden sm:block flex-shrink-0" />

            {/* Nav buttons */}
            <div className="flex gap-0.5 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/driver')}
                className={cn(
                  'rounded-full px-2.5 sm:px-4 text-xs sm:text-sm font-medium h-8',
                  isDriverActive
                    ? 'bg-primary/10 text-primary hover:bg-primary/15'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Car className="h-3.5 w-3.5 sm:mr-1.5 flex-shrink-0" />
                <span className="hidden sm:inline">Driver Mode</span>
                <span className="sm:hidden">Driver</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { const d = getNextThursday(); router.push(`/dashboard?startDate=${d}&endDate=${d}`) }}
                className={cn(
                  'rounded-full px-2.5 sm:px-4 text-xs sm:text-sm font-medium h-8',
                  isParentActive
                    ? 'bg-primary/10 text-primary hover:bg-primary/15'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Users className="h-3.5 w-3.5 sm:mr-1.5 flex-shrink-0" />
                <span className="hidden sm:inline">Parent Mode</span>
                <span className="sm:hidden">Parent</span>
              </Button>
            </div>
          </div>

          {/* Right: Activity switch + avatar + logout */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">

            {/* Activity switch */}
            {canSwitchActivities && activity && !isOnActivitySelectionPage && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleActivitySwitch}
                className="text-xs sm:text-sm px-2 sm:px-3 rounded-full border-dashed h-8"
              >
                {activity === 'kidu' ? (
                  <>
                    <GraduationCap className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Switch to Tennis</span>
                    <span className="sm:hidden">Tennis</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="h-3.5 w-3.5 sm:mr-1"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M 7.5 5.5 Q 12 12 16.5 18.5" />
                      <path d="M 16.5 5.5 Q 12 12 7.5 18.5" />
                    </svg>
                    <span className="hidden sm:inline">Switch to Kidu</span>
                    <span className="sm:hidden">Kidu</span>
                  </>
                )}
              </Button>
            )}

            {/* Dark mode toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* User avatar + name */}
            <div className="hidden sm:flex items-center gap-2">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0',
                isTennisMode ? 'bg-green-500' : 'bg-primary'
              )}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-muted-foreground max-w-[120px] truncate">{user.name}</span>
            </div>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-muted-foreground hover:text-foreground px-2 sm:px-3 h-8"
            >
              <LogOut className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline text-xs">Sign Out</span>
            </Button>
          </div>

        </div>
      </div>
    </nav>
  )
}
