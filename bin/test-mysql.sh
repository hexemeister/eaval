#!/usr/bin/env bash
set -euo pipefail

# Uso:
#   bash bin/test-mysql.sh                  # banco limpo (migrate:fresh) + testes
#   bash bin/test-mysql.sh caminho/dump.sql # carrega dump + migrate + testes

DUMP_FILE="${1:-}"
COMPOSE_FILE="docker-compose.mysql.yml"

# Resolve o PHP — necessário porque o Git Bash no Windows tem PATH diferente do PowerShell
PHP_BIN="$(which php 2>/dev/null || which php.exe 2>/dev/null || echo '')"
if [[ -z "$PHP_BIN" ]]; then
    echo ""
    echo "❌ PHP não encontrado no PATH do bash."
    echo "   Certifique-se de que o PHP está instalado e acessível."
    exit 1
fi

artisan() {
    DB_CONNECTION=mysql \
    DB_HOST=127.0.0.1 \
    DB_PORT=3307 \
    DB_DATABASE=eaval_test \
    DB_USERNAME=root \
    DB_PASSWORD=secret \
    "$PHP_BIN" artisan "$@"
}

# Verifica se Docker está disponível e rodando
if ! docker info > /dev/null 2>&1; then
    echo ""
    echo "⚠️  Docker não está disponível."
    echo "   1) Pular testes MySQL e continuar"
    echo "   2) Aguardar e tentar novamente"
    echo "   3) Cancelar"
    read -r -p "   Escolha [1/2/3]: " choice
    case "$choice" in
        1) echo "   Pulando testes MySQL."; exit 0 ;;
        2) echo "   Inicie o Docker e pressione Enter..."; read -r; exec "$0" "$@" ;;
        *) echo "   Cancelado."; exit 1 ;;
    esac
fi

# Captura o código de saída real antes do cleanup mascarar
SCRIPT_EXIT=0
cleanup() {
    local exit_code=$?
    echo ""
    echo "🛑 Parando container MySQL..."
    docker compose -f "$COMPOSE_FILE" down --remove-orphans > /dev/null 2>&1
    if [[ $exit_code -ne 0 && $exit_code -ne 130 ]]; then
        echo ""
        echo "❌ Script encerrado com erro (código $exit_code)."
    fi
}
trap cleanup EXIT

echo ""
echo "🐳 Subindo container MySQL (porta 3307)..."
if ! docker compose -f "$COMPOSE_FILE" up -d --wait 2>&1; then
    echo ""
    echo "❌ Container MySQL não ficou saudável. Logs do container:"
    docker compose -f "$COMPOSE_FILE" logs mysql-test 2>&1 | tail -20
    exit 1
fi
echo "   Container pronto."

if [[ -n "$DUMP_FILE" ]]; then
    if [[ ! -f "$DUMP_FILE" ]]; then
        echo ""
        echo "❌ Arquivo de dump não encontrado: $DUMP_FILE"
        exit 1
    fi
    echo ""
    echo "📥 Carregando dump: $DUMP_FILE ..."
    docker exec -i eaval-mysql-test-1 \
        mysql -h 127.0.0.1 -uroot -psecret --force eaval_test < "$DUMP_FILE"

    echo ""
    echo "🗄️  Rodando migrate (incremento sobre o dump)..."
    artisan migrate --env=testing --no-interaction --force
else
    echo ""
    echo "🗄️  Rodando migrate:fresh no MySQL de testes..."
    artisan migrate:fresh --env=testing --no-interaction
fi

echo ""
echo "🧪 Rodando testes PHP contra MySQL..."
"$PHP_BIN" vendor/bin/pest --configuration phpunit.mysql.xml

echo ""
echo "✅ Testes MySQL concluídos."
