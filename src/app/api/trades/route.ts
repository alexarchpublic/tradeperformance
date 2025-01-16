import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { Algorithm } from '@/components/AlgorithmSelector';

const CAPITAL_REQUIREMENTS = {
  'nq_trades.csv': 100000,  // Atlas NQ: $100k per unit
  'mnq_trades.csv': 25000,  // Atlas MNQ: $25k per unit
  'es_trades.csv': 100000,  // Gateway ES: $100k per unit
  'mes_trades.csv': 10000,  // Gateway MES: $10k per unit
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const algorithmsJson = searchParams.get('algorithms');
  const startDate = searchParams.get('startDate') || '';

  if (!algorithmsJson) {
    return NextResponse.json({ error: 'Algorithms parameter is required' }, { status: 400 });
  }

  try {
    const algorithms: Algorithm[] = JSON.parse(algorithmsJson);
    let totalInitialCapital = 0;
    let totalPnL = 0;
    let combinedTrades: any[] = [];
    let combinedEquityCurve: any[] = [];
    
    // Track which datasets we've already processed
    const processedDatasets = new Set<string>();

    // Process each algorithm
    for (const algo of algorithms) {
      const baseCapital = CAPITAL_REQUIREMENTS[algo.dataset as keyof typeof CAPITAL_REQUIREMENTS] || 0;
      const algoCapital = baseCapital * algo.units;
      totalInitialCapital += algoCapital;

      // Only process the dataset if we haven't seen it before
      if (!processedDatasets.has(algo.dataset)) {
        processedDatasets.add(algo.dataset);
        const dataPath = path.join(process.cwd(), 'public', 'data', algo.dataset);
        const fileContents = await fs.readFile(dataPath, 'utf8');
        
        // Process the data
        const lines = fileContents.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',');
        const trades = lines.slice(1).map(line => {
          const values = line.split(',');
          const trade: any = {};
          headers.forEach((header, index) => {
            const value = values[index];
            if (['Entry_Price', 'Exit_Price', 'Contracts', 'PnL', 'PnL_%', 'Cumulative_PnL_%', 'Peak_to_Peak_DD_%', 'Duration_Hours', 'Max_Favorable_Excursion', 'Max_Adverse_Excursion', 'Trade_Efficiency'].includes(header)) {
              trade[header] = Number(value);
            } else {
              trade[header] = value;
            }
          });
          return trade;
        });

        // Filter trades by start date
        const filteredTrades = startDate
          ? trades.filter(trade => new Date(trade.Entry_Date) >= new Date(startDate))
          : trades;

        // Find all algorithms using this dataset to calculate total units
        const totalUnits = algorithms
          .filter(a => a.dataset === algo.dataset)
          .reduce((sum, a) => sum + a.units, 0);

        // Scale trades based on total units for this dataset
        let equity = algoCapital;
        const processedTrades = filteredTrades.map(trade => {
          const scaledPnL = trade.PnL * totalUnits;
          equity += scaledPnL;
          totalPnL += scaledPnL;

          return {
            ...trade,
            PnL: scaledPnL,
            Max_Favorable_Excursion: trade.Max_Favorable_Excursion * totalUnits,
            Max_Adverse_Excursion: trade.Max_Adverse_Excursion * totalUnits,
            equity,
            Entry_Date: new Date(trade.Entry_Date).toISOString(),
            Exit_Date: new Date(trade.Exit_Date).toISOString(),
            algorithm: algo.dataset,
            units: totalUnits,
            baseCapital: baseCapital * totalUnits
          };
        });

        combinedTrades = [...combinedTrades, ...processedTrades];
      }
    }

    // Sort combined trades by date
    combinedTrades.sort((a, b) => new Date(a.Entry_Date).getTime() - new Date(b.Entry_Date).getTime());

    // Calculate combined equity curve
    let equity = totalInitialCapital;
    let peakEquity = totalInitialCapital;
    let maxDrawdownPercent = 0;
    let maxDrawdownDollars = 0;
    combinedEquityCurve = combinedTrades.map(trade => {
      equity += trade.PnL;
      peakEquity = Math.max(peakEquity, equity);
      const drawdownPercent = equity < peakEquity ? ((peakEquity - equity) / peakEquity) * 100 : 0;
      const drawdownDollars = equity < peakEquity ? peakEquity - equity : 0;
      maxDrawdownPercent = Math.max(maxDrawdownPercent, drawdownPercent);
      maxDrawdownDollars = Math.max(maxDrawdownDollars, drawdownDollars);
      return {
        date: new Date(trade.Exit_Date).toISOString(),
        equity,
        pnl: trade.PnL,
        drawdown: -drawdownPercent
      };
    });

    // Calculate weighted PnL percentage
    const pnlPercent = (totalPnL / totalInitialCapital) * 100;

    // Calculate other statistics
    const wins = combinedTrades.filter(t => t.PnL > 0).length;
    const winningTrades = combinedTrades.filter(t => t.PnL > 0);
    const losingTrades = combinedTrades.filter(t => t.PnL < 0);
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.PnL, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.PnL, 0)) / losingTrades.length : 0;
    const largestWin = Math.max(...combinedTrades.map(t => t.PnL));
    const largestLoss = Math.min(...combinedTrades.map(t => t.PnL));

    const threeMonthStats = calculateRecentMetrics(combinedTrades, 90);
    
    // Calculate drawdown statistics
    const drawdownStats = calculateDrawdownStats(combinedEquityCurve);

    const metadata = {
      totalTrades: combinedTrades.length,
      winRate: wins / combinedTrades.length,
      totalPnL,
      maxDrawdownDollars,
      maxDrawdownPercent: maxDrawdownPercent,
      pnlPercent,
      advancedStats: {
        averageWin: avgWin,
        averageLoss: avgLoss,
        largestWin,
        largestLoss,
        profitFactor: avgLoss === 0 ? 0 : (avgWin * winningTrades.length) / (avgLoss * losingTrades.length),
        payoffRatio: avgLoss === 0 ? 0 : avgWin / avgLoss,
        winLossRatio: winningTrades.length / (losingTrades.length || 1),
        expectancy: totalPnL / combinedTrades.length,
        sharpeRatio: calculateSharpeRatio(combinedTrades),
        recoveryFactor: maxDrawdownDollars === 0 ? 0 : totalPnL / maxDrawdownDollars,
        calmarRatio: calculateCalmarRatio(totalPnL, maxDrawdownDollars, combinedTrades),
        ulcerIndex: calculateUlcerIndex(combinedEquityCurve),
        maxDrawdownDuration: drawdownStats.maxDrawdownDuration,
        avgDrawdownDuration: drawdownStats.avgDrawdownDuration,
        medianDrawdownDuration: drawdownStats.medianDrawdownDuration,
        avgDrawdownPercent: drawdownStats.avgDrawdownPercent,
        totalDrawdownPeriods: drawdownStats.totalDrawdownPeriods,
        profitFactor3Month: threeMonthStats.profitFactor,
        winRate3Month: threeMonthStats.winRate,
        avgProfitPerDay: totalPnL / calculateTradingDays(combinedTrades),
        avgTradesPerDay: combinedTrades.length / calculateTradingDays(combinedTrades),
        profitPercentPerTrade: pnlPercent / combinedTrades.length,
        tradingDays: calculateTradingDays(combinedTrades),
        tradingMonths: calculateTradingMonths(combinedTrades),
        avgAnnualPnLPercent: calculateAnnualPnLPercent(combinedTrades, totalPnL, totalInitialCapital),
        startDate: combinedTrades[0].Entry_Date,
        endDate: combinedTrades[combinedTrades.length - 1].Exit_Date,
      }
    };

    return NextResponse.json({
      trades: combinedTrades,
      metadata,
      equityCurve: combinedEquityCurve,
    });
  } catch (error) {
    console.error('Error loading trade data:', error);
    return NextResponse.json({ error: 'Failed to load trade data' }, { status: 500 });
  }
}

