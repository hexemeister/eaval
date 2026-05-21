# CRUD de Publicações — Subciclo 1 — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar CRUD básico de publicações com saneamento de schema, lookups novos, sidebar colapsável e formulário completo com todos os 8 campos FK.

**Architecture:** Laravel 12 + React 19 + Inertia.js 2. Sem API REST — controllers retornam Inertia props. Migrations de saneamento convertem campos string `tipo`/`forma` em FKs. Formulário de publicação usa `CreatableSelect` (extensão do `SearchableSelect` com criação inline + detecção de duplicatas). Autores são reordenáveis via `@dnd-kit/sortable`. Normalização de texto via `NormalizacaoTextoService` (sentence case simples neste subciclo; exceções entram no Subciclo 3).

**Tech Stack:** Laravel Pest (testes backend), Vitest + Testing Library (testes frontend), `@dnd-kit/core` + `@dnd-kit/sortable` (drag de autores), TanStack React Table (listagem), shadcn/ui (componentes UI).

---

## Estrutura de Arquivos

### Criados

- `database/migrations/2026_05_21_000001_drop_legacy_tables.php`
- `database/migrations/2026_05_21_000002_add_publicacao_fks_and_doi.php`
- `app/Http/Controllers/Admin/Lookups/QualisCapeController.php`
- `app/Http/Controllers/Admin/Lookups/TipoPublicacaoController.php`
- `app/Services/NormalizacaoTextoService.php`
- `resources/js/components/nav-cadastros.tsx`
- `resources/js/components/ui/creatable-select.tsx`
- `resources/js/components/admin/AutorList.tsx`
- `resources/js/components/admin/PublicacaoForm.tsx`
- `resources/js/pages/admin/Publicacoes/Create.tsx`
- `resources/js/pages/admin/Publicacoes/Edit.tsx`
- `tests/Feature/Admin/PublicacoesControllerTest.php`
- `tests/Feature/Admin/LookupCrudNewTest.php`
- `resources/js/components/ui/creatable-select.test.tsx`
- `resources/js/components/admin/AutorList.test.tsx`

### Modificados

- `app/Models/Publicacao.php`
- `app/Http/Controllers/EstatisticaController.php`
- `app/Http/Controllers/Admin/LookupController.php`
- `app/Http/Controllers/Admin/Lookups/FormaApresentacaoController.php`
- `app/Http/Controllers/Admin/PublicacoesController.php`
- `resources/js/components/app-sidebar.tsx`
- `resources/js/components/nav-main.tsx`
- `resources/js/pages/admin/Publicacoes/Index.tsx`
- `routes/web.php`

---

## Task 1: Backup e Migração de Saneamento (drop de tabelas legadas)

**Files:**
- Create: `database/migrations/2026_05_21_000001_drop_legacy_tables.php`
- Test: inline no Pest (schema assertions)

> **Contexto:** As tabelas `tipo_autoria`, `modalidade`, `vinculo_institucional_autor` nunca tiveram dados. `usuario` tem 1 registro sem referências no código Laravel. As colunas FK correspondentes em `publicacao` também serão removidas.

- [ ] **Step 1: Fazer backup do banco antes de qualquer migração**

```powershell
cp database/database.sqlite database/database.sqlite.bak
```

- [ ] **Step 2: Escrever o teste de schema**

Crie `tests/Feature/Admin/SchemaLegacyCleanupTest.php`:

```php
<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Schema;

it('dropped legacy tables no longer exist', function () {
    expect(Schema::hasTable('tipo_autoria'))->toBeFalse();
    expect(Schema::hasTable('modalidade'))->toBeFalse();
    expect(Schema::hasTable('vinculo_institucional_autor'))->toBeFalse();
    expect(Schema::hasTable('usuario'))->toBeFalse();
});

it('publicacao no longer has legacy fk columns', function () {
    expect(Schema::hasColumn('publicacao', 'tipo_autoria_id'))->toBeFalse();
    expect(Schema::hasColumn('publicacao', 'modalidade_id'))->toBeFalse();
    expect(Schema::hasColumn('publicacao', 'vinculo_institucional_autor_id'))->toBeFalse();
});
```

- [ ] **Step 3: Rodar o teste — deve falhar**

```powershell
php artisan test tests/Feature/Admin/SchemaLegacyCleanupTest.php
```

Expected: FAIL (tabelas ainda existem)

- [ ] **Step 4: Criar a migração**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('publicacao', function (Blueprint $table) {
            if (Schema::hasColumn('publicacao', 'tipo_autoria_id')) {
                $table->dropForeign(['tipo_autoria_id']);
                $table->dropColumn('tipo_autoria_id');
            }
            if (Schema::hasColumn('publicacao', 'modalidade_id')) {
                $table->dropForeign(['modalidade_id']);
                $table->dropColumn('modalidade_id');
            }
            if (Schema::hasColumn('publicacao', 'vinculo_institucional_autor_id')) {
                $table->dropForeign(['vinculo_institucional_autor_id']);
                $table->dropColumn('vinculo_institucional_autor_id');
            }
        });

        Schema::dropIfExists('tipo_autoria');
        Schema::dropIfExists('modalidade');
        Schema::dropIfExists('vinculo_institucional_autor');
        Schema::dropIfExists('usuario');
    }

    public function down(): void
    {
        // Irreversível — restaurar do backup se necessário
    }
};
```

- [ ] **Step 5: Rodar a migração**

```powershell
php artisan migrate
```

Expected: OK (migration ran)

- [ ] **Step 6: Rodar o teste — deve passar**

```powershell
php artisan test tests/Feature/Admin/SchemaLegacyCleanupTest.php
```

Expected: PASS

- [ ] **Step 7: Deletar `app/Models/Usuario.php` e `app/Models/TipoAutorium.php`**

```powershell
Remove-Item app/Models/Usuario.php
Remove-Item app/Models/TipoAutorium.php
```

- [ ] **Step 8: Commit**

```powershell
git add database/migrations/2026_05_21_000001_drop_legacy_tables.php
git add tests/Feature/Admin/SchemaLegacyCleanupTest.php
git add -u app/Models/Usuario.php app/Models/TipoAutorium.php
git commit -m "refactor(schema): remove tabelas e colunas FK legadas sem dados"
```

---

## Task 2: Migração — FKs tipo_publicacao_id e forma_apresentacao_id + coluna doi

**Files:**
- Create: `database/migrations/2026_05_21_000002_add_publicacao_fks_and_doi.php`

> **Contexto:** `publicacao.tipo` e `publicacao.forma` são strings que espelham tabelas com id/nome. A migração: (1) adiciona as colunas FK, (2) migra os dados (string → id via match case-insensitive), (3) dropa as colunas antigas, (4) adiciona `doi`.

- [ ] **Step 1: Escrever o teste de schema**

Adicione ao `SchemaLegacyCleanupTest.php`:

```php
it('publicacao has tipo_publicacao_id and forma_apresentacao_id FKs', function () {
    expect(Schema::hasColumn('publicacao', 'tipo_publicacao_id'))->toBeTrue();
    expect(Schema::hasColumn('publicacao', 'forma_apresentacao_id'))->toBeTrue();
    expect(Schema::hasColumn('publicacao', 'tipo'))->toBeFalse();
    expect(Schema::hasColumn('publicacao', 'forma'))->toBeFalse();
});

it('publicacao has doi column', function () {
    expect(Schema::hasColumn('publicacao', 'doi'))->toBeTrue();
});
```

- [ ] **Step 2: Rodar — deve falhar**

```powershell
php artisan test tests/Feature/Admin/SchemaLegacyCleanupTest.php
```

- [ ] **Step 3: Criar a migração**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('publicacao', function (Blueprint $table) {
            $table->unsignedBigInteger('tipo_publicacao_id')->nullable()->after('tipo');
            $table->unsignedBigInteger('forma_apresentacao_id')->nullable()->after('forma');
            $table->string('doi')->nullable()->after('isbn');
        });

        // Migrar dados: tipo (string) → tipo_publicacao_id
        DB::table('tipo_publicacao')->get()->each(function ($tp) {
            DB::table('publicacao')
                ->whereRaw('LOWER(TRIM(tipo)) = ?', [strtolower(trim($tp->nome))])
                ->update(['tipo_publicacao_id' => $tp->id]);
        });

        // Migrar dados: forma (string) → forma_apresentacao_id
        DB::table('forma_apresentacao')->get()->each(function ($fa) {
            DB::table('publicacao')
                ->whereRaw('LOWER(TRIM(forma)) = ?', [strtolower(trim($fa->nome))])
                ->update(['forma_apresentacao_id' => $fa->id]);
        });

        Schema::table('publicacao', function (Blueprint $table) {
            $table->foreign('tipo_publicacao_id')
                ->references('id')->on('tipo_publicacao')
                ->nullOnDelete();
            $table->foreign('forma_apresentacao_id')
                ->references('id')->on('forma_apresentacao')
                ->nullOnDelete();

            $table->dropColumn(['tipo', 'forma']);
        });
    }

    public function down(): void
    {
        // Irreversível
    }
};
```

- [ ] **Step 4: Rodar a migração**

```powershell
php artisan migrate
```

- [ ] **Step 5: Verificar dados migrados**

```powershell
php artisan tinker --execute="echo \App\Models\Publicacao::whereNull('tipo_publicacao_id')->count() . ' sem tipo';"
```

Expected: número menor que o total de publicações (alguns podem ser nulos — ok)

- [ ] **Step 6: Rodar o teste**

```powershell
php artisan test tests/Feature/Admin/SchemaLegacyCleanupTest.php
```

Expected: PASS (todos os 5 testes)

- [ ] **Step 7: Commit**

```powershell
git add database/migrations/2026_05_21_000002_add_publicacao_fks_and_doi.php
git add tests/Feature/Admin/SchemaLegacyCleanupTest.php
git commit -m "refactor(schema): converte tipo/forma para FK, adiciona coluna doi"
```

---

## Task 3: Atualizar Model Publicacao

**Files:**
- Modify: `app/Models/Publicacao.php`

- [ ] **Step 1: Atualizar `$fillable`, `$casts` e relacionamentos**

Em `app/Models/Publicacao.php`, faça as seguintes alterações:

Remova de `$fillable`: `'tipo'`, `'forma'`, `'tipo_autoria_id'`, `'modalidade_id'`, `'vinculo_institucional_autor_id'`

Adicione em `$fillable`: `'tipo_publicacao_id'`, `'forma_apresentacao_id'`, `'doi'`

Remova de `$casts`: `'tipo'`, `'forma'`, `'tipo_autoria_id'`, `'modalidade_id'`, `'vinculo_institucional_autor_id'`

Adicione em `$casts`: `'tipo_publicacao_id' => 'integer'`, `'forma_apresentacao_id' => 'integer'`, `'doi' => 'string'`

Adicione os dois `BelongsTo` no final do modelo:

