"use client"

import { useState } from "react"
import { useChildContext } from "@/contexts/child-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { FileDown, FileText, BarChart } from 'lucide-react'
import { addDays, format, subDays, subMonths } from "date-fns"
import type { DateRange } from "react-day-picker"
import { ChartSkeleton, StatCardSkeleton, TableSkeleton } from "@/components/ui/skeleton-loader"

export default function ReportsPage() {
  const { selectedChild, isLoading: isChildLoading, children } = useChildContext()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("generate")
  const [reportType, setReportType] = useState("feeding")
  const [isGenerating, setIsGenerating] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  })
  

  const handleGenerateReport = async () => {
    if (!selectedChild) {
      toast({
        title: "Error",
        description: "Please select a child first.",
        variant: "destructive",
      })
      return
    }

    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: "Error",
        description: "Please select a date range.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGenerating(true)

      const response = await fetch(`/api/children/${selectedChild.id}/reports/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType,
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate report")
      }

      // Get the PDF blob
      const blob = await response.blob()
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob)
      
      // Create a link element
      const link = document.createElement("a")
      link.href = url
      link.download = `${reportType}-report.pdf`
      
      // Append to the document
      document.body.appendChild(link)
      
      // Trigger the download
      link.click()
      
      // Clean up
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Report Generated",
        description: "Your report has been generated and downloaded.",
      })
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case "feeding":
        return "Feeding Report"
      case "sleeping":
        return "Sleep Report"
      case "diaper":
        return "Diaper Report"
      case "growth":
        return "Growth Report"
      case "medication":
        return "Medication Report"
      case "temperature":
        return "Temperature Report"
      default:
        return "Report"
    }
  }

  const handleQuickDateRange = (range: string) => {
    const today = new Date()
    
    switch (range) {
      case "week":
        setDateRange({
          from: subDays(today, 7),
          to: today,
        })
        break
      case "month":
        setDateRange({
          from: subMonths(today, 1),
          to: today,
        })
        break
      case "3months":
        setDateRange({
          from: subMonths(today, 3),
          to: today,
        })
        break
      case "6months":
        setDateRange({
          from: subMonths(today, 6),
          to: today,
        })
        break
      case "year":
        setDateRange({
          from: subMonths(today, 12),
          to: today,
        })
        break
    }
  }
  const isLoaded = !isChildLoading && children.length > 0 && selectedChild

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Generate and view reports for your child's activities</p>
        </div>
      </div>

      <Tabs defaultValue="generate" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          <TabsTrigger value="saved">Saved Reports</TabsTrigger>
        </TabsList>
      {!isLoaded ? (
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
      ) : (
        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate a New Report</CardTitle>
              <CardDescription>
                Select a report type, date range, and child to generate a detailed report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feeding">Feeding Report</SelectItem>
                      <SelectItem value="sleeping">Sleep Report</SelectItem>
                      <SelectItem value="diaper">Diaper Report</SelectItem>
                      <SelectItem value="growth">Growth Report</SelectItem>
                      <SelectItem value="medication">Medication Report</SelectItem>
                      <SelectItem value="temperature">Temperature Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Child</label>
                  <Select 
                    value={selectedChild?.id} 
                    onValueChange={(value) => {
                      const child = children.find(c => c.id === value)
                      if (child) {
                        // This assumes you have a setSelectedChild function in your context
                        // that you can call directly here
                      }
                    }}
                    disabled={children.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={children.length === 0 ? "No children added" : "Select child"} />
                    </SelectTrigger>
                    <SelectContent>
                      {children.map((child) => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <DateRangePicker date={dateRange} setDate={setDateRange} className="w-full" />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handleQuickDateRange("week")}>
                  Last Week
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickDateRange("month")}>
                  Last Month
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickDateRange("3months")}>
                  Last 3 Months
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickDateRange("6months")}>
                  Last 6 Months
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickDateRange("year")}>
                  Last Year
                </Button>
              </div>

              <Button 
                onClick={handleGenerateReport} 
                disabled={isGenerating || !selectedChild || !dateRange?.from || !dateRange?.to}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Generate and Download Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report Preview</CardTitle>
              <CardDescription>
                Preview of what will be included in your {getReportTypeLabel(reportType)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-6 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">{getReportTypeLabel(reportType)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedChild ? `For ${selectedChild.name}` : "Select a child"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {dateRange?.from && dateRange?.to
                      ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
                      : "Select a date range"}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-md font-medium">What's included:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {reportType === "feeding" && (
                      <>
                        <li>Total number of feedings</li>
                        <li>Average amount per feeding</li>
                        <li>Feeding patterns and trends</li>
                        <li>Detailed feeding log with times and amounts</li>
                      </>
                    )}
                    {reportType === "sleeping" && (
                      <>
                        <li>Total sleep duration</li>
                        <li>Average sleep per day</li>
                        <li>Sleep patterns and quality</li>
                        <li>Detailed sleep log with times and durations</li>
                      </>
                    )}
                    {reportType === "diaper" && (
                      <>
                        <li>Total number of diaper changes</li>
                        <li>Types of diaper changes</li>
                        <li>Diaper change patterns</li>
                        <li>Detailed diaper log with times and types</li>
                      </>
                    )}
                    {reportType === "growth" && (
                      <>
                        <li>Weight and height progression</li>
                        <li>Growth rate over time</li>
                        <li>Comparison to previous measurements</li>
                        <li>Detailed growth log with dates and measurements</li>
                      </>
                    )}
                    {reportType === "medication" && (
                      <>
                        <li>Medication types and dosages</li>
                        <li>Medication frequency</li>
                        <li>Treatment durations</li>
                        <li>Detailed medication log with times and dosages</li>
                      </>
                    )}
                    {reportType === "temperature" && (
                      <>
                        <li>Temperature readings over time</li>
                        <li>Fever episodes</li>
                        <li>Average temperature</li>
                        <li>Detailed temperature log with times and readings</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      )}
        

        <TabsContent value="saved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Saved Reports</CardTitle>
              <CardDescription>
                Access your previously generated reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
                <div className="flex flex-col items-center gap-1 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/70" />
                  <p className="text-sm text-muted-foreground">No saved reports yet</p>
                  <p className="text-xs text-muted-foreground">
                    Generate a report to see it here
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setActiveTab("generate")}
                  >
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
