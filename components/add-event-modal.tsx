"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Clock, CalendarIcon } from "lucide-react";
import { useChildContext } from "@/contexts/child-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";

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
  });

const feedingEventSchema = z.object({
  timestamp: z.date({
    required_error: "Time is required",
  }),
  type: z.string({
    required_error: "Type is required",
  }),
  amount: z.string().optional(),
  notes: z.string().optional(),
});

const diaperEventSchema = z.object({
  timestamp: z.date({
    required_error: "Time is required",
  }),
  type: z.string({
    required_error: "Type is required",
  }),
  notes: z.string().optional(),
});

const temperatureEventSchema = z.object({
  timestamp: z.date({
    required_error: "Time is required",
  }),
  temperature: z
    .string({
      required_error: "Temperature is required",
    })
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 30 && Number(val) < 45,
      {
        message: "Temperature must be a valid number between 30 and 45°C",
      }
    ),
  notes: z.string().optional(),
});

const growthEventSchema = z
  .object({
    timestamp: z.date({
      required_error: "Date is required",
    }),
    weight: z.string({
      required_error: "Weight is required",
    }).min(1, "Weight is required"),
    height: z.string({
      required_error: "Height is required", 
    }).min(1, "Height is required"),
    notes: z.string().optional(),
  });

const medicationEventSchema = z.object({
  timestamp: z.date({
    required_error: "Time is required",
  }),
  medication: z.string({
    required_error: "Medication name is required",
  }),
  dosage: z.string({
    required_error: "Dosage is required",
  }),
  notes: z.string().optional(),
});

interface AddEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventType: string | null;
  onSuccess?: () => void;
}

