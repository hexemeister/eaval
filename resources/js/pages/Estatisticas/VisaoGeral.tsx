import { Layout } from '@/layouts/Layout';
import { Head } from '@inertiajs/react';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface Props {
    totalPublicacoes: number;
    anoMin: number;
    anoMax: number;
    ultimaAtualizacao: string | null;
    autorTopNome: string | null;
    autorTopTotal: number;
    periodicoTopNome: string | null;
    periodicoTopTotal: number;
    qualisTopNome: string | null;
    qualisTopTotal: number;
    areaTopNome: string | null;
    areaTopTotal: number;
    eixoTopNome: string | null;
    eixoTopTotal: number;
    segmentoTopNome: string | null;
    segmentoTopTotal: number;
    tipoTopNome: string | null;
    tipoTopTotal: number;
    formaTopNome: string | null;
    formaTopTotal: number;
    estadoTopNome: string | null;
    estadoTopTotal: number;
    regiaoTopNome: string | null;
    regiaoTopTotal: number;
    paisTopNome: string | null;
    paisTopTotal: number;
    mediaAutoresPorArtigo: number;
    mediaPalavrasChaveArtigo: number;
    mediaPalavrasTitulo: number;
    mediaPalavrasResumo: number;
    totalAutores: number;
    totalPeriodicos: number;
    totalPalavrasChave: number;
    percentualDOI: number;
    percentualResumo: number;
}

type CardLine = { label: string; value: string | number | null; sub?: string };

function buildCopyText(lines: CardLine[]): string {
    return lines
        .map(({ label, value, sub }) => {
            const v = value != null ? String(value) : '—';
            return sub ? `${label}: ${v} (${sub})` : `${label}: ${v}`;
        })
        .join('\n');
}

function StatCard({ label, value, sub }: CardLine) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const v = value != null ? String(value) : '—';
        const text = sub ? `${v} (${sub})` : v;
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    };

    return (
        <div className="group relative rounded-lg border bg-card p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p
                className="mt-1 text-2xl font-semibold leading-tight line-clamp-2"
                title={value != null ? String(value) : undefined}
            >
                {value ?? '—'}
            </p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            <button
                onClick={handleCopy}
                aria-label={`Copiar ${label}`}
                className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-muted"
            >
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
        </div>
    );
}

function CopyButton({ text, label, size = 'sm' }: { text: string; label: string; size?: 'sm' | 'md' }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    const iconCls = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
    return (
        <button
            onClick={handleCopy}
            aria-label={label}
            title={label}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted shrink-0"
        >
            {copied ? <Check className={`${iconCls} text-green-500`} /> : <Copy className={iconCls} />}
            {copied ? 'Copiado' : 'Copiar'}
        </button>
    );
}

