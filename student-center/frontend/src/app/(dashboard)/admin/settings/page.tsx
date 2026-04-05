"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings, Cpu, ShieldCheck, Database, Zap, Bell,
  RefreshCw, Save, ToggleLeft, ToggleRight, Clock,
  AlertTriangle, CheckCircle2, HardDrive, Server, Wifi,
  Brain, Key, Download
} from "lucide-react";

interface ToggleProps {
  enabled: boolean;
  onChange: () => void;
  color?: string;
}

function Toggle({ enabled, onChange, color = "bg-red-500" }: ToggleProps) {
  return (
    <button
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 flex items-center ${
        enabled ? color : "bg-gray-700"
      }`}
    >
      <span
        className={`absolute w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
          enabled ? "left-6" : "left-0.5"
        }`}
      />
    </button>
  );
}

interface CardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  border: string;
  glow: string;
  children: React.ReactNode;
  delay?: number;
}

function SettingCard({ title, description, icon: Icon, color, border, glow, children, delay = 0 }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`relative rounded-3xl bg-[#0a0a0a]/80 border ${border} overflow-hidden group hover:border-white/20 transition-all duration-300`}
    >
      <div className={`absolute top-0 right-0 w-48 h-48 rounded-full ${glow} blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none`} />
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${glow.replace("blur-3xl", "")} border ${border}`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </div>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </motion.div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-t border-white/5 first:border-t-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-200 truncate">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // AI Settings
  const [aiModel, setAiModel] = useState("gemini-pro");
  const [rateLimit, setRateLimit] = useState("100");
  const [aiEnabled, setAiEnabled] = useState(true);

  // Security Settings
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [twoFactor, setTwoFactor] = useState(false);

  // Notifications
  const [emailNotif, setEmailNotif] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);

  // Storage (mocked stats)
  const dbStatus = "Trực tuyến";
  const storageUsed = "2.4 GB";
  const storageTotal = "20 GB";
  const storagePercent = 12;

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
            <Settings className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" />
            Cài đặt Hệ thống
          </h1>
          <p className="text-gray-400 text-sm">Cấu hình và giám sát nền tảng MINDA</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            saved
              ? "bg-green-600/20 border border-green-500/50 text-green-400"
              : "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]"
          } disabled:opacity-60`}
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Đang lưu..." : saved ? "Đã lưu!" : "Lưu cài đặt"}
        </button>
      </div>

      {/* Maintenance Mode Banner */}
      {maintenanceMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" />
          <p className="text-sm text-orange-300 font-medium">
            ⚠️ Chế độ Bảo trì đang BẬT — Người dùng không thể truy cập hệ thống
          </p>
        </motion.div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* AI Engine */}
        <SettingCard
          title="AI Engine & Mô hình"
          description="Cấu hình hệ thống trí tuệ nhân tạo"
          icon={Brain}
          color="text-purple-400"
          border="border-purple-500/20"
          glow="bg-purple-500/10"
          delay={0}
        >
          <SettingRow label="AI Engine" description="Bật/tắt toàn bộ hệ thống AI">
            <Toggle enabled={aiEnabled} onChange={() => setAiEnabled(!aiEnabled)} color="bg-purple-500" />
          </SettingRow>
          <SettingRow label="Mô hình ngôn ngữ" description="Chọn mô hình AI đang hoạt động">
            <select
              value={aiModel}
              onChange={e => setAiModel(e.target.value)}
              className="text-sm bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
            >
              <option value="gemini-pro" className="bg-[#111]">Gemini Pro</option>
              <option value="gemini-flash" className="bg-[#111]">Gemini Flash</option>
              <option value="rapt-clip" className="bg-[#111]">RAPT-CLIP</option>
            </select>
          </SettingRow>
          <SettingRow label="Giới hạn API (req/ngày)" description="Số requests tối đa mỗi ngày">
            <input
              type="number"
              value={rateLimit}
              onChange={e => setRateLimit(e.target.value)}
              className="w-24 text-sm bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-purple-500/50 text-right transition-colors"
            />
          </SettingRow>
          <SettingRow label="Xóa Cache AI">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-colors">
              <Zap className="w-3 h-3" /> Xóa Cache
            </button>
          </SettingRow>
        </SettingCard>

        {/* Security */}
        <SettingCard
          title="Bảo mật & Xác thực"
          description="Kiểm soát truy cập và bảo vệ hệ thống"
          icon={ShieldCheck}
          color="text-red-400"
          border="border-red-500/20"
          glow="bg-red-500/10"
          delay={0.1}
        >
          <SettingRow label="Chế độ Bảo trì" description="Tạm đóng cửa, chỉ Admin truy cập">
            <Toggle enabled={maintenanceMode} onChange={() => setMaintenanceMode(!maintenanceMode)} color="bg-orange-500" />
          </SettingRow>
          <SettingRow label="Cho phép Đăng ký mới" description="Mở/đóng cổng tạo tài khoản mới">
            <Toggle enabled={allowRegistration} onChange={() => setAllowRegistration(!allowRegistration)} color="bg-green-500" />
          </SettingRow>
          <SettingRow label="Xác thực 2 bước (2FA)" description="Yêu cầu OTP khi đăng nhập Admin">
            <Toggle enabled={twoFactor} onChange={() => setTwoFactor(!twoFactor)} color="bg-red-500" />
          </SettingRow>
          <SettingRow label="Hết hạn phiên (phút)" description="Tự động đăng xuất sau khoảng thời gian">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <input
                type="number"
                value={sessionTimeout}
                onChange={e => setSessionTimeout(e.target.value)}
                className="w-20 text-sm bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-red-500/50 text-right transition-colors"
              />
            </div>
          </SettingRow>
        </SettingCard>

        {/* Storage & Database */}
        <SettingCard
          title="Lưu trữ & Cơ sở Dữ liệu"
          description="Giám sát băng thông và tình trạng CSDL"
          icon={Database}
          color="text-blue-400"
          border="border-blue-500/20"
          glow="bg-blue-500/10"
          delay={0.2}
        >
          <SettingRow label="Kết nối PostgreSQL">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-green-400">{dbStatus}</span>
            </div>
          </SettingRow>
          <SettingRow label="Dung lượng sử dụng" description={`${storageUsed} / ${storageTotal}`}>
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-400" />
              <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
              <span className="text-xs text-blue-400 font-semibold">{storagePercent}%</span>
            </div>
          </SettingRow>
          <SettingRow label="Sao lưu CSDL" description="Tạo bản sao lưu thủ công ngay lập tức">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors">
              <Download className="w-3 h-3" /> Backup Now
            </button>
          </SettingRow>
          <SettingRow label="API Backend">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <Wifi className="w-3 h-3 text-green-400" />
              <span className="text-xs font-semibold text-green-400">FastAPI :8000</span>
            </div>
          </SettingRow>
        </SettingCard>

        {/* Notifications */}
        <SettingCard
          title="Thông báo Hệ thống"
          description="Cấu hình kênh cảnh báo và thông báo"
          icon={Bell}
          color="text-yellow-400"
          border="border-yellow-500/20"
          glow="bg-yellow-500/10"
          delay={0.3}
        >
          <SettingRow label="Thông báo Email" description="Gửi email khi có sự kiện quan trọng">
            <Toggle enabled={emailNotif} onChange={() => setEmailNotif(!emailNotif)} color="bg-yellow-500" />
          </SettingRow>
          <SettingRow label="Cảnh báo Hệ thống" description="Hiển thị banner khi server gặp sự cố">
            <Toggle enabled={systemAlerts} onChange={() => setSystemAlerts(!systemAlerts)} color="bg-yellow-500" />
          </SettingRow>
          <SettingRow label="Phiên bản Hệ thống">
            <span className="text-xs font-mono bg-white/5 px-3 py-1.5 rounded-xl text-gray-400 border border-white/10">
              v1.0.0-beta
            </span>
          </SettingRow>
          <SettingRow label="Thông tin API Key" description="Token xác thực API Backend">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 transition-colors">
              <Key className="w-3 h-3" /> Xem Token
            </button>
          </SettingRow>
        </SettingCard>

      </div>

      {/* Server Status Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 p-5 rounded-2xl bg-[#0a0a0a]/80 border border-white/10"
      >
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5" />
            <span>Vietnix VPS · Ubuntu 22.04</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>PM2 · 2 tiến trình</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5" />
            <span>PostgreSQL 14</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 font-medium">Hệ thống ổn định</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
