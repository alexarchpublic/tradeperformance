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
import Image from "next/image";

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
        <div className="relative flex items-center justify-center px-4 mb-4">
          <h1 className="text-4xl font-bold text-gray-900">Trade Performance Analytics</h1>
          <div className="absolute right-4 flex items-center">
            <Image 
              src="/ArchPublicLogo.png" 
              alt="Arch Public Logo" 
              width={96}
              height={96}
              className="h-12 w-auto"
              quality={100}
              priority
            />
          </div>
        </div>
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

      {/* Footer */}
      <footer className="mt-16 border-t pt-8 pb-16 text-sm text-gray-600">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Notes Section */}
          <div>
            <h3 className="font-semibold mb-2">Notes</h3>
            <p className="leading-relaxed">
              The trade data presented reflects our most current dataset derived from the latest versions of our algorithms. 
              Actual trading results may vary from displayed data due to ongoing algorithm optimizations aimed at addressing 
              market dynamics and technical improvements. While we strive to minimize adverse events, some clients may 
              experience larger drawdowns than shown. It&apos;s important to note that historical performance should not be 
              considered predictive of future results.
            </p>
          </div>

          {/* Disclaimer Section */}
          <div>
            <h3 className="font-semibold mb-2">Disclaimer</h3>
            <div className="space-y-4 leading-relaxed">
              <p>
                <span className="font-medium">Risk Acknowledgment</span> – Engaging in futures trading involves significant risk, especially when trading on margin. Such activities may not be suitable for everyone, given the high level of risk involved. The leverage provided can both amplify gains and losses. Prior to participating in trading, it&apos;s crucial to evaluate your investment goals, experience level, and risk tolerance carefully. There is a real risk that you might lose part or all of your initial investment, so you should not invest funds that you cannot afford to lose. We strongly advise that you fully understand all the risks related to trading and, if necessary, seek guidance from an independent financial advisor.
              </p>
              <p>
                <span className="font-medium">Regulatory Compliance</span> – Only individuals who are registered with certain regulatory bodies are authorized to offer advice or conduct transactions in futures. These bodies include the Commodity Futures Trading Commission (CFTC), the Securities and Exchange Commission (SEC), and state regulatory authorities, each classified as an &quot;Intermediary.&quot; The Arch Public, its affiliates, or any associated individuals involved in creating and maintaining our offerings are not registered as Intermediaries. We encourage our clients to consult with a licensed investment professional before engaging in any trading strategies or transactions. We do not guarantee that the outcomes discussed herein will be achieved, nor do we claim that our past performance is indicative of future results.
              </p>
              <p>
                <span className="font-medium">Educational Purpose Only</span> – Information provided by The Arch Public is for educational purposes and should not be taken as personalized investment advice. Investment decisions should always be made based on your specific financial needs and circumstances, with the counsel of a professional advisor. Engaging in trading without thorough understanding and professional advice may be detrimental to your financial health.
              </p>
              <p>
                <span className="font-medium">CFTC/NFA Disclaimer</span> – Simulated or hypothetical trading scenarios have limitations and may not accurately represent real trading outcomes. Such results do not reflect actual trading and may not capture the impact of market factors such as liquidity. Hypothetical trading does not involve financial risk, and no simulated trading record can account for the risk of actual trading. The Arch Public makes no claims that any account will achieve profits or losses similar to those discussed.
              </p>
              <p>
                <span className="font-medium">General Warning</span> – Trading involves the risk of loss and may not be suitable for all individuals. Past performance is not indicative of future results, and there can be significant differences between hypothetical and actual trading results. Deciding to trade represents a personal decision, and The Arch Public advises against investing money that you cannot afford to lose. This disclaimer does not consider your individual financial circumstances and is not intended as specific investment advice.
              </p>
              <p>
                <span className="font-medium">Acknowledgment</span> – Users acknowledge that all software is user driven and controlled by each individual trader, and not by Arch Public or any of its affiliates.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
