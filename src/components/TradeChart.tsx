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
import { useMemo, useState, useRef, useEffect } from "react";
import { RangeSlider } from "@/components/ui/range-slider";
import { type EquityCurvePoint } from "@/lib/utils/trade-data";

interface TradeChartProps {
  data: {
    equityCurve: EquityCurvePoint[];
    auditedTrades?: {
      date: string;
      equity: number;
    }[];
  };
  selectedMetrics: string[];
  showAuditedTrades?: boolean;
}

// Colors for line metrics using standard colors
const METRIC_COLORS = {
  equity: "#2E7D32",  // Dark green
  pnl: "#1976D2",     // Dark blue
  drawdown: "#D32F2F", // Dark red
  audited: "#9C27B0"   // Purple
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
    left: window?.innerWidth < 768 ? 50 : 70,
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

export function TradeChart({ data, selectedMetrics, showAuditedTrades = false }: TradeChartProps) {
  const mainChartRef = useRef<HTMLDivElement>(null);
  // Remove shared tooltip state
  const [rangeValues, setRangeValues] = useState<[number, number]>([
    0,
    data.equityCurve.length - 1,
  ]);

  // Reset range values when data changes (e.g., start date changes)
  useEffect(() => {
    setRangeValues([0, data.equityCurve.length - 1]);
  }, [data.equityCurve.length]);

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

  // Update plot area width when main chart changes
  useEffect(() => {
    const updateWidth = () => {
      if (mainChartRef.current) {
        // Get the chart container
        const chartContainer = mainChartRef.current.querySelector('.recharts-wrapper');
        if (chartContainer) {
          // Get the plot area (excluding axes)
          const plotArea = chartContainer.querySelector('.recharts-plot-area');
          if (plotArea) {
            const width = plotArea.getBoundingClientRect().width;
            
            // Find and update the subgraph plot area width
            const subgraphPlot = document.querySelector('.pnl-subgraph .recharts-plot-area');
            if (subgraphPlot) {
              (subgraphPlot as HTMLElement).style.width = `${width}px`;
            }
          }
        }
      }
    };

    // Initial update
    setTimeout(updateWidth, 0);
    // Update on resize
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [isDrawdownSelected]); // Re-measure when drawdown axis changes

  /**
   * Calculate domains for the main chart & subgraph with dynamic padding
   * that adjusts based on the data range magnitude.
   */
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

    // Simple percentage-based padding for all metrics
    const PADDING_PERCENT = 0.05; // 5% padding

    // Calculate PnL domain
    const maxPnL = Math.max(...pnlVals, 0);
    const minPnL = Math.min(...pnlVals, 0);
    const pnlRange = maxPnL - minPnL;
    const pnlPad = Math.max(pnlRange * PADDING_PERCENT, 100);
    const pnlDomain = [minPnL - pnlPad, maxPnL + pnlPad] as [number, number];

    // Calculate drawdown domain
    const minDD = Math.min(...ddVals);
    const ddPad = Math.max(Math.abs(minDD) * PADDING_PERCENT, 0.5);
    const drawdownDomain = [minDD - ddPad, 0] as [number, number];

    // Calculate dollar domain (for equity or PnL in main chart)
    let dollarDomain: [number, number];
    
    if (onlyPnl) {
      // When only PnL is selected, use PnL domain
      dollarDomain = pnlDomain;
    } else if (isEquitySelected) {
      // For equity chart, only consider equity values
      const maxEquity = Math.max(...eqVals);
      const minEquity = Math.min(...eqVals);
      const equityRange = maxEquity - minEquity;
      const equityPad = equityRange * PADDING_PERCENT;
      dollarDomain = [minEquity - equityPad, maxEquity + equityPad];
    } else {
      // Fallback
      dollarDomain = [0, 0];
    }

    return {
      dollarDomain,
      pnlDomain,
      drawdownDomain,
    };
  }

  const { dollarDomain, pnlDomain, drawdownDomain } = calculateDomains();

  // Create custom tooltip components for main chart and subgraph
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
        {pnlItem && isPnLSelected && (
          <div className="flex items-center justify-between">
            <span className="text-blue-600 mr-4">P&L:</span>
            <span>{formatDollar(pnlItem.value ?? 0)}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-[600px]">
      <div className="h-[calc(100%-6rem)] flex flex-col">
        {/* Main chart container */}
        <div 
          ref={mainChartRef}
          className={`flex-1 ${showPnLSubgraph ? 'h-[70%]' : 'h-[90%]'} mb-2`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={visibleData}
              margin={getChartMargins(isDrawdownSelected, false)}
              syncId="trading-charts"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), "MMM d")}
                tick={{ fill: '#333333', fontSize: 12 }}
                stroke="#333333"
              />
              <YAxis
                yAxisId="dollar"
                domain={dollarDomain}
                tickFormatter={(value) =>
                  new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                    notation: "compact",
                  }).format(value)
                }
                tick={{ fill: '#333333', fontSize: 12 }}
                stroke="#333333"
              />
              {isDrawdownSelected && (
                <YAxis
                  yAxisId="drawdown"
                  orientation="right"
                  domain={drawdownDomain}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                  tick={{ fill: '#333333', fontSize: 12 }}
                  stroke="#333333"
                />
              )}
              <Tooltip
                content={<CustomMainTooltip />}
                cursor={{ stroke: '#666666' }}
              />
              {isEquitySelected && (
                <Line
                  type="monotone"
                  dataKey="equity"
                  name="Account Value"
                  stroke={METRIC_COLORS.equity}
                  dot={false}
                  yAxisId="dollar"
                />
              )}
              {!showPnLSubgraph && isPnLSelected && (
                <Line
                  type="monotone"
                  dataKey="pnl"
                  name="P&L"
                  stroke={METRIC_COLORS.pnl}
                  dot={false}
                  yAxisId="dollar"
                />
              )}
              {isDrawdownSelected && (
                <Line
                  type="monotone"
                  dataKey="drawdown"
                  name="Peak to Peak Drawdown"
                  stroke={METRIC_COLORS.drawdown}
                  dot={false}
                  yAxisId="drawdown"
                />
              )}
              {showAuditedTrades && data.auditedTrades && data.auditedTrades.length > 0 && (
                <Line
                  type="monotone"
                  data={data.auditedTrades}
                  dataKey="equity"
                  name="Audited Performance"
                  stroke={METRIC_COLORS.audited}
                  dot={true}
                  yAxisId="dollar"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Range Slider */}
        <div className="h-12 px-4">
          <RangeSlider
            min={0}
            max={data.equityCurve.length - 1}
            step={1}
            value={rangeValues}
            onChange={setRangeValues}
          />
        </div>

        {/* PnL Subgraph */}
        {showPnLSubgraph && (
          <div className="h-[20%] pnl-subgraph">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={visibleData}
                margin={getChartMargins(isDrawdownSelected, true)}
                syncId="trading-charts"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), "MMM d")}
                  tick={{ fill: '#333333', fontSize: 12 }}
                  stroke="#333333"
                />
                <YAxis
                  domain={pnlDomain}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                      notation: "compact",
                    }).format(value)
                  }
                  tick={{ fill: '#333333', fontSize: 12 }}
                  stroke="#333333"
                />
                <Tooltip cursor={{ stroke: '#666666' }} />
                <ReferenceLine y={0} stroke="#666666" />
                <Line
                  type="monotone"
                  dataKey="pnl"
                  name="P&L"
                  stroke={METRIC_COLORS.pnl}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
