import { useState } from 'react'
import CohortAnalysis from '@/components/advanced/CohortAnalysis'
import { Button } from '@/components/ui/button'
import { useCohortData } from '@/hooks/useCohortData'

export default function AdvancedStatsPage() {
  const [showCohortAnalysis, setShowCohortAnalysis] = useState(false)
  const { data, loading } = useCohortData()

  return (
    <div className="advanced-stats-container p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Advanced Analytics</h1>
        <Button 
          onClick={() => setShowCohortAnalysis(!showCohortAnalysis)}
          variant="outline"
        >
          {showCohortAnalysis ? 'Hide' : 'Show'} Cohort Analysis
        </Button>
      </div>

      {showCohortAnalysis && (
        <section className="cohort-analysis-section mt-8 p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-6">Cohort Analysis</h2>
          {loading ? (
            <div className="text-center py-8">Loading data...</div>
          ) : (
            <CohortAnalysis rawData={data} />
          )}
        </section>
      )}
    </div>
  )
} 