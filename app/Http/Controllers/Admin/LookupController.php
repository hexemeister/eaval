<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Publicacao;
use App\Models\User;
use App\Notifications\LookupItemDeleted;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Controller base abstrato para todos os CRUDs de lookup.
 *
 * Fornece as 5 actions (index, store, update, destroy, destroyConfirmed)
 * com lógica genérica de filtragem, validação, deleção segura e notificação.
 * Cada subclasse declara sua configuração via métodos abstratos e opcionais.
 *
 * Fluxo de exclusão em 2 etapas:
 *   1. DELETE /{id}      → retorna JSON com contagem de afetados (não deleta)
 *   2. POST  /{id}/destroy-confirmed → executa NULL + deleção + notificação
 */
abstract class LookupController extends Controller
{
    // ─── Métodos abstratos (obrigatórios em cada subclasse) ─────────────────

    /**
     * FQCN do model Eloquent gerenciado por este controller.
     *
     * @return class-string<Model>
     */
    abstract protected function model(): string;

    /**
     * Label legível no singular (ex: "Segmento Educacional").
     * Usado em mensagens de sucesso/erro e no config enviado ao React.
     */
    abstract protected function label(): string;

    // ─── Métodos com defaults (sobrescreva quando necessário) ────────────────

    /**
     * Label no plural (ex: "Segmentos Educacionais").
     * O padrão adiciona 's'; sobrescreva para casos irregulares.
     */
    protected function labelPlural(): string
    {
        return $this->label() . 's';
    }

    /**
     * Coluna de "nome" no model (ex: 'nome' para a maioria, 'classificacao' para QualisCape).
     * Afeta store, update, validação e storeInline.
     */
    protected function nameColumn(): string
    {
        return 'nome';
    }

    /**
     * Modo de vínculo com publicações.
     *
     * - 'fk'    → campo FK direto em publicacao (padrão)
     * - 'pivot' → M:N via tabela pivot
     */
    protected function bindingMode(): string
    {
        return 'fk';
    }

    /**
     * Nome do campo FK em publicacao (ex: 'segmento_educacional_id').
     * Necessário quando bindingMode() === 'fk'.
     */
    protected function publicacaoFkColumn(): ?string
    {
        return null;
    }

    /**
     * Nome da tabela pivot para relações M:N (ex: 'area_publicacao').
     * Necessário quando bindingMode() === 'pivot'.
     */
    protected function pivotTable(): ?string
    {
        return null;
    }

    /**
     * Nome da coluna FK do lado do lookup na tabela pivot (ex: 'area_id').
     * Derivado automaticamente do nome da tabela do model; sobrescreva se necessário.
     */
    protected function pivotFkColumn(): string
    {
        return \Illuminate\Support\Str::singular(app($this->model())->getTable()) . '_id';
    }

    /**
     * Dados extras passados ao formulário React (ex: lista de países para select de região).
     *
     * @return array<string, mixed>
     */
    protected function formData(): array
    {
        return [];
    }

    /**
     * Se true, exibe banner de aviso de dataset acadêmico na página.
     * Deve ser true para tabelas incluídas no dataset distribuído publicamente.
     */
    protected function datasetWarning(): bool
    {
        return false;
    }

    /**
     * Configuração dos campos do formulário React.
     * Sobrescreva para adicionar campos além de 'nome' (ex: 'sigla' nas tabelas geográficas).
     *
     * @return array<int, array<string, mixed>>
     */
    protected function fields(): array
    {
        return [
            ['name' => 'nome', 'label' => 'Nome', 'type' => 'text', 'required' => true],
        ];
    }

    // ─── Actions públicas (rotas) ────────────────────────────────────────────

    /**
     * Lista os registros com filtro por nome e ordenação.
     *
     * Query params aceitos:
     *   - search (string): filtra por nome (LIKE %...%)
     *   - order  ('asc'|'desc'): ordenação pelo nome (default: 'asc')
     */
    public function index(Request $request): Response
    {
        $modelClass = $this->model();
        $items = $modelClass::query()->orderBy('id')->get();

        return Inertia::render('admin/cadastros/LookupCrud', [
            'items'    => $items,
            'config'   => $this->buildConfig($request),
            'formData' => $this->formData(),
        ]);
    }

    /**
     * Cria um novo registro.
     * Valida unicidade de nome na tabela do model.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate($this->validationRules(), $this->validationMessages());

        $col = $this->nameColumn();
        $modelClass = $this->model();
        $modelClass::create([$col => $request->string($col)->trim()]);

        return back()->with('success', "{$this->label()} criado com sucesso.");
    }

    /**
     * Cria um registro via AJAX (para o CreatableSelect do formulário de publicação).
     * Recebe { value: string } e retorna { id, value }.
     */
    public function storeInline(Request $request): JsonResponse
    {
        $table = app($this->model())->getTable();
        $col   = $this->nameColumn();

        $validated = $request->validate([
            'value' => ['required', 'string', 'max:255', Rule::unique($table, $col)],
        ], [
            'value.required' => 'O campo nome é obrigatório.',
            'value.unique'   => 'Este nome já está cadastrado.',
        ]);

        $modelClass = $this->model();
        $record     = $modelClass::create([$col => trim($validated['value'])]);

        return response()->json(['id' => $record->id, 'value' => $record->$col]);
    }

