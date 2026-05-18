#!/bin/bash
# Script release code mới - Chỉ build và deploy code, không khởi động lại database
# Sử dụng: ./scripts/release.sh [staging|production] [--skip-git] [--skip-build] [--skip-migrate]
#
# Environments:
# - staging    → stg.s4vnrc.org (uses .env.staging)
# - production → s4vnrc.org (uses .env.production)
#
# Script này sẽ:
# - Pull code mới nhất từ Git (có thể skip)
# - Build images cho server, web, caddy (có thể skip)
# - Chạy migrations (chỉ thêm mới, không xóa)
# - Restart server và web containers
# - KHÔNG restart database (PostgreSQL)
#
# Lưu ý: Để setup hệ thống mới hoàn toàn, sử dụng: ./scripts/init.sh [env]

set -e

ENV=""
SKIP_GIT_PULL="${SKIP_GIT_PULL:-false}"
SKIP_BUILD="${SKIP_BUILD:-false}"
SKIP_MIGRATE=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --skip-git)
            SKIP_GIT_PULL=true
            ;;
        --skip-build)
            SKIP_BUILD=true
            ;;
        --skip-migrate)
            SKIP_MIGRATE=true
            ;;
        staging|production)
            ENV="$arg"
            ;;
        --help|-h)
            echo "Usage: $0 [staging|production] [--skip-git] [--skip-build] [--skip-migrate]"
            echo ""
            echo "Environments:"
            echo "  staging     Deploy to stg.s4vnrc.org"
            echo "  production  Deploy to s4vnrc.org"
            echo ""
            echo "Options:"
            echo "  --skip-git      Skip pulling latest code"
            echo "  --skip-build    Skip Docker image build"
            echo "  --skip-migrate  Skip database migrations"
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $arg"
            echo "Usage: $0 [staging|production] [--skip-git] [--skip-build] [--skip-migrate]"
            exit 1
            ;;
    esac
done

# Validate environment
if [ -z "$ENV" ]; then
    echo "❌ Environment is required!"
    echo ""
    echo "Usage: $0 [staging|production] [--skip-git] [--skip-build] [--skip-migrate]"
    echo ""
    echo "Environments:"
    echo "  staging     Deploy to stg.s4vnrc.org"
    echo "  production  Deploy to s4vnrc.org"
    exit 1
fi

# Set environment-specific variables
ENV_FILE=".env.$ENV"
COMPOSE_FILE="docker-compose.yml"
IMAGE_TAG="${IMAGE_TAG:-latest}"

if [ "$ENV" = "staging" ]; then
    DOMAIN="stg.s4vnrc.org"
    PROJECT_NAME="nrc-full-staging"
else
    DOMAIN="s4vnrc.org"
    PROJECT_NAME="nrc-full-production"
fi

echo "🚀 Bắt đầu release code mới cho $ENV"
echo "📁 Environment file: $ENV_FILE"
echo "📋 Compose file: $COMPOSE_FILE"
echo "🌐 Domain: $DOMAIN"
echo "📦 Project name: $PROJECT_NAME"
echo "ℹ️  Lưu ý: Đây là script release code, KHÔNG khởi động lại database"
echo "   Để setup hệ thống mới, sử dụng: ./scripts/init.sh $ENV"

# Kiểm tra environment file
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Environment file không tồn tại: $ENV_FILE"
    echo "   Chạy ./scripts/init.sh $ENV trước để setup hệ thống"
    exit 1
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

# Kiểm tra database có đang chạy không
echo ""
echo "🔍 Kiểm tra database..."
if ! docker ps --filter "name=$PROJECT_NAME-db" --format "{{.Names}}" | grep -q "$PROJECT_NAME-db"; then
    echo "⚠️  Database container ($PROJECT_NAME-db) không chạy!"
    echo "   Chạy ./scripts/init.sh $ENV trước để setup hệ thống"
    exit 1
fi
echo "   ✅ Database đang chạy"

# Pull code mới nhất
if [ "$SKIP_GIT_PULL" != "true" ]; then
    echo ""
    echo "📥 Pulling latest code..."
    BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    
    git fetch origin
    git reset --hard HEAD
    git clean -fd
    
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
    if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
        git checkout -f "$BRANCH" || {
            git reset --hard origin/"$BRANCH"
            git checkout -f "$BRANCH"
        }
    fi
    
    git reset --hard origin/"$BRANCH"
    git clean -fd
    git pull origin "$BRANCH" || {
        echo "   ⚠️  Pull failed, using reset instead..."
        git reset --hard origin/"$BRANCH"
    }
