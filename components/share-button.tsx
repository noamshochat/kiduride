'use client'

import { Share2, Users, MapPin, Calendar, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from './ui/button'
import { Ride } from '@/lib/demo-data'
import { format } from 'date-fns'
import { useToast } from './ui/toast'
import { useRef } from 'react'
import html2canvas from 'html2canvas'

interface ShareButtonProps {
  ride: Ride
  driverName: string
  className?: string
}

export function ShareButton({ ride, driverName, className }: ShareButtonProps) {
  const { showToast, ToastComponent } = useToast()
  const screenshotRef = useRef<HTMLDivElement>(null)

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

  const captureScreenshot = async (): Promise<File | null> => {
    if (!screenshotRef.current) {
      console.error('Screenshot ref is null')
      return null
    }

    try {
      const element = screenshotRef.current
      
      // Store original styles
      const originalStyles = {
        position: element.style.position || '',
        left: element.style.left || '',
        top: element.style.top || '',
        opacity: element.style.opacity || '',
        pointerEvents: element.style.pointerEvents || '',
        zIndex: element.style.zIndex || '',
        transform: element.style.transform || '',
      }
      
      // Make element visible but positioned off-screen for html2canvas
      // html2canvas needs the element to be in the DOM and visible
      element.style.position = 'fixed'
      element.style.left = '0'
      element.style.top = '0'
      element.style.opacity = '1'
      element.style.pointerEvents = 'none'
      element.style.zIndex = '999999'
      element.style.transform = 'translateX(-10000px)'
      
      // Force a reflow to ensure styles are applied
      void element.offsetHeight
      
      // Wait for rendering
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(resolve, 300)
          })
        })
      })
      
      // Check if element has content
      if (element.offsetWidth === 0 || element.offsetHeight === 0) {
        console.error('Element has no dimensions', {
          width: element.offsetWidth,
          height: element.offsetHeight,
          scrollWidth: element.scrollWidth,
          scrollHeight: element.scrollHeight
        })
      }
      
      const canvas = await html2canvas(element, {
        backgroundColor: '#f8fafc',
        scale: 2,
        logging: true, // Enable logging to debug
        useCORS: true,
        allowTaint: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
      })
      
      // Restore original styles immediately
      element.style.position = originalStyles.position
      element.style.left = originalStyles.left
      element.style.top = originalStyles.top
      element.style.opacity = originalStyles.opacity
      element.style.pointerEvents = originalStyles.pointerEvents
      element.style.zIndex = originalStyles.zIndex
      element.style.transform = originalStyles.transform
      
      // Check if canvas is empty
      if (canvas.width === 0 || canvas.height === 0) {
        console.error('Canvas is empty', { width: canvas.width, height: canvas.height })
        return null
      }
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob && blob.size > 0) {
            const file = new File([blob], `ride-${ride.id}-${ride.date}.png`, { type: 'image/png' })
            console.log('Screenshot captured successfully', { size: blob.size, file })
            resolve(file)
          } else {
            console.error('Failed to create blob from canvas', { blob })
            resolve(null)
          }
        }, 'image/png', 0.95)
      })
    } catch (error) {
      console.error('Error capturing screenshot:', error)
      return null
    }
  }

  const handleShare = async () => {
    const shareText = generateShareText()
    const shareUrl = generateShareUrl()

    try {
      // Check if Web Share API is available
      if (navigator.share) {
        // Try to capture screenshot
        const screenshotFile = await captureScreenshot()
        
        const shareData: any = {
          title: 'Ride Details',
          text: shareText,
          url: shareUrl,
        }

        // Include screenshot if available and browser supports files
        if (screenshotFile && navigator.canShare && navigator.canShare({ files: [screenshotFile] })) {
          shareData.files = [screenshotFile]
        }

        await navigator.share(shareData)
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

  const direction = ride.direction === 'to-school' 
    ? 'To university' 
    : ride.direction === 'to-train-station'
    ? 'To train station'
    : 'From university'
  
  const DirectionIcon = ride.direction === 'from-school' ? ArrowLeft : ArrowRight
  const shareUrl = generateShareUrl()

  return (
    <>
      {/* Hidden div for screenshot capture */}
      <div
        ref={screenshotRef}
        className="absolute -left-[9999px] top-0 w-[400px] bg-gradient-to-br from-blue-50 to-indigo-100 p-6"
        style={{ opacity: 0, pointerEvents: 'none' }}
      >
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {format(new Date(ride.date), 'EEEE, MMMM d, yyyy')}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-gray-600">
              <DirectionIcon className="h-4 w-4" />
              <span className="text-base">{direction}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Driver</p>
                <p className="text-gray-600">{driverName}</p>
              </div>
            </div>

            {ride.pickupAddress && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Pickup Location</p>
                  <p className="text-gray-600">{ride.pickupAddress}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Seats</p>
                <p className="text-gray-600">
                  {ride.passengers.length} / {ride.totalSeats} seats filled
                  {ride.availableSeats === 0 && (
                    <span className="text-red-600 ml-2">(Full)</span>
                  )}
                </p>
              </div>
            </div>

            {ride.pickupTime && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Pickup Time</p>
                  <p className="text-gray-600">{ride.pickupTime}</p>
                </div>
              </div>
            )}

            {ride.notes && (
              <div>
                <p className="font-medium text-gray-900 mb-1">Notes</p>
                <p className="text-gray-600">{ride.notes}</p>
              </div>
            )}
          </div>

          {ride.passengers.length > 0 && (
            <div className="pt-4 border-t">
              <p className="font-medium text-gray-900 mb-3">
                Passengers ({ride.passengers.length})
              </p>
              <ul className="space-y-2">
                {ride.passengers.map((passenger) => (
                  <li key={passenger.id} className="bg-gray-50 p-3 rounded-md">
                    <div className="font-medium text-gray-900">{passenger.childName}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Parent: {passenger.parentName}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 border-t text-center">
            <p className="text-sm text-gray-500">View full details: {shareUrl}</p>
          </div>
        </div>
      </div>

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

