import { Algorithm } from "@/components/AlgorithmSelector";

export interface Trade {
  Entry_Date: string;
  Exit_Date: string;
  Entry_Price: number;
  Exit_Price: number;
  Contracts: number;
  PnL: number;
  'PnL_%': number;
  'Cumulative_PnL_%': number;
  'Peak_to_Peak_DD_%': number;
  Duration_Hours: number;
  Entry_Signal: string;
  Exit_Signal: string;
  Strategy: string;
  Instrument: string;
  Max_Favorable_Excursion: number;
  Max_Adverse_Excursion: number;
  Trade_Efficiency: number;
  equity: number;
  algorithm: string;
  units: number;
}

export interface EquityCurvePoint {
  date: string;
  equity: number;
  pnl: number;
  drawdown: number;
}

export interface ProcessedTradeData {
  trades: Trade[];
  equityCurve: EquityCurvePoint[];
  auditedTrades?: {
    date: string;
    equity: number;
  }[];
  metadata: {
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    maxDrawdownDollars: number;
    maxDrawdownPercent: number;
    pnlPercent: number;
    advancedStats?: {
      profitFactor: number;
      winLossRatio: number;
      expectancy: number;
      sharpeRatio: number;
      recoveryFactor: number;
      calmarRatio: number;
      ulcerIndex: number;
      averageWin: number;
      averageLoss: number;
      largestWin: number;
      largestLoss: number;
      payoffRatio: number;
      maxDrawdownPercent: number;
      maxDrawdownDuration: number;
      avgDrawdownPercent: number;
      avgDrawdownDuration: number;
      medianDrawdownDuration: number;
      totalDrawdownPeriods: number;
      profitFactor3Month: number;
      winRate3Month: number;
      avgProfitPerDay: number;
      avgTradesPerDay: number;
      profitPercentPerTrade: number;
      tradingDays: number;
      tradingMonths: number;
      avgAnnualPnLPercent: number;
      startDate: string;
      endDate: string;
    };
  };
}

export async function loadTradeData(
  algorithms: Algorithm[],
  startDate: string
): Promise<ProcessedTradeData> {
  const params = new URLSearchParams({
    algorithms: JSON.stringify(algorithms),
    startDate,
  });

  const response = await fetch(`/api/trades?${params}`);
  if (!response.ok) {
    throw new Error('Failed to load trade data');
  }

  const data: ProcessedTradeData = await response.json();
  
  // Convert date strings back to Date objects
  data.trades = data.trades.map((trade) => ({
    ...trade,
    Entry_Date: new Date(trade.Entry_Date).toISOString(),
    Exit_Date: new Date(trade.Exit_Date).toISOString(),
  }));

  return data;
} 