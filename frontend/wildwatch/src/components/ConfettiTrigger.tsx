"use client"

import { useEffect } from 'react'
import confetti from 'canvas-confetti'

export default function ConfettiTrigger() {
  useEffect(() => {
    const handleTriggerConfetti = () => {
      const duration = 3 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)

        // Gold and maroon colors
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ["#DAA520", "#8B0000", "#FFD700"],
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ["#DAA520", "#8B0000", "#FFD700"],
        })
      }, 250)
    }

    // Listen for the custom event
    window.addEventListener('trigger-confetti', handleTriggerConfetti)

    // Trigger confetti on mount
    handleTriggerConfetti()

    return () => {
      window.removeEventListener('trigger-confetti', handleTriggerConfetti)
    }
  }, [])

  // This component doesn't render anything
  return null
}
