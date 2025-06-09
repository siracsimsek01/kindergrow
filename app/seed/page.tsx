"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { seedDatabaseAction } from "@/lib/actions/seed-actions"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"

export default function SeedPage() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  // Simulate progress for demo (replace with real progress if backend supports it)
  const handleSeed = async () => {
    try {
      setIsSeeding(true)
      setProgress(0)
      setProgressMessage("Starting seeding process...")

      // Simulate progress steps
      const steps = [
        { pct: 10, msg: "Clearing old data..." },
        { pct: 30, msg: "Creating children..." },
        { pct: 50, msg: "Generating feeding events..." },
        { pct: 65, msg: "Generating sleep events..." },
        { pct: 75, msg: "Generating diaper events..." },
        { pct: 85, msg: "Generating growth, medication, temperature..." },
        { pct: 100, msg: "Finalizing..." },
      ]
      for (const step of steps) {
        setProgress(step.pct)
        setProgressMessage(step.msg)
        await new Promise((res) => setTimeout(res, 400))
      }

      const result = await seedDatabaseAction()

      if (result.success) {
        setProgress(100)
        setProgressMessage("Seeding complete!")
        toast({
          title: "Success",
          description: "Database seeded successfully with sample data.",
        })
        setTimeout(() => {
          router.push("/dashboard")
        }, 1500)
      } else {
        throw new Error(result.error || "Failed to seed database")
      }
    } catch (error) {
      setProgress(0)
      setProgressMessage("")
      console.error("Error seeding database:", error)
      toast({
        title: "Error",
        description: "Failed to seed database. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-[400px] shadow-lg shadow-green-600">
        <CardHeader>
          <CardTitle>Seed Database</CardTitle>
          <CardDescription>
            This will populate your database with sample data for 4 children with a year's worth of events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">The seeding process will:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Create 4 children with different ages</li>
            <li>Generate a year's worth of feeding, sleeping, diaper, growth, medication, and temperature events</li>
            <li>Create realistic patterns of data for reporting and visualization</li>
          </ul>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">
              <strong>Warning:</strong> This will delete any existing children and events data in your account.
            </p>
          </div>
          {isSeeding && (
            <div className="mt-6 space-y-2">
              <Progress value={progress} />
              <div className="text-xs text-muted-foreground text-center">{progressMessage}</div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSeed} disabled={isSeeding} className="w-full">
            {isSeeding ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Seeding Database...
              </>
            ) : (
              "Seed Database"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

