import { AutorList, type AutorItem } from '@/components/AutorList';
import { CreatableSelect, type SelectOption } from '@/components/CreatableSelect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useState } from 'react';

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

    const [palavraInput, setPalavraInput] = useState('');

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        submit(submitMethod, submitRoute);
    }

    function addPalavraChave() {
        const kw = palavraInput.trim();
        if (!kw || data.palavras_chave.includes(kw)) return;
        setData('palavras_chave', [...data.palavras_chave, kw]);
        setPalavraInput('');
    }

    function removePalavraChave(kw: string) {
        setData('palavras_chave', data.palavras_chave.filter((p) => p !== kw));
    }

    function toggleArea(areaId: number) {
        const next = data.area_ids.includes(areaId)
            ? data.area_ids.filter((id) => id !== areaId)
            : [...data.area_ids, areaId];
        setData('area_ids', next);
    }

    const nullToUndefined = (v: number | null) => (v === null ? undefined : String(v));

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
                        <Select
                            value={nullToUndefined(data.qualis_capes_id)}
                            onValueChange={(v) => setData('qualis_capes_id', Number(v))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecionar..." />
                            </SelectTrigger>
                            <SelectContent>
                                {qualisCapes.map((q) => (
                                    <SelectItem key={q.id} value={String(q.id)}>
                                        {q.nome}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="Tipo de Instituição" error={errors.tipo_instituicao_id}>
                        <Select
                            value={nullToUndefined(data.tipo_instituicao_id)}
                            onValueChange={(v) => setData('tipo_instituicao_id', Number(v))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecionar..." />
                            </SelectTrigger>
                            <SelectContent>
                                {tiposInstituicao.map((t) => (
                                    <SelectItem key={t.id} value={String(t.id)}>
                                        {t.nome}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="Turma" error={errors.turma_id}>
                        <Select
                            value={nullToUndefined(data.turma_id)}
                            onValueChange={(v) => setData('turma_id', Number(v))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecionar..." />
                            </SelectTrigger>
                            <SelectContent>
                                {turmas.map((t) => (
                                    <SelectItem key={t.id} value={String(t.id)}>
                                        {t.nome}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="Eixo Temático" error={errors.eixo_tematico_id}>
                        <Select
                            value={nullToUndefined(data.eixo_tematico_id)}
                            onValueChange={(v) => setData('eixo_tematico_id', Number(v))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecionar..." />
                            </SelectTrigger>
                            <SelectContent>
                                {eixosTematicos.map((e) => (
                                    <SelectItem key={e.id} value={String(e.id)}>
                                        {e.nome}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="Segmento Educacional" error={errors.segmento_educacional_id}>
                        <Select
                            value={nullToUndefined(data.segmento_educacional_id)}
                            onValueChange={(v) => setData('segmento_educacional_id', Number(v))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecionar..." />
                            </SelectTrigger>
                            <SelectContent>
                                {segmentosEducacionais.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        {s.nome}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                    />
                </Field>

                <Field label="Palavras-chave" error={errors.palavras_chave as unknown as string}>
                    <div className="flex gap-2">
                        <Input
                            value={palavraInput}
                            onChange={(e) => setPalavraInput(e.target.value)}
                            placeholder="Adicionar palavra-chave..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); addPalavraChave(); }
                            }}
                        />
                        <Button type="button" variant="outline" onClick={addPalavraChave}>
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
