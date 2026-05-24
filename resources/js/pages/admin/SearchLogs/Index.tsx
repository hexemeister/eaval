import { useRef, useState } from 'react';
import { PageHelp } from '@/components/page-help';
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
import { Download, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface SearchLog {
  id: number;
  query: string;
  filters?: { url?: string; [key: string]: unknown };
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
  pageDescription?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: dashboard().url },
  { title: 'Logs de Busca', href: '/admin/search-logs' },
];

// ─── Componente ──────────────────────────────────────────────────────────────

export default function SearchLogsIndex({ logs, total, filters, pageDescription = '' }: SearchLogsProps) {
  const [searchValue, setSearchValue] = useState(filters.search);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showCleanup, setShowCleanup] = useState(false);
  const [cleanupDays, setCleanupDays] = useState('30');
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [confirming, setConfirming] = useState(false);

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      router.get('/admin/search-logs', { search: value }, { preserveState: true, replace: true });
    }, 350);
  }

  function handleExport() {
    if (total === 0) {
      toast.warning('Não há logs para exportar.');
      return;
    }
    if (logs.total === 0) {
      toast.warning('Nenhum log corresponde ao filtro atual.');
      return;
    }
    const url = `/admin/search-logs/export${filters.search ? `?search=${encodeURIComponent(filters.search)}` : ''}`;
    window.location.href = url;
  }

  function handleCleanupRequest() {
    setConfirming(true);
  }

  function handleCleanupConfirm() {
    setIsCleaningUp(true);
    const url = cleanupDays === 'all' ? '/admin/search-logs/truncate' : '/admin/search-logs/cleanup';
    const data = cleanupDays === 'all' ? {} : { days: cleanupDays };
    router.post(url, data, {
      onFinish: () => {
        setIsCleaningUp(false);
        setConfirming(false);
        setShowCleanup(false);
      },
    });
  }

  function handleCleanupClose() {
    setShowCleanup(false);
    setConfirming(false);
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Logs de Busca" />

      <div className="flex flex-col gap-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Logs de Busca</h1>
            <PageHelp text={pageDescription} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-1 size-4" />
              Exportar CSV
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowCleanup(true)}>
              <Trash2 className="mr-1 size-4" />
              Limpar logs antigos
            </Button>
          </div>
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
                <TableHead className="w-36 shrink-0">Data/Hora</TableHead>
                <TableHead>Query</TableHead>
                <TableHead className="w-20 text-right">Resultados</TableHead>
                <TableHead className="w-24 text-right">Tempo (ms)</TableHead>
                <TableHead className="w-20">Status</TableHead>
                <TableHead className="w-28">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.data.length > 0 ? (
                logs.data.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="w-36 whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="break-all font-mono text-xs">
                      {log.filters?.url ? (
                        <a href={log.filters.url} target="_blank" rel="noreferrer" className="underline hover:text-foreground">
                          {log.filters.url}
                        </a>
                      ) : log.query ?? (
                        <span className="italic text-muted-foreground">Vazia</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{log.results_count}</TableCell>
                    <TableCell className="text-right">
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

      {/* Dialog: Limpar logs */}
      <Dialog open={showCleanup} onOpenChange={(open) => { if (!open) handleCleanupClose(); }}>
        <DialogContent>
          {!confirming ? (
            <>
              <DialogHeader>
                <DialogTitle>Limpar logs</DialogTitle>
                <DialogDescription>
                  Selecione o período dos logs a remover permanentemente.
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
                    <SelectItem value="all">Todos os logs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleCleanupClose}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleCleanupRequest}>
                  {cleanupDays === 'all' ? 'Remover tudo' : 'Remover'}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Confirmar remoção</DialogTitle>
                <DialogDescription>
                  {cleanupDays === 'all'
                    ? 'Todos os logs serão removidos permanentemente. Esta ação não pode ser desfeita.'
                    : `Os logs com mais de ${cleanupDays} dias serão removidos permanentemente. Esta ação não pode ser desfeita.`}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirming(false)} disabled={isCleaningUp}>
                  Voltar
                </Button>
                <Button variant="destructive" onClick={handleCleanupConfirm} disabled={isCleaningUp}>
                  {isCleaningUp && <Loader2 className="mr-1 size-4 animate-spin" />}
                  Confirmar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
