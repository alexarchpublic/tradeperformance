"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { useState } from "react";
import { type EquityCurvePoint } from "@/lib/utils/trade-data";
import { RangeSlider } from "@/components/ui/range-slider";

interface TradeChartProps {
  data: {
    equityCurve: EquityCurvePoint[];
  };
  selectedMetrics: string[];
  hoveredTradeIndex: number | null;
}

type DateRange = {
  start: number;
  end: number;
} | null;

const METRIC_COLORS = {
  equity: "#22c55e",
  pnl: "#3b82f6",
  drawdown: "#ef4444",
};

export function TradeChart({ data, selectedMetrics, hoveredTradeIndex }: TradeChartProps) {
  const [dateRange, setDateRange] = useState<DateRange>(null);
  const [sliderRange, setSliderRange] = useState<[number, number]>([0, 100]);

  // Identify which metrics are selected
  const isEquitySelected = selectedMetrics.includes("equity");
  const isPnLSelected = selectedMetrics.includes("pnl");
  const isDrawdownSelected = selectedMetrics.includes("drawdown");

  // Decide if PnL is on the main chart or subgraph
  const onlyPnl = isPnLSelected && selectedMetrics.length === 1;
  // Show subgraph if PnL + (equity or drawdown) => i.e. PnL plus at least one more metric
  const showPnLSubgraph = isPnLSelected && selectedMetrics.length > 1;

  // Filter data by current dateRange for the chart lines
  const getVisibleData = () => {
    if (!dateRange || !data.equityCurve.length) {
      return data.equityCurve;
    }
    return data.equityCurve.filter((point) => {
      const timestamp = new Date(point.date).getTime();
      return timestamp >= dateRange.start && timestamp <= dateRange.end;
    });
  };

  // Convert slider range (0-100) to date range
  const handleSliderChange = (newRange: [number, number]) => {
    const firstDate = new Date(data.equityCurve[0].date);
    const lastDate = new Date(data.equityCurve[data.equityCurve.length - 1].date);
    const totalTimespan = lastDate.getTime() - firstDate.getTime();
    
    const startTime = firstDate.getTime() + (totalTimespan * (newRange[0] / 100));
    const endTime = firstDate.getTime() + (totalTimespan * (newRange[1] / 100));
    
    setDateRange({
      start: startTime,
      end: endTime
    });
    setSliderRange(newRange);
  };

  // Compute axis domains
  const calculateDomains = () => {
    const visibleData = getVisibleData();
    if (!visibleData.length) {
      return {
        dollarDomain: [0, 0],
        pnlDomain: [0, 0],
        drawdownDomain: [0, 0],
      };
    }

    const equityValues = visibleData.map((d) => d.equity);
    const pnlValues = visibleData.map((d) => d.pnl);
    const drawdownValues = visibleData.map((d) => d.drawdown);

    const maxEquity = Math.max(...equityValues);
    const minEquity = Math.min(...equityValues);
    const equityPadding = (maxEquity - minEquity) * 0.1;

    const maxPnL = Math.max(...pnlValues, 0);
    const minPnL = Math.min(...pnlValues, 0);
    const pnlPadding = (maxPnL - minPnL) * 0.1;

    const minDrawdown = Math.min(...drawdownValues);
    const drawdownPadding = Math.abs(minDrawdown) * 0.1;

    let dollarMin: number;
    let dollarMax: number;

    if (onlyPnl) {
      // Only PnL => main chart shows PnL
      dollarMin = minPnL - pnlPadding;
      dollarMax = maxPnL + pnlPadding;
    } else if (isEquitySelected) {
      // Equity => main chart uses equity domain
      dollarMin = minEquity - equityPadding;
      dollarMax = maxEquity + equityPadding;
    } else {
      // e.g. drawdown only => no meaningful $ metric to show
      dollarMin = 0;
      dollarMax = 0;
    }

    return {
      dollarDomain: [dollarMin, dollarMax],
      pnlDomain: [minPnL - pnlPadding, maxPnL + pnlPadding],
      drawdownDomain: [minDrawdown - drawdownPadding, 0],
    };
  };

  const visibleData = getVisibleData();
  const { dollarDomain, pnlDomain, drawdownDomain } = calculateDomains();

  // Formatters
  const formatDollar = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  // Debug logging
  console.debug("TradeChart state:", {
    hoveredTradeIndex,
    visibleDataLength: visibleData.length,
    totalDataLength: data.equityCurve.length,
    selectedMetrics,
    onlyPnl,
    showPnLSubgraph,
    dateRange,
  });

  return (
    <div className="w-full h-[600px] relative">
      <div className="w-full h-[calc(100%-60px)]">
        <ResponsiveContainer>
          <div className="flex flex-col h-full">
            <div className={showPnLSubgraph ? "h-2/3" : "h-full"}>
              <ResponsiveContainer>
                <LineChart
                  data={visibleData}
                  margin={{ top: 20, right: 70, bottom: 60, left: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
                    tick={{ fontSize: 12 }}
                    padding={{ left: 20, right: 20 }}
                    hide={showPnLSubgraph}
                  />
                  <YAxis
                    yAxisId="dollar"
                    orientation="left"
                    tickFormatter={formatDollar}
                    domain={dollarDomain}
                    tick={{ fontSize: 12 }}
                    label={{
                      value: onlyPnl ? "Trade P&L ($)" : "Account Value ($)",
                      angle: -90,
                      position: "insideLeft",
                      offset: -50,
                      style: { textAnchor: "middle", fontSize: 12 },
                    }}
                  />
                  {isDrawdownSelected && (
                    <YAxis
                      yAxisId="drawdown"
                      orientation="right"
                      tickFormatter={formatPercent}
                      domain={drawdownDomain}
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Peak to Peak Drawdown (%)",
                        angle: 90,
                        position: "insideRight",
                        offset: -40,
                        style: { textAnchor: "middle", fontSize: 12 },
                      }}
                    />
                  )}

                  <Tooltip
                    trigger="hover"
                    formatter={(value: number, name: string) => {
                      if (name === "Peak to Peak Drawdown") {
                        return [formatPercent(value), name];
                      }
                      return [formatDollar(value), name];
                    }}
                    labelFormatter={(label) =>
                      format(new Date(label), "MMM d, yyyy HH:mm")
                    }
                  />

                  {/* EQUITY LINE */}
                  {isEquitySelected && (
                    <Line
                      type="stepAfter"
                      dataKey="equity"
                      name="Account Value"
                      stroke={METRIC_COLORS.equity}
                      yAxisId="dollar"
                      dot={false}
                      activeDot={{ r: 6 }}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  )}

                  {/* DRAWDOWN LINE */}
                  {isDrawdownSelected && (
                    <Line
                      type="monotone"
                      dataKey="drawdown"
                      name="Peak to Peak Drawdown"
                      stroke={METRIC_COLORS.drawdown}
                      yAxisId="drawdown"
                      dot={false}
                      activeDot={{ r: 6 }}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  )}

                  {/* PNL ON MAIN CHART (ONLY IF IT IS THE SINGLE METRIC) */}
                  {onlyPnl && (
                    <Line
                      type="stepAfter"
                      dataKey="pnl"
                      name="P&L"
                      stroke={METRIC_COLORS.pnl}
                      yAxisId="dollar"
                      dot={false}
                      activeDot={{ r: 6 }}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {showPnLSubgraph && (
              <div className="h-1/3">
                <ResponsiveContainer>
                  <LineChart
                    data={visibleData}
                    margin={{ top: 20, right: 70, bottom: 30, left: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
                      tick={{ fontSize: 12 }}
                      padding={{ left: 20, right: 20 }}
                    />
                    <YAxis
                      tickFormatter={formatDollar}
                      domain={pnlDomain}
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Trade P&L ($)",
                        angle: -90,
                        position: "insideLeft",
                        offset: -50,
                        style: { textAnchor: "middle", fontSize: 12 },
                      }}
                    />
                    <Tooltip
                      trigger="hover"
                      formatter={(value: number) => [formatDollar(value), "P&L"]}
                      labelFormatter={(label) => format(new Date(label), "MMM d, yyyy HH:mm")}
                    />
                    <Line
                      type="stepAfter"
                      dataKey="pnl"
                      name="P&L"
                      stroke={METRIC_COLORS.pnl}
                      dot={false}
                      activeDot={{ r: 6 }}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </ResponsiveContainer>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[60px] px-4 py-2">
        <RangeSlider
          value={sliderRange}
          onChange={handleSliderChange}
          min={0}
          max={100}
          step={0.1}
          className="w-full"
        />
      </div>
    </div>
  );
}
