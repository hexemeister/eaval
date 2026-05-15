# CRUDs de Lookups Simples — Design Spec

**Data:** 2026-05-15  
**Status:** Aprovado (design), não iniciado (implementação)

---

## Visão Geral

Módulo de cadastro administrativo das tabelas de referência do e-Aval. Essas tabelas fornecem as opções de seleção usadas no cadastro de publicações — evitam digitação livre e garantem consistência dos dados. São também a fonte de dados para a importação em lote (o arquivo importado deve referenciar valores existentes nessas tabelas).

---

## Entidades em Escopo

### Lookups simples (id + nome)

| Entidade | Tabela | Publicações vinculadas via |
|---|---|---|
| Área do conhecimento | `area` | M:N via `area_publicacao` |
| Eixo Temático | `eixo_tematico` | FK `publicacao.eixo_tematico_id` |
| Segmento Educacional | `segmento_educacional` | FK `publicacao.segmento_educacional_id` |
| Turma | `turma` | FK `publicacao.turma_id` |
| Tipo de Instituição | `tipo_instituicao` | FK `publicacao.tipo_instituicao_id` |
| Forma de Apresentação | `forma_apresentacao` | string `publicacao.forma` (ver seção especial) |

### Lookups geográficos (id + sigla + nome + hierarquia)

| Entidade | Tabela | Dependentes |
|---|---|---|
| País | `pais` | `regiao.sigla_pais` |
| Região | `regiao` | `estado.sigla_regiao` |
| Estado | `estado` | `local_publicacao.estado` → publicações |

---

## Pré-requisitos e Dependências

### Migrations faltantes (incluídas nesta spec)

As tabelas `turma`, `tipo_instituicao` e `forma_apresentacao` existem no banco de produção mas não têm migration criadora. Esta spec inclui a criação dessas migrations usando `Schema::hasTable()` para não quebrar ambientes existentes.

### Dependências de outras specs

| Dependência | Spec | Motivo |
|---|---|---|
| Saneamento Fase 1.1 | `2026-05-14-saneamento-schema-legado-design.md` | Remove colunas vazias de `publicacao` antes de criar formulários |
| Seeders das tabelas de lookup | `2026-05-14-distribuicao-dataset-academico-design.md` | Essa spec é a dona dos seeders — `TurmaSeeder`, `TipoInstituicaoSeeder`, `FormaApresentacaoSeeder`, etc. Esta spec cria apenas as migrations |
| Infraestrutura de notificações | `2026-05-13-curadoria-publicacoes-design.md` | O fluxo de exclusão usa a tabela `notifications` do Laravel criada pela curadoria |

### Seeder vs. migration

A spec de distribuição do dataset é a **fonte de verdade para os dados** dessas tabelas. Esta spec cria as estruturas (migrations); a spec de dataset popula os valores iniciais (seeders).

---

## Arquitetura Backend

### Controller base

`App\Http\Controllers\Admin\LookupController` — controller abstrato com toda a lógica CRUD. Cada entidade declara suas configurações; o controller base executa.

```php
abstract class LookupController extends Controller
{
    // Subclasse declara qual model gerenciar
    abstract protected function model(): string;

    // Label legível para mensagens e títulos
    abstract protected function label(): string;

    // Modo de vínculo com publicações: 'fk' (padrão) ou 'string_match'
    // 'string_match' é usado por forma_apresentacao, onde publicacao.forma é string
    protected function bindingMode(): string { return 'fk'; }

    // Nome do campo FK em publicacao (ex: 'segmento_educacional_id')
    // Null para relações M:N (area) ou string_match (forma_apresentacao)
    protected function publicacaoFkColumn(): ?string { return null; }

    // Para relações M:N: nome da tabela pivot
    protected function pivotTable(): ?string { return null; }

    // Dados extras passados ao formulário React (ex: lista de países para select de região)
    protected function formData(): array { return []; }

    // Se true, exibe banner de aviso de dataset acadêmico na página
    protected function datasetWarning(): bool { return false; }

    public function index(Request $request) { ... }
    public function store(Request $request) { ... }
    public function update(Request $request, int $id) { ... }
    public function destroy(int $id) { ... }           // retorna contagem de afetados, não deleta
    public function destroyConfirmed(int $id) { ... }  // executa deleção + notificação
}
```