function calculateSharpeRatio(trades: any[]): number {
  const returns = trades.map(t => t.PnL);
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
  return stdDev === 0 ? 0 : (avgReturn / stdDev) * Math.sqrt(252); // Annualized
}

function calculateCalmarRatio(totalPnL: number, maxDrawdown: number, trades: any[]): number {
  if (maxDrawdown === 0) return 0;
  const tradingMonths = calculateTradingMonths(trades);
  const annualizedReturn = (totalPnL / tradingMonths) * 12;
  return annualizedReturn / maxDrawdown;
}

function calculateUlcerIndex(equityCurve: any[]): number {
  let maxEquity = equityCurve[0].equity;
  const drawdowns = equityCurve.map(point => {
    maxEquity = Math.max(maxEquity, point.equity);
    const drawdown = point.equity < maxEquity ? ((maxEquity - point.equity) / maxEquity) * 100 : 0;
    return drawdown * drawdown;
  });
  return Math.sqrt(drawdowns.reduce((sum, d) => sum + d, 0) / drawdowns.length);
}

function calculateMaxDrawdownDuration(equityCurve: any[]): number {
  let maxEquity = equityCurve[0].equity;
  let drawdownStart: Date | null = null;
  let maxDuration = 0;
  let currentDuration = 0;

  equityCurve.forEach(point => {
    if (point.equity > maxEquity) {
      maxEquity = point.equity;
      drawdownStart = null;
      currentDuration = 0;
    } else if (point.equity < maxEquity) {
      if (!drawdownStart) {
        drawdownStart = new Date(point.date);
      }
      currentDuration = Math.ceil((new Date(point.date).getTime() - drawdownStart.getTime()) / (1000 * 60 * 60 * 24));
      maxDuration = Math.max(maxDuration, currentDuration);
    }
  });

  return maxDuration;
}

