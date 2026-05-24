# Curadoria de Publicações — Design Spec

**Data:** 2026-05-13  
**Status:** Aprovado (design), não iniciado (implementação)

---

## Visão Geral

Módulo de gestão da qualidade dos dados do banco de publicações do e-Aval. Cobre três frentes: detecção e resolução de duplicatas, importação estruturada de arquivos e notificações para o pesquisador administrador.

---

## 1. Modelo de Dados

### Tabela `duplicate_candidates`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | PK | |
| `publicacao_a_id` | FK → publicacoes | Sempre o ID menor do par |
| `publicacao_b_id` | FK → publicacoes | Sempre o ID maior do par |
| `motivo` | enum | `same_title`, `same_title_year`, `same_title_author`, `same_doi` |
| `score` | float (0–1) | Grau de similaridade do título (1.0 = idêntico) |
| `status` | enum | `pending`, `merged`, `dismissed` |
| `resolved_by` | FK → users, nullable | Usuário que resolveu |
| `resolved_at` | timestamp, nullable | |
| `created_at` / `updated_at` | timestamps | |

Constraint `UNIQUE(publicacao_a_id, publicacao_b_id)` garante que `a_id < b_id`, evitando pares duplicados invertidos. Pares já resolvidos (`merged` ou `dismissed`) nunca são recriados.

### Tabela `notifications`

Tabela padrão Laravel gerada por `php artisan notifications:table`. Usada para notificar admins sobre novos pares detectados.

---

## 2. Detecção de Duplicatas

### Algoritmo

O `DetectDuplicatesJob` recebe o ID de uma publicação e compara contra o banco usando 4 critérios:

| Motivo | Critério |
|---|---|
| `same_title` | Título normalizado idêntico (lowercase, sem acentos, sem pontuação) |
| `same_title_year` | Título normalizado + ano iguais |
| `same_title_author` | Título normalizado + pelo menos 1 `autor_id` em comum |
| `same_doi` | DOI ou ISBN não-nulo e igual |

**Similaridade de título:** via `similar_text()` do PHP. Score ≥ 0.85 gera candidato. Títulos exatamente iguais após normalização recebem score 1.0.

**Autores:** comparados por `autor_id` (entidade normalizada), não por fuzzy de nome. Fuzzy de autor é fora de escopo.

### Disparos

- `PublicacaoObserver@created` e `@updated` — despacha `DetectDuplicatesJob` para a publicação afetada
- `php artisan duplicates:scan` — varre todas as publicações existentes, despachando um job por publicação (com throttle para não sobrecarregar a queue)

Queue utilizada: `default` (já existente no projeto).

---

## 3. Notificações e Badge na Sidebar

Quando `DetectDuplicatesJob` encontra um par novo, dispara uma notificação Laravel (`Notification::send()`) para todos os usuários admin via canal `database`.

**Badge na sidebar:**
- Componente `NotificationBadge` adicionado ao `app-sidebar.tsx` sobre o ícone de curadoria
- Exibe contagem de notificações com `read_at IS NULL`
- Polling a cada 60s em `GET /admin/notifications/count`
- Ao acessar `/admin/duplicatas`, todas as notificações são marcadas como lidas (`read_at = now()`)

---

## 4. Interface de Revisão e Merge

### Página `/admin/duplicatas`

Lista pares com status `pending` em ordem decrescente de score. Para cada par, exibe as duas publicações lado a lado com campos divergentes destacados.

**Ações disponíveis por par:**

| Ação | Label | Efeito |
|---|---|---|
| Mesclar | "Mesclar publicações" | Abre tela de merge campo a campo |
| Descartar | "São publicações distintas" | Status → `dismissed`; sistema não sugere o par novamente |
| Ignorar | "Ignorar por agora" | Fecha sem alterar status |

**Aba "Mesclados recentemente":** lista pares com status `merged` dos últimos 30 dias, com botão "Desfazer" em cada um.

### Tela de Merge

Cada campo é apresentado como escolha entre o valor da publicação A e da publicação B (radio button). O sistema pré-seleciona a opção mais provável via heurística:
- Campo mais completo (texto mais longo)
- Para campos numéricos, o valor mais recente
- Campos idênticos: pré-selecionados e colapsados

O usuário vê claramente que são sugestões e pode alterar antes de confirmar.

**Ao confirmar o merge:**
1. A publicação "vencedora" recebe os valores escolhidos
2. A publicação "perdedora" recebe `deleted_at = now()` (soft delete — requer adicionar `SoftDeletes` ao model `Publicacao` e migration com coluna `deleted_at`)
3. Todas as relações da perdedora (autores, palavras-chave) são migradas para a vencedora, sem duplicar
4. O par recebe status `merged`
5. Pares `pending` que envolviam a perdedora são automaticamente marcados como `dismissed`

