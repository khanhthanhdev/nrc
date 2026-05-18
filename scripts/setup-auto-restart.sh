#!/bin/bash
# Script để cấu hình containers tự động restart khi server/docker restart
# Sử dụng: ./scripts/setup-auto-restart.sh [staging|production|all] [--systemd]
#
# Environments:
# - staging    → nrc-full-staging containers
# - production → nrc-full-production containers
# - all        → Both environments
#
# Options:
# - --systemd: Tạo systemd service để tự động start containers khi server boot

set -e

ENV="all"
CREATE_SYSTEMD=false
PROJECT_PATH="$(pwd)"

# Parse arguments
for arg in "$@"; do
    case $arg in
        --systemd)
            CREATE_SYSTEMD=true
            ;;
        staging|production|all)
            ENV="$arg"
            ;;
        --help|-h)
            echo "Usage: $0 [staging|production|all] [--systemd]"
            echo ""
            echo "Environments:"
            echo "  staging     Configure staging containers only"
            echo "  production  Configure production containers only"
            echo "  all         Configure all containers (default)"
            echo ""
            echo "Options:"
            echo "  --systemd   Create systemd service for auto-start on boot"
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $arg"
            echo "Usage: $0 [staging|production|all] [--systemd]"
            exit 1
            ;;
    esac
done

echo "🚀 Cấu hình Auto-Restart cho Docker Containers"
echo "📁 Project path: $PROJECT_PATH"
echo "🎯 Environment: $ENV"
echo ""

# Function để cập nhật restart policy cho containers
update_restart_policy() {
    local env_filter=$1
    local env_name=$2
    
    echo "🔄 Cập nhật restart policy cho $env_name containers..."
    
    local containers
    if [ "$env_filter" = "all" ]; then
        containers=$(docker ps -a --format "{{.Names}}" | grep "nrc-full" || true)
    else
        containers=$(docker ps -a --format "{{.Names}}" | grep "nrc-full-$env_filter" || true)
    fi
    
    if [ -z "$containers" ]; then
        echo "   ℹ️  Không tìm thấy containers nào cho $env_name"
        return
    fi
    
    local count=0
    local success=0
    
    for container in $containers; do
        echo -n "   📦 Cập nhật $container... "
        if docker update --restart unless-stopped "$container" >/dev/null 2>&1; then
            echo "✅"
            success=$((success + 1))
        else
            echo "❌ (có thể container đã dừng)"
        fi
        count=$((count + 1))
    done
    
    echo ""
    echo "   ✅ Đã cập nhật restart policy cho $success/$count containers của $env_name"
}

# Function để tạo systemd service cho docker-compose
create_systemd_service() {
    local env=$1
    local env_name=$2
    local service_name="nrc-full-${env}.service"
    local service_file="/etc/systemd/system/$service_name"
    local env_file=".env.$env"
    local project_name="nrc-full-$env"
    
    echo "📝 Tạo systemd service cho $env_name..."
    
    # Kiểm tra quyền root
    if [ "$EUID" -ne 0 ]; then
        echo "   ⚠️  Cần quyền root để tạo systemd service"
        echo "   💡 Chạy lại với sudo: sudo ./scripts/setup-auto-restart.sh $env --systemd"
        return 1
    fi
    
    # Kiểm tra env file
    if [ ! -f "$PROJECT_PATH/$env_file" ]; then
        echo "   ❌ Không tìm thấy $env_file"
        return 1
    fi
    
    # Tạo service file
    cat > "$service_file" << EOF
[Unit]
Description=nrc-full $env_name Docker Compose Services
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$PROJECT_PATH
ExecStart=/usr/bin/docker compose --env-file $PROJECT_PATH/$env_file -p $project_name up -d
ExecStop=/usr/bin/docker compose --env-file $PROJECT_PATH/$env_file -p $project_name down
TimeoutStartSec=0
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    echo "   ✅ Đã tạo service file: $service_file"
    
    # Reload systemd và enable service
    systemctl daemon-reload
    systemctl enable "$service_name"
    
    echo "   ✅ Đã enable service: $service_name"
    echo "   💡 Để start service: sudo systemctl start $service_name"
    echo "   💡 Để check status: sudo systemctl status $service_name"
}

# Function để kiểm tra và cấu hình Docker daemon
configure_docker_daemon() {
    echo "🔍 Kiểm tra Docker daemon configuration..."
    
    if systemctl is-enabled docker >/dev/null 2>&1; then
        echo "   ✅ Docker service đã được enable để tự động start khi boot"
    else
        echo "   ⚠️  Docker service chưa được enable"
        if [ "$EUID" -eq 0 ]; then
            echo "   🔧 Đang enable Docker service..."
            systemctl enable docker
            echo "   ✅ Đã enable Docker service"
        else
            echo "   💡 Chạy với sudo để enable: sudo systemctl enable docker"
        fi
    fi
    
    if [ -f "/etc/docker/daemon.json" ]; then
        echo "   ✅ Docker daemon config file tồn tại"
    else
        echo "   ℹ️  Docker daemon config file không tồn tại (sử dụng defaults)"
    fi
}

# Main logic
case "$ENV" in
    staging)
        echo "🎯 Cấu hình cho Staging environment"
        update_restart_policy "staging" "Staging"
        configure_docker_daemon
        
        if [ "$CREATE_SYSTEMD" = true ]; then
            create_systemd_service "staging" "Staging"
        fi
        ;;
    
    production)
        echo "🎯 Cấu hình cho Production environment"
        update_restart_policy "production" "Production"
        configure_docker_daemon
        
        if [ "$CREATE_SYSTEMD" = true ]; then
            create_systemd_service "production" "Production"
        fi
        ;;
    
    all)
        echo "🎯 Cấu hình cho tất cả environments"
        update_restart_policy "staging" "Staging"
        update_restart_policy "production" "Production"
        configure_docker_daemon
        
        if [ "$CREATE_SYSTEMD" = true ]; then
            echo ""
            echo "📝 Tạo systemd services cho cả 2 environments..."
            create_systemd_service "staging" "Staging"
            create_systemd_service "production" "Production"
        fi
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Cấu hình Auto-Restart hoàn tất!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Tóm tắt:"
echo "   1. ✅ Đã cập nhật restart policy cho containers (unless-stopped)"
echo "   2. ✅ Đã kiểm tra Docker daemon configuration"
if [ "$CREATE_SYSTEMD" = true ]; then
    echo "   3. ✅ Đã tạo và enable systemd services"
    echo ""
    echo "📝 Systemd Services:"
    case "$ENV" in
        staging)
            echo "   - nrc-full-staging.service"
            ;;
        production)
            echo "   - nrc-full-production.service"
            ;;
        all)
            echo "   - nrc-full-staging.service"
            echo "   - nrc-full-production.service"
            ;;
    esac
fi
echo ""
echo "🔄 Containers sẽ tự động start khi:"
echo "   - Server restart"
echo "   - Docker daemon restart"
echo "   - Container bị crash (trừ khi bị stop thủ công)"
echo ""
echo "📝 Để test:"
echo "   sudo systemctl restart docker  # Restart Docker daemon"
echo "   docker ps  # Kiểm tra containers đã start lại chưa"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