```php
use App\Models\TipoPublicacao;
use App\Models\FormaApresentacao;

public function tipoPublicacao(): BelongsTo
{
    return $this->belongsTo(TipoPublicacao::class, 'tipo_publicacao_id');
}

public function formaApresentacao(): BelongsTo
{
    return $this->belongsTo(FormaApresentacao::class, 'forma_apresentacao_id');
}
```

Também remova os `@property` deprecados do docblock e adicione os novos.

- [ ] **Step 2: Rodar testes para garantir que nada quebrou**

```powershell
php artisan test
```

Expected: todos passando (ajuste se algum test referencia `tipo` ou `forma` como string)

- [ ] **Step 3: Commit**

```powershell
git add app/Models/Publicacao.php
git commit -m "refactor(model): atualiza Publicacao com FKs tipo_publicacao e forma_apresentacao"
```

---

## Task 4: Corrigir EstatisticaController

**Files:**
- Modify: `app/Http/Controllers/EstatisticaController.php`

> **Contexto:** Os cases `'tipo-publicacao'` e `'forma-apresentacao'` usam `groupBy('tipo')` e `groupBy('forma')` — colunas que não existem mais. Devem virar JOINs.

- [ ] **Step 1: Escrever teste de feature**

Crie `tests/Feature/EstatisticaControllerTest.php` (ou adicione a arquivo existente):

```php
it('estatisticas tipo-publicacao carregam sem erro', function () {
    $this->get('/estatisticas/tipo-publicacao')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('dados'));
});

it('estatisticas forma-apresentacao carregam sem erro', function () {
    $this->get('/estatisticas/forma-apresentacao')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('dados'));
});
```

- [ ] **Step 2: Rodar — deve falhar**

```powershell
php artisan test --filter="estatisticas tipo-publicacao"
```

- [ ] **Step 3: Corrigir o case `'tipo-publicacao'` no EstatisticaController**

Substitua o bloco `case 'tipo-publicacao':` (linhas 126–138) por:

```php
case 'tipo-publicacao':
    $dados = Publicacao::join('tipo_publicacao', 'tipo_publicacao.id', '=', 'publicacao.tipo_publicacao_id')
        ->select('tipo_publicacao.nome as tipo', DB::raw('count(*) as total'))
        ->groupBy('tipo_publicacao.id', 'tipo_publicacao.nome')
        ->orderByDesc('total')
        ->get()
        ->map(fn ($item) => ['Tipo' => $item->tipo, 'Total' => $item->total]);

    return Inertia::render('Estatisticas/Quantitativos/Generico', [
        'dados'  => $dados,
        'colunas' => ['Tipo', 'Total'],
        'title'  => 'Estatísticas - Por Tipo de Publicação',
    ]);
```

- [ ] **Step 4: Corrigir o case `'forma-apresentacao'`**

Substitua o bloco `case 'forma-apresentacao':` (linhas 165–177) por:

```php
case 'forma-apresentacao':
    $dados = Publicacao::join('forma_apresentacao', 'forma_apresentacao.id', '=', 'publicacao.forma_apresentacao_id')
        ->select('forma_apresentacao.nome as forma', DB::raw('count(*) as total'))
        ->groupBy('forma_apresentacao.id', 'forma_apresentacao.nome')
        ->orderByDesc('total')
        ->get()
        ->map(fn ($item) => ['Forma' => $item->forma, 'Total' => $item->total]);

    return Inertia::render('Estatisticas/Quantitativos/Generico', [
        'dados'  => $dados,
        'colunas' => ['Forma', 'Total'],
        'title'  => 'Estatísticas - Por Forma de Apresentação',
    ]);
```

- [ ] **Step 5: Rodar os testes**

```powershell
php artisan test tests/Feature/EstatisticaControllerTest.php
```

Expected: PASS

- [ ] **Step 6: Commit**

```powershell
git add app/Http/Controllers/EstatisticaController.php
git add tests/Feature/EstatisticaControllerTest.php
git commit -m "fix(estatisticas): atualiza queries de tipo-publicacao e forma-apresentacao para FK"
```

---

## Task 5: LookupController — nameColumn() + storeInline() + novos controllers

**Files:**
- Modify: `app/Http/Controllers/Admin/LookupController.php`
- Modify: `app/Http/Controllers/Admin/Lookups/FormaApresentacaoController.php`
- Create: `app/Http/Controllers/Admin/Lookups/QualisCapeController.php`
- Create: `app/Http/Controllers/Admin/Lookups/TipoPublicacaoController.php`

> **Contexto:** `QualisCape` usa campo `classificacao` (não `nome`). Adicionar `nameColumn()` ao LookupController permite que subclasses sobrescrevam o campo. O `storeInline()` retorna JSON para o `CreatableSelect`. `FormaApresentacaoController` precisa mudar de `string_match` para `fk`.

- [ ] **Step 1: Adicionar `nameColumn()` ao LookupController**

Após a definição de `publicacaoFkColumn()` (linha ~75), adicione:

```php
/**
 * Nome do campo "nome" no model (ex: 'classificacao' para QualisCape).
 * Padrão: 'nome'. Sobrescreva quando o campo tiver nome diferente.
 */
protected function nameColumn(): string
{
    return 'nome';
}
```

- [ ] **Step 2: Atualizar `store()` para usar `nameColumn()`**

No método `store()` (linha ~155), substitua:

```php
$modelClass::create(['nome' => $request->string('nome')->trim()]);
```

por:

```php
$col = $this->nameColumn();
$modelClass::create([$col => $request->string($col)->trim()]);
```

- [ ] **Step 3: Atualizar `update()` para usar `nameColumn()`**

No método `update()` (linha ~169), substitua:

```php
$record->update(['nome' => $request->string('nome')->trim()]);
```

por:

```php
$col = $this->nameColumn();
$record->update([$col => $request->string($col)->trim()]);
```

- [ ] **Step 4: Atualizar `validationRules()` para usar `nameColumn()`**

No método `validationRules()` (linha ~328), substitua:

```php
return [
    'nome' => [
        'required',
        'string',
        'max:255',
        Rule::unique($table, 'nome')->ignore($ignoreId),
    ],
];
```

por:

```php
$col = $this->nameColumn();
return [
    $col => [
        'required',
        'string',
        'max:255',
        Rule::unique($table, $col)->ignore($ignoreId),
    ],
];
```

- [ ] **Step 5: Atualizar `validationMessages()` para usar `nameColumn()`**

```php
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
```

- [ ] **Step 6: Adicionar `storeInline()` ao LookupController**

Após o método `destroyConfirmed()` (linha ~223), adicione:

```php
/**
 * Cria um registro via AJAX e retorna JSON {id, label}.
 * Usado pelo CreatableSelect para criação inline no formulário de publicação.
 * O contrato da request é sempre {nome: string}, independente do nameColumn.
 */
public function storeInline(Request $request): JsonResponse
{
    $col   = $this->nameColumn();
    $table = app($this->model())->getTable();

    $request->validate([
        'nome' => [
            'required',
            'string',
            'max:255',
            Rule::unique($table, $col),
        ],
    ], [
        'nome.required' => 'O campo nome é obrigatório.',
        'nome.unique'   => 'Este nome já está cadastrado.',
    ]);

    $modelClass = $this->model();
    $record = $modelClass::create([$col => $request->string('nome')->trim()]);

    return response()->json(['id' => $record->id, 'label' => $record->$col]);
}
```

- [ ] **Step 7: Rodar os testes existentes de lookup para garantir que nada quebrou**

```powershell
php artisan test tests/Feature/Admin/LookupCrudTest.php
```

Expected: PASS

- [ ] **Step 8: Corrigir `FormaApresentacaoController` — binding mode `fk`**

Em `app/Http/Controllers/Admin/Lookups/FormaApresentacaoController.php`, mude:

```php
protected function bindingMode(): string
{
    return 'fk';
}

protected function publicacaoFkColumn(): ?string
{
    return 'forma_apresentacao_id';
}
```

(Remova o método `bindingMode()` `'string_match'` e substitua pelos dois acima.)

- [ ] **Step 9: Criar `TipoPublicacaoController.php`**

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin\Lookups;

use App\Http\Controllers\Admin\LookupController;
use App\Models\TipoPublicacao;

class TipoPublicacaoController extends LookupController
{
    protected function model(): string
    {
        return TipoPublicacao::class;
    }

    protected function label(): string
    {
        return 'Tipo de Publicação';
    }

    protected function labelPlural(): string
    {
        return 'Tipos de Publicação';
    }

    protected function bindingMode(): string
    {
        return 'fk';
    }

    protected function publicacaoFkColumn(): ?string
    {
        return 'tipo_publicacao_id';
    }

    protected function datasetWarning(): bool
    {
        return true;
    }
}
```

- [ ] **Step 10: Criar `QualisCapeController.php`**

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin\Lookups;

use App\Http\Controllers\Admin\LookupController;
use App\Models\QualisCape;

class QualisCapeController extends LookupController
{
    protected function model(): string
    {
        return QualisCape::class;
    }

    protected function label(): string
    {
        return 'Qualis CAPES';
    }

    protected function labelPlural(): string
    {
        return 'Qualis CAPES';
    }

    protected function nameColumn(): string
    {
        return 'classificacao';
    }

    protected function bindingMode(): string
    {
        return 'fk';
    }

    protected function publicacaoFkColumn(): ?string
    {
        return 'qualis_capes_id';
    }

    protected function fields(): array
    {
        return [
            ['name' => 'classificacao', 'label' => 'Classificação', 'type' => 'text', 'required' => true],
        ];
    }
}
```

- [ ] **Step 11: Commit**

```powershell
git add app/Http/Controllers/Admin/LookupController.php
git add app/Http/Controllers/Admin/Lookups/FormaApresentacaoController.php
git add app/Http/Controllers/Admin/Lookups/TipoPublicacaoController.php
git add app/Http/Controllers/Admin/Lookups/QualisCapeController.php
git commit -m "feat(lookup): nameColumn(), storeInline() e novos controllers TipoPublicacao e QualisCape"
```

---

## Task 6: Registrar Rotas dos Novos Lookups

**Files:**
- Modify: `routes/web.php`

- [ ] **Step 1: Adicionar imports dos novos controllers no topo do web.php**

```php
use App\Http\Controllers\Admin\Lookups\TipoPublicacaoController;
use App\Http\Controllers\Admin\Lookups\QualisCapeController;
```

- [ ] **Step 2: Adicionar os novos lookups ao array do foreach e registrar rota inline-create**

No `routes/web.php`, localize o `foreach` de cadastros (linha ~126) e adicione:

```php
'tipos-publicacao'   => TipoPublicacaoController::class,
'qualis-capes'       => QualisCapeController::class,
```

Após o `foreach`, adicione a rota de inline-create para todos os lookups:

```php
// Rota de criação inline (retorna JSON) — usada pelo CreatableSelect
foreach ([
    'areas'                  => AreaController::class,
    'eixos-tematicos'        => EixoTematicoController::class,
    'segmentos-educacionais' => SegmentoEducacionalController::class,
    'turmas'                 => TurmaController::class,
    'tipos-instituicao'      => TipoInstituicaoController::class,
    'formas-apresentacao'    => FormaApresentacaoController::class,
    'tipos-publicacao'       => TipoPublicacaoController::class,
    'qualis-capes'           => QualisCapeController::class,
] as $prefix => $controller) {
    Route::post("cadastros/{$prefix}/inline-create", [$controller, 'storeInline'])
        ->name("admin.cadastros.{$prefix}.inline-create");
}
```

- [ ] **Step 3: Verificar que as rotas foram registradas**

```powershell
php artisan route:list --path=admin/cadastros | grep -E "tipos-publicacao|qualis-capes|inline-create"
```

Expected: rotas listadas

- [ ] **Step 4: Escrever testes de feature para os novos lookups**

Crie `tests/Feature/Admin/LookupCrudNewTest.php`:

```php
<?php

declare(strict_types=1);

use App\Models\TipoPublicacao;
use App\Models\QualisCape;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

// TipoPublicacao
it('lists tipos-publicacao', function () {
    $this->get('/admin/cadastros/tipos-publicacao')->assertOk()->assertInertia(
        fn ($p) => $p->component('admin/cadastros/LookupCrud')->has('items')
    );
});

it('creates tipo-publicacao', function () {
    $this->post('/admin/cadastros/tipos-publicacao', ['nome' => 'Dissertação'])
        ->assertRedirect();
    expect(TipoPublicacao::where('nome', 'Dissertação')->exists())->toBeTrue();
});

it('updates tipo-publicacao', function () {
    $tp = TipoPublicacao::create(['nome' => 'Teste']);
    $this->put("/admin/cadastros/tipos-publicacao/{$tp->id}", ['nome' => 'Tese'])
        ->assertRedirect();
    expect($tp->fresh()->nome)->toBe('Tese');
});

it('rejects duplicate tipo-publicacao name', function () {
    TipoPublicacao::create(['nome' => 'Artigo']);
    $this->post('/admin/cadastros/tipos-publicacao', ['nome' => 'Artigo'])
        ->assertSessionHasErrors('nome');
});

// QualisCape
it('creates qualis-cape with classificacao field', function () {
    $this->post('/admin/cadastros/qualis-capes', ['classificacao' => 'A1'])
        ->assertRedirect();
    expect(QualisCape::where('classificacao', 'A1')->exists())->toBeTrue();
});

it('storeInline returns json for tipo-publicacao', function () {
    $this->postJson('/admin/cadastros/tipos-publicacao/inline-create', ['nome' => 'Resumo'])
        ->assertOk()
        ->assertJsonStructure(['id', 'label']);
});

it('storeInline returns json for qualis-cape', function () {
    $this->postJson('/admin/cadastros/qualis-capes/inline-create', ['nome' => 'B2'])
        ->assertOk()
        ->assertJson(fn ($j) => $j->where('label', 'B2')->etc());
});
```

- [ ] **Step 5: Rodar os testes**

```powershell
php artisan test tests/Feature/Admin/LookupCrudNewTest.php
```

Expected: PASS

- [ ] **Step 6: Commit**

```powershell
git add routes/web.php
git add tests/Feature/Admin/LookupCrudNewTest.php
git commit -m "feat(routes): registra rotas para tipos-publicacao, qualis-capes e inline-create"
```

---

## Task 7: NavCadastros — Sidebar Colapsável

**Files:**
- Create: `resources/js/components/nav-cadastros.tsx`
- Modify: `resources/js/components/app-sidebar.tsx`
- Modify: `resources/js/components/nav-main.tsx` (remover cadastros do flat list)

> **Contexto:** O sidebar atual tem todos os lookups como itens planos. Criaremos `NavCadastros` com grupo colapsável usando `SidebarMenuSub` do shadcn. O componente abre automaticamente quando a URL começa com `/admin/cadastros`.

- [ ] **Step 1: Criar `nav-cadastros.tsx`**

```tsx
import { usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { ChevronRight, FolderOpen } from 'lucide-react';
import { useState } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';

const cadastroItems = [
    { title: 'Áreas do Conhecimento',    href: '/admin/cadastros/areas' },
    { title: 'Eixos Temáticos',          href: '/admin/cadastros/eixos-tematicos' },
    { title: 'Segmentos Educacionais',   href: '/admin/cadastros/segmentos-educacionais' },
    { title: 'Turmas',                   href: '/admin/cadastros/turmas' },
    { title: 'Tipos de Instituição',     href: '/admin/cadastros/tipos-instituicao' },
    { title: 'Formas de Apresentação',   href: '/admin/cadastros/formas-apresentacao' },
    { title: 'Tipos de Publicação',      href: '/admin/cadastros/tipos-publicacao' },
    { title: 'Qualis CAPES',             href: '/admin/cadastros/qualis-capes' },
    { title: 'Geografia',                href: '/admin/cadastros/geografia' },
];

export function NavCadastros() {
    const { url } = usePage();
    const isActive = url.startsWith('/admin/cadastros');
    const [open, setOpen] = useState(isActive);

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Cadastros</SidebarGroupLabel>
            <SidebarMenu>
                <Collapsible open={open} onOpenChange={setOpen} asChild>
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip="Cadastros">
                                <FolderOpen />
                                <span>Cadastros</span>
                                <ChevronRight
                                    className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                                />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                {cadastroItems.map((item) => (
                                    <SidebarMenuSubItem key={item.href}>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={url.startsWith(item.href)}
                                        >
                                            <Link href={item.href} prefetch>
                                                {item.title}
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
            </SidebarMenu>
        </SidebarGroup>
    );
}
```

- [ ] **Step 2: Remover os itens de cadastro do `app-sidebar.tsx`**

Em `resources/js/components/app-sidebar.tsx`, remova do `mainNavItems` todos os itens de cadastro (Áreas, Eixos, Segmentos, Turmas, Tipos de Instituição, Formas, Geografia). Mantenha apenas: Painel, Publicações, Logs de Busca.

Adicione o import:

```tsx
import { NavCadastros } from '@/components/nav-cadastros';
```

No `SidebarContent`, adicione `<NavCadastros />` após `<NavMain items={mainNavItems} />`:

```tsx
<SidebarContent>
    <NavMain items={mainNavItems} />
    <NavCadastros />
</SidebarContent>
```

- [ ] **Step 3: Verificar no browser**

```powershell
npm run dev
```

Acessar `/admin/dashboard` → sidebar deve mostrar grupo "Cadastros" colapsável com 9 sub-itens.

- [ ] **Step 4: Commit**

```powershell
git add resources/js/components/nav-cadastros.tsx
git add resources/js/components/app-sidebar.tsx
git commit -m "feat(sidebar): grupo Cadastros colapsável com 9 sub-itens"
```

---

## Task 8: Melhoria do Filtro da Listagem de Publicações

**Files:**
- Modify: `app/Http/Controllers/Admin/PublicacoesController.php`
- Modify: `resources/js/pages/admin/Publicacoes/Index.tsx`

> **Contexto:** O `index()` atual passa apenas id/title/authors/year. Ampliar para incluir doi e isbn. Adicionar normalização de acentos ao filtro global do TanStack.

- [ ] **Step 1: Escrever teste de feature para index com doi/isbn**

Em `tests/Feature/Admin/PublicacoesControllerTest.php`:

```php
<?php

declare(strict_types=1);

use App\Models\User;
use App\Models\Publicacao;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

it('index passes doi and isbn in publicacoes data', function () {
    Publicacao::factory()->create(['doi' => '10.1234/test', 'isbn' => '978-1234567890']);

    $this->get('/admin/publicacoes')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('publicacoes')
            ->where('publicacoes.0.doi', '10.1234/test')
            ->where('publicacoes.0.isbn', '978-1234567890')
        );
});
```

- [ ] **Step 2: Rodar — deve falhar**

```powershell
php artisan test tests/Feature/Admin/PublicacoesControllerTest.php --filter="index passes doi"
```

- [ ] **Step 3: Atualizar `PublicacoesController::index()`**

Substitua o método `index()` completo:

```php
public function index(): \Inertia\Response
{
    $publicacoes = \App\Models\Publicacao::with(['autores', 'tipoPublicacao', 'formaApresentacao'])
        ->orderBy('id')
        ->get()
        ->map(fn ($pub) => [
            'id'      => $pub->id,
            'title'   => $pub->titulo,
            'authors' => $pub->autores->sortBy('pivot.ordem')->pluck('nome')->implode(', '),
            'year'    => $pub->ano,
            'doi'     => $pub->doi,
            'isbn'    => $pub->isbn,
            'tipo'    => $pub->tipoPublicacao?->nome,
        ]);

    return inertia('admin/Publicacoes/Index', [
        'publicacoes' => $publicacoes,
    ]);
}
```

- [ ] **Step 4: Rodar o teste**

```powershell
php artisan test tests/Feature/Admin/PublicacoesControllerTest.php --filter="index passes doi"
```

Expected: PASS

- [ ] **Step 5: Escrever teste Vitest — normalização de acentos**

Crie `resources/js/pages/admin/Publicacoes/Index.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

// Mock Inertia
vi.mock('@inertiajs/react', () => ({
    Head: ({ title }: { title: string }) => <title>{title}</title>,
    Link: ({ href, children }: any) => <a href={href}>{children}</a>,
    usePage: () => ({ url: '/admin/publicacoes', component: '', props: {} as any, version: '' }),
}));
vi.mock('@/routes', () => ({ dashboard: () => ({ url: '/admin/dashboard' }) }));
vi.mock('@/routes/admin', () => ({ publicacoes: () => ({ url: '/admin/publicacoes' }) }));

import PublicationsIndex from './Index';

const mockData = [
    { id: 1, title: 'Avaliação Formativa', authors: 'Silva, J.', year: 2022, doi: null, isbn: null, tipo: 'Artigo' },
    { id: 2, title: 'Educação e Tecnologia', authors: 'Souza, M.', year: 2023, doi: null, isbn: null, tipo: 'Livro' },
];

it('filtro sem acentos encontra publicação com acento', async () => {
    render(<PublicationsIndex publicacoes={mockData} />);
    const input = screen.getByPlaceholderText(/Buscar/i);
    await userEvent.type(input, 'avaliacao');
    expect(screen.getByText('Avaliação Formativa')).toBeInTheDocument();
    expect(screen.queryByText('Educação e Tecnologia')).not.toBeInTheDocument();
});
```

- [ ] **Step 6: Rodar — deve falhar**

```powershell
npm run test -- Index.test
```

- [ ] **Step 7: Atualizar `Index.tsx` — colunas doi/isbn/tipo + normalização de acentos**

Substitua a definição do tipo `Publicacao`:

```ts
interface Publicacao {
  id: number;
  title: string;
  authors: string;
  year: string | number;
  doi: string | null;
  isbn: string | null;
  tipo: string | null;
}
```

Adicione a função de normalização antes do componente:

```ts
const normalize = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
```

