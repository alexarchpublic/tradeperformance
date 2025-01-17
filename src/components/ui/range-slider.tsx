import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface RangeSliderProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function RangeSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 0.1,
  className = "",
}: RangeSliderProps) {
  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      value={value}
      onValueChange={onChange}
      min={min}
      max={max}
      step={step}
      minStepsBetweenThumbs={1}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow rounded-full bg-gray-200">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-blue-500" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="block h-4 w-4 rounded-full border-2 border-blue-500 bg-white focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75 disabled:pointer-events-none disabled:opacity-50"
        aria-label="Left handle"
      />
      <SliderPrimitive.Thumb
        className="block h-4 w-4 rounded-full border-2 border-blue-500 bg-white focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75 disabled:pointer-events-none disabled:opacity-50"
        aria-label="Right handle"
      />
    </SliderPrimitive.Root>
  );
} 