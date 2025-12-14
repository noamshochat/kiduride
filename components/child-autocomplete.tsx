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
  activity?: 'kidu' | 'tennis' | null // Filter children by activity registration
}

export function ChildAutocomplete({
  value,
  onChange,
  placeholder = 'Search for a child...',
  className = '',
  disabled = false,
  activity = null,
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
      setIsOpen(false) // Close dropdown while searching
      try {
        console.log('Searching children with query:', query, 'activity:', activity)
        const children = await supabaseDb.searchChildren(query, activity)
        console.log('Search results:', children)
        setResults(children)
        setIsOpen(children.length > 0)
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
  }, [query, activity])

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

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            const newQuery = e.target.value
            setQuery(newQuery)
            if (!newQuery) {
              onChange(null)
            } else {
              // Clear value when user starts typing something different from the selected value
              if (value) {
                const valueDisplay = `${value.firstName}${value.lastName ? ' ' + value.lastName : ''}`
                if (newQuery !== valueDisplay) {
                  onChange(null)
                }
              }
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
        {value && query === `${value.firstName}${value.lastName ? ' ' + value.lastName : ''}` && (
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

