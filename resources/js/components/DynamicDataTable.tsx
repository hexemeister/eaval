// resources/js/components/DynamicDataTable.jsx

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo, useState } from 'react';

type DynamicDataTableProps = {
  data?: Record<string, unknown>[]; // ? = opcional
  exportFilename?: string;
};

type DataRow = Record<string, unknown>;

const DynamicDataTable = ({ data, exportFilename }: DynamicDataTableProps) => {
  const dataArray = Array.isArray(data) ? data : [];
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Gerar colunas dinamicamente com filtros individuais
  const columnHelper = createColumnHelper<DataRow>();
  const columns = useMemo(() => {
    if (dataArray.length === 0) return [];

    const firstRow = dataArray[0];
    return Object.keys(firstRow).map((key) =>
      columnHelper.accessor(key, {
        header: () => key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        cell: (info) => info.getValue() ?? '',
        meta: {
          filterKey: key,
        },
      }),
    );
  }, [dataArray, columnHelper]);

  const table = useReactTable({
    data: dataArray as DataRow[],
    columns,
    state: {
      globalFilter,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    globalFilterFn: (row, columnId, filterValue) => {
      const cellValue = row.getValue(columnId);
      return String(cellValue).toLowerCase().includes(String(filterValue).toLowerCase());
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    autoResetPageIndex: false,
  });

  // Função para exportar CSV
  const exportToCSV = () => {
    const headers =
      table.getHeaderGroups()[0]?.headers.map((h) => {
        const headerDef = h.column.columnDef.header;
        if (typeof headerDef === 'function') {
          return headerDef(h.getContext());
        }
        return String(headerDef ?? '');
      }) || [];

    const rows = table
      .getPrePaginationRowModel()
      .rows.map((row) => row.getAllCells().map((cell) => `"${String(cell.getValue()).replace(/"/g, '""')}"`));

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const timestamp = new Date().toISOString().replace(/[T]/g, '_').replace(/[:.]/g, '-').slice(0, 19); // Ex: "2025-04-05_14-30-45"
    const filename = `${exportFilename || 'dados'}-${timestamp}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Barra superior: busca global + botão CSV */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <Input
          placeholder="Buscar em todos os campos..."
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(String(e.target.value))}
          className="max-w-sm"
        />
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          Exportar CSV
        </Button>
      </div>

      {/* Indicador de resultados com intervalo */}
      <div className="text-sm text-muted-foreground">
        {(() => {
          const total = table.getFilteredRowModel().rows.length;
          if (total === 0) return 'Nenhum resultado encontrado.';

          const pageSize = table.getState().pagination.pageSize;
          const pageIndex = table.getState().pagination.pageIndex;
          const start = pageIndex * pageSize + 1;
          const end = Math.min(start + pageSize - 1, total);

          return `Exibindo ${start}–${end} de ${total} resultado(s)`;
        })()}
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler() ?? undefined}
                    className={`cursor-pointer select-none ${header.column.getCanSort() ? 'hover:bg-accent' : ''}`}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : header.column.getIsSorted() === 'desc' ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <span className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Controles de paginação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">Linhas por página</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Anterior
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DynamicDataTable;
