import { Layout } from '@/layouts/Layout';
import { Head } from '@inertiajs/react';

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

function StatCard({ label, value, sub }: { label: string; value: string | number | null; sub?: string }) {
    return (
        <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold truncate">{value ?? '—'}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3 pb-2 border-b">{title}</h2>
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
    const ultimaAtualizacaoFormatada = ultimaAtualizacao
        ? new Date(ultimaAtualizacao).toLocaleDateString('pt-BR')
        : null;

    return (
        <Layout>
            <Head title="Visão Geral do Acervo" />
            <div className="container mx-auto px-4 py-6">
                <h1 className="mb-6 text-2xl font-bold">Visão Geral do Acervo</h1>

                <Section title="Sobre o Acervo">
                    <StatCard label="Total de publicações" value={totalPublicacoes.toLocaleString('pt-BR')} />
                    <StatCard
                        label="Período coberto"
                        value={anoMin && anoMax ? `${anoMin} – ${anoMax}` : '—'}
                    />
                    <StatCard label="Última atualização" value={ultimaAtualizacaoFormatada} />
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

                <Section title="Perfil das Publicações">
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

                <Section title="Distribuição Geográfica">
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

                <Section title="Riqueza do Conteúdo">
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