function calculateAvgProfitPerDay(trades: any[], totalPnL: number): number {
  const tradingDays = calculateTradingDays(trades);
  return tradingDays === 0 ? 0 : totalPnL / tradingDays;
}

function calculateAvgTradesPerDay(trades: any[]): number {
  const tradingDays = calculateTradingDays(trades);
  return tradingDays === 0 ? 0 : trades.length / tradingDays;
}

function calculateTradingDays(trades: any[]): number {
  if (trades.length === 0) return 0;
  const startDate = new Date(trades[0].Entry_Date);
  const endDate = new Date(trades[trades.length - 1].Exit_Date);
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

function calculateTradingMonths(trades: any[]): number {
  const tradingDays = calculateTradingDays(trades);
  return tradingDays / 30.44; // Average days per month
}

function calculateRecentMetrics(trades: any[], days: number) {
  if (trades.length === 0) return { profitFactor: 0, winRate: 0 };

  const endDate = new Date(trades[trades.length - 1].Exit_Date);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  const recentTrades = trades.filter(t => new Date(t.Exit_Date) >= startDate);
  
  if (recentTrades.length === 0) return { profitFactor: 0, winRate: 0 };

  const winningTrades = recentTrades.filter(t => t.PnL > 0);
  const losingTrades = recentTrades.filter(t => t.PnL < 0);
  
  const totalWins = winningTrades.reduce((sum, t) => sum + t.PnL, 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.PnL, 0));
  
  const profitFactor = totalLosses === 0 ? totalWins : totalWins / totalLosses;
  const winRate = recentTrades.length === 0 ? 0 : winningTrades.length / recentTrades.length;

  return { profitFactor, winRate };
}

function calculateAnnualPnLPercent(trades: any[], totalPnL: number, initialCapital: number): number {
  if (trades.length === 0) return 0;
  
  const startDate = new Date(trades[0].Entry_Date);
  const endDate = new Date(trades[trades.length - 1].Exit_Date);
  const yearFraction = (endDate.getTime() - startDate.getTime()) / (365 * 24 * 60 * 60 * 1000);
  
  if (yearFraction === 0) return 0;
  
  const totalPnLPercent = (totalPnL / initialCapital) * 100;
  return totalPnLPercent / yearFraction;
}

function calculateDrawdownStats(equityCurve: any[]) {
  let maxEquity = equityCurve[0].equity;
  let drawdownStart: Date | null = null;
  let currentDrawdown = 0;
  let maxDuration = 0;
  let currentDuration = 0;
  let drawdownPeriods: { duration: number, drawdown: number }[] = [];

  equityCurve.forEach(point => {
    if (point.equity > maxEquity) {
      maxEquity = point.equity;
      if (drawdownStart && currentDrawdown > 0) {
        drawdownPeriods.push({
          duration: currentDuration,
          drawdown: currentDrawdown
        });
      }
      drawdownStart = null;
      currentDuration = 0;
      currentDrawdown = 0;
    } else if (point.equity < maxEquity) {
      if (!drawdownStart) {
        drawdownStart = new Date(point.date);
      }
      currentDuration = Math.ceil((new Date(point.date).getTime() - drawdownStart.getTime()) / (1000 * 60 * 60 * 24));
      currentDrawdown = ((maxEquity - point.equity) / maxEquity) * 100;
      maxDuration = Math.max(maxDuration, currentDuration);
    }
  });

  // Add the last drawdown period if exists
  if (drawdownStart && currentDrawdown > 0) {
    drawdownPeriods.push({
      duration: currentDuration,
      drawdown: currentDrawdown
    });
  }

  const avgDrawdownDuration = drawdownPeriods.length > 0
    ? drawdownPeriods.reduce((sum, period) => sum + period.duration, 0) / drawdownPeriods.length
    : 0;

  const avgDrawdownPercent = drawdownPeriods.length > 0
    ? drawdownPeriods.reduce((sum, period) => sum + period.drawdown, 0) / drawdownPeriods.length
    : 0;

  const medianDrawdownDuration = drawdownPeriods.length > 0
    ? drawdownPeriods.sort((a, b) => a.duration - b.duration)[Math.floor(drawdownPeriods.length / 2)].duration
    : 0;

  return {
    maxDrawdownDuration: maxDuration,
    avgDrawdownDuration,
    medianDrawdownDuration,
    avgDrawdownPercent,
    totalDrawdownPeriods: drawdownPeriods.length
  };
} 