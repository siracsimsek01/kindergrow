"use client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MedicationForm } from "@/components/forms/medication-form"
import { useChildContext } from "@/contexts/child-context"

interface MedicationFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MedicationFormModal({ open, onOpenChange }: MedicationFormModalProps) {
  const { selectedChild } = useChildContext()

  const handleSuccess = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] z-[9999]">
        <DialogHeader>
          <DialogTitle>Add Medication</DialogTitle>
          <DialogDescription>
            {selectedChild ? `Add a new medication for ${selectedChild.name}` : "Please select a child first"}
          </DialogDescription>
        </DialogHeader>
        <MedicationForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}

