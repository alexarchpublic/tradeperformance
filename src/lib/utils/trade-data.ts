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

  const data = await response.json();
  
  // Convert date strings back to Date objects
  data.trades = data.trades.map((trade: any) => ({
    ...trade,
    Entry_Date: new Date(trade.Entry_Date).toISOString(),
    Exit_Date: new Date(trade.Exit_Date).toISOString(),
  }));

  return data;
}

function calculateAdvancedStats(trades: Trade[], initialCapital: number) {
  const winningTrades = trades.filter(t => t.PnL > 0);
  const losingTrades = trades.filter(t => t.PnL < 0);
  
  const startDate = new Date(trades[0].Entry_Date);
  const endDate = new Date(trades[trades.length - 1].Exit_Date);
  const tradingDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const tradingMonths = tradingDays / 30.44; // Average days per month

  const totalWinAmount = winningTrades.reduce((sum, t) => sum + t.PnL, 0);
  const totalLossAmount = Math.abs(losingTrades.reduce((sum, t) => sum + t.PnL, 0));
  
  const profitFactor = totalWinAmount / totalLossAmount;
  const winLossRatio = winningTrades.length / losingTrades.length;
  
  return {
    profitFactor,
    winLossRatio,
    expectancy: (totalWinAmount - totalLossAmount) / trades.length,
    sharpeRatio: calculateSharpeRatio(trades),
    recoveryFactor: calculateRecoveryFactor(trades, initialCapital),
    calmarRatio: calculateCalmarRatio(trades, tradingMonths),
    ulcerIndex: calculateUlcerIndex(trades),
    averageWin: totalWinAmount / winningTrades.length,
    averageLoss: totalLossAmount / losingTrades.length,
    largestWin: Math.max(...trades.map(t => t.PnL)),
    largestLoss: Math.min(...trades.map(t => t.PnL)),
    payoffRatio: (totalWinAmount / winningTrades.length) / (totalLossAmount / losingTrades.length),
    maxDrawdownPercent: calculateMaxDrawdownPercent(trades),
    maxDrawdownDuration: calculateMaxDrawdownDuration(trades),
    profitFactor3Month: calculateRecentMetric(trades, 90, 'profitFactor'),
    winRate3Month: calculateRecentMetric(trades, 90, 'winRate'),
    avgProfitPerDay: trades.reduce((sum, t) => sum + t.PnL, 0) / tradingDays,
    avgTradesPerDay: trades.length / tradingDays,
    profitPercentPerTrade: (trades.reduce((sum, t) => sum + t.PnL, 0) / initialCapital * 100) / trades.length,
    tradingDays,
    tradingMonths,
    avgAnnualPnLPercent: (trades.reduce((sum, t) => sum + t.PnL, 0) / initialCapital * 100) / tradingDays,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

function calculateSharpeRatio(trades: Trade[]): number {
  const returns = trades.map(t => t.PnL);
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
  return (avgReturn / stdDev) * Math.sqrt(252); // Annualized
}

function calculateRecoveryFactor(trades: Trade[], initialCapital: number): number {
  const totalReturn = trades.reduce((sum, t) => sum + t.PnL, 0);
  const maxDrawdown = Math.max(...trades.map(t => t.equity - initialCapital));
  return maxDrawdown === 0 ? 0 : totalReturn / maxDrawdown;
}

function calculateCalmarRatio(trades: Trade[], months: number): number {
  const annualizedReturn = (trades.reduce((sum, t) => sum + t.PnL, 0) / months) * 12;
  const maxDrawdown = Math.max(...trades.map(t => t.equity - trades[0].equity));
  return maxDrawdown === 0 ? 0 : annualizedReturn / maxDrawdown;
}

function calculateUlcerIndex(trades: Trade[]): number {
  let maxEquity = trades[0].equity;
  const drawdowns = trades.map(t => {
    maxEquity = Math.max(maxEquity, t.equity);
    const drawdown = ((maxEquity - t.equity) / maxEquity) * 100;
    return drawdown * drawdown;
  });
  return Math.sqrt(drawdowns.reduce((sum, d) => sum + d, 0) / drawdowns.length);
}

function calculateMaxDrawdownPercent(trades: Trade[]): number {
  let maxEquity = trades[0].equity;
  let maxDrawdownPercent = 0;
  
  trades.forEach(trade => {
    maxEquity = Math.max(maxEquity, trade.equity);
    const drawdown = ((maxEquity - trade.equity) / maxEquity) * 100;
    maxDrawdownPercent = Math.max(maxDrawdownPercent, drawdown);
  });
  
  return maxDrawdownPercent;
}

function calculateMaxDrawdownDuration(trades: Trade[]): number {
  let maxEquity = trades[0].equity;
  let drawdownStart: Date | null = null;
  let maxDuration = 0;
  let currentDuration = 0;
  
  trades.forEach(trade => {
    if (trade.equity > maxEquity) {
      maxEquity = trade.equity;
      drawdownStart = null;
      currentDuration = 0;
    } else if (trade.equity < maxEquity) {
      if (!drawdownStart) {
        drawdownStart = new Date(trade.Entry_Date);
      }
      currentDuration = Math.ceil((new Date(trade.Exit_Date).getTime() - drawdownStart.getTime()) / (1000 * 60 * 60 * 24));
      maxDuration = Math.max(maxDuration, currentDuration);
    }
  });
  
  return maxDuration;
}

function calculateRecentMetric(trades: Trade[], days: number, metric: 'profitFactor' | 'winRate'): number {
  const cutoffDate = new Date(trades[trades.length - 1].Exit_Date);
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentTrades = trades.filter(t => new Date(t.Exit_Date) >= cutoffDate);
  
  if (metric === 'profitFactor') {
    const winningTrades = recentTrades.filter(t => t.PnL > 0);
    const losingTrades = recentTrades.filter(t => t.PnL < 0);
    const totalWins = winningTrades.reduce((sum, t) => sum + t.PnL, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.PnL, 0));
    return totalLosses === 0 ? totalWins : totalWins / totalLosses;
  } else {
    const winningTrades = recentTrades.filter(t => t.PnL > 0);
    return winningTrades.length / recentTrades.length;
  }
} 