Adicione as colunas `doi`, `isbn` e `tipo` no array `columns` (no `useMemo`):

```ts
columnHelper.accessor('tipo', { header: 'Tipo', size: 120 }),
columnHelper.accessor('doi', { header: 'DOI', size: 140, cell: info => info.getValue() ?? '—' }),
columnHelper.accessor('isbn', { header: 'ISBN', size: 130, cell: info => info.getValue() ?? '—' }),
```

Configure o `globalFilterFn` na instância do `useReactTable`:

```ts
const table = useReactTable({
    data: publicacoes,
    columns,
    globalFilterFn: (row, _columnId, filterValue) => {
        const searchable = [
            row.original.title,
            row.original.authors,
            String(row.original.year),
            row.original.doi ?? '',
            row.original.isbn ?? '',
            row.original.tipo ?? '',
        ].join(' ');
        return normalize(searchable).includes(normalize(filterValue));
    },
    // ... resto igual
});
```

- [ ] **Step 8: Rodar teste Vitest**

```powershell
npm run test -- Index.test
```

Expected: PASS

- [ ] **Step 9: Commit**

```powershell
git add app/Http/Controllers/Admin/PublicacoesController.php
git add resources/js/pages/admin/Publicacoes/Index.tsx
git add resources/js/pages/admin/Publicacoes/Index.test.tsx
git add tests/Feature/Admin/PublicacoesControllerTest.php
git commit -m "feat(publicacoes): filtro com doi, isbn, tipo e normalização de acentos"
```

---

## Task 9: NormalizacaoTextoService

**Files:**
- Create: `app/Services/NormalizacaoTextoService.php`

> **Contexto:** Neste subciclo, sentence case simples sem exceções. No Subciclo 3, o método `sentenceCase()` será ampliado para consultar `termos_excecao_caso`.

- [ ] **Step 1: Escrever os testes**

Crie `tests/Unit/NormalizacaoTextoServiceTest.php`:

```php
<?php

declare(strict_types=1);

use App\Services\NormalizacaoTextoService;

it('sentence case capitaliza primeira letra e minuscula o resto', function () {
    expect(NormalizacaoTextoService::sentenceCase('AVALIAÇÃO FORMATIVA NO ENSINO MÉDIO'))
        ->toBe('Avaliação formativa no ensino médio');
});

it('sentence case respeita string já correta', function () {
    expect(NormalizacaoTextoService::sentenceCase('Avaliação formativa'))
        ->toBe('Avaliação formativa');
});

it('sentence case retorna string vazia intacta', function () {
    expect(NormalizacaoTextoService::sentenceCase(''))->toBe('');
});

it('sentence case faz trim', function () {
    expect(NormalizacaoTextoService::sentenceCase('  texto com espaços  '))
        ->toBe('Texto com espaços');
});

it('abnt keyword capitaliza apenas primeira letra da primeira palavra', function () {
    expect(NormalizacaoTextoService::abntKeyword('AVALIAÇÃO FORMATIVA'))
        ->toBe('Avaliação formativa');
});

it('abnt keyword faz trim', function () {
    expect(NormalizacaoTextoService::abntKeyword('  Educação  '))
        ->toBe('Educação');
});
```

- [ ] **Step 2: Rodar — deve falhar**

```powershell
php artisan test tests/Unit/NormalizacaoTextoServiceTest.php
```

- [ ] **Step 3: Criar o serviço**

```php
<?php

declare(strict_types=1);

namespace App\Services;

class NormalizacaoTextoService
{
    public static function sentenceCase(string $texto): string
    {
        $texto = trim($texto);
        if ($texto === '') {
            return '';
        }
        $lower = mb_strtolower($texto);
        return mb_strtoupper(mb_substr($lower, 0, 1)) . mb_substr($lower, 1);
    }

    public static function abntKeyword(string $texto): string
    {
        return self::sentenceCase($texto);
    }
}
```

- [ ] **Step 4: Rodar os testes**

```powershell
php artisan test tests/Unit/NormalizacaoTextoServiceTest.php
```

Expected: PASS (6 testes)

- [ ] **Step 5: Commit**

```powershell
git add app/Services/NormalizacaoTextoService.php
git add tests/Unit/NormalizacaoTextoServiceTest.php
git commit -m "feat(service): NormalizacaoTextoService - sentence case e ABNT keyword"
```

---

## Task 10: CreatableSelect — SearchableSelect com Criação Inline

**Files:**
- Create: `resources/js/components/ui/creatable-select.tsx`
- Create: `resources/js/components/ui/creatable-select.test.tsx`

> **Contexto:** Extensão do `SearchableSelect` existente. Adiciona opção "Criar '[texto]'" no dropdown. Detecta possíveis duplicatas por normalização (NFD, lowercase, trim) e exibe alerta de confirmação.

- [ ] **Step 1: Escrever os testes Vitest**

```tsx
// resources/js/components/ui/creatable-select.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CreatableSelect } from './creatable-select';

const options = [
    { value: '1', label: 'Educação' },
    { value: '2', label: 'Saúde' },
];

const noop = vi.fn();

it('exibe opção Criar quando texto não encontrado', async () => {
    render(
        <CreatableSelect
            options={options}
            value=""
            onValueChange={noop}
            inlineCreateUrl="/test/inline-create"
            onItemCreated={noop}
        />
    );
    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);
    const input = screen.getByPlaceholderText('Buscar...');
    await userEvent.type(input, 'Tecnologia');
    expect(screen.getByText(/Criar "Tecnologia"/i)).toBeInTheDocument();
});

it('detecta possível duplicata e exibe alerta', async () => {
    render(
        <CreatableSelect
            options={options}
            value=""
            onValueChange={noop}
            inlineCreateUrl="/test/inline-create"
            onItemCreated={noop}
        />
    );
    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);
    const input = screen.getByPlaceholderText('Buscar...');
    await userEvent.type(input, 'educacao'); // sem acento → duplicata de "Educação"
    expect(screen.getByText(/parecido com/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Rodar — deve falhar**

```powershell
npm run test -- creatable-select.test
```

- [ ] **Step 3: Criar o componente**

```tsx
// resources/js/components/ui/creatable-select.tsx
import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Command, CommandEmpty, CommandGroup, CommandInput,
    CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface CreatableOption {
    value: string;
    label: string;
}

