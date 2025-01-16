"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DatasetSelectorProps {
  onDatasetChange: (dataset: string) => void;
  selectedDataset: string;
}

export function DatasetSelector({ onDatasetChange, selectedDataset }: DatasetSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="dataset">Select Dataset</Label>
      <Select value={selectedDataset} onValueChange={onDatasetChange}>
        <SelectTrigger id="dataset">
          <SelectValue placeholder="Choose a dataset" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="mnq_trades.csv">Atlas MNQ</SelectItem>
          <SelectItem value="nq_trades.csv">Atlas NQ</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
} 