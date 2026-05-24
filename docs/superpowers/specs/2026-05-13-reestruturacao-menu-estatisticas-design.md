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

---

## Análise Pré-Implementação

> Adicionada em 2026-05-13 após revisão do código atual. Registra armadilhas identificadas e decisões necessárias antes de começar.

---

### Restrição transversal — compatibilidade SQLite (dev) / MySQL (prod)

O projeto usa **SQLite em desenvolvimento local** e **MySQL em produção**. Toda query deve funcionar nos dois backends. Regras práticas:

- Usar Eloquent query builder sempre que possível — gera SQL compatível automaticamente
- `DB::raw()` somente com funções padrão SQL: `COUNT`, `MIN`, `MAX`, `AVG` — disponíveis nos dois
- **Proibido em raw SQL:** `GROUP_CONCAT` (MySQL) → usar `implode()` em PHP; `DATE_FORMAT` (MySQL) → usar Carbon/PHP; qualquer função de string específica de backend
- Os cards da `VisaoGeral` que calculam médias (ex: "média de palavras no título") devem usar `AVG(LENGTH(titulo))` apenas se padronizado, ou fazer o cálculo em PHP após fetch — `LENGTH()` funciona em ambos, mas resultados podem diferir para caracteres multibyte
- Os cálculos de "Média de palavras" (contar espaços) **não devem ser feitos em SQL** — usar `str_word_count()` ou `count(explode(' ', $titulo))` em PHP para consistência entre backends

---

### Riscos por prioridade

#### 🔴 Alta — quebra silenciosa

**1. `periodico` retorna 4 campos, não 2**

O controller atual faz `select('nome', 'estado', 'issn')->withCount('publicacoes as Total')`, resultando em 4 campos por objeto. `Generico.tsx` usa `xKey = colunas[0]` e `yKey = colunas[colunas.length - 1]` — se os dados tiverem campos extras, o gráfico usaria `issn` como eixo Y.

**Decisão:** no controller, mapear para `['Periódico' => $item->nome, 'Total' => $item->Total]` antes de passar ao Inertia. A tabela perderá `estado` e `issn` — aceitável, pois o foco da página é frequência por periódico.

---

**2. `GraficosController` deletado antes da página `ProducaoPorAnoForm`**

`ProducaoPorAnoForm.tsx` faz `fetch('/estatisticas/graficos/ano?...')` a cada mudança de filtro. Ao deletar a rota e o controller, essa chamada vai retornar 404 (ou pior, cair na rota `{tipo}` e retornar erro do controller).

**Decisão:** deletar a página React **antes** de remover o controller/rota no backend. Ou, alternativamente, remover controller + rota + página no mesmo commit.

---

**3. `default:` do controller retorna JSON — Inertia exibe como modal**

O `default:` atual retorna `response()->json(['error' => '...'], 400)`. O Inertia intercepta respostas não-Inertia e as exibe em um modal branco.

**Decisão:** trocar para `abort(404)`.

---

#### 🟡 Média — comportamento incorreto em runtime

**4. Campo `ano` pode chegar ao frontend como string**

O filtro de `ChartControls` vai comparar `item['ano']` com `anoInicio`/`anoFim` (números). O campo `ano` é inteiro no banco, mas dependendo do driver SQLite a serialização JSON pode entregá-lo como string — resultando em comparação `"2010" >= 2010` com comportamento indefinido.

**Decisão:** no controller, garantir cast explícito: `(int) $item->ano` nos objetos do caso `ano`.

---

**5. Rotas nomeadas — verificar uso antes de remover**

As rotas atuais têm nomes (`total`, `graficos.form`). Se houver `route('total')` em algum componente ou Blade, vai quebrar em runtime sem erro de compilação.

**Decisão:** antes de remover as rotas, rodar `grep -r "route('total'" resources/ app/` para confirmar que não há uso.

---

**6. `Autor::publicacoesPorAutor()` — shape do retorno não verificado**

O método é customizado e pode retornar chaves diferentes de `{Autor, Total}`. Se usar chaves diferentes, o gráfico em `Generico.tsx` vai usar as colunas erradas.

**Decisão:** verificar o método antes de implementar o caso `autor`, e mapear o retorno para `['Autor' => ..., 'Total' => ...]` explicitamente no controller.

---

**7. Queries N+1 na `VisaoGeral` para dados geográficos**

O controller atual para `estado`, `regiao` e `pais` faz `.get()` em todos os `LocalPublicacao` e depois chama `publicacoes()->count()` dentro do loop. Para cards da VisaoGeral ("Estado com mais publicações"), reutilizar essa lógica seria lento.

**Decisão:** para os cards da VisaoGeral, usar queries diretas com `->limit(1)` e `orderByDesc`, sem reutilizar a lógica das páginas de detalhes.

---

#### 🟢 Baixa — qualidade de código

**8. Comentários mortos no controller**

O controller tem vários blocos `// return response()->json(...)` comentados, vestígios de desenvolvimento anterior. Não causam falha, mas acumulam dívida.

**Decisão:** remover junto com a refatoração do controller.

---

### Riscos de Lint/TypeScript

Baseado em falhas anteriores neste projeto (imports não usados, tipos incompatíveis do recharts), os pontos de atenção específicos desta implementação:

| Ponto | Problema provável | Solução |
|---|---|---|
| `ChartControls` — estado `chartType` | TypeScript infere `string`, `DynamicChart` exige tipo literal | Tipar explicitamente: `useState<'bar' \| 'bar_horizontal' \| 'line' \| 'pie'>('bar')` |
| `ChartControls` — acesso a `item['ano']` | `@typescript-eslint/no-unsafe-member-access` em `Record<string, unknown>` | Cast com `// eslint-disable-next-line` (mesma abordagem de `DynamicChart.tsx`) |
| `useEffect` no filtro de anos | `react-hooks/exhaustive-deps` se faltar dep no array | Incluir todas as deps ou usar `useMemo` em vez de `useEffect` |
| Deletar páginas | Imports mortos em arquivos que as importavam | Verificar se o Inertia resolve por path dinâmico (sim — não há import estático) |

---

### Cobertura de Testes

O projeto usa Pest (PHP). Não há testes para `EstatisticaController` hoje — toda a lógica de despacho por `$tipo` está sem cobertura.

**Abordagem:** TDD no backend usando `assertInertia()`. Escrever testes antes de cada caso do controller.

**O que será coberto por testes:**
- Cada `GET /estatisticas/{tipo}` retorna HTTP 200
- Cada caso renderiza o componente Inertia correto
- Cada caso passa o shape correto de props (`dados`, `colunas`, `hasYearFilter`, etc.)
- `GET /estatisticas/tipo-invalido` retorna 404
- Props da `VisaoGeral` têm os tipos corretos (inteiros, floats, strings)

**O que não será coberto (sem framework JS de testes configurado):**
- Lógica de filtragem por ano no `ChartControls`
- Interação de tabs/gráfico no `Generico.tsx`
- Seleção de tipo de gráfico
