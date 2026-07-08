# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Regras de Colaboração

- **Sempre planejar antes de implementar.** Apresentar o plano ao usuário e aguardar aprovação antes de escrever qualquer código.
- **Sempre perguntar em caso de dúvida.** Nunca assumir — se houver ambiguidade sobre comportamento esperado, escopo ou abordagem, perguntar primeiro.
- **Ouvir o usuário.** Quando o usuário sugere uma abordagem (ex: "não seria melhor testar localmente antes de fazer push?"), parar e seguir a sugestão. O usuário conhece o projeto e tem bom julgamento — não insistir no próprio caminho quando ele aponta outra direção.
- **Testar localmente antes de fazer push.** Para qualquer mudança em migrations ou CI: rodar `composer run test:all` localmente (Docker deve estar rodando para o MySQL) antes de autorizar push. Múltiplos pushes de correção são um sinal de que o teste local foi pulado.
- **`bin/test-mysql.sh` chama PHP via `$PHP_BIN`** — o Git Bash no Windows tem PATH diferente do PowerShell; o script resolve o PHP com `which php` no início e usa essa variável em todas as chamadas (`artisan` e `vendor/bin/pest`). Nunca chamar `php` diretamente no script.
- **Testar migrations contra dump de produção.** Migrations que modificam schema legado devem ser testadas com `bash bin/test-mysql.sh <dump>.sql` antes de rodar em prod. O ambiente `migrate:fresh` não reproduz FKs e constraints legadas.

## Sobre o Projeto

**e-Aval** é uma aplicação web para pesquisa do estado da arte da produção científica na área de Avaliação no Brasil. Serve como banco de dados consultável de artigos científicos indexados na SciELO (2001–2025), com busca avançada, filtros, estatísticas e gráficos.

## Comandos

```bash
# Desenvolvimento completo (PHP + queue + logs + Vite — recomendado)
composer run dev

# Apenas frontend
npm run dev

# Build para produção
npm run build

# Testes PHP
composer run test
# ou: php artisan test --filter=NomeDoTeste

# Qualidade de código
npm run lint          # ESLint com auto-fix
npm run format        # Prettier
npm run types         # TypeScript (sem emitir arquivos)
./vendor/bin/pint     # PHP code style (Laravel Pint)
```

## Arquitetura

**Stack:** Laravel 12 (PHP 8.2+) + React 19 + Inertia.js 2 + Tailwind CSS 4 + TypeScript  
**DB:** SQLite em desenvolvimento, MySQL em produção  
**Deploy:** FTP automático via GitHub Actions ao fazer push para `main`

O projeto usa Inertia.js como ponte entre Laravel e React — não há API REST separada. Controllers retornam `Inertia::render()` com props; o React recebe os dados como props da página.

### Fluxo de dados

```
Rota (routes/web.php) → Controller → Inertia::render('Pagina', $props) → resources/js/pages/Pagina.tsx
```

### Busca avançada de publicações

O coração do sistema está em `app/Services/ArticleSearch/`. O `SearchQueryParser` constrói uma AST com os operadores booleanos AND/OR/NOT, parênteses e frases. O `PublicacoesController` usa esse parser para montar a query Eloquent, com recuperação automática de erros de sintaxe via simplificação do AST.

### Modelos principais

- **Publicacao** — entidade central. Relaciona-se com `Autor` (N:M via `autor_publicacao`), `PalavraChave` (N:M via `palavra_chave_publicacao`) e `LocalPublicacao` (N:1).
- **Autor**, **PalavraChave**, **LocalPublicacao** — entidades de apoio com métodos estáticos para estatísticas agregadas.

### Estrutura de páginas React

- `resources/js/pages/` — páginas Inertia (cada arquivo = uma rota)
- `resources/js/layouts/` — layouts compartilhados (`.jsx` legado + `.tsx` novo)
- `resources/js/components/` — componentes UI reutilizáveis (Radix UI + Tailwind)
- `resources/js/hooks/` — hooks customizados

Componentes UI seguem o padrão shadcn: primitivos Radix UI estilizados com Tailwind, usando `class-variance-authority` e `tailwind-merge`.

## Banco de dados local

O `database/database.sqlite` contém dados reais de publicações — **não apagar, não resetar**. O arquivo está no `.gitignore` e não deve ser commitado (é binário e pode causar conflitos de merge).