function Section({ title, copyText, children }: { title: string; copyText: string; children: React.ReactNode }) {
    return (
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                <h2 className="text-lg font-semibold">{title}</h2>
                <CopyButton text={copyText} label={`Copiar seção ${title}`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{children}</div>
        </div>
    );
}

export default function VisaoGeral({
    totalPublicacoes,
    anoMin,
    anoMax,
    ultimaAtualizacao,
    autorTopNome,
    autorTopTotal,
    periodicoTopNome,
    periodicoTopTotal,
    qualisTopNome,
    qualisTopTotal,
    areaTopNome,
    areaTopTotal,
    eixoTopNome,
    eixoTopTotal,
    segmentoTopNome,
    segmentoTopTotal,
    tipoTopNome,
    tipoTopTotal,
    formaTopNome,
    formaTopTotal,
    estadoTopNome,
    estadoTopTotal,
    regiaoTopNome,
    regiaoTopTotal,
    paisTopNome,
    paisTopTotal,
    mediaAutoresPorArtigo,
    mediaPalavrasChaveArtigo,
    mediaPalavrasTitulo,
    mediaPalavrasResumo,
    totalAutores,
    totalPeriodicos,
    totalPalavrasChave,
    percentualDOI,
    percentualResumo,
}: Props) {
    const acervoCopy = buildCopyText([
        { label: 'Total de publicações', value: totalPublicacoes.toLocaleString('pt-BR') },
        { label: 'Período coberto', value: anoMin && anoMax ? `${anoMin} – ${anoMax}` : '—' },
        { label: 'Última atualização', value: ultimaAtualizacao },
        { label: 'Autor mais prolífico', value: autorTopNome, sub: autorTopTotal ? `${autorTopTotal} publicações` : undefined },
        { label: 'Periódico com mais publicações', value: periodicoTopNome, sub: periodicoTopTotal ? `${periodicoTopTotal} publicações` : undefined },
    ]);

    const perfilCopy = buildCopyText([
        { label: 'Qualis mais frequente', value: qualisTopNome, sub: qualisTopTotal ? `${qualisTopTotal} publicações` : undefined },
        { label: 'Área mais frequente', value: areaTopNome, sub: areaTopTotal ? `${areaTopTotal} publicações` : undefined },
        { label: 'Eixo temático mais frequente', value: eixoTopNome, sub: eixoTopTotal ? `${eixoTopTotal} publicações` : undefined },
        { label: 'Segmento mais frequente', value: segmentoTopNome, sub: segmentoTopTotal ? `${segmentoTopTotal} publicações` : undefined },
        { label: 'Tipo mais frequente', value: tipoTopNome, sub: tipoTopTotal ? `${tipoTopTotal} publicações` : undefined },
        { label: 'Forma mais frequente', value: formaTopNome, sub: formaTopTotal ? `${formaTopTotal} publicações` : undefined },
    ]);

    const geografiaCopy = buildCopyText([
        { label: 'Estado com mais publicações', value: estadoTopNome, sub: estadoTopTotal ? `${estadoTopTotal} publicações` : undefined },
        { label: 'Região com mais publicações', value: regiaoTopNome, sub: regiaoTopTotal ? `${regiaoTopTotal} publicações` : undefined },
        { label: 'País com mais publicações', value: paisTopNome, sub: paisTopTotal ? `${paisTopTotal} publicações` : undefined },
    ]);

    const riquezaCopy = buildCopyText([
        { label: 'Méd. autores por artigo', value: mediaAutoresPorArtigo },
        { label: 'Méd. palavras-chave por artigo', value: mediaPalavrasChaveArtigo },
        { label: 'Méd. palavras no título', value: mediaPalavrasTitulo },
        { label: 'Méd. palavras no resumo', value: mediaPalavrasResumo },
        { label: 'Autores únicos', value: totalAutores.toLocaleString('pt-BR') },
        { label: 'Periódicos únicos', value: totalPeriodicos.toLocaleString('pt-BR') },
        { label: 'Palavras-chave únicas', value: totalPalavrasChave.toLocaleString('pt-BR') },
        { label: 'Com DOI', value: `${percentualDOI}%` },
        { label: 'Com resumo', value: `${percentualResumo}%` },
    ]);

    const allCopy = [acervoCopy, perfilCopy, geografiaCopy, riquezaCopy]
        .map((block, i) => {
            const titles = ['Sobre o Acervo', 'Perfil das Publicações', 'Distribuição Geográfica', 'Riqueza do Conteúdo'];
            return `=== ${titles[i]} ===\n${block}`;
        })
        .join('\n\n');

    return (
        <Layout>
            <Head title="Visão Geral do Acervo" />
            <div className="container mx-auto px-4 py-6">
                <div className="flex items-center gap-3 mb-6">
                    <h1 className="text-2xl font-bold">Visão Geral do Acervo</h1>
                    <CopyButton text={allCopy} label="Copiar todas as seções" size="md" />
                </div>

                <Section title="Sobre o Acervo" copyText={acervoCopy}>
                    <StatCard label="Total de publicações" value={totalPublicacoes.toLocaleString('pt-BR')} />
                    <StatCard label="Período coberto" value={anoMin && anoMax ? `${anoMin} – ${anoMax}` : '—'} />
                    <StatCard label="Última atualização" value={ultimaAtualizacao} />
                    <StatCard
                        label="Autor mais prolífico"
                        value={autorTopNome}
                        sub={autorTopTotal ? `${autorTopTotal} publicações` : undefined}
                    />
                    <StatCard
                        label="Periódico com mais publicações"
                        value={periodicoTopNome}
                        sub={periodicoTopTotal ? `${periodicoTopTotal} publicações` : undefined}
                    />
                </Section>

                <Section title="Perfil das Publicações" copyText={perfilCopy}>
                    <StatCard
                        label="Qualis mais frequente"
                        value={qualisTopNome}
                        sub={qualisTopTotal ? `${qualisTopTotal} publicações` : undefined}
                    />
                    <StatCard
                        label="Área mais frequente"
                        value={areaTopNome}
                        sub={areaTopTotal ? `${areaTopTotal} publicações` : undefined}
                    />
                    <StatCard
                        label="Eixo temático mais frequente"
                        value={eixoTopNome}
                        sub={eixoTopTotal ? `${eixoTopTotal} publicações` : undefined}
                    />
                    <StatCard
                        label="Segmento mais frequente"
                        value={segmentoTopNome}
                        sub={segmentoTopTotal ? `${segmentoTopTotal} publicações` : undefined}
                    />
                    <StatCard
                        label="Tipo mais frequente"
                        value={tipoTopNome}
                        sub={tipoTopTotal ? `${tipoTopTotal} publicações` : undefined}
                    />
                    <StatCard
                        label="Forma mais frequente"
                        value={formaTopNome}
                        sub={formaTopTotal ? `${formaTopTotal} publicações` : undefined}
                    />
                </Section>

                <Section title="Distribuição Geográfica" copyText={geografiaCopy}>
                    <StatCard
                        label="Estado com mais publicações"
                        value={estadoTopNome}
                        sub={estadoTopTotal ? `${estadoTopTotal} publicações` : undefined}
                    />
                    <StatCard
                        label="Região com mais publicações"
                        value={regiaoTopNome}
                        sub={regiaoTopTotal ? `${regiaoTopTotal} publicações` : undefined}
                    />
                    <StatCard
                        label="País com mais publicações"
                        value={paisTopNome}
                        sub={paisTopTotal ? `${paisTopTotal} publicações` : undefined}
                    />
                </Section>

                <Section title="Riqueza do Conteúdo" copyText={riquezaCopy}>
                    <StatCard label="Méd. autores por artigo" value={mediaAutoresPorArtigo} />
                    <StatCard label="Méd. palavras-chave por artigo" value={mediaPalavrasChaveArtigo} />
                    <StatCard label="Méd. palavras no título" value={mediaPalavrasTitulo} />
                    <StatCard label="Méd. palavras no resumo" value={mediaPalavrasResumo} />
                    <StatCard label="Autores únicos" value={totalAutores.toLocaleString('pt-BR')} />
                    <StatCard label="Periódicos únicos" value={totalPeriodicos.toLocaleString('pt-BR')} />
                    <StatCard label="Palavras-chave únicas" value={totalPalavrasChave.toLocaleString('pt-BR')} />
                    <StatCard label="Com DOI" value={`${percentualDOI}%`} />
                    <StatCard label="Com resumo" value={`${percentualResumo}%`} />
                </Section>
            </div>
        </Layout>
    );
}
