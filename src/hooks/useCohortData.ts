import { useMemo } from "react";
import { format, parseISO, startOfMonth } from "date-fns";
import { type EquityCurvePoint } from "@/lib/utils/trade-data";

export interface CohortData {
  startDate: string;
  data: Array<{
    tradeNumber: number;
    equity: number;
    velocity: number;
  }>;
}

export function useCohortData(equityCurve: EquityCurvePoint[]) {
  return useMemo(() => {
    const cohortsMap = new Map<string, CohortData>();
    const unique = new Set<string>();
    
    // First, organize points by cohort
    equityCurve.forEach((point) => {
      const pointDate = parseISO(point.date);
      
      // Add all points to their respective cohorts
      // A point belongs to all cohorts that started before or during its month
      equityCurve.forEach((cohortPoint) => {
        const cohortPointDate = parseISO(cohortPoint.date);
        const cohortStartDate = startOfMonth(cohortPointDate);
        
        if (cohortPointDate >= pointDate) {
          const key = format(cohortStartDate, "yyyy-MM");
          
          if (!cohortsMap.has(key)) {
            cohortsMap.set(key, {
              startDate: key,
              data: [],
            });
            unique.add(key);
          }
          
          const cohortData = cohortsMap.get(key)!;
          
          // Only add point if it's after or in the cohort's start month
          if (pointDate >= cohortStartDate) {
            // Calculate trade number within this cohort
            const tradeNumber = cohortData.data.length + 1;
            
            // Get previous equity for velocity calculation
            const prevPoint = cohortData.data[cohortData.data.length - 1];
            const prevEquity = prevPoint ? prevPoint.equity : point.equity;
            const velocity = point.equity - prevEquity;
            
            cohortData.data.push({
              tradeNumber,
              equity: point.equity,
              velocity,
            });
          }
        }
      });
    });

    return {
      cohorts: Array.from(cohortsMap.values()),
      uniqueCohorts: Array.from(unique).sort(),
    };
  }, [equityCurve]);
} 