> **PROIBIDO sem backup prévio:** `migrate:fresh`, `migrate:reset`, `migrate:rollback`. Esses comandos destroem dados irreversivelmente. Antes de qualquer um deles, executar `cp database/database.sqlite database/database.sqlite.bak`.

O script `composer run test` faz backup automático em `database/database.sqlite.bak` antes de rodar os testes. Em caso de acidente, restaurar com `cp database/database.sqlite.bak database/database.sqlite`.

### Compatibilidade SQLite (dev) / MySQL (prod)

**Dev usa SQLite. Prod usa MySQL.** São engines diferentes — o que funciona em uma pode quebrar na outra.

Toda query deve funcionar nos dois backends. Regras obrigatórias:

- Usar Eloquent query builder — gera SQL compatível automaticamente
- `DB::raw()` apenas com funções padrão: `COUNT`, `MIN`, `MAX`, `AVG`, `LOWER`, `TRIM`, `COALESCE`, `LENGTH`
- **Nunca em raw SQL:** `GROUP_CONCAT`, `DATE_FORMAT`, `REGEXP_REPLACE` — são MySQL-only
- Cálculos sobre strings (ex: contar palavras, normalizar texto) devem ser feitos **em PHP**, não em SQL

#### Migrations com lógica específica de driver

Se uma migration precisar de SQL específico de um driver (ex: `PRAGMA` do SQLite, `INFORMATION_SCHEMA` do MySQL), **sempre** adicionar guard no início do `up()`:

```php
// Migration SQLite-only:
if (DB::getDriverName() !== 'sqlite') return;

// Migration MySQL-only:
if (DB::getDriverName() !== 'mysql') return;
```

Migrations sem esse guard que usem sintaxe específica de driver **vão quebrar em produção**. Isso já aconteceu com `2026_05_19_000001_fix_legacy_lookup_autoincrement.php` (usava `PRAGMA` e `sqlite_master` sem guard).
- Check constraints existem no schema mas o SQLite não as aplica — a lógica de aplicação é a barreira real

## Variáveis de ambiente importantes

Ver `.env.example`. Em desenvolvimento, as chaves críticas são:
- `RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` — necessárias para o formulário de contato
- `MAIL_*` — para envio de email via Gmail SMTP
- `VITE_RECAPTCHA_SITE_KEY` — exposta ao frontend via Vite

## Funcionalidades implementadas recentemente

### CRUD de Publicações — Subciclo 1 (implementado)

- Saneamento de schema: tabelas legadas dropadas (`tipo_autoria`, `modalidade`, `vinculo_institucional_autor`, `usuario`), colunas `tipo`/`forma` convertidas para FKs, coluna `doi` adicionada
- `publicacao.id` corrigido para `INTEGER PRIMARY KEY AUTOINCREMENT` via migration `2026_05_22_000001`
- Tabelas pivot `autor_publicacao` e `palavra_chave_publicacao` corrigidas via migration `2026_05_23_000001` — tinham coluna `id int NOT NULL` sem AUTOINCREMENT (legacy), causando erro ao inserir autores
- `local_publicacao_id` tornado nullable via migration `2026_05_22_000002`
- CRUDs de lookups: Áreas, Eixos, Segmentos, Turmas, Tipos de Instituição, Formas de Apresentação, Qualis CAPES, Tipos de Publicação, Geografia (País/Região/Estado) — todos com fluxo de exclusão + verificação de impacto + notificação
- Sidebar com grupo colapsável "Cadastros" (`NavCadastros`)
- Formulário de publicação: create/edit com defaults (Artigo, Online, Educação), autocomplete de autores e palavras-chave, drag-to-reorder de autores
- `PublicacoesController`: `create`, `store`, `edit`, `update`, `destroy`, `buscarAutores` (com `exclude[]`), `buscarPalavrasChave`, `criarAutorInline`, `criarPalavraChaveInline`
- `LocalPublicacaoController`: `buscar` (GET com `q` + `estado`), `storeInline` (POST), `updateInline` (PATCH `/{id}/inline`)
- Testes: 42 testes passando em `PublicacoesCrudTest.php`, 17 em `LookupCrudTest.php`

**Regras de negócio do formulário:**
- Campos obrigatórios: título (mín. 10 chars), ano, ao menos um autor, local de publicação, resumo (mín. 50 chars), ao menos uma área do conhecimento, e ao menos um dos localizadores: DOI, link ou ISBN
- Toda criação inline (tipo, forma, local, autor, palavra-chave) exige confirmação via Dialog antes do POST imediato ao banco
- Autores já adicionados são excluídos da busca de sugestões (`exclude[]`)
- Seções do formulário: Dados Básicos → Conteúdo → Autores → Local de publicação → Classificação

