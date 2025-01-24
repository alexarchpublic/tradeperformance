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
import { AdvancedStats } from "@/components/advanced/AdvancedStats";
import { CohortAnalysis } from "@/components/advanced/CohortAnalysis"

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
        <div className="relative w-full">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Trade Performance Analytics</h1>
          </div>
          <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2">
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
        <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto px-4">
          Analyze your trading performance by selecting algorithms and adjusting units. Start by choosing your algorithms below, 
          then optionally set a start date to filter the data.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 px-4">
        <div className="flex-grow">
          <AlgorithmSelector onAlgorithmsChange={handleAlgorithmsChange} />
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Start Date
            </label>
            <DatePicker
              selected={startDate}
              onChange={(date: Date | null) => setStartDate(date || undefined)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            />
          </div>
          <Button variant="outline" onClick={handleResetDate} className="w-full md:w-auto">
            Reset Date
          </Button>
        </div>
      </div>

      {/* Stats Boxes */}
      {chartData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8 px-4">
          <div className="bg-white p-3 md:p-6 rounded-lg shadow">
            <h3 className="text-xs md:text-sm font-medium text-gray-500">Total Trades</h3>
            <p className="text-lg md:text-2xl font-bold">{chartData.metadata.totalTrades}</p>
          </div>
          <div className="bg-white p-3 md:p-6 rounded-lg shadow">
            <h3 className="text-xs md:text-sm font-medium text-gray-500">Win Rate</h3>
            <p className="text-lg md:text-2xl font-bold">{(chartData.metadata.winRate * 100).toFixed(1)}%</p>
          </div>
          <div className="bg-white p-3 md:p-6 rounded-lg shadow">
            <h3 className="text-xs md:text-sm font-medium text-gray-500">Total PnL</h3>
            <div>
              <p className="text-lg md:text-2xl font-bold text-green-600">
                ${Math.round(chartData.metadata.totalPnL).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </p>
              <p className="text-xs md:text-sm font-medium text-green-600">
                {chartData.metadata.pnlPercent.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="bg-white p-3 md:p-6 rounded-lg shadow">
            <h3 className="text-xs md:text-sm font-medium text-gray-500">Max Drawdown</h3>
            <div>
              <p className="text-lg md:text-2xl font-bold text-red-600">
                ${Math.round(chartData.metadata.maxDrawdownDollars).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </p>
              <div className="flex flex-col">
                <p className="text-xs md:text-sm font-medium text-red-600">
                  {chartData.metadata.maxDrawdownPercent.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart Section */}
      <div className="bg-white p-3 md:p-6 rounded-lg shadow mb-8 mx-2 md:mx-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-xl md:text-2xl font-bold">Performance Chart</h2>
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
      {chartData && (
        <AdvancedStats chartData={chartData} />
      )}

      {/* Add cohort analysis section */}
      {chartData && (
        <section className="cohort-analysis-section mt-8 p-6 border rounded-lg bg-card">
          <h2 className="text-2xl font-semibold mb-6">Cohort Analysis</h2>
          <CohortAnalysis equityCurve={chartData.equityCurve} />
        </section>
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