    /**
     * Atualiza um registro existente.
     * A regra de unicidade ignora o próprio registro (permite salvar sem mudar o nome).
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $request->validate($this->validationRules($id), $this->validationMessages());

        $col = $this->nameColumn();
        $modelClass = $this->model();
        $record = $modelClass::findOrFail($id);
        $record->update([$col => $request->string($col)->trim()]);

        return back()->with('success', "{$this->label()} atualizado com sucesso.");
    }

    /**
     * Retorna a contagem de publicações afetadas pela exclusão, sem deletar.
     *
     * O frontend usa este endpoint para popular o modal de confirmação antes
     * de chamar destroyConfirmed. Sempre retorna JSON.
     */
    public function destroy(int $id): JsonResponse
    {
        $modelClass = $this->model();
        $modelClass::findOrFail($id); // garante 404 se não existir

        $count  = $this->countAffected($id);
        $sample = $this->sampleAffected($id);

        return response()->json([
            'affected' => ['publicacoes' => $count],
            'sample'   => $sample,
        ]);
    }

    /**
     * Executa a exclusão confirmada:
     *   1. Seta NULL nas publicações afetadas
     *   2. Deleta o registro
     *   3. Cria notificação se houver afetados
     */
    public function destroyConfirmed(int $id): RedirectResponse
    {
        $col        = $this->nameColumn();
        $modelClass = $this->model();
        $record     = $modelClass::findOrFail($id);
        $nome       = $record->$col;
        $count  = $this->countAffected($id);

        DB::transaction(function () use ($record, $id): void {
            $this->nullifyRelated($id);
            $record->delete();
        });

        if ($count > 0) {
            $this->notifyAllUsers($count, $nome);
        }

        return back()->with('success', "{$this->label()} excluído.");
    }

    // ─── Helpers privados ────────────────────────────────────────────────────

    /**
     * Conta quantas publicações ficarão sem valor ao excluir o registro $id.
     */
    private function countAffected(int $id): int
    {
        if ($this->bindingMode() === 'pivot' && $this->pivotTable()) {
            return DB::table($this->pivotTable())
                ->where($this->pivotFkColumn(), $id)
                ->count();
        }

        if ($this->publicacaoFkColumn()) {
            return Publicacao::where($this->publicacaoFkColumn(), $id)->count();
        }

        return 0;
    }

    /**
     * Retorna até 5 títulos de publicações afetadas para exibição no modal.
     *
     * @return array<int, string|null>
     */
    private function sampleAffected(int $id): array
    {
        if ($this->bindingMode() === 'pivot' && $this->pivotTable()) {
            return DB::table($this->pivotTable())
                ->join('publicacao', 'publicacao.id', '=', $this->pivotTable() . '.publicacao_id')
                ->where($this->pivotTable() . '.' . $this->pivotFkColumn(), $id)
                ->limit(5)
                ->pluck('publicacao.titulo')
                ->toArray();
        }

        if ($this->publicacaoFkColumn()) {
            return Publicacao::where($this->publicacaoFkColumn(), $id)
                ->limit(5)
                ->pluck('titulo')
                ->toArray();
        }

        return [];
    }

    /**
     * Seta NULL nas publicações relacionadas antes de deletar o registro.
     * Para M:N (pivot), remove os registros da tabela pivot.
     */
    private function nullifyRelated(int $id): void
    {
        if ($this->bindingMode() === 'pivot' && $this->pivotTable()) {
            DB::table($this->pivotTable())->where($this->pivotFkColumn(), $id)->delete();
            return;
        }

        if ($this->publicacaoFkColumn()) {
            Publicacao::where($this->publicacaoFkColumn(), $id)
                ->update([$this->publicacaoFkColumn() => null]);
        }
    }

    /**
     * Envia notificação de exclusão para todos os usuários cadastrados.
     *
     * @param int    $count Quantidade de publicações afetadas
     * @param string $nome  Nome do registro excluído
     */
    private function notifyAllUsers(int $count, string $nome): void
    {
        $notification = new LookupItemDeleted($this->label(), $nome, $count);

        User::all()->each(fn (User $user) => $user->notify($notification));
    }

    /**
     * Regras de validação para store e update.
     * Em update, $ignoreId é passado para ignorar o próprio registro na checagem de unicidade.
     *
     * @return array<string, mixed>
     */
    private function validationRules(?int $ignoreId = null): array
    {
        $table = app($this->model())->getTable();
        $col   = $this->nameColumn();

        return [
            $col => [
                'required',
                'string',
                'max:255',
                Rule::unique($table, $col)->ignore($ignoreId),
            ],
        ];
    }

    /**
     * Mensagens de validação em português.
     *
     * @return array<string, string>
     */
    private function validationMessages(): array
    {
        $col = $this->nameColumn();

        return [
            "{$col}.required" => 'O campo nome é obrigatório.',
            "{$col}.string"   => 'O nome deve ser um texto.',
            "{$col}.max"      => 'O nome não pode ter mais de :max caracteres.',
            "{$col}.unique"   => 'Este nome já está cadastrado.',
        ];
    }

    /**
     * Monta o array de configuração enviado ao componente React LookupCrud.
     *
     * @return array<string, mixed>
     */
    private function buildConfig(Request $request): array
    {
        // Deriva o prefixo de rota a partir da rota atual (ex: admin.cadastros.segmentos-educacionais)
        $routeName    = $request->route()?->getName() ?? '';
        $routePrefix  = substr($routeName, 0, (int) strrpos($routeName, '.'));

        return [
            'label'          => $this->label(),
            'labelPlural'    => $this->labelPlural(),
            'routePrefix'    => $routePrefix,
            'fields'         => $this->fields(),
            'datasetWarning' => $this->datasetWarning(),
        ];
    }
}
