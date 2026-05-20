# CRUD de Publicações — Design

**Data:** 2026-05-20  
**Status:** aprovado para implementação  
**Abordagem:** dois subciclos independentes

---

## Contexto

A listagem de publicações (`/admin/publicacoes`) já existe com filtro de texto, ordenação e paginação. Os botões "Abrir", "Editar" e "Excluir" estão presentes mas desabilitados. O `PublicacoesController` tem apenas `index()`. Este documento especifica tudo que precisa ser construído para tornar a publicação plenamente gerenciável pelo admin.

---

## Escopo — Dois Subciclos

### Subciclo 1 — CRUD Básico (este ciclo)

- Migration: coluna `doi` na tabela `publicacao`
- 4 novos lookup CRUDs: `qualis_capes`, `modalidade`, `tipo_autoria`, `vinculo_institucional_autor`
- Reestruturação do sidebar: grupo colapsável "Cadastros"
- Melhoria do filtro da listagem (DOI + ISBN + título + autores)
- CRUD de publicação: create, edit, delete

### Subciclo 2 — Operações Especiais (próximo ciclo)

- Clone com notificação
- Merge campo a campo (página dedicada)

---

## 1. Migration — Coluna `doi`

Adicionar coluna `doi` nullable à tabela `publicacao`, após `isbn`:

```php
$table->string('doi')->nullable()->after('isbn');
```

Atualizar `$fillable` e `$casts` do model `Publicacao`.

---

## 2. Novos Lookup CRUDs

Quatro tabelas sem interface de gestão. Seguem exatamente o padrão `LookupController` já existente (store / update / destroy preflight + destroyConfirmed).

| Tabela | Model | Rota | Campo principal |
|--------|-------|------|-----------------|
| `qualis_capes` | `QualisCape` | `cadastros/qualis-capes` | `classificacao` |
| `modalidade` | `Modalidade` | `cadastros/modalidades` | `nome` |
| `tipo_autoria` | `TipoAutorium` | `cadastros/tipos-autoria` | `nome` |
| `vinculo_institucional_autor` | `VinculoInstitucionalAutor` | `cadastros/vinculos-institucionais` | `nome` |

Cada um usa a mesma página React `LookupCrud.tsx` já existente — apenas a rota de dados muda via props.

**Atenção:** o model `TipoAutorium` tem typo no nome (legado). Manter como está para não quebrar referências existentes.

---

## 3. Reestruturação do Sidebar — Grupo "Cadastros"

### Situação atual

`NavMain` renderiza uma lista plana. O tipo `NavItem` não suporta sub-itens. Há 8 itens de lookups soltos no sidebar.

### Mudança

Criar componente `NavCadastros` com grupo colapsável usando `SidebarMenuSub` / `SidebarMenuSubItem` / `SidebarMenuSubButton` do shadcn.

**Novo sidebar (ordem):**
1. Painel
2. Publicações
3. Logs de Busca
4. **Cadastros** *(colapsável, aberto por padrão quando URL inicia com `/admin/cadastros`)*
   - Áreas do Conhecimento
   - Eixos Temáticos
   - Segmentos Educacionais
   - Turmas
   - Tipos de Instituição
   - Formas de Apresentação
   - Qualis CAPES *(novo)*
   - Modalidade *(novo)*
   - Tipos de Autoria *(novo)*
   - Vínculos Institucionais *(novo)*
   - Geografia

Os 8 itens atuais de lookups saem do `mainNavItems` e entram no sub-menu de Cadastros. O `NavMain` continua com os 3 itens de topo. `NavCadastros` é adicionado ao `SidebarContent` abaixo do `NavMain`.

---

## 4. Melhoria do Filtro da Listagem

O filtro de texto atual (TanStack global filter) pesquisa apenas título e autores. Ampliar para incluir:

- Título
- Autores (nomes concatenados)
- DOI
- ISBN

Nenhuma mudança de rota — o filtro é client-side no TanStack. O controller `index()` precisa passar `doi` e `isbn` nos dados retornados.

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
Botão "Abrir" na listagem → mesma rota de edição (sem tela de visualização separada).

### Layout — Página Dedicada

Rota própria, mesma estrutura de `AppLayout` com breadcrumb. Dois colunas:

**Coluna esquerda (2/3 da largura):**

| Card | Campos |
|------|--------|
| Dados Básicos | título*, tipo, ano*, volume, número, páginas, ISBN, DOI, resumo (textarea), link |
| Autores | lista ordenável com drag-to-reorder; campo "adicionar autor" com busca + criação inline |
| Palavras-chave | tag input: digitar para buscar existentes ou criar nova com confirmação de duplicidade |

**Coluna direita (1/3 da largura):**

