"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useChildContext } from "@/contexts/child-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

const childSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }),
  sex: z.enum(["Male", "Female", "Other"], {
    required_error: "Sex is required",
  }),
})

interface EditChildModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  child: any
}

export function EditChildModal({ open, onOpenChange, child }: EditChildModalProps) {
  const { triggerRefresh } = useChildContext()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const [initialized, setInitialized] = useState(false)

  const form = useForm<z.infer<typeof childSchema>>({
    resolver: zodResolver(childSchema),
    defaultValues: {
      name: child?.name || "",
      dateOfBirth: child?.dateOfBirth ? new Date(child.dateOfBirth) : new Date(),
      sex: child?.sex || "Male",
    },
  })

  // Initialize form values only once when the modal opens
  useEffect(() => {
    if (open && child && !initialized) {
      form.reset({
        name: child.name,
        dateOfBirth: new Date(child.dateOfBirth),
        sex: child.sex,
      })
      setInitialized(true)
    } else if (!open) {
      // Reset the initialized state when modal closes
      setInitialized(false)
    }
  }, [open, child, form, initialized])

  async function onSubmit(data: z.infer<typeof childSchema>) {
    if (!child) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/children/${child.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to update child")
      }

      toast({
        title: "Child updated",
        description: "The child has been updated successfully.",
      })

      triggerRefresh()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating child:", error)
      toast({
        title: "Error",
        description: "Failed to update child. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Child</DialogTitle>
          <DialogDescription>Update your child's information.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter child's name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Birth</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
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
                  <FormDescription>
                    Your child's date of birth is used to calculate age and track development.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sex</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sex" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This information is used for growth charts and development tracking.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Child"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

