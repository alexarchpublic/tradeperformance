"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { type EquityCurvePoint } from "@/lib/utils/trade-data";

interface TradeChartProps {
  data: {
    equityCurve: EquityCurvePoint[];
  };
  selectedMetrics: string[];
  hoveredTradeIndex: number | null;
}

const METRIC_COLORS = {
  equity: "#22c55e",
  pnl: "#3b82f6",
  drawdown: "#ef4444",
};

const METRIC_LABELS = {
  equity: "Account Value ($)",
  pnl: "Trade P&L ($)",
  drawdown: "Peak to Peak Drawdown (%)",
};

export function TradeChart({ data, selectedMetrics, hoveredTradeIndex }: TradeChartProps) {
  const [brushDomain, setBrushDomain] = useState<[Date, Date] | null>(null);
  const showPnLSubgraph = selectedMetrics.includes('equity') && selectedMetrics.includes('pnl');

  const getVisibleData = () => {
    if (!brushDomain) return data.equityCurve;
    return data.equityCurve.filter(point => {
      const pointDate = new Date(point.date);
      return pointDate >= brushDomain[0] && pointDate <= brushDomain[1];
    });
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

  const handleBrushChange = (domain: any) => {
    if (!domain || (domain.startIndex === undefined && domain.endIndex === undefined)) {
      setBrushDomain(null);
      return;
    }
    const startDate = domain.startIndex !== undefined
      ? new Date(data.equityCurve[domain.startIndex].date)
      : brushDomain?.[0];
    const endDate = domain.endIndex !== undefined
      ? new Date(data.equityCurve[domain.endIndex].date)
      : brushDomain?.[1];
    
    if (startDate && endDate) {
      setBrushDomain([startDate, endDate]);
    }
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
                    const label = METRIC_LABELS[name as keyof typeof METRIC_LABELS] || name;
                    if (name === 'Peak to Peak Drawdown') {
                      return [formatPercent(value), label];
                    }
                    return [formatDollar(value), label];
                  }}
                  labelFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
                />
                <Legend />
                {selectedMetrics.includes('equity') && (
                  <Line
                    type="stepAfter"
                    dataKey="equity"
                    name="Equity"
                    stroke={METRIC_COLORS.equity}
                    yAxisId="dollar"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                )}
                {selectedMetrics.includes('pnl') && !showPnLSubgraph && (
                  <Line
                    type="monotone"
                    dataKey="pnl"
                    name="PnL"
                    stroke={METRIC_COLORS.pnl}
                    yAxisId="dollar"
                    dot={false}
                    activeDot={{ r: 6 }}
                    strokeWidth={2}
                    connectNulls={true}
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
                    activeDot={{ r: 4 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {showPnLSubgraph && (
            <div className="h-1/3">
              <ResponsiveContainer>
                <LineChart data={visibleData} margin={{ top: 20, right: 70, bottom: 30, left: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" opacity={0.5} yAxisId="pnl" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
                    tick={{ fontSize: 12 }}
                    padding={{ left: 20, right: 20 }}
                  />
                  <YAxis
                    yAxisId="pnl"
                    orientation="left"
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
                    formatter={(value: number) => [formatDollar(value), "Trade P&L ($)"]}
                    labelFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
                  />
                  <Line
                    type="monotone"
                    dataKey="pnl"
                    name="PnL"
                    stroke={METRIC_COLORS.pnl}
                    yAxisId="pnl"
                    dot={false}
                    activeDot={{ r: 6 }}
                    strokeWidth={2}
                    connectNulls={true}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="h-[30px]">
            <ResponsiveContainer>
              <LineChart data={data.equityCurve} margin={{ top: 0, right: 70, bottom: 0, left: 70 }}>
                <Brush
                  dataKey="date"
                  height={30}
                  stroke="#666"
                  tickFormatter={(date) => format(new Date(date), "MMM d")}
                  onChange={handleBrushChange}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ResponsiveContainer>
    </div>
  );
} 