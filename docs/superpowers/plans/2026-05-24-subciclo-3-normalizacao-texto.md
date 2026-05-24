# Publicações — Subciclo 3: Normalização de Texto

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar lookup de exceções de capitalização, serviço de normalização sentence-case, aplicá-lo nos formulários e criar comando artisan para normalizar dados existentes.

**Architecture:** `NormalizacaoTextoService::sentenceCase()` é um helper estático que carrega exceções da tabela `termos_excecao_caso` via cache (1 hora). É chamado em `store`/`update` do `PublicacoesController` (títulos e palavras-chave) e no comando artisan `texto:normalizar`. O comando emite notificações database por registro alterado (agrupadas se > 10).

**Tech Stack:** Laravel 12, Eloquent, Cache facade, Artisan Command, database notifications.

---

## Mapa de arquivos

| Arquivo | Ação |
|---------|------|
| `database/migrations/2026_05_24_000001_create_termos_excecao_caso_table.php` | Criar |
| `database/seeders/TermoExcecaoCasoSeeder.php` | Criar |
| `app/Models/TermoExcecaoCaso.php` | Criar |
| `app/Http/Controllers/Admin/Lookups/TermoExcecaoCasoController.php` | Criar |
| `app/Services/NormalizacaoTextoService.php` | Criar |
| `app/Notifications/TextoNormalizado.php` | Criar |
| `app/Console/Commands/NormalizarTexto.php` | Criar |
| `routes/web.php` | Modificar — adicionar `termos-excecao` ao foreach de lookups |
| `resources/js/components/nav-cadastros.tsx` | Modificar — adicionar item no menu |
| `app/Http/Controllers/Admin/PublicacoesController.php` | Modificar — aplicar serviço em `store`, `update`, `syncPalavrasChave` e `criarPalavraChaveInline` |
| `tests/Feature/Admin/NormalizacaoTextoTest.php` | Criar |

---

## Task 1: Lookup `termos_excecao_caso`

**Files:**
- Create: `database/migrations/2026_05_24_000001_create_termos_excecao_caso_table.php`
- Create: `database/seeders/TermoExcecaoCasoSeeder.php`
- Create: `app/Models/TermoExcecaoCaso.php`
- Create: `app/Http/Controllers/Admin/Lookups/TermoExcecaoCasoController.php`
- Modify: `routes/web.php`
- Modify: `resources/js/components/nav-cadastros.tsx`

- [ ] **Step 1: Criar a migration**

```php
<?php
// database/migrations/2026_05_24_000001_create_termos_excecao_caso_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('termos_excecao_caso', function (Blueprint $table) {
            $table->id();
            $table->string('termo')->unique();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('termos_excecao_caso');
    }
};
```

- [ ] **Step 2: Criar o seeder**

```php
<?php
// database/seeders/TermoExcecaoCasoSeeder.php

namespace Database\Seeders;

use App\Models\TermoExcecaoCaso;
use Illuminate\Database\Seeder;

class TermoExcecaoCasoSeeder extends Seeder
{
    public function run(): void
    {
        $termos = ['LGPD', 'EaD', 'CNPq', 'SciELO', 'COVID-19', 'BNCC', 'ENEM', 'MEC', 'UNESCO', 'CAPES'];

        foreach ($termos as $termo) {
            TermoExcecaoCaso::firstOrCreate(['termo' => $termo]);
        }
    }
}
```

- [ ] **Step 3: Criar o model**

```php
<?php
// app/Models/TermoExcecaoCaso.php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $termo
 */
class TermoExcecaoCaso extends Model
{
    protected $table = 'termos_excecao_caso';

    public $timestamps = false;

    protected $fillable = ['termo'];

    protected function casts(): array
    {
        return ['id' => 'integer', 'termo' => 'string'];
    }
}
```

- [ ] **Step 4: Criar o controller**

```php
<?php
// app/Http/Controllers/Admin/Lookups/TermoExcecaoCasoController.php

declare(strict_types=1);

namespace App\Http\Controllers\Admin\Lookups;

use App\Http\Controllers\Admin\LookupController;
use App\Models\TermoExcecaoCaso;

class TermoExcecaoCasoController extends LookupController
{
    protected function model(): string
    {
        return TermoExcecaoCaso::class;
    }

    protected function label(): string
    {
        return 'Termo de Exceção';
    }

    protected function labelPlural(): string
    {
        return 'Termos de Exceção';
    }

    protected function nameColumn(): string
    {
        return 'termo';
    }

    protected function fields(): array
    {
        return [
            ['name' => 'termo', 'label' => 'Termo', 'type' => 'text', 'required' => true],
        ];
    }
}
```

