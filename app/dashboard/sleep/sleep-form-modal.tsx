"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/time-picker"
import { format, addHours } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import React from "react"

interface SleepFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SleepFormModal({ open, onOpenChange }: SleepFormModalProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = React.useState<string>(format(new Date(), "HH:mm"))
  const [endTime, setEndTime] = React.useState<string>(format(addHours(new Date(), 1), "HH:mm"))
  const [duration, setDuration] = React.useState<string>("")
  const [quality, setQuality] = React.useState<string>("Good")
  const [notes, setNotes] = React.useState<string>("")
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
  const router = useRouter()

  // Calculate duration when start or end time changes
  React.useEffect(() => {
    if (startTime && endTime) {
      const [startHour, startMinute] = startTime.split(":").map(Number)
      const [endHour, endMinute] = endTime.split(":").map(Number)

      let durationMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute)

      // Handle overnight sleep
      if (durationMinutes < 0) {
        durationMinutes += 24 * 60
      }

      const hours = Math.floor(durationMinutes / 60)
      const minutes = durationMinutes % 60

      setDuration(`${hours}h ${minutes}m`)
    }
  }, [startTime, endTime])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formattedDate = date ? format(date, "yyyy-MM-dd") : ""
      const response = await fetch("/api/sleep", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: formattedDate,
          startTime,
          endTime,
          duration,
          quality,
          notes,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Sleep session recorded successfully.",
        })
        // Reset form
        setDate(new Date())
        setStartTime(format(new Date(), "HH:mm"))
        setEndTime(format(addHours(new Date(), 1), "HH:mm"))
        setQuality("Good")
        setNotes("")
        // Close modal
        onOpenChange(false)
        // Refresh the page to show the new data
        router.refresh()
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to record sleep session")
      }
    } catch (error) {
      console.error("Error recording sleep session:", error)
      toast({
        title: "Error!",
        description: "Failed to record sleep session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Sleep Session</DialogTitle>
          <DialogDescription>Record a new sleep session for your child.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <div className="col-span-3">
                <DatePicker date={date} setDate={setDate} className="w-full" />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">
                Start Time
              </Label>
              <div className="col-span-3">
                <TimePicker value={startTime} onChange={setStartTime} className="w-full" />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">
                End Time
              </Label>
              <div className="col-span-3">
                <TimePicker value={endTime} onChange={setEndTime} className="w-full" />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Duration
              </Label>
              <Input id="duration" value={duration} readOnly className="col-span-3 bg-muted" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quality" className="text-right">
                Quality
              </Label>
              <div className="col-span-3">
                <Select value={quality} onValueChange={setQuality}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Poor">Poor</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional details here..."
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

