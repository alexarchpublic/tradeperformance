"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface MetricsSelectorProps {
  selectedMetrics: string[];
  onMetricsChange: (metrics: string[]) => void;
  showAuditedTrades?: boolean;
  onAuditedTradesChange?: (show: boolean) => void;
}

export function MetricsSelector({
  selectedMetrics,
  onMetricsChange,
  showAuditedTrades = false,
  onAuditedTradesChange,
}: MetricsSelectorProps) {
  const handleMetricToggle = (metric: string) => {
    if (selectedMetrics.includes(metric)) {
      onMetricsChange(selectedMetrics.filter((m) => m !== metric));
    } else {
      onMetricsChange([...selectedMetrics, metric]);
    }
  };

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="equity"
          checked={selectedMetrics.includes("equity")}
          onCheckedChange={() => handleMetricToggle("equity")}
        />
        <label
          htmlFor="equity"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Account Value
        </label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="pnl"
          checked={selectedMetrics.includes("pnl")}
          onCheckedChange={() => handleMetricToggle("pnl")}
        />
        <label
          htmlFor="pnl"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          P&L
        </label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="drawdown"
          checked={selectedMetrics.includes("drawdown")}
          onCheckedChange={() => handleMetricToggle("drawdown")}
        />
        <label
          htmlFor="drawdown"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Drawdown
        </label>
      </div>

      {onAuditedTradesChange && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="audited"
            checked={showAuditedTrades}
            onCheckedChange={(checked) => onAuditedTradesChange(checked as boolean)}
          />
          <label
            htmlFor="audited"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Show Audited Trades
          </label>
        </div>
      )}
    </div>
  );
} 