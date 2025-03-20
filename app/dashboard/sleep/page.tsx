"use client"

import { useState } from "react"
import { useChildContext } from "@/contexts/child-context"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { SleepChart } from "@/components/charts/sleep-chart"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Plus } from "lucide-react"
import { SleepEntriesTable } from "@/components/sleep-entries-table"
import { SleepCalendar } from "@/components/sleep-calendar"
import { SleepFormModal } from "@/app/dashboard/sleep/sleep-form-modal"

export default function SleepPage() {
  const { selectedChild, isLoading } = useChildContext()
  const [activeTab, setActiveTab] = useState("overview")
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (isLoading) {
    return <LoadingScreen message="Loading sleep data..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sleep Tracking</h1>
          <p className="text-muted-foreground">Monitor your child's sleep patterns and duration</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Add Sleep Entry
        </Button>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="cursor-pointer">
          <TabsTrigger value="overview" className="cursor-pointer">
            Overview
          </TabsTrigger>
          <TabsTrigger value="entries" className="cursor-pointer">
            All Entries
          </TabsTrigger>
          <TabsTrigger value="calendar" className="cursor-pointer">
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="text-sm font-medium text-muted-foreground">Average Sleep (Daily)</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold">{selectedChild ? "12h 30m" : "0h 0m"}</span>
                {selectedChild && <span className="text-sm text-green-500">+5% from last week</span>}
              </div>
            </div>
          </div>

          <div className="rounded-lg border shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-medium">Sleep Duration</h3>
              <p className="text-sm text-muted-foreground">Daily sleep duration over the past week</p>
            </div>
            <div className="p-6 pt-0">
              <SleepChart />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="entries">
          <SleepEntriesTable />
        </TabsContent>

        <TabsContent value="calendar">
          <SleepCalendar />
        </TabsContent>
      </Tabs>
      <SleepFormModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}

