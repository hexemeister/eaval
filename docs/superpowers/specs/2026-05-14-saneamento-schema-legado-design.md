# Saneamento do Schema Legado — Design Spec

**Data:** 2026-05-14  
**Status:** Aprovado (design), não iniciado (implementação)

---

## Contexto

O banco de dados do e-Aval foi migrado de uma aplicação descontinuada. O SQLite de produção contém tabelas e colunas que existem no arquivo mas não têm migration criadora — logo, um `php artisan migrate` em instalação limpa produz um schema incompleto. Além disso, várias tabelas e colunas nunca foram avaliadas para reimplementação, e 3 colunas de `publicacao` estão completamente vazias.

Esta spec define o que fazer com cada elemento legado não resolvido.

---

## Inventário completo

### 1. Tabelas que existem no SQLite mas não têm migration

| Tabela | Linhas | Relacionamento com `publicacao` | Decisão |
|--------|--------|--------------------------------|---------|
| `turma` | 11 | FK `turma_id` — 1.365 linhas vinculadas | Manter; feature futura |
| `tipo_instituicao` | 4 | FK `tipo_instituicao_id` — 1.361 linhas vinculadas | Manter; CRUD admin + revisão de dados futura |
| `tipo_publicacao` | 5 | Sem FK real; `publicacao.tipo` é string ("Artigo" — único valor) | Manter lookup sem normalizar |
| `forma_apresentacao` | 1 | Sem FK real; `publicacao.forma` é string ("On-line" — único valor) | Manter lookup sem normalizar |
| `pesquisa` | 5.595 | Sem FK; buscas salvas com SQL raw da app antiga | Manter; decisão pendente (ver nota) |
| `visitante` | 21.639 | Sem FK; analytics de acesso da app antiga | Manter; reimplementação futura |
| `usuario` | 1 | Sem FK; auth da app antiga — substituído por `users` | Manter por compatibilidade |

> **Nota `pesquisa`:** A decisão sobre migrar vs. descartar os dados históricos está pendente. Rever antes de implementar a feature "permalink de busca".

### 2. Colunas FK em `publicacao` sem relationship Eloquent

| Coluna | Linhas com dado | Tabela alvo | Decisão |
|--------|-----------------|-------------|---------|
| `turma_id` | 1.365 | `turma` | Manter; relationship adicionado na feature futura |
| `tipo_instituicao_id` | 1.361 | `tipo_instituicao` | Manter; relationship adicionado junto ao CRUD admin |
| `tipo_autoria_id` | **0** | `tipo_autoria` | **Remover coluna e tabela** |
| `modalidade_id` | **0** | `modalidade` | **Remover coluna e tabela** |
| `vinculo_institucional_autor_id` | **0** | `vinculo_institucional_autor` | **Remover coluna e tabela** |

### 3. Models sem tabela nas migrations

| Model | Tabela | Status |
|-------|--------|--------|
| `Turma` | `turma` | Manter; migration a criar |
| `TipoInstituicao` | `tipo_instituicao` | Manter; migration a criar |
| `TipoAutorium` | `tipo_autoria` | **Deletar model** (tabela vazia, coluna removida) |
| `Modalidade` | `modalidade` | **Deletar model** (tabela vazia, coluna removida) |
| `VinculoInstitucionalAutor` | `vinculo_institucional_autor` | **Deletar model** (tabela vazia, coluna removida) |
| `FormaApresentacao` | `forma_apresentacao` | Manter; migration a criar |
| `TipoPublicacao` | `tipo_publicacao` | Manter; migration a criar |
| `Pesquisa` | `pesquisa` | Manter; migration a criar |
| `Visitante` | `visitante` | Manter; migration a criar |
| `Usuario` | `usuario` | Manter; migration a criar |

### 4. `PalavraChave.frequencia`

A coluna `frequencia` armazena um contador desnormalizado. Atualmente os valores estão em sincronia com o pivot `palavra_chave_publicacao`, mas não há mecanismo para mantê-los sincronizados quando novas publicações forem importadas.

**Decisão:** remover a coluna e calcular via `withCount()`.

---

## Fases de implementação

### Fase 1 — Remoções seguras (sem perda de dados)

Tudo nesta fase tem risco zero: colunas vazias, tabelas vazias, models sem uso.

**1.1 — Dropar colunas e tabelas vazias**

Migration nova `remove_empty_legacy_columns.php`:

```php
Schema::table('publicacao', function (Blueprint $table) {
    $table->dropColumn(['tipo_autoria_id', 'modalidade_id', 'vinculo_institucional_autor_id']);
});
Schema::dropIfExists('tipo_autoria');
Schema::dropIfExists('modalidade');
Schema::dropIfExists('vinculo_institucional_autor');
```

**1.2 — Deletar models correspondentes**

Arquivos a deletar:
- `app/Models/TipoAutorium.php`
- `app/Models/Modalidade.php`
- `app/Models/VinculoInstitucionalAutor.php`

Confirmar que nenhum deles é importado em outro arquivo antes de deletar.

