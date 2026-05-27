#!/bin/bash

# start_local.sh - Tự động khởi chạy toàn bộ 4 dịch vụ của MINDA trên máy Mac

echo "🚀 KHỞI ĐỘNG HỆ THỐNG MINDA (LOCAL) 🚀"
echo "Lưu ý: Bấm phím [Ctrl + C] bất cứ lúc nào để dọn sạch sẽ và tắt toàn bộ máy chủ."
echo "=========================================================="

# Lấy đường dẫn gốc
ROOT_DIR=$(pwd)

# Phiên bản AI Python đặc biệt do Cài đặt Mac hôm nay
PYTHON_314="/Library/Frameworks/Python.framework/Versions/3.14/bin/python3"

# 1. Kích hoạt RAPT-CLIP AI (Port 8001)
echo "1️⃣ Đang khơi động [RAPT-CLIP AI Server] (Cổng 8001)..."
cd "$ROOT_DIR/RAPT-CLIP"
$PYTHON_314 -m uvicorn inference_server:app --port 8001 > rapt.log 2>&1 &
RAPT_PID=$!

# 2. Kích hoạt PeerJS Server (Port 9000) - Máy chủ gọi WebRTC P2P
echo "2️⃣ Đang khởi động [PeerJS WebRTC] (Cổng 9000)..."
cd "$ROOT_DIR/student-center/frontend"
npx peerjs --port 9000 --proxied true --cors > peer.log 2>&1 &
PEERJS_PID=$!

# 3. Kích hoạt Minda Backend (Port 8000)
echo "3️⃣ Đang khởi động [Main Minda Backend] (Cổng 8000)..."
cd "$ROOT_DIR/student-center/backend"
# Tự động cài thư viện Python nếu thiếu
$PYTHON_314 -m pip install -r requirements.txt -q 2>/dev/null
$PYTHON_314 -m pip install cloudinary slowapi -q 2>/dev/null
# Nếu có venv thì chạy venv, không thì dùng python mặc định
if [ -f "venv/bin/uvicorn" ]; then
    ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
else
    $PYTHON_314 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
fi
BACKEND_PID=$!

# 4. Kích hoạt Next.js Frontend (Port 3000)
echo "4️⃣ Đang khởi động [React Frontend] (Cổng 3000)..."
cd "$ROOT_DIR/student-center/frontend"
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

echo "=========================================================="
echo "✅ TOÀN BỘ MÁY CHỦ SẼ SNĂNG SÀNG TRONG VÀI GIÂY NỮA!"
echo "👉 Mở trình duyệt và truy cập: http://localhost:3000"
echo "📝 Log hệ thống tự động lưu vào các file .log tại từng thư mục."
echo "=========================================================="

# Bắt sự kiện người dùng bấm Ctrl + C để rút điện hệ thống
trap "echo -e '\n🛑 Đang rút điện tắt toàn bộ server...'; kill $RAPT_PID $PEERJS_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

wait
