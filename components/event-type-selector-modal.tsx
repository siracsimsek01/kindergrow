"use client"

import { Baby, Moon, Utensils, Pill, Thermometer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useChildContext } from "@/contexts/child-context"

interface EventTypeSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EventTypeSelectorModal({ open, onOpenChange }: EventTypeSelectorModalProps) {
  const { setIsAddEventModalOpen } = useChildContext()

  const handleSelectEventType = (eventType: string) => {
    onOpenChange(false)
    // Short delay to ensure this modal closes before opening the next one
    setTimeout(() => {
      setIsAddEventModalOpen(true, eventType)
    }, 100)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Event</DialogTitle>
          <DialogDescription>Select an event type to add.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-4">
          <Button
            onClick={() => handleSelectEventType("sleeping")}
            className="flex items-center justify-start gap-2 h-16 text-lg bg-primary/10 hover:bg-primary/20 text-primary"
            variant="outline"
          >
            <Moon className="h-6 w-6" />
            <span>Sleep</span>
          </Button>
          <Button
            onClick={() => handleSelectEventType("feeding")}
            className="flex items-center justify-start gap-2 h-16 text-lg bg-primary/10 hover:bg-primary/20 text-primary"
            variant="outline"
          >
            <Utensils className="h-6 w-6" />
            <span>Feeding</span>
          </Button>
          <Button
            onClick={() => handleSelectEventType("diaper")}
            className="flex items-center justify-start gap-2 h-16 text-lg bg-primary/10 hover:bg-primary/20 text-primary"
            variant="outline"
          >
            <Baby className="h-6 w-6" />
            <span>Diaper</span>
          </Button>
          <Button
            onClick={() => handleSelectEventType("medication")}
            className="flex items-center justify-start gap-2 h-16 text-lg bg-primary/10 hover:bg-primary/20 text-primary"
            variant="outline"
          >
            <Pill className="h-6 w-6" />
            <span>Medications</span>
          </Button>
          <Button
            onClick={() => handleSelectEventType("temperature")}
            className="flex items-center justify-start gap-2 h-16 text-lg bg-primary/10 hover:bg-primary/20 text-primary"
            variant="outline"
          >
            <Thermometer className="h-6 w-6" />
            <span>Temperature</span>
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  )
}
