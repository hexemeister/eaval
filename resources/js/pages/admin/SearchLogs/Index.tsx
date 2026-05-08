import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

interface SearchLog {
  id: number;
  query: string;
  filters: Record<string, unknown>;
  results_count: number;
  execution_time_ms: number;
  ip_address: string;
  created_at: string;
  error: string | null;
}

interface PaginationProps<T> {
  data: T[];
  links: unknown[];
  meta: unknown;
  current_page: number;
  last_page: number;
  total: number;
}

interface Props {
  logs: PaginationProps<SearchLog>;
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: dashboard().url,
  },
  {
    title: 'Logs de Busca',
    href: '/admin/logs',
  },
];

export default function SearchLogsIndex({ logs }: Props) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Logs de Busca" />

      <div className="container mx-auto py-6">
        <h1 className="mb-6 text-2xl font-bold">Logs de Auditoria de Busca</h1>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Query</TableHead>
                <TableHead>Resultados</TableHead>
                <TableHead>Tempo (ms)</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.data.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</TableCell>
                  <TableCell className="max-w-xs truncate font-mono text-xs" title={log.query}>
                    {log.query || '(vazia)'}
                  </TableCell>
                  <TableCell>{log.results_count}</TableCell>
                  <TableCell>{log.execution_time_ms.toFixed(2)}</TableCell>
                  <TableCell className="text-xs">{log.ip_address}</TableCell>
                  <TableCell>
                    {log.error ? (
                      <span className="text-red-500" title={log.error}>Erro</span>
                    ) : (
                      <span className="text-green-500">Sucesso</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
            Total de {logs.total} buscas registradas.
        </div>
      </div>
    </AppLayout>
  );
}
