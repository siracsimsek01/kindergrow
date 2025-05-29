"use client"

import { useState } from "react"
import { useChildContext } from "@/contexts/child-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { GrowthChart } from "@/components/charts/growth-chart"
import { GrowthEntriesTable } from "@/components/growth-entries-table"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Plus } from "lucide-react"
import { GrowthFormModal } from "./growth-form-modal"
import { ChartSkeleton, StatCardSkeleton, TableSkeleton } from "@/components/ui/skeleton-loader"

export default function GrowthPage() {
  const { selectedChild, isLoading } = useChildContext()
  const [activeTab, setActiveTab] = useState("overview")
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (isLoading) {
      <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <StatCardSkeleton isLoading={true}>
                  {/* Content will never render */}
                  <div></div>
                </StatCardSkeleton>
              </Card>
            ))}
          </div>

          <Card>
            <ChartSkeleton isLoading={true} height="h-[350px]">
              <div></div>
            </ChartSkeleton>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <ChartSkeleton isLoading={true}>
                <div></div>
              </ChartSkeleton>
            </Card>

            <Card>
              <TableSkeleton isLoading={true}>
                <div></div>
              </TableSkeleton>
            </Card>
          </div>
        </>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Growth Tracking</h1>
          <p className="text-muted-foreground">Track your child's growth measurements over time</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Add Growth Data
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
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Latest Weight</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedChild ? "10.5" : "0"} kg</div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Latest Height</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedChild ? "75.2" : "0"} cm</div>
              </CardContent>
            </Card>
          </div>

          <Card className="border">
            <CardHeader>
              <CardTitle>Growth Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <GrowthChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entries">
          <GrowthEntriesTable />
        </TabsContent>
      </Tabs>
      <GrowthFormModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}

