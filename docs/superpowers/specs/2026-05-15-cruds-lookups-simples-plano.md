# Plano de Implementação — CRUDs de Lookups Simples

**Spec:** `2026-05-15-cruds-lookups-simples-design.md`  
**Data:** 2026-05-15

---

## Princípios do plano

- **Sem retrabalho:** cada arquivo é escrito uma vez, completo. A extensão se dá por adição, não modificação.
- **Verificação dupla:** local (SQLite) e produção (MySQL) em cada ciclo — comportamentos diferentes entre os dois backends podem gerar falhas silenciosas.
- **Push atômico:** cada push para `main` é um conjunto coerente que não quebra funcionalidades existentes.
- **Migrations não rodam automaticamente:** o deploy é via FTP. Após cada push, rodar `php artisan migrate` manualmente em produção.

---

## Por que verificar em produção a cada ciclo?

SQLite (dev) e MySQL (prod) diferem em pontos críticos para esta spec:

| Comportamento | SQLite | MySQL |
|---|---|---|
| UNIQUE constraint em tabela com duplicatas existentes | aceita silenciosamente | falha com erro |
| `LIKE` | case-sensitive | case-insensitive |
| FK enforcement | ignorada por padrão | aplicada |
| Check constraints | ignoradas | aplicadas |

Verificar apenas localmente significa que o primeiro sinal de problema é um erro em produção.

---

## Ciclo 1 — Banco e infraestrutura

**O que implementa:** migrations das tabelas faltantes, constraints UNIQUE, tabela de notificações.

**Risco MySQL:** adicionar `UNIQUE` em tabelas que já existem em produção pode falhar se houver dados duplicados. A migration deve verificar duplicatas antes de aplicar a constraint:

```php
// Antes de adicionar UNIQUE em 'area.nome', por exemplo:
$duplicates = DB::table('area')
    ->select('nome', DB::raw('COUNT(*) as total'))
    ->groupBy('nome')
    ->having('total', '>', 1)
    ->exists();

if ($duplicates) {
    throw new \RuntimeException('Duplicatas em area.nome impedem criação de UNIQUE. Limpe os dados primeiro.');
}
```

**Testes automatizados:**
```bash
php artisan migrate --pretend
php artisan migrate
php artisan migrate:status
```

**Verificação local:**
- Todas as migrations como "Ran"
- Tentar inserir dois registros iguais em `area` → erro de constraint

**Push 1 → produção:**
```bash
# após push para main e deploy via FTP:
php artisan migrate --force
php artisan migrate:status
```

**Verificação em produção:**
- `migrate:status` mostra todas as migrations como "Ran"
- Conferir no MySQL que as tabelas foram criadas com as colunas corretas
- Confirmar que a tabela `notifications` existe

**Gate ✅:** schema idêntico em SQLite e MySQL, sem erros de constraint.

---

## Ciclo 2 — Backend completo para uma entidade

**Entidade escolhida:** Segmento Educacional — sem hierarquia, sem caso especial, FK direta com `publicacao`.

**O que implementa:** `LookupController` abstrato completo (todos os 5 métodos), `LookupRequest`, `SegmentoEducacionalController`, rotas.

> Após este ciclo, `LookupController` e `LookupRequest` não são mais modificados — apenas adicionamos subcontrollers.

**Testes automatizados:**
```bash
php artisan test --filter=SegmentoEducacionalTest
# deve cobrir: listar, criar, editar, unicidade, destroy conta afetados,
# destroyConfirmed nulifica FK e cria notificação
```

**Verificação local:**
- `GET /admin/cadastros/segmentos-educacionais` retorna JSON com lista paginada
- `POST` com nome duplicado retorna erro de validação 422
- `DELETE` retorna JSON com `{ affected: { publicacoes: N } }` sem deletar nada
- `POST destroy-confirmed` seta `segmento_educacional_id = NULL` nas publicações afetadas e cria registro em `notifications`

**Push 2 → produção:**
```bash
php artisan migrate --force   # não há migrations novas neste ciclo
```

**Verificação em produção:**
- Testar os mesmos endpoints via browser ou Postman contra o MySQL
- Confirmar que o `LIKE` na busca retorna resultados (MySQL é case-insensitive — comportamento diferente do SQLite)
- Confirmar que a notificação é criada na tabela `notifications` do MySQL

**Gate ✅:** backend de uma entidade funciona identicamente em SQLite e MySQL.

---

## Ciclo 3 — Frontend completo (LookupCrud.tsx)

**O que implementa:** `LookupCrud.tsx` completo com todos os estados — lista com busca e ordenação, formulário de criar/editar, modal de exclusão com afetados, suporte a selects dependentes (`formData`), banner de dataset. Entrada no menu admin (seção "Cadastros"). Wiring com Segmento Educacional.

> Após este ciclo, `LookupCrud.tsx` não é mais modificado — apenas recebe props diferentes por entidade. Os selects dependentes para entidades geográficas já são suportados via `formData`, mesmo que não usados ainda.

**Verificação local — fluxo completo:**
- `/admin/cadastros/segmentos-educacionais` → lista com busca e ordenação funcionando
- Criar "Teste" → aparece na lista
- Criar "Teste" novamente → erro de unicidade visível
- Editar "Teste" → salva e reflete
- Campo de busca: digitar "educ" → filtra a lista
- Alternar asc/desc → lista reordena
- Excluir → modal mostra publicações afetadas → confirmar → some → badge na sidebar acende
- Verificar no banco: `segmento_educacional_id = NULL` nas publicações afetadas

