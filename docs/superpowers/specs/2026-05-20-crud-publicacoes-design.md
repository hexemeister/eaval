# CRUD de Publicações — Design

**Data:** 2026-05-20  
**Revisão:** 2026-05-21  
**Status:** aprovado para implementação  
**Abordagem:** três subciclos independentes

---

## Contexto

A listagem de publicações (`/admin/publicacoes`) já existe com filtro de texto, ordenação e paginação. Os botões "Abrir", "Editar" e "Excluir" estão presentes mas desabilitados. O `PublicacoesController` tem apenas `index()`. Este documento especifica tudo que precisa ser construído para tornar a publicação plenamente gerenciável pelo admin.

---

## Escopo — Três Subciclos

### Subciclo 1 — CRUD Básico + Saneamento de Schema

- Migrations de saneamento: drop de tabelas/colunas inúteis, novo FK para `tipo` e `forma`, coluna `doi`
- 2 novos lookup CRUDs: `qualis_capes`, `tipo_publicacao`
- Reestruturação do sidebar: grupo colapsável "Cadastros"
- Melhoria do filtro da listagem (ano + DOI + ISBN + normalização de acentos)
- CRUD de publicação: create, edit, delete
- Padronização de texto ao salvar (sentence case ABNT)

### Subciclo 2 — Operações Especiais

- Clone com notificação
- Merge campo a campo (página dedicada)

### Subciclo 3 — Normalização de Dados Existentes

- Lookup de exceções de capitalização (`termos_excecao_caso`)
- `NormalizacaoTextoService` com lista de exceções
- Comando artisan `texto:normalizar` + notificações para revisão

---

## 1. Migrations

### 1.1 Saneamento de tabelas legadas

Dropar tabelas que nunca tiveram dados e cujas colunas FK em `publicacao` também serão removidas:

```php
// Drop das colunas FK em publicacao
Schema::table('publicacao', function (Blueprint $table) {
    $table->dropForeign(['tipo_autoria_id']);
    $table->dropForeign(['modalidade_id']);
    $table->dropForeign(['vinculo_institucional_autor_id']);
    $table->dropColumn(['tipo_autoria_id', 'modalidade_id', 'vinculo_institucional_autor_id']);
});

// Drop das tabelas
Schema::dropIfExists('tipo_autoria');
Schema::dropIfExists('modalidade');
Schema::dropIfExists('vinculo_institucional_autor');
```

Dropar tabela legacy (sistema anterior ao Laravel Auth — 1 registro, sem referências):

```php
Schema::dropIfExists('usuario');
// Deletar app/Models/Usuario.php
```

### 1.2 FK para `tipo` e `forma`

`publicacao.tipo` e `publicacao.forma` são strings diretas referenciando tabelas com id/nome. Converter para FKs:

```php
Schema::table('publicacao', function (Blueprint $table) {
    $table->unsignedBigInteger('tipo_publicacao_id')->nullable()->after('tipo');
    $table->unsignedBigInteger('forma_apresentacao_id')->nullable()->after('forma');
    $table->foreign('tipo_publicacao_id')->references('id')->on('tipo_publicacao')->nullOnDelete();
    $table->foreign('forma_apresentacao_id')->references('id')->on('forma_apresentacao')->nullOnDelete();
});
```

**Migração de dados:** converter strings existentes para IDs antes de dropar as colunas antigas:

```php
// Exemplo para tipo
DB::statement("
    UPDATE publicacao
    SET tipo_publicacao_id = (
        SELECT id FROM tipo_publicacao WHERE LOWER(nome) = LOWER(publicacao.tipo)
    )
    WHERE tipo IS NOT NULL
");

// Depois dropar colunas antigas
Schema::table('publicacao', function (Blueprint $table) {
    $table->dropColumn(['tipo', 'forma']);
});
```

Atualizar `EstatisticaController` — `case 'tipo-publicacao'` usa `groupBy('publicacao.tipo')` (string). Converter para JOIN:

```php
$dados = Publicacao::join('tipo_publicacao', 'tipo_publicacao.id', '=', 'publicacao.tipo_publicacao_id')
    ->select('tipo_publicacao.nome as tipo', DB::raw('count(*) as total'))
    ->whereNotNull('publicacao.tipo_publicacao_id')
    ->groupBy('tipo_publicacao.nome')
    ->orderByDesc('total')
    ->get()
    ->map(fn($item) => ['Tipo' => $item->tipo, 'Total' => $item->total]);
```

