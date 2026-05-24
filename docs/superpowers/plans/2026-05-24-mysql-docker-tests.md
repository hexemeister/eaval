# MySQL Docker Dev Environment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar ambiente MySQL via Docker para testar compatibilidade de migrations e suite de testes PHP, integrado ao `composer run test:all` e ao GitHub Actions CI antes do deploy FTP.

**Architecture:** Um `docker-compose.mysql.yml` sobe um container MySQL 8.0 na porta 3307. Um `phpunit.mysql.xml` configura o PHPUnit para usar esse MySQL. Um script `bin/test-mysql.sh` encapsula o fluxo local (verifica Docker → sobe container → migrate:fresh → testes → derruba container). O `composer run test:all` chama SQLite tests + MySQL tests + JS tests em sequência. O GitHub Actions ganha um job `test-php-mysql` com MySQL service nativo, que deve passar antes do job de deploy.

**Tech Stack:** Docker Compose, MySQL 8.0, PHPUnit/Pest (via `php artisan test`), GitHub Actions services, Composer scripts

---

## File Map

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `docker-compose.mysql.yml` | Criar | Container MySQL 8.0 isolado para testes |
| `phpunit.mysql.xml` | Criar | Config PHPUnit com MySQL (sobrepõe phpunit.xml) |
| `bin/test-mysql.sh` | Criar | Script local: Docker check → container → testes → teardown |
| `composer.json` | Modificar | Adicionar scripts `test:mysql` e `test:all` atualizado |
| `.github/workflows/main.yml` | Modificar | Job `test-php-mysql` antes do deploy |
| `.gitignore` | Verificar | `bin/test-mysql.sh` pode ser executável — não precisa de gitignore |

---

## Task 1: Docker Compose MySQL

**Files:**
- Create: `docker-compose.mysql.yml`

- [ ] **Step 1: Criar `docker-compose.mysql.yml`**

```yaml
# Para uso exclusivo em testes locais — não é o ambiente de desenvolvimento
services:
  mysql-test:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: eaval_test
      MYSQL_ROOT_PASSWORD: secret
    ports:
      - "3307:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-psecret"]
      interval: 5s
      timeout: 5s
      retries: 12
```

Porta 3307 evita conflito com MySQL local em 3306. `healthcheck` com 12 retries (60 segundos) é suficiente para o MySQL 8.0 inicializar.

- [ ] **Step 2: Verificar que o container sobe corretamente**

```bash
docker compose -f docker-compose.mysql.yml up -d --wait
docker compose -f docker-compose.mysql.yml ps
docker compose -f docker-compose.mysql.yml down
```

Expected: container `mysql-test` em status `healthy`, depois para.

- [ ] **Step 3: Commit**

```bash
git add docker-compose.mysql.yml
git commit -m "chore(docker): container MySQL 8.0 para testes de compatibilidade"
```

---

## Task 2: PHPUnit Config para MySQL

**Files:**
- Create: `phpunit.mysql.xml`
- Reference: `phpunit.xml` (base para copiar estrutura)

- [ ] **Step 1: Criar `phpunit.mysql.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true"
>
    <testsuites>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="Feature">
            <directory>tests/Feature</directory>
        </testsuite>
    </testsuites>
    <source>
        <include>
            <directory>app</directory>
        </include>
    </source>
    <php>
        <env name="APP_ENV" value="testing"/>
        <env name="APP_MAINTENANCE_DRIVER" value="file"/>
        <env name="BCRYPT_ROUNDS" value="4"/>
        <env name="CACHE_STORE" value="array"/>
        <env name="DB_CONNECTION" value="mysql"/>
        <env name="DB_HOST" value="127.0.0.1"/>
        <env name="DB_PORT" value="3307"/>
        <env name="DB_DATABASE" value="eaval_test"/>
        <env name="DB_USERNAME" value="root"/>
        <env name="DB_PASSWORD" value="secret"/>
        <env name="MAIL_MAILER" value="array"/>
        <env name="PULSE_ENABLED" value="false"/>
        <env name="QUEUE_CONNECTION" value="sync"/>
        <env name="SESSION_DRIVER" value="array"/>
        <env name="TELESCOPE_ENABLED" value="false"/>
    </php>
</phpunit>
```

- [ ] **Step 2: Verificar que o artisan aceita o arquivo de configuração**

Com o container MySQL rodando:

```bash
docker compose -f docker-compose.mysql.yml up -d --wait
php artisan migrate:fresh --env=testing
php artisan test --configuration phpunit.mysql.xml
docker compose -f docker-compose.mysql.yml down
```

> **Atenção:** `php artisan migrate:fresh` usa as variáveis de ambiente do shell. Para que use MySQL, exporte antes:
> ```bash
> export DB_CONNECTION=mysql DB_HOST=127.0.0.1 DB_PORT=3307 DB_DATABASE=eaval_test DB_USERNAME=root DB_PASSWORD=secret
> php artisan migrate:fresh --env=testing
> unset DB_CONNECTION DB_HOST DB_PORT DB_DATABASE DB_USERNAME DB_PASSWORD
> ```
> O `bin/test-mysql.sh` (Task 3) encapsula isso.

