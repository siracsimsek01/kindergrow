"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface DateInputProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  placeholder?: string
}

export function DateInput({ value, onChange, placeholder = "Select date" }: DateInputProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <div className="flex">
        <Input value={value ? format(value, "PPP") : ""} readOnly placeholder={placeholder} className="pr-10" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" type="button">
              <CalendarIcon className="h-4 w-4" />
              <span className="sr-only">Open calendar</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="p-0 sm:max-w-[350px]">
            <DialogHeader className="px-4 pt-4">
              <DialogTitle>Select date</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <Calendar
                mode="single"
                selected={value}
                onSelect={(date) => {
                  onChange(date)
                  setOpen(false)
                }}
                disabled={(date) => {
                  const today = new Date()
                  today.setHours(23, 59, 59, 999)
                  const minDate = new Date("1900-01-01")
                  minDate.setHours(0, 0, 0, 0)
                  return date > today || date < minDate
                }}
                initialFocus
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