**Desfazer merge:** disponível por 30 dias na aba "Mesclados recentemente". Restaura a publicação perdedora (limpa `deleted_at`), reverte as relações migradas e retorna o par para status `pending`.

---

## 5. Importação de Arquivos

### Página `/admin/importar`

Aceita upload de CSV, XLSX ou XLS.

**Template:** a página exibe a lista de colunas esperadas (obrigatórias e opcionais) e oferece botão para baixar um arquivo CSV de exemplo pré-preenchido com uma publicação fictícia.

### Fluxo

**1. Upload e validação de formato**
- Valida extensão e tamanho máximo
- Detecta mapeamento de colunas pelo cabeçalho (ex: "título", "title", "titulo" → `titulo`)
- Se coluna obrigatória não for mapeável, bloqueia e informa quais faltam

**2. Preview**
- Exibe primeiras e últimas linhas do arquivo
- Resumo quantitativo: total de linhas, colunas detectadas, campos obrigatórios encontrados/faltando
- Destaca problemas detectáveis antes da importação (campo obrigatório vazio, formato de ano inválido, etc.)
- Botão **"Baixar relatório de erros"** gera CSV com: número da linha, coluna com problema e descrição do erro
- O pesquisador pode corrigir o arquivo original e fazer novo upload

**3. Importação**
- Processada em background via `ImportPublicacoesJob`, linha por linha
- Erros de linha são registrados em log e não interrompem o restante

**4. Relatório final**
- Exibe: publicações importadas com sucesso, ignoradas por erro, e lista de erros por linha

**5. Detecção pós-importação**
- Após conclusão, `DetectDuplicatesJob` é despachado para cada publicação importada com sucesso
- Notificações aparecem na sidebar conforme os jobs processam

---

## Fora de Escopo

- Fuzzy matching de nomes de autores (curadoria de autores é módulo separado)
- Notificações por email ou push
- Controle de acesso por nível (todos os admins têm acesso total ao módulo)
- Edição de publicações individuais (módulo de edição existente não é alterado por este spec)

---

## Análise Pré-Implementação

> Adicionada em 2026-05-13 após revisão do código atual. Registra armadilhas identificadas e decisões necessárias antes de começar.

---

### Restrição transversal — compatibilidade SQLite (dev) / MySQL (prod)

O projeto usa **SQLite em desenvolvimento local** e **MySQL em produção**. Toda query deve funcionar nos dois backends. Regras práticas:

- Usar Eloquent query builder sempre que possível — gera SQL compatível automaticamente
- `DB::raw()` somente com funções padrão SQL: `COUNT`, `MIN`, `MAX`, `AVG`, `LOWER`, `TRIM`, `COALESCE` — disponíveis nos dois
- **Proibido em raw SQL:** `GROUP_CONCAT` (MySQL) → usar `implode()` em PHP; `REGEXP_REPLACE` (MySQL) → normalizar em PHP; `DATE_FORMAT` (MySQL) → usar Carbon/PHP
- **FKs:** SQLite não valida foreign keys por padrão (`PRAGMA foreign_keys = ON` não é ativado pelo Laravel) — testar integridade referencial manualmente ou via testes feature que rodam contra MySQL em CI se necessário
- **Check constraints:** parseadas mas não aplicadas pelo SQLite — confiar na lógica de aplicação como barreira real (ver item 3 abaixo)
- A normalização de títulos para detecção de duplicatas deve ser feita **em PHP** (não em SQL) exatamente por isso

---

### Riscos por prioridade

#### 🔴 Alta — quebra em runtime ou impossibilidade de implementação

**1. Campo `doi` não existe no modelo `Publicacao`**

O modelo atual tem apenas `isbn` — não há coluna `doi`. O critério `same_doi` e a descrição "DOI ou ISBN não-nulo e igual" pressupõem a existência desse campo.

**Decisão a tomar antes de implementar:** adicionar coluna `doi` via migration (requer migration nova + campo no `$fillable` + cast), ou renomear o motivo para `same_isbn` e limitar a comparação a `isbn` apenas. A segunda opção é menos invasiva; a primeira é semanticamente mais correta para o domínio científico.

---

**2. Tabela no banco se chama `publicacao` (singular), não `publicacoes`**

`Publicacao::class` tem `protected $table = 'publicacao'`. A migration de `duplicate_candidates` deve usar esse nome nas FKs:

```php
$table->foreignId('publicacao_a_id')->constrained('publicacao');
$table->foreignId('publicacao_b_id')->constrained('publicacao');
```

Usar `publicacoes` vai falhar silenciosamente no SQLite (cria a FK sem validá-la) mas quebrar em MySQL com erro de constraint.

---

**3. `UNIQUE(publicacao_a_id, publicacao_b_id)` não garante `a_id < b_id`**

A spec afirma que a constraint UNIQUE "garante que `a_id < b_id`". Isso é incorreto — a constraint garante apenas unicidade do par, não a ordenação. Um par `(5, 3)` e um par `(3, 5)` seriam dois registros distintos.

**Decisão:** a ordenação deve ser imposta na **aplicação** (sempre inserir com `min($a, $b)` como `a_id` e `max($a, $b)` como `b_id`). Para reforço no banco, adicionar check constraint — mas atenção à diferença de backend:

- **MySQL (prod):** `$table->check('publicacao_a_id < publicacao_b_id')` funciona normalmente
- **SQLite (dev):** check constraints são parseadas mas raramente aplicadas nas versões usadas pelo Laravel — não é confiável como barreira

Portanto: confiar na lógica de aplicação; a check constraint é apenas documentação no schema.

---

**4. "Desfazer merge" sem snapshot das relações — reversão imprecisa**

O merge migra autores, palavras-chave e outras relações da publicação perdedora para a vencedora "sem duplicar". Mas não há como saber, ao desfazer, quais relações já existiam na vencedora antes do merge e quais vieram da perdedora.

Exemplo: vencedora tinha autores [A, B]; perdedora tinha [B, C]. Após merge, vencedora fica com [A, B, C]. Ao desfazer, devemos deixar a vencedora com [A, B] — mas o sistema não tem essa informação salva.

**Decisão:** adicionar coluna `merge_snapshot` (JSON, nullable) na tabela `duplicate_candidates` para salvar o estado das relações antes do merge:

```json
{
  "autores_vencedora": [1, 2],
  "autores_perdedora": [2, 3],
  "palavras_chave_vencedora": [10, 11],
  "palavras_chave_perdedora": [12]
}
```

Ao desfazer, restaurar a vencedora para `autores_vencedora` e as FK relations do snapshot. Sem isso, o "desfazer" seria uma estimativa e poderia corromper dados.

---

#### 🟡 Média — degradação de performance ou comportamento inesperado

**5. `similar_text()` em lote — custo quadrático**

`duplicates:scan` dispara um `DetectDuplicatesJob` por publicação. Cada job compara a publicação-alvo contra todas as demais usando `similar_text()` em PHP puro. Para N publicações, o total de comparações é O(N²/2). Com 5.000 publicações: ~12,5 milhões de chamadas.

Agravante: `similar_text()` é relativamente lento para strings longas (títulos de artigos têm 50–200 caracteres). Estimativa conservadora: 0,05ms/comparação → ~10 minutos de CPU para a varredura inicial.

**Mitigação recomendada:** antes de chamar `similar_text()`, aplicar pré-filtros baratos que descartam a maioria dos pares:
- Mesmo `ano` (comparação de inteiro)
- Pelo menos 1 autor em comum (join de IDs)
- Mesma letra inicial do título (string[0] === string[0])

Isso reduz o conjunto de comparações caras em 80–95% na prática.

---

**6. `Publicacao` tem `timestamps = false` — `SoftDeletes` funciona, mas `deleted_at` precisa de atenção**

O model tem `public $timestamps = false`, o que significa que não há `created_at` nem `updated_at`. O trait `SoftDeletes` usa apenas `deleted_at` e funciona normalmente mesmo sem timestamps. Porém:

- Ao adicionar `SoftDeletes`, **todas as queries Eloquent passam a incluir `WHERE deleted_at IS NULL` automaticamente** — isso afeta busca avançada (`ArticleSearch/`), estatísticas (`EstatisticaController`) e listagem admin. O comportamento é correto (publicações deletadas devem sumir), mas precisa ser testado explicitamente.
- A coluna `deleted_at` precisa de uma migration nova — não basta adicionar ao model.
- O campo `$fillable` não precisa incluir `deleted_at` (é gerenciado pelo trait).

---

**7. Sem role system — "todos os admins" é `User::all()`**

O model `User` tem apenas `name`, `email`, `password`. Não há campo `is_admin`, roles ou permissões. O acesso à área admin é controlado apenas por `middleware('auth', 'verified')` — qualquer usuário autenticado é efetivamente admin.

