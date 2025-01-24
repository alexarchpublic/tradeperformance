"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { type EquityCurvePoint } from "@/lib/utils/trade-data";
import { useCohortData } from "@/hooks/useCohortData";
import { Checkbox } from "@/components/ui/checkbox";

interface CohortAnalysisProps {
  equityCurve: EquityCurvePoint[];
}

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#84cc16", "#f97316", "#ec4899", "#64748b"
];

export function CohortAnalysis({ equityCurve }: CohortAnalysisProps) {
  const { cohorts, uniqueCohorts } = useCohortData(equityCurve);
  const [selectedCohorts, setSelectedCohorts] = useState<string[]>([]);

  // Default to selecting first 3 cohorts if none selected
  const visibleCohorts = selectedCohorts.length > 0 
    ? selectedCohorts 
    : uniqueCohorts.slice(0, 3);

  const formatDollar = (value: number) => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Cohort Analysis</h2>
      
      {/* Cohort Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Select Cohorts</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {uniqueCohorts.map((cohort, idx) => (
            <label key={cohort} className="flex items-center space-x-2">
              <Checkbox
                checked={selectedCohorts.includes(cohort)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedCohorts([...selectedCohorts, cohort]);
                  } else {
                    setSelectedCohorts(selectedCohorts.filter(c => c !== cohort));
                  }
                }}
              />
              <span className="text-sm">{cohort}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Equity Curves */}
      <div className="h-[400px] mb-8">
        <h3 className="text-lg font-semibold mb-3">Cohort Equity Curves</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 20, right: 20, bottom: 20, left: 70 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              dataKey="day"
              label={{ value: "Days Since Cohort Start", position: "bottom" }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatDollar}
              label={{
                value: "Account Value ($)",
                angle: -90,
                position: "insideLeft",
                offset: -50,
              }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => formatDollar(value)}
              labelFormatter={(day) => `Day ${day}`}
            />
            <Legend />
            {cohorts
              .filter(cohort => visibleCohorts.includes(cohort.startDate))
              .map((cohort, idx) => (
                <Line
                  key={cohort.startDate}
                  data={cohort.data}
                  type="monotone"
                  dataKey="equity"
                  name={`Cohort ${cohort.startDate}`}
                  stroke={COLORS[idx % COLORS.length]}
                  dot={false}
                  strokeWidth={2}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Velocity Chart */}
      <div className="h-[400px]">
        <h3 className="text-lg font-semibold mb-3">Equity Velocity</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 20, right: 20, bottom: 20, left: 70 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              dataKey="day"
              label={{ value: "Days Since Cohort Start", position: "bottom" }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatDollar}
              label={{
                value: "Daily P&L ($)",
                angle: -90,
                position: "insideLeft",
                offset: -50,
              }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => formatDollar(value)}
              labelFormatter={(day) => `Day ${day}`}
            />
            <Legend />
            {cohorts
              .filter(cohort => visibleCohorts.includes(cohort.startDate))
              .map((cohort, idx) => (
                <Line
                  key={cohort.startDate}
                  data={cohort.data}
                  type="monotone"
                  dataKey="velocity"
                  name={`Cohort ${cohort.startDate}`}
                  stroke={COLORS[idx % COLORS.length]}
                  dot={false}
                  strokeWidth={2}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 