export function AddEventModal({
  open,
  onOpenChange,
  eventType,
  onSuccess,
}: AddEventModalProps) {
  const { selectedChild } = useChildContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
  });

  // Feeding form
  const feedingForm = useForm<z.infer<typeof feedingEventSchema>>({
    resolver: zodResolver(feedingEventSchema),
    defaultValues: {
      timestamp: new Date(),
      type: "breast",
      amount: "",
      notes: "",
    },
  });

  // Diaper form
  const diaperForm = useForm<z.infer<typeof diaperEventSchema>>({
    resolver: zodResolver(diaperEventSchema),
    defaultValues: {
      timestamp: new Date(),
      type: "wet",
      notes: "",
    },
  });

  const temperatureForm = useForm<z.infer<typeof temperatureEventSchema>>({
    resolver: zodResolver(temperatureEventSchema),
    defaultValues: {
      timestamp: new Date(),
      temperature: "",
      notes: "",
    },
  });

  // Growth form
  const growthForm = useForm<z.infer<typeof growthEventSchema>>({
    resolver: zodResolver(growthEventSchema),
    defaultValues: {
      timestamp: new Date(),
      weight: "",
      height: "",
      notes: "",
    },
  });

  // Medication form
  const medicationForm = useForm<z.infer<typeof medicationEventSchema>>({
    resolver: zodResolver(medicationEventSchema),
    defaultValues: {
      timestamp: new Date(),
      medication: "",
      dosage: "",
      notes: "",
    },
  });

  // Reset forms when modal opens
  useEffect(() => {
    if (open) {
      const now = new Date();

      // Reset all forms to default values when modal opens
      sleepForm.reset({
        startTime: now,
        endTime: new Date(now.getTime() + 60 * 60 * 1000),
        quality: "good",
        notes: "",
        location: "crib",
      });

      feedingForm.reset({
        timestamp: now,
        type: "breast",
        amount: "",
        notes: "",
      });

      diaperForm.reset({
        timestamp: now,
        type: "wet",
        notes: "",
      });

      temperatureForm.reset({
        timestamp: now,
        temperature: "",
        notes: "",
      });

      growthForm.reset({
        timestamp: now,
        weight: "",
        height: "",
        notes: "",
      });

      medicationForm.reset({
        timestamp: now,
        medication: "",
        dosage: "",
        notes: "",
      });
    }
  }, [open]); // Only depend on open state

  const onSubmitSleep = async (values: z.infer<typeof sleepEventSchema>) => {
    if (!selectedChild) {
      toast({
        title: "Error",
        description: "Please select a child first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/children/${selectedChild.id}/sleep`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to add sleep event: ${errorData}`);
      }

      toast({
        title: "Success",
        description: "Sleep event added successfully",
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error adding sleep event:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add sleep event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitFeeding = async (values: z.infer<typeof feedingEventSchema>) => {
    if (!selectedChild) {
      toast({
        title: "Error",
        description: "Please select a child first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/children/${selectedChild.id}/feeding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startTime: values.timestamp,
          method: values.type,
          amount: values.amount || "",
          notes: values.notes || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to add feeding event: ${errorData}`);
      }

      toast({
        title: "Success",
        description: "Feeding event added successfully",
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error adding feeding event:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add feeding event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitDiaper = async (values: z.infer<typeof diaperEventSchema>) => {
    if (!selectedChild) {
      toast({
        title: "Error",
        description: "Please select a child first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/children/${selectedChild.id}/diaper`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          changeTime: values.timestamp,
          type: values.type,
          notes: values.notes || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to add diaper event: ${errorData}`);
      }

      toast({
        title: "Success",
        description: "Diaper event added successfully",
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error adding diaper event:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add diaper event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitTemperature = async (values: z.infer<typeof temperatureEventSchema>) => {
    if (!selectedChild) {
      toast({
        title: "Error",
        description: "Please select a child first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/children/${selectedChild.id}/temperature`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          value: parseFloat(values.temperature),
          unit: "C",
          recordedAt: values.timestamp,
          notes: values.notes || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to add temperature reading: ${errorData}`);
      }

      toast({
        title: "Success",
        description: "Temperature reading added successfully",
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error adding temperature reading:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add temperature reading. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitGrowth = async (values: z.infer<typeof growthEventSchema>) => {
    if (!selectedChild) {
      toast({
        title: "Error",
        description: "Please select a child first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/children/${selectedChild.id}/growth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          height: values.height ? parseFloat(values.height) : 0,
          weight: values.weight ? parseFloat(values.weight) : 0,
          heightUnit: "cm",
          weightUnit: "kg",
          notes: values.notes || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to add growth record: ${errorData}`);
      }

      toast({
        title: "Success",
        description: "Growth record added successfully",
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error adding growth record:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add growth record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitMedication = async (values: z.infer<typeof medicationEventSchema>) => {
    if (!selectedChild) {
      toast({
        title: "Error",
        description: "Please select a child first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/children/${selectedChild.id}/medication`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          medicationName: values.medication,
          dosage: values.dosage,
          administrationTime: values.timestamp,
          notes: values.notes || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to add medication record: ${errorData}`);
      }

      toast({
        title: "Success",
        description: "Medication record added successfully",
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error adding medication record:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add medication record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to render date/time picker
  const renderDateTimePicker = (field: any, label: string, showTime: boolean = true) => (
    <FormItem className="flex flex-col">
      <FormLabel>{label}</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              className={cn(
                "w-full pl-3 text-left font-normal",
                !field.value && "text-muted-foreground"
              )}
            >
              {field.value ? (
                showTime ? format(field.value, "PPP 'at' p") : format(field.value, "PPP")
              ) : (
                <span>Pick a date{showTime ? " and time" : ""}</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-[9999]" align="start">
          <Calendar
            mode="single"
            selected={field.value}
            onSelect={(date) => {
              if (date) {
                if (showTime && field.value) {
                  // Preserve existing time if there is one
                  const existingDate = new Date(field.value);
                  date.setHours(existingDate.getHours());
                  date.setMinutes(existingDate.getMinutes());
                  date.setSeconds(existingDate.getSeconds());
                } else if (showTime) {
                  // Set to current time if no existing time
                  const now = new Date();
                  date.setHours(now.getHours());
                  date.setMinutes(now.getMinutes());
                  date.setSeconds(0);
                }
                field.onChange(date);
              }
            }}
            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
            initialFocus
          />
          {showTime && (
            <div className="p-3 border-t border-border">
              <Label>Time</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  placeholder="Hour"
                  min="0"
                  max="23"
                  value={field.value?.getHours() || ""}
                  onChange={(e) => {
                    const newDate = new Date(field.value || new Date());
                    newDate.setHours(parseInt(e.target.value) || 0);
                    field.onChange(newDate);
                  }}
                />
                <Input
                  type="number"
                  placeholder="Min"
                  min="0"
                  max="59"
                  value={field.value?.getMinutes() || ""}
                  onChange={(e) => {
                    const newDate = new Date(field.value || new Date());
                    newDate.setMinutes(parseInt(e.target.value) || 0);
                    field.onChange(newDate);
                  }}
                />
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  );

  // Render the appropriate form based on event type
  const renderForm = () => {
    if (!eventType) return null;

    switch (eventType) {
      case "sleep":
      case "sleeping":
        return (
          <Form {...sleepForm}>
            <form onSubmit={sleepForm.handleSubmit(onSubmitSleep)} className="space-y-6">
              <FormField
                control={sleepForm.control}
                name="startTime"
                render={({ field }) => renderDateTimePicker(field, "Start Time")}
              />

              <FormField
                control={sleepForm.control}
                name="endTime"
                render={({ field }) => renderDateTimePicker(field, "End Time")}
              />

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
                        <SelectItem value="poor">Poor</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="excellent">Excellent</SelectItem>
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
                    <FormLabel>Sleep Location</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sleep location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="crib">Crib</SelectItem>
                        <SelectItem value="bed">Bed</SelectItem>
                        <SelectItem value="stroller">Stroller</SelectItem>
                        <SelectItem value="car">Car</SelectItem>
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
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any additional notes..." className="resize-none" {...field} />
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
        );

      case "feed":
      case "feeding":
        return (
          <Form {...feedingForm}>
            <form onSubmit={feedingForm.handleSubmit(onSubmitFeeding)} className="space-y-6">
              <FormField
                control={feedingForm.control}
                name="timestamp"
                render={({ field }) => renderDateTimePicker(field, "Time")}
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
        );

      case "diaper":
        return (
          <Form {...diaperForm}>
            <form onSubmit={diaperForm.handleSubmit(onSubmitDiaper)} className="space-y-6">
              <FormField
                control={diaperForm.control}
                name="timestamp"
                render={({ field }) => renderDateTimePicker(field, "Time")}
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
        );

      case "temperature":
        return (
          <Form {...temperatureForm}>
            <form onSubmit={temperatureForm.handleSubmit(onSubmitTemperature)} className="space-y-6">
              <FormField
                control={temperatureForm.control}
                name="timestamp"
                render={({ field }) => renderDateTimePicker(field, "Time")}
              />

              <FormField
                control={temperatureForm.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 37.5" {...field} />
                    </FormControl>
                    <FormDescription>Temperature in Celsius</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={temperatureForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any additional notes..." className="resize-none" {...field} />
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
                  {isSubmitting ? "Adding..." : "Add Temperature Reading"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        );

      case "growth":
        return (
          <Form {...growthForm}>
            <form onSubmit={growthForm.handleSubmit(onSubmitGrowth)} className="space-y-6">
              <FormField
                control={growthForm.control}
                name="timestamp"
                render={({ field }) => renderDateTimePicker(field, "Date", false)}
              />

              <FormField
                control={growthForm.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 3.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={growthForm.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 50.5" {...field} />
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
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any additional notes..." className="resize-none" {...field} />
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
                  {isSubmitting ? "Adding..." : "Add Growth Record"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        );

      case "medication":
      case "medications":
        return (
          <Form {...medicationForm}>
            <form onSubmit={medicationForm.handleSubmit(onSubmitMedication)} className="space-y-6">
              <FormField
                control={medicationForm.control}
                name="timestamp"
                render={({ field }) => renderDateTimePicker(field, "Time")}
              />

              <FormField
                control={medicationForm.control}
                name="medication"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Paracetamol, Vitamin D" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={medicationForm.control}
                name="dosage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosage</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 5ml, 1 tablet, 2 drops" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={medicationForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any additional notes..." className="resize-none" {...field} />
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
                  {isSubmitting ? "Adding..." : "Add Medication Record"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        );

      default:
        return (
          <div className="py-6 text-center text-muted-foreground">
            Unknown event type: {eventType}
          </div>
        );
    }
  };

  const getEventTitle = () => {
    switch (eventType) {
      case "sleep":
      case "sleeping":
        return "Add Sleep Event";
      case "feed":
      case "feeding":
        return "Add Feeding Event";
      case "diaper":
        return "Add Diaper Event";
      case "temperature":
        return "Add Temperature Reading";
      case "growth":
        return "Add Growth Record";
      case "medication":
      case "medications":
        return "Add Medication Record";
      default:
        return "Add Event";
    }
  };

  const getEventDescription = () => {
    switch (eventType) {
      case "sleep":
      case "sleeping":
        return "Record a sleep session for your child.";
      case "feed":
      case "feeding":
        return "Record a feeding session for your child.";
      case "diaper":
        return "Record a diaper change for your child.";
      case "temperature":
        return "Record a temperature reading for your child.";
      case "growth":
        return "Record growth measurements for your child.";
      case "medication":
      case "medications":
        return "Record medication given to your child.";
      default:
        return "Select an event type to add.";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getEventTitle()}</DialogTitle>
          <DialogDescription>{getEventDescription()}</DialogDescription>
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
  );
}
