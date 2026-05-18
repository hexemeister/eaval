# Plano de Implementação — CRUDs de Lookups Simples

**Spec:** `2026-05-15-cruds-lookups-simples-design.md`  
**Data:** 2026-05-15

---

## Como funciona cada ciclo

Cada ciclo tem duas partes bem separadas:

- **O que eu implemento** — código, testes, commit
- **O que você verifica** — ações manuais na interface e no servidor; só avança quando aprovar

Acesso ao banco é necessário apenas **uma vez**: antes do Ciclo 1, para checar duplicatas em produção. Todo o resto é verificável pela interface.

---

## Antes de começar — Verificação única no banco de produção

**Você faz:** rodar as 3 queries no MySQL de produção (via phpMyAdmin ou similar):

```sql
SELECT nome, COUNT(*) FROM area GROUP BY nome HAVING COUNT(*) > 1;
SELECT nome, COUNT(*) FROM eixo_tematico GROUP BY nome HAVING COUNT(*) > 1;
SELECT nome, COUNT(*) FROM segmento_educacional GROUP BY nome HAVING COUNT(*) > 1;
```

**Se retornar vazio:** pode avançar para o Ciclo 1.  
**Se retornar algum resultado:** me avise — limparemos os dados duplicados antes de aplicar as migrations.

---

## Ciclo 1 — Banco e infraestrutura

**O que eu implemento:**
- Migration para criar `turma`, `tipo_instituicao`, `forma_apresentacao`
- Migration para adicionar `UNIQUE` em `area.nome`, `eixo_tematico.nome`, `segmento_educacional.nome`
- Migration para criar tabela `notifications` (necessária para o fluxo de exclusão)

---

**Você verifica — local:**

```bash
php artisan migrate
php artisan migrate:status
```

Resultado esperado: todas as migrations marcadas como "Ran". Nenhum erro no terminal.

---

**Você faz o push → produção:**

```bash
git push origin main
# aguardar o deploy via GitHub Actions finalizar
```

Em seguida, no servidor:
```bash
php artisan migrate --force
php artisan migrate:status
```

**Você verifica — produção:**
- `migrate:status` mostra todas as migrations como "Ran"
- Nenhum erro de constraint no log

**Me avisa:** ✅ aprovado ou ❌ o que deu errado.

---

## Ciclo 2 — Backend completo (Segmento Educacional)

**O que eu implemento:**
- `LookupController` abstrato com todos os métodos (index, store, update, destroy, destroyConfirmed)
- `LookupRequest` com validação de unicidade
- `SegmentoEducacionalController`
- Rotas para `/admin/cadastros/segmentos-educacionais`
- Testes automatizados

> Após este ciclo, `LookupController` e `LookupRequest` não são mais modificados.

---

**Você verifica — local:**

Acesse `/admin/cadastros/segmentos-educacionais` via Postman ou curl (ainda sem interface):

```bash
# Lista
curl -b cookies.txt http://localhost/admin/cadastros/segmentos-educacionais

# Criar
curl -b cookies.txt -X POST http://localhost/admin/cadastros/segmentos-educacionais \
  -d "nome=Teste"

# Criar duplicata (deve retornar erro 422)
curl -b cookies.txt -X POST http://localhost/admin/cadastros/segmentos-educacionais \
  -d "nome=Teste"

# Checar afetados antes de excluir (substitua {id} pelo ID criado)
curl -b cookies.txt -X DELETE http://localhost/admin/cadastros/segmentos-educacionais/{id}
```

Resultado esperado: JSON com `{ "affected": { "publicacoes": 0 } }` para o registro "Teste" recém-criado.

---

**Você faz o push → produção:**

```bash
git push origin main
# aguardar deploy — sem migrations novas neste ciclo
```

**Você verifica — produção:** repetir os mesmos comandos curl apontando para o domínio de produção.

**Me avisa:** ✅ aprovado ou ❌ o que deu errado.

---

## Ciclo 3 — Frontend completo (LookupCrud.tsx)

**O que eu implemento:**
- `LookupCrud.tsx` completo: lista com busca e ordenação, formulário criar/editar, modal de exclusão com afetados, suporte a selects dependentes, banner de dataset
- Entrada no menu admin (seção "Cadastros")
- Wiring com Segmento Educacional

> Após este ciclo, `LookupCrud.tsx` não é mais modificado.

---

**Você verifica — local** (tudo pela interface):

1. Acesse `/admin/cadastros/segmentos-educacionais`
   - A lista mostra os 13 segmentos existentes
   - O campo de busca filtra ao digitar
   - O botão asc/desc reordena a lista

2. Crie um novo: clique em "Novo" → preencha "Deletável" → salve
   - Aparece na lista

