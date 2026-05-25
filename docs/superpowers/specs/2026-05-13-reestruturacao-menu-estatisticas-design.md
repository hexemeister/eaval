# Reestruturação do Menu de Estatísticas — Design Spec

**Data:** 2026-05-13  
**Atualizado em:** 2026-05-25  
**Status:** Implementado

---

## Visão Geral

Duas frentes independentes mas relacionadas:

1. **Navegação:** achatar o menu de 3 níveis para 2, simplificando a estrutura de rotas
2. **Padronização de telas:** todas as opções de estatísticas usam o mesmo padrão visual com tabs Tabela/Gráfico e controles de filtragem

---

## 1. Navegação

### Menu (`menuConfig.js`)

O nível intermediário "Gráficos" e "Quantitativos de Publicações Científicas" é removido. Todos os itens ficam diretamente sob "Estatísticas":

```
Estatísticas
├── Visão Geral do Acervo        /estatisticas/visao-geral
├── Por Ano                      /estatisticas/ano
├── Por Autor                    /estatisticas/autor
├── Por Palavra-chave            /estatisticas/palavra-chave
├── Por Periódico                /estatisticas/periodico
├── Por Área do Conhecimento     /estatisticas/area-conhecimento
├── Por Tipo de Publicação       /estatisticas/tipo-publicacao
├── Por Eixo Temático            /estatisticas/eixo-tematico
├── Por Segmento Educacional     /estatisticas/segmento-educacional
├── Por Forma de Apresentação    /estatisticas/forma-apresentacao
├── Por Estado                   /estatisticas/estado
├── Por Região Geográfica        /estatisticas/regiao
├── Por País                     /estatisticas/pais
└── Por Qualis CAPES             /estatisticas/qualis
```

### Rotas (`routes/web.php`)

- Padrão novo: `GET /estatisticas/{tipo}` → `EstatisticaController@index`
- Rotas antigas removidas sem redirect
- A rota de "Visão Geral" usa tipo `visao-geral`

---

## 2. Padronização de Telas

### Componente `ChartControls`

Componente reutilizável que encapsula os controles de gráfico e chama `DynamicChart`.

**Props:**
- `data` — array completo de dados
- `xKey` — chave do eixo X
- `yKey` — chave do eixo Y
- `hasYearFilter` — booleano, habilita filtro de intervalo de anos (default: `false`)
- `title` — título repassado ao gráfico

**Estado interno:**
- `chartType` — `bar` | `bar_horizontal` | `line` | `pie` (default: `bar`)
- `display` — `absoluto` | `percentual` (default: `absoluto`)
- `anoInicio` / `anoFim` — ativos apenas quando `hasYearFilter = true`
- `chartLimit` — top N para barras (10/20/40); visível apenas quando `data.length > 10 && chartType !== 'pie' && !hasYearFilter`

**Comportamento:**
- "Linha" só aparece como opção quando `hasYearFilter = true`; se selecionado sem `hasYearFilter`, reseta para `bar`
- Filtro de anos é aplicado no frontend sobre os dados já recebidos — sem fetch adicional
- `chartLimit` padrão: 10

### Página `Generico.tsx`

Página única reutilizada por todos os tipos de estatística quantitativa. Tab "Gráfico" usa `forceMount` com `data-[state=inactive]:hidden` para garantir montagem do DOM antes da aba ser ativada. `DynamicDataTable` recebe `defaultSorting` descendente pelo `xKey` quando `hasYearFilter = true`.

### Controller (`EstatisticaController`)

- Switch único por `$tipo` cobrindo 14 casos
- Casos de detalhe renderizam `Estatisticas/Quantitativos/Generico` com `dados`, `colunas`, `title`, `hasYearFilter`
- Caso `visao-geral` renderiza `Estatisticas/VisaoGeral` com props agregados (ver Seção 3)
- `default:` retorna `abort(404)`
- Testes: 15 em `EstatisticaControllerTest.php`

---

## 3. Página "Visão Geral do Acervo"

Cards organizados em 4 seções. Cada card tem botão de cópia inline (aparece no hover). Cada seção tem botão de cópia da seção inteira. Há botão de cópia global ao lado do `<h1>` que copia todas as 4 seções com separadores `=== Título ===`.

