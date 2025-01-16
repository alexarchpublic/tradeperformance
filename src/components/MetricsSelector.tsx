"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface MetricsSelectorProps {
  onMetricsChange: (metrics: string[]) => void;
  selectedMetrics: string[];
}

export function MetricsSelector({
  onMetricsChange,
  selectedMetrics,
}: MetricsSelectorProps) {
  const metrics = [
    { id: "equity", label: "Equity Curve" },
    { id: "pnl", label: "PnL" },
    { id: "drawdown", label: "Drawdown" },
  ];

  const handleMetricChange = (metricId: string, checked: boolean) => {
    if (checked) {
      onMetricsChange([...selectedMetrics, metricId]);
    } else {
      onMetricsChange(selectedMetrics.filter(id => id !== metricId));
    }
  };

  return (
    <div className="space-y-2">
      <Label>Metrics</Label>
      <div className="space-y-2">
        {metrics.map((metric) => (
          <div key={metric.id} className="flex items-center space-x-2">
            <Checkbox
              id={metric.id}
              checked={selectedMetrics.includes(metric.id)}
              onCheckedChange={(checked) => handleMetricChange(metric.id, checked as boolean)}
            />
            <Label htmlFor={metric.id}>{metric.label}</Label>
          </div>
        ))}
      </div>
    </div>
  );
} 