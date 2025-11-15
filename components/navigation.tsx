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
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-primary">KidoRide</h1>
            <div className="flex gap-2">
              <Button
                variant={pathname === '/driver' ? 'default' : 'outline'}
                size="sm"
                onClick={() => router.push('/driver')}
              >
                <Car className="mr-2 h-4 w-4" />
                Driver Mode
              </Button>
              <Button
                variant={pathname === '/parent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => router.push('/parent')}
              >
                <Users className="mr-2 h-4 w-4" />
                Parent Mode
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.name}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

