import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import { Monitor, Moon, Sun } from 'lucide-react';

export function ThemeSwitcher() {
    const { appearance, updateAppearance } = useAppearance();

    const nextTheme = () => {
        if (appearance === 'light') return 'dark';
        if (appearance === 'dark') return 'system';
        return 'light';
    };

    const getIcon = () => {
        if (appearance === 'light') return <Sun className="h-[1.2rem] w-[1.2rem]" />;
        if (appearance === 'dark') return <Moon className="h-[1.2rem] w-[1.2rem]" />;
        return <Monitor className="h-[1.2rem] w-[1.2rem]" />;
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => updateAppearance(nextTheme())}
            title={`Alternar para tema ${nextTheme()}`}
            aria-label={`Alternar para tema ${nextTheme()}`}
        >
            {getIcon()}
        </Button>
    );
}
