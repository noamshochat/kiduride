'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from './button'

interface ToastProps {
  message: string
  duration?: number
  onClose: () => void
}

export function Toast({ message, duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
      <div className="bg-primary text-primary-foreground px-4 py-3 rounded-md shadow-lg flex items-center gap-3 min-w-[200px] max-w-[400px]">
        <span className="flex-1 text-sm">{message}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Hook for managing toast state
export function useToast() {
  const [toast, setToast] = useState<{ message: string } | null>(null)

  const showToast = (message: string) => {
    setToast({ message })
  }

  const ToastComponent = toast ? (
    <Toast message={toast.message} onClose={() => setToast(null)} />
  ) : null

  return { showToast, ToastComponent }
}

