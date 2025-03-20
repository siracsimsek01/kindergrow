"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [hours, setHours] = useState<string>("00")
  const [minutes, setMinutes] = useState<string>("00")

  // Initialize hours and minutes from value
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":")
      setHours(h)
      setMinutes(m)
    }
  }, [value])

  const handleSetTime = () => {
    // Ensure hours and minutes are valid
    const h = Math.max(0, Math.min(23, Number.parseInt(hours) || 0))
      .toString()
      .padStart(2, "0")
    const m = Math.max(0, Math.min(59, Number.parseInt(minutes) || 0))
      .toString()
      .padStart(2, "0")

    onChange(`${h}:${m}`)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground", className)}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value || "Select time"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 z-[102]" align="start">
        <div className="flex items-center space-x-2">
          <Input
            className="w-[4rem]"
            value={hours}
            onChange={(e) => {
              const val = e.target.value
              if (/^\d{0,2}$/.test(val)) {
                setHours(val)
              }
            }}
            onBlur={() => {
              const h = Number.parseInt(hours)
              if (!isNaN(h)) {
                setHours(Math.max(0, Math.min(23, h)).toString().padStart(2, "0"))
              } else {
                setHours("00")
              }
            }}
          />
          <span>:</span>
          <Input
            className="w-[4rem]"
            value={minutes}
            onChange={(e) => {
              const val = e.target.value
              if (/^\d{0,2}$/.test(val)) {
                setMinutes(val)
              }
            }}
            onBlur={() => {
              const m = Number.parseInt(minutes)
              if (!isNaN(m)) {
                setMinutes(Math.max(0, Math.min(59, m)).toString().padStart(2, "0"))
              } else {
                setMinutes("00")
              }
            }}
          />
          <Button type="button" onClick={handleSetTime}>
            Set
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