### Grupo 1 — Sobre o Acervo
| Card | Dado |
|---|---|
| Total de publicações | `Publicacao::count()` |
| Período coberto | `min(ano)` – `max(ano)` |
| Última atualização | `updated_at` mais recente (nullable — `—` para registros legados) |
| Autor mais prolífico | nome + contagem |
| Periódico com mais publicações | nome + contagem |

### Grupo 2 — Perfil das Publicações
| Card | Dado |
|---|---|
| Qualis mais frequente | classificação + contagem |
| Área de conhecimento mais frequente | nome + contagem |
| Eixo temático mais frequente | nome + contagem |
| Segmento educacional mais frequente | nome + contagem |
| Tipo de publicação mais frequente | tipo + contagem |
| Forma de apresentação mais frequente | forma + contagem |

### Grupo 3 — Distribuição Geográfica
| Card | Dado |
|---|---|
| Estado com mais publicações | nome + contagem |
| Região com mais publicações | nome + contagem |
| País com mais publicações | nome + contagem |

### Grupo 4 — Riqueza do Conteúdo
| Card | Dado |
|---|---|
| Média de autores por artigo | float |
| Média de palavras-chave por artigo | float |
| Média de palavras no título | float |
| Média de palavras no resumo | float |
| Total de autores únicos | count |
| Total de periódicos únicos | count |
| Total de palavras-chave únicas | count |
| % de publicações com DOI | percentual |
| % de publicações com resumo | percentual |

---

## 4. Componentes de Visualização

### `DynamicChart`

Gráfico dinâmico com 4 tipos: `bar`, `bar_horizontal`, `line`, `pie`.

**Props:**
- `data`, `xKey`, `yKey`, `chartType`, `display`, `title`, `chartLimit`

**Comportamento:**
- `display = 'percentual'`: recalcula valores como `Number(((v/total)*100).toFixed(1))` — usa `Number()` para garantir tipo numérico para o Recharts
- Barras: trunca em `chartLimit` (default 40); exibe aviso "Exibindo top N de M"
- Pizza: agrupa cauda em "Outros" acima de 10 itens
- Altura: 440px fixo para bar/line/pie; dinâmica para `bar_horizontal` (`max(440, n * 28)`)
- Botão fullscreen no canto superior direito; em fullscreen o `ResponsiveContainer` usa `height="100%"` com flex

**Tooltip:** `CustomTooltip` com `bg-popover text-popover-foreground` — adapta ao tema claro/escuro

**Labels de barras:**
- Verticais: dentro da barra no topo (`y + 14`), font 13px bold branco; se barra `height < 24px`, badge acima da barra com `var(--popover)` + `var(--border)`
- Horizontais: dentro da barra à direita (`x + width - 8`), font 13px bold branco; se barra `width < 40px`, badge à direita com mesmo estilo
- `formatter` do `LabelList` aplica o `%` antes de chegar ao componente de label

**Labels do pie:**
- Internos com `PieInsideLabel` — threshold 10%, posicionados a 72% do raio
- Background estilo tooltip: `rect` com `var(--popover)` + `var(--border)` + `opacity 0.92`
- Nome com wrap automático em até 2 linhas (máx 18 chars/linha), seguido do valor
- Altura do rect se ajusta dinamicamente ao número de linhas
- Legenda com valores: `formatter={(value, entry) => \`${value}: ${entry.payload?.[valueKey]}\`}`

### `DynamicDataTable`

Tabela com busca global, ordenação, paginação e exportação CSV.

**Props:**
- `data`, `exportFilename`, `defaultSorting`

**Comportamento:**
- `defaultSorting` define ordenação inicial (ex: ano decrescente para `hasYearFilter`)
- Botão fullscreen ao lado de "Exportar CSV"; em fullscreen recebe `bg-background p-6 overflow-auto`

### `useFullscreen` hook

`resources/js/hooks/useFullscreen.ts` — encapsula `requestFullscreen`, `exitFullscreen` e o evento `fullscreenchange`. Retorna `{ ref, isFullscreen, toggle }`. Usado por `DynamicChart` e `DynamicDataTable`.

---

## 5. Infraestrutura — Timestamps em `publicacao`

Migration `2026_05_25_141804_add_timestamps_to_publicacao` adicionou `created_at`/`updated_at` nullable. `Publicacao::$timestamps` reativado. Registros legados têm `null` — exibido como "—" na Visão Geral; timestamps populam a partir da primeira edição pós-migration.
