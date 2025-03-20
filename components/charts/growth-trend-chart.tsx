"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  {
    month: "Oct",
    weight: 6.2,
    height: 60,
  },
  {
    month: "Nov",
    weight: 6.8,
    height: 62,
  },
  {
    month: "Dec",
    weight: 7.3,
    height: 64,
  },
  {
    month: "Jan",
    weight: 7.8,
    height: 66,
  },
  {
    month: "Feb",
    weight: 8.2,
    height: 68,
  },
  {
    month: "Mar",
    weight: 8.5,
    height: 70,
  },
]

export function GrowthTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          yAxisId="left"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}kg`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}cm`}
        />
        <Tooltip />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="weight"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          activeDot={{ r: 6 }}
          name="Weight (kg)"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="height"
          stroke="hsl(var(--secondary))"
          strokeWidth={2}
          activeDot={{ r: 6 }}
          name="Height (cm)"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

