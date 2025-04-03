"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface DiaperEvent {
  id: string
  timestamp: string
  type: string
  date: Date
}

interface DiaperTimeAnalysisProps {
  events: DiaperEvent[]
}

export function DiaperTimeAnalysis({ events }: DiaperTimeAnalysisProps) {
  const timeData = useMemo(() => {
    // Initialize time slots (24 hours)
    const timeSlots = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`,
      count: 0,
      wet: 0,
      dirty: 0,
      mixed: 0,
      dry: 0,
    }))

    // Count events by hour and type
    events.forEach((event) => {
      const date = new Date(event.timestamp)
      const hour = date.getHours()

      timeSlots[hour].count++

      // Increment type count
      const type = event.type.toLowerCase()
      if (type.includes("wet")) timeSlots[hour].wet++
      else if (type.includes("dirty")) timeSlots[hour].dirty++
      else if (type.includes("mixed")) timeSlots[hour].mixed++
      else if (type.includes("dry")) timeSlots[hour].dry++
    })

    // Group by 3-hour intervals for better visualization
    const groupedData = []
    for (let i = 0; i < 24; i += 3) {
      const group = {
        timeRange: `${timeSlots[i].label}-${timeSlots[i + 2]?.label || timeSlots[0].label}`,
        count: 0,
        wet: 0,
        dirty: 0,
        mixed: 0,
        dry: 0,
      }

      for (let j = 0; j < 3; j++) {
        if (i + j < 24) {
          group.count += timeSlots[i + j].count
          group.wet += timeSlots[i + j].wet
          group.dirty += timeSlots[i + j].dirty
          group.mixed += timeSlots[i + j].mixed
          group.dry += timeSlots[i + j].dry
        }
      }

      groupedData.push(group)
    }

    return groupedData
  }, [events])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-md">
          <p className="font-medium text-sm mb-2">{label}</p>
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex items-center justify-between text-xs">
              <span className="capitalize">{entry.name}:</span>
              <span className="font-medium ml-2">{entry.value}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  if (events.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-muted-foreground">No diaper data available</p>
      </div>
    )
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={timeData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="timeRange" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="wet" name="Wet" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="dirty" name="Dirty" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="mixed" name="Mixed" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="dry" name="Dry" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

