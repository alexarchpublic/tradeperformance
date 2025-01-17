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
  const [isDragging, setIsDragging] = React.useState(false);
  const dragRef = React.useRef<{
    startX: number;
    startRange: [number, number];
  } | null>(null);

  const handlePanStart = (e: React.MouseEvent) => {
    // Only start panning if clicking the range (blue area) or track
    const target = e.target as Element;
    if (!target.classList.contains('pan-handle')) return;

    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startRange: [...value] as [number, number],
    };

    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePanMove = (e: MouseEvent) => {
    if (!isDragging || !dragRef.current) return;

    const dx = e.clientX - dragRef.current.startX;
    const sliderContainer = document.querySelector('.slider-container');
    const containerWidth = sliderContainer?.clientWidth || 1;
    const rangeSize = value[1] - value[0];
    const pixelsPerUnit = containerWidth / (max - min);
    const deltaUnits = dx / pixelsPerUnit;

    let newStart = dragRef.current.startRange[0] + deltaUnits;
    let newEnd = dragRef.current.startRange[1] + deltaUnits;

    // Clamp the range to min/max bounds
    if (newStart < min) {
      newEnd = min + rangeSize;
      newStart = min;
    }
    if (newEnd > max) {
      newStart = max - rangeSize;
      newEnd = max;
    }

    onChange([newStart, newEnd]);
  };

  const handlePanEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      dragRef.current = null;
      document.body.style.userSelect = '';
    }
  };

  // Add and remove document-level event listeners
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handlePanMove);
      document.addEventListener('mouseup', handlePanEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handlePanMove);
      document.removeEventListener('mouseup', handlePanEnd);
    };
  }, [isDragging]);

  return (
    <div className={cn("px-4 slider-container relative", className)}>
      <SliderPrimitive.Root
        className="relative flex w-full touch-none select-none items-center"
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
        {/* Draggable overlay for panning - positioned above track but below thumbs */}
        <div
          className={cn(
            "pan-handle absolute h-2 w-full rounded-full bg-transparent",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20
          }}
          onMouseDown={handlePanStart}
        />
        <SliderPrimitive.Thumb
          className="block h-4 w-4 rounded-full border-2 border-blue-500 bg-white focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75 disabled:pointer-events-none disabled:opacity-50"
          style={{ zIndex: 30 }}
          aria-label="Left handle"
        />
        <SliderPrimitive.Thumb
          className="block h-4 w-4 rounded-full border-2 border-blue-500 bg-white focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75 disabled:pointer-events-none disabled:opacity-50"
          style={{ zIndex: 30 }}
          aria-label="Right handle"
        />
      </SliderPrimitive.Root>
    </div>
  );
} 