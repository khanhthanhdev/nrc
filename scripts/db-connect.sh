#!/bin/bash
# Script helper để chạy drizzle-kit commands
# Usage: ./scripts/db-connect.sh [introspect|studio|push|generate|migrate|kill-studio] [port]
#
# Lưu ý: Cần DATABASE_URL trong .env hoặc environment

COMMAND=${1:-studio}
PORT=${2:-4983}

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
    (timeout 1 bash -c "echo >/dev/tcp/localhost/$port" 2>/dev/null) && return 0 || return 1
}

# Function to kill process on port
kill_port_process() {
    local port=$1
    local killed=0
    
    if command -v lsof >/dev/null 2>&1; then
        local pids=$(lsof -ti :$port 2>/dev/null)
        if [ -n "$pids" ]; then
            for pid in $pids; do
                echo "   🔪 Killing process PID: $pid (port $port)"
                kill -9 $pid 2>/dev/null && killed=$((killed + 1)) || true
            done
        fi
    elif command -v netstat >/dev/null 2>&1; then
        local pids=$(netstat -ano 2>/dev/null | grep ":$port" | grep "LISTENING" | awk '{print $NF}' | sort -u | grep -v "^0$" | grep -v "^$")
        if [ -n "$pids" ]; then
            for pid in $pids; do
                if [ -n "$pid" ] && [ "$pid" != "0" ] && [ "$pid" != "" ]; then
                    echo "   🔪 Killing process PID: $pid (port $port)"
                    if command -v taskkill >/dev/null 2>&1; then
                        taskkill //F //PID $pid >/dev/null 2>&1 && killed=$((killed + 1)) || true
                    else
                        kill -9 $pid 2>/dev/null && killed=$((killed + 1)) || true
                    fi
                fi
            done
        fi
    fi
    
    if command -v pkill >/dev/null 2>&1; then
        pkill -f "drizzle-kit.*studio" 2>/dev/null && killed=$((killed + 1)) || true
        pkill -f "bun.*drizzle.*studio" 2>/dev/null && killed=$((killed + 1)) || true
    fi
    
    if [ $killed -gt 0 ]; then
        echo "   ✅ Đã kill $killed process(es)"
        sleep 1
    fi
    
    return $killed
}

# Kiểm tra có ở đúng thư mục không
if [ ! -d "packages/db" ]; then
    echo "❌ Không tìm thấy packages/db"
    echo "   Hãy chạy script từ thư mục gốc của project"
    exit 1
fi

cd packages/db || exit 1

echo "=== Running DrizzleKit Command ==="
echo "   Command: $COMMAND"
echo ""

case "$COMMAND" in
    introspect)
        bunx drizzle-kit introspect
        ;;
    studio)
        # Kill process cũ trên port trước khi start
        if check_port_listening $PORT; then
            echo "⚠️  Port $PORT đang được sử dụng, đang kill process cũ..."
            kill_port_process $PORT
        fi
        
        echo "🧹 Cleaning up old Drizzle Studio processes..."
        kill_port_process $PORT
        
        echo "🚀 Starting Drizzle Studio on port $PORT..."
        bunx drizzle-kit studio --port "$PORT"
        ;;
    push)
        bunx drizzle-kit push
        ;;
    generate)
        bunx drizzle-kit generate
        ;;
    migrate)
        bunx drizzle-kit migrate
        ;;
    kill-studio)
        echo "🔪 Killing Drizzle Studio on port $PORT..."
        kill_port_process $PORT
        echo "✅ Done!"
        ;;
    *)
        echo "❌ Unknown command: $COMMAND"
        echo "   Available commands: introspect, studio, push, generate, migrate, kill-studio"
        exit 1
        ;;
esac
