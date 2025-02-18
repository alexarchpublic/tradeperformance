import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";

export interface Algorithm {
  dataset: string;
  units: number;
}

interface AlgorithmSelectorProps {
  onAlgorithmsChange: (algorithms: Algorithm[]) => void;
  algorithms: Algorithm[];
}

const CAPITAL_REQUIREMENTS = {
  'nq_trades.csv': 100000,  // Atlas NQ: $100k per unit
  'mnq_trades.csv': 25000,  // Atlas MNQ: $25k per unit
  'es_trades.csv': 100000,  // Gateway ES: $100k per unit
  'mes_trades.csv': 10000,  // Gateway MES: $10k per unit
};

export function AlgorithmSelector({ onAlgorithmsChange, algorithms }: AlgorithmSelectorProps) {
  const handleAddAlgorithm = () => {
    const newAlgorithms = [...algorithms, { dataset: 'nq_trades.csv', units: 1 }];
    onAlgorithmsChange(newAlgorithms);
  };

  const handleRemoveAlgorithm = (index: number) => {
    const newAlgorithms = algorithms.filter((_, i) => i !== index);
    onAlgorithmsChange(newAlgorithms);
  };

  const handleDatasetChange = (value: string, index: number) => {
    const newAlgorithms = algorithms.map((algo, i) => {
      if (i === index) {
        return { ...algo, dataset: value };
      }
      return algo;
    });
    onAlgorithmsChange(newAlgorithms);
  };

  const handleUnitsChange = (value: string, index: number) => {
    const newAlgorithms = algorithms.map((algo, i) => {
      if (i === index) {
        return { ...algo, units: parseInt(value) };
      }
      return algo;
    });
    onAlgorithmsChange(newAlgorithms);
  };

  return (
    <div className="space-y-4">
      {algorithms.map((algorithm, index) => (
        <div key={index} className="flex gap-4 items-center">
          <Select
            value={algorithm.dataset}
            onValueChange={(value) => handleDatasetChange(value, index)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select dataset" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nq_trades.csv">Atlas NQ</SelectItem>
              <SelectItem value="mnq_trades.csv">Atlas MNQ</SelectItem>
              <SelectItem value="es_trades.csv">Gateway ES</SelectItem>
              <SelectItem value="mes_trades.csv">Gateway MES</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={algorithm.units.toString()}
            onValueChange={(value) => handleUnitsChange(value, index)}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Units" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((units) => (
                <SelectItem key={units} value={units.toString()}>
                  {units} {units === 1 ? 'unit' : 'units'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {index > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveAlgorithm(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {index === algorithms.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAddAlgorithm}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}

      <div className="mt-4">
        <div className="text-sm font-medium text-gray-500">Initial Capital Required</div>
        <div className="text-2xl font-bold">
          ${algorithms.reduce((sum, algo) => {
            const requirement = CAPITAL_REQUIREMENTS[algo.dataset as keyof typeof CAPITAL_REQUIREMENTS] || 0;
            return sum + (requirement * algo.units);
          }, 0).toLocaleString()}
        </div>
      </div>
    </div>
  );
} 