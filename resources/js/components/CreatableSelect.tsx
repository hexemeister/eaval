import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface SelectOption {
    id: number;
    nome: string;
}

interface CreatableSelectProps {
    options: SelectOption[];
    value: number | null;
    onChange: (value: number | null) => void;
    placeholder?: string;
    createRoute?: string;
    disabled?: boolean;
    className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeForSearch(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim();
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function CreatableSelect({
    options,
    value,
    onChange,
    placeholder = 'Selecionar...',
    createRoute,
    disabled = false,
    className,
}: CreatableSelectProps) {
    const [open, setOpen]       = useState(false);
    const [query, setQuery]     = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError]     = useState<string | null>(null);
    const inputRef              = useRef<HTMLInputElement>(null);

    const selected = options.find((o) => o.id === value) ?? null;

    const filtered = options.filter((o) =>
        normalizeForSearch(o.nome).includes(normalizeForSearch(query)),
    );

    const queryTrimmed    = query.trim();
    const exactMatch      = options.some(
        (o) => normalizeForSearch(o.nome) === normalizeForSearch(queryTrimmed),
    );
    const canCreate       = !!createRoute && queryTrimmed.length > 0 && !exactMatch;

    useEffect(() => {
        if (open) {
            setQuery('');
            setError(null);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    async function handleCreate() {
        if (!canCreate || creating || !createRoute) return;
        setCreating(true);
        setError(null);

        try {
            const res = await fetch(createRoute, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ value: queryTrimmed }),
            });

            const data = (await res.json()) as { id?: number; value?: string; message?: string };

            if (!res.ok) {
                setError(data.message ?? 'Erro ao criar item.');
                return;
            }

            if (data.id !== undefined) {
                router.reload({ only: [] }); // dispara revalidação de props Inertia
                onChange(data.id);
                setOpen(false);
            }
        } catch {
            setError('Falha na comunicação com o servidor.');
        } finally {
            setCreating(false);
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn('w-full justify-between font-normal', !selected && 'text-muted-foreground', className)}
                >
                    {selected ? selected.nome : placeholder}
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[320px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        ref={inputRef}
                        placeholder={createRoute ? 'Buscar ou criar...' : 'Buscar...'}
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        {filtered.length === 0 && !canCreate && (
                            <CommandEmpty>Nenhum resultado.</CommandEmpty>
                        )}

                        {filtered.length > 0 && (
                            <CommandGroup>
                                {filtered.map((option) => (
                                    <CommandItem
                                        key={option.id}
                                        value={String(option.id)}
                                        onSelect={() => {
                                            onChange(option.id === value ? null : option.id);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn('mr-2 size-4', value === option.id ? 'opacity-100' : 'opacity-0')}
                                        />
                                        {option.nome}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}

                        {canCreate && (
                            <CommandGroup>
                                <CommandItem
                                    value={`__create__${queryTrimmed}`}
                                    onSelect={handleCreate}
                                    disabled={creating}
                                    className="text-primary"
                                >
                                    {creating ? (
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                    ) : (
                                        <Plus className="mr-2 size-4" />
                                    )}
                                    Criar "{queryTrimmed}"
                                </CommandItem>
                            </CommandGroup>
                        )}
                    </CommandList>

                    {error && <p className="px-3 pb-2 text-xs text-destructive">{error}</p>}
                </Command>
            </PopoverContent>
        </Popover>
    );
}