### 1.3 Coluna `doi`

```php
$table->string('doi')->nullable()->after('isbn');
```

Atualizar `$fillable` e `$casts` do model `Publicacao`. Remover `tipo`, `forma`, `tipo_autoria_id`, `modalidade_id`, `vinculo_institucional_autor_id`. Adicionar `doi`, `tipo_publicacao_id`, `forma_apresentacao_id` e os dois `belongsTo`.

---

## 2. Novos Lookup CRUDs

Dois novos controllers seguindo o padrão `LookupController`.

| Tabela | Model | Controller | Rota | Campo |
|--------|-------|-----------|------|-------|
| `qualis_capes` | `QualisCape` | `QualisCapeController` | `cadastros/qualis-capes` | `classificacao` |
| `tipo_publicacao` | `TipoPublicacao` | `TipoPublicacaoController` | `cadastros/tipos-publicacao` | `nome` |

`FormaApresentacaoController` já existe com rota registrada — apenas precisa entrar no menu de Cadastros.

---

## 3. Reestruturação do Sidebar — Grupo "Cadastros"

### Situação atual

`NavMain` renderiza lista plana. O tipo `NavItem` não suporta sub-itens. Lookups estão soltos.

### Mudança

Criar componente `NavCadastros` com grupo colapsável usando `SidebarMenuSub` / `SidebarMenuSubItem` / `SidebarMenuSubButton` do shadcn.

**Novo sidebar:**
1. Painel
2. Publicações
3. Logs de Busca
4. **Cadastros** *(colapsável, aberto quando URL inicia com `/admin/cadastros`)*
   - Áreas do Conhecimento
   - Eixos Temáticos
   - Segmentos Educacionais
   - Turmas
   - Tipos de Instituição
   - Formas de Apresentação
   - Qualis CAPES *(novo)*
   - Tipos de Publicação *(novo)*
   - Geografia

Os itens de lookup saem do `mainNavItems` e entram no sub-menu. `NavCadastros` é adicionado ao `SidebarContent` abaixo do `NavMain`.

---

## 4. Melhoria do Filtro da Listagem

O filtro de texto atual pesquisa título e autores. Ampliar para incluir também: `ano`, `doi`, `isbn`.

O controller `index()` passa esses campos nos dados. O filtro é client-side via TanStack.

### Normalização de acentos

Adicionar prop `normalizeSearch` ao `DynamicDataTable` (default: `true`). Quando ativo, normaliza diacríticos antes do `includes()` em ambos os lados:

```ts
const normalize = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

globalFilterFn: (row, columnId, filterValue) => {
    const cell = String(row.getValue(columnId) ?? '');
    return normalizeSearch
        ? normalize(cell).includes(normalize(filterValue))
        : cell.toLowerCase().includes(filterValue.toLowerCase());
}
```

Aplicar o mesmo no `LookupCrud.tsx` (busca nos lookups também ignora acentos).

---

## 5. Formulário de Publicação — Create e Edit

### Rotas

```
GET  /admin/publicacoes/create          → PublicacoesController@create
POST /admin/publicacoes                 → PublicacoesController@store
GET  /admin/publicacoes/{id}/edit       → PublicacoesController@edit
PUT  /admin/publicacoes/{id}            → PublicacoesController@update
```

Clicar na linha da tabela ou no botão "Editar" → `/admin/publicacoes/{id}/edit`.  
Botão "Abrir" na listagem → mesma rota de edição (sem tela read-only).

### Layout — Página Dedicada

Rota própria, mesma estrutura de `AppLayout` com breadcrumb. Duas colunas:

**Coluna esquerda (2/3 da largura):**

| Card | Campos |
|------|--------|
| Dados Básicos | título*, ano*, tipo de publicação, volume, número, páginas, ISBN, DOI, link*, resumo* (textarea) |
| Autores | lista ordenável com drag-to-reorder; campo "adicionar autor" com busca + criação inline; mínimo 1* |
| Palavras-chave | tag input: digitar para buscar existentes ou criar com verificação de duplicidade; mínimo 1* |

