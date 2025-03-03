"use client";

import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type ProcessedTradeData, type Trade } from "@/lib/utils/trade-data";

interface TradeListProps {
  data: ProcessedTradeData;
  onTradeHover: (index: number | null) => void;
  hoveredTradeIndex: number | null;
}

const formatNumber = (value: number, decimals = 2) => {
  return value.toFixed(decimals);
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

const ALGORITHM_NAMES = {
  'nq_trades.csv': 'Atlas NQ',
  'mnq_trades.csv': 'Atlas MNQ',
  'es_trades.csv': 'Gateway ES',
  'mes_trades.csv': 'Gateway MES',
};

export function TradeList({ data, onTradeHover, hoveredTradeIndex }: TradeListProps) {
  if (!data?.trades?.length) return null;

  const handleTradeHover = (index: number | null) => {
    console.error('Trade hover event:', {
      index,
      totalTrades: data.trades.length,
      isValidIndex: index === null || (index >= 0 && index < data.trades.length)
    });
    
    if (index === null || (index >= 0 && index < data.trades.length)) {
      onTradeHover(index);
    } else {
      console.error('Invalid trade index:', index);
    }
  };

  // Log component render
  console.error('TradeList render:', {
    totalTrades: data.trades.length,
    hoveredTradeIndex
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Trade List</h2>
      <div className="relative overflow-auto max-h-[600px] rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-10">
            <TableRow>
              <TableHead>Algorithm</TableHead>
              <TableHead>Units</TableHead>
              <TableHead>Entry Date</TableHead>
              <TableHead>Exit Date</TableHead>
              <TableHead>Entry Price</TableHead>
              <TableHead>Exit Price</TableHead>
              <TableHead>P&L</TableHead>
              <TableHead>P&L %</TableHead>
              <TableHead>Duration (Hours)</TableHead>
              <TableHead>Trade Efficiency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.trades.map((trade: Trade, index: number) => (
              <TableRow
                key={index}
                onMouseEnter={() => handleTradeHover(index)}
                onMouseLeave={() => handleTradeHover(null)}
              >
                <TableCell>
                  {ALGORITHM_NAMES[trade.algorithm as keyof typeof ALGORITHM_NAMES]}
                </TableCell>
                <TableCell>
                  {trade.units} {trade.units === 1 ? 'unit' : 'units'}
                </TableCell>
                <TableCell>{format(new Date(trade.Entry_Date), "MM/dd/yyyy HH:mm")}</TableCell>
                <TableCell>{format(new Date(trade.Exit_Date), "MM/dd/yyyy HH:mm")}</TableCell>
                <TableCell>{formatNumber(trade.Entry_Price)}</TableCell>
                <TableCell>{formatNumber(trade.Exit_Price)}</TableCell>
                <TableCell className={trade.PnL >= 0 ? "text-green-500" : "text-red-500"}>
                  {formatDollar(trade.PnL)}
                </TableCell>
                <TableCell className={trade['PnL_%'] >= 0 ? "text-green-500" : "text-red-500"}>
                  {formatPercent(trade['PnL_%'] * 100)}
                </TableCell>
                <TableCell>{formatNumber(trade.Duration_Hours)}</TableCell>
                <TableCell>{formatPercent(trade.Trade_Efficiency * 100)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 