"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, Sparkles } from 'lucide-react'

interface BadgeCelebrationProps {
  isVisible: boolean
  badgeName: string
  onComplete?: () => void
}

export function BadgeCelebration({ isVisible, badgeName, onComplete }: BadgeCelebrationProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onAnimationComplete={() => {
            setTimeout(() => {
              onComplete?.()
            }, 3000)
          }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500 rounded-2xl p-8 shadow-2xl border-4 border-yellow-300"
          >
            {/* Sparkles Animation */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: Math.random() * 400 - 200, 
                    y: Math.random() * 400 - 200,
                    scale: 0,
                    opacity: 0
                  }}
                  animate={{ 
                    x: Math.random() * 400 - 200, 
                    y: Math.random() * 400 - 200,
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    delay: Math.random() * 0.5,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 2
                  }}
                  className="absolute"
                >
                  <Sparkles size={16} className="text-white" />
                </motion.div>
              ))}
            </div>

            {/* Main Content */}
            <div className="relative z-10 text-center">
              {/* Trophy Icon */}
              <motion.div
                initial={{ y: -50, scale: 0 }}
                animate={{ y: 0, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mb-4"
              >
                <Trophy size={80} className="text-white mx-auto drop-shadow-lg" />
              </motion.div>

              {/* Badge Name */}
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-white mb-2 drop-shadow-lg"
              >
                Badge Claimed!
              </motion.h2>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xl text-white/90 mb-4 drop-shadow"
              >
                {badgeName}
              </motion.p>

              {/* Stars */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
                className="flex justify-center gap-2"
              >
                {[1, 2, 3].map((star) => (
                  <motion.div
                    key={star}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.8 + star * 0.1, type: 'spring', stiffness: 200 }}
                  >
                    <Star size={32} className="text-white fill-white drop-shadow-lg" />
                  </motion.div>
                ))}
              </motion.div>

              {/* Congratulations Text */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-lg text-white/80 mt-4 drop-shadow"
              >
                Congratulations! 🎉
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}





