import { CircleHelp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PageHelpProps {
    text: string;
}

export function PageHelp({ text }: PageHelpProps) {
    if (!text) return null;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button aria-label="Ajuda" className="text-muted-foreground hover:text-foreground transition-colors">
                    <CircleHelp className="size-4" />
                </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-sm">{text}</TooltipContent>
        </Tooltip>
    );
}
