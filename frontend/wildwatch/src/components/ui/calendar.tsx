"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CalendarProps {
  className?: string
  value?: Date | null
  onChange?: (date: Date | null) => void
  disabled?: boolean
  placeholder?: string
}

function Calendar({
  className,
  value,
  onChange,
  disabled,
  placeholder = "Select date",
  ...props
}: CalendarProps) {
  const [date, setDate] = React.useState<Date | null>(value || null)

  React.useEffect(() => {
    setDate(value || null)
  }, [value])

  const handleSelect = (selectedDate: Date) => {
    setDate(selectedDate)
    onChange?.(selectedDate)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="rounded-md border bg-popover p-4">
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div key={day} className="text-muted-foreground">
                {day}
              </div>
            ))}
            {Array.from({ length: 35 }).map((_, i) => {
              const currentDate = new Date()
              const day = i + 1
              const isCurrentMonth = day <= 31
              const isSelected = date && date.getDate() === day && date.getMonth() === currentDate.getMonth()
              
              return (
                <button
                  key={i}
                  className={cn(
                    "h-8 w-8 rounded-full text-sm hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-primary text-primary-foreground",
                    !isCurrentMonth && "text-muted-foreground opacity-50"
                  )}
                  onClick={() => isCurrentMonth && handleSelect(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                  disabled={!isCurrentMonth || disabled}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { Calendar }
