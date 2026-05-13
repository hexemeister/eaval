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
