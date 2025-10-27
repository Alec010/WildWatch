"use client"

import { useEffect } from 'react'
import { getWsUrl } from '@/config'

interface BulletinWebSocketProps {
  bulletinId: string
  onUpvoteUpdate: (count: number) => void
}

export function BulletinWebSocket({ bulletinId, onUpvoteUpdate }: BulletinWebSocketProps) {
  useEffect(() => {
    // Only create WebSocket on client-side
    if (typeof window === 'undefined') return;

    const wsUrl = `${getWsUrl()}/ws`
    const socket = new WebSocket(wsUrl)

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'SUBSCRIBE',
        destination: `/topic/bulletins/${bulletinId}/upvotes`
      }))
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.body) {
          const count = parseInt(data.body)
          if (!isNaN(count)) {
            onUpvoteUpdate(count)
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error)
      }
    }

    return () => {
      socket.close()
    }
  }, [bulletinId, onUpvoteUpdate])

  // This component doesn't render anything
  return null
}
