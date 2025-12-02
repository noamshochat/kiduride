'use client'

import { Share2 } from 'lucide-react'
import { Button } from './ui/button'
import { Ride } from '@/lib/demo-data'
import { format } from 'date-fns'
import { useToast } from './ui/toast'

interface ShareButtonProps {
  ride: Ride
  driverName: string
  className?: string
}

export function ShareButton({ ride, driverName, className }: ShareButtonProps) {
  const { showToast, ToastComponent } = useToast()

  const generateShareText = (): string => {
    const date = format(new Date(ride.date), 'MMM d, yyyy')
    const direction = ride.direction === 'to-school'  ? 'To university': ride.direction === 'to-train-station'? 'To train station': 'From university'
    const shareUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/ride/${ride.id}`
      : ''
    
    return `Ride Share - ${date}\n\nDirection: ${direction}\nDriver: ${driverName}\nPickup: ${ride.pickupAddress}\n\nView details: ${shareUrl}`
  }

  const generateShareUrl = (): string => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/ride/${ride.id}`
  }

  const handleShare = async () => {
    const shareText = generateShareText()
    const shareUrl = generateShareUrl()

    try {
      // Check if Web Share API is available
      if (navigator.share) {
        await navigator.share({
          title: 'Ride Details',
          text: shareText,
          url: shareUrl,
        })
        // Don't show toast if share was successful (native share handles it)
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareUrl)
        showToast('Link copied!')
      }
    } catch (error: any) {
      // User cancelled share or error occurred
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error)
        // Fallback to clipboard if share fails
        try {
          await navigator.clipboard.writeText(shareUrl)
          showToast('Link copied!')
        } catch (clipboardError) {
          console.error('Error copying to clipboard:', clipboardError)
          showToast('Failed to copy link')
        }
      }
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className={className}
        title="Share ride"
      >
        <Share2 className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Share</span>
      </Button>
      {ToastComponent}
    </>
  )
}

