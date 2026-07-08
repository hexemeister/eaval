import { PageHelp } from '@/components/page-help';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, Loader2, Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface LookupItem {
  id: number;
  nome: string;
  [key: string]: unknown;
}

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'select';
  options?: { value: string; label: string }[];
  required: boolean;
  width?: number;
}

interface LookupConfig {
  label: string;
  labelPlural: string;
  routePrefix: string;
  fields: FieldConfig[];
  datasetWarning: boolean;
  description?: string;
}

interface DeleteCheckResult {
  affected: { publicacoes: number };
  sample: string[];
}

interface LookupCrudProps {
  items: LookupItem[];
  config: LookupConfig;
  formData?: Record<string, unknown>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function baseUrl(routePrefix: string): string {
  return '/' + routePrefix.replace(/\./g, '/');
}

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

const columnHelper = createColumnHelper<LookupItem>();

// ─── Componente ──────────────────────────────────────────────────────────────

export default function LookupCrud({ items, config }: LookupCrudProps) {
  const base = baseUrl(config.routePrefix);

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Cadastros', href: '#' },
    { title: config.labelPlural, href: base },
  ];

  // ── Estado do formulário ──
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<LookupItem | null>(null);
  const emptyValues = Object.fromEntries(config.fields.map((f) => [f.name, ''])) as Record<string, string>;
  const form = useForm<Record<string, string>>(emptyValues);

