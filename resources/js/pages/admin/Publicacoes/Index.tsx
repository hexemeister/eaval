import { useMemo, useState } from 'react';
import { PageHelp } from '@/components/page-help';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Download, Plus } from 'lucide-react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type FilterFn,
  type SortingState,
  type PaginationState,
} from '@tanstack/react-table';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Publicacao {
  id: number;
  title: string | null;
  authors: string;
  year: string | number;
  tipo: string | null;
  doi: string | null;
  isbn: string | null;
}

interface PublicationsProps {
  publicacoes: Publicacao[];
  pageDescription?: string;
}

// ─── Utilitários ─────────────────────────────────────────────────────────────

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

const accentInsensitiveFilter: FilterFn<Publicacao> = (row, columnId, filterValue: string) => {
  const cellValue = String(row.getValue(columnId) ?? '');
  return normalizeText(cellValue).includes(normalizeText(filterValue));
};

accentInsensitiveFilter.autoRemove = (val: unknown) => !val;

// ─── Config ───────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: dashboard().url },
  { title: 'Publicações', href: '/admin/publicacoes' },
];

const columnHelper = createColumnHelper<Publicacao>();

// ─── Componente ──────────────────────────────────────────────────────────────

export default function PublicationsIndex({ publicacoes, pageDescription = '' }: PublicationsProps) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'id', desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const canMerge = selectedIds.size === 2;

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        size: 40,
        enableSorting: false,
        header: () => null,
        cell: ({ row }) => {
          const checked = selectedIds.has(row.original.id);
          const disabled = selectedIds.size === 2 && !checked;
          return (
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={() => toggleSelect(row.original.id)}
              className="size-4 accent-primary disabled:cursor-not-allowed disabled:opacity-30"
            />
          );
        },
      }),
      columnHelper.accessor('id', {
        header: 'ID',
        size: 70,
        cell: (info) => <span className="font-medium text-muted-foreground">{info.getValue()}</span>,
      }),
      columnHelper.accessor('title', {
        header: 'Título',
        filterFn: accentInsensitiveFilter,
      }),
      columnHelper.accessor('authors', {
        header: 'Autores',
        filterFn: accentInsensitiveFilter,
      }),
      columnHelper.accessor('year', {
        header: 'Ano',
        size: 75,
      }),
      columnHelper.accessor('tipo', {
        header: 'Tipo',
        size: 130,
        cell: (info) => info.getValue() ?? <span className="text-muted-foreground">—</span>,
        filterFn: accentInsensitiveFilter,
      }),
      columnHelper.accessor('doi', {
        header: 'DOI',
        size: 120,
        cell: (info) => {
          const v = info.getValue();
          return v ? (
            <a href={`https://doi.org/${v}`} target="_blank" rel="noreferrer" className="underline hover:text-primary">
              {v}
            </a>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        enableSorting: false,
        header: () => <div className="text-right">Ações</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/admin/publicacoes/${row.original.id}/edit`}>Editar</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm(`Criar uma cópia de "${row.original.title}"?`)) {
                  router.post(`/admin/publicacoes/${row.original.id}/clone`);
                }
              }}
            >
              Clonar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                if (confirm('Excluir esta publicação? Esta ação não pode ser desfeita.')) {
                  router.delete(`/admin/publicacoes/${row.original.id}`);
                }
              }}
            >
              Excluir
            </Button>
          </div>
        ),
      }),
    ],
    [selectedIds],
  );

  const table = useReactTable({
    data: publicacoes,
    columns,
    state: { globalFilter, sorting, pagination },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: accentInsensitiveFilter,
    autoResetPageIndex: false,
  });

  function exportToCSV() {
    const headers = ['ID', 'Título', 'Autores', 'Ano', 'Tipo', 'DOI'];
    const rows = table
      .getPrePaginationRowModel()
      .rows.map((row) => [
        row.original.id,
        `"${String(row.original.title ?? '').replace(/"/g, '""')}"`,
        `"${String(row.original.authors ?? '').replace(/"/g, '""')}"`,
        row.original.year,
        `"${String(row.original.tipo ?? '').replace(/"/g, '""')}"`,
        row.original.doi ?? '',
      ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `publicacoes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const start = pageIndex * pageSize + 1;
  const end = Math.min(start + pageSize - 1, filteredCount);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Publicações Científicas" />

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Publicações Científicas</h1>
            <PageHelp text={pageDescription} />
          </div>
          <div className="flex gap-2">
            <Button asChild variant="default" size="sm">
              <Link href="/admin/publicacoes/create">
                <Plus className="mr-1 size-4" />
                Nova publicação
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canMerge}
              title={!canMerge ? 'Selecione exatamente 2 publicações para mesclar.' : undefined}
              onClick={() => {
                const [id1, id2] = [...selectedIds];
                router.get('/admin/publicacoes/merge', { ids: [id1, id2] });
              }}
            >
              Mesclar selecionadas
            </Button>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="mr-1 size-4" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Busca + contagem */}
        <div className="flex items-center justify-between gap-2">
          <Input
            placeholder="Buscar em todos os campos..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
          <span className="text-xs text-muted-foreground">
            {filteredCount === 0
              ? 'Nenhum resultado.'
              : `Exibindo ${start}–${end} de ${filteredCount} resultado(s)`}
          </span>
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
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    Nenhuma publicação encontrada.
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
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[20, 50, 100, 200].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm text-muted-foreground">
            Página {pageIndex + 1} de {Math.max(table.getPageCount(), 1)}
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
    </AppLayout>
  );
}
