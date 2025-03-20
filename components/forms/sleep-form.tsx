"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useChildContext } from "@/contexts/child-context"
import { addEvent } from "@/app/actions"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAppDispatch } from "@/lib/redux/hooks"
import { triggerRefresh } from "@/lib/redux/slices/eventsSlice"

const formSchema = z.object({
  date: z.date({
    required_error: "Date is required.",
  }),
  startTime: z.string().min(1, {
    message: "Start time is required.",
  }),
  endTime: z.string().min(1, {
    message: "End time is required.",
  }),
  quality: z.enum(["good", "fair", "poor"]).optional(),
  notes: z.string().optional(),
})

interface SleepFormProps {
  onSuccess?: () => void
}

export function SleepForm({ onSuccess }: SleepFormProps) {
  const { toast } = useToast()
  const { selectedChild } = useChildContext()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dispatch = useAppDispatch()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      startTime: format(new Date(), "HH:mm"),
      endTime: format(new Date(Date.now() + 2 * 60 * 60000), "HH:mm"), // 2 hours later
      quality: "good",
      notes: "",
    },
  })

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
      setError(null)
      console.log("Submitting sleep data:", values)

      // Format date and times
      const date = values.date
      const startTime = new Date(date)
      const endTime = new Date(date)

      if (values.startTime) {
        const [hours, minutes] = values.startTime.split(":").map(Number)
        startTime.setHours(hours, minutes, 0, 0)
      }

      if (values.endTime) {
        const [hours, minutes] = values.endTime.split(":").map(Number)
        endTime.setHours(hours, minutes, 0, 0)

        // If end time is earlier than start time, assume it's the next day
        if (endTime < startTime) {
          endTime.setDate(endTime.getDate() + 1)
        }
      }

      const details = `Quality: ${values.quality || "Not specified"}${values.notes ? `\nNotes: ${values.notes}` : ""}`

      const result = await addEvent({
        childId: selectedChild.id,
        eventType: "sleeping",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        details: details,
      })

      if (result.success) {
        toast({
          title: "Sleep entry added",
          description: `Sleep entry has been added for ${selectedChild.name}.`,
        })

        // Trigger refresh to update UI
        dispatch(triggerRefresh())

        // Reset form
        form.reset()

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess()
        }
      } else {
        throw new Error(result.error || "Failed to add sleep entry")
      }
    } catch (error: any) {
      console.error("Error adding sleep entry:", error)
      setError(error.message || "Failed to add sleep entry")
      toast({
        title: "Error",
        description: error.message || "Failed to add sleep entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
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
                      className={cn(
                        "w-full pl-3 text-left font-normal cursor-pointer",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <Clock className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                    <div onClick={(e) => e.stopPropagation()} className="z-[9999] relative">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) field.onChange(date)
                        }}
                        initialFocus
                        className="z-[9999] pointer-events-auto"
                      />
                    </div>
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
                <FormDescription className="text-xs">
                  If end time is earlier than start time, it will be considered as the next day.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="quality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sleep Quality</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Select sleep quality" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="z-[9999]">
                  <SelectItem value="good" className="cursor-pointer">
                    Good
                  </SelectItem>
                  <SelectItem value="fair" className="cursor-pointer">
                    Fair
                  </SelectItem>
                  <SelectItem value="poor" className="cursor-pointer">
                    Poor
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Add any notes about this sleep session..." className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !selectedChild}>
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Adding...
              </>
            ) : (
              "Add Sleep Entry"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

