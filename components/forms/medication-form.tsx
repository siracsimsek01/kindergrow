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
import { Switch } from "@/components/ui/switch"
import { DatePicker } from "@/components/ui/date-picker"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Medication name is required.",
  }),
  dosage: z.string().min(1, {
    message: "Dosage is required.",
  }),
  date: z.date({
    required_error: "Date is required.",
  }),
  time: z.string().min(1, {
    message: "Time is required.",
  }),
  frequency: z.enum(["once", "daily", "twice-daily", "three-times-daily", "as-needed"]),
  instructions: z.string().optional(),
  isRecurring: z.boolean().default(false),
  endDate: z.date().optional(),
})

export function MedicationForm({ onSuccess }: { onSuccess?: () => void }) {
  const { toast } = useToast()
  const { selectedChild } = useChildContext()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      dosage: "",
      date: new Date(),
      time: format(new Date(), "HH:mm"),
      frequency: "once",
      instructions: "",
      isRecurring: false,
    },
  })

  const isRecurring = form.watch("isRecurring")

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
      console.log("Submitting medication data:", values)

      // Format date and time
      const date = values.date
      const time = values.time
      const [hours, minutes] = time.split(":").map(Number)
      const startTime = new Date(date)
      startTime.setHours(hours, minutes)

      const details = `Medication: ${values.name}
Dosage: ${values.dosage}
Frequency: ${values.frequency}
${values.instructions ? `Instructions: ${values.instructions}` : ""}`

      // Try to parse the dosage as a number if possible
      let dosageValue = 0
      const numericDosage = Number.parseFloat(values.dosage)
      if (!isNaN(numericDosage)) {
        dosageValue = numericDosage
      }

      const result = await addEvent({
        childId: selectedChild.id,
        eventType: "medication",
        startTime: startTime.toISOString(),
        endTime: startTime.toISOString(),
        details: details,
        value: dosageValue,
      })

      if (result.success) {
        toast({
          title: "Medication added",
          description: `${values.name} has been added for ${selectedChild.name}.`,
        })

        // Reset form
        form.reset({
          name: "",
          dosage: "",
          date: new Date(),
          time: format(new Date(), "HH:mm"),
          frequency: "once",
          instructions: "",
          isRecurring: false,
        })

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess()
        }
      } else {
        throw new Error(result.error || "Failed to add medication")
      }
    } catch (error) {
      console.error("Error adding medication:", error)
      toast({
        title: "Error",
        description: "Failed to add medication. Please try again.",
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medication Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter medication name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dosage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dosage</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 5ml, 10mg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Start Date</FormLabel>
                <DatePicker date={field.value} setDate={field.onChange} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Time</FormLabel>
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
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frequency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent position="popper" className="z-[99999]">
                  <SelectItem value="once" className="cursor-pointer">
                    Once
                  </SelectItem>
                  <SelectItem value="daily" className="cursor-pointer">
                    Daily
                  </SelectItem>
                  <SelectItem value="twice-daily" className="cursor-pointer">
                    Twice Daily
                  </SelectItem>
                  <SelectItem value="three-times-daily" className="cursor-pointer">
                    Three Times Daily
                  </SelectItem>
                  <SelectItem value="as-needed" className="cursor-pointer">
                    As Needed
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isRecurring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Recurring Medication</FormLabel>
                <FormDescription>Is this a recurring medication?</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} className="cursor-pointer" />
              </FormControl>
            </FormItem>
          )}
        />

        {isRecurring && (
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date (Optional)</FormLabel>
                <DatePicker date={field.value} setDate={field.onChange} />
                <FormDescription>When should this medication end? Leave blank if ongoing.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Add any special instructions here..." className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !selectedChild}>
            {isSubmitting ? "Adding..." : "Add Medication"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

