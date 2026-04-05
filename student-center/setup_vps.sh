#!/bin/bash

# MINDA VPS Setup Script for Ubuntu 22.04+
# Usage: sudo bash setup_vps.sh

set -e

echo "🚀 Bắt đầu cài đặt hệ thống MINDA trên VPS..."

# 1. Update system
apt update && apt upgrade -y

# 2. Install dependencies
apt install -y curl git wget software-properties-common build-essential libpq-dev

# 3. Install Python & Venv
apt install -y python3 python3-pip python3-venv

# 4. Install Node.js (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 5. Install PostgreSQL
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# 6. Install Nginx
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# 7. Install PM2 global
npm install -g pm2

# 8. Setup PostgreSQL (Cần sếp đổi mật khẩu sau)
sudo -u postgres psql -c "CREATE DATABASE minda_db;" || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER minda_user WITH PASSWORD 'minda_password_123';" || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE minda_db TO minda_user;"

echo "✅ Cài đặt môi trường cơ bản thành công!"
echo "------------------------------------------------"
echo "Các bước tiếp theo sếp cần làm:"
echo "1. Clone code từ GitHub về thư mục /var/www/minda"
echo "2. Cấu hình file .env cho Backend và Frontend"
echo "3. Chạy lệnh: pm2 start ecosystem.config.js"
echo "4. Cấu hình Nginx và SSL (Certbot)"
echo "------------------------------------------------"
