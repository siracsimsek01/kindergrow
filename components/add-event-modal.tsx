"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Clock } from "lucide-react"
import { useChildContext } from "@/contexts/child-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

// Sleep form schema
const sleepFormSchema = z
  .object({
    startTime: z.date({ required_error: "Start time is required" }),
    endTime: z.date({ required_error: "End time is required" }),
    quality: z.string({ required_error: "Quality is required" }),
    location: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  })

// Feeding form schema
const feedingFormSchema = z.object({
  timestamp: z.date({ required_error: "Time is required" }),
  type: z.string({ required_error: "Type is required" }),
  amount: z.string().optional(),
  notes: z.string().optional(),
})

// Growth form schema
const growthFormSchema = z.object({
  timestamp: z.date({ required_error: "Time is required" }),
  weight: z.string().min(1, "Weight is required"),
  notes: z.string().optional(),
})

export function AddEventModal() {
  const { selectedChild, isAddEventModalOpen, setIsAddEventModalOpen, eventType, triggerRefresh } = useChildContext()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Sleep form
  const sleepForm = useForm<z.infer<typeof sleepFormSchema>>({
    resolver: zodResolver(sleepFormSchema),
    defaultValues: {
      startTime: new Date(),
      endTime: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour later
      quality: "good",
      location: "crib",
      notes: "",
    },
  })

  // Feeding form
  const feedingForm = useForm<z.infer<typeof feedingFormSchema>>({
    resolver: zodResolver(feedingFormSchema),
    defaultValues: {
      timestamp: new Date(),
      type: "breast",
      amount: "",
      notes: "",
    },
  })

  // Growth form
  const growthForm = useForm<z.infer<typeof growthFormSchema>>({
    resolver: zodResolver(growthFormSchema),
    defaultValues: {
      timestamp: new Date(),
      weight: "",
      notes: "",
    },
  })

  // Reset forms when modal opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      sleepForm.reset()
      feedingForm.reset()
      growthForm.reset()
    }
    setIsAddEventModalOpen(open)
  }

  // Submit sleep form
  const onSubmitSleep = async (values: z.infer<typeof sleepFormSchema>) => {
    if (!selectedChild) {
      toast({
        title: "Error",
        description: "Please select a child first",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const durationMinutes = Math.round((values.endTime.getTime() - values.startTime.getTime()) / (1000 * 60))
      const durationHours = durationMinutes / 60

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          childId: selectedChild.id,
          eventType: "sleeping",
          timestamp: values.startTime.toISOString(),
          details: JSON.stringify({
            startTime: values.startTime,
            endTime: values.endTime,
            duration: durationHours,
            quality: values.quality,
            location: values.location,
            notes: values.notes,
          }),
          value: durationHours,
          unit: "hours",
          notes: values.notes,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add sleep event")
      }

      toast({
        title: "Success",
        description: "Sleep event added successfully",
      })

      // Close modal
      handleOpenChange(false)

      // Refresh data
      await triggerRefresh()
    } catch (error) {
      console.error("Error adding sleep event:", error)
      toast({
        title: "Error",
        description: "Failed to add sleep event. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit feeding form
  const onSubmitFeeding = async (values: z.infer<typeof feedingFormSchema>) => {
    if (!selectedChild) {
      toast({
        title: "Error",
        description: "Please select a child first",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const amount = values.amount ? Number.parseFloat(values.amount) : null

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          childId: selectedChild.id,
          eventType: "feeding",
          timestamp: values.timestamp.toISOString(),
          details: JSON.stringify({
            type: values.type,
            amount,
            notes: values.notes,
          }),
          value: amount,
          unit: values.type === "breast" ? "minutes" : "oz",
          notes: values.notes,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add feeding event")
      }

      toast({
        title: "Success",
        description: "Feeding event added successfully",
      })

      // Close modal
      handleOpenChange(false)

      // Refresh data
      await triggerRefresh()
    } catch (error) {
      console.error("Error adding feeding event:", error)
      toast({
        title: "Error",
        description: "Failed to add feeding event. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit growth form
  const onSubmitGrowth = async (values: z.infer<typeof growthFormSchema>) => {
    if (!selectedChild) {
      toast({
        title: "Error",
        description: "Please select a child first",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const weight = Number.parseFloat(values.weight)

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          childId: selectedChild.id,
          eventType: "growth",
          timestamp: values.timestamp.toISOString(),
          details: JSON.stringify({
            weight,
            notes: values.notes,
          }),
          value: weight,
          unit: "kg",
          notes: values.notes,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add growth event")
      }

      toast({
        title: "Success",
        description: "Growth event added successfully",
      })

      // Close modal
      handleOpenChange(false)

      // Refresh data
      await triggerRefresh()
    } catch (error) {
      console.error("Error adding growth event:", error)
      toast({
        title: "Error",
        description: "Failed to add growth event. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render the appropriate form based on event type
  const renderForm = () => {
    if (!eventType) return null

    switch (eventType) {
      case "sleeping":
        return (
          <Form {...sleepForm}>
            <form onSubmit={sleepForm.handleSubmit(onSubmitSleep)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={sleepForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Time</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? format(field.value, "PPP p") : "Select start time"}
                              <Clock className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => field.onChange(date)}
                            initialFocus
                          />
                          <div className="p-3 border-t">
                            <Input
                              type="time"
                              value={format(field.value, "HH:mm")}
                              onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(":")
                                const newDate = new Date(field.value)
                                newDate.setHours(Number.parseInt(hours, 10))
                                newDate.setMinutes(Number.parseInt(minutes, 10))
                                field.onChange(newDate)
                              }}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={sleepForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Time</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? format(field.value, "PPP p") : "Select end time"}
                              <Clock className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => field.onChange(date)}
                            initialFocus
                          />
                          <div className="p-3 border-t">
                            <Input
                              type="time"
                              value={format(field.value, "HH:mm")}
                              onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(":")
                                const newDate = new Date(field.value)
                                newDate.setHours(Number.parseInt(hours, 10))
                                newDate.setMinutes(Number.parseInt(minutes, 10))
                                field.onChange(newDate)
                              }}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={sleepForm.control}
                name="quality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sleep Quality</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sleep quality" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={sleepForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="crib">Crib</SelectItem>
                        <SelectItem value="bassinet">Bassinet</SelectItem>
                        <SelectItem value="parent's bed">Parent's Bed</SelectItem>
                        <SelectItem value="stroller">Stroller</SelectItem>
                        <SelectItem value="car seat">Car Seat</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={sleepForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any notes about this sleep session" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Sleep Event"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )

      case "feeding":
        return (
          <Form {...feedingForm}>
            <form onSubmit={feedingForm.handleSubmit(onSubmitFeeding)} className="space-y-6">
              <FormField
                control={feedingForm.control}
                name="timestamp"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP p") : "Select time"}
                            <Clock className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => field.onChange(date)}
                          initialFocus
                        />
                        <div className="p-3 border-t">
                          <Input
                            type="time"
                            value={format(field.value, "HH:mm")}
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(":")
                              const newDate = new Date(field.value)
                              newDate.setHours(Number.parseInt(hours, 10))
                              newDate.setMinutes(Number.parseInt(minutes, 10))
                              field.onChange(newDate)
                            }}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={feedingForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feeding Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select feeding type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="breast">Breast</SelectItem>
                        <SelectItem value="bottle">Bottle</SelectItem>
                        <SelectItem value="formula">Formula</SelectItem>
                        <SelectItem value="solid">Solid Food</SelectItem>
                        <SelectItem value="snack">Snack</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={feedingForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 4 oz, 120ml, etc." {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the amount if applicable (e.g., formula amount, breast milk pumped)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={feedingForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any notes about this feeding" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Feeding Event"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )

      case "growth":
        return (
          <Form {...growthForm}>
            <form onSubmit={growthForm.handleSubmit(onSubmitGrowth)} className="space-y-6">
              <FormField
                control={growthForm.control}
                name="timestamp"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : "Select date"}
                            <Clock className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => field.onChange(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={growthForm.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 3.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={growthForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any notes about this growth measurement" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Growth Record"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )

      default:
        return <div className="py-6 text-center text-muted-foreground">Unknown event type: {eventType}</div>
    }
  }

  return (
    <Dialog open={isAddEventModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {eventType === "sleeping" && "Add Sleep Event"}
            {eventType === "feeding" && "Add Feeding Event"}
            {eventType === "growth" && "Add Growth Record"}
            {!eventType && "Add Event"}
          </DialogTitle>
          <DialogDescription>
            {eventType === "sleeping" && "Record a sleep session for your child."}
            {eventType === "feeding" && "Record a feeding session for your child."}
            {eventType === "growth" && "Record a growth measurement for your child."}
            {!eventType && "Select an event type to add."}
          </DialogDescription>
        </DialogHeader>
        {!selectedChild ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground mb-4">Please select a child first</p>
            <Button onClick={() => handleOpenChange(false)}>Close</Button>
          </div>
        ) : (
          renderForm()
        )}
      </DialogContent>
    </Dialog>
  )
}
