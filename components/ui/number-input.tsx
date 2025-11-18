'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  placeholder?: string
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, min, max, placeholder, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState<string>(value === 0 ? '' : value.toString())
    const [isMobile, setIsMobile] = React.useState(false)

    React.useEffect(() => {
      // Detect mobile device - only run on client side
      if (typeof window === 'undefined') return
      
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
      }
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }, [])

    React.useEffect(() => {
      // Only update if value actually changed (not just from 0 to 0)
      if (value === 0 && inputValue === '') {
        // Keep empty if it's 0 and already empty
        return
      }
      if (value !== 0 || inputValue !== '') {
        setInputValue(value === 0 ? '' : value.toString())
      }
    }, [value, inputValue])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setInputValue(newValue)

      // Allow empty string for clearing (user can delete all digits)
      if (newValue === '') {
        // Don't update onChange yet, let user type
        return
      }

      // Parse the number
      const numValue = parseInt(newValue, 10)
      
      if (!isNaN(numValue)) {
        // Clamp to min/max
        let clampedValue = numValue
        if (min !== undefined && clampedValue < min) {
          clampedValue = min
          setInputValue(clampedValue.toString())
        }
        if (max !== undefined && clampedValue > max) {
          clampedValue = max
          setInputValue(clampedValue.toString())
        }
        onChange(clampedValue)
      }
    }

    const handleBlur = () => {
      // On blur, if empty, keep it empty (don't force a value)
      const numValue = parseInt(inputValue, 10)
      if (inputValue === '' || isNaN(numValue)) {
        // Keep empty, set value to 0
        setInputValue('')
        onChange(0)
      } else {
        // Ensure it matches the actual value
        setInputValue(value === 0 ? '' : value.toString())
      }
    }

    // Mobile: use text input with inputmode="numeric" for numeric keyboard widget
    // Desktop: use number input but handle clearing properly
    const inputType = isMobile ? 'text' : 'number'
    const inputMode = isMobile ? 'numeric' : undefined
    const pattern = isMobile ? '[0-9]*' : undefined

    // For desktop number inputs, handle the clearing issue by allowing empty temporarily
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow backspace/delete to clear the field on desktop
      if (!isMobile && (e.key === 'Backspace' || e.key === 'Delete')) {
        const target = e.currentTarget
        if (target.value && target.selectionStart === 0 && target.selectionEnd === target.value.length) {
          // User selected all and is deleting - allow it
          setInputValue('')
        }
      }
    }

    return (
      <input
        type={inputType}
        inputMode={inputMode}
        pattern={pattern}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        min={min}
        max={max}
        placeholder={placeholder || (min ? `Min: ${min}` : '')}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
NumberInput.displayName = "NumberInput"

export { NumberInput }

