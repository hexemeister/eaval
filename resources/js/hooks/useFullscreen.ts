import { useCallback, useEffect, useRef, useState } from 'react';

export function useFullscreen<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const toggle = useCallback(() => {
        if (!ref.current) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            ref.current.requestFullscreen();
        }
    }, []);

    return { ref, isFullscreen, toggle };
}