interface CreatableSelectProps {
    options: CreatableOption[];
    value: string;
    onValueChange: (value: string) => void;
    onItemCreated: (item: CreatableOption) => void;
    inlineCreateUrl: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

const normalize = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export function CreatableSelect({
    options,
    value,
    onValueChange,
    onItemCreated,
    inlineCreateUrl,
    placeholder = 'Selecione...',
    disabled = false,
    className,
}: CreatableSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [creating, setCreating] = useState(false);
    const [duplicateWarning, setDuplicateWarning] = useState<CreatableOption | null>(null);

    const selected = options.find(o => o.value === value);
    const trimmed = search.trim();

    const possibleDuplicate = trimmed.length >= 3
        ? options.find(o => normalize(o.label) === normalize(trimmed) && o.value !== value)
        : null;

    const showCreateOption = trimmed.length > 0 && !options.find(
        o => normalize(o.label) === normalize(trimmed)
    );

    async function handleCreate(nome: string) {
        setCreating(true);
        try {
            const res = await fetch(inlineCreateUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''
                    ),
                },
                body: JSON.stringify({ nome }),
            });
            if (!res.ok) throw new Error();
            const data = await res.json() as { id: number; label: string };
            const newItem: CreatableOption = { value: String(data.id), label: data.label };
            onItemCreated(newItem);
            onValueChange(String(data.id));
            setOpen(false);
            setSearch('');
        } finally {
            setCreating(false);
            setDuplicateWarning(null);
        }
    }

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className={cn('w-full justify-between font-normal', !selected && 'text-muted-foreground', className)}
                    >
                        {selected ? selected.label : placeholder}
                        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command filter={(itemValue, s) => {
                        const opt = options.find(o => o.value === itemValue);
                        if (!opt) return 0;
                        return normalize(opt.label).includes(normalize(s)) ? 1 : 0;
                    }}>
                        <CommandInput
                            placeholder="Buscar..."
                            value={search}
                            onValueChange={setSearch}
                        />
                        <CommandList>
                            <CommandEmpty>Nenhum resultado.</CommandEmpty>
                            <CommandGroup>
                                {options.map(opt => (
                                    <CommandItem
                                        key={opt.value}
                                        value={opt.value}
                                        onSelect={v => { onValueChange(v); setOpen(false); setSearch(''); }}
                                    >
                                        <Check className={cn('mr-2 size-4', value === opt.value ? 'opacity-100' : 'opacity-0')} />
                                        {opt.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            {(showCreateOption || possibleDuplicate) && <CommandSeparator />}
                            {possibleDuplicate && (
                                <div className="px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                                    <span>"{trimmed}" é parecido com "{possibleDuplicate.label}". </span>
                                    <button
                                        className="underline"
                                        onClick={() => { onValueChange(possibleDuplicate.value); setOpen(false); setSearch(''); }}
                                    >
                                        Usar o existente
                                    </button>
                                    {' ou '}
                                    <button
                                        className="underline"
                                        onClick={() => handleCreate(trimmed)}
                                        disabled={creating}
                                    >
                                        criar mesmo assim
                                    </button>
                                </div>
                            )}
                            {showCreateOption && !possibleDuplicate && (
                                <CommandGroup>
                                    <CommandItem
                                        value="__create__"
                                        onSelect={() => handleCreate(trimmed)}
                                        disabled={creating}
                                    >
                                        <Plus className="mr-2 size-4" />
                                        Criar "{trimmed}"
                                    </CommandItem>
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </>
    );
}
```

- [ ] **Step 4: Rodar os testes**

```powershell
npm run test -- creatable-select.test
```

Expected: PASS

- [ ] **Step 5: Commit**

```powershell
git add resources/js/components/ui/creatable-select.tsx
git add resources/js/components/ui/creatable-select.test.tsx
git commit -m "feat(ui): CreatableSelect com criação inline e detecção de duplicatas"
```

---

## Task 11: AutorList — Lista de Autores com Drag-to-Reorder

**Files:**
- Create: `resources/js/components/admin/AutorList.tsx`
- Create: `resources/js/components/admin/AutorList.test.tsx`

- [ ] **Step 1: Verificar e instalar @dnd-kit**

```powershell
npm list @dnd-kit/core 2>$null
```

Se não instalado:

```powershell
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 2: Escrever o teste**

```tsx
// resources/js/components/admin/AutorList.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { AutorList } from './AutorList';

export interface AutorItem {
    id: number;
    nome: string;
}

const autores: AutorItem[] = [
    { id: 1, nome: 'Silva, João' },
    { id: 2, nome: 'Souza, Maria' },
];

it('exibe os autores na lista', () => {
    render(<AutorList autores={autores} onChange={vi.fn()} />);
    expect(screen.getByText('Silva, João')).toBeInTheDocument();
    expect(screen.getByText('Souza, Maria')).toBeInTheDocument();
});

it('remove autor ao clicar no botão remover', async () => {
    const onChange = vi.fn();
    render(<AutorList autores={autores} onChange={onChange} />);
    const removeButtons = screen.getAllByTitle('Remover autor');
    await userEvent.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalledWith([{ id: 2, nome: 'Souza, Maria' }]);
});
```

- [ ] **Step 3: Rodar — deve falhar**

```powershell
npm run test -- AutorList.test
```

- [ ] **Step 4: Criar o componente**

```tsx
// resources/js/components/admin/AutorList.tsx
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface AutorItem {
    id: number;
    nome: string;
}

interface SortableAutorProps {
    autor: AutorItem;
    onRemove: (id: number) => void;
}

function SortableAutor({ autor, onRemove }: SortableAutorProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: autor.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-2 rounded-md border bg-background px-3 py-2"
        >
            <button
                type="button"
                className="cursor-grab touch-none text-muted-foreground"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="size-4" />
            </button>
            <span className="flex-1 text-sm">{autor.nome}</span>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-destructive"
                title="Remover autor"
                onClick={() => onRemove(autor.id)}
            >
                <X className="size-3.5" />
            </Button>
        </div>
    );
}

interface AutorListProps {
    autores: AutorItem[];
    onChange: (autores: AutorItem[]) => void;
}

export function AutorList({ autores, onChange }: AutorListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = autores.findIndex(a => a.id === active.id);
            const newIndex = autores.findIndex(a => a.id === over.id);
            onChange(arrayMove(autores, oldIndex, newIndex));
        }
    }

    function handleRemove(id: number) {
        onChange(autores.filter(a => a.id !== id));
    }

    if (autores.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">Nenhum autor adicionado.</p>
        );
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={autores.map(a => a.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-1">
                    {autores.map(autor => (
                        <SortableAutor key={autor.id} autor={autor} onRemove={handleRemove} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
```

- [ ] **Step 5: Rodar os testes**

```powershell
npm run test -- AutorList.test
```

Expected: PASS

- [ ] **Step 6: Commit**

```powershell
git add resources/js/components/admin/AutorList.tsx
git add resources/js/components/admin/AutorList.test.tsx
git commit -m "feat(admin): AutorList com drag-to-reorder e remoção"
```

---

## Task 12: PublicacaoForm — Formulário Completo

**Files:**
- Create: `resources/js/components/admin/PublicacaoForm.tsx`

> **Contexto:** Componente de formulário compartilhado entre Create e Edit. Dois painéis: esquerda (dados básicos + autores + palavras-chave), direita (classificação + localização). Todos os 8 FKs usam `CreatableSelect`.

- [ ] **Step 1: Definir os tipos do formulário**

No início de `PublicacaoForm.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreatableSelect, type CreatableOption } from '@/components/ui/creatable-select';
import { AutorList, type AutorItem } from '@/components/admin/AutorList';
import { Loader2, X } from 'lucide-react';

export interface LookupOption {
    value: string;
    label: string;
}

export interface PublicacaoFormData {
    titulo: string;
    ano: string;
    link: string;
    resumo: string;
    volume: string;
    numero: string;
    pagina: string;
    isbn: string;
    doi: string;
    tipo_publicacao_id: string;
    forma_apresentacao_id: string;
    local_publicacao_id: string;
    turma_id: string;
    eixo_tematico_id: string;
    segmento_educacional_id: string;
    tipo_instituicao_id: string;
    qualis_capes_id: string;
    autores: AutorItem[];
    palavras_chave: string[];   // IDs as strings
    areas: string[];            // IDs as strings
}

export interface FormLookups {
    tiposPublicacao: LookupOption[];
    formasApresentacao: LookupOption[];
    locaisPublicacao: LookupOption[];
    turmas: LookupOption[];
    eixosTematicos: LookupOption[];
    segmentosEducacionais: LookupOption[];
    tiposInstituicao: LookupOption[];
    qualisCapes: LookupOption[];
    palavrasChaveDisponiveis: LookupOption[];
    areasDisponiveis: LookupOption[];
    autoresDisponiveis: LookupOption[];
}

interface PublicacaoFormProps {
    initialData: PublicacaoFormData;
    lookups: FormLookups;
    submitUrl: string;
    method: 'post' | 'put';
    errors?: Record<string, string>;
}
```

- [ ] **Step 2: Implementar o componente completo**

```tsx
export function PublicacaoForm({ initialData, lookups, submitUrl, method, errors = {} }: PublicacaoFormProps) {
    const [data, setData] = useState<PublicacaoFormData>(initialData);
    const [processing, setProcessing] = useState(false);

    // Cópias mutáveis dos lookups para inline create
    const [tiposPublicacao, setTiposPublicacao] = useState(lookups.tiposPublicacao);
    const [formasApresentacao, setFormasApresentacao] = useState(lookups.formasApresentacao);
    const [locaisPublicacao, setLocaisPublicacao] = useState(lookups.locaisPublicacao);
    const [turmas, setTurmas] = useState(lookups.turmas);
    const [eixosTematicos, setEixosTematicos] = useState(lookups.eixosTematicos);
    const [segmentosEducacionais, setSegmentosEducacionais] = useState(lookups.segmentosEducacionais);
    const [tiposInstituicao, setTiposInstituicao] = useState(lookups.tiposInstituicao);
    const [qualisCapes, setQualisCapes] = useState(lookups.qualisCapes);
    const [palavrasChaveDisponiveis, setPalavrasChaveDisponiveis] = useState(lookups.palavrasChaveDisponiveis);
    const [autoresDisponiveis, setAutoresDisponiveis] = useState(lookups.autoresDisponiveis);

    function set<K extends keyof PublicacaoFormData>(key: K, value: PublicacaoFormData[K]) {
        setData(prev => ({ ...prev, [key]: value }));
    }

    function addPalavraChave(id: string) {
        if (!data.palavras_chave.includes(id)) {
            set('palavras_chave', [...data.palavras_chave, id]);
        }
    }

    function removePalavraChave(id: string) {
        set('palavras_chave', data.palavras_chave.filter(pk => pk !== id));
    }

    function addAutor(option: LookupOption) {
        if (!data.autores.find(a => String(a.id) === option.value)) {
            set('autores', [...data.autores, { id: Number(option.value), nome: option.label }]);
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);

        const payload = {
            ...data,
            autores: data.autores.map((a, i) => ({ id: a.id, ordem: i + 1 })),
            palavras_chave: data.palavras_chave.map(Number),
            areas: data.areas.map(Number),
            tipo_publicacao_id: data.tipo_publicacao_id ? Number(data.tipo_publicacao_id) : null,
            forma_apresentacao_id: data.forma_apresentacao_id ? Number(data.forma_apresentacao_id) : null,
            local_publicacao_id: data.local_publicacao_id ? Number(data.local_publicacao_id) : null,
            turma_id: data.turma_id ? Number(data.turma_id) : null,
            eixo_tematico_id: data.eixo_tematico_id ? Number(data.eixo_tematico_id) : null,
            segmento_educacional_id: data.segmento_educacional_id ? Number(data.segmento_educacional_id) : null,
            tipo_instituicao_id: data.tipo_instituicao_id ? Number(data.tipo_instituicao_id) : null,
            qualis_capes_id: data.qualis_capes_id ? Number(data.qualis_capes_id) : null,
        };

        router[method](submitUrl, payload, {
            onFinish: () => setProcessing(false),
        });
    }

    const fieldError = (field: string) =>
        errors[field] ? <p className="mt-1 text-xs text-destructive">{errors[field]}</p> : null;

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* ── Coluna esquerda (2/3) ── */}
            <div className="flex flex-col gap-6 lg:col-span-2">

                {/* Dados Básicos */}
                <Card>
                    <CardHeader><CardTitle>Dados Básicos</CardTitle></CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div>
                            <Label htmlFor="titulo">Título *</Label>
                            <Input id="titulo" value={data.titulo} onChange={e => set('titulo', e.target.value)} />
                            {fieldError('titulo')}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="ano">Ano *</Label>
                                <Input id="ano" type="number" value={data.ano} onChange={e => set('ano', e.target.value)} />
                                {fieldError('ano')}
                            </div>
                            <div>
                                <Label htmlFor="tipo_publicacao_id">Tipo de Publicação</Label>
                                <CreatableSelect
                                    options={tiposPublicacao}
                                    value={data.tipo_publicacao_id}
                                    onValueChange={v => set('tipo_publicacao_id', v)}
                                    onItemCreated={item => { setTiposPublicacao(p => [...p, item]); set('tipo_publicacao_id', item.value); }}
                                    inlineCreateUrl="/admin/cadastros/tipos-publicacao/inline-create"
                                    placeholder="Selecione..."
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="volume">Volume</Label>
                                <Input id="volume" value={data.volume} onChange={e => set('volume', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="numero">Número</Label>
                                <Input id="numero" value={data.numero} onChange={e => set('numero', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="pagina">Páginas</Label>
                                <Input id="pagina" value={data.pagina} onChange={e => set('pagina', e.target.value)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="isbn">ISBN</Label>
                                <Input id="isbn" value={data.isbn} onChange={e => set('isbn', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="doi">DOI</Label>
                                <Input id="doi" value={data.doi} onChange={e => set('doi', e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="link">Link *</Label>
                            <Input id="link" type="url" value={data.link} onChange={e => set('link', e.target.value)} />
                            {fieldError('link')}
                        </div>
                        <div>
                            <Label htmlFor="resumo">Resumo *</Label>
                            <Textarea id="resumo" rows={5} value={data.resumo} onChange={e => set('resumo', e.target.value)} />
                            {fieldError('resumo')}
                        </div>
                    </CardContent>
                </Card>

                {/* Autores */}
                <Card>
                    <CardHeader><CardTitle>Autores *</CardTitle></CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        {fieldError('autores')}
                        <AutorList autores={data.autores} onChange={autores => set('autores', autores)} />
                        <div>
                            <Label>Adicionar autor</Label>
                            <CreatableSelect
                                options={autoresDisponiveis.filter(o => !data.autores.find(a => String(a.id) === o.value))}
                                value=""
                                onValueChange={v => {
                                    const opt = autoresDisponiveis.find(o => o.value === v);
                                    if (opt) addAutor(opt);
                                }}
                                onItemCreated={item => {
                                    setAutoresDisponiveis(p => [...p, item]);
                                    addAutor(item);
                                }}
                                inlineCreateUrl="/admin/cadastros/autores/inline-create"
                                placeholder="Buscar ou criar autor..."
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Palavras-chave */}
                <Card>
                    <CardHeader><CardTitle>Palavras-chave *</CardTitle></CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        {fieldError('palavras_chave')}
                        <div className="flex flex-wrap gap-2">
                            {data.palavras_chave.map(pkId => {
                                const opt = palavrasChaveDisponiveis.find(o => o.value === pkId);
                                return opt ? (
                                    <span key={pkId} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">
                                        {opt.label}
                                        <button type="button" onClick={() => removePalavraChave(pkId)}>
                                            <X className="size-3" />
                                        </button>
                                    </span>
                                ) : null;
                            })}
                        </div>
                        <CreatableSelect
                            options={palavrasChaveDisponiveis.filter(o => !data.palavras_chave.includes(o.value))}
                            value=""
                            onValueChange={addPalavraChave}
                            onItemCreated={item => {
                                setPalavrasChaveDisponiveis(p => [...p, item]);
                                addPalavraChave(item.value);
                            }}
                            inlineCreateUrl="/admin/cadastros/palavras-chave/inline-create"
                            placeholder="Buscar ou criar palavra-chave..."
                        />
                    </CardContent>
                </Card>
            </div>

            {/* ── Coluna direita (1/3) ── */}
            <div className="flex flex-col gap-6">

                {/* Classificação */}
                <Card>
                    <CardHeader><CardTitle>Classificação</CardTitle></CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div>
                            <Label>Áreas do Conhecimento</Label>
                            <div className="flex flex-wrap gap-1 mb-2">
                                {data.areas.map(aId => {
                                    const opt = lookups.areasDisponiveis.find(o => o.value === aId);
                                    return opt ? (
                                        <span key={aId} className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs">
                                            {opt.label}
                                            <button type="button" onClick={() => set('areas', data.areas.filter(a => a !== aId))}>
                                                <X className="size-3" />
                                            </button>
                                        </span>
                                    ) : null;
                                })}
                            </div>
                            <CreatableSelect
                                options={lookups.areasDisponiveis.filter(o => !data.areas.includes(o.value))}
                                value=""
                                onValueChange={v => !data.areas.includes(v) && set('areas', [...data.areas, v])}
                                onItemCreated={item => set('areas', [...data.areas, item.value])}
                                inlineCreateUrl="/admin/cadastros/areas/inline-create"
                                placeholder="Adicionar área..."
                            />
                        </div>
                        <div>
                            <Label>Eixo Temático</Label>
                            <CreatableSelect
                                options={eixosTematicos}
                                value={data.eixo_tematico_id}
                                onValueChange={v => set('eixo_tematico_id', v)}
                                onItemCreated={item => { setEixosTematicos(p => [...p, item]); set('eixo_tematico_id', item.value); }}
                                inlineCreateUrl="/admin/cadastros/eixos-tematicos/inline-create"
                                placeholder="Selecione..."
                            />
                        </div>
                        <div>
                            <Label>Segmento Educacional</Label>
                            <CreatableSelect
                                options={segmentosEducacionais}
                                value={data.segmento_educacional_id}
                                onValueChange={v => set('segmento_educacional_id', v)}
                                onItemCreated={item => { setSegmentosEducacionais(p => [...p, item]); set('segmento_educacional_id', item.value); }}
                                inlineCreateUrl="/admin/cadastros/segmentos-educacionais/inline-create"
                                placeholder="Selecione..."
                            />
                        </div>
                        <div>
                            <Label>Turma</Label>
                            <CreatableSelect
                                options={turmas}
                                value={data.turma_id}
                                onValueChange={v => set('turma_id', v)}
                                onItemCreated={item => { setTurmas(p => [...p, item]); set('turma_id', item.value); }}
                                inlineCreateUrl="/admin/cadastros/turmas/inline-create"
                                placeholder="Selecione..."
                            />
                        </div>
                        <div>
                            <Label>Tipo de Instituição</Label>
                            <CreatableSelect
                                options={tiposInstituicao}
                                value={data.tipo_instituicao_id}
                                onValueChange={v => set('tipo_instituicao_id', v)}
                                onItemCreated={item => { setTiposInstituicao(p => [...p, item]); set('tipo_instituicao_id', item.value); }}
                                inlineCreateUrl="/admin/cadastros/tipos-instituicao/inline-create"
                                placeholder="Selecione..."
                            />
                        </div>
                        <div>
                            <Label>Qualis CAPES</Label>
                            <CreatableSelect
                                options={qualisCapes}
                                value={data.qualis_capes_id}
                                onValueChange={v => set('qualis_capes_id', v)}
                                onItemCreated={item => { setQualisCapes(p => [...p, item]); set('qualis_capes_id', item.value); }}
                                inlineCreateUrl="/admin/cadastros/qualis-capes/inline-create"
                                placeholder="Selecione..."
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Localização */}
                <Card>
                    <CardHeader><CardTitle>Localização</CardTitle></CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div>
                            <Label>Local de Publicação</Label>
                            <CreatableSelect
                                options={locaisPublicacao}
                                value={data.local_publicacao_id}
                                onValueChange={v => set('local_publicacao_id', v)}
                                onItemCreated={item => { setLocaisPublicacao(p => [...p, item]); set('local_publicacao_id', item.value); }}
                                inlineCreateUrl="/admin/cadastros/locais-publicacao/inline-create"
                                placeholder="Selecione..."
                            />
                        </div>
                        <div>
                            <Label>Forma de Apresentação</Label>
                            <CreatableSelect
                                options={formasApresentacao}
                                value={data.forma_apresentacao_id}
                                onValueChange={v => set('forma_apresentacao_id', v)}
                                onItemCreated={item => { setFormasApresentacao(p => [...p, item]); set('forma_apresentacao_id', item.value); }}
                                inlineCreateUrl="/admin/cadastros/formas-apresentacao/inline-create"
                                placeholder="Selecione..."
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Botão de submit */}
                <Button type="submit" disabled={processing} className="w-full">
                    {processing && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Salvar
                </Button>
            </div>
        </form>
    );
}
```

- [ ] **Step 3: Commit**

```powershell
git add resources/js/components/admin/PublicacaoForm.tsx
git commit -m "feat(admin): PublicacaoForm com todos os 8 FKs como CreatableSelect"
```

---

## Task 13: Páginas Create e Edit

**Files:**
- Create: `resources/js/pages/admin/Publicacoes/Create.tsx`
- Create: `resources/js/pages/admin/Publicacoes/Edit.tsx`

- [ ] **Step 1: Criar `Create.tsx`**

```tsx
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { PublicacaoForm, type FormLookups } from '@/components/admin/PublicacaoForm';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Publicações', href: '/admin/publicacoes' },
    { title: 'Nova Publicação', href: '/admin/publicacoes/create' },
];

interface CreateProps {
    lookups: FormLookups;
    defaults: {
        tipo_publicacao_id: string;
        forma_apresentacao_id: string;
        area_id: string;
    };
    errors?: Record<string, string>;
}

export default function PublicacoesCreate({ lookups, defaults, errors }: CreateProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nova Publicação" />
            <div className="flex flex-col gap-6">
                <h1 className="text-2xl font-bold">Nova Publicação</h1>
                <PublicacaoForm
                    initialData={{
                        titulo: '',
                        ano: String(new Date().getFullYear()),
                        link: '',
                        resumo: '',
                        volume: '',
                        numero: '',
                        pagina: '',
                        isbn: '',
                        doi: '',
                        tipo_publicacao_id: defaults.tipo_publicacao_id,
                        forma_apresentacao_id: defaults.forma_apresentacao_id,
                        local_publicacao_id: '',
                        turma_id: '',
                        eixo_tematico_id: '',
                        segmento_educacional_id: '',
                        tipo_instituicao_id: '',
                        qualis_capes_id: '',
                        autores: [],
                        palavras_chave: [],
                        areas: defaults.area_id ? [defaults.area_id] : [],
                    }}
                    lookups={lookups}
                    submitUrl="/admin/publicacoes"
                    method="post"
                    errors={errors}
                />
            </div>
        </AppLayout>
    );
}
```

- [ ] **Step 2: Criar `Edit.tsx`**

```tsx
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { PublicacaoForm, type FormLookups, type PublicacaoFormData } from '@/components/admin/PublicacaoForm';

interface EditProps {
    publicacao: PublicacaoFormData & { id: number };
    lookups: FormLookups;
    errors?: Record<string, string>;
}

export default function PublicacoesEdit({ publicacao, lookups, errors }: EditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Publicações', href: '/admin/publicacoes' },
        { title: publicacao.titulo || `Publicação #${publicacao.id}`, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar — ${publicacao.titulo}`} />
            <div className="flex flex-col gap-6">
                <h1 className="text-2xl font-bold">Editar Publicação</h1>
                <PublicacaoForm
                    initialData={publicacao}
                    lookups={lookups}
                    submitUrl={`/admin/publicacoes/${publicacao.id}`}
                    method="put"
                    errors={errors}
                />
            </div>
        </AppLayout>
    );
}
```

- [ ] **Step 3: Commit**

```powershell
git add resources/js/pages/admin/Publicacoes/Create.tsx
git add resources/js/pages/admin/Publicacoes/Edit.tsx
git commit -m "feat(admin): páginas Create e Edit de publicação"
```

---

## Task 14: PublicacoesController — CRUD Completo

**Files:**
- Modify: `app/Http/Controllers/Admin/PublicacoesController.php`

> **Nota de segurança:** Não mencionar em comentários, docstrings ou mensagens de commit o mecanismo de acesso administrativo.

- [ ] **Step 1: Escrever os testes de feature**

Adicione ao `tests/Feature/Admin/PublicacoesControllerTest.php`:

```php
it('guests cannot access create form', function () {
    $this->get('/admin/publicacoes/create')->assertRedirect('/login');
});

it('create renders form with lookups', function () {
    $this->get('/admin/publicacoes/create')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/Publicacoes/Create')
            ->has('lookups.tiposPublicacao')
            ->has('lookups.formasApresentacao')
            ->has('lookups.autoresDisponiveis')
            ->has('lookups.palavrasChaveDisponiveis')
            ->has('defaults')
        );
});

it('store creates publication with autores and palavras_chave', function () {
    $autor = \App\Models\Autor::factory()->create();
    $pk = \App\Models\PalavraChave::factory()->create();

    $this->post('/admin/publicacoes', [
        'titulo'      => 'AVALIAÇÃO FORMATIVA',
        'ano'         => 2023,
        'link'        => 'https://example.com',
        'resumo'      => 'Resumo de teste.',
        'autores'     => [['id' => $autor->id, 'ordem' => 1]],
        'palavras_chave' => [$pk->id],
        'areas'       => [],
    ])->assertRedirect();

    $pub = \App\Models\Publicacao::where('titulo', 'Avaliação formativa')->first();
    expect($pub)->not->toBeNull();
    expect($pub->autores)->toHaveCount(1);
    expect($pub->palavrasChave)->toHaveCount(1);
    expect($pub->incluida_em)->not->toBeNull();
});

it('store applies sentence case to titulo', function () {
    $autor = \App\Models\Autor::factory()->create();
    $pk = \App\Models\PalavraChave::factory()->create();

    $this->post('/admin/publicacoes', [
        'titulo'         => 'AVALIAÇÃO NO ENSINO MÉDIO',
        'ano'            => 2023,
        'link'           => 'https://example.com',
        'resumo'         => 'Resumo.',
        'autores'        => [['id' => $autor->id, 'ordem' => 1]],
        'palavras_chave' => [$pk->id],
        'areas'          => [],
    ]);

    expect(\App\Models\Publicacao::latest('id')->first()->titulo)
        ->toBe('Avaliação no ensino médio');
});

it('store validates required fields', function () {
    $this->post('/admin/publicacoes', [])
        ->assertSessionHasErrors(['titulo', 'ano', 'link', 'resumo', 'autores', 'palavras_chave']);
});

it('edit renders form with publication data', function () {
    $pub = \App\Models\Publicacao::factory()->create();
    $this->get("/admin/publicacoes/{$pub->id}/edit")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/Publicacoes/Edit')
            ->has('publicacao')
            ->where('publicacao.id', $pub->id)
        );
});

