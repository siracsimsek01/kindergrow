"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useChildContext } from "@/contexts/child-context"
import { addEvent } from "@/app/actions"
import { DatePicker } from "@/components/ui/date-picker"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAppDispatch } from "@/lib/redux/hooks"
import { triggerRefresh } from "@/lib/redux/slices/eventsSlice"

const formSchema = z.object({
  feedingType: z.enum(["breast", "bottle", "solid"]),
  amount: z.string().optional(),
  date: z.date({
    required_error: "Date is required.",
  }),
  startTime: z.string().min(1, {
    message: "Start time is required.",
  }),
  endTime: z.string().optional(),
  notes: z.string().optional(),
})

export function FeedingFormModal({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const { selectedChild, triggerRefresh: refreshContext } = useChildContext()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  const dispatch = useAppDispatch()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      feedingType: "breast",
      amount: "",
      date: new Date(),
      startTime: format(new Date(), "HH:mm"),
      endTime: format(new Date(Date.now() + 20 * 60000), "HH:mm"), // 20 minutes later
      notes: "",
    },
  })

  const feedingType = form.watch("feedingType")

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.reset({
        feedingType: "breast",
        amount: "",
        date: new Date(),
        startTime: format(new Date(), "HH:mm"),
        endTime: format(new Date(Date.now() + 20 * 60000), "HH:mm"),
        notes: "",
      })
    }
  }, [open, form])

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
      console.log("Submitting feeding data:", values)

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

      const details = `Type: ${values.feedingType}${
        values.amount
          ? `
Amount: ${values.amount}`
          : ""
      }${
        values.notes
          ? `
Notes: ${values.notes}`
          : ""
      }`

      const result = await addEvent({
        childId: selectedChild.id,
        eventType: "feeding",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        details: details,
        value: values.amount ? Number.parseFloat(values.amount) : undefined,
      })

      if (result.success) {
        toast({
          title: "Feeding entry added",
          description: `Feeding entry has been added for ${selectedChild.name}.`,
        })

        // Trigger refresh to update UI immediately
        dispatch(triggerRefresh())
        refreshContext()

        // Reset form and close modal
        form.reset()
        setOpen(false)
      } else {
        throw new Error(result.error || "Failed to add feeding entry")
      }
    } catch (error) {
      console.error("Error adding feeding entry:", error)
      toast({
        title: "Error",
        description: "Failed to add feeding entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] z-[9999]">
        <DialogHeader>
          <DialogTitle>Add Feeding Entry</DialogTitle>
          <DialogDescription>
            {selectedChild ? `Record a new feeding for ${selectedChild.name}` : "Please select a child first"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="feedingType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feeding Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue placeholder="Select feeding type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="breast" className="cursor-pointer">
                        Breast
                      </SelectItem>
                      <SelectItem value="bottle" className="cursor-pointer">
                        Bottle
                      </SelectItem>
                      <SelectItem value="solid" className="cursor-pointer">
                        Solid Food
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(feedingType === "bottle" || feedingType === "solid") && (
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (oz/ml)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 4 oz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <DatePicker date={field.value} setDate={field.onChange} />
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
                      <div className="flex">
                        <Input type="time" {...field} className="cursor-pointer" />
                        <Clock className="ml-2 h-4 w-4 opacity-50 self-center" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <Input type="time" {...field} className="cursor-pointer" />
                        <Clock className="ml-2 h-4 w-4 opacity-50 self-center" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any notes about this feeding..." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || !selectedChild}>
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Adding...
                  </>
                ) : (
                  "Add Feeding"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