- [ ] **Step 5: Registrar a rota em `routes/web.php`**

Adicionar o `use` no bloco de imports do arquivo:

```php
use App\Http\Controllers\Admin\Lookups\TermoExcecaoCasoController;
```

Dentro do `foreach` de lookups (o que registra os 8 CRUDs em `Route::prefix('cadastros')->name('admin.cadastros.')->group(...)`), adicionar a entrada:

```php
'termos-excecao' => TermoExcecaoCasoController::class,
```

O foreach completo ficará assim:

```php
foreach ([
    'areas'                  => AreaController::class,
    'eixos-tematicos'        => EixoTematicoController::class,
    'segmentos-educacionais' => SegmentoEducacionalController::class,
    'termos-excecao'         => TermoExcecaoCasoController::class,
    'turmas'                 => TurmaController::class,
    'tipos-instituicao'      => TipoInstituicaoController::class,
    'formas-apresentacao'    => FormaApresentacaoController::class,
    'tipos-publicacao'       => TipoPublicacaoController::class,
    'qualis-capes'           => QualisCapeController::class,
] as $prefix => $controller) {
```

- [ ] **Step 6: Adicionar ao menu Cadastros**

Em `resources/js/components/nav-cadastros.tsx`, adicionar ao array `cadastroItems` em ordem alfabética (entre "Segmentos Educacionais" e "Tipos de Instituição"):

```tsx
{ title: 'Termos de Exceção', href: '/admin/cadastros/termos-excecao' },
```

- [ ] **Step 7: Rodar migration e seed**

```bash
php artisan migrate
php artisan db:seed --class=TermoExcecaoCasoSeeder
```

Esperado: sem erros.

- [ ] **Step 8: Verificar rota e contagem**

```bash
php artisan route:list | grep termos
```

Esperado: 5 linhas para `admin/cadastros/termos-excecao`.

```bash
php artisan tinker --execute="echo App\Models\TermoExcecaoCaso::count();"
```

Esperado: `10`

- [ ] **Step 9: Commit**

```bash
git add database/migrations/2026_05_24_000001_create_termos_excecao_caso_table.php \
        database/seeders/TermoExcecaoCasoSeeder.php \
        app/Models/TermoExcecaoCaso.php \
        app/Http/Controllers/Admin/Lookups/TermoExcecaoCasoController.php \
        routes/web.php \
        resources/js/components/nav-cadastros.tsx
git commit -m "feat(admin): CRUD de termos de exceção de capitalização"
```

---

## Task 2: `NormalizacaoTextoService`

**Files:**
- Create: `app/Services/NormalizacaoTextoService.php`
- Create: `tests/Feature/Admin/NormalizacaoTextoTest.php`

- [ ] **Step 1: Escrever os testes do serviço**

```php
<?php
// tests/Feature/Admin/NormalizacaoTextoTest.php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\TermoExcecaoCaso;
use App\Services\NormalizacaoTextoService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class NormalizacaoTextoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::forget('termos_excecao_caso');
    }

    public function test_sentence_case_capitaliza_primeira_palavra(): void
    {
        $this->assertSame('Avaliação formativa', NormalizacaoTextoService::sentenceCase('avaliação formativa'));
    }

    public function test_sentence_case_converte_maiusculas_para_minusculas(): void
    {
        $this->assertSame('Educação básica', NormalizacaoTextoService::sentenceCase('EDUCAÇÃO BÁSICA'));
    }

    public function test_sentence_case_respeita_excecoes(): void
    {
        TermoExcecaoCaso::create(['termo' => 'BNCC']);
        Cache::forget('termos_excecao_caso');

        $this->assertSame('A BNCC no contexto escolar', NormalizacaoTextoService::sentenceCase('a bncc no contexto escolar'));
    }

    public function test_sentence_case_sem_excecao_normaliza_palavra_interna(): void
    {
        $this->assertSame('Avaliação no brasil', NormalizacaoTextoService::sentenceCase('avaliação no BRASIL'));
    }
}
```

- [ ] **Step 2: Rodar e verificar que falham**

```bash
php artisan test tests/Feature/Admin/NormalizacaoTextoTest.php
```

Esperado: 4 FAIL — `NormalizacaoTextoService` não existe.

- [ ] **Step 3: Criar o serviço**