**Coluna direita (1/3 da largura):**

| Card | Campos |
|------|--------|
| Classificação | Áreas (multi-select, default: Educação), Eixo Temático, Segmento Educacional, Turma, Tipo de Instituição, Qualis CAPES |
| Localização | Local de Publicação, Forma de Apresentação (default: Online) |

Campos com `*` são obrigatórios.

### Valores Padrão (Create)

| Campo | Default |
|-------|---------|
| `tipo_publicacao_id` | ID de "Artigo" |
| `forma_apresentacao_id` | ID de "Online" (único registro) |
| `areas` | ID de "Educação" |

### SearchableSelect e Criação Inline

Todos os 8 campos FK usam `SearchableSelect` com criação inline:

- `local_publicacao_id` → LocalPublicacao
- `turma_id` → Turma
- `eixo_tematico_id` → EixoTematico
- `segmento_educacional_id` → SegmentoEducacional
- `tipo_instituicao_id` → TipoInstituicao
- `qualis_capes_id` → QualisCape
- `tipo_publicacao_id` → TipoPublicacao
- `forma_apresentacao_id` → FormaApresentacao

Fluxo de criação inline (igual para todos):
1. Usuário digita e não encontra o que precisa
2. Opção "Criar '[texto digitado]'" aparece no dropdown
3. Verifica duplicidade (normalizado — sem acentos, case-insensitive, trim):
   - Possível duplicata: *"'[nome]' é parecido com '[existente]'. Usar o existente ou criar mesmo assim?"*
   - Sem duplicata: cria e seleciona diretamente
4. Item criado é adicionado ao campo

### Padronização de Texto ao Salvar

Aplicada no backend antes de persistir:

| Campo | Regra |
|-------|-------|
| `titulo` | `trim()` + sentence case via `NormalizacaoTextoService` |
| `palavras_chave[].texto` | `trim()` + primeira letra da primeira palavra maiúscula, resto minúsculo (ABNT) |
| `autores[].nome` | `trim()` |
| campos de lookup (`nome`) | `trim()` (já implementado no `LookupController`) |

O `NormalizacaoTextoService` aplica sentence case respeitando os termos cadastrados em `termos_excecao_caso` (Subciclo 3). Até o Subciclo 3 estar implementado, usar sentence case simples sem exceções.

### Autores

Pivot `autor_publicacao` inclui campo `ordem` (int). A ordem é determinada pela posição na lista drag-to-reorder. Ao salvar, o controller sincroniza a pivot com os IDs e ordens na sequência enviada.

### Palavras-chave

Pivot `palavra_chave_publicacao`. O model `PalavraChave` tem campo `frequencia` — não atualizar pelo CRUD admin.

### Áreas

Pivot `area_publicacao`. Multi-select sem ordem.

### Validação Backend

```php
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
'turma_id'                => 'nullable|exists:turma,id',
'eixo_tematico_id'        => 'nullable|exists:eixo_tematico,id',
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
```

O `store` define `incluida_em = now()`. O `update` define `editada_em = now()`.

---

## 6. Delete com Orphan Handling

### Rotas

```
GET    /admin/publicacoes/{id}/orphans  → PublicacoesController@orphans  (JSON preflight)
DELETE /admin/publicacoes/{id}          → PublicacoesController@destroy
```

**Atenção:** registrar rotas com segmentos fixos (`/merge`, `/create`) **antes** das rotas com `{id}`.

### Resposta do Preflight (`orphans`)

```json
{
  "autores": [{ "id": 12, "nome": "Silva, João" }],
  "palavras_chave": [{ "id": 7, "texto": "avaliação" }],
  "locais_publicacao": [{ "id": 3, "nome": "Revista X" }]
}
```

Arrays vazios = sem órfãos.

### Definição de Órfão

- **Autor:** vínculo em `autor_publicacao` somente com esta publicação
- **Palavra-chave:** vínculo em `palavra_chave_publicacao` somente com esta publicação
- **Local de Publicação:** `local_publicacao.publicacoes_count == 1`

### Comportamento Padrão

Apagar junto. Usuário pode optar por **manter** os órfãos (ficam sem vínculo).

### Cascade no Delete

