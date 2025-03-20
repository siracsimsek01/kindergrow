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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
  time: z.date({
    required_error: "Time is required.",
  }),
  type: z.enum(["Breast Milk", "Formula", "Solid Food", "Water"], {
    required_error: "Feeding type is required.",
  }),
  amount: z.coerce.number().min(0, {
    message: "Amount must be a positive number.",
  }),
  unit: z.enum(["ml", "oz", "g"], {
    required_error: "Unit is required.",
  }),
  duration: z.coerce.number().min(0, {
    message: "Duration must be a positive number.",
  }).optional(),
  notes: z.string().optional(),
})

interface FeedingFormProps {
  onSuccess?: () => void
}

export function FeedingForm({ onSuccess }: FeedingFormProps) {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const selectedChild = useAppSelector((state) => state.children.selectedChild)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      time: new Date(),
      type: "Breast Milk",
      amount: 120,
      unit: "ml",
      duration: 15,
      notes: "",
    },
  })

  // Watch the type field to conditionally show/hide fields
  const feedingType = form.watch("type")

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

      const resultAction = await dispatch(
        addEventAsync({
          childId: selectedChild.id,
          type: "feeding",
          data: {
            time: values.time.toISOString(),
            type: values.type,
            amount: values.amount,
            unit: values.unit,
            duration: values.duration || 0,
            notes: values.notes || "",
          },
        })
      )

      if (addEventAsync.fulfilled.match(resultAction)) {
        toast({
          title: "Feeding record added",
          description: `Feeding record has been added successfully.`,
        })

        // Reset form
        form.reset({
          time: new Date(),
          type: "Breast Milk",
          amount: 120,
          unit: "ml",
          duration: 15,
          notes: "",
        })

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess()
        }
      } else {
        throw new Error("Failed to add feeding record")
      }
    } catch (error) {
      console.error("Error adding feeding record:", error)
      toast({
        title: "Error",
        description: "Failed to add feeding record. Please try again.",
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
              <FormDescription>When did the feeding occur?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
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
                  <SelectItem value="Breast Milk">Breast Milk</SelectItem>
                  <SelectItem value="Formula">Formula</SelectItem>
                  <SelectItem value="Solid Food">Solid Food</SelectItem>
                  <SelectItem value="Water">Water</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>What type of feeding was it?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="1" {...field} />
                </FormControl>
                <FormDescription>How much was consumed?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="oz">oz</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Unit of measurement</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {(feedingType === "Breast Milk") && (
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    step="1" 
                    {...field} 
                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>How long did the feeding last?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional notes about the feeding"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional notes about the feeding</FormDescription>
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
            "Save Feeding Record"
          )}
        </Button>
      </form>
    </Form>
  )
}