### Subcontrollers

`App\Http\Controllers\Admin\Lookups\` — um arquivo por entidade, cada um com ~10 linhas:

```php
// Exemplo: SegmentoEducacionalController.php
class SegmentoEducacionalController extends LookupController
{
    protected function model(): string          { return SegmentoEducacional::class; }
    protected function label(): string          { return 'Segmento Educacional'; }
    protected function publicacaoFkColumn(): ?string { return 'segmento_educacional_id'; }
    protected function datasetWarning(): bool   { return true; }
}
```

### Migrations faltantes (criadas nesta spec)

```php
// Migration: create_missing_lookup_tables.php
// Usa hasTable() para não quebrar ambientes que já têm as tabelas

if (!Schema::hasTable('turma')) {
    Schema::create('turma', function (Blueprint $table) {
        $table->id();
        $table->string('nome', 60)->unique();
    });
}

if (!Schema::hasTable('tipo_instituicao')) {
    Schema::create('tipo_instituicao', function (Blueprint $table) {
        $table->id();
        $table->string('nome', 50)->unique();
    });
}

if (!Schema::hasTable('forma_apresentacao')) {
    Schema::create('forma_apresentacao', function (Blueprint $table) {
        $table->id();
        $table->string('nome', 50)->unique();
    });
}
```

### Constraint UNIQUE nas demais tabelas

As tabelas que já existem mas não têm `UNIQUE` em `nome` recebem uma migration separada adicionando a constraint:

```php
// Migration: add_unique_constraints_to_lookup_tables.php
// Aplica apenas se a constraint ainda não existe
foreach (['area', 'eixo_tematico', 'segmento_educacional'] as $table) {
    Schema::table($table, function (Blueprint $t) {
        $t->unique('nome');
    });
}
```

---

## Rotas

```php
// routes/web.php — dentro do grupo auth + verified
// Cada recurso tem sua rota destroy-confirmed registrada explicitamente ao lado
// porque LookupController é abstrato e não pode ser referenciado diretamente em rotas.

Route::prefix('admin/cadastros')->name('admin.cadastros.')->group(function () {
    foreach ([
        'areas'                  => Admin\Lookups\AreaController::class,
        'eixos-tematicos'        => Admin\Lookups\EixoTematicoController::class,
        'segmentos-educacionais' => Admin\Lookups\SegmentoEducacionalController::class,
        'turmas'                 => Admin\Lookups\TurmaController::class,
        'tipos-instituicao'      => Admin\Lookups\TipoInstituicaoController::class,
        'formas-apresentacao'    => Admin\Lookups\FormaApresentacaoController::class,
        'paises'                 => Admin\Lookups\PaisController::class,
        'regioes'                => Admin\Lookups\RegiaoController::class,
        'estados'                => Admin\Lookups\EstadoController::class,
    ] as $prefix => $controller) {
        Route::resource($prefix, $controller);
        Route::post("{$prefix}/{id}/destroy-confirmed", [$controller, 'destroyConfirmed'])
            ->name("{$prefix}.destroy-confirmed");
    }
});
```

---

## Arquitetura React

### Página única

`resources/js/pages/admin/cadastros/LookupCrud.tsx` — página genérica usada por todas as 9 rotas.

Props recebidas via Inertia:

```typescript
type LookupCrudProps = {
    items: PaginatedData<LookupItem>;    // lista paginada
    config: LookupConfig;               // configuração da entidade
    formData?: Record<string, unknown>; // dados extras para selects dependentes
    filters: { search: string; order: 'asc' | 'desc' };
};

type LookupConfig = {
    label: string;           // "Segmento Educacional"
    labelPlural: string;     // "Segmentos Educacionais"
    routePrefix: string;     // "admin.cadastros.segmentos-educacionais"
    fields: FieldConfig[];   // campos do formulário
    datasetWarning: boolean; // exibe banner de dataset acadêmico
};

