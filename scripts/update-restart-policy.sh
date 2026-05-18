#!/bin/bash
# Script đơn giản để cập nhật restart policy cho containers hiện tại
# Sử dụng: ./scripts/update-restart-policy.sh [staging|production|all]
#
# Environments:
# - staging    → nrc-full-staging containers
# - production → nrc-full-production containers
# - all        → All nrc-full containers (default)

set -e

ENV=${1:-all}

echo "🔄 Cập nhật Restart Policy cho Docker Containers"
echo ""

# Function để cập nhật restart policy
update_containers() {
    local filter=$1
    local env_name=$2
    
    echo "📦 Tìm containers cho $env_name..."
    
    local containers
    case "$filter" in
        staging)
            containers=$(docker ps -a --format "{{.Names}}" | grep "nrc-full-staging" || true)
            ;;
        production)
            containers=$(docker ps -a --format "{{.Names}}" | grep "nrc-full-production" || true)
            ;;
        all)
            containers=$(docker ps -a --format "{{.Names}}" | grep "nrc-full" || true)
            ;;
    esac
    
    if [ -z "$containers" ]; then
        echo "   ℹ️  Không tìm thấy containers nào cho $env_name"
        return
    fi
    
    echo "   Tìm thấy containers:"
    echo "$containers" | sed 's/^/      - /'
    echo ""
    
    local count=0
    local success=0
    local failed=0
    
    for container in $containers; do
        echo -n "   📦 Cập nhật $container... "
        if docker update --restart unless-stopped "$container" >/dev/null 2>&1; then
            echo "✅"
            success=$((success + 1))
        else
            echo "❌ (có thể container đã dừng hoặc không tồn tại)"
            failed=$((failed + 1))
        fi
        count=$((count + 1))
    done
    
    echo ""
    echo "   ✅ Thành công: $success/$count containers"
    if [ "$failed" -gt 0 ]; then
        echo "   ⚠️  Thất bại: $failed containers"
    fi
}

# Main logic
case "$ENV" in
    staging)
        echo "🎯 Cập nhật cho Staging containers"
        update_containers "staging" "Staging"
        ;;
    
    production)
        echo "🎯 Cập nhật cho Production containers"
        update_containers "production" "Production"
        ;;
    
    all)
        echo "🎯 Cập nhật cho tất cả containers"
        update_containers "all" "All"
        ;;
    
    *)
        echo "❌ Environment không hợp lệ: $ENV"
        echo "   Usage: $0 [staging|production|all]"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Hoàn tất!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Restart Policy đã được cập nhật thành: unless-stopped"
echo ""
echo "🔄 Containers sẽ tự động start khi:"
echo "   - Docker daemon restart"
echo "   - Container bị crash"
echo "   - Server restart (nếu Docker service được enable)"
echo ""
echo "⚠️  Lưu ý: Để đảm bảo containers start khi server boot, cần:"
echo "   1. Enable Docker service: sudo systemctl enable docker"
echo "   2. (Tùy chọn) Tạo systemd service: sudo ./scripts/setup-auto-restart.sh [env] --systemd"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
