"use client"

import React from "react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  className?: string
}

function DatePicker({ date, setDate, className }: DatePickerProps) {
  return <Calendar mode="single" selected={date} onSelect={setDate} className={cn("w-full", className)} />
}

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

function TimePicker({ value, onChange, className }: TimePickerProps) {
  return <Input type="time" value={value} onChange={(e) => onChange(e.target.value)} className={className} />
}

interface FeedingFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedingFormModal({ open, onOpenChange }: FeedingFormModalProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [time, setTime] = React.useState<string>(format(new Date(), "HH:mm"))
  const [type, setType] = React.useState<string>("Breast")
  const [amount, setAmount] = React.useState<string>("")
  const [unit, setUnit] = React.useState<string>("ml")
  const [duration, setDuration] = React.useState<string>("")
  const [notes, setNotes] = React.useState<string>("")
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
  const router = useRouter()

  // Show/hide fields based on feeding type
  const showAmount = type === "Formula" || type === "Expressed Milk" || type === "Solid"
  const showDuration = type === "Breast"
  const showUnit = type === "Formula" || type === "Expressed Milk" || type === "Solid"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formattedDate = date ? format(date, "yyyy-MM-dd") : ""
      const response = await fetch("/api/feeding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: formattedDate,
          time,
          type,
          amount: amount ? Number.parseFloat(amount) : null,
          unit: showUnit ? unit : null,
          duration: showDuration ? duration : null,
          notes,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Feeding session recorded successfully.",
        })
        // Reset form
        setDate(new Date())
        setTime(format(new Date(), "HH:mm"))
        setType("Breast")
        setAmount("")
        setUnit("ml")
        setDuration("")
        setNotes("")
        // Close modal
        onOpenChange(false)
        // Refresh the page to show the new data
        router.refresh()
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to record feeding session")
      }
    } catch (error) {
      console.error("Error recording feeding session:", error)
      toast({
        title: "Error!",
        description: "Failed to record feeding session. Please try again.",
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
          <DialogTitle>Record Feeding</DialogTitle>
          <DialogDescription>Record a new feeding session for your child.</DialogDescription>
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
                Type
              </Label>
              <div className="col-span-3">
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Breast">Breast</SelectItem>
                    <SelectItem value="Formula">Formula</SelectItem>
                    <SelectItem value="Expressed Milk">Expressed Milk</SelectItem>
                    <SelectItem value="Solid">Solid Food</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {showAmount && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <Input
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  step="0.1"
                  className="col-span-3"
                  required={showAmount}
                />
              </div>
            )}
            {showUnit && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit" className="text-right">
                  Unit
                </Label>
                <div className="col-span-3">
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="oz">oz</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="tbsp">tbsp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {showDuration && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">
                  Duration
                </Label>
                <Input
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 15 minutes"
                  className="col-span-3"
                  required={showDuration}
                />
              </div>
            )}
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

