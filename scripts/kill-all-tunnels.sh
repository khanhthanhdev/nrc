#!/bin/bash
# Script để force kill tất cả SSH tunnels
# Sử dụng khi tunnels không tắt được bằng lệnh stop thông thường

echo "=== FORCE KILLING ALL SSH TUNNELS ==="
echo ""

SSH_HOST="${SSH_HOST:-ec2-user@54.255.37.156}"

# Danh sách ports cần kill
PORTS=(5432 9000)

KILLED_COUNT=0

# Function to get PID from port (cross-platform)
get_pid_from_port() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        lsof -ti :$port 2>/dev/null
        return
    fi
    if command -v netstat >/dev/null 2>&1; then
        netstat -ano 2>/dev/null | grep ":$port.*LISTENING" | awk '{print $NF}' | sort -u | grep -v "^0$" | grep -v "^$"
        return
    fi
}

# Kill processes trên các ports
for PORT in "${PORTS[@]}"; do
    echo "Killing processes on port $PORT..."
    
    PIDS=$(get_pid_from_port $PORT)
    if [ -n "$PIDS" ]; then
        for PID in $PIDS; do
            echo "   Killing PID: $PID"
            kill -9 $PID 2>/dev/null || true
            KILLED_COUNT=$((KILLED_COUNT + 1))
        done
    fi
done

# Kill tất cả SSH processes có chứa port forwarding
echo ""
echo "Killing all SSH processes with port forwarding..."

if command -v pkill >/dev/null 2>&1; then
    pkill -9 -f "ssh.*-L.*$SSH_HOST" 2>/dev/null && KILLED_COUNT=$((KILLED_COUNT + 1)) || true
    pkill -9 -f "ssh.*-L" 2>/dev/null && KILLED_COUNT=$((KILLED_COUNT + 1)) || true
elif command -v ps >/dev/null 2>&1; then
    SSH_PIDS=$(ps aux | grep "ssh.*-L" | grep -v grep | awk '{print $2}')
    if [ -n "$SSH_PIDS" ]; then
        for PID in $SSH_PIDS; do
            echo "   Killing SSH process PID: $PID"
            kill -9 $PID 2>/dev/null || true
            KILLED_COUNT=$((KILLED_COUNT + 1))
        done
    fi
fi

echo ""
if [ $KILLED_COUNT -gt 0 ]; then
    echo "✅ Killed $KILLED_COUNT process(es)"
else
    echo "ℹ️  No processes found to kill"
fi

echo ""
echo "Verifying ports are free..."
for PORT in "${PORTS[@]}"; do
    if get_pid_from_port $PORT >/dev/null 2>&1; then
        echo "   ⚠️  Port $PORT is still in use"
    else
        echo "   ✅ Port $PORT is free"
    fi
done

echo ""
echo "=== CLEANUP COMPLETE ==="
