"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import React, { useContext } from "react"
import { useChildContext } from "@/contexts/child-context"

interface GrowthFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GrowthFormModal({ open, onOpenChange }: GrowthFormModalProps) {
  const { selectedChild } = useChildContext();
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [height, setHeight] = React.useState<string>("")
  const [weight, setWeight] = React.useState<string>("")
  const [headCircumference, setHeadCircumference] = React.useState<string>("")
  const [notes, setNotes] = React.useState<string>("")
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formattedDate = date ? format(date, "yyyy-MM-dd") : ""
      const response = await fetch(`api/children/${selectedChild.id}/growth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: formattedDate,
          height: height ? Number.parseFloat(height) : null,
          weight: weight ? Number.parseFloat(weight) : null,
          headCircumference: headCircumference ? Number.parseFloat(headCircumference) : null,
          notes,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Growth metrics recorded successfully.",
        })
        // Reset form
        setDate(new Date())
        setHeight("")
        setWeight("")
        setHeadCircumference("")
        setNotes("")
        // Close modal
        onOpenChange(false)
        // Refresh the page to show the new data
        router.refresh()
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to record growth metrics")
      }
    } catch (error) {
      console.error("Error recording growth metrics:", error)
      toast({
        title: "Error!",
        description: "Failed to record growth metrics. Please try again.",
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
          <DialogTitle>Record Growth Metrics</DialogTitle>
          <DialogDescription>Record new growth measurements for your child.</DialogDescription>
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
              <Label htmlFor="height" className="text-right">
                Height (cm)
              </Label>
              <Input
                id="height"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                type="number"
                step="0.1"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="weight" className="text-right">
                Weight (kg)
              </Label>
              <Input
                id="weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                type="number"
                step="0.1"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="headCircumference" className="text-right">
                Head (cm)
              </Label>
              <Input
                id="headCircumference"
                value={headCircumference}
                onChange={(e) => setHeadCircumference(e.target.value)}
                type="number"
                step="0.1"
                className="col-span-3"
              />
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

