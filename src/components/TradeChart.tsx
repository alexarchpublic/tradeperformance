"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
} from "recharts";
import { format } from "date-fns";
import { useState } from "react";
import { type EquityCurvePoint } from "@/lib/utils/trade-data";

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

interface BrushRange {
  startIndex?: number;
  endIndex?: number;
}

// Colors for each metric
const METRIC_COLORS = {
  equity: "#22c55e",
  pnl: "#3b82f6",
  drawdown: "#ef4444",
};

export function TradeChart({ data, selectedMetrics, hoveredTradeIndex }: TradeChartProps) {
  const [dateRange, setDateRange] = useState<DateRange>(null);

  // Identify which metrics are selected
  const isEquitySelected = selectedMetrics.includes("equity");
  const isPnLSelected = selectedMetrics.includes("pnl");
  const isDrawdownSelected = selectedMetrics.includes("drawdown");

  // Decide if PnL is on the main chart or subgraph
  const onlyPnl = isPnLSelected && selectedMetrics.length === 1;
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

  // When brush changes, update our dateRange state
  const handleBrushChange = (range: BrushRange) => {
    if (
      !range ||
      typeof range.startIndex !== "number" ||
      typeof range.endIndex !== "number"
    ) {
      setDateRange(null);
      return;
    }
    // Use the full data set here (data.equityCurve), not visibleData
    const startDate = new Date(data.equityCurve[range.startIndex].date).getTime();
    const endDate = new Date(data.equityCurve[range.endIndex].date).getTime();
    setDateRange({ start: startDate, end: endDate });
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
      // Equity is included => main chart uses equity domain
      dollarMin = minEquity - equityPadding;
      dollarMax = maxEquity + equityPadding;
    } else {
      // e.g. drawdown (without equity) => no meaningful $ metric to show
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
  });

  return (
    <div className="w-full h-[600px] flex flex-col">
      {/* Main chart: equity (or PnL if only PnL) & drawdown */}
      <div className={showPnLSubgraph ? "flex-1" : "flex-1"}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            // Render lines from filtered data
            data={visibleData}
            margin={{ top: 20, right: 70, bottom: 60, left: 70 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
              tick={{ fontSize: 12 }}
              padding={{ left: 20, right: 20 }}
            />
            <YAxis
              yAxisId="dollar"
              orientation="left"
              tickFormatter={formatDollar}
              domain={dollarDomain}
              tick={{ fontSize: 12 }}
              label={{
                value: onlyPnl
                  ? "Trade P&L ($)"
                  : "Account Value ($)",
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

            {/* Equity line */}
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

            {/* Drawdown line */}
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

            {/* Show PnL on main chart if it's the only metric */}
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

            {/* The brush references the FULL equityCurve data for indexing */}
            <Brush
              data={data.equityCurve}
              dataKey="date"
              height={40}
              stroke="#8884d8"
              fill="#1f2937"
              travellerWidth={8}
              alwaysShowText
              onChange={handleBrushChange}
              tickFormatter={(date) => format(new Date(date), "MMM d")}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Subgraph for PnL if multiple metrics are selected */}
      {showPnLSubgraph && (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
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
                labelFormatter={(label) =>
                  format(new Date(label), "MMM d, yyyy HH:mm")
                }
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
  );
}
