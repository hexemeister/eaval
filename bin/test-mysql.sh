#!/usr/bin/env bash
set -euo pipefail

# Verifica se Docker está disponível e rodando
if ! docker info > /dev/null 2>&1; then
    echo ""
    echo "⚠️  Docker não está disponível."
    echo "   1) Pular testes MySQL e continuar"
    echo "   2) Aguardar e tentar novamente"
    echo "   3) Cancelar"
    read -r -p "   Escolha [1/2/3]: " choice
    case "$choice" in
        1)
            echo "   Pulando testes MySQL."
            exit 0
            ;;
        2)
            echo "   Inicie o Docker e pressione Enter para tentar novamente..."
            read -r
            exec "$0" "$@"
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
