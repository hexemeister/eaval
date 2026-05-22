import { Button } from '@/components/ui/button';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
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
import { GripVertical, Trash2, UserPlus } from 'lucide-react';
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

// ─── Item arrastável com autocomplete ────────────────────────────────────────

function SortableAutorItem({
    item,
    index,
    onChangeName,
    onSelectExistente,
    onRemove,
}: {
    item: AutorItem;
    index: number;
    onChangeName: (index: number, nome: string) => void;
    onSelectExistente: (index: number, autor: AutorSugestao) => void;
    onRemove: (index: number) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.ordem,
    });

    const [open, setOpen] = useState(false);
    const [sugestoes, setSugestoes] = useState<AutorSugestao[]>([]);
    const [inputValue, setInputValue] = useState(item.nome);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
            const res = await fetch(`/admin/autores/busca?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data: AutorSugestao[] = await res.json();
                setSugestoes(data);
                if (data.length > 0) setOpen(true);
            }
        }, 300);
    }

    function handleInputChange(v: string) {
        setInputValue(v);
        onChangeName(index, v);
        buscarAutores(v);
        if (v.trim().length < 2) setOpen(false);
    }

    function handleSelect(autor: AutorSugestao) {
        setInputValue(autor.nome);
        onSelectExistente(index, autor);
        setSugestoes([]);
        setOpen(false);
    }

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
                {sugestoes.length > 0 && (
                    <PopoverContent className="w-[300px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <Command>
                            <CommandList>
                                <CommandGroup heading="Autores cadastrados">
                                    {sugestoes.map((a) => (
                                        <CommandItem key={a.id} value={a.nome} onSelect={() => handleSelect(a)}>
                                            {a.nome}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
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

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = value.findIndex((a) => a.ordem === active.id);
        const newIndex = value.findIndex((a) => a.ordem === over.id);
        const reordered = arrayMove(value, oldIndex, newIndex).map((a, i) => ({ ...a, ordem: i + 1 }));
        onChange(reordered);
    }

    function handleChangeName(index: number, nome: string) {
        const updated = value.map((a, i) => (i === index ? { ...a, nome, autor_id: null } : a));
        onChange(updated);
    }

    function handleSelectExistente(index: number, autor: AutorSugestao) {
        const updated = value.map((a, i) => (i === index ? { ...a, nome: autor.nome, autor_id: autor.id } : a));
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
        <div className="flex flex-col gap-2">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={value.map((a) => a.ordem)} strategy={verticalListSortingStrategy}>
                    {value.map((item, index) => (
                        <SortableAutorItem
                            key={item.ordem}
                            item={item}
                            index={index}
                            onChangeName={handleChangeName}
                            onSelectExistente={handleSelectExistente}
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
    );
}