3. Tente criar "Deletável" novamente
   - Erro de unicidade visível na tela (não salva)

4. Edite "Deletável" → renomeie para "Deletável 2" → salve
   - Nome atualizado na lista

5. Exclua "Deletável 2"
   - Modal aparece com "0 publicações afetadas"
   - Confirme → some da lista
   - Badge de notificação na sidebar **não acende** (0 afetados = sem notificação)

6. Exclua um segmento que tenha publicações vinculadas (ex: "Educação Básica")
   - Modal aparece com a contagem de publicações afetadas
   - **Não confirme** — clique em Cancelar
   - O segmento continua na lista

---

**Você faz o push → produção:**

```bash
git push origin main
# aguardar deploy
```

**Você verifica — produção:** repetir os passos 1 a 6 acima no ambiente de produção.  
Atenção especial no passo 1: a busca no MySQL é case-insensitive. Digitar "educação" e "EDUCACAO" deve retornar resultados — confirmar que funciona.

**Me avisa:** ✅ aprovado ou ❌ o que deu errado.

---

## Ciclo 4 — Demais lookups simples

Zero modificação em código existente. Apenas novos subcontrollers e rotas.

**O que eu implemento:**
- `AreaController` (M:N via pivot)
- `EixoTematicoController`
- `TurmaController`
- `TipoInstituicaoController`
- `FormaApresentacaoController` (string match)

---

**Você verifica — local** (verificação rápida por entidade):

Para cada uma das 5 novas entidades, acesse `/admin/cadastros/{entidade}` e confirme:
- A lista carrega com os dados existentes
- Criar funciona
- Editar funciona
- Excluir mostra o modal com afetados

Verificações específicas:
- **Área:** excluir uma área com publicações → modal deve mostrar contagem via M:N (não FK direta)
- **Forma de apresentação:** excluir "On-line" → modal deve mostrar publicações onde `forma = 'On-line'` → **não confirme** (evitar estrago nos dados reais)

---

**Você faz o push → produção:**

```bash
git push origin main
```

**Você verifica — produção:** spot check em `area` e `forma_apresentacao` — as duas com comportamento diferente do padrão.

**Me avisa:** ✅ aprovado ou ❌ o que deu errado.

---

## Ciclo 5 — Hierarquia geográfica

O mais complexo. O frontend já suporta selects dependentes desde o Ciclo 3 — sem modificações em `LookupCrud.tsx`.

**O que eu implemento:**
- `PaisController`
- `RegiaoController` (select de país no formulário)
- `EstadoController` (select de região no formulário)
- Cascade UPDATE de sigla (País → Região, Região → Estado)

---

**Você verifica — local:**

1. **País**
   - Liste os 246 países — busca por "Brasil" funciona
   - Crie um país novo: sigla "ZZ", nome "Zorblax"
   - Edite a sigla de "ZZ" para "ZY"
     - Modal avisa que regiões serão afetadas (0, pois "ZZ" não tem regiões)
     - Confirme → sigla atualizada
   - Exclua "ZY/Zorblax"

2. **Região**
   - Crie uma região: selecione "ZZ" no select de país (use o país criado acima antes de excluir)
   - Confirme que o select lista países disponíveis

3. **Estado**
   - Crie um estado: selecione uma região no select
   - Confirme que o select lista regiões disponíveis
   - Exclua o estado criado → modal mostra locais de publicação afetados (provavelmente 0)

---

**Você faz o push → produção:**

```bash
git push origin main
```

**Você verifica — produção:**
- Repetir o fluxo de País (criar "ZZ/Zorblax", editar sigla, excluir)
- Confirmar que o cascade UPDATE funciona no MySQL (mais rigoroso que SQLite com FKs)

**Me avisa:** ✅ aprovado ou ❌ o que deu errado.

---

## Resumo do que você faz

| Momento | Ação |
|---|---|
| **Antes de tudo** | Rodar 3 queries de duplicatas no MySQL de produção |
| **Após cada push** | `php artisan migrate --force` + `migrate:status` no servidor (apenas Ciclo 1 tem migrations novas) |
| **Após cada ciclo local** | Seguir o roteiro de verificação da interface |
| **Após cada verificação em produção** | Me avisar ✅ ou ❌ |

---

## Checklist

- [x] **Pré-requisito** — queries de duplicatas em produção aprovadas
- [x] **Ciclo 1** — migrations aplicadas local e produção ✅
- [ ] **Ciclo 2** — backend de uma entidade verificado via curl local e produção ✅
- [ ] **Ciclo 3** — fluxo completo via interface local e produção ✅
- [ ] **Ciclo 4** — 5 lookups simples verificados local e produção ✅
- [ ] **Ciclo 5** — hierarquia geográfica verificada local e produção ✅
