"use client"

import type React from "react"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SleepForm } from "@/components/forms/sleep-form"
import { Plus } from "lucide-react"

interface SleepFormModalProps {
  children?: React.ReactNode
}

export function SleepFormModal({ children }: SleepFormModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Add Sleep Entry
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] z-[9999]">
        <DialogHeader>
          <DialogTitle>Add Sleep Entry</DialogTitle>
        </DialogHeader>
        <SleepForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