Expected: todos os testes passando contra MySQL.

- [ ] **Step 3: Commit**

```bash
git add phpunit.mysql.xml
git commit -m "chore(tests): phpunit.mysql.xml para rodar suite contra MySQL via Docker"
```

---

## Task 3: Script local `bin/test-mysql.sh`

**Files:**
- Create: `bin/test-mysql.sh`

- [ ] **Step 1: Criar diretório `bin/` e o script**

```bash
mkdir -p bin
```

Conteúdo de `bin/test-mysql.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Verifica se Docker está disponível e rodando
if ! docker info > /dev/null 2>&1; then
    echo ""
    echo "⚠️  Docker não está disponível."
    read -r -p "   Continuar sem testes MySQL? [s/N] " choice
    case "$choice" in
        s|S)
            echo "   Pulando testes MySQL."
            exit 0
            ;;
        *)
            echo "   Cancelado."
            exit 1
            ;;
    esac
fi

COMPOSE_FILE="docker-compose.mysql.yml"

cleanup() {
    echo ""
    echo "🛑 Parando container MySQL..."
    docker compose -f "$COMPOSE_FILE" down --remove-orphans
}
trap cleanup EXIT

echo ""
echo "🐳 Subindo container MySQL (porta 3307)..."
docker compose -f "$COMPOSE_FILE" up -d --wait

echo ""
echo "🗄️  Rodando migrate:fresh no MySQL de testes..."
DB_CONNECTION=mysql \
DB_HOST=127.0.0.1 \
DB_PORT=3307 \
DB_DATABASE=eaval_test \
DB_USERNAME=root \
DB_PASSWORD=secret \
php artisan migrate:fresh --env=testing --no-interaction

echo ""
echo "🧪 Rodando testes PHP contra MySQL..."
php artisan test --configuration phpunit.mysql.xml

echo ""
echo "✅ Testes MySQL concluídos."
```

- [ ] **Step 2: Tornar executável e testar**

```bash
chmod +x bin/test-mysql.sh
bash bin/test-mysql.sh
```

Expected: container sobe, migrations rodam, testes passam, container desce.

- [ ] **Step 3: Testar o fluxo quando Docker não está disponível**

Pare o Docker Desktop temporariamente e execute:

```bash
bash bin/test-mysql.sh
```

Expected: prompt `"Docker não está disponível. Continuar sem testes MySQL? [s/N]"`. Responder `s` deve sair com código 0 (sucesso). Responder qualquer outra coisa deve sair com código 1.

- [ ] **Step 4: Commit**

```bash
git add bin/test-mysql.sh
git commit -m "chore(scripts): bin/test-mysql.sh para testes PHP com MySQL via Docker"
```

---

## Task 4: Integrar ao `composer run test:all`

**Files:**
- Modify: `composer.json`

- [ ] **Step 1: Adicionar script `test:mysql` e atualizar `test:all` em `composer.json`**

Localizar a seção `"scripts"` em `composer.json` e substituir:

```json
"test:all": [
    "@test",
    "npm run test"
]
```

Por:

```json
"test:mysql": [
    "bash bin/test-mysql.sh"
],
"test:all": [
    "@test",
    "@test:mysql",
    "npm run test"
]
```

> **Nota:** `@test` roda os testes PHP com SQLite (`:memory:`). `@test:mysql` roda com MySQL via Docker (com fallback interativo). `npm run test` roda os testes JS com Vitest.

- [ ] **Step 2: Verificar que o script composto funciona**

```bash
composer run test:all
```

Expected: SQLite tests → (pergunta sobre Docker ou roda MySQL tests) → JS tests. Todos passando.

- [ ] **Step 3: Commit**

```bash
git add composer.json
git commit -m "feat(scripts): composer run test:mysql e test:all integrado com MySQL Docker"
```

---

## Task 5: GitHub Actions — job MySQL antes do deploy

**Files:**
- Modify: `.github/workflows/main.yml`

- [ ] **Step 1: Adicionar job `test-php-mysql` em `.github/workflows/main.yml`**

No arquivo `.github/workflows/main.yml`, adicionar um job novo ANTES do job `web-deploy`, e fazer `web-deploy` depender dele com `needs: test-php-mysql`:

