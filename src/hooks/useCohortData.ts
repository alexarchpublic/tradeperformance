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
    
    equityCurve.forEach((point, idx) => {
      const cohortDate = startOfMonth(parseISO(point.date));
      const cohortKey = format(cohortDate, "yyyy-MM");
      
      // Initialize cohort if not exists
      if (!cohortsMap.has(cohortKey)) {
        cohortsMap.set(cohortKey, {
          startDate: cohortKey,
          data: [],
        });
        unique.add(cohortKey);
      }
      
      // Calculate trade number for this cohort
      const cohortData = cohortsMap.get(cohortKey)!;
      const tradeNumber = cohortData.data.length + 1;
      
      // Get previous equity for velocity calculation
      const prevEquity = idx > 0 ? equityCurve[idx - 1].equity : point.equity;
      const velocity = point.equity - prevEquity;
      
      cohortData.data.push({
        tradeNumber,
        equity: point.equity,
        velocity,
      });
    });

    return {
      cohorts: Array.from(cohortsMap.values()),
      uniqueCohorts: Array.from(unique).sort(),
    };
  }, [equityCurve]);
} 