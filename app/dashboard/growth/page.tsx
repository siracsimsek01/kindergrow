"use client"
import { useChildContext } from "@/contexts/child-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { GrowthChart } from "@/components/charts/growth-chart"

export default function GrowthPage() {
  const { selectedChild, setIsAddEventModalOpen } = useChildContext()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Growth Tracking</h1>
          <p className="text-muted-foreground">Monitor your child's growth over time</p>
        </div>
        <div className="flex">
          <Button onClick={() => setIsAddEventModalOpen(true, "growth")} disabled={!selectedChild}>
            <Plus className="mr-2 h-4 w-4" />
            Add Growth Record
          </Button>
         
        </div>
      </div>

      {!selectedChild ? (
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Select a child to view growth data</p>
          </CardContent>
        </Card>
      ) : (
        <GrowthChart />
      )}
    </div>
  )
}
