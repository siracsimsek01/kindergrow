"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon } from 'lucide-react'

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
import { useChildContext } from "@/contexts/child-context"
import { Textarea } from "@/components/ui/textarea"

const formSchema = z.object({
  date: z.date({
    required_error: "Date is required.",
  }),
  weight: z.coerce.number().min(0, {
    message: "Weight must be a positive number.",
  }),
  height: z.coerce.number().min(0, {
    message: "Height must be a positive number.",
  }),
  headCircumference: z.coerce.number().min(0, {
    message: "Head circumference must be a positive number.",
  }),
  notes: z.string().optional(),
})

export function GrowthForm({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const { selectedChild } = useChildContext()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      weight: 0,
      height: 0,
      headCircumference: 0,
      notes: "",
    },
  })

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.reset({
        date: new Date(),
        weight: 0,
        height: 0,
        headCircumference: 0,
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
      console.log("Submitting growth data:", values)

      const response = await fetch(`/api/children/${selectedChild.id}/growth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: values.date.toISOString(),
          height: values.height,
          weight: values.weight,
          headCircumference: values.headCircumference,
          heightUnit: "cm",
          weightUnit: "kg",
          notes: values.notes || "",
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed to add growth record: ${errorData}`)
      }

      toast({
        title: "Growth record added",
        description: `Growth record has been added successfully.`,
      })

      // Reset form and close modal
      form.reset()
      setOpen(false)
    } catch (error) {
      console.error("Error adding growth record:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add growth record. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Growth Metrics</DialogTitle>
          <DialogDescription>
            {selectedChild ? `Record new growth measurements for ${selectedChild.name}` : "Please select a child first"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => {
                      const today = new Date()
                      today.setHours(23, 59, 59, 999)
                      return date > today
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>When was the measurement taken?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (kg)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormDescription>Child's weight in kilograms</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Height (cm)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.1" {...field} />
                </FormControl>
                <FormDescription>Child's height in centimeters</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="headCircumference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Head Circumference (cm)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.1" {...field} />
                </FormControl>
                <FormDescription>Head circumference in centimeters</FormDescription>
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
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional notes about the growth measurement"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional notes about the measurement</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || !selectedChild}>
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Growth Record"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}