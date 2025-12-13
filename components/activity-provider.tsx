'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type ActivityType = 'kidu' | 'tennis' | null

interface ActivityContextType {
  activity: ActivityType
  setActivity: (activity: ActivityType) => void
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined)

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activity, setActivityState] = useState<ActivityType>(null)

  // Load activity from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedActivity = localStorage.getItem('selectedActivity') as ActivityType
      if (savedActivity === 'kidu' || savedActivity === 'tennis') {
        setActivityState(savedActivity)
      }
    }
  }, [])

  const setActivity = (newActivity: ActivityType) => {
    setActivityState(newActivity)
    if (typeof window !== 'undefined') {
      if (newActivity) {
        localStorage.setItem('selectedActivity', newActivity)
      } else {
        localStorage.removeItem('selectedActivity')
      }
    }
  }

  return (
    <ActivityContext.Provider value={{ activity, setActivity }}>
      {children}
    </ActivityContext.Provider>
  )
}

export function useActivity() {
  const context = useContext(ActivityContext)
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider')
  }
  return context
}

