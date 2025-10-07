// resources/js/hooks/useSmartPosition.js
import { useEffect, useRef, useState } from 'react';

export function useSmartPosition() {
  const triggerRef = useRef(null);
  const [position, setPosition] = useState('right'); // 'left' ou 'right'

  useEffect(() => {
    const updatePosition = () => {
      if (!triggerRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const spaceRight = window.innerWidth - triggerRect.right;
      const spaceLeft = triggerRect.left;

      // Largura estimada do submenu (220px + margem de segurança)
      const submenuWidth = 240;

      if (spaceRight < submenuWidth && spaceLeft > submenuWidth) {
        setPosition('left');
      } else {
        setPosition('right');
      }
    };

    // Atualiza na montagem e em redimensionamentos
    updatePosition();
    window.addEventListener('resize', updatePosition);

    // Observa mudanças no elemento (ex: layout shift)
    const resizeObserver = new ResizeObserver(updatePosition);
    if (triggerRef.current) {
      resizeObserver.observe(triggerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updatePosition);
      resizeObserver.disconnect();
    };
  }, []);

  return { triggerRef, position };
}