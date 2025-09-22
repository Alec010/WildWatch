'use client'

import { useState, useEffect } from 'react'
import MentionInput from './MentionInput'
import { User } from 'lucide-react'

interface UserSearchResult {
  id: number
  firstName: string
  lastName: string
  fullName: string
  email: string
  schoolIdNumber: string
}

interface ClientMentionInputProps {
  onUserSelect: (user: UserSearchResult | null) => void
  selectedUser: UserSearchResult | null
  placeholder?: string
  disabled?: boolean
  className?: string
}

export default function ClientMentionInput(props: ClientMentionInputProps) {
  // This ensures the component only renders on the client
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    // Return a placeholder with similar dimensions to avoid layout shift
    return (
      <div className={`relative w-full ${props.className}`}>
        <div className="border border-gray-300 rounded-md p-2 flex items-center gap-2 bg-gray-50">
          <User className="h-4 w-4 text-gray-400" />
          <span className="text-gray-400">Loading user selection...</span>
        </div>
      </div>
    )
  }

  return <MentionInput {...props} />
}