| Card | Campos |
|------|--------|
| Classificação | Áreas (multi-select), Eixo Temático, Segmento Educacional, Turma, Tipo de Instituição, Qualis CAPES, Tipo de Autoria, Modalidade, Vínculo Institucional |
| Localização | Local de Publicação (SearchableSelect + criação inline), Forma de Apresentação |

Campos com `*` são obrigatórios (título e ano). Todos os demais são opcionais.

### Criação Inline

Disponível para: **Autor**, **Palavra-chave**, **Local de Publicação**.

Fluxo de criação inline:
1. Usuário digita no campo de busca e não encontra o que precisa
2. Opção "Criar '[texto digitado]'" aparece no dropdown
3. Ao selecionar, verifica duplicidade (case-insensitive, trim):
   - Se possível duplicata encontrada: exibe alerta *"'[nome]' é parecido com '[existente]'. Usar o existente ou criar mesmo assim?"*
   - Se não há duplicata: cria e seleciona diretamente
4. Item criado é adicionado ao campo

**Autores:** pivot `autor_publicacao` inclui campo `ordem` (int). A ordem é determinada pela posição na lista drag-to-reorder. Ao salvar, o controller sincroniza a pivot com os IDs e ordens na sequência enviada.

**Palavras-chave:** pivot `palavra_chave_publicacao`. O model `PalavraChave` tem campo `frequencia` — não atualizar frequência pelo CRUD admin (ela é calculada separadamente).

**Áreas:** pivot `area_publicacao`. Multi-select sem ordem.

### Validação Backend

```php
'titulo'                       => 'required|string|max:500',
'ano'                          => 'required|integer|min:1900|max:' . date('Y'),
'tipo'                         => 'nullable|string|max:100',
'forma'                        => 'nullable|string|max:100',
'volume'                       => 'nullable|string|max:20',
'numero'                       => 'nullable|string|max:20',
'pagina'                       => 'nullable|string|max:50',
'isbn'                         => 'nullable|string|max:20',
'doi'                          => 'nullable|string|max:255',
'resumo'                       => 'nullable|string',
'link'                         => 'nullable|url|max:500',
'local_publicacao_id'          => 'nullable|exists:local_publicacao,id',
'turma_id'                     => 'nullable|exists:turma,id',
'eixo_tematico_id'             => 'nullable|exists:eixo_tematico,id',
'segmento_educacional_id'      => 'nullable|exists:segmento_educacional,id',
'tipo_instituicao_id'          => 'nullable|exists:tipo_instituicao,id',
'qualis_capes_id'              => 'nullable|exists:qualis_capes,id',
'tipo_autoria_id'              => 'nullable|exists:tipo_autoria,id',
'modalidade_id'                => 'nullable|exists:modalidade,id',
'vinculo_institucional_autor_id' => 'nullable|exists:vinculo_institucional_autor,id',
'autores'                      => 'nullable|array',
'autores.*.id'                 => 'required|exists:autor,id',
'autores.*.ordem'              => 'required|integer|min:1',
'palavras_chave'               => 'nullable|array',
'palavras_chave.*'             => 'integer|exists:palavra_chave,id',
'areas'                        => 'nullable|array',
'areas.*'                      => 'integer|exists:area,id',
```

O `store` define `incluida_em = now()`. O `update` define `editada_em = now()`.

---

## 6. Delete com Orphan Handling

### Rotas

```
GET    /admin/publicacoes/{id}/orphans  → PublicacoesController@orphans       (JSON preflight)
DELETE /admin/publicacoes/{id}          → PublicacoesController@destroy
```

**Atenção:** registrar as rotas com segmentos fixos (`/merge`, `/create`) **antes** das rotas com `{id}` para evitar que o Laravel capture `merge` ou `create` como ID.

### Resposta do Preflight (`orphans`)

```json
{
  "autores": [{ "id": 12, "nome": "Silva, João" }],
  "palavras_chave": [{ "id": 7, "texto": "avaliação" }],
  "locais_publicacao": [{ "id": 3, "nome": "Revista X" }]
}
```

Arrays vazios = sem órfãos. O frontend exibe o passo 2 do dialog somente se ao menos um array for não vazio.

### Fluxo

1. Usuário clica "Excluir" na linha da listagem
2. Dialog de confirmação em dois passos (padrão já usado nos lookups):
   - **Passo 1:** *"Tem certeza que deseja excluir '[título]'?"*
   - **Passo 2 (se órfãos existirem):** exibe lista de entidades que ficarão sem vínculo e pergunta o que fazer

### Definição de Órfão

- **Autor:** possui vínculo em `autor_publicacao` **somente com esta publicação** (sem outras publicações)
- **Palavra-chave:** vínculo em `palavra_chave_publicacao` somente com esta publicação
- **Local de Publicação:** `local_publicacao.publicacoes_count == 1` (somente esta publicação)

