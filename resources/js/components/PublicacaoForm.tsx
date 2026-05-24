import { AutorList, type AutorItem } from '@/components/AutorList';
import { CreatableSelect, type SelectOption } from '@/components/CreatableSelect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface LocalPublicacaoOption {
    id: number;
    nome: string;
    nome_abreviado: string | null;
    issn: string | null;
    estado: string | null;
}

export interface EstadoOption {
    sigla: string;
    nome: string;
}

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
    locaisPublicacao: LocalPublicacaoOption[];
    estados: EstadoOption[];
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

interface CreateLocalForm {
    nome: string;
    nome_abreviado: string;
    issn: string;
    estado: string;
}

const EMPTY_CREATE_LOCAL: CreateLocalForm = { nome: '', nome_abreviado: '', issn: '', estado: '' };

// ─── Constantes ──────────────────────────────────────────────────────────────

const TITULO_MIN = 10;
const RESUMO_MIN = 50;
const RESUMO_MAX = 5000;
const RESUMO_WARN = Math.floor(RESUMO_MAX * 0.95);

// ─── Utilitários ─────────────────────────────────────────────────────────────

function normalize(text: string): string {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function csrfToken(): string {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '';
}

function FormSection({ title, required, children }: { title: string; required?: boolean; children: React.ReactNode }) {
    return (
        <fieldset className="rounded-lg border p-4">
            <legend className="px-1 text-sm font-semibold text-foreground">
                {title}
                {required && <span className="ml-0.5 text-destructive">*</span>}
            </legend>
            <div className="mt-2 flex flex-col gap-4">{children}</div>
        </fieldset>
    );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <Label className={required ? "after:ml-0.5 after:text-destructive after:content-['*']" : ''}>{label}</Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

async function criarPalavraChaveNoServidor(texto: string): Promise<{ id: number; texto: string } | null> {
    try {
        const res = await fetch('/admin/palavras-chave/inline', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '',
                Accept: 'application/json',
            },
            body: JSON.stringify({ texto }),
        });
        if (!res.ok) return null;
        return (await res.json()) as { id: number; texto: string };
    } catch {
        return null;
    }
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
    estados,
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

    // ─── Local de publicação ─────────────────────────────────────────────────

    const [localOptions, setLocalOptions] = useState<LocalPublicacaoOption[]>(locaisPublicacao);
    const [filterEstado, setFilterEstado]  = useState('');
    const [estadoOpen,   setEstadoOpen]    = useState(false);

    const locaisFiltrados = useMemo(
        () => (filterEstado ? localOptions.filter((o) => o.estado === filterEstado) : localOptions),
        [localOptions, filterEstado],
    );

    const nomeOptions      = useMemo(() => locaisFiltrados.map((o) => ({ id: o.id, nome: o.nome })), [locaisFiltrados]);
    const nomeAbrevOptions = useMemo(() => locaisFiltrados.filter((o) => o.nome_abreviado).map((o) => ({ id: o.id, nome: o.nome_abreviado! })), [locaisFiltrados]);
    const issnOptions      = useMemo(() => locaisFiltrados.filter((o) => o.issn).map((o) => ({ id: o.id, nome: o.issn! })), [locaisFiltrados]);

    function handleLocalChange(v: number | null) {
        setData('local_publicacao_id', v);
        if (v !== null) {
            const local = localOptions.find((o) => o.id === v);
            setFilterEstado(local?.estado ?? '');
        }
    }

    function handleEstadoChange(v: string) {
        const novo = v === '__todos__' ? '' : v;
        setFilterEstado(novo);
        if (data.local_publicacao_id !== null) setData('local_publicacao_id', null);
    }

    // ─── Criação inline de periódico ─────────────────────────────────────────

    const [createLocalOpen,        setCreateLocalOpen]        = useState(false);
    const [createLocalForm,        setCreateLocalForm]        = useState<CreateLocalForm>(EMPTY_CREATE_LOCAL);
    const [createLocalConfirmOpen, setCreateLocalConfirmOpen] = useState(false);
    const [createLocalSaving,      setCreateLocalSaving]      = useState(false);
    const [createLocalError,       setCreateLocalError]       = useState('');

    const matchingLocais = useMemo(() => {
        const hasNome   = createLocalForm.nome.trim().length >= 2;
        const hasIssn   = createLocalForm.issn.trim().length >= 2;
        const hasEstado = createLocalForm.estado !== '';
        if (!hasNome && !hasIssn && !hasEstado) return [];
        return localOptions
            .filter((o) => {
                if (hasEstado && o.estado !== createLocalForm.estado) return false;
                if (hasIssn && !(o.issn ?? '').toLowerCase().includes(createLocalForm.issn.toLowerCase())) return false;
                if (hasNome) {
                    const q = normalize(createLocalForm.nome);
                    if (!normalize(o.nome).includes(q) && !normalize(o.nome_abreviado ?? '').includes(q)) return false;
                }
                return true;
            })
            .slice(0, 8);
    }, [localOptions, createLocalForm.nome, createLocalForm.issn, createLocalForm.estado]);

    function openCreateLocalDialog() {
        setCreateLocalForm(EMPTY_CREATE_LOCAL);
        setCreateLocalError('');
        setCreateLocalOpen(true);
    }

    async function handleCreateLocalConfirm() {
        setCreateLocalSaving(true);
        setCreateLocalError('');
        try {
            const res = await fetch('/admin/locais-publicacao/inline', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    nome:           createLocalForm.nome.trim(),
                    nome_abreviado: createLocalForm.nome_abreviado.trim() || null,
                    issn:           createLocalForm.issn.trim() || null,
                    estado:         createLocalForm.estado || null,
                }),
            });
            if (res.ok) {
                const created = (await res.json()) as LocalPublicacaoOption;
                setLocalOptions((prev) => [...prev, created].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
                setData('local_publicacao_id', created.id);
                setFilterEstado(created.estado ?? '');
                setCreateLocalConfirmOpen(false);
                setCreateLocalOpen(false);
            } else {
                const body = (await res.json()) as { message?: string };
                setCreateLocalError(body.message ?? 'Erro ao criar periódico.');
                setCreateLocalConfirmOpen(false);
            }
        } finally {
            setCreateLocalSaving(false);
        }
    }

    // ─── Palavras-chave ──────────────────────────────────────────────────────

    const [palavraInput, setPalavraInput]               = useState('');
    const [sugestoesPalavras, setSugestoesPalavras]     = useState<{ id: number; texto: string }[]>([]);
    const [palavraPopoverOpen, setPalavraPopoverOpen]   = useState(false);
    const [pkConfirmOpen, setPkConfirmOpen]             = useState(false);
    const [pkPendingTexto, setPkPendingTexto]           = useState('');
    const [pkCriando, setPkCriando]                     = useState(false);
    const palavraDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function buscarPalavrasChave(q: string) {
        if (palavraDebounceRef.current) clearTimeout(palavraDebounceRef.current);
        if (q.trim().length < 2) { setSugestoesPalavras([]); setPalavraPopoverOpen(false); return; }
        palavraDebounceRef.current = setTimeout(async () => {
            const res = await fetch(`/admin/palavras-chave/busca?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const found: { id: number; texto: string }[] = await res.json();
                setSugestoesPalavras(found);
                if (found.length > 0) setPalavraPopoverOpen(true);
            }
        }, 300);
    }

    function handlePalavraInputChange(v: string) { setPalavraInput(v); buscarPalavrasChave(v); }

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

    function handleAdicionarPalavra() {
        const kw = palavraInput.trim();
        if (!kw || data.palavras_chave.includes(kw)) return;
        const existeNaSugestao = sugestoesPalavras.some((s) => s.texto.toLowerCase() === kw.toLowerCase());
        if (existeNaSugestao) { addPalavraChave(kw); return; }
        setPkPendingTexto(kw);
        setPkConfirmOpen(true);
    }

    async function handlePkCreateConfirmed() {
        setPkCriando(true);
        const pk = await criarPalavraChaveNoServidor(pkPendingTexto);
        setPkCriando(false);
        if (!pk) return;
        setPkConfirmOpen(false);
        addPalavraChave(pk.texto);
    }

    // ─── Áreas ───────────────────────────────────────────────────────────────

    function toggleArea(areaId: number) {
        const next = data.area_ids.includes(areaId) ? data.area_ids.filter((id) => id !== areaId) : [...data.area_ids, areaId];
        setData('area_ids', next);
    }

    // ─── Submit ──────────────────────────────────────────────────────────────

    function handleSubmit(e: React.FormEvent) { e.preventDefault(); submit(submitMethod, submitRoute); }

    // ─── Contadores ──────────────────────────────────────────────────────────

    const tituloLen       = data.titulo.length;
    const tituloAbaixoMin = tituloLen > 0 && tituloLen < TITULO_MIN;
    const resumoLen       = data.resumo.length;
    const resumoAbaixoMin = resumoLen > 0 && resumoLen < RESUMO_MIN;
    const resumoAtLimit   = resumoLen >= RESUMO_MAX;
    const resumoNearLimit = !resumoAtLimit && resumoLen >= RESUMO_WARN;

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* ─── Dados básicos ─────────────────────────────────── */}
            <FormSection title="Dados básicos">
                <Field label="Título" required error={errors.titulo}>
                    <Input value={data.titulo} onChange={(e) => setData('titulo', e.target.value)} placeholder="Título completo da publicação" />
                    <p className={cn('self-start text-xs tabular-nums transition-colors', tituloAbaixoMin ? 'text-destructive' : 'text-muted-foreground')}>
                        {tituloLen}/{TITULO_MIN} mín
                    </p>
                </Field>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <Field label="Ano" required error={errors.ano}>
                        <Input type="number" min={1990} max={new Date().getFullYear() + 1} value={data.ano} onChange={(e) => setData('ano', e.target.value)} />
                    </Field>
                    <Field label="Tipo de Publicação" error={errors.tipo_publicacao_id}>
                        <CreatableSelect options={tiposPublicacao} value={data.tipo_publicacao_id} onChange={(v) => setData('tipo_publicacao_id', v)} createRoute="/admin/cadastros/tipos-publicacao/inline" placeholder="Selecionar tipo..." />
                    </Field>
                    <Field label="Forma de Apresentação" error={errors.forma_apresentacao_id}>
                        <CreatableSelect options={formasApresentacao} value={data.forma_apresentacao_id} onChange={(v) => setData('forma_apresentacao_id', v)} createRoute="/admin/cadastros/formas-apresentacao/inline" placeholder="Selecionar forma..." />
                    </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Field label="DOI" error={errors.doi}>
                        <Input value={data.doi} onChange={(e) => setData('doi', e.target.value)} placeholder="10.xxxx/..." />
                    </Field>
                    <Field label="ISBN" error={errors.isbn}>
                        <Input value={data.isbn} onChange={(e) => setData('isbn', e.target.value)} placeholder="978-..." />
                    </Field>
                </div>

                <Field label="Link" error={errors.link}>
                    <Input value={data.link} onChange={(e) => setData('link', e.target.value)} placeholder="https://..." type="url" />
                </Field>
            </FormSection>

            {/* ─── Conteúdo ─────────────────────────────────────── */}
            <FormSection title="Conteúdo">
                <Field label="Resumo" required error={errors.resumo}>
                    <Textarea value={data.resumo} onChange={(e) => setData('resumo', e.target.value)} rows={5} placeholder="Resumo da publicação..." maxLength={RESUMO_MAX} />
                    <p className={cn('self-end rounded px-1.5 py-0.5 text-xs tabular-nums transition-colors', resumoAtLimit ? 'bg-destructive text-destructive-foreground' : resumoNearLimit ? 'text-destructive' : resumoAbaixoMin ? 'text-destructive' : 'text-muted-foreground')}>
                        {resumoLen < RESUMO_MIN ? `${resumoLen}/${RESUMO_MIN} mín` : `${resumoLen.toLocaleString('pt-BR')}/${RESUMO_MAX.toLocaleString('pt-BR')} máx`}
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
                                            if (e.key === 'Enter') { e.preventDefault(); handleAdicionarPalavra(); }
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
                                                    <CommandItem key={pk.id} value={pk.texto} onSelect={() => addPalavraChave(pk.texto)}>
                                                        <Check className={cn('mr-2 size-4', data.palavras_chave.includes(pk.texto) ? 'opacity-100' : 'opacity-0')} />
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
                        <Button type="button" variant="outline" onClick={handleAdicionarPalavra}>Adicionar</Button>
                    </div>
                    {data.palavras_chave.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {data.palavras_chave.map((kw) => (
                                <Badge key={kw} variant="secondary" className="gap-1">
                                    {kw}
                                    <button type="button" onClick={() => removePalavraChave(kw)} aria-label={`Remover ${kw}`}><X className="size-3" /></button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </Field>

                <Field label="Áreas do conhecimento" required error={errors.area_ids as unknown as string}>
                    <div className="flex flex-wrap gap-2">
                        {areas.map((area) => (
                            <Badge key={area.id} variant={data.area_ids.includes(area.id) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => toggleArea(area.id)}>
                                {area.nome}
                            </Badge>
                        ))}
                    </div>
                </Field>
            </FormSection>

            {/* ─── Autores ───────────────────────────────────────── */}
            <FormSection title="Autores" required>
                <AutorList value={data.autores} onChange={(autores) => setData('autores', autores)} />
                {errors.autores && <p className="text-xs text-destructive">{errors.autores}</p>}
            </FormSection>

            {/* ─── Local de publicação ───────────────────────────── */}
            <FormSection title="Local de publicação">
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Nome do Periódico/Veículo" required error={errors.local_publicacao_id}>
                        <CreatableSelect
                            options={nomeOptions}
                            value={data.local_publicacao_id}
                            onChange={handleLocalChange}
                            placeholder="Selecionar..."
                            onCreateClick={openCreateLocalDialog}
                            createLabel="+ Novo periódico..."
                        />
                    </Field>
                    <Field label="Nome Abreviado">
                        <CreatableSelect
                            options={nomeAbrevOptions}
                            value={data.local_publicacao_id}
                            onChange={handleLocalChange}
                            placeholder="Selecionar..."
                            onCreateClick={openCreateLocalDialog}
                            createLabel="+ Novo periódico..."
                        />
                    </Field>
                    <Field label="ISSN">
                        <CreatableSelect
                            options={issnOptions}
                            value={data.local_publicacao_id}
                            onChange={handleLocalChange}
                            placeholder="Selecionar..."
                            onCreateClick={openCreateLocalDialog}
                            createLabel="+ Novo periódico..."
                        />
                    </Field>
                    <Field label="Estado/UF">
                        <Popover open={estadoOpen} onOpenChange={setEstadoOpen}>
                            <PopoverTrigger asChild>
                                <Button type="button" variant="outline" role="combobox" className={cn('w-full justify-between font-normal', !filterEstado && 'text-muted-foreground')}>
                                    {filterEstado ? `${filterEstado} — ${estados.find((e) => e.sigla === filterEstado)?.nome ?? filterEstado}` : 'Todos os estados'}
                                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[260px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Buscar estado..." />
                                    <CommandList>
                                        <CommandGroup>
                                            {estados.map((e) => (
                                                <CommandItem
                                                    key={e.sigla}
                                                    value={e.sigla}
                                                    onSelect={() => {
                                                        handleEstadoChange(filterEstado === e.sigla ? '__todos__' : e.sigla);
                                                        setEstadoOpen(false);
                                                    }}
                                                >
                                                    <Check className={cn('mr-2 size-4 shrink-0', filterEstado === e.sigla ? 'opacity-100' : 'opacity-0')} />
                                                    {e.sigla} — {e.nome}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </Field>
                </div>

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
                        <CreatableSelect options={qualisCapes} value={data.qualis_capes_id} onChange={(v) => setData('qualis_capes_id', v)} placeholder="Selecionar..." />
                    </Field>
                    <Field label="Tipo de Instituição" error={errors.tipo_instituicao_id}>
                        <CreatableSelect options={tiposInstituicao} value={data.tipo_instituicao_id} onChange={(v) => setData('tipo_instituicao_id', v)} placeholder="Selecionar..." />
                    </Field>
                    <Field label="Turma" error={errors.turma_id}>
                        <CreatableSelect options={turmas} value={data.turma_id} onChange={(v) => setData('turma_id', v)} placeholder="Selecionar..." />
                    </Field>
                    <Field label="Eixo Temático" error={errors.eixo_tematico_id}>
                        <CreatableSelect options={eixosTematicos} value={data.eixo_tematico_id} onChange={(v) => setData('eixo_tematico_id', v)} placeholder="Selecionar..." />
                    </Field>
                    <Field label="Segmento Educacional" error={errors.segmento_educacional_id}>
                        <CreatableSelect options={segmentosEducacionais} value={data.segmento_educacional_id} onChange={(v) => setData('segmento_educacional_id', v)} placeholder="Selecionar..." />
                    </Field>
                </div>
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

        {/* ─── Dialog confirmação de palavra-chave nova ─── */}
        <Dialog open={pkConfirmOpen} onOpenChange={setPkConfirmOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar nova palavra-chave</DialogTitle>
                    <DialogDescription>
                        Você está prestes a cadastrar a palavra-chave: <strong>"{pkPendingTexto}"</strong>.
                        <br />Verifique se ela já não existe com outra grafia para evitar duplicatas.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setPkConfirmOpen(false)} disabled={pkCriando}>Cancelar</Button>
                    <Button onClick={handlePkCreateConfirmed} disabled={pkCriando}>
                        {pkCriando ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                        Cadastrar mesmo assim
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* ─── Dialog de criação de periódico ─────────────── */}
        <Dialog open={createLocalOpen} onOpenChange={setCreateLocalOpen}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Criar novo periódico</DialogTitle>
                    <DialogDescription>
                        Preencha os campos abaixo. Os periódicos existentes que correspondem ao que você digitar aparecerão automaticamente — verifique antes de criar.
                    </DialogDescription>
                </DialogHeader>

                {matchingLocais.length > 0 && (
                    <div className="rounded border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950">
                        <p className="mb-2 text-xs font-medium text-amber-800 dark:text-amber-300">Periódicos existentes que correspondem:</p>
                        <ul className="space-y-1">
                            {matchingLocais.map((o) => (
                                <li key={o.id} className="text-xs text-amber-900 dark:text-amber-200">
                                    <span className="font-medium">{o.nome}</span>
                                    {(o.nome_abreviado || o.issn || o.estado) && (
                                        <span className="ml-1 text-amber-700 dark:text-amber-400">
                                            · {[o.nome_abreviado, o.issn, o.estado].filter(Boolean).join(' · ')}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label>Nome <span className="text-destructive">*</span></Label>
                        <Input value={createLocalForm.nome} onChange={(e) => setCreateLocalForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Nome completo do periódico" autoFocus />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Nome abreviado</Label>
                        <Input value={createLocalForm.nome_abreviado} onChange={(e) => setCreateLocalForm((f) => ({ ...f, nome_abreviado: e.target.value }))} placeholder="Ex: Rev. Bras. Ed." />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <Label>ISSN</Label>
                            <Input value={createLocalForm.issn} onChange={(e) => setCreateLocalForm((f) => ({ ...f, issn: e.target.value }))} placeholder="0000-0000" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>Estado/UF</Label>
                            <Select value={createLocalForm.estado || '__none__'} onValueChange={(v) => setCreateLocalForm((f) => ({ ...f, estado: v === '__none__' ? '' : v }))}>
                                <SelectTrigger><SelectValue placeholder="Selecionar UF..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Nenhum</SelectItem>
                                    {estados.map((e) => (
                                        <SelectItem key={e.sigla} value={e.sigla}>{e.sigla} — {e.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {createLocalError && <p className="text-xs text-destructive">{createLocalError}</p>}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateLocalOpen(false)}>Cancelar</Button>
                    <Button disabled={!createLocalForm.nome.trim()} onClick={() => { if (createLocalForm.nome.trim()) setCreateLocalConfirmOpen(true); }}>
                        Criar periódico
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* ─── Dialog de confirmação de criação de periódico ── */}
        <Dialog open={createLocalConfirmOpen} onOpenChange={setCreateLocalConfirmOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar criação de periódico</DialogTitle>
                    <DialogDescription>
                        Você está prestes a cadastrar: <strong>"{createLocalForm.nome.trim()}"</strong>.
                        <br />Verifique se ele já não existe com outra grafia para evitar duplicatas.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateLocalConfirmOpen(false)} disabled={createLocalSaving}>Cancelar</Button>
                    <Button onClick={handleCreateLocalConfirm} disabled={createLocalSaving}>
                        {createLocalSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Cadastrar mesmo assim
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
