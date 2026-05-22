import { AutorList, type AutorItem } from '@/components/AutorList';
import { CreatableSelect, type SelectOption } from '@/components/CreatableSelect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { Check, X } from 'lucide-react';
import { useRef, useState } from 'react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface PublicacaoFormData {
    titulo: string;
    ano: string;
    tipo_publicacao_id: number | null;
    forma_apresentacao_id: number | null;
    doi: string;
    isbn: string;
    link: string;
    volume: string;
    numero: string;
    pagina: string;
    local_publicacao_id: number | null;
    qualis_capes_id: number | null;
    tipo_instituicao_id: number | null;
    turma_id: number | null;
    eixo_tematico_id: number | null;
    segmento_educacional_id: number | null;
    resumo: string;
    autores: AutorItem[];
    palavras_chave: string[];
    area_ids: number[];
}

interface PublicacaoFormProps {
    initialData?: Partial<PublicacaoFormData>;
    tiposPublicacao: SelectOption[];
    formasApresentacao: SelectOption[];
    locaisPublicacao: SelectOption[];
    qualisCapes: SelectOption[];
    tiposInstituicao: SelectOption[];
    turmas: SelectOption[];
    eixosTematicos: SelectOption[];
    segmentosEducacionais: SelectOption[];
    areas: SelectOption[];
    submitRoute: string;
    submitMethod?: 'post' | 'put' | 'patch';
    cancelHref?: string;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const RESUMO_MAX = 5000;
const RESUMO_WARN = Math.floor(RESUMO_MAX * 0.95);

// ─── Utilitários ─────────────────────────────────────────────────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <fieldset className="rounded-lg border p-4">
            <legend className="px-1 text-sm font-semibold text-foreground">{title}</legend>
            <div className="mt-2 flex flex-col gap-4">{children}</div>
        </fieldset>
    );
}

