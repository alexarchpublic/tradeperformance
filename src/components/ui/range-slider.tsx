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

interface TrackProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: [number, number];
  min: number;
  max: number;
  onRangeChange: (value: [number, number]) => void;
}

const Track = React.forwardRef<HTMLSpanElement, TrackProps>(
  ({ className, value, min, max, onRangeChange, ...props }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const trackRef = React.useRef<HTMLSpanElement>(null);
    const dragStartRef = React.useRef<{
      x: number;
      rangeStart: number;
      rangeEnd: number;
    } | null>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
      // Only handle clicks on the track or range, not the thumbs
      const target = e.target as HTMLElement;
      if (target.getAttribute('role') === 'slider') {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const trackRect = trackRef.current?.getBoundingClientRect();
      if (!trackRect) return;

      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        rangeStart: value[0],
        rangeEnd: value[1]
      };

      document.body.style.userSelect = 'none';
    };

    const handleMouseMove = React.useCallback((e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current || !trackRef.current) return;

      const trackRect = trackRef.current.getBoundingClientRect();
      const dx = e.clientX - dragStartRef.current.x;
      const trackWidth = trackRect.width;
      const unitsPerPixel = (max - min) / trackWidth;
      const deltaUnits = dx * unitsPerPixel;

      const rangeSize = dragStartRef.current.rangeEnd - dragStartRef.current.rangeStart;
      let newStart = dragStartRef.current.rangeStart + deltaUnits;
      let newEnd = dragStartRef.current.rangeEnd + deltaUnits;

      // Clamp to bounds
      if (newStart < min) {
        newStart = min;
        newEnd = min + rangeSize;
      }
      if (newEnd > max) {
        newEnd = max;
        newStart = max - rangeSize;
      }

      onRangeChange([newStart, newEnd]);
    }, [isDragging, min, max, onRangeChange]);

    const handleMouseUp = React.useCallback(() => {
      setIsDragging(false);
      dragStartRef.current = null;
      document.body.style.userSelect = '';
    }, []);

    React.useEffect(() => {
      if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      }
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
      <span
        ref={(el) => {
          // Merge refs
          if (typeof ref === 'function') ref(el);
          else if (ref) ref.current = el;
          trackRef.current = el;
        }}
        className={cn(
          "relative h-2 w-full grow rounded-full bg-gray-200",
          isDragging && "cursor-grabbing",
          !isDragging && "cursor-grab",
          className
        )}
        onMouseDown={handleMouseDown}
        {...props}
      >
        <span
          className="absolute h-full rounded-full bg-blue-500"
          style={{
            left: `${((value[0] - min) / (max - min)) * 100}%`,
            width: `${((value[1] - value[0]) / (max - min)) * 100}%`
          }}
        />
      </span>
    );
  }
);

Track.displayName = "Track";

export function RangeSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 0.1,
  className = "",
}: RangeSliderProps) {
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
        <Track
          value={value}
          min={min}
          max={max}
          onRangeChange={onChange}
        />
        <SliderPrimitive.Thumb
          className="block h-4 w-4 rounded-full border-2 border-blue-500 bg-white focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75 disabled:pointer-events-none disabled:opacity-50"
          aria-label="Left handle"
        />
        <SliderPrimitive.Thumb
          className="block h-4 w-4 rounded-full border-2 border-blue-500 bg-white focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75 disabled:pointer-events-none disabled:opacity-50"
          aria-label="Right handle"
        />
      </SliderPrimitive.Root>
    </div>
  );
} 