```php
<?php
// app/Services/NormalizacaoTextoService.php

declare(strict_types=1);

namespace App\Services;

use App\Models\TermoExcecaoCaso;

class NormalizacaoTextoService
{
    public static function sentenceCase(string $texto): string
    {
        $excecoes = cache()->remember('termos_excecao_caso', 3600, fn () =>
            TermoExcecaoCaso::pluck('termo')->toArray()
        );

        $resultado = mb_strtolower(trim($texto));
        $resultado = mb_strtoupper(mb_substr($resultado, 0, 1)) . mb_substr($resultado, 1);

        foreach ($excecoes as $termo) {
            $resultado = preg_replace(
                '/\b' . preg_quote(mb_strtolower($termo), '/') . '\b/ui',
                $termo,
                $resultado
            );
        }

        return $resultado;
    }
}
```

- [ ] **Step 4: Rodar e verificar que passam**

```bash
php artisan test tests/Feature/Admin/NormalizacaoTextoTest.php
```

Esperado: 4 PASS.

- [ ] **Step 5: Commit**

```bash
git add app/Services/NormalizacaoTextoService.php tests/Feature/Admin/NormalizacaoTextoTest.php
git commit -m "feat(admin): NormalizacaoTextoService com sentence case e exceções em cache"
```

---

## Task 3: Integrar o serviço no `PublicacoesController`

**Files:**
- Modify: `app/Http/Controllers/Admin/PublicacoesController.php`

O controller está em `app/Http/Controllers/Admin/PublicacoesController.php`. Os 4 pontos de aplicação:

1. `store()` — normaliza `titulo` antes de criar
2. `update()` — normaliza `titulo` antes de atualizar
3. `syncPalavrasChave()` — normaliza `texto` antes de `firstOrCreate()`
4. `criarPalavraChaveInline()` — normaliza `texto` antes de `firstOrCreate()`

- [ ] **Step 1: Adicionar `use` do serviço**

No bloco de imports do controller (após o último `use`), adicionar:

```php
use App\Services\NormalizacaoTextoService;
```

- [ ] **Step 2: Modificar `store()`**

Substituir o bloco de `DB::transaction` em `store()` pela versão com normalização:

```php
public function store(Request $request): RedirectResponse
{
    $validated = $this->validateRequest($request);

    DB::transaction(function () use ($validated): void {
        $fields = $validated['fields'];
        if (isset($fields['titulo']) && is_string($fields['titulo'])) {
            $fields['titulo'] = NormalizacaoTextoService::sentenceCase($fields['titulo']);
        }
        $pub = Publicacao::create([...$fields, 'incluida_em' => now()]);
        $this->syncAutores($pub, $validated['autores']);
        $this->syncPalavrasChave($pub, $validated['palavras_chave']);
        $pub->areas()->sync($validated['area_ids']);
    });

    return redirect('/admin/publicacoes')->with('success', 'Publicação criada com sucesso.');
}
```

- [ ] **Step 3: Modificar `update()`**

Substituir o bloco de `DB::transaction` em `update()` pela versão com normalização:

```php
public function update(Request $request, int $id): RedirectResponse
{
    $pub = Publicacao::findOrFail($id);
    $validated = $this->validateRequest($request);

    DB::transaction(function () use ($pub, $validated): void {
        $fields = $validated['fields'];
        if (isset($fields['titulo']) && is_string($fields['titulo'])) {
            $fields['titulo'] = NormalizacaoTextoService::sentenceCase($fields['titulo']);
        }
        $pub->update([...$fields, 'editada_em' => now()]);
        $this->syncAutores($pub, $validated['autores']);
        $this->syncPalavrasChave($pub, $validated['palavras_chave']);
        $pub->areas()->sync($validated['area_ids']);
    });

    return redirect('/admin/publicacoes')->with('success', 'Publicação atualizada com sucesso.');
}
```

- [ ] **Step 4: Modificar `syncPalavrasChave()`**

Substituir a linha de `firstOrCreate` em `syncPalavrasChave()`:

```php
// Antes:
$pk = PalavraChave::firstOrCreate(['texto' => $texto]);

// Depois:
$pk = PalavraChave::firstOrCreate(['texto' => NormalizacaoTextoService::sentenceCase($texto)]);
```

- [ ] **Step 5: Modificar `criarPalavraChaveInline()`**

Substituir a linha de `firstOrCreate` em `criarPalavraChaveInline()`:

```php
// Antes:
$pk = PalavraChave::firstOrCreate(['texto' => $texto]);

// Depois:
$pk = PalavraChave::firstOrCreate(['texto' => NormalizacaoTextoService::sentenceCase($texto)]);
```

- [ ] **Step 6: Rodar a suite completa**

```bash
php artisan test
```

Esperado: todos passando.

- [ ] **Step 7: Commit**

```bash
git add app/Http/Controllers/Admin/PublicacoesController.php
git commit -m "feat(admin): aplica NormalizacaoTextoService em títulos e palavras-chave ao salvar"
```

---

## Task 4: Notificação e comando `texto:normalizar`

**Files:**
- Create: `app/Notifications/TextoNormalizado.php`
- Create: `app/Console/Commands/NormalizarTexto.php`
- Modify: `tests/Feature/Admin/NormalizacaoTextoTest.php`

- [ ] **Step 1: Criar a notificação**

```php
<?php
// app/Notifications/TextoNormalizado.php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TextoNormalizado extends Notification
{
    use Queueable;

    public function __construct(private readonly string $mensagem) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, string> */
    public function toDatabase(object $notifiable): array
    {
        return [
            'mensagem' => $this->mensagem,
            'url'      => '/admin/publicacoes',
        ];
    }
}
```

- [ ] **Step 2: Criar o comando**

```php
<?php
// app/Console/Commands/NormalizarTexto.php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\PalavraChave;
use App\Models\Publicacao;
use App\Models\User;
use App\Notifications\TextoNormalizado;
use App\Services\NormalizacaoTextoService;
use Illuminate\Console\Command;

class NormalizarTexto extends Command
{
    protected $signature   = 'texto:normalizar {--dry-run} {--tipo= : publicacoes, palavras-chave (omitir = ambos)}';
    protected $description = 'Normaliza títulos e palavras-chave existentes para sentence case';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $tipo   = $this->option('tipo');

        $alteracoes = [];

        if ($tipo === null || $tipo === 'publicacoes') {
            $alteracoes = array_merge($alteracoes, $this->processarPublicacoes($dryRun));
        }

        if ($tipo === null || $tipo === 'palavras-chave') {
            $alteracoes = array_merge($alteracoes, $this->processarPalavrasChave($dryRun));
        }

        $total = count($alteracoes);

        if ($total === 0) {
            $this->info('Nenhum registro precisou de normalização.');
            return self::SUCCESS;
        }

        $this->info(($dryRun ? '[DRY-RUN] ' : '') . "{$total} registro(s) " . ($dryRun ? 'seriam alterados.' : 'normalizados.'));

        if (!$dryRun) {
            $this->criarNotificacoes($alteracoes);
        }

        return self::SUCCESS;
    }

    /** @return list<array{tipo: string, id: int, original: string, normalizado: string}> */
    private function processarPublicacoes(bool $dryRun): array
    {
        $alteracoes = [];

        Publicacao::select(['id', 'titulo'])->chunk(200, function ($pubs) use ($dryRun, &$alteracoes): void {
            foreach ($pubs as $pub) {
                if ($pub->titulo === null) {
                    continue;
                }

                $normalizado = NormalizacaoTextoService::sentenceCase($pub->titulo);

                if ($normalizado === $pub->titulo) {
                    continue;
                }

                $this->line("  [{$pub->id}] \"{$pub->titulo}\" → \"{$normalizado}\"");

                if (!$dryRun) {
                    $pub->update(['titulo' => $normalizado, 'editada_em' => now()]);
                }

                $alteracoes[] = [
                    'tipo'        => 'Publicação',
                    'id'          => $pub->id,
                    'original'    => $pub->titulo,
                    'normalizado' => $normalizado,
                ];
            }
        });

        return $alteracoes;
    }

    /** @return list<array{tipo: string, id: int, original: string, normalizado: string}> */
    private function processarPalavrasChave(bool $dryRun): array
    {
        $alteracoes = [];

        PalavraChave::select(['id', 'texto'])->chunk(200, function ($pks) use ($dryRun, &$alteracoes): void {
            foreach ($pks as $pk) {
                $normalizado = NormalizacaoTextoService::sentenceCase($pk->texto);

                if ($normalizado === $pk->texto) {
                    continue;
                }

                $this->line("  [{$pk->id}] \"{$pk->texto}\" → \"{$normalizado}\"");

                if (!$dryRun) {
                    $pk->update(['texto' => $normalizado]);
                }

                $alteracoes[] = [
                    'tipo'        => 'Palavra-chave',
                    'id'          => $pk->id,
                    'original'    => $pk->texto,
                    'normalizado' => $normalizado,
                ];
            }
        });

        return $alteracoes;
    }

    /** @param list<array{tipo: string, id: int, original: string, normalizado: string}> $alteracoes */
    private function criarNotificacoes(array $alteracoes): void
    {
        $total = count($alteracoes);
        $users = User::all();

        if ($total > 10) {
            $mensagem = "{$total} registros normalizados para sentence case — revise na listagem.";
            $users->each(fn ($u) => $u->notify(new TextoNormalizado($mensagem)));
            return;
        }

        foreach ($alteracoes as $a) {
            $mensagem = "{$a['tipo']} normalizado para revisão: \"{$a['normalizado']}\" (era: \"{$a['original']}\").";
            $users->each(fn ($u) => $u->notify(new TextoNormalizado($mensagem)));
        }
    }
}
```

