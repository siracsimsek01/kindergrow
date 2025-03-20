"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useChildContext } from "@/contexts/child-context"
import { addEvent } from "@/app/actions"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  temperature: z.string().min(1, {
    message: "Temperature is required.",
  }),
  unit: z.enum(["celsius", "fahrenheit"]),
  method: z.enum(["oral", "rectal", "armpit", "ear", "forehead", "other"]),
  date: z.date({
    required_error: "Date is required.",
  }),
  time: z.string().min(1, {
    message: "Time is required.",
  }),
  notes: z.string().optional(),
})

export function TemperatureForm({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const { selectedChild } = useChildContext()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Force rerender on mount to fix calendar issues
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      temperature: "",
      unit: "celsius",
      method: "oral",
      date: new Date(),
      time: format(new Date(), "HH:mm"),
      notes: "",
    },
  })

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.reset({
        temperature: "",
        unit: "celsius",
        method: "oral",
        date: new Date(),
        time: format(new Date(), "HH:mm"),
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
      console.log("Submitting temperature data:", values)

      // Format date and time
      const date = values.date
      const time = new Date(date)

      if (values.time) {
        const [hours, minutes] = values.time.split(":").map(Number)
        time.setHours(hours, minutes)
      }

      const details = `Temperature: ${values.temperature} ${values.unit === "celsius" ? "°C" : "°F"}
Method: ${values.method}${values.notes ? `\nNotes: ${values.notes}` : ""}`

      const result = await addEvent({
        childId: selectedChild.id,
        eventType: "temperature",
        startTime: time.toISOString(),
        endTime: time.toISOString(),
        details: details,
        value: Number.parseFloat(values.temperature),
      })

      if (result.success) {
        toast({
          title: "Temperature recorded",
          description: `Temperature has been recorded for ${selectedChild.name}.`,
        })

        // Reset form and close modal
        form.reset()
        setOpen(false)
      } else {
        throw new Error(result.error || "Failed to record temperature")
      }
    } catch (error) {
      console.error("Error recording temperature:", error)
      toast({
        title: "Error",
        description: "Failed to record temperature. Please try again.",
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
          <DialogTitle>Record Temperature</DialogTitle>
          <DialogDescription>
            {selectedChild ? `Record a new temperature for ${selectedChild.name}` : "Please select a child first"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Temperature</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 37.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="celsius" className="cursor-pointer">
                          Celsius (°C)
                        </SelectItem>
                        <SelectItem value="fahrenheit" className="cursor-pointer">
                          Fahrenheit (°F)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Measurement Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="oral" className="cursor-pointer">
                        Oral
                      </SelectItem>
                      <SelectItem value="rectal" className="cursor-pointer">
                        Rectal
                      </SelectItem>
                      <SelectItem value="armpit" className="cursor-pointer">
                        Armpit
                      </SelectItem>
                      <SelectItem value="ear" className="cursor-pointer">
                        Ear
                      </SelectItem>
                      <SelectItem value="forehead" className="cursor-pointer">
                        Forehead
                      </SelectItem>
                      <SelectItem value="other" className="cursor-pointer">
                        Other
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>How the temperature was measured</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal cursor-pointer",
                            !field.value && "text-muted-foreground",
                          )}
                          onClick={() => setCalendarOpen(true)}
                          type="button"
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date)
                          setCalendarOpen(false)
                        }}
                        initialFocus
                        className="cursor-pointer"
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about this temperature reading..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || !selectedChild}>
                {isSubmitting ? "Saving..." : "Save Temperature"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

