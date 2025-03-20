"use client"

import { format } from "date-fns"
import { useRouter } from "next/navigation"
import React from "react"
import { toast } from "@/components/ui/use-toast"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/time-picker"
import { Loader2 } from "lucide-react"

interface MedicationFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MedicationFormModal({ open, onOpenChange }: MedicationFormModalProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [time, setTime] = React.useState<string>(format(new Date(), "HH:mm"))
  const [medication, setMedication] = React.useState<string>("")
  const [dosage, setDosage] = React.useState<string>("")
  const [unit, setUnit] = React.useState<string>("mg")
  const [reason, setReason] = React.useState<string>("")
  const [notes, setNotes] = React.useState<string>("")
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formattedDate = date ? format(date, "yyyy-MM-dd") : ""
      const response = await fetch("/api/medication", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: formattedDate,
          time,
          medication,
          dosage: dosage ? Number.parseFloat(dosage) : null,
          unit,
          reason,
          notes,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Medication recorded successfully.",
        })
        // Reset form
        setDate(new Date())
        setTime(format(new Date(), "HH:mm"))
        setMedication("")
        setDosage("")
        setUnit("mg")
        setReason("")
        setNotes("")
        // Close modal
        onOpenChange(false)
        // Refresh the page to show the new data
        router.refresh()
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to record medication")
      }
    } catch (error) {
      console.error("Error recording medication:", error)
      toast({
        title: "Error!",
        description: "Failed to record medication. Please try again.",
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
          <DialogTitle>Record Medication</DialogTitle>
          <DialogDescription>Record a new medication for your child.</DialogDescription>
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
              <Label htmlFor="medication" className="text-right">
                Medication
              </Label>
              <Input
                id="medication"
                value={medication}
                onChange={(e) => setMedication(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dosage" className="text-right">
                Dosage
              </Label>
              <Input
                id="dosage"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                type="number"
                step="0.1"
                className="col-span-3"
              />
            </div>
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
                    <SelectItem value="mg">mg</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="drops">drops</SelectItem>
                    <SelectItem value="tablets">tablets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Reason
              </Label>
              <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} className="col-span-3" />
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

