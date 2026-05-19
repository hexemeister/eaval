import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { type BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { ChevronDown, ChevronUp, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Pais   { id: number; sigla: string; nome: string }
interface Regiao { id: number; sigla: string; sigla_pais: string | null; nome: string }
interface Estado { id: number; sigla: string; sigla_regiao: string | null; nome: string }

interface DeleteState {
  id: number;
  nome: string;
  url: string;
  confirmUrl: string;
  affected: Record<string, number> | null;
  checking: boolean;
  confirming: boolean;
}

interface GeografiaProps {
  paises:  Pais[];
  regioes: Regiao[];
  estados: Estado[];
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: dashboard().url },
  { title: 'Cadastros', href: '#' },
  { title: 'Geografia', href: '/admin/cadastros/geografia' },
];

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

// ─── Sub-componente: cabeçalho de seção ───────────────────────────────────────

function SectionHeader({ title, onNew }: { title: string; onNew: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Button size="sm" onClick={onNew}>
        <Plus className="mr-1 size-4" />
        Novo
      </Button>
    </div>
  );
}

// ─── Sub-componente: célula de ordenação ──────────────────────────────────────

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc')  return <ChevronUp   className="ml-1 inline size-3" />;
  if (sorted === 'desc') return <ChevronDown className="ml-1 inline size-3" />;
  return <span className="ml-1 inline-block w-3" />;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function GeografiaCrud({ paises, regioes, estados }: GeografiaProps) {

  // ── Delete state compartilhado ──
  const [del, setDel] = useState<DeleteState | null>(null);

  async function handleDeleteClick(id: number, nome: string, base: string) {
    const url         = `/admin/cadastros/geografia/${base}/${id}`;
    const confirmUrl  = `${url}/destroy-confirmed`;
    setDel({ id, nome, url, confirmUrl, affected: null, checking: true, confirming: false });
    try {
      const res  = await fetch(url, {
        method: 'DELETE',
        headers: { Accept: 'application/json', 'X-XSRF-TOKEN': getCsrfToken() },
      });
      const data = await res.json() as { affected: Record<string, number> };
      setDel(prev => prev ? { ...prev, affected: data.affected, checking: false } : null);
    } catch {
      setDel(prev => prev ? { ...prev, affected: {}, checking: false } : null);
    }
  }

  function handleDeleteConfirm() {
    if (!del) return;
    setDel(prev => prev ? { ...prev, confirming: true } : null);
    router.post(del.confirmUrl, {}, {
      onFinish: () => setDel(null),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PAÍSES
  // ─────────────────────────────────────────────────────────────────────────────

  const [showPaisForm, setShowPaisForm]     = useState(false);
  const [editingPais, setEditingPais]       = useState<Pais | null>(null);
  const [paisSigla, setPaisSigla]           = useState('');
  const [paisNome, setPaisNome]             = useState('');
  const [paisSorting, setPaisSorting]       = useState<SortingState>([]);
  const [paisFilter, setPaisFilter]         = useState('');
  const [paisSubmitting, setPaisSubmitting] = useState(false);

  function openPaisCreate() {
    setEditingPais(null); setPaisSigla(''); setPaisNome(''); setShowPaisForm(true);
  }
  function openPaisEdit(p: Pais) {
    setEditingPais(p); setPaisSigla(p.sigla); setPaisNome(p.nome); setShowPaisForm(true);
  }
  function submitPais(e: React.FormEvent) {
    e.preventDefault();
    setPaisSubmitting(true);
    const data = { sigla: paisSigla, nome: paisNome };
    const url  = editingPais
      ? `/admin/cadastros/geografia/paises/${editingPais.id}`
      : '/admin/cadastros/geografia/paises';
    router[editingPais ? 'put' : 'post'](url, data, {
      onFinish: () => { setPaisSubmitting(false); setShowPaisForm(false); },
    });
  }

  const paisColumnHelper = createColumnHelper<Pais>();
  const paisColumns = useMemo(() => [
    paisColumnHelper.accessor('sigla', { header: 'Sigla', size: 80 }),
    paisColumnHelper.accessor('nome',  { header: 'Nome' }),
    paisColumnHelper.display({
      id: 'acoes',
      header: '',
      size: 80,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => openPaisEdit(row.original)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
            onClick={() => handleDeleteClick(row.original.id, row.original.nome, 'paises')}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const paisTable = useReactTable({
    data: paises,
    columns: paisColumns,
    state: { sorting: paisSorting, globalFilter: paisFilter },
    onSortingChange: setPaisSorting,
    onGlobalFilterChange: setPaisFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // REGIÕES
  // ─────────────────────────────────────────────────────────────────────────────

  const [showRegiaoForm, setShowRegiaoForm]     = useState(false);
  const [editingRegiao, setEditingRegiao]       = useState<Regiao | null>(null);
  const [regiaoSigla, setRegiaoSigla]           = useState('');
  const [regiaoNome, setRegiaoNome]             = useState('');
  const [regiaoSiglaPais, setRegiaoSiglaPais]   = useState('');
  const [regiaoSorting, setRegiaoSorting]       = useState<SortingState>([]);
  const [regiaoFilter, setRegiaoFilter]         = useState('');
  const [regiaoSubmitting, setRegiaoSubmitting] = useState(false);

  function openRegiaoCreate() {
    setEditingRegiao(null);
    setRegiaoSigla(''); setRegiaoNome('');
    setRegiaoSiglaPais(paises[0]?.sigla ?? '');
    setShowRegiaoForm(true);
  }
  function openRegiaoEdit(r: Regiao) {
    setEditingRegiao(r);
    setRegiaoSigla(r.sigla); setRegiaoNome(r.nome);
    setRegiaoSiglaPais(r.sigla_pais ?? '');
    setShowRegiaoForm(true);
  }
  function submitRegiao(e: React.FormEvent) {
    e.preventDefault();
    setRegiaoSubmitting(true);
    const data = { sigla: regiaoSigla, nome: regiaoNome, sigla_pais: regiaoSiglaPais || null };
    const url  = editingRegiao
      ? `/admin/cadastros/geografia/regioes/${editingRegiao.id}`
      : '/admin/cadastros/geografia/regioes';
    router[editingRegiao ? 'put' : 'post'](url, data, {
      onFinish: () => { setRegiaoSubmitting(false); setShowRegiaoForm(false); },
    });
  }

  const regiaoColumnHelper = createColumnHelper<Regiao>();
  const regiaoColumns = useMemo(() => [
    regiaoColumnHelper.accessor('sigla',     { header: 'Sigla', size: 80 }),
    regiaoColumnHelper.accessor('nome',      { header: 'Nome' }),
    regiaoColumnHelper.accessor('sigla_pais', {
      header: 'País',
      size: 100,
      cell: ({ getValue }) => {
        const sigla = getValue();
        return paises.find(p => p.sigla === sigla)?.nome ?? sigla ?? '—';
      },
    }),
    regiaoColumnHelper.display({
      id: 'acoes',
      header: '',
      size: 80,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => openRegiaoEdit(row.original)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
            onClick={() => handleDeleteClick(row.original.id, row.original.nome, 'regioes')}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [paises]);

  const regiaoTable = useReactTable({
    data: regioes,
    columns: regiaoColumns,
    state: { sorting: regiaoSorting, globalFilter: regiaoFilter },
    onSortingChange: setRegiaoSorting,
    onGlobalFilterChange: setRegiaoFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // ESTADOS
  // ─────────────────────────────────────────────────────────────────────────────

  const [showEstadoForm, setShowEstadoForm]       = useState(false);
  const [editingEstado, setEditingEstado]         = useState<Estado | null>(null);
  const [estadoSigla, setEstadoSigla]             = useState('');
  const [estadoNome, setEstadoNome]               = useState('');
  const [estadoSiglaRegiao, setEstadoSiglaRegiao] = useState('');
  const [estadoSiglaPais, setEstadoSiglaPais]     = useState('');
  const [estadoSorting, setEstadoSorting]         = useState<SortingState>([]);
  const [estadoFilter, setEstadoFilter]           = useState('');
  const [estadoSubmitting, setEstadoSubmitting]   = useState(false);

  const regioesFiltradas = useMemo(
    () => estadoSiglaPais ? regioes.filter(r => r.sigla_pais === estadoSiglaPais) : regioes,
    [regioes, estadoSiglaPais],
  );

  const paisOptions = useMemo(
    () => paises.map(p => ({ value: p.sigla, label: `${p.sigla} — ${p.nome}`, keywords: p.nome })),
    [paises],
  );

  const regiaoOptionsFiltered = useMemo(
    () => regioesFiltradas.map(r => ({ value: r.sigla, label: `${r.sigla} — ${r.nome}`, keywords: r.nome })),
    [regioesFiltradas],
  );

  function openEstadoCreate() {
    setEditingEstado(null);
    setEstadoSigla(''); setEstadoNome('');
    setEstadoSiglaPais(paises[0]?.sigla ?? '');
    setEstadoSiglaRegiao('');
    setShowEstadoForm(true);
  }
  function openEstadoEdit(e: Estado) {
    setEditingEstado(e);
    setEstadoSigla(e.sigla); setEstadoNome(e.nome);
    const regiao = regioes.find(r => r.sigla === e.sigla_regiao);
    setEstadoSiglaPais(regiao?.sigla_pais ?? paises[0]?.sigla ?? '');
    setEstadoSiglaRegiao(e.sigla_regiao ?? '');
    setShowEstadoForm(true);
  }
  function handlePaisChange(siglaPais: string) {
    setEstadoSiglaPais(siglaPais);
    setEstadoSiglaRegiao('');
  }
  function submitEstado(ev: React.FormEvent) {
    ev.preventDefault();
    setEstadoSubmitting(true);
    const data = { sigla: estadoSigla, nome: estadoNome, sigla_regiao: estadoSiglaRegiao || null };
    const url  = editingEstado
      ? `/admin/cadastros/geografia/estados/${editingEstado.id}`
      : '/admin/cadastros/geografia/estados';
    router[editingEstado ? 'put' : 'post'](url, data, {
      onFinish: () => { setEstadoSubmitting(false); setShowEstadoForm(false); },
    });
  }

  const estadoColumnHelper = createColumnHelper<Estado>();
  const estadoColumns = useMemo(() => [
    estadoColumnHelper.accessor('sigla',       { header: 'Sigla', size: 80 }),
    estadoColumnHelper.accessor('nome',        { header: 'Nome' }),
    estadoColumnHelper.accessor('sigla_regiao', {
      header: 'Região',
      size: 120,
      cell: ({ getValue }) => {
        const sigla  = getValue();
        const regiao = regioes.find(r => r.sigla === sigla);
        return regiao?.nome ?? sigla ?? '—';
      },
    }),
    estadoColumnHelper.display({
      id: 'acoes',
      header: '',
      size: 80,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEstadoEdit(row.original)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
            onClick={() => handleDeleteClick(row.original.id, row.original.nome, 'estados')}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [regioes]);

  const estadoTable = useReactTable({
    data: estados,
    columns: estadoColumns,
    state: { sorting: estadoSorting, globalFilter: estadoFilter },
    onSortingChange: setEstadoSorting,
    onGlobalFilterChange: setEstadoFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  function renderTable<T>(table: ReturnType<typeof useReactTable<T>>, filter: string, setFilter: (v: string) => void) {
    return (
      <div className="space-y-2">
        <Input
          placeholder="Filtrar..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="max-w-xs"
        />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(hg => (
                <TableRow key={hg.id}>
                  {hg.headers.map(header => (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <SortIcon sorted={header.column.getIsSorted()} />
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={100} className="h-16 text-center text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          {table.getFilteredRowModel().rows.length} registro(s)
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Geografia" />

      <Tabs defaultValue="paises">
        <TabsList>
          <TabsTrigger value="paises">Países</TabsTrigger>
          <TabsTrigger value="regioes">Regiões</TabsTrigger>
          <TabsTrigger value="estados">Estados</TabsTrigger>
        </TabsList>

        <TabsContent value="paises" className="flex flex-col gap-4 pt-4">
          <SectionHeader title="Países" onNew={openPaisCreate} />
          {renderTable(paisTable, paisFilter, setPaisFilter)}
        </TabsContent>

        <TabsContent value="regioes" className="flex flex-col gap-4 pt-4">
          <SectionHeader title="Regiões" onNew={openRegiaoCreate} />
          {renderTable(regiaoTable, regiaoFilter, setRegiaoFilter)}
        </TabsContent>

        <TabsContent value="estados" className="flex flex-col gap-4 pt-4">
          <SectionHeader title="Estados" onNew={openEstadoCreate} />
          {renderTable(estadoTable, estadoFilter, setEstadoFilter)}
        </TabsContent>
      </Tabs>

      {/* ── Dialog: País ── */}
      <Dialog open={showPaisForm} onOpenChange={v => { if (!v) setShowPaisForm(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPais ? 'Editar País' : 'Novo País'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitPais} className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="pais-sigla">Sigla</Label>
                <Input id="pais-sigla" value={paisSigla} onChange={e => setPaisSigla(e.target.value.toUpperCase())} maxLength={2} required />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <Label htmlFor="pais-nome">Nome</Label>
                <Input id="pais-nome" value={paisNome} onChange={e => setPaisNome(e.target.value)} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPaisForm(false)} disabled={paisSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={paisSubmitting}>
                {paisSubmitting && <Loader2 className="mr-1 size-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Região ── */}
      <Dialog open={showRegiaoForm} onOpenChange={v => { if (!v) setShowRegiaoForm(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRegiao ? 'Editar Região' : 'Nova Região'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitRegiao} className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="regiao-sigla">Sigla</Label>
                <Input id="regiao-sigla" value={regiaoSigla} onChange={e => setRegiaoSigla(e.target.value.toUpperCase())} maxLength={6} required />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <Label htmlFor="regiao-nome">Nome</Label>
                <Input id="regiao-nome" value={regiaoNome} onChange={e => setRegiaoNome(e.target.value)} required />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label>País</Label>
              <SearchableSelect
                options={paisOptions}
                value={regiaoSiglaPais}
                onValueChange={setRegiaoSiglaPais}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowRegiaoForm(false)} disabled={regiaoSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={regiaoSubmitting}>
                {regiaoSubmitting && <Loader2 className="mr-1 size-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Estado ── */}
      <Dialog open={showEstadoForm} onOpenChange={v => { if (!v) setShowEstadoForm(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEstado ? 'Editar Estado' : 'Novo Estado'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitEstado} className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="estado-sigla">Sigla</Label>
                <Input id="estado-sigla" value={estadoSigla} onChange={e => setEstadoSigla(e.target.value.toUpperCase())} maxLength={6} required />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <Label htmlFor="estado-nome">Nome</Label>
                <Input id="estado-nome" value={estadoNome} onChange={e => setEstadoNome(e.target.value)} required />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label>País</Label>
              <SearchableSelect
                options={paisOptions}
                value={estadoSiglaPais}
                onValueChange={handlePaisChange}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Região</Label>
              <SearchableSelect
                options={regiaoOptionsFiltered}
                value={estadoSiglaRegiao}
                onValueChange={setEstadoSiglaRegiao}
                placeholder={estadoSiglaPais ? 'Selecione...' : 'Selecione um país primeiro'}
                disabled={!estadoSiglaPais}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEstadoForm(false)} disabled={estadoSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={estadoSubmitting}>
                {estadoSubmitting && <Loader2 className="mr-1 size-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: confirmação de exclusão ── */}
      <Dialog open={!!del} onOpenChange={v => { if (!v && !del?.confirming) setDel(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir "{del?.nome}"</DialogTitle>
            <DialogDescription>
              {del?.checking && 'Verificando registros afetados...'}
              {!del?.checking && del?.affected && (() => {
                const entries = Object.entries(del.affected).filter(([, v]) => v > 0);
                if (entries.length === 0) return 'Nenhum registro será afetado.';
                return entries.map(([k, v]) => `${v} ${k} ficarão sem ${k.replace(/_/g, ' ')}.`).join(' ');
              })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDel(null)} disabled={del?.confirming}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={del?.checking || del?.confirming}>
              {del?.confirming && <Loader2 className="mr-1 size-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AppLayout>
  );
}
