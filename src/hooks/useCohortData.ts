import { useMemo } from "react";
import { format, parseISO, startOfMonth } from "date-fns";
import { type EquityCurvePoint } from "@/lib/utils/trade-data";

export interface CohortData {
  startDate: string;
  data: Array<{
    day: number;
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
      
      // Calculate days since cohort start
      const start = parseISO(equityCurve[0].date);
      const current = parseISO(point.date);
      const day = Math.floor((current.getTime() - start.getTime()) / (1000 * 3600 * 24));
      
      // Get previous equity for velocity calculation
      const prevEquity = idx > 0 ? equityCurve[idx - 1].equity : point.equity;
      const velocity = point.equity - prevEquity;
      
      cohortsMap.get(cohortKey)?.data.push({
        day,
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