```yaml
jobs:
  test-php-mysql:
    name: 🧪 Testes PHP (MySQL)
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_DATABASE: eaval_test
          MYSQL_ROOT_PASSWORD: secret
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping -h localhost -u root -psecret"
          --health-interval=5s
          --health-timeout=5s
          --health-retries=12

    steps:
      - name: 🏷️ Checkout
        uses: actions/checkout@v4

      - name: 🔧 Setup PHP 8.3
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
          extensions: mbstring, xml, ctype, iconv, intl, pdo_mysql, bcmath, curl, zip, pcntl
          tools: composer:v2
          coverage: none

      - name: 📦 Install Composer dependencies
        run: composer install --no-interaction --prefer-dist --optimize-autoloader

      - name: 📂 Preparar .env de teste
        run: |
          cp .env.example .env
          php artisan key:generate

      - name: 🗄️ Rodar migrate:fresh no MySQL
        env:
          DB_CONNECTION: mysql
          DB_HOST: 127.0.0.1
          DB_PORT: 3306
          DB_DATABASE: eaval_test
          DB_USERNAME: root
          DB_PASSWORD: secret
        run: php artisan migrate:fresh --env=testing --no-interaction

      - name: 🧪 Rodar testes PHP (MySQL)
        run: php artisan test --configuration phpunit.mysql.xml

  web-deploy:
    name: 🐧 Build and Deploy
    runs-on: ubuntu-latest
    needs: test-php-mysql
    steps:
      # ... (restante do job existente, sem alteração)
```

> **Importante:** No GitHub Actions, o MySQL service usa a porta 3306 (mapeamento direto), não 3307. O `phpunit.mysql.xml` usa 3307 (local). Por isso `migrate:fresh` recebe a porta via `env:` no step do CI, e os testes recebem as configurações via `phpunit.mysql.xml` que usa 3307. **Solução:** Para CI, substituir o `phpunit.mysql.xml` por uma variável de ambiente que sobrescreva a porta, OU criar um segundo xml para CI. A solução mais simples: usar uma variável `DB_PORT` no phpunit.mysql.xml com valor padrão 3307, e no CI setar `DB_PORT=3306` antes de rodar os testes.

**Atualização ao `phpunit.mysql.xml` para suportar porta configurável via env:**

Alterar a linha de DB_PORT:
```xml
<env name="DB_PORT" value="3307"/>
```
para — **não há forma nativa de ler env no phpunit.xml**. A solução mais simples é criar `phpunit.mysql.ci.xml` só para o CI com porta 3306, ou passar a porta via um wrapper.

**Solução adotada: wrapper no CI.** No step de testes do CI, usar:

```yaml
- name: 🧪 Rodar testes PHP (MySQL)
  env:
    DB_PORT: "3306"
  run: |
    # Sobrescrever porta no phpunit.mysql.xml dinamicamente
    sed 's/3307/3306/' phpunit.mysql.xml > phpunit.mysql.ci.xml
    php artisan test --configuration phpunit.mysql.ci.xml
    rm phpunit.mysql.ci.xml
```

Ou, ainda mais simples: usar dois arquivos xml diferentes. Ver Step 2.

- [ ] **Step 2: Criar `phpunit.mysql.ci.xml` (cópia do mysql com porta 3306)**

Idêntico ao `phpunit.mysql.xml`, mas com:
```xml
<env name="DB_PORT" value="3306"/>
```

Usar este arquivo no step de CI.

- [ ] **Step 3: Atualizar o step de testes no CI para usar `phpunit.mysql.ci.xml`**

```yaml
- name: 🧪 Rodar testes PHP (MySQL)
  run: php artisan test --configuration phpunit.mysql.ci.xml
```

- [ ] **Step 4: Verificar que `web-deploy` depende de `test-php-mysql`**

No job `web-deploy`, confirmar que existe `needs: test-php-mysql`. O deploy FTP não deve rodar se os testes MySQL falharem.

- [ ] **Step 5: Testar o workflow fazendo um push para `main`**

```bash
git push origin main
```

> **Aguardar autorização do usuário antes de fazer push.**

Monitorar em `https://github.com/<repo>/actions`. Expected: job `test-php-mysql` passa, depois `web-deploy` roda e faz o deploy.

- [ ] **Step 6: Commit (antes do push)**

```bash
git add .github/workflows/main.yml phpunit.mysql.ci.xml
git commit -m "ci: job MySQL antes do deploy — testes de compatibilidade de migrations"
```

---

## Self-Review

**Spec coverage:**
- [x] Container Docker MySQL para testes locais
- [x] `migrate:fresh` em cada run MySQL
- [x] Integração no `composer run test:all`
- [x] Prompt interativo quando Docker indisponível
- [x] Job MySQL no GitHub Actions antes do deploy FTP

**Placeholder scan:** Nenhum TBD ou placeholder encontrado.

**Consistência:** `phpunit.mysql.xml` usa porta 3307 (local); `phpunit.mysql.ci.xml` usa 3306 (CI). Script `bin/test-mysql.sh` expõe porta 3307. CI usa service MySQL na 3306. Consistente.

**Escopo:** Um plano único, implementável de uma vez. Tasks 1-4 são independentes do CI (Task 5). Pode implementar 1-4 e testar localmente antes de mexer no CI.