it('update syncs autores with correct ordem', function () {
    $pub = \App\Models\Publicacao::factory()->create();
    $a1 = \App\Models\Autor::factory()->create();
    $a2 = \App\Models\Autor::factory()->create();
    $pk = \App\Models\PalavraChave::factory()->create();

    $this->put("/admin/publicacoes/{$pub->id}", [
        'titulo'         => $pub->titulo,
        'ano'            => $pub->ano,
        'link'           => $pub->link,
        'resumo'         => $pub->resumo,
        'autores'        => [
            ['id' => $a2->id, 'ordem' => 1],
            ['id' => $a1->id, 'ordem' => 2],
        ],
        'palavras_chave' => [$pk->id],
        'areas'          => [],
    ])->assertRedirect();

    $pivot = $pub->fresh()->autores()->withPivot('ordem')->get();
    expect($pivot->firstWhere('id', $a2->id)->pivot->ordem)->toBe(1);
    expect($pivot->firstWhere('id', $a1->id)->pivot->ordem)->toBe(2);
});
```

- [ ] **Step 2: Rodar — deve falhar**

```powershell
php artisan test tests/Feature/Admin/PublicacoesControllerTest.php
```

- [ ] **Step 3: Implementar o controller completo**

Substitua todo o conteúdo de `app/Http/Controllers/Admin/PublicacoesController.php`:

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\Autor;
use App\Models\EixoTematico;
use App\Models\FormaApresentacao;
use App\Models\LocalPublicacao;
use App\Models\PalavraChave;
use App\Models\Publicacao;
use App\Models\QualisCape;
use App\Models\SegmentoEducacional;
use App\Models\TipoInstituicao;
use App\Models\TipoPublicacao;
use App\Models\Turma;
use App\Services\NormalizacaoTextoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PublicacoesController extends Controller
{
    public function index(): Response
    {
        $publicacoes = Publicacao::with(['autores', 'tipoPublicacao', 'formaApresentacao'])
            ->orderBy('id')
            ->get()
            ->map(fn ($pub) => [
                'id'      => $pub->id,
                'title'   => $pub->titulo,
                'authors' => $pub->autores->sortBy('pivot.ordem')->pluck('nome')->implode(', '),
                'year'    => $pub->ano,
                'doi'     => $pub->doi,
                'isbn'    => $pub->isbn,
                'tipo'    => $pub->tipoPublicacao?->nome,
            ]);

        return Inertia::render('admin/Publicacoes/Index', compact('publicacoes'));
    }

    public function create(): Response
    {
        return Inertia::render('admin/Publicacoes/Create', [
            'lookups'  => $this->buildLookups(),
            'defaults' => $this->buildDefaults(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate($this->validationRules());

        DB::transaction(function () use ($data) {
            $pub = Publicacao::create([
                'titulo'                  => NormalizacaoTextoService::sentenceCase($data['titulo']),
                'ano'                     => $data['ano'],
                'link'                    => $data['link'],
                'resumo'                  => $data['resumo'],
                'volume'                  => $data['volume'] ?? null,
                'numero'                  => $data['numero'] ?? null,
                'pagina'                  => $data['pagina'] ?? null,
                'isbn'                    => $data['isbn'] ?? null,
                'doi'                     => $data['doi'] ?? null,
                'tipo_publicacao_id'      => $data['tipo_publicacao_id'] ?? null,
                'forma_apresentacao_id'   => $data['forma_apresentacao_id'] ?? null,
                'local_publicacao_id'     => $data['local_publicacao_id'] ?? null,
                'turma_id'               => $data['turma_id'] ?? null,
                'eixo_tematico_id'       => $data['eixo_tematico_id'] ?? null,
                'segmento_educacional_id' => $data['segmento_educacional_id'] ?? null,
                'tipo_instituicao_id'     => $data['tipo_instituicao_id'] ?? null,
                'qualis_capes_id'         => $data['qualis_capes_id'] ?? null,
                'incluida_em'             => now(),
            ]);

            $this->syncAutores($pub, $data['autores']);
            $pub->palavrasChave()->sync($data['palavras_chave'] ?? []);
            $pub->areas()->sync($data['areas'] ?? []);
        });

        return redirect()->route('admin.publicacoes')->with('success', 'Publicação criada.');
    }

    public function edit(int $id): Response
    {
        $pub = Publicacao::with(['autores' => fn ($q) => $q->orderBy('autor_publicacao.ordem'), 'palavrasChave', 'areas'])->findOrFail($id);

        return Inertia::render('admin/Publicacoes/Edit', [
            'publicacao' => [
                'id'                      => $pub->id,
                'titulo'                  => $pub->titulo,
                'ano'                     => (string) $pub->ano,
                'link'                    => $pub->link ?? '',
                'resumo'                  => $pub->resumo ?? '',
                'volume'                  => $pub->volume ?? '',
                'numero'                  => $pub->numero ?? '',
                'pagina'                  => $pub->pagina ?? '',
                'isbn'                    => $pub->isbn ?? '',
                'doi'                     => $pub->doi ?? '',
                'tipo_publicacao_id'      => (string) ($pub->tipo_publicacao_id ?? ''),
                'forma_apresentacao_id'   => (string) ($pub->forma_apresentacao_id ?? ''),
                'local_publicacao_id'     => (string) ($pub->local_publicacao_id ?? ''),
                'turma_id'               => (string) ($pub->turma_id ?? ''),
                'eixo_tematico_id'       => (string) ($pub->eixo_tematico_id ?? ''),
                'segmento_educacional_id' => (string) ($pub->segmento_educacional_id ?? ''),
                'tipo_instituicao_id'     => (string) ($pub->tipo_instituicao_id ?? ''),
                'qualis_capes_id'         => (string) ($pub->qualis_capes_id ?? ''),
                'autores'                 => $pub->autores->map(fn ($a) => ['id' => $a->id, 'nome' => $a->nome])->values(),
                'palavras_chave'          => $pub->palavrasChave->pluck('id')->map(fn ($id) => (string) $id)->values(),
                'areas'                   => $pub->areas->pluck('id')->map(fn ($id) => (string) $id)->values(),
            ],
            'lookups' => $this->buildLookups(),
        ]);
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $pub  = Publicacao::findOrFail($id);
        $data = $request->validate($this->validationRules());

        DB::transaction(function () use ($pub, $data) {
            $pub->update([
                'titulo'                  => NormalizacaoTextoService::sentenceCase($data['titulo']),
                'ano'                     => $data['ano'],
                'link'                    => $data['link'],
                'resumo'                  => $data['resumo'],
                'volume'                  => $data['volume'] ?? null,
                'numero'                  => $data['numero'] ?? null,
                'pagina'                  => $data['pagina'] ?? null,
                'isbn'                    => $data['isbn'] ?? null,
                'doi'                     => $data['doi'] ?? null,
                'tipo_publicacao_id'      => $data['tipo_publicacao_id'] ?? null,
                'forma_apresentacao_id'   => $data['forma_apresentacao_id'] ?? null,
                'local_publicacao_id'     => $data['local_publicacao_id'] ?? null,
                'turma_id'               => $data['turma_id'] ?? null,
                'eixo_tematico_id'       => $data['eixo_tematico_id'] ?? null,
                'segmento_educacional_id' => $data['segmento_educacional_id'] ?? null,
                'tipo_instituicao_id'     => $data['tipo_instituicao_id'] ?? null,
                'qualis_capes_id'         => $data['qualis_capes_id'] ?? null,
                'editada_em'              => now(),
            ]);

            $this->syncAutores($pub, $data['autores']);
            $pub->palavrasChave()->sync($data['palavras_chave'] ?? []);
            $pub->areas()->sync($data['areas'] ?? []);
        });

        return back()->with('success', 'Publicação atualizada.');
    }

    public function orphans(int $id): JsonResponse
    {
        $pub = Publicacao::findOrFail($id);

        $autorOrfaos = Autor::whereHas('publicacoes', fn ($q) => $q->where('publicacao.id', $id))
            ->withCount('publicacoes')
            ->get()
            ->filter(fn ($a) => $a->publicacoes_count === 1)
            ->map(fn ($a) => ['id' => $a->id, 'nome' => $a->nome])
            ->values();

        $pkOrfas = PalavraChave::whereHas('publicacoes', fn ($q) => $q->where('publicacao.id', $id))
            ->withCount('publicacoes')
            ->get()
            ->filter(fn ($pk) => $pk->publicacoes_count === 1)
            ->map(fn ($pk) => ['id' => $pk->id, 'texto' => $pk->texto])
            ->values();

        $localOrfao = null;
        if ($pub->local_publicacao_id) {
            $local = LocalPublicacao::withCount('publicacoes')->find($pub->local_publicacao_id);
            if ($local && $local->publicacoes_count === 1) {
                $localOrfao = [['id' => $local->id, 'nome' => $local->nome]];
            }
        }

        return response()->json([
            'autores'          => $autorOrfaos,
            'palavras_chave'   => $pkOrfas,
            'locais_publicacao' => $localOrfao ?? [],
        ]);
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $pub = Publicacao::findOrFail($id);
        $keepOrphans = $request->boolean('keep_orphans', false);

        DB::transaction(function () use ($pub, $keepOrphans) {
            if (!$keepOrphans) {
                $autorIds = Autor::whereHas('publicacoes', fn ($q) => $q->where('publicacao.id', $pub->id))
                    ->withCount('publicacoes')
                    ->get()
                    ->filter(fn ($a) => $a->publicacoes_count === 1)
                    ->pluck('id');

                $pkIds = PalavraChave::whereHas('publicacoes', fn ($q) => $q->where('publicacao.id', $pub->id))
                    ->withCount('publicacoes')
                    ->get()
                    ->filter(fn ($pk) => $pk->publicacoes_count === 1)
                    ->pluck('id');

                $localId = null;
                if ($pub->local_publicacao_id) {
                    $local = LocalPublicacao::withCount('publicacoes')->find($pub->local_publicacao_id);
                    if ($local && $local->publicacoes_count === 1) {
                        $localId = $local->id;
                    }
                }
            }

            $pub->autores()->detach();
            $pub->palavrasChave()->detach();
            $pub->areas()->detach();
            $pub->delete();

            if (!$keepOrphans) {
                if (!empty($autorIds)) Autor::destroy($autorIds);
                if (!empty($pkIds)) PalavraChave::destroy($pkIds);
                if ($localId) LocalPublicacao::destroy($localId);
            }
        });

        return redirect()->route('admin.publicacoes')->with('success', 'Publicação excluída.');
    }

    // ── Helpers privados ────────────────────────────────────────────────────────

    private function buildLookups(): array
    {
        return [
            'tiposPublicacao'        => TipoPublicacao::orderBy('nome')->get()->map(fn ($m) => ['value' => (string) $m->id, 'label' => $m->nome]),
            'formasApresentacao'     => FormaApresentacao::orderBy('nome')->get()->map(fn ($m) => ['value' => (string) $m->id, 'label' => $m->nome]),
            'locaisPublicacao'       => LocalPublicacao::orderBy('nome')->get()->map(fn ($m) => ['value' => (string) $m->id, 'label' => $m->nome]),
            'turmas'                 => Turma::orderBy('nome')->get()->map(fn ($m) => ['value' => (string) $m->id, 'label' => $m->nome]),
            'eixosTematicos'         => EixoTematico::orderBy('nome')->get()->map(fn ($m) => ['value' => (string) $m->id, 'label' => $m->nome]),
            'segmentosEducacionais'  => SegmentoEducacional::orderBy('nome')->get()->map(fn ($m) => ['value' => (string) $m->id, 'label' => $m->nome]),
            'tiposInstituicao'       => TipoInstituicao::orderBy('nome')->get()->map(fn ($m) => ['value' => (string) $m->id, 'label' => $m->nome]),
            'qualisCapes'            => QualisCape::orderBy('classificacao')->get()->map(fn ($m) => ['value' => (string) $m->id, 'label' => $m->classificacao]),
            'areasDisponiveis'       => Area::orderBy('nome')->get()->map(fn ($m) => ['value' => (string) $m->id, 'label' => $m->nome]),
            'palavrasChaveDisponiveis' => PalavraChave::orderBy('texto')->get()->map(fn ($m) => ['value' => (string) $m->id, 'label' => $m->texto]),
            'autoresDisponiveis'     => Autor::orderBy('nome')->get()->map(fn ($m) => ['value' => (string) $m->id, 'label' => $m->nome]),
        ];
    }

    private function buildDefaults(): array
    {
        $artigo = TipoPublicacao::where('nome', 'Artigo')->first();
        $online = FormaApresentacao::where('nome', 'Online')->first();
        $educacao = Area::where('nome', 'Educação')->first();

        return [
            'tipo_publicacao_id'    => $artigo  ? (string) $artigo->id  : '',
            'forma_apresentacao_id' => $online  ? (string) $online->id  : '',
            'area_id'               => $educacao ? (string) $educacao->id : '',
        ];
    }

    private function syncAutores(Publicacao $pub, array $autores): void
    {
        $syncData = collect($autores)->mapWithKeys(fn ($a) => [
            $a['id'] => ['ordem' => $a['ordem']],
        ])->toArray();

        $pub->autores()->sync($syncData);
    }

    private function validationRules(): array
    {
        return [
            'titulo'                  => 'required|string|max:500',
            'ano'                     => 'required|integer|min:1900|max:' . date('Y'),
            'link'                    => 'required|url|max:500',
            'resumo'                  => 'required|string',
            'tipo_publicacao_id'      => 'nullable|exists:tipo_publicacao,id',
            'forma_apresentacao_id'   => 'nullable|exists:forma_apresentacao,id',
            'volume'                  => 'nullable|string|max:20',
            'numero'                  => 'nullable|string|max:20',
            'pagina'                  => 'nullable|string|max:50',
            'isbn'                    => 'nullable|string|max:20',
            'doi'                     => 'nullable|string|max:255',
            'local_publicacao_id'     => 'nullable|exists:local_publicacao,id',
            'turma_id'               => 'nullable|exists:turma,id',
            'eixo_tematico_id'       => 'nullable|exists:eixo_tematico,id',
            'segmento_educacional_id' => 'nullable|exists:segmento_educacional,id',
            'tipo_instituicao_id'     => 'nullable|exists:tipo_instituicao,id',
            'qualis_capes_id'         => 'nullable|exists:qualis_capes,id',
            'autores'                 => 'required|array|min:1',
            'autores.*.id'            => 'required|exists:autor,id',
            'autores.*.ordem'         => 'required|integer|min:1',
            'palavras_chave'          => 'required|array|min:1',
            'palavras_chave.*'        => 'integer|exists:palavra_chave,id',
            'areas'                   => 'nullable|array',
            'areas.*'                 => 'integer|exists:area,id',
        ];
    }
}
```

