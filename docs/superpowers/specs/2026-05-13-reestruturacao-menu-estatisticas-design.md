# Reestruturação do Menu de Estatísticas — Design Spec

**Data:** 2026-05-13  
**Status:** Aprovado (design), não iniciado (implementação)

---

## Visão Geral

Duas frentes independentes mas relacionadas:

1. **Navegação:** achatar o menu de 3 níveis para 2, simplificando a estrutura de rotas
2. **Padronização de telas:** todas as opções de estatísticas usam o mesmo padrão visual com tabs Tabela/Gráfico e controles de filtragem

Não há construção de funcionalidade nova — apenas reorganização e padronização do que já existe.

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

O item "Produção científica com mais publicações por ano" (Gráficos) é removido — coberto por "Por Ano". Os dois itens `disabled` de Gráficos são removidos.

### Rotas (`routes/web.php`)

- Padrão novo: `GET /estatisticas/{tipo}` → `EstatisticaController@index`
- Rotas antigas `/estatisticas/quantitativo/{tipo}` e `/estatisticas/graficos/ano` são removidas (sem redirect — uso interno apenas)
- A rota de "Visão Geral" usa tipo `visao-geral`

---

## 2. Padronização de Telas

### Componente `ChartControls`

Novo componente extraído e reutilizável. Recebe os dados completos e emite os dados filtrados + configurações de exibição:

**Props de entrada:**
- `data` — array completo de dados
- `xKey` — chave do eixo X
- `yKey` — chave do eixo Y
- `hasYearFilter` — booleano, habilita filtro de intervalo de anos (default: `false`)

**Estado interno:**
- `chartType` — `bar` | `bar_horizontal` | `line` | `pie` (default: `bar`)
- `display` — `absoluto` | `percentual` (default: `absoluto`)
- `anoInicio` / `anoFim` — ativos apenas quando `hasYearFilter = true`

**Saída:** renderiza os controles + `DynamicChart` com os dados filtrados. Toda a lógica de filtragem por ano é feita no frontend sobre os dados já recebidos — sem fetch adicional.

### Página `Generico.tsx` (atualizada)

Passa a usar `ChartControls` na aba de gráfico em vez de chamar `DynamicChart` diretamente. Recebe `hasYearFilter` como prop opcional (default: `false`).

### Páginas a deletar

As seguintes páginas são removidas, substituídas por `Generico.tsx` via controller:

- `Quantitativos/TotalGeral.tsx` — substituída por nova página `VisaoGeral.tsx`
- `Quantitativos/PorAno.tsx`
- `Quantitativos/PorAutor.tsx`
- `Quantitativos/PorPalavraChave.tsx`
- `Quantitativos/PorPeriodico.tsx`
- `Graficos/ProducaoPorAnoForm.tsx`

### Controller (`EstatisticaController`)

- Casos `total`, `ano`, `autor`, `palavra-chave`, `periodico` migram para `Inertia::render('Estatisticas/Quantitativos/Generico', ...)`  com o formato `dados` + `colunas` + `title` já usado pelos demais
- Caso `ano` passa `hasYearFilter: true` para habilitar o filtro de intervalo; os objetos de dados devem ter obrigatoriamente a chave `ano` (inteiro) para que o filtro funcione corretamente
- Caso `total` passa para `Inertia::render('Estatisticas/VisaoGeral', ...)` com os dados agregados (ver Seção 3)
- Rota `graficos/ano` e o `GraficosController` são removidos

---

## 3. Página "Visão Geral do Acervo"

Página de entrada do módulo de estatísticas. Cards organizados em 4 grupos visuais.

### Grupo 1 — Sobre o Acervo
| Card | Dado |
|---|---|
| Total de publicações | `Publicacao::count()` |
| Anos cobertos | `min(ano)` – `max(ano)` |
| Última atualização | `max(updated_at)` ou `max(created_at)` |
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
| País com mais publicações | nome + contagem |
| Região com mais publicações | nome + contagem |
| Estado com mais publicações | nome + contagem |

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

Todos os dados são calculados no controller e enviados como props. Sem lazy loading.

---

## Fora de Escopo

- Alteração no comportamento dos componentes `DynamicDataTable` e `DynamicChart`
- Novos tipos de gráfico além dos 4 já existentes (bar, bar_horizontal, line, pie)
- Filtros além de intervalo de anos (ex: filtro por área, por autor)
- Paginação ou lazy loading na Visão Geral