**Local de publicação no formulário** (integrado em `PublicacaoForm.tsx`, sem componente separado):
- 4 campos `CreatableSelect` — Nome, Nome abreviado, ISSN e um Popover+Command para Estado/UF
- Todos os 4 campos compartilham o mesmo `local_publicacao_id`; selecionar em qualquer um popula os outros
- Estado/UF filtra os demais campos (`locaisFiltrados`); deselecionar o estado volta a mostrar todos
- "Novo periódico..." em qualquer campo abre Dialog de criação com cross-filter de correspondências em tempo real
- `LocalPublicacaoSelect.tsx` foi deletado — padrão unificado com o resto do formulário

**`formProps()` do `PublicacoesController`**: passa `locaisPublicacao` com 4 campos (id, nome, nome_abreviado, issn, estado) + `estados` (sigla, nome) do model `Estado`

**Internacionalização:** `lang/pt_BR/validation.php` com todas as mensagens de validação em português, incluindo nomes de atributos e mensagens customizadas por campo

**Spec:** `docs/superpowers/specs/2026-05-20-crud-publicacoes-design.md`

### CRUD de Periódicos (implementado 2026-07-08)

- `Lookups/PeriodicoController` (rota `admin/cadastros/periodicos`) — CRUD de `local_publicacao` com campos nome, nome abreviado, ISSN (regex `\d{4}-\d{3}[\dXx]`) e Estado/UF (select por sigla via `estadoModel`)
- **Unicidade de nome relaxada**: o legado tem 11 nomes e 6 ISSNs duplicados; a validação só bloqueia unicidade quando o valor *muda* (permite editar duplicatas legadas sem saneamento prévio — saneamento é papel da curadoria)
- `LookupController` base generalizado (retrocompatível): `store`/`update` persistem todos os campos de `fields()` via `formPayload()` ('' → NULL); campos extras declaram validação na chave `'rules'` (removida do config enviado ao React); `nameRules()` e `validationMessages()` sobrescrevíveis
- `LookupCrud.tsx` generalizado: `useForm` dinâmico a partir de `config.fields`, render de campo `type: 'select'` (sentinela `__none__` para valor vazio)
- Não confundir com `Admin\LocalPublicacaoController` (inline do formulário de publicação) — coexistem; unificação futura possível
- Testes: 10 em `PeriodicoCrudTest.php`

### Backup do SQLite com guard (implementado 2026-07-08)

- `composer run test` chama `bin/backup-sqlite.php` (antes era um `copy()` inline) — **recusa-se a sobrescrever o `.bak` se o banco atual tiver menos da metade do tamanho do backup** (sinal de migrate:fresh acidental; em 2026-07-08 o banco dev foi zerado e o backup automático destruiu a única cópia)
- Restauração de dados: dump completo de prod em `schema_prod.sql` (dados de 2026-05-25; acervo é atualizado apenas 1x/ano) — carregar no MySQL Docker e copiar via script tabela a tabela

### Infraestrutura de Testes Frontend (implementada)

- Vitest 4 + Testing Library + jsdom configurados em `vitest.config.ts` separado
- `npm run test` (CI) e `npm run test:watch` (dev)
- `composer run test:all` roda PHP + JS em sequência
- Primeiro teste: `DynamicDataTable.test.tsx` — 4/4 passando
- Testes frontend pendentes: toast e dialog em 2 passos em `SearchLogs/Index.tsx`; testes backend em `SearchLogTest.php` (truncate, cleanup, export)

**Spec:** `docs/superpowers/specs/2026-05-13-infraestrutura-testes-frontend-design.md`

### Reestruturação do Menu de Estatísticas (implementada)

- Menu achatado de 3 para 2 níveis em `menuConfig.js`
- Rotas migradas de `/estatisticas/quantitativo/{tipo}` para `/estatisticas/{tipo}` — rota única `{tipo}` no `EstatisticaController`
- 5 páginas individuais deletadas + `GraficosController` removido; todas usam `Generico.tsx`
- `Generico.tsx` — tab Gráfico usa `forceMount` com `data-[state=inactive]:hidden`; tabela com `defaultSorting` decrescente por `xKey` quando `hasYearFilter`
- `VisaoGeral.tsx` — cards agrupados em 4 seções; botão de cópia por card, por seção e global (copia tudo com separadores `=== Título ===`)
- Testes: 15 em `EstatisticaControllerTest.php`

