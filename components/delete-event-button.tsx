"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface DeleteEventButtonProps {
  eventId: string
  eventType: string
  onDelete?: () => void
}

export function DeleteEventButton({ eventId, eventType, onDelete }: DeleteEventButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete ${eventType} entry`)
      }

      toast({
        title: "Entry deleted",
        description: `The ${eventType} entry has been deleted successfully.`,
      })

      if (onDelete) {
        onDelete()
      }
    } catch (error) {
      console.error(`Error deleting ${eventType} entry:`, error)
      toast({
        title: "Error",
        description: `Failed to delete ${eventType} entry. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setOpen(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Delete {eventType} entry</span>
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {eventType} entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {eventType} entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

