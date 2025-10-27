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

interface MultiUserMentionInputProps {
  onUsersChange: (users: UserSearchResult[]) => void
  selectedUsers: UserSearchResult[]
  placeholder?: string
  disabled?: boolean
  className?: string
  maxUsers?: number // New prop to limit maximum number of users
}

const MultiUserMentionInput: React.FC<MultiUserMentionInputProps> = ({
  onUsersChange,
  selectedUsers,
  placeholder = "Type @ to mention users",
  disabled = false,
  className = "",
  maxUsers
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
          // Filter out already selected users
          const filteredResults = response.content.filter(
            (user: { id: string | number }) => !selectedUsers.some(selected => selected.id === user.id)
          )
          setSearchResults(filteredResults)
          setError(null)
        } else {
          setSearchResults([])
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
    [selectedUsers]
  )

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    // Check if we should allow searching (not at limit, or maxUsers is 1 for replacement)
    const canSearch = !maxUsers || selectedUsers.length < maxUsers || maxUsers === 1

    if (value.startsWith('@') && canSearch) {
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
          addUser(searchResults[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsMentioning(false)
        setSearchResults([])
        break
    }
  }

  // Add a user to the selected users
  const addUser = (user: UserSearchResult) => {
    // Check if we've reached the maximum limit
    if (maxUsers && selectedUsers.length >= maxUsers) {
      // If maxUsers is 1, replace the existing user
      if (maxUsers === 1) {
        onUsersChange([user])
      }
      // Otherwise, don't add if limit is reached
    } else {
      const newSelectedUsers = [...selectedUsers, user]
      onUsersChange(newSelectedUsers)
    }
    
    setIsMentioning(false)
    setSearchResults([])
    setQuery('')
  }

  // Remove a user from selection
  const removeUser = (userId: number) => {
    const newSelectedUsers = selectedUsers.filter(user => user.id !== userId)
    onUsersChange(newSelectedUsers)
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

  const atLimit = !!maxUsers && selectedUsers.length >= maxUsers;

  return (
    <div className="relative w-full">
      {/* Selected users display */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedUsers.map(user => (
            <div 
              key={user.id} 
              className="flex items-center bg-[#800000]/5 border border-[#800000]/20 rounded-md p-1.5 pr-2"
            >
              <div className="bg-[#800000]/10 p-1 rounded-full mr-1.5">
                <User size={12} className="text-[#800000]" />
              </div>
              <span className="text-sm font-medium mr-1">{user.fullName}</span>
              <button
                type="button"
                onClick={() => removeUser(user.id)}
                className="text-gray-500 hover:text-[#800000]"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input field - hidden when atLimit to remove extra space */}
      {!atLimit && (
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
            placeholder={
              maxUsers && selectedUsers.length >= maxUsers
                ? `Maximum ${maxUsers} user${maxUsers > 1 ? 's' : ''} selected`
                : placeholder
            }
            disabled={disabled || (!!maxUsers && selectedUsers.length >= maxUsers)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] disabled:bg-gray-50 disabled:text-gray-500"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 size={16} className="animate-spin text-gray-400" />
            </div>
          )}
        </div>
      )}

      {/* Dropdown results */}
      {!atLimit && isMentioning && searchResults.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-y-auto"
        >
          <ul className="py-1">
            {searchResults.map((user, index) => (
              <li
                key={user.id}
                data-index={index}
                onClick={() => addUser(user)}
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
      {!atLimit && isMentioning && query.length > 1 && !loading && searchResults.length === 0 && (
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

export default MultiUserMentionInput