**Timestamps em `publicacao`:** migration `2026_05_25_141804_add_timestamps_to_publicacao` adicionou `created_at`/`updated_at` nullable. Registros legados têm null. `Publicacao::$timestamps` reativado.

**`ChartControls`** (`resources/js/components/ChartControls.tsx`):
- Controles: tipo de gráfico, modo absoluto/percentual, "Exibir top" (10/20/40 — oculto para pizza e hasYearFilter), filtro de anos
- "Linha" só aparece quando `hasYearFilter = true`; reseta para `bar` se selecionado sem essa flag
- `chartLimit` padrão: 10

**`DynamicChart`** (`resources/js/components/DynamicChart.tsx`):
- `ResponsiveContainer` com `height={440}` fixo (evita altura 0 em flex/tabs); `bar_horizontal` usa `max(440, n*28)`
- Percentual: `Number(((v/total)*100).toFixed(1))` — `Number()` obrigatório para Recharts aceitar como número
- Barras truncadas em `chartLimit`; pizza agrupa cauda em "Outros" acima de 10 itens
- `CustomTooltip` com `bg-popover text-popover-foreground` — adapta ao tema claro/escuro
- Labels de barras verticais: dentro (`y+14`, branco 13px) se `height >= 24px`; fora (badge acima com `var(--popover)`) se menor
- Labels de barras horizontais: dentro (`x+width-8`, branco 13px) se `width >= 40px`; fora (badge à direita) se menor
- `LabelList` usa `formatter={labelFormatter}` — Recharts aplica o `%` antes de passar ao componente de label
- Labels internos do pie: threshold 10%, posição 72% do raio, badge com `var(--popover)` + `var(--border)` + `opacity 0.92`, wrap automático em até 2 linhas (18 chars/linha)
- Legenda do pie com valores: `formatter={(value, entry) => \`${value}: ${entry.payload?.[valueKey]}\`}`
- Botão fullscreen (`Maximize2`/`Minimize2`) no canto superior direito; em fullscreen `ResponsiveContainer` usa `height="100%"` com flex

**`DynamicDataTable`** (`resources/js/components/DynamicDataTable.tsx`):
- Botão fullscreen ao lado de "Exportar CSV"; em fullscreen recebe `bg-background p-6 overflow-auto`

**`useFullscreen`** (`resources/js/hooks/useFullscreen.ts`):
- Encapsula `requestFullscreen`, `exitFullscreen` e `fullscreenchange`; retorna `{ ref, isFullscreen, toggle }`

**Spec:** `docs/superpowers/specs/2026-05-13-reestruturacao-menu-estatisticas-design.md`

## Funcionalidades em planejamento

### CRUD de Publicações — Subciclo 2 (implementado)

**Subciclo 2 — Operações Especiais:**
- Clone: POST `/admin/publicacoes/{id}/clone` — replica registro + pivots (autores, palavras-chave, áreas), sufixo "(cópia)" no título, notifica todos os usuários via `PublicacaoClonada` (database), redireciona para edição
- Merge: GET/POST `/admin/publicacoes/merge` — checkboxes na listagem para selecionar 2 pubs, página `Merge.tsx` com tabela 3 colunas (campos diferentes clicáveis), seção N:M com opção "Unir ambos", mantém menor ID, exclui maior ID em transação
- 5 relações `BelongsTo` adicionadas ao model `Publicacao`: `tipoInstituicao`, `turma`, `eixoTematico`, `segmentoEducacional`, `qualisCape`
- Testes: 4 em `PublicacoesCloneTest.php`, 5 em `PublicacoesMergeTest.php`

### CRUD de Publicações — Subciclo 3 (implementado)

