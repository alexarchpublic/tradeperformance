import React, { useState, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';

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
  className = ''
}: RangeSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; range: [number, number] } | null>(null);
  
  const windowSize = value[1] - value[0];

  const handleZoomChange = (newRange: [number, number]) => {
    onChange(newRange);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof Element && e.target.closest('.slider-track')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        range: [...value] as [number, number]
      });
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && dragStart && e.target instanceof Element) {
      const container = e.target.closest('.slider-container');
      if (!container) return;

      const dx = e.clientX - dragStart.x;
      const rangePerPixel = (max - min) / container.clientWidth;
      const rangeDelta = dx * rangePerPixel;
      
      let newStart = dragStart.range[0] + rangeDelta;
      let newEnd = dragStart.range[1] + rangeDelta;
      
      // Prevent dragging beyond bounds
      if (newStart < min) {
        newStart = min;
        newEnd = min + windowSize;
      }
      if (newEnd > max) {
        newEnd = max;
        newStart = max - windowSize;
      }
      
      onChange([newStart, newEnd]);
    }
  }, [isDragging, dragStart, windowSize, min, max, onChange]);

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // Calculate positions for handles and selection
  const leftPosition = ((value[0] - min) / (max - min)) * 100;
  const rightPosition = ((value[1] - min) / (max - min)) * 100;
  const width = rightPosition - leftPosition;

  return (
    <div 
      className={`px-4 slider-container ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="relative w-full h-2 bg-gray-200 rounded-full slider-track"
      >
        {/* Selection area */}
        <div
          className={`absolute h-full bg-blue-500 rounded-full transition-all duration-150
            ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{
            left: `${leftPosition}%`,
            width: `${width}%`
          }}
        />
        {/* Left handle */}
        <div
          className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-ew-resize -translate-x-1/2 -translate-y-1/4"
          style={{ left: `${leftPosition}%` }}
        />
        {/* Right handle */}
        <div
          className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-ew-resize -translate-x-1/2 -translate-y-1/4"
          style={{ left: `${rightPosition}%` }}
        />
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={handleZoomChange}
        className="w-full absolute top-0 opacity-0"
      />
    </div>
  );
} 