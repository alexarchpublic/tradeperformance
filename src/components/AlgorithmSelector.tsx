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
  'atlas_es_slow.csv': 75000,   // Atlas ES Slow: $75k per unit
  'atlas_es_fast.csv': 75000,   // Atlas ES Fast: $75k per unit
  'atlas_mes_slow.csv': 7500,   // Atlas MES Slow: $7.5k per unit
  'atlas_mes_fast.csv': 7500,   // Atlas MES Fast: $7.5k per unit
  'atlas_nq_slow.csv': 75000,   // Atlas NQ Slow: $75k per unit
  'atlas_nq_fast.csv': 75000,   // Atlas NQ Fast: $75k per unit
  'atlas_mnq_slow.csv': 7500,   // Atlas MNQ Slow: $7.5k per unit
  'atlas_mnq_fast.csv': 7500,   // Atlas MNQ Fast: $7.5k per unit
  'gateway_es.csv': 100000,     // Gateway ES: $100k per unit
  'gateway_mes.csv': 10000,     // Gateway MES: $10k per unit
};

export function AlgorithmSelector({ onAlgorithmsChange, algorithms }: AlgorithmSelectorProps) {
  const handleAddAlgorithm = () => {
    const newAlgorithms = [...algorithms, { dataset: 'atlas_es_slow.csv', units: 1 }];
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
              <SelectItem value="atlas_es_slow.csv">Atlas ES Slow</SelectItem>
              <SelectItem value="atlas_es_fast.csv">Atlas ES Fast</SelectItem>
              <SelectItem value="atlas_mes_slow.csv">Atlas MES Slow</SelectItem>
              <SelectItem value="atlas_mes_fast.csv">Atlas MES Fast</SelectItem>
              <SelectItem value="atlas_nq_slow.csv">Atlas NQ Slow</SelectItem>
              <SelectItem value="atlas_nq_fast.csv">Atlas NQ Fast</SelectItem>
              <SelectItem value="atlas_mnq_slow.csv">Atlas MNQ Slow</SelectItem>
              <SelectItem value="atlas_mnq_fast.csv">Atlas MNQ Fast</SelectItem>
              <SelectItem value="gateway_es.csv">Gateway ES</SelectItem>
              <SelectItem value="gateway_mes.csv">Gateway MES</SelectItem>
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