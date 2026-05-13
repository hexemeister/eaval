import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

interface ThemeContextType {
    appearance: Appearance;
    updateAppearance: (mode: Appearance) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const prefersDark = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') return;
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const applyTheme = (appearance: Appearance) => {
    if (typeof document === 'undefined') return;
    const isDark = appearance === 'dark' || (appearance === 'system' && prefersDark());
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [appearance, setAppearance] = useState<Appearance>('system');

    useEffect(() => {
        const savedAppearance = localStorage.getItem('appearance') as Appearance | null;
        if (savedAppearance) {
            setAppearance(savedAppearance);
            applyTheme(savedAppearance);
        } else {
            applyTheme('system');
        }

        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            const current = localStorage.getItem('appearance') as Appearance | null;
            if (!current || current === 'system') {
                applyTheme('system');
            }
        };

        mq.addEventListener('change', handleChange);
        return () => mq.removeEventListener('change', handleChange);
    }, []);

    const updateAppearance = useCallback((mode: Appearance) => {
        const apply = () => {
            setAppearance(mode);
            localStorage.setItem('appearance', mode);
            setCookie('appearance', mode);
            applyTheme(mode);
        };

        if (typeof document !== 'undefined' && 'startViewTransition' in document) {
            document.startViewTransition(() => {
                apply();
            });
        } else {
            apply();
        }
    }, []);

    return <ThemeContext.Provider value={{ appearance, updateAppearance }}>{children}</ThemeContext.Provider>;
}

export function useAppearance() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        return {
            appearance: 'system' as Appearance,
            updateAppearance: () => {
                console.warn('updateAppearance called outside of ThemeProvider');
            },
        };
    }
    return context;
}

export function initializeTheme() {
    if (typeof window === 'undefined') return;
    const savedAppearance = (localStorage.getItem('appearance') as Appearance) || 'system';
    applyTheme(savedAppearance);
}
