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

const METRIC_COLORS = {
  equity: "#22c55e",
  pnl: "#3b82f6",
  drawdown: "#ef4444",
};

export function TradeChart({ data, selectedMetrics, hoveredTradeIndex }: TradeChartProps) {
  const [dateRange, setDateRange] = useState<DateRange>(null);

  // Helpers to determine which metrics are selected
  const isEquitySelected = selectedMetrics.includes("equity");
  const isPnLSelected = selectedMetrics.includes("pnl");
  const isDrawdownSelected = selectedMetrics.includes("drawdown");

  // If PnL is selected alone, show PnL on the main chart.
  // If PnL is selected with any other metric(s), show it on a subgraph.
  const onlyPnl = isPnLSelected && selectedMetrics.length === 1;
  const showPnLSubgraph = isPnLSelected && selectedMetrics.length > 1;

  // Filter the data by the current dateRange
  const getVisibleData = () => {
    if (!dateRange || !data.equityCurve.length) {
      return data.equityCurve;
    }
    return data.equityCurve.filter((point) => {
      const timestamp = new Date(point.date).getTime();
      return timestamp >= dateRange.start && timestamp <= dateRange.end;
    });
  };

  // Called whenever the user drags/zooms the brush
  const handleBrushChange = (range: BrushRange) => {
    // If range is null or undefined, reset the zoom
    if (!range) {
      setDateRange(null);
      return;
    }

    // Ensure we have valid indices
    if (typeof range.startIndex !== "number" || typeof range.endIndex !== "number") {
      return;
    }

    // Ensure indices are within bounds
    const startIndex = Math.max(0, Math.min(range.startIndex, data.equityCurve.length - 1));
    const endIndex = Math.max(startIndex, Math.min(range.endIndex, data.equityCurve.length - 1));

    // Only update if we have valid indices and they're different
    if (startIndex !== endIndex) {
      const startDate = new Date(data.equityCurve[startIndex].date).getTime();
      const endDate = new Date(data.equityCurve[endIndex].date).getTime();
      setDateRange({ start: startDate, end: endDate });
    }
  };

  // Compute Y-axis domains
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

    // Equity domain
    const maxEquity = Math.max(...equityValues);
    const minEquity = Math.min(...equityValues);
    const equityPadding = (maxEquity - minEquity) * 0.1;

    // PnL domain
    const maxPnL = Math.max(...pnlValues, 0);
    const minPnL = Math.min(...pnlValues, 0);
    const pnlPadding = (maxPnL - minPnL) * 0.1;

    // Drawdown domain
    const minDrawdown = Math.min(...drawdownValues);
    const drawdownPadding = Math.abs(minDrawdown) * 0.1;

    // Decide the main chart's dollar-domain logic:
    let dollarMin: number;
    let dollarMax: number;

    if (onlyPnl) {
      // Only PnL is selected => main chart should display PnL on dollar axis
      dollarMin = minPnL - pnlPadding;
      dollarMax = maxPnL + pnlPadding;
    } else if (isEquitySelected) {
      // Equity is selected (and not "only PnL"), so use equity domain
      dollarMin = minEquity - equityPadding;
      dollarMax = maxEquity + equityPadding;
    } else {
      // If we don't have equity or only have drawdown or a combination
      // like PnL + drawdown but not alone => PnL subgraph
      // The main chart has no dollar-based lines except equity (not selected),
      // so let's default the main chart's dollar axis to [0,0].
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
  const formatDollar = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

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
      {/* MAIN CHART */}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
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
            />
            <YAxis
              yAxisId="dollar"
              orientation="left"
              tickFormatter={formatDollar}
              domain={dollarDomain}
              tick={{ fontSize: 12 }}
              label={{
                value: "Account Value ($)",
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

            {/* EQUITY line */}
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

            {/* DRAWDOWN line */}
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

            {/* PNL line on main chart ONLY if it's the only metric selected */}
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

            <Brush
              dataKey="date"
              height={40}
              stroke="#8884d8"
              fill="#1f2937"
              travellerWidth={8}
              alwaysShowText
              onChange={handleBrushChange}
              tickFormatter={(date) => format(new Date(date), "MMM d")}
              // Provide valid start/end so the brush handles are draggable
              startIndex={0}
              endIndex={data.equityCurve.length - 1}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* SUBGRAPH for PnL if it's selected + any other metric */}
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