**1.3 — Remover `PalavraChave.frequencia`**

Migration nova `remove_palavra_chave_frequencia.php`:

```php
Schema::table('palavra_chave', function (Blueprint $table) {
    $table->dropColumn('frequencia');
});
```

Atualizar `PalavraChave` model: remover `frequencia` de `$fillable` e `casts()`.

Atualizar `EstatisticaController` caso `frequencia` seja usada diretamente:

```php
// Antes (usa coluna desnormalizada):
$quantidadePalavrasChave = PalavraChave::select('texto', 'frequencia')
    ->groupBy('texto')
    ->orderBy('frequencia', 'desc')
    ->get();

// Depois (calcula via join):
$quantidadePalavrasChave = PalavraChave::withCount('publicacoes as frequencia')
    ->having('frequencia', '>', 0)
    ->orderByDesc('frequencia')
    ->get(['texto']);
```

Verificar que o relacionamento `publicacoes()` existe em `PalavraChave` — se não, adicionar:

```php
public function publicacoes(): BelongsToMany
{
    return $this->belongsToMany(Publicacao::class, 'palavra_chave_publicacao', 'palavra_chave_id', 'publicacao_id');
}
```

---

### Fase 2 — Migrations faltantes

Adicionar migrations para todas as tabelas que existem no SQLite mas não têm criadora, garantindo que `php artisan migrate` em instalação limpa produza o schema completo.

Todas as migrations usam `if (!Schema::hasTable(...))` para não quebrar ambientes existentes.

**2.1 — Tabelas de lookup simples (1 migration)**

```php
// Migration: create_legacy_lookup_tables.php
foreach (['turma', 'tipo_instituicao', 'tipo_publicacao', 'forma_apresentacao'] as $table) {
    if (!Schema::hasTable($table)) {
        Schema::create($table, function (Blueprint $t) {
            $t->id();
            $t->string('nome')->nullable();
        });
    }
}
```

> Seeders correspondentes devem ser criados com os dados já conhecidos:
> - `tipo_publicacao`: Artigo, Capítulo de livro, Dissertação, Livro, Tese
> - `forma_apresentacao`: On-line
> - `turma`: 11 turmas (2014.1 a 2019.1)
> - `tipo_instituicao`: Pública, Privada, Não informado (+ 1 valor)

**2.2 — Tabelas legadas de usuário e analytics (1 migration)**

```php
// Migration: create_legacy_user_analytics_tables.php
if (!Schema::hasTable('usuario')) {
    Schema::create('usuario', function (Blueprint $table) {
        $table->id();
        $table->string('nome')->nullable();
        // demais colunas — verificar schema real no SQLite antes de criar
    });
}
if (!Schema::hasTable('visitante')) {
    Schema::create('visitante', function (Blueprint $table) {
        $table->id();
        $table->string('session_id')->nullable();
        $table->date('data')->nullable();
        $table->string('ip')->nullable();
        $table->text('user_agent')->nullable();
        // demais colunas — verificar schema real no SQLite
    });
}
```

> **Ação necessária antes de escrever esta migration:** inspecionar o schema real das tabelas `usuario` e `visitante` com `PRAGMA table_info(usuario)` e `PRAGMA table_info(visitante)` para mapear todas as colunas.

**2.3 — Tabela `pesquisa` (migration separada)**

```php
// Migration: create_pesquisa_table.php
if (!Schema::hasTable('pesquisa')) {
    Schema::create('pesquisa', function (Blueprint $table) {
        $table->id();
        // colunas a definir após decisão sobre migração vs. descarte dos dados
    });
}
```

> Aguardar decisão sobre os dados históricos antes de implementar esta migration.

---

## O que não muda

- `publicacao.tipo` e `publicacao.forma` permanecem como strings — com apenas 1 valor distinto cada, normalizar para FK não agrega valor ao sistema atual.
- `local_publicacao.estado` permanece como sigla string — o relacionamento `estadoModel()` via `sigla` já funciona corretamente.
- FKs `turma_id` e `tipo_instituicao_id` permanecem em `publicacao` sem relationship Eloquent declarado — os relationships serão adicionados quando as respectivas features forem implementadas.

---

## Checklist de implementação

- [ ] Fase 1.1 — Migration para dropar colunas vazias (`tipo_autoria_id`, `modalidade_id`, `vinculo_institucional_autor_id`) e tabelas correspondentes
- [ ] Fase 1.2 — Deletar models `TipoAutorium`, `Modalidade`, `VinculoInstitucionalAutor`
- [ ] Fase 1.3 — Migration para remover `palavra_chave.frequencia` + atualizar `EstatisticaController` + model `PalavraChave`
- [ ] Fase 2.1 — Migration para criar `turma`, `tipo_instituicao`, `tipo_publicacao`, `forma_apresentacao` com seeders
- [ ] Fase 2.2 — Inspecionar schema real de `usuario` e `visitante`, depois criar migration
- [ ] Fase 2.3 — Migration para `pesquisa` (aguarda decisão sobre dados históricos)
