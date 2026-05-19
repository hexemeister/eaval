import { useState, useRef, FormEvent } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type BreadcrumbItem } from '@/types';
import { ArrowUpAZ, ArrowDownAZ, Pencil, Trash2, Plus, TriangleAlert, Loader2 } from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface LookupItem {
  id: number;
  nome: string;
  [key: string]: unknown;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface PaginatedData<T> {
  data: T[];
  links: PaginationLink[];
  current_page: number;
  last_page: number;
  total: number;
}

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'select';
  options?: { value: string; label: string }[];
  required: boolean;
}

interface LookupConfig {
  label: string;
  labelPlural: string;
  routePrefix: string;
  fields: FieldConfig[];
  datasetWarning: boolean;
}

interface DeleteCheckResult {
  affected: { publicacoes: number };
  sample: string[];
}

interface LookupCrudProps {
  items: PaginatedData<LookupItem>;
  config: LookupConfig;
  formData?: Record<string, unknown>;
  filters: { search: string; order: 'asc' | 'desc' };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Converte o prefixo de rota (ex: admin.cadastros.segmentos-educacionais) em URL base. */
function baseUrl(routePrefix: string): string {
  return '/' + routePrefix.replace(/\./g, '/');
}

/** Lê o token CSRF do cookie XSRF-TOKEN (necessário para chamadas fetch diretas). */
function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function LookupCrud({ items, config, filters }: LookupCrudProps) {
  const base = baseUrl(config.routePrefix);

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Cadastros', href: '#' },
    { title: config.labelPlural, href: base },
  ];

  // ── Estado do formulário de criação/edição ──
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<LookupItem | null>(null);
  const form = useForm<{ nome: string }>({ nome: '' });

