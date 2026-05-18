#!/bin/bash
# Script để setup SSH tunnel cho Portainer
# Sử dụng: ./scripts/portainer-tunnel.sh [start|stop|status] [--host SSH_HOST] [--key SSH_KEY]

SSH_KEY="${SSH_KEY:-~/.ssh/steam4VN-key.pem}"
SSH_HOST="${SSH_HOST:-ec2-user@13.214.214.215}"
LOCAL_PORT="${LOCAL_PORT:-9000}"
REMOTE_PORT="${REMOTE_PORT:-9000}"

ACTION=${1:-start}

# Parse arguments
shift
while [[ $# -gt 0 ]]; do
    case $1 in
        --host)
            SSH_HOST="$2"
            shift 2
            ;;
        --key)
            SSH_KEY="$2"
            shift 2
            ;;
        --local-port)
            LOCAL_PORT="$2"
            shift 2
            ;;
        --remote-port)
            REMOTE_PORT="$2"
            shift 2
            ;;
        *)
            echo "❌ Unknown option: $1"
            exit 1
            ;;
    esac
done

# Function to check if port is listening
check_port_listening() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1
        return $?
    fi
    if command -v netstat >/dev/null 2>&1; then
        netstat -ano 2>/dev/null | grep -q ":$port.*LISTENING" || \
        netstat -an 2>/dev/null | grep -q ":$port.*LISTEN"
        return $?
    fi
    return 1
}

# Function to get PID from port
get_pid_from_port() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        lsof -ti :$port 2>/dev/null
        return
    fi
    if command -v netstat >/dev/null 2>&1; then
        netstat -ano 2>/dev/null | grep ":$port.*LISTENING" | awk '{print $NF}' | head -1
        return
    fi
}

case "$ACTION" in
    start)
        echo "=== STARTING PORTAINER SSH TUNNEL ==="
        echo ""
        echo "📋 Configuration:"
        echo "   SSH Host: $SSH_HOST"
        echo "   SSH Key:  $SSH_KEY"
        echo "   Tunnel:   localhost:$LOCAL_PORT -> $SSH_HOST:$REMOTE_PORT"
        echo ""

        # Kiểm tra xem tunnel đã chạy chưa
        if check_port_listening $LOCAL_PORT; then
            echo "⚠️  Port $LOCAL_PORT đã được sử dụng"
            echo "   Đang dừng tunnel cũ..."
            PID=$(get_pid_from_port $LOCAL_PORT)
            if [ -n "$PID" ]; then
                kill $PID 2>/dev/null || true
                sleep 2
            fi
        fi

        echo "🚀 Starting Portainer SSH tunnel..."
        echo ""

        # Start tunnel ở background
        ssh -i "$SSH_KEY" \
            -f -N -L $LOCAL_PORT:localhost:$REMOTE_PORT \
            -o ServerAliveInterval=60 \
            -o ServerAliveCountMax=3 \
            -o ExitOnForwardFailure=yes \
            -o StrictHostKeyChecking=no \
            "$SSH_HOST" 2>&1

        if [ $? -eq 0 ]; then
            echo "✅ Portainer tunnel started successfully!"
            echo ""
            echo "📋 Connection:"
            echo "   Local:  http://localhost:$LOCAL_PORT"
            echo "   Remote: $SSH_HOST:$REMOTE_PORT"
            echo ""
            echo "🌐 Access Portainer at: http://localhost:$LOCAL_PORT"
            echo ""
            echo "💡 To stop tunnel: ./scripts/portainer-tunnel.sh stop"
        else
            echo "❌ Failed to start Portainer tunnel!"
            echo "   Please check:"
            echo "   1. SSH key file exists: $SSH_KEY"
            echo "   2. SSH connection works: ssh -i \"$SSH_KEY\" $SSH_HOST"
            exit 1
        fi
        ;;

    stop)
        echo "=== STOPPING PORTAINER SSH TUNNEL ==="
        echo ""

        # Tìm và kill tất cả processes trên port
        PIDS=$(get_pid_from_port $LOCAL_PORT)
        if [ -n "$PIDS" ]; then
            for PID in $PIDS; do
                echo "   Killing process PID: $PID"
                kill -9 $PID 2>/dev/null || true
            done
            echo "✅ Portainer tunnel stopped"
        else
            echo "ℹ️  No tunnel running on port $LOCAL_PORT"
        fi

        # Kill tất cả SSH processes có chứa port forwarding
        echo "   Cleaning up SSH processes..."
        if command -v pkill >/dev/null 2>&1; then
            pkill -9 -f "ssh.*-L.*$LOCAL_PORT.*$SSH_HOST" 2>/dev/null || true
            pkill -9 -f "ssh.*-L.*$LOCAL_PORT:localhost" 2>/dev/null || true
        fi

        # Verify port is free
        sleep 1
        if check_port_listening $LOCAL_PORT; then
            echo "   ⚠️  Port $LOCAL_PORT is still in use, force killing..."
            REMAINING_PIDS=$(get_pid_from_port $LOCAL_PORT)
            for PID in $REMAINING_PIDS; do
                kill -9 $PID 2>/dev/null || true
            done
        fi

        echo ""
        echo "✅ Portainer tunnel stopped!"
        ;;

    status)
        echo "=== PORTAINER SSH TUNNEL STATUS ==="
        echo ""

        PID=$(get_pid_from_port $LOCAL_PORT)
        if [ -n "$PID" ]; then
            echo "✅ Portainer tunnel: RUNNING"
            echo "   PID: $PID"
            echo "   Port: $LOCAL_PORT"
            echo "   Remote: $SSH_HOST:$REMOTE_PORT"
            echo ""
            echo "📋 Test connection:"
            echo "   curl http://localhost:$LOCAL_PORT"
            echo ""
            echo "🌐 Access: http://localhost:$LOCAL_PORT"
        else
            echo "❌ Portainer tunnel: NOT RUNNING"
            echo "   Port: $LOCAL_PORT"
            echo ""
            echo "💡 To start: ./scripts/portainer-tunnel.sh start"
        fi
        ;;

    *)
        echo "Usage: $0 [start|stop|status] [--host SSH_HOST] [--key SSH_KEY]"
        echo ""
        echo "Commands:"
        echo "  start  - Start SSH tunnel for Portainer"
        echo "  stop   - Stop SSH tunnel"
        echo "  status - Check tunnel status"
        echo ""
        echo "Options:"
        echo "  --host SSH_HOST      SSH host (default: ec2-user@13.214.214.215)"
        echo "  --key SSH_KEY        SSH key file (default: ~/.ssh/steam4VN-key.pem)"
        echo "  --local-port PORT    Local port (default: 9000)"
        echo "  --remote-port PORT   Remote port (default: 9000)"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 start --host ec2-user@myserver.com"
        echo "  $0 stop"
        echo "  $0 status"
        exit 1
        ;;
esac
