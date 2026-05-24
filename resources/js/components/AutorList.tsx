import { Button } from '@/components/ui/button';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Loader2, Plus, Trash2, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface AutorItem {
    autor_id: number | null;
    nome: string;
    ordem: number;
}

interface AutorSugestao {
    id: number;
    nome: string;
}

interface AutorListProps {
    value: AutorItem[];
    onChange: (value: AutorItem[]) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeForSearch(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim();
}

async function criarAutorNoServidor(nome: string): Promise<AutorSugestao | null> {
    try {
        const res = await fetch('/admin/autores/inline', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '',
                Accept: 'application/json',
            },
            body: JSON.stringify({ nome }),
        });
        if (!res.ok) return null;
        return (await res.json()) as AutorSugestao;
    } catch {
        return null;
    }
}

// ─── Item arrastável com autocomplete ────────────────────────────────────────

function SortableAutorItem({
    item,
    index,
    excludeIds,
    onSelectExistente,
    onConfirmarNovo,
    onRemove,
}: {
    item: AutorItem;
    index: number;
    excludeIds: number[];
    onSelectExistente: (index: number, autor: AutorSugestao) => void;
    onConfirmarNovo: (index: number, nome: string) => void;
    onRemove: (index: number) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.ordem,
    });

    const [open, setOpen]         = useState(false);
    const [sugestoes, setSugestoes] = useState<AutorSugestao[]>([]);
    const [inputValue, setInputValue] = useState(item.nome);
    const debounceRef             = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setInputValue(item.nome);
    }, [item.nome]);

    function buscarAutores(q: string) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (q.trim().length < 2) {
            setSugestoes([]);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            const params = new URLSearchParams({ q });
            excludeIds.forEach((id) => params.append('exclude[]', String(id)));
            const res = await fetch(`/admin/autores/busca?${params.toString()}`);
            if (res.ok) {
                const data: AutorSugestao[] = await res.json();
                setSugestoes(data);
                if (data.length > 0) setOpen(true);
            }
        }, 300);
    }

    function handleInputChange(v: string) {
        setInputValue(v);
        // Limpa autor_id quando o usuário edita manualmente o nome
        buscarAutores(v);
        if (v.trim().length < 2) setOpen(false);
    }

    function handleSelect(autor: AutorSugestao) {
        setInputValue(autor.nome);
        onSelectExistente(index, autor);
        setSugestoes([]);
        setOpen(false);
    }

    const queryTrimmed = inputValue.trim();
    const exactMatch   = sugestoes.some(
        (s) => normalizeForSearch(s.nome) === normalizeForSearch(queryTrimmed),
    );
    const canCreate = queryTrimmed.length >= 3 && !exactMatch && item.autor_id === null;

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2">
            <button
                type="button"
                className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
                {...attributes}
                {...listeners}
                aria-label="Reordenar autor"
            >
                <GripVertical className="size-4" />
            </button>

            <span className="w-5 text-center text-xs text-muted-foreground">{index + 1}.</span>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <div className="flex-1">
                        <input
                            value={inputValue}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder="Nome do autor"
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') setOpen(false);
                            }}
                        />
                    </div>
                </PopoverTrigger>
                {(sugestoes.length > 0 || canCreate) && (
                    <PopoverContent className="w-[300px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <Command>
                            <CommandList>
                                {sugestoes.length > 0 && (
                                    <CommandGroup heading="Autores cadastrados">
                                        {sugestoes.map((a) => (
                                            <CommandItem key={a.id} value={a.nome} onSelect={() => handleSelect(a)}>
                                                {a.nome}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                                {canCreate && (
                                    <CommandGroup>
                                        <CommandItem
                                            value={`__create__${queryTrimmed}`}
                                            onSelect={() => {
                                                setOpen(false);
                                                onConfirmarNovo(index, queryTrimmed);
                                            }}
                                            className="text-primary"
                                        >
                                            <Plus className="mr-2 size-4" />
                                            Criar "{queryTrimmed}"
                                        </CommandItem>
                                    </CommandGroup>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                )}
            </Popover>

            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onRemove(index)}
                aria-label="Remover autor"
            >
                <Trash2 className="size-4" />
            </Button>
        </div>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function AutorList({ value, onChange }: AutorListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const [confirmOpen, setConfirmOpen]   = useState(false);
    const [pendingIndex, setPendingIndex] = useState<number>(-1);
    const [pendingNome, setPendingNome]   = useState('');
    const [criando, setCriando]           = useState(false);
    const [erroInline, setErroInline]     = useState<string | null>(null);

    // IDs de autores já adicionados (para excluir da busca)
    const excludeIds = value.flatMap((a) => (a.autor_id !== null ? [a.autor_id] : []));

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = value.findIndex((a) => a.ordem === active.id);
        const newIndex = value.findIndex((a) => a.ordem === over.id);
        const reordered = arrayMove(value, oldIndex, newIndex).map((a, i) => ({ ...a, ordem: i + 1 }));
        onChange(reordered);
    }

    function handleSelectExistente(index: number, autor: AutorSugestao) {
        const updated = value.map((a, i) => (i === index ? { ...a, nome: autor.nome, autor_id: autor.id } : a));
        onChange(updated);
    }

    function handleConfirmarNovo(index: number, nome: string) {
        setPendingIndex(index);
        setPendingNome(nome);
        setErroInline(null);
        setConfirmOpen(true);
    }

    async function handleCreateConfirmed() {
        setCriando(true);
        setErroInline(null);
        const autor = await criarAutorNoServidor(pendingNome);
        setCriando(false);

        if (!autor) {
            setErroInline('Não foi possível cadastrar o autor. Tente novamente.');
            return;
        }

        setConfirmOpen(false);
        const updated = value.map((a, i) =>
            i === pendingIndex ? { ...a, nome: autor.nome, autor_id: autor.id } : a,
        );
        onChange(updated);
    }

    function handleRemove(index: number) {
        const updated = value
            .filter((_, i) => i !== index)
            .map((a, i) => ({ ...a, ordem: i + 1 }));
        onChange(updated);
    }

    function handleAdd() {
        const nextOrdem = value.length + 1;
        onChange([...value, { autor_id: null, nome: '', ordem: nextOrdem }]);
    }

    return (
        <>
            <div className="flex flex-col gap-2">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={value.map((a) => a.ordem)} strategy={verticalListSortingStrategy}>
                        {value.map((item, index) => (
                            <SortableAutorItem
                                key={item.ordem}
                                item={item}
                                index={index}
                                excludeIds={excludeIds}
                                onSelectExistente={handleSelectExistente}
                                onConfirmarNovo={handleConfirmarNovo}
                                onRemove={handleRemove}
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="self-start">
                    <UserPlus className="mr-2 size-4" />
                    Adicionar autor
                </Button>
            </div>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar novo autor</DialogTitle>
                        <DialogDescription>
                            Você está prestes a cadastrar o autor:{' '}
                            <strong>"{pendingNome}"</strong>.
                            <br />
                            Verifique se ele já não existe com outro nome ou grafia para evitar duplicatas.
                        </DialogDescription>
                    </DialogHeader>
                    {erroInline && <p className="text-sm text-destructive">{erroInline}</p>}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={criando}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateConfirmed} disabled={criando}>
                            {criando ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                            Cadastrar autor
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
