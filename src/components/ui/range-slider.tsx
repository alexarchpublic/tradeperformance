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
  const [dragStart, setDragStart] = useState<{ x: number; range: [number, number]; handle?: 'left' | 'right' } | null>(null);
  
  const windowSize = value[1] - value[0];

  const handleMouseDown = (e: React.MouseEvent, handle?: 'left' | 'right') => {
    const target = e.target as Element;
    if (target.closest('.handle') || target.closest('.slider-track')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        range: [...value] as [number, number],
        handle
      });
      e.stopPropagation();
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;

    const container = (e.target as Element).closest('.slider-container');
    if (!container) return;

    const dx = e.clientX - dragStart.x;
    const rangePerPixel = (max - min) / container.clientWidth;
    const rangeDelta = dx * rangePerPixel;

    if (dragStart.handle === 'left') {
      // Moving left handle
      let newStart = Math.max(min, Math.min(dragStart.range[0] + rangeDelta, value[1] - step));
      onChange([newStart, value[1]]);
    } else if (dragStart.handle === 'right') {
      // Moving right handle
      let newEnd = Math.max(value[0] + step, Math.min(dragStart.range[1] + rangeDelta, max));
      onChange([value[0], newEnd]);
    } else {
      // Panning the entire range
      let newStart = dragStart.range[0] + rangeDelta;
      let newEnd = dragStart.range[1] + rangeDelta;
      
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
  }, [isDragging, dragStart, min, max, step, windowSize, value, onChange]);

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
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="relative w-full h-2 bg-gray-200 rounded-full slider-track"
        onMouseDown={(e) => handleMouseDown(e)}
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
          className="handle absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-ew-resize -translate-x-1/2 -translate-y-1/4 hover:scale-110 transition-transform"
          style={{ left: `${leftPosition}%` }}
          onMouseDown={(e) => handleMouseDown(e, 'left')}
        />
        {/* Right handle */}
        <div
          className="handle absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-ew-resize -translate-x-1/2 -translate-y-1/4 hover:scale-110 transition-transform"
          style={{ left: `${rightPosition}%` }}
          onMouseDown={(e) => handleMouseDown(e, 'right')}
        />
      </div>
    </div>
  );
} 