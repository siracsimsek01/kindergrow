"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useAppSelector } from "@/lib/redux/hooks"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  diaperType: z.string(),
  notes: z.string().optional(),
  date: z.date(),
  time: z.string(),
})

type DiaperFormValues = z.infer<typeof formSchema>

interface DiaperFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function DiaperForm({ onSuccess, onCancel }: DiaperFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const selectedChild = useAppSelector((state) => state.children.selectedChild)
  const queryClient = useQueryClient()

  const defaultValues: Partial<DiaperFormValues> = {
    diaperType: "wet",
    notes: "",
    date: new Date(),
    time: format(new Date(), "HH:mm"),
  }

  const form = useForm<DiaperFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  async function onSubmit(values: DiaperFormValues) {
    if (!selectedChild) {
      toast({
        title: "No child selected",
        description: "Please select a child first",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const dateTime = new Date(values.date)
      const [hours, minutes] = values.time.split(":").map(Number)
      dateTime.setHours(hours, minutes)

      const eventData = {
        childId: selectedChild.id,
        eventType: "diaper",
        details: `Type: ${values.diaperType}${values.notes ? `\nNotes: ${values.notes}` : ""}`,
        timestamp: dateTime.toISOString(),
      }

      console.log("Submitting diaper event:", eventData)

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Server error:", errorData)
        throw new Error(errorData.message || "Failed to add diaper event")
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["events"] })
      queryClient.invalidateQueries({ queryKey: ["events", selectedChild.id] })

      toast({
        title: "Success",
        description: "Diaper change recorded successfully",
      })

      form.reset(defaultValues)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error adding diaper event:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record diaper change",
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
          name="diaperType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Diaper Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select diaper type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent position="popper" className="z-[99999]">
                  <SelectItem value="wet" className="cursor-pointer">
                    Wet
                  </SelectItem>
                  <SelectItem value="dirty" className="cursor-pointer">
                    Dirty
                  </SelectItem>
                  <SelectItem value="both" className="cursor-pointer">
                    Both
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[99999]" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => {
                        const today = new Date()
                        today.setHours(23, 59, 59, 999)
                        const minDate = new Date("1900-01-01")
                        minDate.setHours(0, 0, 0, 0)
                        return date > today || date < minDate
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time</FormLabel>
                <FormControl>
                  <input
                    type="time"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                  />
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
                <Textarea placeholder="Add any additional notes here" className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LoadingSpinner /> : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

