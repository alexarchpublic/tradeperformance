"use client";

import { useState } from 'react'
import { CohortAnalysis } from "@/components/advanced/CohortAnalysis"
import { Button } from '@/components/ui/button'
import { type ProcessedTradeData } from "@/lib/utils/trade-data"

interface AdvancedStatsProps {
  chartData: ProcessedTradeData;
}

export function AdvancedStats({ chartData }: AdvancedStatsProps) {
  const [showCohortAnalysis, setShowCohortAnalysis] = useState(false)

  if (!chartData?.equityCurve) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="advanced-stats-container p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <Button 
            onClick={() => setShowCohortAnalysis(!showCohortAnalysis)}
            variant="outline"
          >
            {showCohortAnalysis ? 'Hide' : 'Show'} Cohort Analysis
          </Button>
        </div>

        {showCohortAnalysis && (
          <section className="cohort-analysis-section mt-8 p-6 border rounded-lg bg-card">
            <CohortAnalysis equityCurve={chartData.equityCurve} />
          </section>
        )}
      </div>
    </div>
  )
} 