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
import { type EquityCurvePoint } from "@/lib/utils/trade-data";
import { useCohortData } from "@/hooks/useCohortData";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CohortAnalysisProps {
  equityCurve: EquityCurvePoint[];
}

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#84cc16", "#f97316", "#ec4899", "#64748b"
];

const DEFAULT_YEAR = "2019";

export function CohortAnalysis({ equityCurve }: CohortAnalysisProps) {
  const { cohorts, uniqueCohorts } = useCohortData(equityCurve);
  const [selectedCohorts, setSelectedCohorts] = useState<string[]>([]);
  const [yearFilter, setYearFilter] = useState<string>(DEFAULT_YEAR);

  // Get unique years from cohorts
  const years = [...new Set(uniqueCohorts.map(cohort => cohort.substring(0, 4)))].sort();

  // Filter cohorts by year
  const filteredCohorts = uniqueCohorts.filter(cohort => cohort.startsWith(yearFilter));

  // Default to selecting first 3 cohorts if none selected
  const visibleCohorts = selectedCohorts.length > 0 
    ? selectedCohorts 
    : filteredCohorts.slice(0, 3);

  const handleReset = () => {
    setSelectedCohorts([]);
    setYearFilter(DEFAULT_YEAR);
  };

  const formatDollar = (value: number) => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {/* Cohort Selection */}
      <div className="mb-6 space-y-4">
        {/* Year Selection and Reset */}
        <div className="flex items-center gap-4">
          <div className="w-48">
            <Select
              value={yearFilter}
              onValueChange={setYearFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Filter by Year</SelectLabel>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Button 
            variant="outline" 
            onClick={handleReset}
          >
            Reset Cohorts
          </Button>
        </div>

        {/* Selected Cohorts */}
        {selectedCohorts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCohorts.map((cohort) => (
              <Button
                key={cohort}
                variant="default"
                size="sm"
                onClick={() => setSelectedCohorts(selectedCohorts.filter(c => c !== cohort))}
                className="bg-primary/10 hover:bg-primary/20 text-primary"
              >
                {cohort} ✕
              </Button>
            ))}
          </div>
        )}

        {/* Available Cohorts */}
        <div>
          <h4 className="text-sm font-medium mb-2">Available Cohorts</h4>
          <ScrollArea className="h-24">
            <div className="flex flex-wrap gap-2">
              {filteredCohorts
                .filter(cohort => !selectedCohorts.includes(cohort))
                .map((cohort) => (
                  <Button
                    key={cohort}
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCohorts([...selectedCohorts, cohort])}
                  >
                    {cohort}
                  </Button>
                ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Equity Curves */}
      <div className="h-[500px]">
        <h3 className="text-lg font-semibold mb-3">Cohort Equity Curves</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            margin={{ top: 20, right: 20, bottom: 60, left: 70 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              dataKey="tradeNumber"
              label={{ 
                value: "Trade Number", 
                position: "bottom",
                offset: 40
              }}
              tick={{ fontSize: 12 }}
              type="number"
              domain={[0, 'dataMax']}
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
              formatter={(value: number) => [formatDollar(value), 'Value']}
              labelFormatter={(tradeNumber) => `Trade ${tradeNumber}`}
            />
            <Legend 
              wrapperStyle={{ 
                paddingTop: '20px',
                paddingBottom: '20px'
              }}
            />
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
    </div>
  );
} 