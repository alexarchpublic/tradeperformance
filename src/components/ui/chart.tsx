import * as React from "react"
import { ResponsiveContainer } from "recharts"

export interface ChartConfig {
  [key: string]: {
    label: string
    color: string
  }
}

interface ChartContainerProps {
  children: React.ReactElement
  config: ChartConfig
}

export function ChartContainer({
  children,
}: ChartContainerProps) {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}

interface ChartTooltipContentProps {
  active?: boolean
  payload?: Array<{
    name?: string
    value?: number
    color?: string
  }>
  label?: string | number
}

export function ChartTooltipContent({
  active,
  payload,
  label,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-muted-foreground">
            {label}
          </span>
          {payload.map((item) => (
            <span
              key={item.name}
              className="font-bold"
              style={{ color: item.color }}
            >
              {item.name}
            </span>
          ))}
        </div>
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-muted-foreground">
            Value
          </span>
          {payload.map((item) => (
            <span
              key={item.name}
              className="font-bold"
              style={{ color: item.color }}
            >
              {typeof item.value === "number"
                ? new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(item.value)
                : item.value}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export { Tooltip as ChartTooltip } from "recharts" 