- [ ] **Step 4: Rodar os testes**

```powershell
php artisan test tests/Feature/Admin/PublicacoesControllerTest.php
```

Expected: PASS (todos os testes)

- [ ] **Step 5: Commit**

```powershell
git add app/Http/Controllers/Admin/PublicacoesController.php
git commit -m "feat(admin): PublicacoesController com CRUD completo (create/store/edit/update/destroy)"
```

---

## Task 15: Registrar Rotas do CRUD de Publicações

**Files:**
- Modify: `routes/web.php`

> **Atenção:** Rotas com segmentos fixos (`/create`, `/orphans`) devem vir **antes** das rotas com `{id}`.

- [ ] **Step 1: Atualizar o grupo admin no web.php**

Substitua a linha `Route::get('publicacoes', ...)` atual por:

```php
// Rotas fixas primeiro (antes de {id})
Route::get('publicacoes/create', [AdminPublicacoesController::class, 'create'])->name('admin.publicacoes.create');
Route::post('publicacoes', [AdminPublicacoesController::class, 'store'])->name('admin.publicacoes.store');

// Rota de listagem
Route::get('publicacoes', [AdminPublicacoesController::class, 'index'])->name('admin.publicacoes');

// Rotas com {id}
Route::get('publicacoes/{id}/edit', [AdminPublicacoesController::class, 'edit'])->name('admin.publicacoes.edit');
Route::put('publicacoes/{id}', [AdminPublicacoesController::class, 'update'])->name('admin.publicacoes.update');
Route::get('publicacoes/{id}/orphans', [AdminPublicacoesController::class, 'orphans'])->name('admin.publicacoes.orphans');
Route::delete('publicacoes/{id}', [AdminPublicacoesController::class, 'destroy'])->name('admin.publicacoes.destroy');
```

