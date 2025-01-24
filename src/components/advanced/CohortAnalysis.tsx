import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, parseISO, startOfMonth } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface CohortAnalysisProps {
  rawData: EquityDataPoint[]
}

interface CohortData {
  cohortKey: string
  startDate: Date
  dataPoints: Array<{
    daysSinceStart: number
    equity: number
    // Add velocity calculation
  }>
}

export default function CohortAnalysis({ rawData }: CohortAnalysisProps) {
  const [selectedYears, setSelectedYears] = useState<Set<number>>(new Set())
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(new Set())

  // Process raw data into cohorts
  const cohorts = useMemo(() => {
    const cohortMap = new Map<string, CohortData>()
    
    rawData.forEach(entry => {
      const date = parseISO(entry.date)
      const cohortDate = startOfMonth(date)
      const cohortKey = format(cohortDate, 'yyyy-MM')
      
      if (!cohortMap.has(cohortKey)) {
        cohortMap.set(cohortKey, {
          cohortKey,
          startDate: cohortDate,
          dataPoints: []
        })
      }
      
      const cohort = cohortMap.get(cohortKey)!
      const daysSinceStart = Math.floor(
        (date.getTime() - cohortDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      cohort.dataPoints.push({
        daysSinceStart,
        equity: entry.equity
      })
    })

    return Array.from(cohortMap.values())
  }, [rawData])

  // Filtered cohorts based on selection
  const filteredCohorts = useMemo(() => {
    return cohorts.filter(cohort => {
      const year = cohort.startDate.getFullYear()
      const month = cohort.startDate.getMonth() + 1 // 1-12
      return (
        (selectedYears.size === 0 || selectedYears.has(year)) &&
        (selectedMonths.size === 0 || selectedMonths.has(month))
      )
    })
  }, [cohorts, selectedYears, selectedMonths])

  // Unique years and months for filtering
  const { uniqueYears, uniqueMonths } = useMemo(() => {
    const years = new Set<number>()
    const months = new Set<number>()
    
    cohorts.forEach(cohort => {
      years.add(cohort.startDate.getFullYear())
      months.add(cohort.startDate.getMonth() + 1)
    })

    return {
      uniqueYears: Array.from(years).sort(),
      uniqueMonths: Array.from(months).sort((a, b) => a - b)
    }
  }, [cohorts])

  // Toggle year selection
  const toggleYear = (year: number) => {
    const newYears = new Set(selectedYears)
    newYears.has(year) ? newYears.delete(year) : newYears.add(year)
    setSelectedYears(newYears)
  }

  // Toggle month selection
  const toggleMonth = (month: number) => {
    const newMonths = new Set(selectedMonths)
    newMonths.has(month) ? newMonths.delete(month) : newMonths.add(month)
    setSelectedMonths(newMonths)
  }

  return (
    <div className="cohort-analysis-container space-y-8">
      {/* Filter Controls */}
      <div className="filter-controls flex gap-8 flex-wrap">
        <div className="year-filter space-y-2">
          <Label className="text-sm font-medium">Filter by Year</Label>
          <div className="flex flex-wrap gap-2">
            {uniqueYears.map(year => (
              <Button
                key={year}
                variant={selectedYears.has(year) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleYear(year)}
              >
                {year}
              </Button>
            ))}
          </div>
        </div>

        <div className="month-filter space-y-2">
          <Label className="text-sm font-medium">Filter by Month</Label>
          <div className="grid grid-cols-3 gap-2">
            {uniqueMonths.map(month => (
              <div key={month} className="flex items-center space-x-2">
                <Checkbox
                  id={`month-${month}`}
                  checked={selectedMonths.has(month)}
                  onCheckedChange={() => toggleMonth(month)}
                />
                <Label htmlFor={`month-${month}`} className="text-sm">
                  {format(new Date(2000, month - 1), 'MMM')}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cohort Equity Curves */}
      <div className="cohort-equity-chart">
        <h2 className="text-lg font-bold mb-4">Cohort Equity Curves</h2>
        <div className="chart-container h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="daysSinceStart"
                name="Days Since Cohort Start"
                type="number"
              />
              <YAxis />
              <Tooltip />
              <Legend />
              
              {filteredCohorts.map(cohort => (
                <Line
                  key={cohort.cohortKey}
                  dataKey="equity"
                  data={cohort.dataPoints}
                  name={format(cohort.startDate, 'MMM yyyy')}
                  stroke={`#${Math.floor(Math.random()*16777215).toString(16)}`}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Equity Velocity Chart */}
      <div className="equity-velocity-chart">
        <h2 className="text-lg font-bold mb-4">Equity Velocity</h2>
        <div className="chart-container h-96">
          {/* Similar structure to equity chart with velocity calculations */}
        </div>
      </div>
    </div>
  )
} 