type FieldConfig = {
    name: string;
    label: string;
    type: 'text' | 'select';
    options?: { value: string; label: string }[]; // para selects dependentes
    required: boolean;
};
```

### Estados da página

A página alterna entre três estados:

1. **Lista** — tabela com busca, ordenação asc/desc, paginação, botões Novo / Editar / Excluir
2. **Formulário** — painel inline abaixo do cabeçalho para criar ou editar; valida antes de submeter
3. **Modal de exclusão** — mostra contagem e lista de afetados; pede confirmação antes de executar

### Banner de dataset

Exibido no topo das páginas com `datasetWarning: true`:

> ⚠️ Esta tabela faz parte do dataset acadêmico distribuído publicamente. Alterações podem exigir atualização da versão do dataset.

---

## Fluxo de Exclusão

### 1. Verificação (sem deletar)

`DELETE /admin/cadastros/{resource}/{id}` — o frontend faz esta chamada via `router.delete()` do Inertia com `{ preserveState: true }`. O controller detecta `$request->wantsJson()` e retorna JSON em vez de redirecionar:

```php
public function destroy(int $id): JsonResponse
{
    // Retorna contagem de afetados sem executar nenhuma alteração.
    // O React usa esses dados para montar o modal de confirmação.
}
```

Resposta:

```json
{
    "affected": {
        "publicacoes": 42,
        "cascade": {
            "regioes": 5,
            "estados": 12,
            "locais_publicacao": 8
        }
    },
    "sample": ["Título da publicação A", "Título da publicação B", "..."]
}
```

Para entidades geográficas, `cascade` mostra todos os níveis. Para entidades simples, apenas `publicacoes`.

### 2. Modal de confirmação

Exibe:
- *"12 publicações ficarão sem Segmento Educacional."*
- Lista dos primeiros 5 títulos afetados (+ "e mais X" se houver mais)
- Botão "Cancelar" e botão "Confirmar exclusão"

### 3. Execução

`POST /admin/cadastros/{resource}/{id}/destroy-confirmed`:

1. Seta `NULL` no campo FK (ou `NULL` no campo string para `forma_apresentacao`)
2. Para entidades geográficas com cascade: propaga NULLs nos níveis seguintes
3. Deleta o registro
4. Cria notificação Laravel (`database` channel) para todos os usuários:
   *"'Educação Básica' foi excluído. 42 publicações ficaram sem Segmento Educacional."*

### Regra especial — último registro

Se a tabela tiver apenas 1 registro e o admin tentar excluir, o sistema bloqueia com erro:
*"Não é possível excluir o único registro desta tabela."*

Aplicável especialmente a `forma_apresentacao` (1 linha: "On-line").

---

## Fluxo de Edição de Sigla (Tabelas Geográficas)

Editar a sigla de um País ou Região é tão impactante quanto excluir — as siglas são usadas como FK em cascata.

### Comportamento

Ao submeter um `UPDATE` que altera o campo `sigla`:

1. Controller detecta mudança de sigla
2. Retorna contagem de dependentes (regiões, estados, locais afetados)
3. Frontend exibe modal de confirmação: *"Alterar a sigla de 'BR' para 'BRA' afetará 5 regiões e 27 estados. Confirmar?"*
4. Ao confirmar: executa `UPDATE` em cascata nas tabelas dependentes

```php
// Exemplo de cascade no PaisController
DB::transaction(function () use ($old, $new) {
    Pais::where('sigla', $old)->update(['sigla' => $new]);
    Regiao::where('sigla_pais', $old)->update(['sigla_pais' => $new]);
    // estados dependem de regiao.sigla, não de pais.sigla — não precisam update direto
});
```

---

## Casos Especiais

### `forma_apresentacao` — vínculo por string

`publicacao.forma` é um campo string livre (não FK integer). A deleção e o cálculo de afetados usam match por string:

```php
// Conta afetados
$count = Publicacao::where('forma', $record->nome)->count();

