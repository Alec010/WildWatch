"use client"

import { useState, memo } from "react"
import { Star, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface RatingDimensionProps {
  name: string
  label: string
  description: string
  value: number | null
  onChange: (value: number) => void
  disabled?: boolean
}

export const RatingDimension = memo(function RatingDimension({ 
  name, 
  label, 
  description, 
  value, 
  onChange, 
  disabled = false 
}: RatingDimensionProps) {
  const [hoveredStar, setHoveredStar] = useState<number>(0)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !disabled && onChange(star)}
            onMouseEnter={() => !disabled && setHoveredStar(star)}
            onMouseLeave={() => !disabled && setHoveredStar(0)}
            disabled={disabled}
            className={`focus:outline-none transition-colors ${
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= (hoveredStar || value || 0)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
      
      {value && (
        <div className="text-center text-sm text-gray-600">
          {value}/5 stars ({value} point{value !== 1 ? 's' : ''})
        </div>
      )}
    </div>
  )
})

