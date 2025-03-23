"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FeedingForm } from "@/components/forms/feeding-form"
import { Plus } from "lucide-react"

interface FeedingFormModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

export function FeedingFormModal({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  children,
}: FeedingFormModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const isControlled = externalOpen !== undefined && externalOnOpenChange !== undefined
  const open = isControlled ? externalOpen : internalOpen
  const onOpenChange = isControlled ? externalOnOpenChange : setInternalOpen

  const handleSuccess = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Add Feeding
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Feeding</DialogTitle>
        </DialogHeader>
        <FeedingForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}

