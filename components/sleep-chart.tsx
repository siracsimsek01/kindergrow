import type React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useMediaQuery } from "@/hooks/use-media-query"

interface SleepChartProps {
  data: any[];
  selectedChild?: any
}

export const SleepChart: React.FC<SleepChartProps> = ({ data, selectedChild }) => {
  const isMobile = useMediaQuery("(max-width: 640px)")

  // Add console logging to debug the data
  console.log("Sleep chart data:", data)

  return (
    <div className="w-full h-full">
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">
          Sleep hours for {selectedChild?.name || "your child"} (last 7 days)
        </p>
      </div>
      {!data || data.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">No sleep data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: isMobile ? 10 : 30,
              left: isMobile ? 0 : 20,
              bottom: isMobile ? 40 : 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: isMobile ? 10 : 12 }}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? "end" : "middle"}
              height={isMobile ? 60 : 30}
            />
            <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} domain={[0, "auto"]} />
            <Tooltip formatter={(value) => [`${value} hours`, "Duration"]} />
            <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
            <Bar
              dataKey="hours"
              fill="hsl(var(--secondary))"
              radius={[4, 4, 0, 0]}
              name="Sleep Duration (hours)"
              isAnimationActive={true}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default SleepChart

