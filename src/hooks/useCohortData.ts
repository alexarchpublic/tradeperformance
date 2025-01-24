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
    // Sort equity curve chronologically
    const sortedCurve = [...equityCurve].sort((a, b) => 
      parseISO(a.date).getTime() - parseISO(b.date).getTime()
    );

    // Get unique cohort start dates (first of each month)
    const cohortStarts = sortedCurve.reduce((acc, point) => {
      const cohortStart = startOfMonth(parseISO(point.date));
      return acc.add(cohortStart.toISOString());
    }, new Set<string>());

    const cohorts: CohortData[] = [];
    const uniqueCohorts: string[] = [];

    // Process each cohort
    Array.from(cohortStarts).forEach(cohortStart => {
      const startDate = parseISO(cohortStart);
      const cohortKey = format(startDate, 'yyyy-MM');
      
      // Filter trades that occurred AT OR AFTER this cohort start
      const cohortPoints = sortedCurve.filter(point => 
        parseISO(point.date) >= startDate
      );

      // Calculate trade numbers and velocity
      const data = cohortPoints.map((point, index) => {
        const prevEquity = index > 0 ? cohortPoints[index - 1].equity : point.equity;
        return {
          tradeNumber: index + 1,
          equity: point.equity,
          velocity: point.equity - prevEquity
        };
      });

      cohorts.push({
        startDate: cohortKey,
        data
      });
      
      uniqueCohorts.push(cohortKey);
    });

    return {
      cohorts: cohorts.sort((a, b) => a.startDate.localeCompare(b.startDate)),
      uniqueCohorts: uniqueCohorts.sort()
    };
  }, [equityCurve]);
} 