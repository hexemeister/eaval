# Infraestrutura de Testes Frontend — Design Spec

**Data:** 2026-05-13  
**Status:** Aprovado (design), não iniciado (implementação)

---

## Visão Geral

Configurar Vitest como framework de testes para o frontend React, integrado ao pipeline de CI e ao pre-commit hook existente. O objetivo é cobrir lógica de componentes que hoje está completamente sem testes — especialmente os componentes a serem criados nas próximas features (ChartControls, NotificationBadge, formulário de merge).

---

## 1. Dependências

Instalar como `devDependencies`:

```bash
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

| Pacote | Versão mínima | Motivo |
|---|---|---|
| `vitest` | `^3.0` | Test runner nativo do Vite |
| `@testing-library/react` | `^16.0` | Suporte a React 19 |
| `@testing-library/user-event` | `^14.0` | Simulação de interações reais |
| `@testing-library/jest-dom` | `^6.0` | Matchers de DOM (`toBeInTheDocument`, etc.) |
| `jsdom` | `^26.0` | Simulação de browser no Node.js |

---

## 2. Configuração

### `vitest.config.ts` (novo arquivo na raiz)

Arquivo separado do `vite.config.ts` porque os plugins `laravel()` e `wayfinder()` quebram no ambiente Node.js de testes — eles assumem um servidor Laravel rodando.

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['resources/js/test/setup.ts'],
    },
});
```

`globals: true` evita importar `describe`, `it`, `expect` em cada arquivo de teste.

### `resources/js/test/setup.ts` (novo arquivo)

```ts
import '@testing-library/jest-dom/vitest';
```

Registra os matchers de DOM do jest-dom no Vitest.

### `tsconfig.json` — incluir arquivos de teste

Adicionar ao `include`:
```json
"resources/js/test/**/*",
"resources/js/**/*.test.ts",
"resources/js/**/*.test.tsx"
```

---

## 3. Scripts (`package.json`)

```json
"test": "vitest run",
"test:watch": "vitest"
```

- `npm run test` — execução única (CI, pre-commit)
- `npm run test:watch` — modo interativo durante desenvolvimento

---

## 4. Pre-commit Hook

Atualizar `.git/hooks/pre-commit` para incluir os testes:

```sh
#!/bin/sh
npm run types && npm run lint && npm run test
```

Ordem: TypeScript → ESLint → Vitest. Se um falha, os seguintes não rodam.

---

## 5. CI — `lint.yml`

Adicionar job `test-js` ao workflow existente, paralelo ao job de lint:

```yaml
test-js:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '22'
        cache: 'npm'
    - run: npm ci
    - run: npm run test
```

O job de lint atual (`eslint`, `prettier`, `tsc`) permanece inalterado. Os dois jobs rodam em paralelo.

---

## 6. Cobertura inicial — primeiro teste

Para validar que o setup funciona, escrever um teste para `DynamicDataTable` (componente estável, sem dependências de backend):

- Renderiza sem travar com `data` vazio
- Renderiza as colunas corretas quando recebe dados
- Filtro de busca esconde linhas que não correspondem
- Paginação muda de página corretamente

Arquivo: `resources/js/components/DynamicDataTable.test.tsx`

---

## 7. Cobertura planejada por feature

### Reestruturação de Estatísticas — `ChartControls`

| Comportamento | Tipo de teste |
|---|---|
| Filtro por ano: exclui itens fora do intervalo | unitário (lógica pura) |
| Filtro por ano: inclui itens no intervalo | unitário |
| Mudança de `chartType` repassa prop ao `DynamicChart` | componente |
| Mudança de `display` repassa prop ao `DynamicChart` | componente |
| `hasYearFilter=false` não renderiza os selects de ano | componente |

### Curadoria de Publicações — `NotificationBadge`