**Subciclo 3 — Normalização de Texto:**
- Lookup `termos_excecao_caso` (CRUD completo + seed: LGPD, EaD, CNPq, SciELO, COVID-19, BNCC, ENEM, MEC, UNESCO, CAPES) — rota em `admin/cadastros/termos-excecao`, item no menu Cadastros
- `NormalizacaoTextoService::sentenceCase()` — lowercase total → uppercase primeira letra → restaura exceções da tabela via `cache()->remember('termos_excecao_caso', 3600)`
- Aplicado em `store`, `update` (campo `titulo`), `syncPalavrasChave` e `criarPalavraChaveInline` do `PublicacoesController`
- Comando artisan `php artisan texto:normalizar` com `--dry-run` e `--tipo=publicacoes|palavras-chave`, processa em chunks de 200, emite `TextoNormalizado` (database) por registro (≤10) ou agrupada (>10)
- Testes: 6 em `NormalizacaoTextoTest.php`

**Spec:** `docs/superpowers/specs/2026-05-20-crud-publicacoes-design.md`

### Page Help — Ajuda contextual (implementado)

- Componente `PageHelp` (`resources/js/components/page-help.tsx`) — ícone `CircleHelp` (lucide) com Tooltip do shadcn/Radix, acessível via teclado (`aria-label="Ajuda"`), não renderiza quando texto vazio
- `LookupController::description(): string` — método protegido retornando `''` por padrão, incluído no `buildConfig()` como `config.description`
- 9 subcontrollers em `Lookups/` sobrescrevem `description()` com texto explicativo
- `pageDescription` passado diretamente no `Inertia::render()` de: `PublicacoesController` (index, create, edit, mergePage), `SearchLogController::index()`, `GeografiaController::index()`
- Testes: 2 Vitest em `page-help.test.tsx` + asserção de `config.description` em `LookupCrudTest.php`
- `GeografiaCrud.tsx` ganhou h1 "Geografia" (antes não tinha cabeçalho de página)

**Spec:** `docs/superpowers/specs/2026-05-24-page-help-design.md`

### Curadoria de Publicações (em design — não iniciada)

Módulo para gestão da qualidade dos dados do banco. Decisões de design já tomadas:

**Detecção de duplicatas:**
- Job por publicação (`DetectDuplicatesJob`) disparado via `PublicacaoObserver` em `created`/`updated`
- 4 critérios: título normalizado igual, título + ano, título + autor em comum (por `autor_id`), DOI igual
- Similaridade de título via `similar_text()` do PHP — threshold 0.85
- Autores comparados por ID (entidade normalizada), não por fuzzy de nome
- Comando artisan `duplicates:scan` para varredura inicial do banco existente
- Pares resolvidos (merged/dismissed) não são re-detectados

**Modelo de dados:**
- `duplicate_candidates`: par de publicações + motivo + score + status (`pending`/`merged`/`dismissed`) + quem resolveu
- `notifications`: tabela padrão Laravel (já criada via migration `2026_05_15_000003`)

**Interface:**
- Badge de notificações no sidebar (polling a cada 60s em `/admin/notifications/count`)
- Página `/admin/duplicatas` para revisão — ao acessar, marca notificações como lidas
- Merge campo a campo: pesquisador escolhe o que manter de cada publicação
- UI em páginas dedicadas (não modal)
- Importação aceita CSV/XLSX/XLS — duplicatas detectadas após importação (não bloqueia)

**Spec:** `docs/superpowers/specs/2026-05-13-curadoria-publicacoes-design.md` — pronta para implementação.

## CI/CD

- `lint.yml` — roda em push para `main` e `develop`: Pint, Prettier, ESLint
- `main.yml` — roda em push para `main`: build + FTP deploy para produção

O deploy exclui automaticamente `.git`, `node_modules`, `tests` e `.env.example`.

### Upgrade GitHub Actions — Node.js 24 (implementado 2026-07-08)

Actions atualizadas para `checkout@v6.0.2`, `cache@v5.0.5`, `setup-node@v6.4.0` (runtime Node.js 24) nos dois workflows; env `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` removido.

**Spec:** `docs/superpowers/specs/2026-05-26-upgrade-github-actions-node24-design.md`

### Correções de segurança (2026-07-08)

- `RECAPTCHA_SECRET_KEY` no deploy recebia a chave pública — corrigido para `secrets.RECAPTCHA_SECRET_KEY`
- `?test_mode=1` da busca pública restrito a usuários autenticados (expunha SQL/bindings/query log) — regressão coberta por `tests/Feature/Search/TestModeTest.php`
- Step morto do CI (`@space-man/react-theme-animation`) removido dos dois workflows
- Dumps SQL (`schema_prod.sql`) adicionados ao `.gitignore` — repo é público; o dump de prod fica só local (dados de 2026-05-25; acervo atualizado 1x/ano)
