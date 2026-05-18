#!/bin/bash
# Script khởi tạo hệ thống nrc-full - Setup từ đầu
# Sử dụng: ./scripts/init.sh [staging|production] [--cleanup] [--cleanup-all]
#
# Environments:
# - staging    → stg.s4vnrc.org (uses .env.staging)
# - production → s4vnrc.org (uses .env.production)
#
# Options:
# - --cleanup: Cleanup containers và networks trước khi deploy (giữ images và volumes)
# - --cleanup-all: Cleanup hoàn toàn trước khi deploy (xóa hết)
#
# Script này sẽ:
# - Build tất cả images (server, web, caddy)
# - Khởi động database (PostgreSQL)
# - Chạy migrations từ đầu
# - Deploy tất cả services

set -e

ENV=""
CLEANUP=false
CLEANUP_ALL=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --cleanup)
            CLEANUP=true
            ;;
        --cleanup-all)
            CLEANUP_ALL=true
            ;;
        staging|production)
            ENV="$arg"
            ;;
        --help|-h)
            echo "Usage: $0 [staging|production] [--cleanup] [--cleanup-all]"
            echo ""
            echo "Environments:"
            echo "  staging     Deploy to stg.s4vnrc.org"
            echo "  production  Deploy to s4vnrc.org"
            echo ""
            echo "Options:"
            echo "  --cleanup      Stop containers and prune networks before deploy"
            echo "  --cleanup-all  Full Docker cleanup before deploy (removes everything)"
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $arg"
            echo "Usage: $0 [staging|production] [--cleanup] [--cleanup-all]"
            exit 1
            ;;
    esac
done

# Validate environment
if [ -z "$ENV" ]; then
    echo "❌ Environment is required!"
    echo ""
    echo "Usage: $0 [staging|production] [--cleanup] [--cleanup-all]"
    echo ""
    echo "Environments:"
    echo "  staging     Deploy to stg.s4vnrc.org"
    echo "  production  Deploy to s4vnrc.org"
    exit 1
fi

# Set environment-specific variables
ENV_FILE=".env.$ENV"
COMPOSE_FILE="docker-compose.yml"

if [ "$ENV" = "staging" ]; then
    DOMAIN="stg.s4vnrc.org"
    PROJECT_NAME="nrc-full-staging"
else
    DOMAIN="s4vnrc.org"
    PROJECT_NAME="nrc-full-production"
fi

echo "🚀 Bắt đầu khởi tạo hệ thống $ENV"
echo "📁 Environment file: $ENV_FILE"
echo "📋 Compose file: $COMPOSE_FILE"
echo "🌐 Domain: $DOMAIN"
echo "📦 Project name: $PROJECT_NAME"
echo "ℹ️  Lưu ý: Đây là script khởi tạo hệ thống mới hoàn toàn"
echo "   Để release code mới, sử dụng: ./scripts/release.sh $ENV"

# Kiểm tra environment file
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Environment file không tồn tại: $ENV_FILE"
    echo "   Tạo file từ .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example "$ENV_FILE"
        echo "   ✅ Đã tạo $ENV_FILE"
        echo "   ⚠️  Vui lòng chỉnh sửa $ENV_FILE với giá trị phù hợp trước khi chạy lại"
        exit 1
    else
        echo "   ❌ Không tìm thấy .env.example"
        exit 1
    fi
fi

# Cleanup trước khi deploy nếu được yêu cầu
if [ "$CLEANUP_ALL" = true ]; then
    echo ""
    echo "🧹 Cleanup hoàn toàn Docker trước khi deploy..."
    # Chỉ cleanup containers của project này
    docker compose --env-file "$ENV_FILE" -p "$PROJECT_NAME" down --rmi all --volumes 2>/dev/null || true
    echo "   ✅ Cleanup hoàn tất"
elif [ "$CLEANUP" = true ]; then
    echo ""
    echo "🧹 Cleanup containers và networks trước khi deploy..."
    docker compose --env-file "$ENV_FILE" -p "$PROJECT_NAME" down 2>/dev/null || true
    echo "   ✅ Cleanup hoàn tất"
fi

# Kiểm tra Docker và Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker chưa được cài đặt!"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose chưa được cài đặt!"
    exit 1
fi

# Build Docker images
echo ""
echo "🔨 Building Docker images cho $ENV..."
export BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
export GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
export IMAGE_TAG="${IMAGE_TAG:-latest}"

