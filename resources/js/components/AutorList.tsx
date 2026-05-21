import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface AutorItem {
    autor_id: number | null;
    nome: string;
    ordem: number;
}

interface AutorListProps {
    value: AutorItem[];
    onChange: (value: AutorItem[]) => void;
}

// ─── Item arrastável ─────────────────────────────────────────────────────────

function SortableAutorItem({
    item,
    index,
    onChangeName,
    onRemove,
}: {
    item: AutorItem;
    index: number;
    onChangeName: (index: number, nome: string) => void;
    onRemove: (index: number) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.ordem,
    });

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

            <Input
                value={item.nome}
                onChange={(e) => onChangeName(index, e.target.value)}
                placeholder="Nome do autor"
                className="flex-1"
            />

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
        const updated = value.map((a, i) => (i === index ? { ...a, nome } : a));
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
