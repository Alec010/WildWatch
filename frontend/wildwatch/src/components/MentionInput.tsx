'use client'

import React, { useState, useEffect, useRef, KeyboardEvent, useCallback } from 'react'
import { searchUsers } from '@/utils/api'
import debounce from 'lodash/debounce'
import { User, Loader2, X } from 'lucide-react'

interface UserSearchResult {
  id: number
  firstName: string
  lastName: string
  fullName: string
  email: string
  schoolIdNumber: string
}

interface MentionInputProps {
  onUserSelect: (user: UserSearchResult | null) => void
  selectedUser: UserSearchResult | null
  placeholder?: string
  disabled?: boolean
  className?: string
}

const MentionInput: React.FC<MentionInputProps> = ({
  onUserSelect,
  selectedUser,
  placeholder = "Type @ to mention a user",
  disabled = false,
  className = ""
}) => {
  const [query, setQuery] = useState<string>('')
  const [isMentioning, setIsMentioning] = useState<boolean>(false)
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setSearchResults([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response = await searchUsers(searchQuery)
        
        // Check if we have results
        if (response && response.content) {
          setSearchResults(response.content)
          setError(null)
        } else {
          setSearchResults([])
          // Don't show error for empty results
          setError(null)
        }
      } catch (err) {
        console.error('Error searching users:', err)
        setSearchResults([])
        setError('Failed to search users')
      } finally {
        setLoading(false)
      }
    }, 300),
    []
  )

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    if (value.startsWith('@')) {
      setIsMentioning(true)
      const searchQuery = value.substring(1).trim() // Remove @ and trim
      if (searchQuery) {
        debouncedSearch(searchQuery)
      } else {
        setSearchResults([])
      }
    } else {
      setIsMentioning(false)
      setSearchResults([])
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isMentioning || searchResults.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % searchResults.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length)
        break
      case 'Enter':
        e.preventDefault()
        if (searchResults[selectedIndex]) {
          selectUser(searchResults[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsMentioning(false)
        setSearchResults([])
        break
    }
  }

  // Select a user from results
  const selectUser = (user: UserSearchResult) => {
    onUserSelect(user)
    setIsMentioning(false)
    setSearchResults([])
    setQuery(`@${user.fullName}`)
  }

  // Clear selection
  const clearSelection = () => {
    onUserSelect(null)
    setQuery('')
    setIsMentioning(false)
    setSearchResults([])
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  // Scroll selected item into view
  useEffect(() => {
    if (isMentioning && resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex, isMentioning])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current && 
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsMentioning(false)
        setSearchResults([])
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative w-full">
      {/* Input field */}
      {!selectedUser ? (
        <div className={`relative ${className}`}>
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <span className="text-gray-400">@</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000]"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 size={16} className="animate-spin text-gray-400" />
            </div>
          )}
        </div>
      ) : (
        <div className={`flex items-center border border-[#800000]/20 bg-[#800000]/5 rounded-md p-2 ${className}`}>
          <div className="bg-[#800000]/10 p-1.5 rounded-full mr-2">
            <User size={16} className="text-[#800000]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-800 truncate">{selectedUser.fullName}</div>
            <div className="text-xs text-gray-500 truncate">{selectedUser.email}</div>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="ml-2 p-1 rounded-full hover:bg-[#800000]/10 text-gray-500 hover:text-[#800000]"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Dropdown results */}
      {isMentioning && searchResults.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-y-auto"
        >
          <ul className="py-1">
            {searchResults.map((user, index) => (
              <li
                key={user.id}
                data-index={index}
                onClick={() => selectUser(user)}
                className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
                  selectedIndex === index ? 'bg-[#800000]/10' : 'hover:bg-gray-50'
                }`}
              >
                <div className="bg-gray-100 p-1.5 rounded-full">
                  <User size={14} className="text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800">{user.fullName}</div>
                  <div className="text-xs text-gray-500 truncate">{user.email}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No results message */}
      {isMentioning && query.length > 1 && !loading && searchResults.length === 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 p-3 text-center">
          <p className="text-gray-500 text-sm">No users found matching "{query.substring(1)}"</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-1 text-xs text-red-500">{error}</div>
      )}
    </div>
  )
}

export default MentionInput