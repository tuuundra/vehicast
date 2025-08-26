import { useState, useEffect, RefObject } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

interface MouseVector {
  position: MousePosition;
  vector: MousePosition;
}

export function useMouseVector(ref: RefObject<HTMLDivElement | null>): MouseVector {
  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [vector, setVector] = useState<MousePosition>({ x: 0, y: 0 });
  const [prevPosition, setPrevPosition] = useState<MousePosition>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;
      
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setPosition({ x, y });
      setVector({
        x: x - prevPosition.x,
        y: y - prevPosition.y
      });
      setPrevPosition({ x, y });
    };

    const element = ref.current;
    if (element) {
      element.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (element) {
        element.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [ref, prevPosition]);

  return { position, vector };
} 