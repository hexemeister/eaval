import { useEffect, useRef, useState } from 'react';

export function useMouseTracker() {
  const [mouseInside, setMouseInside] = useState(new Set());

  const addRef = (key) => {
    const ref = useRef(null);
    useEffect(() => {
      const el = ref.current;
      if (!el) return;

      const handleMouseEnter = () => setMouseInside(prev => new Set([...prev, key]));
      const handleMouseLeave = () => setMouseInside(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });

      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      };
    }, [key]);

    return ref;
  };

  const isInside = (key) => mouseInside.has(key);

  return { addRef, isInside };
}