"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DiaperForm } from "@/components/forms/diaper-form"
import { Plus } from "lucide-react"
import { useAppSelector } from "@/lib/redux/hooks"

interface DiaperFormModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
  onSuccess?: () => void
}

export function DiaperFormModal({ open, onOpenChange, children, onSuccess }: DiaperFormModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const selectedChild = useAppSelector((state) => state.children.selectedChild)

  // Use controlled or uncontrolled state based on props
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  const handleSuccess = () => {
    setIsOpen(false)
    if (onSuccess) onSuccess()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Plus size={16} />
            Add Diaper Change
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] z-[99999]">
        <DialogHeader>
          <DialogTitle>Add Diaper Change</DialogTitle>
          <DialogDescription>
            {selectedChild ? `Record a new diaper change for ${selectedChild.name}` : "Please select a child first"}
          </DialogDescription>
        </DialogHeader>
        <DiaperForm onSuccess={handleSuccess} onCancel={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

