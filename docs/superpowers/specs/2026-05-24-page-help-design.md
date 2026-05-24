# Page Help — Design

## Objetivo

Exibir um texto de ajuda contextual em cada tela do admin, explicando a função da tela e o impacto de alterações no restante do sistema. O usuário acessa o texto clicando ou passando o mouse num ícone `?` ao lado do título da página.

## Decisões de design

- **Formato:** ícone `CircleHelp` (lucide) com `Tooltip` do shadcn/ui (Radix UI) — acessível via teclado e screen readers
- **Trigger:** hover e focus no ícone
- **Posição:** ao lado do `h1` principal de cada tela, alinhado verticalmente ao centro
- **Texto:** string simples, sem formatação rich text
- **Fonte:** prop `pageDescription` vinda do PHP (Inertia) — sem banco, sem arquivo central
- **Ausência:** se `pageDescription` for vazio ou ausente, `PageHelp` não renderiza nada

## Componente compartilhado

**`resources/js/components/page-help.tsx`**

```tsx
interface PageHelpProps { text: string; }

export function PageHelp({ text }: PageHelpProps) {
  if (!text) return null;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button aria-label="Ajuda" className="text-muted-foreground hover:text-foreground">
            <CircleHelp className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

Usado inline ao lado do título:

```tsx
<div className="flex items-center gap-2">
  <h1 className="text-2xl font-bold">{config.labelPlural}</h1>
  <PageHelp text={config.description ?? ''} />
</div>
```

## Backend — LookupController

Método opcional com retorno vazio padrão no `LookupController`:

```php
protected function description(): string { return ''; }
```

O `index()` do base controller inclui o campo no array `config` passado ao Inertia. Cada subclasse sobrescreve `description()` quando necessário.

## Backend — demais controllers

Cada action relevante passa `pageDescription` diretamente:

```php
return Inertia::render('admin/Publicacoes/Index', [
    'publicacoes'     => [...],
    'pageDescription' => 'Repositório central...',
]);
```

## Telas cobertas

### Lookup CRUDs (via `description()` no controller)

| Controller | Texto |
|---|---|
| `AreaController` | Classifica publicações por grande área. Usada nos filtros de busca e nas estatísticas por área. |
| `EixoTematicoController` | Subdivisão temática dentro de uma área. Aparece no formulário de publicação e nos filtros avançados. |
| `SegmentoEducacionalController` | Nível de ensino ao qual a publicação se aplica (ex: Educação Básica, Superior). |
| `TermoExcecaoCasoController` | Palavras e siglas que não são convertidas para minúsculas na normalização de títulos — ex: LGPD, CNPq, EaD. Alterações afetam novas publicações imediatamente. |
| `TurmaController` | Agrupamentos internos de publicações. Usado para organização e filtragem interna. |
| `TipoInstituicaoController` | Classifica a instituição de origem dos autores. Aparece no formulário de publicação. |
| `FormaApresentacaoController` | Como a publicação foi apresentada (artigo, livro, capítulo, etc.). |
| `TipoPublicacaoController` | Categoria geral da publicação. Usada nos filtros e estatísticas. |
| `QualisCapeController` | Classificação de qualidade de periódicos pela CAPES. Vinculada ao local de publicação. |
| `GeografiaController` | Países, regiões e estados usados no cadastro de locais de publicação. |

### Páginas individuais

| Controller / action | Texto |
|---|---|
| `PublicacoesController::index` | Repositório central do sistema. Cada registro representa um artigo indexado. Use a busca global para filtrar, os checkboxes para mesclar duplicatas. |
| `PublicacoesController::create` e `edit` | Formulário completo de cadastro. Títulos e palavras-chave são normalizados automaticamente para sentence case ao salvar. |
| `PublicacoesController::mergePage` | Une dois registros em um. O registro de menor ID é mantido; o outro é excluído permanentemente. Escolha campo a campo qual valor preservar. |
| `AdminSearchLogController::index` | Histórico de todas as pesquisas realizadas no sistema público. Útil para entender o comportamento dos usuários. |

## Interface TypeScript

`LookupConfig` ganha campo opcional:

```ts
interface LookupConfig {
  label: string;
  labelPlural: string;
  routePrefix: string;
  fields: FieldConfig[];
  datasetWarning: boolean;
  description?: string;   // novo
}
```

Páginas individuais recebem prop:

```ts
interface Props {
  // props existentes...
  pageDescription?: string;
}
```

## Testes

- **`PageHelp`:** teste Vitest verificando que o botão tem `aria-label="Ajuda"` e que o texto é passado corretamente; verificar que não renderiza quando `text` está vazio.
- **Controllers:** verificar que a prop `pageDescription` / `config.description` está presente na resposta Inertia dos `index()` afetados (PHPUnit, `assertInertia`).

## Arquivos modificados

| Arquivo | Ação |
|---|---|
| `resources/js/components/page-help.tsx` | Criar |
| `resources/js/pages/admin/cadastros/LookupCrud.tsx` | Modificar — usar `PageHelp` ao lado do título |
| `app/Http/Controllers/Admin/LookupController.php` | Modificar — adicionar `description(): string` |
| `app/Http/Controllers/Admin/Lookups/*.php` (10 controllers) | Modificar — sobrescrever `description()` em cada um |
| `app/Http/Controllers/Admin/GeografiaController.php` | Modificar — passar `pageDescription` no `index()` |
| `app/Http/Controllers/Admin/PublicacoesController.php` | Modificar — passar `pageDescription` em `index`, `create`, `edit`, `mergePage` |
| `app/Http/Controllers/Admin/AdminSearchLogController.php` | Modificar — passar `pageDescription` no `index()` |
| `resources/js/pages/admin/Publicacoes/Index.tsx` | Modificar — usar `PageHelp` |
| `resources/js/pages/admin/Publicacoes/Create.tsx` | Modificar — usar `PageHelp` |
| `resources/js/pages/admin/Publicacoes/Edit.tsx` | Modificar — usar `PageHelp` |
| `resources/js/pages/admin/Publicacoes/Merge.tsx` | Modificar — usar `PageHelp` |
| `resources/js/pages/admin/SearchLogs/Index.tsx` | Modificar — usar `PageHelp` |
| `resources/js/pages/admin/cadastros/GeografiaCrud.tsx` | Modificar — usar `PageHelp` |
| `tests/Feature/Admin/PageHelpTest.php` | Criar |
| `resources/js/components/page-help.test.tsx` | Criar |
