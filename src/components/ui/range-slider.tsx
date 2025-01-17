import React, { useRef, useCallback } from 'react';

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
  // Use refs instead of state for drag tracking to avoid re-renders
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    range: [number, number];
    handle?: 'left' | 'right';
    containerWidth?: number;
    rangePerPixel?: number;
  }>({
    active: false,
    startX: 0,
    range: [0, 0]
  });
  
  const windowSize = value[1] - value[0];

  const handleMouseDown = (e: React.MouseEvent, handle?: 'left' | 'right') => {
    const target = e.target as Element;
    if (target.closest('.handle') || target.closest('.slider-track')) {
      const container = target.closest('.slider-container');
      if (!container) return;

      // Pre-calculate values needed for drag operations
      dragRef.current = {
        active: true,
        startX: e.clientX,
        range: [...value] as [number, number],
        handle,
        containerWidth: container.clientWidth,
        rangePerPixel: (max - min) / container.clientWidth
      };
      
      e.stopPropagation();
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const drag = dragRef.current;
    if (!drag.active || !drag.containerWidth || !drag.rangePerPixel) return;

    const dx = e.clientX - drag.startX;
    const rangeDelta = dx * drag.rangePerPixel;

    if (drag.handle === 'left') {
      // Moving left handle
      const newStart = Math.max(min, Math.min(drag.range[0] + rangeDelta, value[1] - step));
      onChange([newStart, value[1]]);
    } else if (drag.handle === 'right') {
      // Moving right handle
      const newEnd = Math.max(value[0] + step, Math.min(drag.range[1] + rangeDelta, max));
      onChange([value[0], newEnd]);
    } else {
      // Panning the entire range
      let newStart = drag.range[0] + rangeDelta;
      let newEnd = drag.range[1] + rangeDelta;
      
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
  }, [min, max, step, windowSize, value, onChange]);

  const handleMouseUp = useCallback(() => {
    dragRef.current.active = false;
  }, []);

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
          className={`absolute h-full bg-blue-500 rounded-full
            ${dragRef.current.active ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{
            left: `${leftPosition}%`,
            width: `${width}%`,
            willChange: 'left, width'
          }}
        />
        {/* Left handle */}
        <div
          className="handle absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-ew-resize -translate-x-1/2 -translate-y-1/4"
          style={{ 
            left: `${leftPosition}%`,
            willChange: 'left'
          }}
          onMouseDown={(e) => handleMouseDown(e, 'left')}
        />
        {/* Right handle */}
        <div
          className="handle absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-ew-resize -translate-x-1/2 -translate-y-1/4"
          style={{ 
            left: `${rightPosition}%`,
            willChange: 'left'
          }}
          onMouseDown={(e) => handleMouseDown(e, 'right')}
        />
      </div>
    </div>
  );
} 