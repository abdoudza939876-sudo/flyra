#!/bin/bash
# FLYRA Platform — Start All Services
# Run: ./start_flyra.sh

echo "╔═══════════════════════════════════════════════════╗"
echo "║         FLYRA — صعود بلا حدود                   ║"
echo "║         Algerian Fashion Platform               ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Kill any existing servers
pkill -f "flyra_backend.py" 2>/dev/null
pkill -f "ai.py" 2>/dev/null
sleep 1

echo "[1/3] Starting FLYRA Backend API (port 5555)..."
nohup python3 flyra_backend.py > flyra_backend.log 2>&1 &
BACKEND_PID=$!
disown $BACKEND_PID 2>/dev/null
sleep 2

echo "[2/3] Starting AI Server (port 5001)..."
nohup python3 ai.py > ai.log 2>&1 &
AI_PID=$!
disown $AI_PID 2>/dev/null
sleep 2

echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║  ✅ FLYRA Platform is running!                   ║"
echo "╠═══════════════════════════════════════════════════╣"
echo "║                                                   ║"
echo "║  🌐 Landing Page: http://localhost:5555           ║"
echo "║  🛒 Shop/App:      http://localhost:5555/app      ║"
echo "║  📱 Mobile App:    http://localhost:5555/mobile   ║"
echo "║  📖 About:         http://localhost:5555/about    ║"
echo "║  🤖 AI Stylist:    http://localhost:5001          ║"
echo "║  🔧 API Health:    http://localhost:5555/api/health║"
echo "║                                                   ║"
echo "║  Backend PID:  $BACKEND_PID                       ║"
echo "║  AI Server PID: $AI_PID                           ║"
echo "║                                                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
echo "✓ Servers running in background — safe to close VS Code."
echo "  To stop them later run: pkill -f flyra_backend.py; pkill -f ai.py"
echo ""