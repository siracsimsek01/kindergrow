"use client"

import { format } from "date-fns"
import { useRouter } from "next/navigation"
import React from "react"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/time-picker"
import { useAppDispatch } from "@/lib/redux/hooks"
import { setAddEventModalOpen } from "@/lib/redux/slices/uiSlice"

interface EventFormModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EventFormModal({ open, onOpenChange }: EventFormModalProps) {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    const [time, setTime] = React.useState<string>(format(new Date(), "HH:mm"))
    const [title, setTitle] = React.useState<string>("")
    const [description, setDescription] = React.useState<string>("")
    const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
    const router = useRouter()
    const dispatch = useAppDispatch()
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const formattedDate = date ? format(date, "yyyy-MM-dd") : ""
            const response = await fetch("/api/event", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    date: formattedDate,
                    time,
                    title,
                    description,
                }),
            })

            if (response.ok) {
                toast({ title: "Event recorded successfully.", status: "success" })
                // Reset form
                setDate(new Date())
                setTime(format(new Date(), "HH:mm"))
                setTitle("")
                setDescription("")
                // Close modal
                onOpenChange(false)
                // Refresh the page to show the new data
                router.refresh()
            } else {
                const error = await response.json()
                throw new Error(error.message || "Failed to record event")
            }
        } catch (error) {
            console.error("Error recording event:", error)
            toast({ title: "Failed to record event. Please try again.", status: "error" })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(open) => {
                onOpenChange(open)
                if (!open) {
                    dispatch(setAddEventModalOpen(false))
                }
            }}
        >
            <DialogContent className="sm:max-w-[425px] z-[200]">
                <DialogHeader>
                    <DialogTitle>Add Event</DialogTitle>
                    <DialogDescription>Record a new event or milestone for your child.</DialogDescription>
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
              <div className="col-span-3">
                <TimePicker value={time} onChange={setTime} className="w-full" />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about this event..."
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