### Comportamento Padrão

Apagar junto com a publicação. O usuário pode optar por **manter** os órfãos no banco (ficam sem vínculo).

### Cascade no Delete

Ao confirmar exclusão:
1. Deletar registros pivot: `autor_publicacao`, `palavra_chave_publicacao`, `area_publicacao`
2. Se "apagar órfãos": deletar autores/palavras-chave/local_publicacao identificados
3. Deletar a publicação
4. Tudo em `DB::transaction()`

**Importante:** `incluida_em` e `editada_em` não são timestamps Eloquent (`$timestamps = false`). O model não usa `deleted_at` (sem soft delete).

---

## 7. Subciclo 2 — Clone

### Rota

```
POST /admin/publicacoes/{id}/clone      → PublicacoesController@clone
```

### Fluxo

1. Botão "Clonar" na linha da listagem
2. Confirmação simples: *"Criar uma cópia de '[título]'?"*
3. Controller cria novo registro com todos os campos copiados:
   - `titulo` = "[título original] (cópia)"
   - `incluida_em` = `now()`
   - `editada_em` = `null`
4. Copia pivots: `autor_publicacao` (com ordens), `palavra_chave_publicacao`, `area_publicacao`
5. Cria notificação para todos os usuários: *"Publicação clonada: '[título]'. Revise os dados antes de finalizar."*
6. Redireciona para `/admin/publicacoes/{novo_id}/edit`
7. Notificação é marcada como lida quando o usuário acessa a edição do clone ou manualmente no painel de notificações

**Clonagem múltipla:** não suportada — uma de cada vez.

---

## 8. Subciclo 2 — Merge

### Rotas

```
GET  /admin/publicacoes/merge?ids[]=X&ids[]=Y   → PublicacoesController@mergePage
POST /admin/publicacoes/merge                    → PublicacoesController@mergeConfirm
```

### Seleção na Listagem

Adicionar checkbox por linha. Quando exatamente 2 publicações estiverem selecionadas, aparece botão "Mesclar selecionadas" no topo da tabela. Se 1 ou 3+ estiverem selecionadas, botão aparece desabilitado com tooltip: *"Selecione exatamente 2 publicações para mesclar."*

### Página de Merge

Layout: tabela com 3 colunas (`Campo | Publicação #X | Publicação #Y`).

- Campos **idênticos** nas duas publicações são mesclados automaticamente e não aparecem na tabela (exceto se forem nulos em ambas, nesse caso ficam nulos no resultado)
- Campos que **diferem** aparecem como linhas clicáveis — clicar seleciona qual versão manter (destaque azul)
- Campos N:M (autores, palavras-chave, áreas): opção de **manter de uma** ou **unir as duas listas** (union)
- Subtítulo da página: *"Selecione qual versão manter para cada campo. A publicação descartada será excluída permanentemente."*
- Aviso fixo no topo: *"O merge é limitado a 2 publicações por vez."*

### Comportamento ao Confirmar

1. Cria nova publicação com os campos selecionados (ou mantém a publicação de menor ID como base)
2. Migra os dados pivotados da publicação descartada que foram selecionados para unir
3. Exclui a publicação descartada (e seus pivots)
4. Redireciona para a publicação resultante em edição
5. Tudo em `DB::transaction()`

---

## 9. Plano de Testes

### Backend (PHPUnit / Pest — padrão `tests/Feature/Admin/`)

**`PublicacoesControllerTest.php`**

| Teste | Descrição |
|-------|-----------|
| `guests_cannot_access_create` | Redireciona para login |
| `guests_cannot_store` | Redireciona para login |
| `index_passes_doi_and_isbn` | `index()` inclui `doi` e `isbn` nos dados |
| `create_renders_form_with_lookups` | Inertia recebe todos os selects populados |
| `store_creates_publication_with_pivots` | Cria publicação + autores + palavras-chave + áreas |
| `store_sets_incluida_em` | `incluida_em` é definido no store |
| `store_validates_required_fields` | Título e ano são obrigatórios |
| `update_syncs_pivots` | Atualizar autores sincroniza a pivot com ordens corretas |
| `update_sets_editada_em` | `editada_em` é atualizado |
| `destroy_preflight_identifies_orphans` | Retorna JSON com órfãos corretos |
| `destroy_confirmed_deletes_orphans_by_default` | Apaga autores/keywords órfãos junto |
| `destroy_confirmed_keeps_orphans_when_opted` | Mantém se usuário optou |
| `destroy_confirmed_uses_transaction` | Falha não deixa estado inconsistente |

**`PublicacoesCloneTest.php`** (subciclo 2)