1. Deletar pivots: `autor_publicacao`, `palavra_chave_publicacao`, `area_publicacao`
2. Se "apagar órfãos": deletar autores/palavras-chave/local_publicacao identificados
3. Deletar a publicação
4. Tudo em `DB::transaction()`

---

## 7. Subciclo 2 — Clone

### Rota

```
POST /admin/publicacoes/{id}/clone      → PublicacoesController@clone
```

### Fluxo

1. Botão "Clonar" na listagem
2. Confirmação: *"Criar uma cópia de '[título]'?"*
3. Controller cria novo registro: todos os campos copiados, `titulo` += " (cópia)", `incluida_em = now()`, `editada_em = null`
4. Copia pivots: `autor_publicacao` (com ordens), `palavra_chave_publicacao`, `area_publicacao`
5. Notificação para todos os usuários: *"Publicação clonada: '[título]'. Revise os dados antes de finalizar."*
6. Redireciona para `/admin/publicacoes/{novo_id}/edit`

**Clonagem múltipla:** não suportada.

---

## 8. Subciclo 2 — Merge

### Rotas

```
GET  /admin/publicacoes/merge?ids[]=X&ids[]=Y   → PublicacoesController@mergePage
POST /admin/publicacoes/merge                    → PublicacoesController@mergeConfirm
```

### Seleção na Listagem

Checkbox por linha. Com exatamente 2 selecionadas → botão "Mesclar selecionadas". Com 1 ou 3+ → botão desabilitado com tooltip: *"Selecione exatamente 2 publicações para mesclar."*

### Página de Merge

Tabela 3 colunas (`Campo | Publicação #X | Publicação #Y`):

- Campos **idênticos**: mesclados automaticamente, não aparecem
- Campos que **diferem**: linhas clicáveis — clicar seleciona a versão (destaque azul)
- Campos N:M (autores, palavras-chave, áreas): opção de manter de uma ou **unir as duas listas**

### Comportamento ao Confirmar

1. Mantém publicação de menor ID como base, atualiza com campos selecionados
2. Migra pivots da descartada que foram selecionados para unir
3. Exclui publicação descartada (e seus pivots)
4. Redireciona para a publicação resultante em edição
5. Tudo em `DB::transaction()`

---

## 9. Subciclo 3 — Normalização de Texto

### Objetivo

Garantir consistência de capitalização em `titulo` e `palavras_chave` — tanto nos dados existentes quanto nos novos. Respeitar exceções (siglas, nomes próprios: "LGPD", "EaD", "CNPq", "SciELO", etc.).

### Lookup `termos_excecao_caso`

Nova tabela simples: `id`, `termo` (string, unique).

| Item | Detalhe |
|------|---------|
| Controller | `TermoExcecaoCasoController` (padrão `LookupController`, campo `termo`) |
| Rota | `cadastros/termos-excecao` |
| Menu | Entrada no grupo "Cadastros" |
| Seed inicial | LGPD, EaD, CNPq, SciELO, COVID-19, BNCC, ENEM, MEC, UNESCO, CAPES |

### `NormalizacaoTextoService`

