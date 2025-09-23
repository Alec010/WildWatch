'use client'

import { useEffect, useState } from 'react'
import Chatbot from './Chatbot'

export default function ClientChatbot() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return <Chatbot />
}

