# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Variáveis de ambiente importantes

Ver `.env.example`. Em desenvolvimento, as chaves críticas são:
- `RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` — necessárias para o formulário de contato
- `MAIL_*` — para envio de email via Gmail SMTP
- `VITE_RECAPTCHA_SITE_KEY` — exposta ao frontend via Vite

## CI/CD

- `lint.yml` — roda em push para `main` e `develop`: Pint, Prettier, ESLint
- `main.yml` — roda em push para `main`: build + FTP deploy para produção

O deploy exclui automaticamente `.git`, `node_modules`, `tests` e `.env.example`.
