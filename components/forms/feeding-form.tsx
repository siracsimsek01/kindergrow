"use client"

import type React from "react"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useChildContext } from "@/contexts/child-context"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

const formSchema = z.object({
  feedingType: z.enum(["breast", "formula", "solid", "other"]),
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

interface FeedingFormProps {
  onSuccess?: () => void
  children?: React.ReactNode
}

export function FeedingForm({ onSuccess, children }: FeedingFormProps) {
  const { toast } = useToast()
  const { selectedChild, triggerRefresh } = useChildContext()
  const [isSubmitting, setIsSubmitting] = useState(false)

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

      // Create feeding entry via API
      const response = await fetch(`/api/children/${selectedChild.id}/feeding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          method: values.feedingType,
          amount: values.amount ? Number.parseFloat(values.amount) : 0,
          notes: details || "",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save feeding entry")
      }

      toast({
        title: "Feeding entry added",
        description: `Feeding entry has been added for ${selectedChild.name}.`,
      })

      // Trigger refresh to update UI
      triggerRefresh()

      // Reset form
      form.reset({
        feedingType: "breast",
        amount: "",
        date: new Date(),
        startTime: format(new Date(), "HH:mm"),
        endTime: format(new Date(Date.now() + 20 * 60000), "HH:mm"),
        notes: "",
      })

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
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
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select feeding type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent position="popper" className="z-[99999]">
                  <SelectItem value="breast">Breast</SelectItem>
                  <SelectItem value="formula">Formula</SelectItem>
                  <SelectItem value="solid">Solid Food</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {(feedingType === "formula" || feedingType === "other") && (
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
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <div className="relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <Clock className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[99999]" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className="z-[99999]"
                    />
                  </PopoverContent>
                </Popover>
              </div>
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
                    <Input type="time" {...field} />
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
                    <Input type="time" {...field} />
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

        <Button type="submit" disabled={isSubmitting || !selectedChild} className="w-full">
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Adding...
            </>
          ) : (
            "Add Feeding"
          )}
        </Button>
      </form>
    </Form>
  )
}

