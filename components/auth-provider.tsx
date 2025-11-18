'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/lib/demo-data'
import { supabaseDb } from '@/lib/supabase-db'

interface AuthContextType {
  user: User | null
  login: (email: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user in localStorage and verify it exists in Supabase
    const loadStoredUser = async () => {
      const storedUserId = localStorage.getItem('userId')
      if (storedUserId) {
        try {
          const foundUser = await supabaseDb.getUserById(storedUserId)
          if (foundUser) {
            setUser(foundUser)
          } else {
            // User no longer exists in database, clear localStorage
            localStorage.removeItem('userId')
          }
        } catch (error) {
          console.error('Error loading stored user:', error)
          localStorage.removeItem('userId')
        }
      }
      setIsLoading(false)
    }
    
    loadStoredUser()
  }, [])

  const login = async (email: string) => {
    try {
      const foundUser = await supabaseDb.getUserByEmail(email)
      if (foundUser) {
        setUser(foundUser)
        localStorage.setItem('userId', foundUser.id)
      } else {
        alert('User not found. Please sign in with an email that exists in the system.')
      }
    } catch (error) {
      console.error('Error during login:', error)
      alert('An error occurred during login. Please try again.')
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('userId')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

