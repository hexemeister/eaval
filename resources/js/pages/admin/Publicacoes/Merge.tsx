import { PageHelp } from '@/components/page-help';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface AutorMerge { id: number; nome: string; ordem: number; }
interface AreaMerge  { id: number; nome: string; }

interface PubMerge {
    id: number;
    titulo: string | null;
    autores: AutorMerge[];
    palavrasChave: string[];
    areas: AreaMerge[];
}

interface CampoDiferente {
    campo: string;
    label: string;
    v1: string | null;
    v2: string | null;
}

interface MergeProps {
    pub1: PubMerge;
    pub2: PubMerge;
    camposDiferentes: CampoDiferente[];
    pageDescription?: string;
}

type MnChoice = '1' | '2' | 'union';

// ─── Componente ──────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Publicações', href: '/admin/publicacoes' },
    { title: 'Mesclar', href: '#' },
];

export default function Merge({ pub1, pub2, camposDiferentes, pageDescription = '' }: MergeProps) {
    const [selecoes, setSelecoes] = useState<Record<string, '1' | '2'>>(
        Object.fromEntries(camposDiferentes.map((c) => [c.campo, '1'])),
    );
    const [selecoesMn, setSelecoesMn] = useState<Record<string, MnChoice>>({
        autores:        '1',
        palavras_chave: '1',
        areas:          '1',
    });
    const [submitting, setSubmitting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    function selecionar(campo: string, choice: '1' | '2') {
        setSelecoes((prev) => ({ ...prev, [campo]: choice }));
    }

    function selecionarMn(campo: string, choice: MnChoice) {
        setSelecoesMn((prev) => ({ ...prev, [campo]: choice }));
    }

    function handleSubmit() {
        setConfirmOpen(false);
        setSubmitting(true);
        router.post('/admin/publicacoes/merge', {
            ids: [pub1.id, pub2.id],
            selecoes,
            selecoesMn,
        }, { onError: () => setSubmitting(false) });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Mesclar publicações #${pub1.id} e #${pub2.id}`} />

            <div className="flex flex-col gap-6">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">Mesclar publicações</h1>
                        <PageHelp text={pageDescription} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        A publicação <strong>#{pub1.id}</strong> será mantida. A <strong>#{pub2.id}</strong> será excluída. Clique em cada valor para escolher qual manter.
                    </p>
                </div>

                {/* Campos escalares que diferem */}
                {camposDiferentes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">As publicações são idênticas em todos os campos escalares.</p>
                ) : (
                    <div className="rounded-lg border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="px-4 py-2 text-left font-medium">Campo</th>
                                    <th className="px-4 py-2 text-left font-medium">
                                        #{pub1.id} <span className="text-xs text-muted-foreground">(mantida)</span>
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium">
                                        #{pub2.id} <span className="text-xs text-muted-foreground">(será excluída)</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {camposDiferentes.map((c) => (
                                    <tr key={c.campo} className="border-b last:border-0">
                                        <td className="px-4 py-2 font-medium text-muted-foreground">{c.label}</td>
                                        <td
                                            className={cn(
                                                'cursor-pointer px-4 py-2 transition-colors',
                                                selecoes[c.campo] === '1'
                                                    ? 'bg-primary/10 font-medium text-primary ring-1 ring-inset ring-primary/30'
                                                    : 'hover:bg-muted',
                                            )}
                                            onClick={() => selecionar(c.campo, '1')}
                                        >
                                            {c.v1 ?? <span className="text-muted-foreground italic">vazio</span>}
                                        </td>
                                        <td
                                            className={cn(
                                                'cursor-pointer px-4 py-2 transition-colors',
                                                selecoes[c.campo] === '2'
                                                    ? 'bg-primary/10 font-medium text-primary ring-1 ring-inset ring-primary/30'
                                                    : 'hover:bg-muted',
                                            )}
                                            onClick={() => selecionar(c.campo, '2')}
                                        >
                                            {c.v2 ?? <span className="text-muted-foreground italic">vazio</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Campos N:M */}
                <div className="flex flex-col gap-4">
                    {(
                        [
                            { campo: 'autores',        label: 'Autores',        itens1: pub1.autores.map((a) => a.nome),  itens2: pub2.autores.map((a) => a.nome) },
                            { campo: 'palavras_chave', label: 'Palavras-chave', itens1: pub1.palavrasChave,               itens2: pub2.palavrasChave },
                            { campo: 'areas',          label: 'Áreas',          itens1: pub1.areas.map((a) => a.nome),    itens2: pub2.areas.map((a) => a.nome) },
                        ] as const
                    ).map(({ campo, label, itens1, itens2 }) => (
                        <div key={campo} className="rounded-lg border p-4">
                            <p className="mb-3 font-medium">{label}</p>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col gap-1">
                                    <p className="text-xs text-muted-foreground">#{pub1.id}</p>
                                    {itens1.length === 0
                                        ? <span className="text-xs italic text-muted-foreground">nenhum</span>
                                        : itens1.map((item, i) => <span key={i} className="text-sm">{item}</span>)}
                                </div>
                                <div className="flex flex-col items-center gap-2 pt-4">
                                    {(['1', 'union', '2'] as const).map((choice) => (
                                        <Button
                                            key={choice}
                                            type="button"
                                            size="sm"
                                            variant={selecoesMn[campo] === choice ? 'default' : 'outline'}
                                            className="w-full text-xs"
                                            onClick={() => selecionarMn(campo, choice)}
                                        >
                                            {choice === '1' ? `Manter #${pub1.id}` : choice === 'union' ? 'Unir ambos' : `Manter #${pub2.id}`}
                                        </Button>
                                    ))}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <p className="text-xs text-muted-foreground">#{pub2.id}</p>
                                    {itens2.length === 0
                                        ? <span className="text-xs italic text-muted-foreground">nenhum</span>
                                        : itens2.map((item, i) => <span key={i} className="text-sm">{item}</span>)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Ações */}
                <div className="flex gap-3">
                    <Button onClick={() => setConfirmOpen(true)} disabled={submitting}>
                        {submitting ? 'Mesclando...' : 'Confirmar mesclagem'}
                    </Button>
                    <Button variant="outline" onClick={() => router.visit('/admin/publicacoes')}>
                        Cancelar
                    </Button>
                </div>
            </div>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar mesclagem</DialogTitle>
                        <DialogDescription asChild>
                            <div className="space-y-2 text-sm">
                                <p>Esta operação é <strong>irreversível</strong>.</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>O registro <strong>#{pub1.id}</strong> será atualizado com as decisões acima.</li>
                                    <li>O registro <strong>#{pub2.id}</strong> será permanentemente excluído.</li>
                                </ul>
                                <p>Tem certeza que deseja continuar?</p>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleSubmit} disabled={submitting}>
                            Sim, mesclar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
