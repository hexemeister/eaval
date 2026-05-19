import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type PaginationState,
} from '@tanstack/react-table';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Publicacao {
  id: number;
  title: string;
  authors: string;
  year: string | number;
}

interface PublicationsProps {
  publicacoes: Publicacao[];
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: dashboard().url },
  { title: 'Publicações', href: '/admin/publicacoes' },
];

const columnHelper = createColumnHelper<Publicacao>();

// ─── Componente ──────────────────────────────────────────────────────────────

export default function PublicationsIndex({ publicacoes }: PublicationsProps) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        size: 80,
        cell: (info) => <span className="font-medium text-muted-foreground">{info.getValue()}</span>,
      }),
      columnHelper.accessor('title', {
        header: 'Título',
      }),
      columnHelper.accessor('authors', {
        header: 'Autores',
      }),
      columnHelper.accessor('year', {
        header: 'Ano',
        size: 90,
      }),
      columnHelper.display({
        id: 'actions',
        enableSorting: false,
        header: () => <div className="text-right">Ações</div>,
        cell: () => (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" disabled>
              Abrir
            </Button>
            <Button variant="ghost" size="sm" disabled>
              Editar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled
            >
              Excluir
            </Button>
          </div>
        ),
      }),
    ],
    [],
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
    autoResetPageIndex: false,
  });

  function exportToCSV() {
    const headers = ['ID', 'Título', 'Autores', 'Ano'];
    const rows = table
      .getPrePaginationRowModel()
      .rows.map((row) => [
        row.original.id,
        `"${String(row.original.title ?? '').replace(/"/g, '""')}"`,
        `"${String(row.original.authors ?? '').replace(/"/g, '""')}"`,
        row.original.year,
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
          <h1 className="text-2xl font-bold">Publicações Científicas</h1>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="mr-1 size-4" />
            Exportar CSV
          </Button>
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
