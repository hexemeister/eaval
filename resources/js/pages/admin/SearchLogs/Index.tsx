import { Badge } from '@/components/ui/badge';
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
  error: string | null;
  created_at: string;
  user?: {
    name: string;
  };
}

interface PaginationProps<T> {
  data: T[];
  links: unknown[];
  meta: unknown;
}

interface SearchLogsProps {
  logs: PaginationProps<SearchLog>;
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: dashboard().url,
  },
  {
    title: 'Logs de Busca',
    href: '/admin/search-logs',
  },
];

export default function SearchLogsIndex({ logs }: SearchLogsProps) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Logs de Busca" />

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Logs de Busca</h1>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Query</TableHead>
                <TableHead>Resultados</TableHead>
                <TableHead>Tempo (ms)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.data.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</TableCell>
                  <TableCell className="max-w-[300px] truncate font-mono text-xs" title={log.query}>
                    {log.query || <span className="text-muted-foreground italic">Vazia</span>}
                  </TableCell>
                  <TableCell>{log.results_count}</TableCell>
                  <TableCell>{log.execution_time_ms.toFixed(2)}</TableCell>
                  <TableCell>
                    {log.error ? (
                      <Badge variant="destructive">Erro</Badge>
                    ) : (
                      <Badge variant="outline" className="border-green-500 text-green-500">
                        Sucesso
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.ip_address}</TableCell>
                </TableRow>
              ))}
              {logs.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhum log encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
