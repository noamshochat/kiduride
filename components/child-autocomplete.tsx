'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { supabaseDb } from '@/lib/supabase-db'
import { Child } from '@/lib/demo-data'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChildAutocompleteProps {
  value?: Child | null
  onChange: (child: Child | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function ChildAutocomplete({
  value,
  onChange,
  placeholder = 'Search for a child...',
  className = '',
  disabled = false,
}: ChildAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Child[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Set initial query from value
  useEffect(() => {
    if (value) {
      setQuery(`${value.firstName}${value.lastName ? ' ' + value.lastName : ''}`)
    } else {
      setQuery('')
    }
  }, [value])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Search children when query changes
  useEffect(() => {
    const searchChildren = async () => {
      if (query.trim().length < 2) {
        setResults([])
        setIsOpen(false)
        return
      }

      setIsLoading(true)
      try {
        console.log('[ChildAutocomplete] Searching for:', query)
        const children = await supabaseDb.searchChildren(query)
        console.log('[ChildAutocomplete] Received children:', children.length, children)
        setResults(children)
        setIsOpen(children.length > 0)
        if (query.includes('אית')) {
          console.log('[ChildAutocomplete] Search for אית - results:', JSON.stringify(children, null, 2))
        }
      } catch (error) {
        console.error('Error searching children:', error)
        setResults([])
        setIsOpen(false)
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchChildren, 300)
    return () => clearTimeout(debounceTimer)
  }, [query])

  const handleSelect = (child: Child) => {
    onChange(child)
    setQuery(`${child.firstName}${child.lastName ? ' ' + child.lastName : ''}`)
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange(null)
    setQuery('')
    setIsOpen(false)
  }

  const displayValue = value
    ? `${value.firstName}${value.lastName ? ' ' + value.lastName : ''}`
    : query

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!e.target.value) {
              onChange(null)
            }
          }}
          onFocus={() => {
            if (results.length > 0) {
              setIsOpen(true)
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-10"
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {results.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => handleSelect(child)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              <div className="font-medium">
                {child.firstName}
                {child.lastName && ` ${child.lastName}`}
              </div>
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-2 text-sm text-muted-foreground">
          Searching...
        </div>
      )}
    </div>
  )
}

