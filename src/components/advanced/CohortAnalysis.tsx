"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface CohortAnalysisProps {
  equityCurve: EquityCurvePoint[];
}

// Colors for cohorts using shadcn chart colors
const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
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

  // Create chart config for visible cohorts
  const chartConfig = visibleCohorts.reduce((acc, cohort, idx) => {
    acc[`cohort-${cohort}`] = {
      label: `Cohort ${cohort}`,
      color: COLORS[idx % COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cohort Analysis</CardTitle>
        <CardDescription>
          Compare performance across different time periods by grouping trades into monthly cohorts. 
          Each cohort tracks cumulative performance from its start date.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
        <div className="h-[600px] w-full mb-12">
          <ChartContainer config={chartConfig}>
            <LineChart
              margin={{ top: 20, right: 30, bottom: 70, left: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="tradeNumber"
                label={{
                  value: "Trade Number",
                  position: "bottom",
                  offset: 45,
                }}
                tick={{ fontSize: 12 }}
                type="number"
                domain={[0, 'dataMax']}
                allowDataOverflow={false}
              />
              <YAxis
                tickFormatter={(value) => new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                }).format(value)}
                label={{
                  value: "Account Value ($)",
                  angle: -90,
                  position: "insideLeft",
                  offset: -50,
                }}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
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
                    isAnimationActive={false}
                    connectNulls={true}
                  />
                ))}
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
} 