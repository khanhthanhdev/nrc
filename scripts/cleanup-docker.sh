#!/bin/bash
# Script cleanup Docker - Xóa tất cả containers, images, volumes, networks
# Sử dụng: ./scripts/cleanup-docker.sh [--keep-images] [--keep-volumes]

set -e

KEEP_IMAGES=false
KEEP_VOLUMES=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --keep-images)
            KEEP_IMAGES=true
            shift
            ;;
        --keep-volumes)
            KEEP_VOLUMES=true
            shift
            ;;
        *)
            echo "❌ Unknown option: $1"
            echo "Usage: $0 [--keep-images] [--keep-volumes]"
            exit 1
            ;;
    esac
done

echo "🧹 Bắt đầu cleanup Docker..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Dừng tất cả containers đang chạy
echo ""
echo "1️⃣  Dừng tất cả containers đang chạy..."
if [ "$(docker ps -q)" ]; then
    docker stop $(docker ps -q)
    echo "   ✅ Đã dừng tất cả containers"
else
    echo "   ℹ️  Không có container nào đang chạy"
fi

# 2. Xóa tất cả containers (kể cả stopped)
echo ""
echo "2️⃣  Xóa tất cả containers..."
if [ "$(docker ps -aq)" ]; then
    docker rm -f $(docker ps -aq)
    echo "   ✅ Đã xóa tất cả containers"
else
    echo "   ℹ️  Không có container nào để xóa"
fi

# 3. Xóa tất cả images (nếu không giữ lại)
echo ""
if [ "$KEEP_IMAGES" = true ]; then
    echo "3️⃣  Bỏ qua xóa images (--keep-images được set)"
else
    echo "3️⃣  Xóa tất cả images..."
    if [ "$(docker images -q)" ]; then
        docker rmi -f $(docker images -q) 2>/dev/null || echo "   ⚠️  Một số images không thể xóa (có thể đang được sử dụng)"
        echo "   ✅ Đã xóa tất cả images có thể xóa"
    else
        echo "   ℹ️  Không có image nào để xóa"
    fi
fi

# 4. Xóa tất cả volumes (nếu không giữ lại)
echo ""
if [ "$KEEP_VOLUMES" = true ]; then
    echo "4️⃣  Bỏ qua xóa volumes (--keep-volumes được set)"
    echo "   ⚠️  Lưu ý: Database data sẽ được giữ lại"
else
    echo "4️⃣  Xóa tất cả volumes..."
    if [ "$(docker volume ls -q)" ]; then
        docker volume rm $(docker volume ls -q) 2>/dev/null || echo "   ⚠️  Một số volumes không thể xóa (có thể đang được sử dụng)"
        echo "   ✅ Đã xóa tất cả volumes có thể xóa"
    else
        echo "   ℹ️  Không có volume nào để xóa"
    fi
fi

# 5. Xóa tất cả networks (trừ default networks)
echo ""
echo "5️⃣  Xóa tất cả custom networks..."
CUSTOM_NETWORKS=$(docker network ls -q --filter type=custom)
if [ "$CUSTOM_NETWORKS" ]; then
    docker network rm $CUSTOM_NETWORKS 2>/dev/null || echo "   ⚠️  Một số networks không thể xóa (có thể đang được sử dụng)"
    echo "   ✅ Đã xóa tất cả custom networks có thể xóa"
else
    echo "   ℹ️  Không có custom network nào để xóa"
fi

# 6. Xóa build cache (optional - có thể tốn thời gian)
echo ""
echo "6️⃣  Xóa Docker build cache..."
docker builder prune -af 2>/dev/null || docker buildx prune -af 2>/dev/null || echo "   ⚠️  Không thể xóa build cache (có thể không có buildx)"
echo "   ✅ Đã xóa build cache"

# 7. Xóa tất cả unused resources
echo ""
echo "7️⃣  Dọn dẹp tất cả unused resources..."
docker system prune -af --volumes
echo "   ✅ Đã dọn dẹp unused resources"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ CLEANUP HOÀN TẤT!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Docker Status:"
echo "   Containers: $(docker ps -aq | wc -l) (stopped)"
echo "   Images:     $(docker images -q | wc -l)"
echo "   Volumes:    $(docker volume ls -q | wc -l)"
echo "   Networks:   $(docker network ls -q | wc -l)"
echo ""