- [ ] **Step 2: Adicionar route para local de publicação inline-create**

No bloco de `inline-create` do passo anterior, adicionar `LocalPublicacaoController` se existir, ou criar o controller. Para simplificar no Subciclo 1, o `local_publicacao` não tem controller próprio ainda — a rota de inline-create pode usar um controller inline ou ser deixada para o Subciclo 2.

> **Nota:** Se `LocalPublicacaoController` não existir, a criação inline de locais estará desabilitada visualmente (o `inlineCreateUrl` retornará 404). Não bloqueia o restante do formulário. Pode ser adicionado em task separada se necessário.

- [ ] **Step 3: Verificar rotas**

```powershell
php artisan route:list --path=admin/publicacoes
```

Expected: 7 rotas listadas

- [ ] **Step 4: Ativar botões "Editar" e "Excluir" na Index.tsx**

Em `resources/js/pages/admin/Publicacoes/Index.tsx`, substitua a coluna `actions`:

```tsx
columnHelper.display({
    id: 'actions',
    enableSorting: false,
    header: () => <div className="text-right">Ações</div>,
    cell: ({ row }) => (
        <div className="flex justify-end gap-2">
            <Button
                variant="ghost"
                size="sm"
                asChild
            >
                <Link href={`/admin/publicacoes/${row.original.id}/edit`}>
                    Editar
                </Link>
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => handleDeleteClick(row.original.id)}
            >
                Excluir
            </Button>
        </div>
    ),
}),
```

Também adicionar o handler de delete com modal de confirmação (preflight para `/orphans`). O modal de confirmação segue o mesmo padrão já usado no `LookupCrud.tsx` — estado `pendingDelete`, fetch para `/orphans`, modal com opção "Apagar junto" (default) ou "Manter".

- [ ] **Step 5: Commit**

```powershell
git add routes/web.php
git add resources/js/pages/admin/Publicacoes/Index.tsx
git commit -m "feat(routes): rotas CRUD de publicações + botões Editar/Excluir ativos"
```

---

## Task 16: Adicionar Factories e Rodar Suite Completa

- [ ] **Step 1: Verificar se Publicacao factory existe**

```powershell
ls database/factories/ | grep Publicacao
```

Se não existir:

```php
// database/factories/PublicacaoFactory.php
<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class PublicacaoFactory extends Factory
{
    protected $model = \App\Models\Publicacao::class;

    public function definition(): array
    {
        return [
            'titulo'   => $this->faker->sentence(6),
            'ano'      => $this->faker->numberBetween(2001, 2025),
            'link'     => $this->faker->url(),
            'resumo'   => $this->faker->paragraph(),
            'incluida_em' => now(),
        ];
    }
}
```

Verificar também `AutorFactory` e `PalavraChaveFactory` — criar se não existirem seguindo o mesmo padrão.

- [ ] **Step 2: Rodar toda a suite**

```powershell
composer run test:all
```

Expected: tudo passando. Ajuste qualquer teste que falhar antes de seguir.

- [ ] **Step 3: Commit final de testes**

```powershell
git add database/factories/
git add tests/
git commit -m "test(admin): suite completa passando para Subciclo 1"
```

---

## Task 17: Verificação Manual em Browser

- [ ] `php artisan migrate` sem erros
- [ ] Sidebar: grupo "Cadastros" colapsável com 9 itens aparece
- [ ] `/admin/cadastros/tipos-publicacao` — criar, editar, excluir funcionam
- [ ] `/admin/cadastros/qualis-capes` — campo "Classificação", criar A1, A2 etc.
- [ ] `/admin/publicacoes` — filtro por "educacao" encontra "Educação"
- [ ] `/admin/publicacoes` — filtro por doi e isbn funcionam
- [ ] `/admin/publicacoes/create` — formulário abre com defaults (Artigo, Online, Educação)
- [ ] Criação inline: digitar valor novo → opção "Criar X" aparece
- [ ] Criação inline de duplicata: alerta de item parecido com opções "Usar existente" / "Criar mesmo assim"
- [ ] Salvar publicação com título em maiúsculas → sentence case salvo no banco
- [ ] Reordenar autores com drag → pivot atualizada com ordens corretas
- [ ] Excluir publicação → modal mostra órfãos, opção "Apagar junto" (default) funciona
- [ ] `/estatisticas/tipo-publicacao` — carrega sem erro

---

## Checklist de Pré-Entrega

- [ ] `composer run test:all` — PASS
- [ ] `npm run types` — sem erros
- [ ] `npm run lint` — sem warnings
- [ ] `git log --oneline -20` — commits atômicos e descritivos
