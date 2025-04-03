"use client"

import { useState, useEffect } from "react"
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

// Define schemas for different event types
const sleepEventSchema = z
  .object({
    startTime: z.date({
      required_error: "Start time is required",
    }),
    endTime: z.date({
      required_error: "End time is required",
    }),
    quality: z.string({
      required_error: "Quality is required",
    }),
    notes: z.string().optional(),
    location: z.string().optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  })

const feedingEventSchema = z.object({
  timestamp: z.date({
    required_error: "Time is required",
  }),
  type: z.string({
    required_error: "Type is required",
  }),
  amount: z.string().optional(),
  notes: z.string().optional(),
})

const diaperEventSchema = z.object({
  timestamp: z.date({
    required_error: "Time is required",
  }),
  type: z.string({
    required_error: "Type is required",
  }),
  notes: z.string().optional(),
})

interface AddEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventType: string | null
  onSuccess?: () => void
}

export function AddEventModal({ open, onOpenChange, eventType, onSuccess }: AddEventModalProps) {
  const { selectedChild } = useChildContext()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Sleep form
  const sleepForm = useForm<z.infer<typeof sleepEventSchema>>({
    resolver: zodResolver(sleepEventSchema),
    defaultValues: {
      startTime: new Date(),
      endTime: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour later
      quality: "good",
      notes: "",
      location: "crib",
    },
  })

  // Feeding form
  const feedingForm = useForm<z.infer<typeof feedingEventSchema>>({
    resolver: zodResolver(feedingEventSchema),
    defaultValues: {
      timestamp: new Date(),
      type: "breast",
      amount: "",
      notes: "",
    },
  })

  // Diaper form
  const diaperForm = useForm<z.infer<typeof diaperEventSchema>>({
    resolver: zodResolver(diaperEventSchema),
    defaultValues: {
      timestamp: new Date(),
      type: "wet",
      notes: "",
    },
  })

  // Reset forms when modal opens
  useEffect(() => {
    if (open) {
      const now = new Date()

      sleepForm.reset({
        startTime: now,
        endTime: new Date(now.getTime() + 60 * 60 * 1000),
        quality: "good",
        notes: "",
        location: "crib",
      })

      feedingForm.reset({
        timestamp: now,
        type: "breast",
        amount: "",
        notes: "",
      })

      diaperForm.reset({
        timestamp: now,
        type: "wet",
        notes: "",
      })
    }
  }, [open, sleepForm, feedingForm, diaperForm])

  const onSubmitSleep = async (values: z.infer<typeof sleepEventSchema>) => {
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

      const response = await fetch(`/api/children/${selectedChild.id}/sleep`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error("Failed to add sleep event")
      }

      toast({
        title: "Success",
        description: "Sleep event added successfully",
      })

      // Close modal
      onOpenChange(false)

      // Trigger refresh
      if (onSuccess) {
        onSuccess()
      }
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

  const onSubmitFeeding = async (values: z.infer<typeof feedingEventSchema>) => {
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

      const response = await fetch(`/api/children/${selectedChild.id}/feeding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error("Failed to add feeding event")
      }

      toast({
        title: "Success",
        description: "Feeding event added successfully",
      })

      // Close modal
      onOpenChange(false)

      // Trigger refresh
      if (onSuccess) {
        onSuccess()
      }
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

  const onSubmitDiaper = async (values: z.infer<typeof diaperEventSchema>) => {
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

      const response = await fetch(`/api/children/${selectedChild.id}/diaper`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error("Failed to add diaper event")
      }

      toast({
        title: "Success",
        description: "Diaper event added successfully",
      })

      // Close modal
      onOpenChange(false)

      // Trigger refresh
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error adding diaper event:", error)
      toast({
        title: "Error",
        description: "Failed to add diaper event. Please try again.",
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
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
                        <SelectItem value="formula">Formula</SelectItem>
                        <SelectItem value="solid">Solid Food</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
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
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Feeding Event"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )

      case "diaper":
        return (
          <Form {...diaperForm}>
            <form onSubmit={diaperForm.handleSubmit(onSubmitDiaper)} className="space-y-6">
              <FormField
                control={diaperForm.control}
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
                control={diaperForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diaper Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select diaper type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="wet">Wet</SelectItem>
                        <SelectItem value="dirty">Dirty</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                        <SelectItem value="dry">Dry</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={diaperForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any notes about this diaper change" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Diaper Event"}
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {eventType === "sleeping" && "Add Sleep Event"}
            {eventType === "feeding" && "Add Feeding Event"}
            {eventType === "diaper" && "Add Diaper Event"}
            {!eventType && "Add Event"}
          </DialogTitle>
          <DialogDescription>
            {eventType === "sleeping" && "Record a sleep session for your child."}
            {eventType === "feeding" && "Record a feeding session for your child."}
            {eventType === "diaper" && "Record a diaper change for your child."}
            {!eventType && "Select an event type to add."}
          </DialogDescription>
        </DialogHeader>
        {!selectedChild ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground mb-4">Please select a child first</p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        ) : (
          renderForm()
        )}
      </DialogContent>
    </Dialog>
  )
}

