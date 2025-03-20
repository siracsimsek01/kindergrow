"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { seedDatabase } from "@/lib/seed-database"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useRouter } from "next/navigation"

export default function SeedPage() {
  const [isSeeding, setIsSeeding] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSeed = async () => {
    try {
      setIsSeeding(true)
      const result = await seedDatabase()
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Database seeded successfully with sample data.",
        })
        
        // Redirect to dashboard after successful seeding
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        throw new Error(result.error || "Failed to seed database")
      }
    } catch (error) {
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
          <p className="text-sm text-muted-foreground mb-4">
            The seeding process will:
          </p>
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
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSeed} 
            disabled={isSeeding} 
            className="w-full"
          >
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