| Comportamento | Tipo de teste |
|---|---|
| Exibe contagem quando > 0 | componente |
| Oculta badge quando contagem = 0 | componente |
| Faz polling a cada 60s (mock de `setInterval`) | componente |
| Limpa o interval ao desmontar (sem memory leak) | componente |

### Curadoria — formulário de merge

| Comportamento | Tipo de teste |
|---|---|
| Pré-seleciona campo mais completo (texto mais longo) | unitário (heurística) |
| Campos idênticos aparecem colapsados | componente |
| Submissão envia os valores selecionados | componente + mock de router |

---

## 8. O que não será coberto

- Componentes puramente visuais sem lógica (ex: cards estáticos da VisaoGeral)
- Integração com backend (coberta pelos testes Pest)
- Navegação Inertia (requer setup mais pesado — fora de escopo por ora)

---

## 9. Riscos de Implementação

### R1 — CRÍTICO: `URL.createObjectURL` não existe em jsdom

`DynamicDataTable` chama `URL.createObjectURL(blob)` na função `exportToCSV` (linha 90). jsdom não implementa essa API — qualquer teste que renderize o componente e dispare o botão "Exportar CSV" lançará `TypeError: URL.createObjectURL is not a function`.

**Mitigação obrigatória:** adicionar ao `resources/js/test/setup.ts`:

```ts
global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();
```

Isso já é suficiente — os testes de comportamento não precisam validar o download em si.

---

### R2 — CRÍTICO: Radix UI requer `ResizeObserver` e `window.matchMedia`

`DynamicDataTable` usa `<Select>` da Radix UI (controle "Linhas por página"). Radix Select usa `ResizeObserver` internamente; jsdom não o implementa. A renderização falhará com `ReferenceError: ResizeObserver is not defined`. Alguns componentes Radix também verificam `window.matchMedia`.

**Mitigação obrigatória:** adicionar ao `resources/js/test/setup.ts`:

```ts
global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
```

---

### R3 — ALTO: `globals: true` sem declaração de tipos no tsconfig

Com `globals: true` no `vitest.config.ts`, os globais `describe`, `it`, `expect`, `vi` ficam disponíveis em runtime mas o TypeScript não os reconhece — `npm run types` (tsc --noEmit) falhará nos arquivos `.test.tsx` com `Cannot find name 'describe'`.

**Mitigação obrigatória:** adicionar `"vitest/globals"` ao array `"types"` no `tsconfig.json`:

```json
"types": ["node", "vitest/globals"]
```

---

### R4 — ALTO: `vitest run` falha com exit 1 se não há arquivos de teste

Se o setup for feito sem criar o primeiro teste no mesmo commit, `vitest run` retorna exit code 1 ("No test files found") e bloqueia todos os commits via pre-commit hook.

**Mitigação:** usar a flag `--passWithNoTests` no script até que o primeiro teste exista:

```json
"test": "vitest run --passWithNoTests"
```

Remover a flag no mesmo PR em que o primeiro teste for criado.

---

### R5 — MÉDIO: pre-commit hook não é versionado no git

`.git/hooks/pre-commit` não é rastreado pelo repositório — novos clones não herdam o hook automaticamente.

**Mitigação:** documentar o setup manual em CLAUDE.md (seção Comandos) ou criar um script `scripts/install-hooks.sh` rastreado no repo. Não requer `husky` — uma linha de documentação já elimina a ambiguidade.

---

### R6 — MÉDIO: mocks do Inertia necessários nos testes de Curadoria

Os testes do formulário de merge (seção 7) precisarão de `usePage()` e `router` do Inertia, que não funcionam fora do contexto de uma página renderizada pelo servidor.

**Mitigação:** mockar no arquivo de teste:

```ts
vi.mock('@inertiajs/react', () => ({
    usePage: () => ({ props: {} }),
    router: { post: vi.fn(), patch: vi.fn() },
}));
```

Não requer alteração no setup global — o mock deve ficar no próprio arquivo de teste para evitar efeitos colaterais.
