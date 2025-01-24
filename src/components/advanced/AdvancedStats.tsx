"use client";

import { CohortAnalysis } from "@/components/advanced/CohortAnalysis"
import { type ProcessedTradeData } from "@/lib/utils/trade-data"

interface AdvancedStatsProps {
  chartData: ProcessedTradeData;
}

export function AdvancedStats({ chartData }: AdvancedStatsProps) {
  if (!chartData?.equityCurve) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="advanced-stats-container p-6 max-w-7xl mx-auto">
        {/* Original Advanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Trading Performance */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Trading Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Profit Factor</span>
                <span className="font-medium">{(chartData.metadata.advancedStats?.profitFactor || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Win/Loss Ratio</span>
                <span className="font-medium">{(chartData.metadata.advancedStats?.winLossRatio || 0).toFixed(2)}</span>
              </div>
              {/* ... rest of trading performance stats ... */}
            </div>
          </div>

          {/* Trade Statistics */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Trade Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Win</span>
                <span className="font-medium text-green-600">
                  ${Math.round(chartData.metadata.advancedStats?.averageWin || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                </span>
              </div>
              {/* ... rest of trade statistics ... */}
            </div>
          </div>

          {/* Recent Performance */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Recent Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">3-Month Profit Factor</span>
                <span className="font-medium">{(chartData.metadata.advancedStats?.profitFactor3Month || 0).toFixed(2)}</span>
              </div>
              {/* ... rest of recent performance stats ... */}
            </div>
          </div>
        </div>

        {/* Cohort Analysis Section */}
        <div className="mt-8">
          <CohortAnalysis equityCurve={chartData.equityCurve} />
        </div>
      </div>
    </div>
  )
}