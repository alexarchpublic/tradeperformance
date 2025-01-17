"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { RangeSlider } from "@/components/ui/range-slider";
import { type EquityCurvePoint } from "@/lib/utils/trade-data";

interface TradeChartProps {
  data: {
    equityCurve: EquityCurvePoint[];
  };
  selectedMetrics: string[];
}

// Colors for line metrics
const METRIC_COLORS = {
  equity: "#22c55e",
  pnl: "#3b82f6",
  drawdown: "#ef4444",
};

/**
 * If drawdown is selected => second Y-axis => bigger right margin so both
 * the main chart and subgraph have the same width, keeping hover lines aligned.
 */
function getChartMargins(isDrawdownSelected: boolean, isSubgraph: boolean) {
  const rightMargin = isDrawdownSelected ? 90 : 20;
  return {
    top: 20,
    right: rightMargin,
    bottom: isSubgraph ? 30 : 60,
    left: 70,
  };
}

/**
 * Tooltip for the main chart that shows Equity, Drawdown, and/or PnL.
 * We make sure PnL data is always included here, even if drawn in a subgraph.
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
          {format(new Date(label), "MMM d, yyyy")}
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
  // Track the visible range [startIndex, endIndex] with your custom RangeSlider
  const [rangeValues, setRangeValues] = useState<[number, number]>([
    0,
    data.equityCurve.length - 1,
  ]);

  // Slice the equityCurve based on the selected slider range
  const visibleData = useMemo(() => {
    const [startIdx, endIdx] = rangeValues;
    return data.equityCurve.slice(startIdx, endIdx + 1);
  }, [data.equityCurve, rangeValues]);

  // Identify which metrics are picked
  const isEquitySelected = selectedMetrics.includes("equity");
  const isPnLSelected = selectedMetrics.includes("pnl");
  const isDrawdownSelected = selectedMetrics.includes("drawdown");

  // If user picks only "pnl", it goes to the main chart
  const onlyPnl = isPnLSelected && selectedMetrics.length === 1;
  // Show subgraph for PnL if PnL is selected AND at least one other metric is selected
  const showPnLSubgraph = isPnLSelected && (isEquitySelected || isDrawdownSelected);

  // Calculate domains for the main chart & subgraph
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
    const equityPad = (maxEquity - minEquity) * 0.1;

    const maxPnL = Math.max(...pnlVals, 0);
    const minPnL = Math.min(...pnlVals, 0);
    const pnlPad = (maxPnL - minPnL) * 0.1;

    const minDD = Math.min(...ddVals);
    const ddPad = Math.abs(minDD) * 0.1;

    let dollarMin: number;
    let dollarMax: number;

    // If only PnL is selected => main chart uses PnL domain
    if (onlyPnl) {
      dollarMin = minPnL - pnlPad;
      dollarMax = maxPnL + pnlPad;
    } else if (isEquitySelected) {
      // Otherwise, if equity is selected => main chart is Equity
      dollarMin = minEquity - equityPad;
      dollarMax = maxEquity + equityPad;
    } else {
      // e.g., if user only picks drawdown => main axis is 0..0
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
    <div className="w-full h-[600px] flex flex-col">
      {/* Main chart container - adjust height based on subgraph presence */}
      <div className={`flex-1 ${showPnLSubgraph ? 'h-[70%]' : 'h-[90%]'} mb-2`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={visibleData}
            margin={getChartMargins(isDrawdownSelected, false)}
            syncId="trading-charts"
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
              tickFormatter={(value) => new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(value)}
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
                tickFormatter={(value) => `${value.toFixed(1)}%`}
                width={90}
                label={{
                  value: "Peak to Peak Drawdown (%)",
                  angle: 90,
                  position: "insideRight",
                  offset: -40,
                  style: { textAnchor: "middle", fontSize: 12 },
                }}
              />
            )}

            <Tooltip content={<CustomMainTooltip />} />

            {/* Chart lines remain the same */}
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

            {showPnLSubgraph && (
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

            {/* Add zero reference line when PnL is shown in main chart */}
            {(onlyPnl || showPnLSubgraph) && (
              <ReferenceLine
                y={0}
                yAxisId="dollar"
                stroke="#666"
                strokeDasharray="3 3"
                opacity={0.5}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* PnL Subgraph */}
      {showPnLSubgraph && (
        <div className="h-[25%] mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={visibleData}
              margin={getChartMargins(isDrawdownSelected, true)}
              syncId="trading-charts"
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
                tick={{ fontSize: 12 }}
                padding={{ left: 20, right: 20 }}
              />
              <YAxis
                yAxisId="pnl"
                orientation="left"
                domain={pnlDomain}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(value)}
                label={{
                  value: "Trade P&L ($)",
                  angle: -90,
                  position: "insideLeft",
                  offset: -50,
                  style: { textAnchor: "middle", fontSize: 12 },
                }}
              />
              {/* Add zero reference line for PnL subgraph */}
              <ReferenceLine
                y={0}
                yAxisId="pnl"
                stroke="#666"
                strokeDasharray="3 3"
                opacity={0.5}
              />
              {/* Add invisible right axis when drawdown is enabled to match main chart width */}
              {isDrawdownSelected && (
                <YAxis
                  yAxisId="spacer"
                  orientation="right"
                  domain={[0, 1]}
                  hide={true}
                  width={90}
                />
              )}
              <Tooltip content={() => null} />
              <Line
                type="stepAfter"
                dataKey="pnl"
                name="P&L"
                stroke={METRIC_COLORS.pnl}
                yAxisId="pnl"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Range Slider */}
      <div className="h-[5%]">
        <RangeSlider
          value={rangeValues}
          onChange={setRangeValues}
          min={0}
          max={data.equityCurve.length - 1}
          step={1}
        />
      </div>
    </div>
  );
}
