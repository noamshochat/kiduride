'use client'

import { useEffect } from 'react'
import { useActivity } from '@/components/activity-provider'

export function DynamicTitle() {
  const { activity } = useActivity()

  useEffect(() => {
    const title = activity === 'tennis' ? 'TennisRide - Car Pool Coordination' : 'KiduRide - Car Pool Coordination'
    document.title = title
  }, [activity])

  return null
}

