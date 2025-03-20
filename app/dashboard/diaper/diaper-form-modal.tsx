"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/time-picker"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import React from "react"

interface DiaperFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DiaperFormModal({ open, onOpenChange }: DiaperFormModalProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [time, setTime] = React.useState<string>(format(new Date(), "HH:mm"))
  const [type, setType] = React.useState<string>("Wet")
  const [notes, setNotes] = React.useState<string>("")
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formattedDate = date ? format(date, "yyyy-MM-dd") : ""
      const response = await fetch("/api/diaper", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: formattedDate,
          time,
          type,
          notes,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Diaper change recorded successfully.",
        })
        // Reset form
        setDate(new Date())
        setTime(format(new Date(), "HH:mm"))
        setType("Wet")
        setNotes("")
        // Close modal
        onOpenChange(false)
        // Refresh the page to show the new data
        router.refresh()
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to record diaper change")
      }
    } catch (error) {
      console.error("Error recording diaper change:", error)
      toast({
        title: "Error!",
        description: "Failed to record diaper change. Please try again.",
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
          <DialogTitle>Record Diaper Change</DialogTitle>
          <DialogDescription>Record a new diaper change for your child.</DialogDescription>
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
              <Label htmlFor="time" className="text-right">
                Time
              </Label>
              <div className="col-span-3">
                <TimePicker value={time} onChange={setTime} className="w-full" />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Diaper Type
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="wet" checked={type === "Wet"} onCheckedChange={() => setType("Wet")} />
                  <Label htmlFor="wet" className="cursor-pointer">
                    Wet
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="dirty" checked={type === "Dirty"} onCheckedChange={() => setType("Dirty")} />
                  <Label htmlFor="dirty" className="cursor-pointer">
                    Dirty
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="both" checked={type === "Both"} onCheckedChange={() => setType("Both")} />
                  <Label htmlFor="both" className="cursor-pointer">
                    Both
                  </Label>
                </div>
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

