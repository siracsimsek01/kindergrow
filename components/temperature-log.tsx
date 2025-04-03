"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, ArrowUpDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TemperatureEvent {
  id: string
  timestamp: string
  details: string
  value: number
  notes: string
  date: Date
}

interface TemperatureLogProps {
  events: TemperatureEvent[]
  hasFever: (temp: number) => boolean
}

export function TemperatureLog({ events, hasFever }: TemperatureLogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterType, setFilterType] = useState<"all" | "normal" | "fever">("all")

  // Filter events based on search term and filter type
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      format(new Date(event.timestamp), "MMM d, yyyy h:mm a").toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.value.toString().includes(searchTerm)

    if (filterType === "all") return matchesSearch
    if (filterType === "fever") return matchesSearch && hasFever(event.value)
    if (filterType === "normal") return matchesSearch && !hasFever(event.value)

    return matchesSearch
  })

  // Sort events by timestamp
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime()
    const dateB = new Date(b.timestamp).getTime()
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA
  })

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
          <p className="text-sm text-muted-foreground">No temperature readings recorded yet</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search temperature readings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={(value) => setFilterType(value as "all" | "normal" | "fever")}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Readings</SelectItem>
                  <SelectItem value="normal">Normal Temp</SelectItem>
                  <SelectItem value="fever">Fever</SelectItem>
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
              <div className="col-span-3 sm:col-span-2">Temperature</div>
              <div className="col-span-3 sm:col-span-2">Status</div>
              <div className="hidden sm:block sm:col-span-4">Notes</div>
            </div>

            <div className="divide-y">
              {sortedEvents.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No results found. Try adjusting your search or filters.
                </div>
              ) : (
                sortedEvents.map((event) => (
                  <div key={event.id} className="grid grid-cols-12 gap-2 p-4 text-sm items-center">
                    <div className="col-span-3 sm:col-span-2">{format(new Date(event.timestamp), "MMM d, yyyy")}</div>
                    <div className="col-span-3 sm:col-span-2">{format(new Date(event.timestamp), "h:mm a")}</div>
                    <div
                      className={`col-span-3 sm:col-span-2 font-medium ${hasFever(event.value) ? "text-destructive" : ""}`}
                    >
                      {event.value.toFixed(1)}°C
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      {hasFever(event.value) ? (
                        <Badge variant="destructive">Fever</Badge>
                      ) : (
                        <Badge variant="outline">Normal</Badge>
                      )}
                    </div>
                    <div className="col-span-12 sm:col-span-4 mt-2 sm:mt-0">
                      <div className="sm:hidden text-xs text-muted-foreground mb-1">Notes:</div>
                      {event.notes || <span className="text-muted-foreground text-xs">No notes</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {sortedEvents.length} of {events.length} temperature readings
          </div>
        </>
      )}
    </div>
  )
}