// Ao confirmar exclusão
Publicacao::where('forma', $record->nome)->update(['forma' => null]);
```

O formulário de criação/edição de publicação deve consultar a tabela `forma_apresentacao` para popular o select — garantindo que os valores da tabela e do campo string se mantenham sincronizados.

### `turma` — uso futuro

CRUD mínimo por enquanto (`id` + `nome`). A tabela tem uso futuro planejado: geração dinâmica de páginas de equipe (equipe atual e histórico por turma), substituindo os textos estáticos da seção "Quem Somos". A implementação futura adicionará campos ou tabelas relacionadas; o CRUD atual não deve fazer escolhas que dificultem essa extensão.

### Hierarquia geográfica — questão em aberto

A estrutura atual (País → Região → Estado) reflete a divisão administrativa brasileira. Se o dataset expandir para publicações de outros países com estruturas administrativas diferentes, o modelo geográfico precisará ser revisado. Não há decisão a tomar agora; registrado para avaliação futura.

---

## Filtro e Ordenação

Todos os `index` controllers aceitam query params:

| Param | Tipo | Default |
|---|---|---|
| `search` | string | vazio |
| `order` | `asc` \| `desc` | `asc` |

```php
$query = $model::query();

if ($request->filled('search')) {
    $query->where('nome', 'like', '%' . $request->search . '%');
}

$query->orderBy('nome', $request->get('order', 'asc'));
```

A busca preserva os params na paginação (via `->withQueryString()`).

---

## Validação

### FormRequest base

`App\Http\Requests\Admin\LookupRequest` — validação compartilhada:

```php
public function rules(): array
{
    $table = app($this->controller->model())->getTable();
    $id    = $this->route('id');  // null em store, preenchido em update

    return [
        'nome' => [
            'required',
            'string',
            'max:255',
            // ignora o próprio registro em updates
            Rule::unique($table, 'nome')->ignore($id),
        ],
    ];
}
```

Para entidades geográficas, `sigla` também é `required` + `unique` com ignore.

---

## Integração com Outras Specs

### Importação em lote (curadoria)

O `ImportPublicacoesJob` deve buscar os valores dessas tabelas para vincular publicações importadas — nunca criar entradas novas silenciosamente. Se um valor do CSV não existir na tabela, a linha deve ser marcada como erro no relatório de importação.

### Notificações de dados faltantes (pós-exclusão)

As notificações criadas após exclusão usam a mesma tabela `notifications` da curadoria. O badge na sidebar exibirá a contagem combinada de duplicatas pendentes + registros com dados faltantes. A tela de revisão (wizard para corrigir publicações com campos NULL) é escopo de spec futura separada.

### Dataset acadêmico

Edições via CRUD nas tabelas `area`, `eixo_tematico`, `segmento_educacional`, `turma`, `tipo_instituicao`, `pais`, `regiao`, `estado` impactam o dataset distribuído. O banner informativo orienta o administrador; o bump de versão continua sendo manual via `php artisan dataset:bump`.

---

## Checklist de Implementação

- [ ] Migration `create_missing_lookup_tables` (turma, tipo_instituicao, forma_apresentacao)
- [ ] Migration `add_unique_constraints_to_lookup_tables` (area, eixo_tematico, segmento_educacional)
- [ ] `LookupController` abstrato com index, store, update, destroy, destroyConfirmed
- [ ] `LookupRequest` com validação de unicidade
- [ ] 9 subcontrollers em `Admin\Lookups\`
- [ ] Rotas resource + rota `destroy-confirmed`
- [ ] `LookupCrud.tsx` com estados: lista / formulário / modal de exclusão
- [ ] Filtro por nome e ordenação asc/desc na listagem
- [ ] Banner de aviso de dataset nas páginas relevantes
- [ ] Fluxo de exclusão: verificação → modal → execução → notificação
- [ ] Bloqueio de exclusão do último registro
- [ ] Cascade UPDATE de sigla (País → Região → Estado)
- [ ] Modal de confirmação para edição de sigla
- [ ] Caso especial: `forma_apresentacao` com string match
- [ ] Entradas no menu admin para a seção "Cadastros"
