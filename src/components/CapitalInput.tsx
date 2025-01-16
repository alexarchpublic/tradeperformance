"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CapitalInputProps {
  initialCapital: number;
  onCapitalChange: (value: number) => void;
}

export function CapitalInput({
  initialCapital,
  onCapitalChange,
}: CapitalInputProps) {
  const [inputValue, setInputValue] = useState(initialCapital.toString());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get raw input value, allowing empty string
    const rawValue = e.target.value.replace(/[^\d]/g, "");
    setInputValue(rawValue);

    // Only update parent if we have a valid number
    if (rawValue) {
      const numericValue = parseInt(rawValue, 10);
      onCapitalChange(numericValue);
    }
  };

  // Format for display only if we have a value
  const displayValue = inputValue ? parseInt(inputValue).toLocaleString() : "";

  return (
    <div className="space-y-2">
      <Label htmlFor="capital">Initial Capital</Label>
      <Input
        id="capital"
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder="Enter initial capital"
      />
    </div>
  );
} 