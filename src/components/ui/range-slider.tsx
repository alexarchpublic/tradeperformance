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

/**
 * Our custom Track for visually displaying (and panning) the selected range.
 */
interface TrackProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: [number, number];
  min: number;
  max: number;
  onRangeChange: (value: [number, number]) => void;
}

// Track component: Handles panning logic when the user drags the track (away from thumbs).
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
      // If the user clicked near a thumb, our onPointerDownCapture in RangeSlider
      // will NOT call e.stopPropagation(). That means Radix handles the event.
      // If the user actually got here, it means they're not near a thumb (we're panning).

      e.preventDefault();
      e.stopPropagation();

      const trackRect = trackRef.current?.getBoundingClientRect();
      if (!trackRect) return;

      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        rangeStart: value[0],
        rangeEnd: value[1],
      };

      document.body.style.userSelect = "none";
    };

    const handleMouseMove = React.useCallback(
      (e: MouseEvent) => {
        if (!isDragging || !dragStartRef.current || !trackRef.current) return;

        const trackRect = trackRef.current.getBoundingClientRect();
        const dx = e.clientX - dragStartRef.current.x;
        const trackWidth = trackRect.width;
        const unitsPerPixel = (max - min) / trackWidth;
        const deltaUnits = dx * unitsPerPixel;

        const rangeSize =
          dragStartRef.current.rangeEnd - dragStartRef.current.rangeStart;
        let newStart = dragStartRef.current.rangeStart + deltaUnits;
        let newEnd = dragStartRef.current.rangeEnd + deltaUnits;

        // Clamp to [min, max] bounds
        if (newStart < min) {
          newStart = min;
          newEnd = min + rangeSize;
        }
        if (newEnd > max) {
          newEnd = max;
          newStart = max - rangeSize;
        }

        onRangeChange([newStart, newEnd]);
      },
      [isDragging, min, max, onRangeChange]
    );

    const handleMouseUp = React.useCallback(() => {
      setIsDragging(false);
      dragStartRef.current = null;
      document.body.style.userSelect = "";
    }, []);

    React.useEffect(() => {
      if (isDragging) {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
      }
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
      <span
        ref={(el) => {
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el;
          trackRef.current = el;
        }}
        className={cn(
          "relative h-2 w-full grow rounded-full bg-gray-200",
          isDragging ? "cursor-grabbing" : "cursor-grab",
          className
        )}
        onMouseDown={handleMouseDown}
        {...props}
      >
        {/* The "filled" portion of the track representing the selected range */}
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
  // Keep thumbs from crossing each other
  const handleValueChange = (newValue: [number, number]) => {
    const minDistance = step * 2; // Enforce a minimum distance
    if (newValue[1] - newValue[0] < minDistance) {
      // If dragging left thumb
      if (newValue[0] !== value[0]) {
        newValue[0] = Math.min(newValue[0], value[1] - minDistance);
      }
      // If dragging right thumb
      else if (newValue[1] !== value[1]) {
        newValue[1] = Math.max(newValue[1], value[0] + minDistance);
      }
    }
    onChange(newValue);
  };

  /**
   * Intercept the pointerDown on the Radix Slider root *before* Radix processes it.
   * If the click is not near a thumb => stopPropagation so that Radix won't move the thumb.
   * Our <Track> component will then get the event and handle "panning".
   */
  const handleRootPointerDownCapture = (
    e: React.PointerEvent<HTMLSpanElement>
  ) => {
    const thumbElements = document.querySelectorAll('[role="slider"]');
    const clickX = e.clientX;

    // Check if pointer is within ~20px of a thumb center
    const isNearAnyThumb = Array.from(thumbElements).some((thumb) => {
      const rect = thumb.getBoundingClientRect();
      const thumbCenterX = rect.left + rect.width / 2;
      return Math.abs(clickX - thumbCenterX) < 20;
    });

    // If NOT near a thumb, block Radix's root-level logic
    if (!isNearAnyThumb) {
      e.stopPropagation();
    }
  };

  return (
    <div
      className={cn("slider-container relative px-4", className)}
      onClick={(e) => e.stopPropagation()} // block clicks from bubbling
    >
      <SliderPrimitive.Root
        className="relative flex w-full touch-none select-none items-center"
        value={value}
        onValueChange={handleValueChange}
        min={min}
        max={max}
        step={step}
        minStepsBetweenThumbs={1}
        // The crucial event capture that kills Radix's track-click:
        onPointerDownCapture={handleRootPointerDownCapture}
      >
        {/* Our custom track handles panning. */}
        <Track
          value={value}
          min={min}
          max={max}
          onRangeChange={handleValueChange}
        />

        {/* Thumbs remain fully draggable via Radix built-in logic */}
        <SliderPrimitive.Thumb
          className="block h-4 w-4 rounded-full border-2 border-blue-500 bg-white
                     hover:cursor-ew-resize focus:outline-none focus-visible:ring 
                     focus-visible:ring-blue-500 focus-visible:ring-opacity-75 
                     disabled:pointer-events-none disabled:opacity-50"
          aria-label="Left handle"
        />
        <SliderPrimitive.Thumb
          className="block h-4 w-4 rounded-full border-2 border-blue-500 bg-white
                     hover:cursor-ew-resize focus:outline-none focus-visible:ring
                     focus-visible:ring-blue-500 focus-visible:ring-opacity-75
                     disabled:pointer-events-none disabled:opacity-50"
          aria-label="Right handle"
        />
      </SliderPrimitive.Root>
    </div>
  );
} 