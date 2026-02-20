'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MapPin } from 'lucide-react'

interface AddressLinkProps {
  address: string
  className?: string
  iconClassName?: string
  showIcon?: boolean
}

export function AddressLink({ address, className = '', iconClassName = '', showIcon = false }: AddressLinkProps) {
  const [open, setOpen] = useState(false)
  const encoded = encodeURIComponent(address)

  const openWaze = () => {
    window.open(`https://waze.com/ul?q=${encoded}&navigate=yes`, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  const openGoogleMaps = () => {
    window.open(`https://maps.google.com/?q=${encoded}`, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true) }}
        className={`text-left hover:underline hover:text-primary transition-colors cursor-pointer ${className}`}
      >
        {showIcon && <MapPin className={`inline h-3 w-3 mr-0.5 flex-shrink-0 ${iconClassName}`} />}
        {address}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-muted-foreground">Open in navigation app</DialogTitle>
          </DialogHeader>
          <p className="text-sm font-medium -mt-1 mb-1">{address}</p>
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full justify-start gap-3" onClick={openWaze}>
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current text-[#00D4FF]" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.54 6.63A10.55 10.55 0 0 0 12 2C6.48 2 2 6.48 2 12c0 1.95.56 3.77 1.53 5.31L2 22l4.84-1.5A10 10 0 0 0 12 22c5.52 0 10-4.48 10-10 0-1.95-.56-3.77-1.46-5.37zM12 20a8 8 0 0 1-4.13-1.15l-.29-.18-3.04.94.97-2.96-.19-.3A8 8 0 1 1 12 20z"/>
              </svg>
              Waze
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3" onClick={openGoogleMaps}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="#EA4335"/>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13V6.5c1.38 0 2.5 1.12 2.5 2.5S13.38 11.5 12 11.5V2z" fill="#34A853"/>
                <path d="M5 9c0-3.87 3.13-7 7-7v4.5C10.62 6.5 9.5 7.62 9.5 9S10.62 11.5 12 11.5V22C12 22 5 14.25 5 9z" fill="#FBBC04"/>
              </svg>
              Google Maps
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