**Implicação:** `Notification::send(User::all(), new DuplicateDetectedNotification(...))` é a implementação correta para o estado atual do projeto. Isso deve ser explicitado para evitar que se implemente um sistema de roles desnecessário.

---

**8. Observer — registro não especificado**

`PublicacaoObserver` precisa ser registrado. Em Laravel 12 há duas opções:

```php
// Opção A — atributo no model (preferível, co-localizado)
#[ObservedBy(PublicacaoObserver::class)]
class Publicacao extends Model { ... }

// Opção B — AppServiceProvider::boot()
Publicacao::observe(PublicacaoObserver::class);
```

A spec não especifica qual usar. **Recomendação:** usar o atributo `#[ObservedBy]` no model — mais explícito e não requer editar o provider.

---

#### 🟡 Média — diferenças SQLite (dev) vs MySQL (prod)

**9. CHECK constraint se comporta diferente nos dois backends**

Conforme já detalhado no item 3: a check constraint em `duplicate_candidates` para garantir `a_id < b_id` é aplicada em MySQL mas ignorada pelo SQLite. A lógica de aplicação é a barreira real.

**10. `notifications` table — comportamento idêntico nos dois backends**

A tabela gerada por `php artisan notifications:table` usa apenas tipos básicos (varchar, text, timestamps, uuid) — sem features específicas de backend. Funciona igual em SQLite e MySQL.

**11. Full-text search não afeta este módulo**

As migrations existentes já condicionam índices `FULLTEXT` ao MySQL. O módulo de curadoria não usa full-text search — sem impacto.

---

#### 🟢 Baixa — qualidade de código e completude

**12. Importação de XLSX/XLS — dependência não listada**

PHP nativo lida com CSV. Para XLSX e XLS é necessária uma biblioteca externa. As opções são:

- `maatwebsite/excel` (Laravel Excel) — integração Laravel nativa, mais features
- `phpoffice/phpspreadsheet` — mais baixo nível, sem dependência Laravel

Nenhuma está no `composer.json` atual. **Decisão:** escolher e adicionar à spec como dependência explícita antes de implementar.

---

**13. Preview de importação — "últimas linhas" exige leitura completa do arquivo**

O spec diz "exibe primeiras e últimas linhas do arquivo". Para XLSX grande, mostrar as últimas linhas requer ler o arquivo inteiro até o fim (sem streaming). Para CSV, é possível ler apenas o cabeçalho + N primeiras linhas + N últimas linhas de forma eficiente.

**Recomendação:** simplificar para "primeiras N linhas" no preview (ex: primeiras 5), sem exibir as últimas. O resumo quantitativo (total de linhas, colunas detectadas) já dá contexto suficiente. Exibir últimas linhas adiciona complexidade sem valor proporcional.

---

### Riscos de Lint/TypeScript

| Ponto | Problema provável | Solução |
|---|---|---|
| `NotificationBadge` com `setInterval` | Sem cleanup no `useEffect` → memory leak | Retornar `() => clearInterval(id)` no cleanup |
| Formulário de merge com N campos radio | Muitos `useState` independentes → prop drilling | Usar `useReducer` com um objeto de estado por campo |
| Comparação de campos A vs B | Acessar `publicacao[campo]` de objeto tipado pode gerar `no-unsafe-member-access` | Tipar o objeto de merge explicitamente com todos os campos de `Publicacao` |
| `merge_snapshot` JSON no backend | Retornar `object` genérico ao frontend | Tipar o shape do snapshot e usar `z.parse()` ou cast explícito |

---

### Cobertura de Testes (TDD)

O projeto usa Pest. Não há testes para nenhuma parte deste módulo ainda.

**Coberto por TDD (backend — lógica testável e previsível):**
- `DetectDuplicatesJob`: cada critério individualmente (same_title, same_title_year, same_title_author, same_isbn)
- Normalização de título: lowercase, remoção de acentos e pontuação
- Threshold de `similar_text()`: pares acima e abaixo de 0.85
- Lógica de garantia de ordenação `a_id < b_id` no job
- Controller `/admin/duplicatas`: lista apenas `pending`, marca notificações ao acessar
- Controller de merge: soft delete na perdedora, migração de relações sem duplicar, snapshot salvo
- Controller de desfazer: snapshot restaurado corretamente
- Artisan command `duplicates:scan`: dispara jobs para todas as publicações

**Não coberto (sem framework JS de testes configurado):**
- UI de merge campo a campo
- Badge de notificações com polling
- Preview de importação
- Highlight de campos divergentes
