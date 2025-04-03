"use client"

import { useState } from "react"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"

export function RemoveSeededData() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()

  const handleRemoveSeededData = async () => {
    try {
      setIsLoading(true)

      // Call API to remove seeded data
      const response = await fetch("/api/seed/remove", {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to remove seeded data")
      }

      toast({
        title: "Success",
        description: "All seeded data has been removed. You can now start adding your own data.",
        variant: "default",
      })

      // Redirect to dashboard
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      console.error("Error removing seeded data:", error)
      toast({
        title: "Error",
        description: "Failed to remove seeded data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render if auth isn't loaded or user isn't signed in
  if (!isLoaded || !isSignedIn) {
    return null
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="mr-2 h-4 w-4" />
          Remove Seeded Data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will permanently delete all seeded data from your account. This includes all children, sleep
            records, feeding records, diaper changes, and other data that was automatically generated.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemoveSeededData}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Removing..." : "Yes, remove all seeded data"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