function Field({
    label,
    required,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <Label className={required ? "after:ml-0.5 after:text-destructive after:content-['*']" : ''}>
                {label}
            </Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

// ─── Componente ──────────────────────────────────────────────────────────────

const defaultData: PublicacaoFormData = {
    titulo: '',
    ano: String(new Date().getFullYear()),
    tipo_publicacao_id: null,
    forma_apresentacao_id: null,
    doi: '',
    isbn: '',
    link: '',
    volume: '',
    numero: '',
    pagina: '',
    local_publicacao_id: null,
    qualis_capes_id: null,
    tipo_instituicao_id: null,
    turma_id: null,
    eixo_tematico_id: null,
    segmento_educacional_id: null,
    resumo: '',
    autores: [],
    palavras_chave: [],
    area_ids: [],
};

export function PublicacaoForm({
    initialData = {},
    tiposPublicacao,
    formasApresentacao,
    locaisPublicacao,
    qualisCapes,
    tiposInstituicao,
    turmas,
    eixosTematicos,
    segmentosEducacionais,
    areas,
    submitRoute,
    submitMethod = 'post',
    cancelHref = '/admin/publicacoes',
}: PublicacaoFormProps) {
    const { data, setData, submit, processing, errors } = useForm<PublicacaoFormData>({
        ...defaultData,
        ...initialData,
    });

    // ─── Palavras-chave com autocomplete ─────────────────────────────────────

    const [palavraInput, setPalavraInput] = useState('');
    const [sugestoesPalavras, setSugestoesPalavras] = useState<{ id: number; texto: string }[]>([]);
    const [palavraPopoverOpen, setPalavraPopoverOpen] = useState(false);
    const palavraDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function buscarPalavrasChave(q: string) {
        if (palavraDebounceRef.current) clearTimeout(palavraDebounceRef.current);
        if (q.trim().length < 2) {
            setSugestoesPalavras([]);
            setPalavraPopoverOpen(false);
            return;
        }
        palavraDebounceRef.current = setTimeout(async () => {
            const res = await fetch(`/admin/palavras-chave/busca?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const found: { id: number; texto: string }[] = await res.json();
                setSugestoesPalavras(found);
                if (found.length > 0) setPalavraPopoverOpen(true);
            }
        }, 300);
    }

    function handlePalavraInputChange(v: string) {
        setPalavraInput(v);
        buscarPalavrasChave(v);
    }

    function addPalavraChave(texto?: string) {
        const kw = (texto ?? palavraInput).trim();
        if (!kw || data.palavras_chave.includes(kw)) return;
        setData('palavras_chave', [...data.palavras_chave, kw]);
        setPalavraInput('');
        setSugestoesPalavras([]);
        setPalavraPopoverOpen(false);
    }

    function removePalavraChave(kw: string) {
        setData('palavras_chave', data.palavras_chave.filter((p) => p !== kw));
    }

    // ─── Áreas ───────────────────────────────────────────────────────────────

    function toggleArea(areaId: number) {
        const next = data.area_ids.includes(areaId)
            ? data.area_ids.filter((id) => id !== areaId)
            : [...data.area_ids, areaId];
        setData('area_ids', next);
    }

    // ─── Submit ──────────────────────────────────────────────────────────────

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        submit(submitMethod, submitRoute);
    }

    // ─── Contador do resumo ──────────────────────────────────────────────────

    const resumoLen = data.resumo.length;
    const resumoAtLimit = resumoLen >= RESUMO_MAX;
    const resumoNearLimit = !resumoAtLimit && resumoLen >= RESUMO_WARN;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* ─── Dados básicos ─────────────────────────────────── */}
            <FormSection title="Dados básicos">
                <Field label="Título" required error={errors.titulo}>
                    <Input
                        value={data.titulo}
                        onChange={(e) => setData('titulo', e.target.value)}
                        placeholder="Título completo da publicação"
                    />
                </Field>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <Field label="Ano" required error={errors.ano}>
                        <Input
                            type="number"
                            min={1990}
                            max={new Date().getFullYear() + 1}
                            value={data.ano}
                            onChange={(e) => setData('ano', e.target.value)}
                        />
                    </Field>

                    <Field label="Tipo de Publicação" error={errors.tipo_publicacao_id}>
                        <CreatableSelect
                            options={tiposPublicacao}
                            value={data.tipo_publicacao_id}
                            onChange={(v) => setData('tipo_publicacao_id', v)}
                            createRoute="/admin/cadastros/tipos-publicacao/inline"
                            placeholder="Selecionar tipo..."
                        />
                    </Field>

                    <Field label="Forma de Apresentação" error={errors.forma_apresentacao_id}>
                        <CreatableSelect
                            options={formasApresentacao}
                            value={data.forma_apresentacao_id}
                            onChange={(v) => setData('forma_apresentacao_id', v)}
                            createRoute="/admin/cadastros/formas-apresentacao/inline"
                            placeholder="Selecionar forma..."
                        />
                    </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Field label="DOI" error={errors.doi}>
                        <Input
                            value={data.doi}
                            onChange={(e) => setData('doi', e.target.value)}
                            placeholder="10.xxxx/..."
                        />
                    </Field>

                    <Field label="ISBN" error={errors.isbn}>
                        <Input
                            value={data.isbn}
                            onChange={(e) => setData('isbn', e.target.value)}
                            placeholder="978-..."
                        />
                    </Field>
                </div>

                <Field label="Link" error={errors.link}>
                    <Input
                        value={data.link}
                        onChange={(e) => setData('link', e.target.value)}
                        placeholder="https://..."
                        type="url"
                    />
                </Field>
            </FormSection>

            {/* ─── Autores ───────────────────────────────────────── */}
            <FormSection title="Autores">
                <AutorList
                    value={data.autores}
                    onChange={(autores) => setData('autores', autores)}
                />
                {errors.autores && <p className="text-xs text-destructive">{errors.autores}</p>}
            </FormSection>

            {/* ─── Local de publicação ───────────────────────────── */}
            <FormSection title="Local de publicação">
                <Field label="Periódico / Veículo" error={errors.local_publicacao_id}>
                    <CreatableSelect
                        options={locaisPublicacao}
                        value={data.local_publicacao_id}
                        onChange={(v) => setData('local_publicacao_id', v)}
                        createRoute="/admin/cadastros/locais-publicacao/inline"
                        placeholder="Selecionar periódico..."
                    />
                </Field>

                <div className="grid grid-cols-3 gap-4">
                    <Field label="Volume" error={errors.volume}>
                        <Input value={data.volume} onChange={(e) => setData('volume', e.target.value)} />
                    </Field>
                    <Field label="Número" error={errors.numero}>
                        <Input value={data.numero} onChange={(e) => setData('numero', e.target.value)} />
                    </Field>
                    <Field label="Páginas" error={errors.pagina}>
                        <Input value={data.pagina} onChange={(e) => setData('pagina', e.target.value)} placeholder="1-15" />
                    </Field>
                </div>
            </FormSection>

            {/* ─── Classificação ────────────────────────────────── */}
            <FormSection title="Classificação">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <Field label="Qualis CAPES" error={errors.qualis_capes_id}>
                        <CreatableSelect
                            options={qualisCapes}
                            value={data.qualis_capes_id}
                            onChange={(v) => setData('qualis_capes_id', v)}
                            placeholder="Selecionar..."
                        />
                    </Field>

                    <Field label="Tipo de Instituição" error={errors.tipo_instituicao_id}>
                        <CreatableSelect
                            options={tiposInstituicao}
                            value={data.tipo_instituicao_id}
                            onChange={(v) => setData('tipo_instituicao_id', v)}
                            placeholder="Selecionar..."
                        />
                    </Field>

                    <Field label="Turma" error={errors.turma_id}>
                        <CreatableSelect
                            options={turmas}
                            value={data.turma_id}
                            onChange={(v) => setData('turma_id', v)}
                            placeholder="Selecionar..."
                        />
                    </Field>

                    <Field label="Eixo Temático" error={errors.eixo_tematico_id}>
                        <CreatableSelect
                            options={eixosTematicos}
                            value={data.eixo_tematico_id}
                            onChange={(v) => setData('eixo_tematico_id', v)}
                            placeholder="Selecionar..."
                        />
                    </Field>

                    <Field label="Segmento Educacional" error={errors.segmento_educacional_id}>
                        <CreatableSelect
                            options={segmentosEducacionais}
                            value={data.segmento_educacional_id}
                            onChange={(v) => setData('segmento_educacional_id', v)}
                            placeholder="Selecionar..."
                        />
                    </Field>
                </div>
            </FormSection>

            {/* ─── Conteúdo ─────────────────────────────────────── */}
            <FormSection title="Conteúdo">
                <Field label="Resumo" error={errors.resumo}>
                    <Textarea
                        value={data.resumo}
                        onChange={(e) => setData('resumo', e.target.value)}
                        rows={5}
                        placeholder="Resumo da publicação..."
                        maxLength={RESUMO_MAX}
                    />
                    <p
                        className={cn(
                            'self-end rounded px-1.5 py-0.5 text-xs tabular-nums transition-colors',
                            resumoAtLimit
                                ? 'bg-destructive text-destructive-foreground'
                                : resumoNearLimit
                                  ? 'text-destructive'
                                  : 'text-muted-foreground',
                        )}
                    >
                        {resumoLen.toLocaleString('pt-BR')}/{RESUMO_MAX.toLocaleString('pt-BR')} caracteres
                    </p>
                </Field>

                <Field label="Palavras-chave" error={errors.palavras_chave as unknown as string}>
                    <div className="flex gap-2">
                        <Popover open={palavraPopoverOpen} onOpenChange={setPalavraPopoverOpen}>
                            <PopoverTrigger asChild>
                                <div className="flex-1">
                                    <Input
                                        value={palavraInput}
                                        onChange={(e) => handlePalavraInputChange(e.target.value)}
                                        placeholder="Adicionar palavra-chave..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') { e.preventDefault(); addPalavraChave(); }
                                            if (e.key === 'Escape') setPalavraPopoverOpen(false);
                                        }}
                                    />
                                </div>
                            </PopoverTrigger>
                            {sugestoesPalavras.length > 0 && (
                                <PopoverContent className="w-[300px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                                    <Command>
                                        <CommandList>
                                            <CommandGroup heading="Palavras-chave existentes">
                                                {sugestoesPalavras.map((pk) => (
                                                    <CommandItem
                                                        key={pk.id}
                                                        value={pk.texto}
                                                        onSelect={() => addPalavraChave(pk.texto)}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                'mr-2 size-4',
                                                                data.palavras_chave.includes(pk.texto) ? 'opacity-100' : 'opacity-0',
                                                            )}
                                                        />
                                                        {pk.texto}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                            <CommandEmpty>Nenhuma encontrada.</CommandEmpty>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            )}
                        </Popover>
                        <Button type="button" variant="outline" onClick={() => addPalavraChave()}>
                            Adicionar
                        </Button>
                    </div>
                    {data.palavras_chave.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {data.palavras_chave.map((kw) => (
                                <Badge key={kw} variant="secondary" className="gap-1">
                                    {kw}
                                    <button type="button" onClick={() => removePalavraChave(kw)} aria-label={`Remover ${kw}`}>
                                        <X className="size-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </Field>

                <Field label="Áreas do conhecimento" error={errors.area_ids as unknown as string}>
                    <div className="flex flex-wrap gap-2">
                        {areas.map((area) => (
                            <Badge
                                key={area.id}
                                variant={data.area_ids.includes(area.id) ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => toggleArea(area.id)}
                            >
                                {area.nome}
                            </Badge>
                        ))}
                    </div>
                </Field>
            </FormSection>

            {/* ─── Ações ────────────────────────────────────────── */}
            <div className="flex gap-3">
                <Button type="submit" disabled={processing}>
                    {processing ? 'Salvando...' : 'Salvar publicação'}
                </Button>
                <Button type="button" variant="outline" asChild>
                    <a href={cancelHref}>Cancelar</a>
                </Button>
            </div>
        </form>
    );
}
