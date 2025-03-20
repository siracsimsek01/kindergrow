"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  {
    day: "Mon",
    nightSleep: 8.5,
    naps: 3.5,
  },
  {
    day: "Tue",
    nightSleep: 9,
    naps: 3,
  },
  {
    day: "Wed",
    nightSleep: 8,
    naps: 4,
  },
  {
    day: "Thu",
    nightSleep: 8.5,
    naps: 3.5,
  },
  {
    day: "Fri",
    nightSleep: 9.5,
    naps: 3,
  },
  {
    day: "Sat",
    nightSleep: 10,
    naps: 2.5,
  },
  {
    day: "Sun",
    nightSleep: 9,
    naps: 3.5,
  },
]

export function SleepTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}h`}
        />
        <Tooltip formatter={(value) => [`${value} hours`, ""]} labelFormatter={(label) => `${label}`} />
        <Line
          type="monotone"
          dataKey="nightSleep"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          activeDot={{ r: 6 }}
          name="Night Sleep"
        />
        <Line
          type="monotone"
          dataKey="naps"
          stroke="hsl(var(--primary)/0.3)"
          strokeWidth={2}
          activeDot={{ r: 6 }}
          name="Naps"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

