"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Database, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function SeedDatabasePage() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isClearing, setIsClearing] = useState(false)
  const [clearResult, setClearResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()

  const seedDatabase = async () => {
    try {
      setIsSeeding(true)
      setSeedResult(null)

      // Call the seed API endpoint
      const response = await fetch("/api/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.error("Seed API error:", response.status, response.statusText)
        const text = await response.text()
        console.error("Response body:", text)

        let errorMessage = "Failed to seed database"
        try {
          // Try to parse as JSON, but it might be HTML
          const errorData = JSON.parse(text)
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          // If it's not valid JSON, use a generic error message
          errorMessage = `Server error (${response.status}): Failed to seed database`
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()

      setSeedResult({
        success: true,
        message: "Database seeded successfully with sample data!",
      })

      toast({
        title: "Success",
        description: "Database seeded successfully with sample data!",
      })

      // Refresh the page after 2 seconds to show the new data
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 2000)
    } catch (error) {
      console.error("Error seeding database:", error)
      setSeedResult({
        success: false,
        message: error.message || "Failed to seed database. Please try again.",
      })

      toast({
        title: "Error",
        description: error.message || "Failed to seed database. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSeeding(false)
    }
  }

  const clearDatabase = async () => {
    try {
      setIsClearing(true)
      setClearResult(null)

      // Call the clear API endpoint
      const response = await fetch("/api/seed/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.error("Clear API error:", response.status, response.statusText)
        const text = await response.text()
        console.error("Response body:", text)

        let errorMessage = "Failed to clear database"
        try {
          // Try to parse as JSON, but it might be HTML
          const errorData = JSON.parse(text)
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          // If it's not valid JSON, use a generic error message
          errorMessage = `Server error (${response.status}): Failed to clear database`
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()

      setClearResult({
        success: true,
        message: "Database cleared successfully!",
      })

      toast({
        title: "Success",
        description: "Database cleared successfully!",
      })

      // Refresh the page after 2 seconds
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 2000)
    } catch (error) {
      console.error("Error clearing database:", error)
      setClearResult({
        success: false,
        message: error.message || "Failed to clear database. Please try again.",
      })

      toast({
        title: "Error",
        description: error.message || "Failed to clear database. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Seed Database</h1>
        <p className="text-muted-foreground">
          Populate your database with sample data for testing or start with a clean slate.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Seed Database
            </CardTitle>
            <CardDescription>Add sample children and events to your database for testing purposes.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">This will create:</p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li>2 sample children with different ages</li>
              <li>Multiple sleep tracking events</li>
              <li>Feeding records with different types</li>
              <li>Diaper change records</li>
              <li>Growth measurements</li>
              <li>Temperature readings</li>
              <li>Medication records</li>
            </ul>

            {seedResult && (
              <Alert className="mt-4" variant={seedResult.success ? "default" : "destructive"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{seedResult.success ? "Success" : "Error"}</AlertTitle>
                <AlertDescription>{seedResult.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={seedDatabase} disabled={isSeeding || isClearing} className="w-full">
              {isSeeding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding Database...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Seed Database
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Database className="h-5 w-5" />
              Clear Database
            </CardTitle>
            <CardDescription>Remove all sample data and start with a clean database.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">This will remove:</p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li>All children</li>
              <li>All tracking events (sleep, feeding, etc.)</li>
              <li>All growth measurements</li>
              <li>All other related data</li>
            </ul>
            <p className="text-sm font-medium text-destructive mt-4">Warning: This action cannot be undone!</p>

            {clearResult && (
              <Alert className="mt-4" variant={clearResult.success ? "default" : "destructive"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{clearResult.success ? "Success" : "Error"}</AlertTitle>
                <AlertDescription>{clearResult.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="destructive" onClick={clearDatabase} disabled={isSeeding || isClearing} className="w-full">
              {isClearing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing Database...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Clear Database
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
