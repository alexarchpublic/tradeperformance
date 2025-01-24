import { useEffect, useState } from 'react'
import Papa from 'papaparse'

interface EquityDataPoint {
  date: string
  equity: number
}

export function useCohortData() {
  const [data, setData] = useState<EquityDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const files = [
          '/data/strategy1.csv',
          '/data/strategy2.csv',
          '/data/strategy3.csv',
          '/data/strategy4.csv'
        ]

        const allData: EquityDataPoint[] = []
        
        for (const file of files) {
          const response = await fetch(file)
          const csv = await response.text()
          
          Papa.parse<EquityDataPoint>(csv, {
            header: true,
            dynamicTyping: true,
            complete: (results) => {
              allData.push(...results.data.filter(d => d.date && d.equity))
            }
          })
        }

        setData(allData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return { data, loading }
} 