| Teste | Descrição |
|-------|-----------|
| `clone_creates_copy_with_suffix` | Título tem "(cópia)" |
| `clone_copies_all_pivots` | Autores, keywords e áreas são copiados |
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

**`LookupCrudNewTest.php`** (ou ampliar `LookupCrudTest.php`)

Replicar os testes de `LookupCrudTest` para os 4 novos controllers (qualis_capes, modalidade, tipo_autoria, vinculo_institucional_autor).

### Frontend (Vitest — quando o setup estiver pronto)

> **Nota:** o setup de Vitest está pendente (spec separada). Até lá, testes frontend são manuais conforme checklist abaixo.

Testes previstos ao configurar Vitest:
- `PublicacaoForm`: submissão com campos obrigatórios em branco exibe erros
- `AutorList`: drag-to-reorder atualiza a ordem corretamente
- `TagInput`: criação inline dispara verificação de duplicidade
- `MergePage`: clicar num campo seleciona a versão e deseleciona a outra
- `CheckboxList`: botão "Mesclar" aparece só com 2 selecionados

---

## 10. Checklist de Verificação

### Dev (`localhost`)

**Subciclo 1:**
- [ ] `php artisan migrate` sem erros; coluna `doi` aparece em `publicacao`
- [ ] Sidebar mostra grupo "Cadastros" colapsável com todos os 11 itens
- [ ] 4 novos CRUDs de lookup: criar, editar, excluir funcionam
- [ ] Listagem de publicações: filtro por DOI e ISBN retorna resultados corretos
- [ ] Clicar em linha da tabela → abre formulário de edição preenchido
- [ ] Formulário de criação: salvar com título e ano → publicação criada no banco
- [ ] Formulário de edição: alterar autores (reordenar, adicionar, remover) → pivot correta
- [ ] Criação inline de autor: digitar nome existente → sugere usar o existente
- [ ] Criação inline de autor: digitar nome novo → cria e seleciona
- [ ] Delete sem órfãos: confirmação em 2 passos, publicação excluída
- [ ] Delete com órfãos: exibe lista, padrão "apagar junto" funciona, opção "manter" funciona
- [ ] `composer run test` — todos os testes passam (sem regressões)
- [ ] `npm run types` — sem erros TypeScript
- [ ] `npm run lint` — sem warnings

**Subciclo 2:**
- [ ] Checkbox: selecionar 1 → botão "Mesclar" desabilitado com tooltip
- [ ] Checkbox: selecionar 3+ → botão "Mesclar" desabilitado com tooltip
- [ ] Checkbox: selecionar exatamente 2 → botão "Mesclar" habilitado
- [ ] Página de merge: campos idênticos não aparecem na tabela de seleção
- [ ] Página de merge: clicar num campo seleciona-o (azul) e deseleciona o outro
- [ ] Confirmar merge → publicação resultante correta, descartada excluída
- [ ] Clone: publicação clonada com "(cópia)", pivots copiados, notificação criada
- [ ] Após clone: redirecionou para edição do clone
- [ ] `composer run test` — todos os testes passam

### Prod (`ftp deploy`)

> Verificar depois de cada deploy via `main.yml`.

**Subciclo 1:**
- [ ] Acessar `/admin/cadastros/qualis-capes` — página carrega sem erro 500
- [ ] Acessar `/admin/publicacoes/create` — todos os selects têm opções (dados reais)
- [ ] Criar uma publicação de teste com todos os campos preenchidos → verificar no banco via `/admin/publicacoes`
- [ ] Editar a publicação criada → `editada_em` atualizado
- [ ] Excluir a publicação de teste → some da listagem
- [ ] Filtrar por ISBN de uma publicação conhecida → retorna só ela
- [ ] Estatísticas: verificar que os totais não mudaram após o teste acima (a publicação de teste foi apagada)

**Subciclo 2:**
- [ ] Clonar uma publicação real → aparece com "(cópia)", notificação no badge do sidebar
- [ ] Selecionar 2 publicações → mesclar → verificar publicação resultante e que a descartada sumiu
- [ ] Badge de notificação: clicar → marca como lida

---

## Decisões Registradas

| Decisão | Escolha |
|---------|---------|
| Layout do formulário | Página dedicada (2 colunas) |
| "Abrir" publicação | Vai direto para edição (sem tela read-only) |
| Clicar na linha | Abre edição |
| Clonagem múltipla | Não suportada — uma de cada vez |
| Órfãos no delete | Exibir lista + perguntar; padrão = apagar |
| UI do merge | Página dedicada com tabela 3 colunas, texto explicativo do dialog |
| Merge simultâneo | Limitado a 2 publicações por vez |
| Soft delete | Não — exclusão permanente |
| `frequencia` de PalavraChave | Não atualizar pelo CRUD admin |
| Typo `TipoAutorium` | Manter para não quebrar referências |