- [ ] **Step 3: Adicionar testes do comando ao arquivo existente**

Abrir `tests/Feature/Admin/NormalizacaoTextoTest.php` e adicionar os dois métodos abaixo, **antes do `}` de fechamento da classe**:

```php
    public function test_artisan_dry_run_nao_salva(): void
    {
        $local = \App\Models\LocalPublicacao::firstOrCreate(['nome' => 'Periódico Teste']);
        $pub = \App\Models\Publicacao::create([
            'titulo'              => 'TITULO EM MAIUSCULAS',
            'ano'                 => 2024,
            'doi'                 => '10.1/test',
            'resumo'              => 'Resumo com mais de cinquenta caracteres para ser válido.',
            'local_publicacao_id' => $local->id,
            'incluida_em'         => now(),
        ]);

        $this->artisan('texto:normalizar --dry-run');

        $this->assertSame('TITULO EM MAIUSCULAS', $pub->fresh()->titulo);
    }

    public function test_artisan_cria_notificacoes(): void
    {
        \Illuminate\Support\Facades\Notification::fake();

        $user  = \App\Models\User::factory()->create();
        $local = \App\Models\LocalPublicacao::firstOrCreate(['nome' => 'Periódico Teste']);
        \App\Models\Publicacao::create([
            'titulo'              => 'TITULO EM MAIUSCULAS',
            'ano'                 => 2024,
            'doi'                 => '10.1/test',
            'resumo'              => 'Resumo com mais de cinquenta caracteres para ser válido.',
            'local_publicacao_id' => $local->id,
            'incluida_em'         => now(),
        ]);

        $this->artisan('texto:normalizar');

        \Illuminate\Support\Facades\Notification::assertSentTo($user, \App\Notifications\TextoNormalizado::class);
    }
```

- [ ] **Step 4: Rodar os testes**

```bash
php artisan test tests/Feature/Admin/NormalizacaoTextoTest.php
```

Esperado: 6 PASS.

- [ ] **Step 5: Rodar suite completa**

```bash
php artisan test
```

Esperado: todos passando.

- [ ] **Step 6: Commit**

```bash
git add app/Notifications/TextoNormalizado.php \
        app/Console/Commands/NormalizarTexto.php \
        tests/Feature/Admin/NormalizacaoTextoTest.php
git commit -m "feat(admin): comando texto:normalizar com notificações database"
```

---

## Self-Review

**Cobertura da spec:**
- ✅ Tabela `termos_excecao_caso` com `id`, `termo` (unique) — Task 1
- ✅ Controller, rota, menu Cadastros — Task 1
- ✅ Seed inicial: LGPD, EaD, CNPq, SciELO, COVID-19, BNCC, ENEM, MEC, UNESCO, CAPES — Task 1
- ✅ `NormalizacaoTextoService::sentenceCase()` com cache 3600s — Task 2
- ✅ Aplicado em `store`, `update` (titulo), `syncPalavrasChave`, `criarPalavraChaveInline` — Task 3
- ✅ `--dry-run` não persiste alterações — Task 4
- ✅ `--tipo=publicacoes|palavras-chave` filtra escopo — Task 4
- ✅ Notificação por registro (≤ 10) ou agrupada (> 10) — Task 4
- ✅ Testes: sentence case, exceções, dry-run, notificações — Tasks 2 e 4

**Gaps intencionais:**
- Invalidação de cache ao alterar termos: TTL de 1h é aceitável; a spec não menciona invalidação imediata.
- Testes frontend: nenhum componente novo de frontend — o CRUD usa `LookupCrud` existente.