```php
class NormalizacaoTextoService
{
    // Carregado uma vez por request via cache
    public static function sentenceCase(string $texto): string
    {
        $excecoes = cache()->remember('termos_excecao_caso', 3600, fn() =>
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

Usado em: `PublicacoesController@store`, `PublicacoesController@update`, criação inline de `PalavraChave`.

### Comando `texto:normalizar`

Varre todas as publicações e palavras-chave existentes, aplica `NormalizacaoTextoService`, e gera notificação para cada registro alterado:

```
php artisan texto:normalizar [--dry-run] [--tipo=publicacoes|palavras-chave]
```

- `--dry-run`: exibe o que seria alterado sem salvar
- Notificação por registro alterado: *"Título normalizado para revisão: '[novo título]' (era: '[original]')"*
- Notificações agrupadas se mais de 10 registros: *"X registros normalizados — revise na listagem"*

---

## 10. Plano de Testes

### Backend (Pest — `tests/Feature/Admin/`)

**`PublicacoesControllerTest.php`**

| Teste | Descrição |
|-------|-----------|
| `guests_cannot_access_create` | Redireciona para login |
| `guests_cannot_store` | Redireciona para login |
| `index_passes_doi_isbn_ano` | `index()` inclui `doi`, `isbn`, `ano` nos dados |
| `create_renders_form_with_lookups` | Inertia recebe todos os selects populados + defaults corretos |
| `store_creates_publication_with_pivots` | Cria publicação + autores + palavras-chave + áreas |
| `store_sets_incluida_em` | `incluida_em` é definido no store |
| `store_validates_required_fields` | Título, ano, link, resumo, ≥1 autor, ≥1 palavra-chave são obrigatórios |
| `store_applies_sentence_case_to_titulo` | Título é normalizado ao salvar |
| `store_applies_abnt_case_to_palavras_chave` | Palavras-chave normalizadas (ABNT) |
| `update_syncs_pivots` | Atualizar autores sincroniza pivot com ordens corretas |
| `update_sets_editada_em` | `editada_em` é atualizado |
| `destroy_preflight_identifies_orphans` | Retorna JSON com órfãos corretos |
| `destroy_confirmed_deletes_orphans_by_default` | Apaga autores/keywords órfãos |
| `destroy_confirmed_keeps_orphans_when_opted` | Mantém se usuário optou |
| `destroy_confirmed_uses_transaction` | Falha não deixa estado inconsistente |

**`PublicacoesCloneTest.php`** (subciclo 2)

| Teste | Descrição |
|-------|-----------|
| `clone_creates_copy_with_suffix` | Título tem "(cópia)" |
| `clone_copies_all_pivots` | Autores, keywords e áreas copiados |
| `clone_creates_notification` | Notificação criada para todos os usuários |
| `clone_redirects_to_edit` | Redireciona para edição do clone |

**`PublicacoesMergeTest.php`** (subciclo 2)

| Teste | Descrição |
|-------|-----------|
| `merge_page_requires_exactly_two_ids` | 1 ou 3+ IDs → erro |
| `merge_confirm_keeps_selected_fields` | Campos selecionados persistem |
| `merge_confirm_unions_pivots` | Union de autores/keywords funciona |
| `merge_confirm_deletes_discarded` | Publicação descartada é removida |
| `merge_confirm_uses_transaction` | Atomicidade garantida |

**`NormalizacaoTextoTest.php`** (subciclo 3)

| Teste | Descrição |
|-------|-----------|
| `sentence_case_capitalizes_first_word` | "avaliação formativa" → "Avaliação formativa" |
| `sentence_case_respects_exceptions` | "bncc" → "BNCC" |
| `artisan_command_dry_run_does_not_save` | `--dry-run` não persiste |
| `artisan_command_creates_notifications` | Registros alterados geram notificações |

**`LookupCrudNewTest.php`** — replicar testes de `LookupCrudTest` para `qualis_capes` e `tipo_publicacao`.

### Frontend (Vitest — `resources/js/components/*.test.tsx`)

| Teste | Componente |
|-------|-----------|
| Submissão com campos obrigatórios em branco exibe erros | `PublicacaoForm` |
| Drag-to-reorder atualiza a ordem corretamente | `AutorList` |
| Criação inline dispara verificação de duplicidade | `SearchableSelect` |
| Clicar num campo seleciona e deseleciona o outro | `MergePage` |
| Botão "Mesclar" aparece só com 2 selecionados | `CheckboxList` |
| `normalizeSearch=true` encontra "educacao" em "Educação" | `DynamicDataTable` |

---

## 11. Checklist de Verificação

### Dev (`localhost`)

**Subciclo 1:**
- [ ] `php artisan migrate` sem erros
- [ ] Colunas `tipo_autoria_id`, `modalidade_id`, `vinculo_institucional_autor_id` removidas de `publicacao`
- [ ] Tabelas `tipo_autoria`, `modalidade`, `vinculo_institucional_autor`, `usuario` não existem mais
- [ ] Coluna `doi` existe em `publicacao`; `tipo_publicacao_id` e `forma_apresentacao_id` existem e têm dados migrados
- [ ] `EstatisticaController` — estatísticas de tipo de publicação carregam sem erro
- [ ] Sidebar mostra grupo "Cadastros" colapsável com 9 itens
- [ ] 2 novos CRUDs de lookup (qualis_capes, tipo_publicacao): criar, editar, excluir funcionam
- [ ] Listagem de publicações: filtro por ano, DOI e ISBN retorna resultados; buscar "educacao" encontra "Educação"
- [ ] Clicar em linha → abre formulário de edição preenchido
- [ ] Formulário de criação: defaults corretos (Artigo, Online, Educação)
- [ ] Salvar título em maiúsculas → sentence case aplicado no banco
- [ ] Salvar palavra-chave → primeira letra da primeira palavra maiúscula, resto minúsculo
- [ ] Formulário de edição: alterar autores (reordenar, adicionar, remover) → pivot correta
- [ ] Criação inline em qualquer select: sugestão de duplicata funciona
- [ ] Delete sem órfãos: confirmação simples, publicação excluída
- [ ] Delete com órfãos: exibe lista, padrão "apagar junto" e opção "manter" funcionam
- [ ] `composer run test:all` — todos os testes passam

**Subciclo 2:**
- [ ] Checkbox: 1 ou 3+ → botão "Mesclar" desabilitado com tooltip
- [ ] Checkbox: exatamente 2 → botão "Mesclar" habilitado
- [ ] Página de merge: campos idênticos não aparecem; clicar seleciona (azul)
- [ ] Confirmar merge → publicação resultante correta, descartada excluída
- [ ] Clone: título com "(cópia)", pivots copiados, notificação criada, redirecionou para edição
- [ ] `composer run test:all` — todos os testes passam

**Subciclo 3:**
- [ ] CRUD de `termos_excecao_caso` funciona no admin
- [ ] `php artisan texto:normalizar --dry-run` exibe prévia sem salvar
- [ ] `php artisan texto:normalizar` normaliza títulos e gera notificações
- [ ] Notificações de normalização aparecem no badge do sidebar
- [ ] Títulos com siglas cadastradas (ex: "LGPD") não são alterados

### Prod (após cada deploy via `main.yml`)

**Subciclo 1:**
- [ ] Acessar `/admin/publicacoes/create` — selects carregam com dados reais e defaults corretos
- [ ] Criar publicação de teste → verificar no banco via listagem
- [ ] Editar publicação → `editada_em` atualizado
- [ ] Excluir publicação de teste → some da listagem
- [ ] Estatísticas de tipo de publicação: totais batem com o esperado
- [ ] Filtrar por ISBN de publicação conhecida → retorna só ela

**Subciclo 2:**
- [ ] Clonar publicação real → aparece com "(cópia)", notificação no badge
- [ ] Selecionar 2 publicações → mesclar → publicação resultante correta, descartada sumiu

**Subciclo 3:**
- [ ] Acessar `cadastros/termos-excecao` — lista com seed inicial carregada
- [ ] Artisan `texto:normalizar` rodado em prod → notificações no admin

---

## Decisões Registradas

| Decisão | Escolha |
|---------|---------|
| Layout do formulário | Página dedicada (2 colunas) |
| "Abrir" publicação | Vai direto para edição (sem tela read-only) |
| Clicar na linha | Abre edição |
| Campos obrigatórios | titulo, ano, link, resumo, ≥1 autor, ≥1 palavra-chave |
| Defaults no create | tipo = Artigo, forma = Online, area = Educação |
| SearchableSelect | Todos os 8 FKs do formulário, todos com criação inline |
| Clonagem múltipla | Não suportada — uma de cada vez |
| Órfãos no delete | Exibir lista + perguntar; padrão = apagar |
| UI do merge | Página dedicada, tabela 3 colunas |
| Merge simultâneo | Limitado a 2 publicações por vez |
| Soft delete | Não — exclusão permanente |
| `frequencia` de PalavraChave | Não atualizar pelo CRUD admin |
| `tipo` e `forma` | Convertidos de string para FK (`tipo_publicacao_id`, `forma_apresentacao_id`) |
| Tabelas dropped | `tipo_autoria`, `modalidade`, `vinculo_institucional_autor`, `usuario` |
| Normalização de títulos | Sentence case via `NormalizacaoTextoService` com exceções cadastradas |
| Normalização de palavras-chave | ABNT: primeira letra da primeira palavra maiúscula, resto minúsculo |
| Normalização de busca/filtro | Diacríticos normalizados, prop `normalizeSearch` no DynamicDataTable (default: true) |
| `EstatisticaController` tipo-publicacao | Atualizar para JOIN (era groupBy em string) |
