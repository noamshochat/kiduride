'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/lib/demo-data'
import { demoData } from '@/lib/demo-data'

interface AuthContextType {
  user: User | null
  login: (email: string) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user in localStorage
    const storedUserId = localStorage.getItem('userId')
    if (storedUserId) {
      const foundUser = demoData.getUserById(storedUserId)
      if (foundUser) {
        setUser(foundUser)
      }
    }
    setIsLoading(false)
  }, [])

  const login = (email: string) => {
    const foundUser = demoData.getUserByEmail(email)
    if (foundUser) {
      setUser(foundUser)
      localStorage.setItem('userId', foundUser.id)
    } else {
      alert('User not found. Demo users: john@example.com, sarah@example.com, mike@example.com, lisa@example.com, alex@example.com')
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

