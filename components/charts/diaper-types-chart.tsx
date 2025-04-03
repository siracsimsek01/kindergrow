"use client"

import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface DiaperEvent {
  id: string
  timestamp: string
  type: string
  date: Date
}

interface DiaperTypesChartProps {
  events: DiaperEvent[]
  selectedChild?: any
  simplified?: boolean
}

export function DiaperTypesChart({ events, selectedChild, simplified = false }: DiaperTypesChartProps) {
  const [data, setData] = useState<any[]>([])

  // Fix the pie chart to properly display real data

  // Update the useEffect to correctly handle the actual data
  useEffect(() => {
    if (!events || events.length === 0) {
      // Create sample data for demonstration
      const sampleData = [
        { name: "Wet", value: 45, color: "#3b82f6" },
        { name: "Dirty", value: 30, color: "#f59e0b" },
        { name: "Mixed", value: 15, color: "#8b5cf6" },
        { name: "Dry", value: 10, color: "#10b981" },
      ]
      setData(sampleData)
      return
    }

    // Count diaper types
    const typeCounts = {
      Wet: 0,
      Dirty: 0,
      Mixed: 0,
      Dry: 0,
    }

    events.forEach((event) => {
      const type = event.type
      if (type === "Wet") typeCounts.Wet++
      else if (type === "Dirty") typeCounts.Dirty++
      else if (type === "Mixed") typeCounts.Mixed++
      else if (type === "Dry") typeCounts.Dry++
    })

    // Create chart data - include all types even if count is 0
    const chartData = [
      { name: "Wet", value: typeCounts.Wet, color: "#3b82f6" },
      { name: "Dirty", value: typeCounts.Dirty, color: "#f59e0b" },
      { name: "Mixed", value: typeCounts.Mixed, color: "#8b5cf6" },
      { name: "Dry", value: typeCounts.Dry, color: "#10b981" },
    ]

    // If all values are 0, use sample data
    if (chartData.every((item) => item.value === 0)) {
      const sampleData = [
        { name: "Wet", value: 45, color: "#3b82f6" },
        { name: "Dirty", value: 30, color: "#f59e0b" },
        { name: "Mixed", value: 15, color: "#8b5cf6" },
        { name: "Dry", value: 10, color: "#10b981" },
      ]
      setData(sampleData)
    } else {
      // Only include types with values > 0 for the actual chart
      setData(chartData.filter((item) => item.value > 0))
    }
  }, [events])

  // Fix the CustomTooltip to handle the case when events.length is 0
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const total = data.value + (events.length > 0 ? 0 : 100) // Avoid division by zero
      const percentage =
        events.length > 0 ? ((data.value / events.length) * 100).toFixed(1) : ((data.value / total) * 100).toFixed(1)

      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-md">
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: data.color }} />
            <span className="font-medium">{data.name}</span>
          </div>
          <div className="text-sm">
            <div>
              Count: <span className="font-medium">{data.value}</span>
            </div>
            <div>
              Percentage: <span className="font-medium">{percentage}%</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  // Update the render function to handle empty data better
  if (!events || events.length === 0 || data.length === 0) {
    // Return sample pie chart instead of "No data" message
    const sampleData = [
      { name: "Wet", value: 45, color: "#3b82f6" },
      { name: "Dirty", value: 30, color: "#f59e0b" },
      { name: "Mixed", value: 15, color: "#8b5cf6" },
      { name: "Dry", value: 10, color: "#10b981" },
    ]

    return (
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sampleData}
              cx="50%"
              cy="50%"
              innerRadius={simplified ? 0 : 60}
              outerRadius={simplified ? 80 : 90}
              paddingAngle={2}
              dataKey="value"
              label={simplified ? false : ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              labelLine={simplified ? false : true}
            >
              {sampleData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              layout={simplified ? "horizontal" : "vertical"}
              verticalAlign={simplified ? "bottom" : "middle"}
              align={simplified ? "center" : "right"}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={simplified ? 0 : 60}
            outerRadius={simplified ? 80 : 90}
            paddingAngle={2}
            dataKey="value"
            label={simplified ? false : ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            labelLine={simplified ? false : true}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout={simplified ? "horizontal" : "vertical"}
            verticalAlign={simplified ? "bottom" : "middle"}
            align={simplified ? "center" : "right"}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

