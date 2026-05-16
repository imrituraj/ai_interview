#!/bin/bash
# start.sh — Starts all 3 services for the AI Interview platform

set -e
CERT=/Library/Frameworks/Python.framework/Versions/3.14/lib/python3.14/site-packages/certifi/cacert.pem

echo "🔴 Stopping any existing processes..."
pkill -f "agent.py" 2>/dev/null || true
pkill -f "token-server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
lsof -ti :8081 | xargs kill -9 2>/dev/null || true
lsof -ti :3001 | xargs kill -9 2>/dev/null || true
lsof -ti :5173 | xargs kill -9 2>/dev/null || true
sleep 1

echo "🤖 Starting LiveKit Agent (Alex)..."
SSL_CERT_FILE=$CERT REQUESTS_CA_BUNDLE=$CERT python3 agent.py start > /tmp/agent.log 2>&1 &
echo "   Agent PID=$!"

echo "🔑 Starting Token Server..."
node token-server.js > /tmp/token-server.log 2>&1 &
echo "   Token Server PID=$!"

echo "⏳ Waiting for agent to register with LiveKit..."
sleep 15

if grep -q "registered worker" /tmp/agent.log; then
  echo "✅ Agent registered!"
else
  echo "❌ Agent failed to register. Check /tmp/agent.log"
  tail -5 /tmp/agent.log
  exit 1
fi

echo "🌐 Starting Frontend..."
cd frontend && npm run dev > /tmp/vite.log 2>&1 &
echo "   Vite PID=$!"
sleep 3

echo ""
echo "============================================"
echo "✅ All services are running!"
echo "============================================"
echo "  Frontend:     http://localhost:5173"
echo "  Token Server: http://localhost:3001"
echo "  Agent:        Registered with LiveKit ✓"
echo "============================================"
echo ""
echo "➡  Open http://localhost:5173, enter your name, click Start Interview"
echo "➡  Allow microphone → Alex will greet you!"
echo ""
echo "Logs: /tmp/agent.log  /tmp/token-server.log  /tmp/vite.log"
