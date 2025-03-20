"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAppSelector } from "@/lib/redux/hooks"
import { FeedingChart } from "@/components/feeding-chart"
import { FeedingEntriesTable } from "@/components/feeding-entries-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { GraphLoader } from "@/components/ui/graph-loader"
import { useQueryEvents } from "@/hooks/use-query-events"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { FeedingFormModal } from "./feeding-form-modal"

export default function FeedingPage() {
  const selectedChild = useAppSelector((state) => state.children.selectedChild)
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  })
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: events, isLoading } = useQueryEvents({
    childId: selectedChild?.id,
    eventType: "feeding",
    startDate: dateRange.from,
    endDate: dateRange.to,
  })

  if (!selectedChild) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-lg text-muted-foreground">Please select a child to view feeding records</p>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Feeding Tracking</h1>
        <div className="w-full sm:w-auto">
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Feeding
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <DateRangePicker date={dateRange} setDate={setDateRange} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feeding Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <GraphLoader /> : <FeedingChart events={events || []} dateRange={dateRange} />}
        </CardContent>
      </Card>

      <FeedingEntriesTable events={events || []} />
      <FeedingFormModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}

