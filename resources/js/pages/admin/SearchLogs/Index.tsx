import { useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Loader2, Trash2 } from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface SearchLog {
  id: number;
  query: string;
  results_count: number;
  execution_time_ms: number | null;
  ip_address: string;
  error: string | null;
  created_at: string;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface PaginatedLogs {
  data: SearchLog[];
  links: PaginationLink[];
  current_page: number;
  last_page: number;
  total: number;
}

interface SearchLogsProps {
  logs: PaginatedLogs;
  total: number;
  filters: { search: string };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: dashboard().url },
  { title: 'Logs de Busca', href: '/admin/search-logs' },
];

// ─── Componente ──────────────────────────────────────────────────────────────

export default function SearchLogsIndex({ logs, total, filters }: SearchLogsProps) {
  const [searchValue, setSearchValue] = useState(filters.search);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showCleanup, setShowCleanup] = useState(false);
  const [cleanupDays, setCleanupDays] = useState('30');
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      router.get('/admin/search-logs', { search: value }, { preserveState: true, replace: true });
    }, 350);
  }

  function handleCleanup() {
    setIsCleaningUp(true);
    router.post(
      '/admin/search-logs/cleanup',
      { days: cleanupDays },
      {
        onFinish: () => {
          setIsCleaningUp(false);
          setShowCleanup(false);
        },
      },
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Logs de Busca" />

      <div className="flex flex-col gap-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Logs de Busca</h1>
          <Button variant="destructive" size="sm" onClick={() => setShowCleanup(true)}>
            <Trash2 className="mr-1 size-4" />
            Limpar logs antigos
          </Button>
        </div>

        {/* Filtro + contagem */}
        <div className="flex items-center justify-between gap-2">
          <Input
            placeholder="Filtrar por query..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-xs"
          />
          <span className="text-xs text-muted-foreground">
            {logs.total} resultado(s) filtrado(s) · {total} log(s) no total
          </span>
        </div>

        {/* Tabela */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Query</TableHead>
                <TableHead className="w-24">Resultados</TableHead>
                <TableHead className="w-24">Tempo (ms)</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-32">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.data.length > 0 ? (
                logs.data.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate font-mono text-xs" title={log.query}>
                      {log.query || <span className="italic text-muted-foreground">Vazia</span>}
                    </TableCell>
                    <TableCell>{log.results_count}</TableCell>
                    <TableCell>
                      {log.execution_time_ms != null ? log.execution_time_ms.toFixed(2) : '—'}
                    </TableCell>
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhum log encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {logs.last_page > 1 && (
          <div className="flex justify-center gap-1">
            {logs.links.map((link, i) => (
              <Button
                key={i}
                variant={link.active ? 'default' : 'outline'}
                size="sm"
                disabled={!link.url}
                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                dangerouslySetInnerHTML={{ __html: link.label }}
                className="min-w-9"
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialog: Limpar logs antigos */}
      <Dialog open={showCleanup} onOpenChange={setShowCleanup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limpar logs antigos</DialogTitle>
            <DialogDescription>
              Remove permanentemente os logs com data anterior ao período selecionado.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Select value={cleanupDays} onValueChange={setCleanupDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Mais antigos que 30 dias</SelectItem>
                <SelectItem value="60">Mais antigos que 60 dias</SelectItem>
                <SelectItem value="90">Mais antigos que 90 dias</SelectItem>
                <SelectItem value="180">Mais antigos que 180 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCleanup(false)} disabled={isCleaningUp}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleCleanup} disabled={isCleaningUp}>
              {isCleaningUp && <Loader2 className="mr-1 size-4 animate-spin" />}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
