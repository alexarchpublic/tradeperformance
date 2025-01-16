"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { loadTradeData, type ProcessedTradeData } from "@/lib/utils/trade-data";
import { AlgorithmSelector, type Algorithm } from "@/components/AlgorithmSelector";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { MetricsSelector } from "@/components/MetricsSelector";
import { TradeChart } from "@/components/TradeChart";
import { TradeList } from "@/components/TradeList";

export default function Home() {
  const [chartData, setChartData] = useState<ProcessedTradeData | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([{ dataset: 'nq_trades.csv', units: 1 }]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["equity"]);
  const [hoveredTradeIndex, setHoveredTradeIndex] = useState<number | null>(null);

  const handleAlgorithmsChange = (newAlgorithms: Algorithm[]) => {
    setAlgorithms(newAlgorithms);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await loadTradeData(
          algorithms,
          startDate ? startDate.toISOString() : ''
        );
        setChartData(data);
      } catch (error) {
        console.error('Error loading trade data:', error);
      }
    };

    fetchData();
  }, [algorithms, startDate]);

  const handleResetDate = () => {
    setStartDate(undefined);
  };

  return (
    <main className="container mx-auto p-4 space-y-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Trade Performance Analytics</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Analyze your trading performance by selecting algorithms and adjusting units. Start by choosing your algorithms below, 
          then optionally set a start date to filter the data. The statistics and charts will update automatically as you make changes.
        </p>
      </div>

      <div className="flex gap-4">
        <div className="flex-grow">
          <AlgorithmSelector onAlgorithmsChange={handleAlgorithmsChange} />
        </div>
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Start Date
            </label>
            <DatePicker
              selected={startDate}
              onChange={(date: Date | null) => setStartDate(date || undefined)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            />
          </div>
          <Button variant="outline" onClick={handleResetDate}>
            Reset Date
          </Button>
        </div>
      </div>

      {/* Stats Boxes */}
      {chartData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Trades</h3>
            <p className="text-2xl font-bold">{chartData.metadata.totalTrades}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Win Rate</h3>
            <p className="text-2xl font-bold">{(chartData.metadata.winRate * 100).toFixed(1)}%</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total PnL</h3>
            <div>
              <p className="text-2xl font-bold text-green-600">
                ${Math.round(chartData.metadata.totalPnL).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </p>
              <p className="text-sm font-medium text-green-600">
                {chartData.metadata.pnlPercent.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Max Drawdown</h3>
            <div>
              <p className="text-2xl font-bold text-red-600">
                ${Math.round(chartData.metadata.maxDrawdownDollars).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </p>
              <div className="flex flex-col">
                <p className="text-sm font-medium text-red-600">
                  {chartData.metadata.maxDrawdownPercent.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Performance Chart</h2>
          <MetricsSelector selectedMetrics={selectedMetrics} onMetricsChange={setSelectedMetrics} />
        </div>
        {chartData && chartData.equityCurve && (
          <TradeChart
            data={{ equityCurve: chartData.equityCurve }}
            selectedMetrics={selectedMetrics}
            hoveredTradeIndex={hoveredTradeIndex}
          />
        )}
      </div>

      {/* Trade List */}
      {chartData && (
        <TradeList
          data={chartData}
          onTradeHover={setHoveredTradeIndex}
          hoveredTradeIndex={hoveredTradeIndex}
        />
      )}

      {/* Advanced Stats */}
      {chartData && chartData.metadata.advancedStats && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Advanced Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Trading Performance */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Trading Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Profit Factor</span>
                  <span className="font-medium">{(chartData.metadata.advancedStats.profitFactor || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Win/Loss Ratio</span>
                  <span className="font-medium">{(chartData.metadata.advancedStats.winLossRatio || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Expectancy</span>
                  <span className="font-medium">${(chartData.metadata.advancedStats.expectancy || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Annual PnL</span>
                  <span className={`font-medium ${chartData.metadata.advancedStats.avgAnnualPnLPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(chartData.metadata.advancedStats.avgAnnualPnLPercent || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Sharpe Ratio</span>
                  <span className="font-medium">{(chartData.metadata.advancedStats.sharpeRatio || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Recovery Factor</span>
                  <span className="font-medium">{(chartData.metadata.advancedStats.recoveryFactor || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Calmar Ratio</span>
                  <span className="font-medium">{(chartData.metadata.advancedStats.calmarRatio || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ulcer Index</span>
                  <span className="font-medium">{(chartData.metadata.advancedStats.ulcerIndex || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Trade Statistics */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Trade Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Win</span>
                  <span className="font-medium text-green-600">
                    ${Math.round(chartData.metadata.advancedStats.averageWin || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Loss</span>
                  <span className="font-medium text-red-600">
                    ${Math.round(chartData.metadata.advancedStats.averageLoss || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Largest Win</span>
                  <span className="font-medium text-green-600">
                    ${Math.round(chartData.metadata.advancedStats.largestWin || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Largest Loss</span>
                  <span className="font-medium text-red-600">
                    ${Math.abs(Math.round(chartData.metadata.advancedStats.largestLoss || 0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payoff Ratio</span>
                  <span className="font-medium">{(chartData.metadata.advancedStats.payoffRatio || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Max Drawdown</span>
                  <span className="font-medium text-red-600">
                    {chartData.metadata.maxDrawdownPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Max Drawdown Duration</span>
                  <span className="font-medium">{chartData.metadata.advancedStats.maxDrawdownDuration || 0} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Drawdown</span>
                  <span className="font-medium text-red-600">
                    {(chartData.metadata.advancedStats.avgDrawdownPercent || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Drawdown Duration</span>
                  <span className="font-medium">{Math.round(chartData.metadata.advancedStats.avgDrawdownDuration || 0)} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Median Drawdown Duration</span>
                  <span className="font-medium">{Math.round(chartData.metadata.advancedStats.medianDrawdownDuration || 0)} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Drawdown Periods</span>
                  <span className="font-medium">{chartData.metadata.advancedStats.totalDrawdownPeriods || 0}</span>
                </div>
              </div>
            </div>

            {/* Recent Performance */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Recent Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">3-Month Profit Factor</span>
                  <span className="font-medium">{(chartData.metadata.advancedStats.profitFactor3Month || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">3-Month Win Rate</span>
                  <span className="font-medium">{((chartData.metadata.advancedStats.winRate3Month || 0) * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Profit/Day</span>
                  <span className={`font-medium ${chartData.metadata.advancedStats.avgProfitPerDay >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${Math.round(chartData.metadata.advancedStats.avgProfitPerDay || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Trades/Month</span>
                  <span className="font-medium">{(chartData.metadata.advancedStats.tradingMonths ? chartData.metadata.totalTrades / chartData.metadata.advancedStats.tradingMonths : 0).toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Profit %/Trade</span>
                  <span className={`font-medium ${chartData.metadata.advancedStats.profitPercentPerTrade >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(chartData.metadata.advancedStats.profitPercentPerTrade || 0).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Trading Days</span>
                  <span className="font-medium">{chartData.metadata.advancedStats.tradingDays || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Trading Months</span>
                  <span className="font-medium">{(chartData.metadata.advancedStats.tradingMonths || 0).toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <span>Analysis Period: {(chartData.metadata.advancedStats.startDate || '').split('T')[0]} to {(chartData.metadata.advancedStats.endDate || '').split('T')[0]}</span>
              <span>{chartData.metadata.advancedStats.tradingDays || 0} trading days over {(chartData.metadata.advancedStats.tradingMonths || 0).toFixed(1)} months</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
