"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  {
    day: "Mon",
    formula: 500,
    breastMilk: 250,
  },
  {
    day: "Tue",
    formula: 450,
    breastMilk: 300,
  },
  {
    day: "Wed",
    formula: 420,
    breastMilk: 280,
  },
  {
    day: "Thu",
    formula: 480,
    breastMilk: 220,
  },
  {
    day: "Fri",
    formula: 520,
    breastMilk: 200,
  },
  {
    day: "Sat",
    formula: 500,
    breastMilk: 250,
  },
  {
    day: "Sun",
    formula: 450,
    breastMilk: 270,
  },
]

export function FeedingTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}ml`}
        />
        <Tooltip formatter={(value) => [`${value} ml`, ""]} labelFormatter={(label) => `${label}`} />
        <Bar dataKey="formula" name="Formula" stackId="a" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="breastMilk" name="Breast Milk" stackId="a" fill="hsl(var(--primary)/0.3)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

