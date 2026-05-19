# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Regras de Colaboração

- **Sempre planejar antes de implementar.** Apresentar o plano ao usuário e aguardar aprovação antes de escrever qualquer código.
- **Sempre perguntar em caso de dúvida.** Nunca assumir — se houver ambiguidade sobre comportamento esperado, escopo ou abordagem, perguntar primeiro.

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

Toda query deve funcionar nos dois backends. Regras obrigatórias:

- Usar Eloquent query builder — gera SQL compatível automaticamente
- `DB::raw()` apenas com funções padrão: `COUNT`, `MIN`, `MAX`, `AVG`, `LOWER`, `TRIM`, `COALESCE`, `LENGTH`
- **Nunca em raw SQL:** `GROUP_CONCAT`, `DATE_FORMAT`, `REGEXP_REPLACE` — são MySQL-only
- Cálculos sobre strings (ex: contar palavras, normalizar texto) devem ser feitos **em PHP**, não em SQL
- Check constraints existem no schema mas o SQLite não as aplica — a lógica de aplicação é a barreira real

## Variáveis de ambiente importantes

Ver `.env.example`. Em desenvolvimento, as chaves críticas são:
- `RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` — necessárias para o formulário de contato
- `MAIL_*` — para envio de email via Gmail SMTP
- `VITE_RECAPTCHA_SITE_KEY` — exposta ao frontend via Vite

## Funcionalidades em planejamento

### Curadoria de Publicações (em design — não iniciada)

Módulo para gestão da qualidade dos dados do banco. Decisões de design já tomadas:

**Detecção de duplicatas:**
- Job por publicação (`DetectDuplicatesJob`) disparado via `PublicacaoObserver` em `created`/`updated`
- 4 critérios: título normalizado igual, título + ano, título + autor em comum (por `autor_id`), DOI/ISBN igual
- Similaridade de título via `similar_text()` do PHP — threshold 0.85
- Autores comparados por ID (entidade normalizada), não por fuzzy de nome
- Comando artisan `duplicates:scan` para varredura inicial do banco existente
- Pares resolvidos (merged/dismissed) não são re-detectados

**Modelo de dados:**
- `duplicate_candidates`: par de publicações + motivo + score + status (`pending`/`merged`/`dismissed`) + quem resolveu
- `notifications`: tabela padrão Laravel (`php artisan notifications:table`) para badge na sidebar

**Interface:**
- Badge de notificações no sidebar (polling a cada 60s em `/admin/notifications/count`)
- Página `/admin/duplicatas` para revisão — ao acessar, marca notificações como lidas
- Merge campo a campo: pesquisador escolhe o que manter de cada publicação
- UI em páginas dedicadas (não modal)
- Importação aceita CSV/XLSX/XLS — duplicatas detectadas após importação (não bloqueia)

**Spec e análise pré-implementação:** `docs/superpowers/specs/2026-05-13-curadoria-publicacoes-design.md` — pronta para implementação. Decisão pendente antes de começar: adicionar coluna `doi` à tabela `publicacao` ou limitar o critério `same_doi` ao `isbn` existente.

### Infraestrutura de Testes Frontend (em design — não iniciada)

- Vitest + Testing Library + jsdom
- `vitest.config.ts` separado (plugins Laravel não funcionam em teste)
- Scripts `npm run test` (CI/pre-commit) e `npm run test:watch` (dev)
- Pre-commit hook atualizado: `types && lint && test`
- Job `test-js` adicionado ao `lint.yml` em paralelo ao lint existente
- Primeiro teste: `DynamicDataTable` para validar o setup

**Spec:** `docs/superpowers/specs/2026-05-13-infraestrutura-testes-frontend-design.md`

### Reestruturação do Menu de Estatísticas (em design — não iniciada)

- Menu achatado de 3 para 2 níveis em `menuConfig.js`
- Rotas migradas de `/estatisticas/quantitativo/{tipo}` para `/estatisticas/{tipo}`
- 5 páginas individuais deletadas, todas passam a usar `Generico.tsx`
- Novo componente `ChartControls` com seletor de tipo de gráfico, modo de exibição e filtro de anos (frontend-only)
- Nova página `VisaoGeral.tsx` substitui `TotalGeral` com cards agrupados em 4 seções
- `GraficosController` e rota `/estatisticas/graficos/ano` removidos

**Spec e análise pré-implementação:** `docs/superpowers/specs/2026-05-13-reestruturacao-menu-estatisticas-design.md` — pronta para implementação.

## CI/CD

- `lint.yml` — roda em push para `main` e `develop`: Pint, Prettier, ESLint
- `main.yml` — roda em push para `main`: build + FTP deploy para produção

O deploy exclui automaticamente `.git`, `node_modules`, `tests` e `.env.example`.