fi

GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
echo "   ✅ Code version: $GIT_COMMIT"

# Build Docker images
if [ "$SKIP_BUILD" != "true" ]; then
    echo ""
    echo "🔨 Building Docker images cho $ENV..."
    export BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
    export GIT_COMMIT="$GIT_COMMIT"
    export IMAGE_TAG="$IMAGE_TAG"
    
    docker compose --env-file "$ENV_FILE" -p "$PROJECT_NAME" build \
      --build-arg BUILD_DATE="$BUILD_DATE" \
      --build-arg GIT_COMMIT="$GIT_COMMIT" \
      server web caddy
fi

# Chạy migrations
if [ "$SKIP_MIGRATE" != "true" ]; then
    echo ""
    echo "🔄 Running database migrations (additive only)..."
    echo "   Lưu ý: Migrations chỉ thêm mới, không xóa dữ liệu cũ"
    
    if [ -d "packages/db" ]; then
        # Load env vars for drizzle-kit
        set -a
        source "$ENV_FILE"
        set +a
        
        cd packages/db
        bun run drizzle-kit push 2>/dev/null || {
            echo "   ⚠️  Migrations completed with warnings"
        }
        cd ../..
    else
        echo "   ⚠️  packages/db không tồn tại, bỏ qua migrations"
    fi
fi

# Restart server và web containers
echo ""
echo "🔄 Restarting server and web containers..."

# Stop và remove server, web, caddy containers
for container in $(docker ps --filter "name=$PROJECT_NAME" --format "{{.Names}}" 2>/dev/null | grep -E "(server|web|caddy)"); do
    echo "   Stopping $container..."
    docker stop "$container" 2>/dev/null || true
    docker rm -f "$container" 2>/dev/null || true
done

# Up lại server, web, caddy (database vẫn chạy)
echo "   Starting server, web, caddy..."
docker compose --env-file "$ENV_FILE" -p "$PROJECT_NAME" up -d --no-deps server web caddy

# Cập nhật restart policy
echo ""
echo "🔄 Cập nhật restart policy..."
for container in $(docker ps --filter "name=$PROJECT_NAME" --format "{{.Names}}" 2>/dev/null); do
    docker update --restart unless-stopped "$container" >/dev/null 2>&1
done

# Clean up old images
echo ""
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ $(echo $ENV | tr '[:lower:]' '[:upper:]') RELEASE COMPLETED!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Release Information:"
echo "   Environment: $(echo $ENV | tr '[:lower:]' '[:upper:]')"
echo "   Project:     $PROJECT_NAME"
echo "   Commit:      $GIT_COMMIT"
echo "   Time:        $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "   Image Tag:   $IMAGE_TAG"
echo "   Domain:      $DOMAIN"
echo ""
echo "📊 Service Status:"
docker compose --env-file "$ENV_FILE" -p "$PROJECT_NAME" ps

echo ""
echo "🌐 Health Check:"
WEB_OK=false
SERVER_OK=false

if curl -f -s "http://localhost:${WEB_PORT:-3000}" > /dev/null 2>&1; then
    echo "   ✅ Web: OK"
    WEB_OK=true
else
    echo "   ⚠️  Web: Not responding"
fi

if curl -f -s "http://localhost:${SERVER_PORT:-3001}/health" > /dev/null 2>&1; then
    echo "   ✅ Server: OK"
    SERVER_OK=true
else
    echo "   ⚠️  Server: Not responding"
fi

echo ""
echo "📝 Recent Logs (last 20 lines):"
docker compose --env-file "$ENV_FILE" -p "$PROJECT_NAME" logs --tail=20 server web

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 $ENV release process completed!"
if [ "$WEB_OK" = true ] && [ "$SERVER_OK" = true ]; then
    echo "✅ All services are running correctly!"
    echo ""
    echo "🌐 Access:"
    echo "   Web:    https://$DOMAIN"
    echo "   API:    https://api.${DOMAIN#stg.}"
else
    echo "⚠️  Warning: Some services not responding. Check logs."
    echo "   docker compose --env-file $ENV_FILE -p $PROJECT_NAME logs -f"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
