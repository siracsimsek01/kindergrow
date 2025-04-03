"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, ArrowUpDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SleepEvent {
  id: string
  timestamp: string
  quality: string
  duration: number
  startTime: string
  endTime: string
  notes: string
  date: Date
}

interface SleepLogProps {
  events: SleepEvent[]
}

export function SleepLog({ events }: SleepLogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterQuality, setFilterQuality] = useState<"all" | "excellent" | "good" | "fair" | "poor" | "very-poor">(
    "all",
  )

  // Filter events based on search term and filter quality
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      format(new Date(event.timestamp), "MMM d, yyyy h:mm a").toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.quality.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.duration.toString().includes(searchTerm)

    if (filterQuality === "all") return matchesSearch
    if (filterQuality === "excellent") return matchesSearch && event.quality.toLowerCase() === "excellent"
    if (filterQuality === "good") return matchesSearch && event.quality.toLowerCase() === "good"
    if (filterQuality === "fair") return matchesSearch && event.quality.toLowerCase() === "fair"
    if (filterQuality === "poor") return matchesSearch && event.quality.toLowerCase() === "poor"
    if (filterQuality === "very-poor") return matchesSearch && event.quality.toLowerCase() === "very poor"

    return matchesSearch
  })

  // Sort events by timestamp
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime()
    const dateB = new Date(b.timestamp).getTime()
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA
  })

  const getQualityBadge = (quality: string) => {
    switch (quality.toLowerCase()) {
      case "excellent":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Excellent</Badge>
      case "good":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Good</Badge>
      case "fair":
        return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Fair</Badge>
      case "poor":
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Poor</Badge>
      case "very poor":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Very Poor</Badge>
      default:
        return <Badge variant="outline">{quality}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
          <p className="text-sm text-muted-foreground">No sleep events recorded yet</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search sleep records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterQuality} onValueChange={(value) => setFilterQuality(value as any)}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quality</SelectItem>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="very-poor">Very Poor</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                title={sortOrder === "asc" ? "Sort Descending" : "Sort Ascending"}
              >
                <ArrowUpDown className={`h-4 w-4 ${sortOrder === "asc" ? "rotate-180" : ""} transition-transform`} />
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <div className="grid grid-cols-12 gap-2 p-4 font-medium border-b text-sm">
              <div className="col-span-3 sm:col-span-2">Date</div>
              <div className="col-span-3 sm:col-span-2">Time</div>
              <div className="col-span-3 sm:col-span-1">Duration</div>
              <div className="col-span-3 sm:col-span-2">Quality</div>
              <div className="hidden sm:block sm:col-span-5">Notes</div>
            </div>

            <div className="divide-y max-h-[500px] overflow-auto">
              {sortedEvents.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No results found. Try adjusting your search or filters.
                </div>
              ) : (
                sortedEvents.map((event) => (
                  <div key={event.id} className="grid grid-cols-12 gap-2 p-4 text-sm items-center">
                    <div className="col-span-3 sm:col-span-2">{format(new Date(event.timestamp), "MMM d, yyyy")}</div>
                    <div className="col-span-3 sm:col-span-2">{format(new Date(event.timestamp), "h:mm a")}</div>
                    <div className="col-span-3 sm:col-span-1">{event.duration.toFixed(1)} hrs</div>
                    <div className="col-span-3 sm:col-span-2">{getQualityBadge(event.quality)}</div>
                    <div className="col-span-12 sm:col-span-5 mt-2 sm:mt-0">
                      <div className="sm:hidden text-xs text-muted-foreground mb-1">Notes:</div>
                      {event.notes || <span className="text-muted-foreground text-xs">No notes</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {sortedEvents.length} of {events.length} sleep records
          </div>
        </>
      )}
    </div>
  )
}

