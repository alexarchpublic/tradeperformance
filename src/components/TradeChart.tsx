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
  ReferenceLine,
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

interface BrushDomain {
  startIndex: number;
  endIndex: number;
}

type BrushIndex = {
  startIndex?: number;
  endIndex?: number;
} | null;

const METRIC_COLORS = {
  equity: "#22c55e",
  pnl: "#3b82f6",
  drawdown: "#ef4444",
};

export function TradeChart({ data, selectedMetrics, hoveredTradeIndex }: TradeChartProps) {
  const [brushDomain, setBrushDomain] = useState<BrushDomain | null>(null);
  const showPnLSubgraph = selectedMetrics.includes('equity') && selectedMetrics.includes('pnl');

  const getVisibleData = () => {
    if (!brushDomain || brushDomain.startIndex === undefined || brushDomain.endIndex === undefined) {
      console.error('Using full data range:', { dataLength: data.equityCurve.length });
      return data.equityCurve;
    }
    console.error('Using brushed data range:', { 
      start: brushDomain.startIndex, 
      end: brushDomain.endIndex,
      dataLength: data.equityCurve.length 
    });
    return data.equityCurve.slice(brushDomain.startIndex, brushDomain.endIndex);
  };

  // Find the corresponding equity curve index for the hovered trade
  const findEquityCurveIndex = (tradeIndex: number | null) => {
    console.error('Finding equity curve index:', { 
      tradeIndex,
      visibleDataLength: visibleData.length,
      brushDomain,
      hasValidIndex: tradeIndex !== null && tradeIndex >= 0 && tradeIndex < data.equityCurve.length
    });
    
    if (tradeIndex === null) return null;
    
    // If we're using a brush, adjust the index relative to the visible range
    if (brushDomain?.startIndex !== undefined) {
      const adjustedIndex = tradeIndex - brushDomain.startIndex;
      if (adjustedIndex >= 0 && adjustedIndex < visibleData.length) {
        return adjustedIndex;
      }
      return null;
    }
    
    // Otherwise use the original index if it's valid
    if (tradeIndex >= 0 && tradeIndex < visibleData.length) {
      return tradeIndex;
    }
    
    return null;
  };

  const calculateDomains = () => {
    const visibleData = getVisibleData();
    const equityValues = visibleData.map(d => d.equity);
    const pnlValues = visibleData.map(d => d.pnl);
    const drawdownValues = visibleData.map(d => d.drawdown);

    const maxEquity = Math.max(...equityValues);
    const minEquity = Math.min(...equityValues);
    const equityPadding = (maxEquity - minEquity) * 0.1;

    const maxPnL = Math.max(...pnlValues, 0);
    const minPnL = Math.min(...pnlValues, 0);
    const pnlPadding = (maxPnL - minPnL) * 0.1;

    const minDrawdown = Math.min(...drawdownValues);
    const drawdownPadding = Math.abs(minDrawdown) * 0.1;

    let dollarMin, dollarMax;
    if (selectedMetrics.includes('equity') && !selectedMetrics.includes('pnl')) {
      dollarMin = minEquity - equityPadding;
      dollarMax = maxEquity + equityPadding;
    } else if (!selectedMetrics.includes('equity') && selectedMetrics.includes('pnl')) {
      dollarMin = minPnL - pnlPadding;
      dollarMax = maxPnL + pnlPadding;
    } else if (selectedMetrics.includes('equity') && selectedMetrics.includes('pnl') && !showPnLSubgraph) {
      dollarMin = Math.min(minEquity - equityPadding, minPnL - pnlPadding);
      dollarMax = Math.max(maxEquity + equityPadding, maxPnL + pnlPadding);
    } else {
      dollarMin = minEquity - equityPadding;
      dollarMax = maxEquity + equityPadding;
    }

    return {
      dollarDomain: [dollarMin, dollarMax],
      pnlDomain: [minPnL - pnlPadding, maxPnL + pnlPadding],
      drawdownDomain: [minDrawdown - drawdownPadding, 0]
    };
  };

  const visibleData = getVisibleData();
  const { dollarDomain, pnlDomain, drawdownDomain } = calculateDomains();
  const equityCurveIndex = findEquityCurveIndex(hoveredTradeIndex);

  const handleBrushChange = (domain: BrushIndex) => {
    console.error('Brush change event:', { 
      domain,
      dataLength: data.equityCurve.length
    });

    // If domain is null or empty, reset to show all data
    if (!domain?.startIndex || !domain?.endIndex) {
      console.error('Resetting brush domain to null');
      setBrushDomain(null);
      return;
    }
    
    const boundedStart = Math.max(0, domain.startIndex);
    const boundedEnd = Math.min(data.equityCurve.length, domain.endIndex);
    
    console.error('Setting new brush domain:', {
      originalStart: domain.startIndex,
      originalEnd: domain.endIndex,
      boundedStart,
      boundedEnd
    });

    setBrushDomain({
      startIndex: boundedStart,
      endIndex: boundedEnd
    });
  };

  const formatDollar = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Log component render state
  console.error('TradeChart render state:', {
    hoveredTradeIndex,
    equityCurveIndex,
    visibleDataLength: visibleData.length,
    totalDataLength: data.equityCurve.length,
    selectedMetrics,
    showPnLSubgraph
  });

  return (
    <div className="w-full h-[600px]">
      <ResponsiveContainer>
        <div className="flex flex-col h-full">
          <div className={showPnLSubgraph ? "h-2/3" : "h-full"}>
            <ResponsiveContainer>
              <LineChart data={visibleData} margin={{ top: 20, right: 70, bottom: 30, left: 70 }}>
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
                  tickFormatter={(value) => formatDollar(value)}
                  domain={dollarDomain}
                  tick={{ fontSize: 12 }}
                  label={{
                    value: "Account Value ($)",
                    angle: -90,
                    position: "insideLeft",
                    offset: -50,
                    style: { textAnchor: 'middle', fontSize: 12 }
                  }}
                />
                {selectedMetrics.includes('drawdown') && (
                  <YAxis
                    yAxisId="drawdown"
                    orientation="right"
                    tickFormatter={(value) => formatPercent(value)}
                    domain={drawdownDomain}
                    tick={{ fontSize: 12 }}
                    label={{
                      value: "Peak to Peak Drawdown (%)",
                      angle: 90,
                      position: "insideRight",
                      offset: -40,
                      style: { textAnchor: 'middle', fontSize: 12 }
                    }}
                  />
                )}
                <Tooltip
                  trigger="hover"
                  formatter={(value: number, name: string) => {
                    if (name === 'Peak to Peak Drawdown') {
                      return [formatPercent(value), name];
                    }
                    return [formatDollar(value), name];
                  }}
                  labelFormatter={(label) => format(new Date(label), "MMM d, yyyy HH:mm")}
                />
                {selectedMetrics.includes('equity') && (
                  <Line
                    type="monotone"
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
                {selectedMetrics.includes('drawdown') && (
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
                {equityCurveIndex !== null && (
                  <ReferenceLine
                    x={visibleData[equityCurveIndex]?.date}
                    stroke="#666"
                    strokeDasharray="3 3"
                  />
                )}
                <Brush
                  dataKey="date"
                  height={30}
                  stroke="#8884d8"
                  onChange={handleBrushChange}
                  tickFormatter={(date) => format(new Date(date), "MMM d")}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {showPnLSubgraph && (
            <div className="h-1/3">
              <ResponsiveContainer>
                <LineChart data={visibleData} margin={{ top: 20, right: 70, bottom: 30, left: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
                    tick={{ fontSize: 12 }}
                    padding={{ left: 20, right: 20 }}
                  />
                  <YAxis
                    tickFormatter={(value) => formatDollar(value)}
                    domain={pnlDomain}
                    tick={{ fontSize: 12 }}
                    label={{
                      value: "Trade P&L ($)",
                      angle: -90,
                      position: "insideLeft",
                      offset: -50,
                      style: { textAnchor: 'middle', fontSize: 12 }
                    }}
                  />
                  <Tooltip
                    trigger="hover"
                    formatter={(value: number) => [formatDollar(value), "P&L"]}
                    labelFormatter={(label) => format(new Date(label), "MMM d, yyyy HH:mm")}
                  />
                  <Line
                    type="monotone"
                    dataKey="pnl"
                    name="P&L"
                    stroke={METRIC_COLORS.pnl}
                    dot={false}
                    activeDot={{ r: 6 }}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                  {equityCurveIndex !== null && (
                    <ReferenceLine
                      x={visibleData[equityCurveIndex]?.date}
                      stroke="#666"
                      strokeDasharray="3 3"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </ResponsiveContainer>
    </div>
  );
} 