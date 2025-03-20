"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { addEvent } from "@/app/actions"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { triggerRefresh } from "@/lib/redux/slices/eventsSlice"

const formSchema = z.object({
  eventType: z.enum(["feeding", "sleeping", "diaper", "growth", "medication", "temperature"]),
  date: z.date({
    required_error: "Date is required.",
  }),
  startTime: z.string().min(1, {
    message: "Start time is required.",
  }),
  endTime: z.string().optional(),
  details: z.string().optional(),
  value: z.string().optional(),
})

interface AddEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddEventModal({ open, onOpenChange }: AddEventModalProps) {
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const selectedChild = useAppSelector((state) => state.children.selectedChild)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventType: "feeding",
      date: new Date(),
      startTime: format(new Date(), "HH:mm"),
      endTime: format(new Date(), "HH:mm"),
      details: "",
      value: "",
    },
  })

  const eventType = form.watch("eventType")

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!selectedChild) {
      toast({
        title: "Error",
        description: "Please select a child first.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      console.log("Submitting event data:", values)

      // Format date and times
      const date = values.date
      const startTime = new Date(date)
      const endTime = new Date(date)

      if (values.startTime) {
        const [hours, minutes] = values.startTime.split(":").map(Number)
        startTime.setHours(hours, minutes)
      }

      if (values.endTime) {
        const [hours, minutes] = values.endTime.split(":").map(Number)
        endTime.setHours(hours, minutes)
      }

      const result = await addEvent({
        childId: selectedChild.id,
        eventType: values.eventType,
        startTime: startTime.toISOString(),
        endTime: values.endTime ? endTime.toISOString() : startTime.toISOString(),
        details: values.details || "",
        value: values.value ? Number.parseFloat(values.value) : undefined,
      })

      if (result.success) {
        toast({
          title: "Event added",
          description: `${values.eventType} event has been added for ${selectedChild.name}.`,
        })

        // Refresh data
        dispatch(triggerRefresh())

        // Reset form and close modal
        form.reset({
          eventType: "feeding",
          date: new Date(),
          startTime: format(new Date(), "HH:mm"),
          endTime: format(new Date(), "HH:mm"),
          details: "",
          value: "",
        })
        onOpenChange(false)
      } else {
        throw new Error(result.error || "Failed to add event")
      }
    } catch (error) {
      console.error("Error adding event:", error)
      toast({
        title: "Error",
        description: "Failed to add event. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] z-[9999]">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription>Record a new event for your child.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[9999]">
                      <SelectItem value="feeding" className="cursor-pointer">
                        Feeding
                      </SelectItem>
                      <SelectItem value="sleeping" className="cursor-pointer">
                        Sleep
                      </SelectItem>
                      <SelectItem value="diaper" className="cursor-pointer">
                        Diaper
                      </SelectItem>
                      <SelectItem value="growth" className="cursor-pointer">
                        Growth
                      </SelectItem>
                      <SelectItem value="medication" className="cursor-pointer">
                        Medication
                      </SelectItem>
                      <SelectItem value="temperature" className="cursor-pointer">
                        Temperature
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <DatePicker date={field.value} setDate={field.onChange} className="z-[9999]" />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} className="cursor-pointer" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(eventType === "sleeping" || eventType === "feeding") && (
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} className="cursor-pointer" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {(eventType === "feeding" ||
              eventType === "growth" ||
              eventType === "medication" ||
              eventType === "temperature") && (
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {eventType === "feeding"
                        ? "Amount (oz/ml)"
                        : eventType === "growth"
                          ? "Measurement"
                          : eventType === "temperature"
                            ? "Temperature"
                            : "Dosage"}
                    </FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} className="cursor-pointer" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any additional details here..." {...field} className="cursor-pointer" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || !selectedChild} className="cursor-pointer">
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Adding...
                  </>
                ) : (
                  "Add Event"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