  // ── Estado do modal de exclusão ──
  const [pendingDelete, setPendingDelete] = useState<LookupItem | null>(null);
  const [deleteCheck, setDeleteCheck] = useState<DeleteCheckResult | null>(null);
  const [isCheckingDelete, setIsCheckingDelete] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // ── Estado da tabela (TanStack) ──
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 });

  // ── Handlers do formulário ──
  function handleStartCreate() {
    setEditingItem(null);
    form.setData(emptyValues);
    form.clearErrors();
    setShowForm(true);
  }

  function handleStartEdit(item: LookupItem) {
    setEditingItem(item);
    form.setData(Object.fromEntries(config.fields.map((f) => [f.name, String(item[f.name] ?? '')])) as Record<string, string>);
    form.clearErrors();
    setShowForm(true);
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingItem(null);
    form.reset();
    form.clearErrors();
  }

  function handleSubmitForm(e: FormEvent) {
    e.preventDefault();
    const onSuccess = () => {
      setShowForm(false);
      setEditingItem(null);
      form.reset();
    };
    if (editingItem) {
      form.put(`${base}/${editingItem.id}`, { onSuccess });
    } else {
      form.post(base, { onSuccess });
    }
  }

  // ── Handlers de exclusão ──
  async function handleDeleteClick(item: LookupItem) {
    setPendingDelete(item);
    setDeleteCheck(null);
    setIsCheckingDelete(true);
    try {
      const res = await fetch(`${base}/${item.id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json', 'X-XSRF-TOKEN': getCsrfToken() },
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as DeleteCheckResult;
      setDeleteCheck(data);
    } catch {
      setDeleteCheck({ affected: { publicacoes: -1 }, sample: [] });
    } finally {
      setIsCheckingDelete(false);
    }
  }

  function handleDeleteCancel() {
    setPendingDelete(null);
    setDeleteCheck(null);
  }

  function handleDeleteConfirm() {
    if (!pendingDelete) return;
    setIsConfirmingDelete(true);
    router.post(
      `${base}/${pendingDelete.id}/destroy-confirmed`,
      {},
      {
        onFinish: () => {
          setIsConfirmingDelete(false);
          setPendingDelete(null);
          setDeleteCheck(null);
        },
      },
    );
  }

  // ── Colunas TanStack ──
  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        size: 64,
        cell: (info) => <span className="text-muted-foreground">{info.getValue()}</span>,
      }),
      ...config.fields.map((f) =>
        columnHelper.accessor((row) => row[f.name], {
          id: f.name,
          header: f.label,
          size: f.width,
          cell: (info) => String(info.getValue() ?? ''),
        }),
      ),
      columnHelper.display({
        id: 'actions',
        enableSorting: false,
        header: () => <div className="text-right">Ações</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" className="size-7" title="Editar" onClick={() => handleStartEdit(row.original)}>
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-destructive hover:text-destructive"
              title="Excluir"
              onClick={() => handleDeleteClick(row.original)}
              disabled={isCheckingDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.fields, isCheckingDelete],
  );

  const table = useReactTable({
    data: items,
    columns,
    state: { globalFilter, sorting, pagination },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  });

  const deleteModalOpen = pendingDelete !== null && (isCheckingDelete || deleteCheck !== null);
  const affectedCount = deleteCheck?.affected.publicacoes ?? 0;

  // ── Renderização ──────────────────────────────────────────────────────────

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={config.labelPlural} />

      <div className="flex flex-col gap-6">
        {/* Banner de dataset acadêmico */}
        {config.datasetWarning && (
          <Alert className="border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <TriangleAlert className="size-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription>
              Esta tabela faz parte do dataset acadêmico distribuído publicamente. Alterações podem exigir atualização da versão do dataset.
            </AlertDescription>
          </Alert>
        )}

        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{config.labelPlural}</h1>
            <PageHelp text={config.description ?? ''} />
          </div>
          {!showForm && (
            <Button onClick={handleStartCreate} size="sm">
              <Plus className="mr-1 size-4" />
              Novo
            </Button>
          )}
        </div>

        {/* Formulário de criação / edição */}
        {showForm && (
          <form onSubmit={handleSubmitForm} className="rounded-lg border bg-muted/30 p-4">
            <p className="mb-3 text-sm font-medium text-muted-foreground">{editingItem ? `Editar ${config.label}` : `Novo ${config.label}`}</p>
            <div className="flex flex-wrap items-end gap-3">
              {config.fields.map((field) => (
                <div key={field.name} className="flex min-w-[220px] flex-1 flex-col gap-1.5">
                  <Label htmlFor={`field-${field.name}`}>{field.label}</Label>
                  {field.type === 'select' ? (
                    <Select
                      value={form.data[field.name] || '__none__'}
                      onValueChange={(v) => form.setData(field.name, v === '__none__' ? '' : v)}
                      disabled={form.processing}
                    >
                      <SelectTrigger id={`field-${field.name}`} aria-invalid={!!form.errors[field.name]}>
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Nenhum —</SelectItem>
                        {(field.options ?? []).map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={`field-${field.name}`}
                      value={String(form.data[field.name] ?? '')}
                      onChange={(e) => form.setData(field.name, e.target.value)}
                      disabled={form.processing}
                      aria-invalid={!!form.errors[field.name]}
                    />
                  )}
                  {form.errors[field.name] && <p className="text-xs text-destructive">{form.errors[field.name]}</p>}
                </div>
              ))}
              <div className="flex gap-2">
                <Button type="submit" disabled={form.processing} size="sm">
                  {form.processing && <Loader2 className="mr-1 size-4 animate-spin" />}
                  {editingItem ? 'Salvar' : 'Criar'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleCancelForm} disabled={form.processing}>
                  Cancelar
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Busca + contagem */}
        <div className="flex items-center justify-between gap-2">
          <Input
            placeholder={`Buscar ${config.label.toLowerCase()}...`}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-xs"
          />
          <span className="text-xs text-muted-foreground">{table.getFilteredRowModel().rows.length} registro(s)</span>
        </div>

        {/* Tabela */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler() ?? undefined}
                      className={header.column.getCanSort() ? 'cursor-pointer select-none hover:bg-accent' : ''}
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' ? (
                          <ChevronUp className="h-4 w-4 shrink-0" />
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <ChevronDown className="h-4 w-4 shrink-0" />
                        ) : header.column.getCanSort() ? (
                          <span className="h-4 w-4" />
                        ) : null}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Controles de paginação */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Linhas por página</span>
            <Select value={String(table.getState().pagination.pageSize)} onValueChange={(v) => table.setPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de {Math.max(table.getPageCount(), 1)}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Próxima
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={deleteModalOpen} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {config.label}</DialogTitle>
            <DialogDescription asChild>
              <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1 text-sm">
                {isCheckingDelete ? (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Verificando publicações afetadas…
                  </p>
                ) : deleteCheck ? (
                  <>
                    <p>
                      {affectedCount > 0 ? (
                        <>
                          <strong>{affectedCount}</strong> publicaç{affectedCount === 1 ? 'ão ficará' : 'ões ficarão'} sem{' '}
                          <strong>{config.label}</strong>.
                        </>
                      ) : (
                        <>Nenhuma publicação será afetada.</>
                      )}{' '}
                      <br />
                      Deseja excluir <strong>"{pendingDelete?.nome}"</strong>?
                    </p>
                    {affectedCount > 0 && deleteCheck.sample.length > 0 && (
                      <ul className="list-disc pl-5 text-muted-foreground">
                        {deleteCheck.sample.map((title, i) => (
                          <li key={i} className="break-words">
                            {title}
                          </li>
                        ))}
                        {affectedCount > deleteCheck.sample.length && <li className="italic">e mais {affectedCount - deleteCheck.sample.length}…</li>}
                      </ul>
                    )}
                    {affectedCount > 0 && (
                      <p className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
                        <TriangleAlert className="size-4 shrink-0 text-amber-500" />
                        Uma notificação será criada para que esses dados possam ser revisados.
                      </p>
                    )}
                  </>
                ) : null}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel} disabled={isConfirmingDelete}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isCheckingDelete || isConfirmingDelete}>
              {isConfirmingDelete && <Loader2 className="mr-1 size-4 animate-spin" />}
              Confirmar exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
