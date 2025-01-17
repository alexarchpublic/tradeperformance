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
import { useMemo, useState } from "react";
import { RangeSlider } from "@/components/ui/range-slider";
import { EquityCurvePoint } from "@/lib/utils/trade-data";

interface TradeChartProps {
  data: {
    equityCurve: EquityCurvePoint[];
  };
  selectedMetrics: string[];
}

// Colors for our lines
const METRIC_COLORS = {
  equity: "#22c55e",
  pnl: "#3b82f6",
  drawdown: "#ef4444",
};

/**
 * If drawdown is selected => second Y-axis => bigger right margin so both
 * the main chart and subgraph have the same width, keeping vertical lines aligned.
 */
function getChartMargins(isDrawdownSelected: boolean, isSubgraph: boolean) {
  const rightMargin = isDrawdownSelected ? 70 : 20;
  return {
    top: 20,
    right: rightMargin,
    bottom: isSubgraph ? 30 : 60,
    left: 70,
  };
}

/**
 * Main chart tooltip that shows Equity, Drawdown, and PnL
 * whether PnL is displayed on main or subgraph.
 */
interface CustomMainTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: Array<{
    name?: string;
    value?: number;
  }>;
}

function CustomMainTooltip({
  active,
  label,
  payload,
}: CustomMainTooltipProps) {
  if (!active || !payload?.length) return null;

  const equityItem = payload.find((p) => p.name === "Account Value");
  const drawdownItem = payload.find((p) => p.name === "Peak to Peak Drawdown");
  const pnlItem = payload.find((p) => p.name === "P&L");

  const formatDollar = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);

  const formatPercent = (val: number) => `${val.toFixed(2)}%`;

  return (
    <div className="bg-white p-2 rounded shadow text-xs text-gray-700">
      {label && (
        <div className="font-semibold border-b pb-1">
          {format(new Date(label), "MMM d, yyyy HH:mm")}
        </div>
      )}
      {equityItem && (
        <div className="flex items-center justify-between">
          <span className="text-green-600 mr-4">Equity:</span>
          <span>{formatDollar(equityItem.value ?? 0)}</span>
        </div>
      )}
      {drawdownItem && (
        <div className="flex items-center justify-between">
          <span className="text-red-600 mr-4">Drawdown:</span>
          <span>{formatPercent(drawdownItem.value ?? 0)}</span>
        </div>
      )}
      {pnlItem && (
        <div className="flex items-center justify-between">
          <span className="text-blue-600 mr-4">P&L:</span>
          <span>{formatDollar(pnlItem.value ?? 0)}</span>
        </div>
      )}
    </div>
  );
}

export function TradeChart({ data, selectedMetrics }: TradeChartProps) {
  // 1. Let user pick a startIndex/endIndex with your custom RangeSlider
  const [rangeValues, setRangeValues] = useState<[number, number]>([
    0,
    data.equityCurve.length - 1,
  ]);

  // This function slices equityCurve by the chosen indexes
  const visibleData = useMemo(() => {
    const [startIdx, endIdx] = rangeValues;
    return data.equityCurve.slice(startIdx, endIdx + 1);
  }, [data.equityCurve, rangeValues]);

  // Identify which metrics are selected
  const isEquitySelected = selectedMetrics.includes("equity");
  const isPnLSelected = selectedMetrics.includes("pnl");
  const isDrawdownSelected = selectedMetrics.includes("drawdown");
  // Only PnL => main chart; else subgraph
  const onlyPnl = isPnLSelected && selectedMetrics.length === 1;

  // Y-axis domain calculations
  function calculateDomains() {
    if (!visibleData.length) {
      return {
        dollarDomain: [0, 0] as [number, number],
        pnlDomain: [0, 0] as [number, number],
        drawdownDomain: [0, 0] as [number, number],
      };
    }

    const eqVals = visibleData.map((d) => d.equity);
    const pnlVals = visibleData.map((d) => d.pnl);
    const ddVals = visibleData.map((d) => d.drawdown);

    const maxEquity = Math.max(...eqVals);
    const minEquity = Math.min(...eqVals);
    const eqPad = (maxEquity - minEquity) * 0.1;

    const maxPnL = Math.max(...pnlVals, 0);
    const minPnL = Math.min(...pnlVals, 0);
    const pnlPad = (maxPnL - minPnL) * 0.1;

    const minDD = Math.min(...ddVals);
    const ddPad = Math.abs(minDD) * 0.1;

    let dollarMin: number;
    let dollarMax: number;

    if (onlyPnl) {
      dollarMin = minPnL - pnlPad;
      dollarMax = maxPnL + pnlPad;
    } else if (isEquitySelected) {
      dollarMin = minEquity - eqPad;
      dollarMax = maxEquity + eqPad;
    } else {
      // e.g. if user only picks drawdown => 0..0 for main axis
      dollarMin = 0;
      dollarMax = 0;
    }

    return {
      dollarDomain: [dollarMin, dollarMax] as [number, number],
      pnlDomain: [minPnL - pnlPad, maxPnL + pnlPad] as [number, number],
      drawdownDomain: [minDD - ddPad, 0] as [number, number],
    };
  }

  const { dollarDomain, pnlDomain, drawdownDomain } = calculateDomains();

  return (
    <div className="w-full h-[600px] flex flex-col space-y-2">
      {/* Range slider above the chart. Keep your custom logic. */}
      <RangeSlider
        value={rangeValues}
        onChange={setRangeValues}
        min={0}
        max={data.equityCurve.length - 1}
        step={1}
      />

      {/* Main chart */}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={visibleData}
            margin={getChartMargins(isDrawdownSelected, false)}
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

            {/* Main chart tooltip includes PnL, Drawdown, Equity */}
            <Tooltip content={<CustomMainTooltip />} />

            {/* Equity line */}
            {isEquitySelected && (
              <Line
                type="stepAfter"
                dataKey="equity"
                name="Account Value"
                stroke={METRIC_COLORS.equity}
                yAxisId="dollar"
                dot={false}
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
                strokeWidth={2}
                isAnimationActive={false}
              />
            )}

            {/* If user ONLY picks PnL => main chart line */}
            {onlyPnl && (
              <Line
                type="stepAfter"
                dataKey="pnl"
                name="P&L"
                stroke={METRIC_COLORS.pnl}
                yAxisId="dollar"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            )}

            {/* If user picks PnL + others => invisible PnL line here for tooltip data */}
            {!onlyPnl && isPnLSelected && (
              <Line
                type="stepAfter"
                dataKey="pnl"
                name="P&L"
                stroke="transparent"
                yAxisId="dollar"
                dot={false}
                strokeWidth={0}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Subgraph for PnL if multiple metrics are selected (no tooltip) */}
      {isPnLSelected && !onlyPnl && (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={visibleData}
              margin={getChartMargins(isDrawdownSelected, true)}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
                tick={{ fontSize: 12 }}
                padding={{ left: 20, right: 20 }}
              />
              <YAxis
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
              {/* No tooltip => the main chart tooltip is used for PnL */}
              <Line
                type="stepAfter"
                dataKey="pnl"
                name="P&L"
                stroke={METRIC_COLORS.pnl}
                dot={false}
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