**Push 3 → produção:**
```bash
php artisan migrate --force   # sem migrations novas
```

**Verificação em produção:**
- Repetir o fluxo completo acima contra MySQL
- Atenção especial: busca por `LIKE` — no MySQL retorna resultados case-insensitive. Verificar que não há comportamento inesperado
- Badge de notificação aparece após exclusão com afetados

**Gate ✅:** uma tela funcionando de ponta a ponta em produção com MySQL.

---

## Ciclo 4 — Demais lookups simples

Zero modificação em código existente — apenas novos subcontrollers e rotas.

**O que implementa:**
- `AreaController` (M:N via pivot `area_publicacao` — atenção: `destroyConfirmed` deleta linhas do pivot, não nulifica FK)
- `EixoTematicoController`
- `TurmaController`
- `TipoInstituicaoController`
- `FormaApresentacaoController` (string match — único controller que usa `bindingMode() = 'string_match'`)

**Testes automatizados:**
```bash
php artisan test --filter=LookupControllerTest
```

**Verificação local por entidade (iteração rápida):**
- Listar → dados existentes aparecem
- Criar, editar, excluir com confirmação
- `area`: excluir uma área → modal mostra publicações vinculadas via M:N → confirmar → linhas do pivot deletadas
- `forma_apresentacao`: excluir "On-line" → modal mostra publicações onde `forma = 'On-line'` → confirmar → `publicacao.forma = NULL`

**Push 4 → produção:**
```bash
php artisan migrate --force   # sem migrations novas
```

**Verificação em produção:**
- Spot check: testar criar e excluir em pelo menos `area` e `forma_apresentacao` no MySQL
- Confirmar que o string match de `forma_apresentacao` funciona no MySQL (case-insensitive pode retornar mais resultados — verificar se é o comportamento esperado)

**Gate ✅:** todos os 6 lookups simples operacionais em produção.

---

## Ciclo 5 — Hierarquia geográfica

O mais complexo. O frontend já suporta `formData` e selects dependentes desde o Ciclo 3 — zero modificação em `LookupCrud.tsx`.

O único ponto de atenção: o cascade UPDATE de sigla introduz um hook `onBeforeUpdate()` no `LookupController`. Para evitar modificar a classe base neste ciclo, este hook deve ser reservado como método vazio na implementação do Ciclo 2:

```php
// Em LookupController — adicionado no Ciclo 2, usado no Ciclo 5
protected function onBeforeUpdate(Model $record, array $data): void {}
```

**O que implementa:**
- `PaisController` (sem dependências de formulário)
- `RegiaoController` (`formData` retorna lista de países)
- `EstadoController` (`formData` retorna lista de regiões)
- `PaisController::onBeforeUpdate()` e `RegiaoController::onBeforeUpdate()` com cascade UPDATE de sigla

**Testes automatizados:**
```bash
php artisan test --filter=GeografiaLookupTest
# cobre: cascade UPDATE de sigla propaga corretamente, contagem de afetados em cascata
```

**Verificação local:**
- País: criar, editar sigla → modal mostra regiões afetadas → confirmar → sigla propagada em `regiao.sigla_pais`
- Região: criar com select de país funcionando → excluir → modal mostra estados e locais em cascata
- Estado: criar com select de região funcionando → excluir → modal mostra locais de publicação afetados

**Push 5 → produção:**
```bash
php artisan migrate --force   # sem migrations novas
```

**Verificação em produção:**
- Testar edição de sigla de um país (usar país criado para teste, não Brasil)
- Confirmar cascade no MySQL — a propagação de FK via `UPDATE` funciona diferente do SQLite (MySQL valida FK em tempo real)
- Verificar que não há deadlock ou ordem de UPDATE problemática na transação do cascade

**Gate ✅:** hierarquia geográfica completa e verificada em MySQL.

---

## Resumo dos pushes

| Push | Após ciclo | O que vai para produção | Migrations |
|---|---|---|---|
| 1 | Banco | Migrations das tabelas faltantes + notifications | ✅ rodar |
| 2 | Backend uma entidade | LookupController + SegmentoEducacionalController | — |
| 3 | Frontend completo | LookupCrud.tsx + menu admin | — |
| 4 | Lookups simples | 5 subcontrollers restantes | — |
| 5 | Geografia | 3 controllers geográficos + cascade | — |

---

## Checklist de implementação

- [ ] **Ciclo 1** — Migrations (faltantes + UNIQUE + notifications) | push + migrate em produção
- [ ] **Ciclo 2** — LookupController completo + LookupRequest + SegmentoEducacionalController | push + verificar MySQL
- [ ] **Ciclo 3** — LookupCrud.tsx completo + menu admin | push + verificar fluxo completo MySQL
- [ ] **Ciclo 4** — AreaController, EixoTematicoController, TurmaController, TipoInstituicaoController, FormaApresentacaoController | push + spot check MySQL
- [ ] **Ciclo 5** — PaisController, RegiaoController, EstadoController + cascade UPDATE sigla | push + verificar cascade MySQL
