#!/bin/bash
# run_minda_dev.sh
# MINDA Development Orchestrator
# Launches Frontend, Backend, and RAPT-CLIP in separate terminal background processes.

# --- Colors for Logging ---
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}==================================================${NC}"
echo -e "${CYAN}🚀  CHƯƠNG TRÌNH KHỞI ĐỘNG CÙNG MINDA (DEV MODE)  ${NC}"
echo -e "${CYAN}==================================================${NC}"

# 1. Start RAPT-CLIP Inference Server (AI)
echo -e "${PURPLE}[1/4] Đang khởi động RAPT-CLIP (Port 8001)...${NC}"
cd RAPT-CLIP
source venv_inference/bin/activate
# Run in background with logging to a temporary file
python inference_server.py > /tmp/rapt_clip.log 2>&1 &
CLIP_PID=$!
cd ..

# 2. Start PeerJS Signaling Server
echo -e "${CYAN}[2/4] Đang khởi động PeerJS WebRTC Server (Port 9000)...${NC}"
cd student-center/frontend
npx peerjs --port 9000 > /tmp/peerjs.log 2>&1 &
PEERJS_PID=$!
cd ../..

# 3. Start Backend (Uvicorn)
echo -e "${BLUE}[3/4] Đang khởi động Backend (Port 8000)...${NC}"
cd student-center/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ../..

# 4. Start Frontend (Next.js)
echo -e "${GREEN}[4/4] Đang khởi động Frontend (Port 3000)...${NC}"
cd student-center/frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../..

echo -e "${CYAN}--------------------------------------------------${NC}"
echo -e "${GREEN}✅ TẤT CẢ SERVICE ĐÃ ĐƯỢC KÍCH HOẠT!${NC}"
echo -e "   - Frontend:    http://localhost:3000"
echo -e "   - Backend:     http://localhost:8000"
echo -e "   - AI Model:    http://localhost:8001"
echo -e "   - Peer Server: ws://localhost:9000"
echo -e "${CYAN}--------------------------------------------------${NC}"
echo -e "Sử dụng lệnh 'tail -f /tmp/*.log' để xem nhật ký."
echo -e "Bấm Ctrl+C để dừng tất cả các service."

# Cleanup on exit
trap "kill $CLIP_PID $PEERJS_PID $BACKEND_PID $FRONTEND_PID; echo -e '\n🛑 Đã dừng toàn bộ MINDA.'; exit" INT
wait
