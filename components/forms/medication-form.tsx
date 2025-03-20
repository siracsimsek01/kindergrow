"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Clock } from 'lucide-react'

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { addEventAsync } from "@/lib/redux/slices/eventsSlice"
import { Textarea } from "@/components/ui/textarea"

const formSchema = z.object({
  time: z.date({
    required_error: "Time is required.",
  }),
  name: z.string().min(1, {
    message: "Medication name is required.",
  }),
  dosage: z.string().min(1, {
    message: "Dosage is required.",
  }),
  reason: z.string().optional(),
  notes: z.string().optional(),
})

interface MedicationFormProps {
  onSuccess?: () => void
}

export function MedicationForm({ onSuccess }: MedicationFormProps) {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const selectedChild = useAppSelector((state) => state.children.selectedChild)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      time: new Date(),
      name: "",
      dosage: "",
      reason: "",
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
      console.log("Submitting medication data:", values)

      const resultAction = await dispatch(
        addEventAsync({
          childId: selectedChild.id,
          type: "medication",
          data: {
            time: values.time.toISOString(),
            name: values.name,
            dosage: values.dosage,
            reason: values.reason || "",
            notes: values.notes || "",
          },
        })
      )

      if (addEventAsync.fulfilled.match(resultAction)) {
        toast({
          title: "Medication record added",
          description: `Medication record has been added successfully.`,
        })

        // Reset form
        form.reset({
          time: new Date(),
          name: "",
          dosage: "",
          reason: "",
          notes: "",
        })

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess()
        }
      } else {
        throw new Error("Failed to add medication record")
      }
    } catch (error) {
      console.error("Error adding medication record:", error)
      toast({
        title: "Error",
        description: "Failed to add medication record. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Time</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? format(field.value, "PPP HH:mm") : <span>Select date and time</span>}
                      <Clock className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      if (date) {
                        const currentDate = field.value || new Date()
                        date.setHours(currentDate.getHours())
                        date.setMinutes(currentDate.getMinutes())
                        field.onChange(date)
                      }
                    }}
                    initialFocus
                  />
                  <div className="p-3 border-t border-border">
                    <Input
                      type="time"
                      value={format(field.value || new Date(), "HH:mm")}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(":")
                        const newDate = new Date(field.value || new Date())
                        newDate.setHours(parseInt(hours))
                        newDate.setMinutes(parseInt(minutes))
                        field.onChange(newDate)
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
              <FormDescription>When was the medication given?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medication Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter medication name" {...field} />
                </FormControl>
                <FormDescription>Name of the medication</FormDescription>
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
                  <Input placeholder="e.g., 5ml, 1 tablet" {...field} />
                </FormControl>
                <FormDescription>Amount of medication given</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Input placeholder="Reason for medication" {...field} />
              </FormControl>
              <FormDescription>Why was the medication given?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional notes about the medication"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional notes about the medication</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            "Save Medication Record"
          )}
        </Button>
      </form>
    </Form>
  )
}