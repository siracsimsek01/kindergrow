"use client"

import { useState } from "react"
import { useAppSelector } from "@/lib/redux/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GraphLoader } from "@/components/ui/graph-loader"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { useQueryEvents } from "@/hooks/use-query-events"
import { DiaperChart } from "@/components/charts/diaper-chart"
import { DiaperEntriesTable } from "@/components/diaper-entries-table"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DiaperForm } from "@/components/forms/diaper-form"

export default function DiaperPage() {
  const selectedChild = useAppSelector((state) => state.children.selectedChild)
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  })
  const [isModalOpen, setIsModalOpen] = useState(false)

  const {
    data: events,
    isLoading,
    refetch,
  } = useQueryEvents({
    childId: selectedChild?.id,
    eventType: "diaper",
    startDate: dateRange.from?.toISOString(),
    endDate: dateRange.to?.toISOString(),
  })

  if (!selectedChild) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-lg text-muted-foreground">Please select a child to view diaper records</p>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  const handleSuccess = () => {
    setIsModalOpen(false)
    refetch()
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Diaper Tracking</h1>
        <div className="w-full sm:w-auto">
          <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto flex items-center gap-2">
            <Plus className="mr-2 h-4 w-4" />
            Add Diaper Change
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <DateRangePicker date={dateRange} setDate={setDateRange} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Diaper Changes</CardTitle>
        </CardHeader>
        <CardContent className="h-full min-w-auto">
          {isLoading ? <GraphLoader /> : <DiaperChart events={events || []} dateRange={dateRange} />}
        </CardContent>
      </Card>

      <DiaperEntriesTable events={events || []} />

      {/* Diaper Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] z-[99999]">
          <DialogHeader>
            <DialogTitle>Add Diaper Change</DialogTitle>
            <DialogDescription>
              {selectedChild ? `Record a new diaper change for ${selectedChild.name}` : "Please select a child first"}
            </DialogDescription>
          </DialogHeader>
          <DiaperForm onSuccess={handleSuccess} onCancel={() => setIsModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

