'use client'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { useRouter, usePathname } from 'next/navigation'
import { Car, Users, LogOut } from 'lucide-react'

export function Navigation() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  if (!user) return null

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 overflow-x-hidden">
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 max-w-full overflow-x-hidden">
        <div className="flex items-center justify-between flex-wrap gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 overflow-hidden">
            <h1 className="text-lg sm:text-xl font-bold text-primary whitespace-nowrap flex-shrink-0">KiduRide</h1>
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