docker compose --env-file "$ENV_FILE" -p "$PROJECT_NAME" build \
  --build-arg BUILD_DATE="$BUILD_DATE" \
  --build-arg GIT_COMMIT="$GIT_COMMIT"

# Khởi động database trước
echo ""
echo "🗄️  Starting PostgreSQL database..."
docker compose --env-file "$ENV_FILE" -p "$PROJECT_NAME" up -d db

# Đợi database sẵn sàng
echo "⏳ Waiting for database to be ready..."
sleep 5

# Kiểm tra database health
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker compose --env-file "$ENV_FILE" -p "$PROJECT_NAME" exec db pg_isready -U postgres >/dev/null 2>&1; then
        echo "   ✅ Database is ready!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo "   ❌ Database failed to start after $MAX_RETRIES attempts"
        echo "   Check logs: docker compose --env-file $ENV_FILE -p $PROJECT_NAME logs db"
        exit 1
    fi
    echo "   ⏳ Waiting... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

# Chạy migrations
echo ""
echo "🔄 Running database migrations..."
if [ -d "packages/db" ]; then
    # Load env vars for drizzle-kit
    set -a
    source "$ENV_FILE"
    set +a
    
    cd packages/db
    bun run drizzle-kit push 2>/dev/null || {
        echo "⚠️  Migrations completed with warnings (có thể do schema đã tồn tại)"
    }
    cd ../..
else
    echo "   ⚠️  packages/db không tồn tại, bỏ qua migrations"
fi

# Up tất cả services
echo ""
echo "🚀 Starting all services..."
docker compose --env-file "$ENV_FILE" -p "$PROJECT_NAME" up -d

# Cập nhật restart policy
echo ""
echo "🔄 Cập nhật restart policy..."
for container in $(docker ps --filter "name=$PROJECT_NAME" --format "{{.Names}}" 2>/dev/null); do
    docker update --restart unless-stopped "$container" >/dev/null 2>&1
done
echo "   ✅ Đã cập nhật restart policy cho tất cả containers"

# Clean up old images
echo ""
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ $(echo $ENV | tr '[:lower:]' '[:upper:]') INITIALIZATION COMPLETED!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Initialization Information:"
echo "   Environment: $(echo $ENV | tr '[:lower:]' '[:upper:]')"
echo "   Project:     $PROJECT_NAME"
echo "   Commit:      $GIT_COMMIT"
echo "   Time:        $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "   Build Date:  $BUILD_DATE"
echo "   Domain:      $DOMAIN"
echo ""
echo "📊 Service Status:"
docker compose --env-file "$ENV_FILE" -p "$PROJECT_NAME" ps

echo ""
echo "🌐 Health Check:"
WEB_OK=false
SERVER_OK=false

if curl -f -s "http://localhost:${WEB_PORT:-3000}" > /dev/null 2>&1; then
    echo "   ✅ Web: http://localhost:${WEB_PORT:-3000} - OK"
    WEB_OK=true
else
    echo "   ⚠️  Web: http://localhost:${WEB_PORT:-3000} - Not responding"
fi

if curl -f -s "http://localhost:${SERVER_PORT:-3001}/health" > /dev/null 2>&1; then
    echo "   ✅ Server: http://localhost:${SERVER_PORT:-3001} - OK"
    SERVER_OK=true
else
    echo "   ⚠️  Server: http://localhost:${SERVER_PORT:-3001} - Not responding"
fi

echo ""
echo "📝 Recent Logs (last 20 lines):"
docker compose --env-file "$ENV_FILE" -p "$PROJECT_NAME" logs --tail=20

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 $ENV initialization process completed!"
if [ "$WEB_OK" = true ] && [ "$SERVER_OK" = true ]; then
    echo "✅ All services are running correctly!"
    echo ""
    echo "🌐 Access:"
    echo "   Web:    https://$DOMAIN"
    echo "   API:    https://api.${DOMAIN#stg.}"
    echo ""
    echo "💡 Next steps:"
    echo "   - Để release code mới: ./scripts/release.sh $ENV"
    echo "   - Để setup systemd services: sudo ./scripts/setup-auto-restart.sh $ENV"
else
    echo "⚠️  Warning: Some services not responding. Check logs."
    echo "   docker compose --env-file $ENV_FILE -p $PROJECT_NAME logs -f"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
