"use client"

import type React from "react"

import { createContext, useContext, useMemo } from "react"
import { cn } from "@/lib/utils"

interface ChartConfig {
  [key: string]: {
    label: string
    color: string
  }
}

interface ChartContextValue {
  config: ChartConfig
}

const ChartContext = createContext<ChartContextValue | null>(null)

function useChartContext() {
  const context = useContext(ChartContext)
  if (!context) {
    throw new Error("useChartContext must be used within a ChartContainer")
  }
  return context
}

interface ChartContainerProps {
  config: ChartConfig
  children: React.ReactNode
  className?: string
}

function ChartContainer({ config, children, className }: ChartContainerProps) {
  // Create CSS variables for colors
  const style = useMemo(() => {
    return Object.entries(config).reduce(
      (acc, [key, value]) => {
        acc[`--color-${key}`] = value.color
        return acc
      },
      {} as Record<string, string>,
    )
  }, [config])

  return (
    <ChartContext.Provider value={{ config }}>
      <div className={cn("w-full", className)} style={style}>
        {children}
      </div>
    </ChartContext.Provider>
  )
}

interface ChartTooltipContentProps {
  active?: boolean
  payload?: Array<{
    name?: string
    value?: number
    dataKey?: string
    payload?: Record<string, any>
    content?: React.ReactNode
  }>
  label?: string
}

function ChartTooltipContent({ active, payload, label }: ChartTooltipContentProps) {
  const { config } = useChartContext()

  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <div className="font-medium">{label}</div>
        <div className="font-medium text-right">Value</div>
        {payload.map((item) => {
          const dataKey = item.dataKey as string
          const configItem = config[dataKey]

          if (!configItem) return null

          return (
            <div key={dataKey} className="col-span-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: configItem.color }} />
                <span>{configItem.label}</span>
              </div>
              <div>{item.value}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface ChartLegendContentProps {
  payload?: Array<{
    value?: string
    type?: string
    color?: string
    payload?: Record<string, any>
  }>
  nameKey?: string
  className?: string
}

function ChartLegendContent({ payload, nameKey, className }: ChartLegendContentProps) {
  const { config } = useChartContext()

  if (!payload?.length) {
    return null
  }

  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      {payload.map((item, index) => {
        const key = nameKey ? item.payload?.[nameKey] : item.value
        const configItem = config[key as string]
        
        return (
          <div key={index} className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{
                backgroundColor: configItem?.color || item.color,
              }}
            />
            <span className="text-xs text-muted-foreground">
              {configItem?.label || item.value}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function ChartLegend({ content, ...props }: any) {
  return content ? content : null
}

export { ChartContainer, ChartTooltipContent, ChartLegendContent, ChartLegend, useChartContext }
export type { ChartConfig }