  // ── Estado do modal de exclusão ──
  const [pendingDelete, setPendingDelete] = useState<LookupItem | null>(null);
  const [deleteCheck, setDeleteCheck] = useState<DeleteCheckResult | null>(null);
  const [isCheckingDelete, setIsCheckingDelete] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // ── Busca com debounce ──
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchValue, setSearchValue] = useState(filters.search);

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      router.get(base, { search: value, order: filters.order }, { preserveState: true, replace: true });
    }, 350);
  }

  function handleOrderToggle() {
    const next = filters.order === 'asc' ? 'desc' : 'asc';
    router.get(base, { search: filters.search, order: next }, { preserveState: true, replace: true });
  }

  // ── Formulário de criação ──
  function handleStartCreate() {
    setEditingItem(null);
    form.setData('nome', '');
    form.clearErrors();
    setShowForm(true);
  }

  // ── Formulário de edição ──
  function handleStartEdit(item: LookupItem) {
    setEditingItem(item);
    form.setData('nome', item.nome);
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

  // ── Exclusão — verificação preflight ──
  async function handleDeleteClick(item: LookupItem) {
    setPendingDelete(item);
    setDeleteCheck(null);
    setIsCheckingDelete(true);

    try {
      const res = await fetch(`${base}/${item.id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'X-XSRF-TOKEN': getCsrfToken(),
        },
      });
      if (!res.ok) throw new Error('Erro ao verificar afetados.');
      const data = (await res.json()) as DeleteCheckResult;
      setDeleteCheck(data);
    } catch {
      // em caso de erro, abre o modal sem contagem (usuário pode cancelar)
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

  // ── Renderização ──────────────────────────────────────────────────────────

  const deleteModalOpen = pendingDelete !== null && (isCheckingDelete || deleteCheck !== null);
  const affectedCount = deleteCheck?.affected.publicacoes ?? 0;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={config.labelPlural} />

      <div className="flex flex-col gap-6">

        {/* Banner de dataset acadêmico */}
        {config.datasetWarning && (
          <Alert className="border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <TriangleAlert className="size-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription>
              Esta tabela faz parte do dataset acadêmico distribuído publicamente. Alterações podem
              exigir atualização da versão do dataset.
            </AlertDescription>
          </Alert>
        )}

        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{config.labelPlural}</h1>
          {!showForm && (
            <Button onClick={handleStartCreate} size="sm">
              <Plus className="mr-1 size-4" />
              Novo
            </Button>
          )}
        </div>

        {/* Formulário de criação / edição */}
        {showForm && (
          <form
            onSubmit={handleSubmitForm}
            className="rounded-lg border bg-muted/30 p-4"
          >
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              {editingItem ? `Editar ${config.label}` : `Novo ${config.label}`}
            </p>

            <div className="flex flex-wrap items-end gap-3">
              {config.fields.map((field) => (
                <div key={field.name} className="flex min-w-[220px] flex-1 flex-col gap-1.5">
                  <Label htmlFor={`field-${field.name}`}>{field.label}</Label>
                  <Input
                    id={`field-${field.name}`}
                    value={String(form.data[field.name as keyof typeof form.data] ?? '')}
                    onChange={(e) => form.setData(field.name as keyof typeof form.data, e.target.value)}
                    disabled={form.processing}
                    aria-invalid={!!form.errors[field.name as keyof typeof form.errors]}
                  />
                  {form.errors[field.name as keyof typeof form.errors] && (
                    <p className="text-xs text-destructive">
                      {form.errors[field.name as keyof typeof form.errors]}
                    </p>
                  )}
                </div>
              ))}

              <div className="flex gap-2">
                <Button type="submit" disabled={form.processing} size="sm">
                  {form.processing && <Loader2 className="mr-1 size-4 animate-spin" />}
                  {editingItem ? 'Salvar' : 'Criar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelForm}
                  disabled={form.processing}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Busca e ordenação */}
        <div className="flex items-center gap-2">
          <Input
            placeholder={`Buscar ${config.label.toLowerCase()}...`}
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-xs"
          />
          <Button variant="outline" size="sm" onClick={handleOrderToggle} title="Alternar ordenação">
            {filters.order === 'asc' ? (
              <ArrowUpAZ className="size-4" />
            ) : (
              <ArrowDownAZ className="size-4" />
            )}
            <span className="ml-1 text-xs">{filters.order === 'asc' ? 'A→Z' : 'Z→A'}</span>
          </Button>
          {items.total > 0 && (
            <span className="text-xs text-muted-foreground">{items.total} registro(s)</span>
          )}
        </div>

        {/* Tabela */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                {config.fields.map((f) => (
                  <TableHead key={f.name}>{f.label}</TableHead>
                ))}
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">{item.id}</TableCell>
                  {config.fields.map((f) => (
                    <TableCell key={f.name}>{String(item[f.name] ?? '')}</TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        title="Editar"
                        onClick={() => handleStartEdit(item)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        title="Excluir"
                        onClick={() => handleDeleteClick(item)}
                        disabled={isCheckingDelete}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {items.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={config.fields.length + 2} className="h-24 text-center text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {items.last_page > 1 && (
          <div className="flex justify-center gap-1">
            {items.links.map((link, i) => (
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

      {/* Modal de confirmação de exclusão */}
      <Dialog open={deleteModalOpen} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {config.label}</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-sm">
                {isCheckingDelete ? (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Verificando publicações afetadas…
                  </p>
                ) : deleteCheck && affectedCount > 0 ? (
                  <>
                    <p>
                      <strong>{affectedCount}</strong> publicaç{affectedCount === 1 ? 'ão ficará' : 'ões ficarão'} sem{' '}
                      <strong>{config.label}</strong> após a exclusão de{' '}
                      <strong>"{pendingDelete?.nome}"</strong>.
                    </p>
                    {deleteCheck.sample.length > 0 && (
                      <ul className="list-disc pl-5 text-muted-foreground">
                        {deleteCheck.sample.map((title, i) => (
                          <li key={i} className="truncate">{title}</li>
                        ))}
                        {affectedCount > deleteCheck.sample.length && (
                          <li className="italic">e mais {affectedCount - deleteCheck.sample.length}…</li>
                        )}
                      </ul>
                    )}
                    <p className="text-muted-foreground">
                      Uma notificação será criada para que os dados possam ser revisados.
                    </p>
                  </>
                ) : (
                  <p>
                    Deseja excluir <strong>"{pendingDelete?.nome}"</strong>? Esta ação não pode ser
                    desfeita.
                  </p>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel} disabled={isConfirmingDelete}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isCheckingDelete || isConfirmingDelete}
            >
              {isConfirmingDelete && <Loader2 className="mr-1 size-4 animate-spin" />}
              Confirmar exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
