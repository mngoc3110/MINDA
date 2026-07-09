import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Copy, Check, Users, KeyRound, ArrowRight } from 'lucide-react';
import { fetchYearbookGroups, createYearbookGroupDB, getYearbooks, createYearbook } from '../../utils/storage';

export default function TeacherDashboard({ onSelectGroup }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [viewCode, setViewCode] = useState('');  // nhập mã sổ học sinh

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    let data = await fetchYearbookGroups();
    
    // Fallback: Lấy dữ liệu cũ từ localStorage nếu API rỗng hoặc lỗi
    if (data.length === 0) {
      const localData = getYearbooks().map(yb => ({
        id: yb.id,
        title: yb.title,
        description: yb.type === 'teacher' ? 'Sổ mẫu giáo viên' : 'Sổ lưu bút lớp',
        created_at: new Date().toISOString()
      }));
      data = localData.length > 0 ? localData : [{
        id: 'teacher_template_01',
        title: 'Kỷ Yếu Lớp (Mặc định)',
        description: 'Sổ lưu bút mặc định từ phiên bản cũ',
        created_at: new Date().toISOString()
      }];
    }
    setGroups(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    let created = await createYearbookGroupDB(newTitle, newDesc);
    
    // Nếu backend lỗi (không có API /groups), fallback lưu local
    if (!created) {
      const localYb = createYearbook(newTitle);
      created = {
        id: localYb.id,
        title: localYb.title,
        description: newDesc,
        created_at: new Date().toISOString()
      };
    }
    
    if (created) {
      setGroups([created, ...groups]);
      setShowCreate(false);
      setNewTitle('');
      setNewDesc('');
    }
  };

  const handleCopyLink = (e, id) => {
    e.stopPropagation();
    const link = `https://minda.io.vn/yearbook/?id=${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-cream-50 font-body p-4 sm:p-8 pt-24">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink mb-2">
              Quản lý Sổ Kỷ Yếu
            </h1>
            <p className="text-ink/60 text-sm">
              Tạo và chia sẻ lưu bút số cho các lứa học sinh của bạn
            </p>
          </div>
          <button 
            onClick={() => setShowCreate(!showCreate)}
            className="btn-primary shrink-0"
          >
            <Plus size={18} /> Tạo Sổ Mới
          </button>
        </div>

        {/* Xem sổ bằng mã */}
        <div className="glass-card p-5 mb-8 border border-indigo-100 bg-indigo-50/30">
          <p className="text-sm font-body font-700 text-indigo-700 mb-3 flex items-center gap-2">
            <KeyRound size={16} /> Xem sổ bằng Mã (học sinh hoặc lớp khác)
          </p>
          <form 
            onSubmit={(e) => { e.preventDefault(); if (viewCode.trim()) onSelectGroup(viewCode.trim()); }}
            className="flex gap-3"
          >
            <input
              type="text"
              placeholder="Nhập mã sổ..."
              value={viewCode}
              onChange={e => setViewCode(e.target.value)}
              className="form-input flex-1 text-sm"
            />
            <button
              type="submit"
              disabled={!viewCode.trim()}
              className="btn-primary py-2 px-5 shrink-0 text-sm"
            >
              <ArrowRight size={16} /> Xem
            </button>
          </form>
        </div>

        {/* Form Tạo Sổ */}
        {showCreate && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-8 border-2 border-pink-100"
          >
            <h3 className="font-display font-bold text-lg text-ink mb-4">Sổ Kỷ Yếu Mới</h3>
            <div className="flex flex-col gap-4">
              <input 
                type="text" 
                placeholder="Tên lớp / Tên cuốn sổ (VD: Tập thể 12A1 - K45)"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="form-input"
              />
              <input 
                type="text" 
                placeholder="Mô tả ngắn (không bắt buộc)"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="form-input"
              />
              <div className="flex justify-end gap-3 mt-2">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-ink/50 hover:text-ink font-600 text-sm">
                  Hủy
                </button>
                <button onClick={handleCreate} disabled={!newTitle.trim()} className="btn-primary py-2 px-6">
                  Tạo ngay
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Danh sách Sổ */}
        {loading ? (
          <div className="text-center py-20 text-ink/40 animate-pulse">Đang tải danh sách...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map(group => (
              <motion.div 
                key={group.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-cream-200 hover:shadow-lg hover:border-pink-200 transition-all cursor-pointer group"
                onClick={() => onSelectGroup(group.id)}
              >
                <div className="w-12 h-12 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center mb-4">
                  <BookOpen size={24} />
                </div>
                <h3 className="font-display font-bold text-xl text-ink mb-1 line-clamp-1">{group.title}</h3>
                <p className="text-sm text-ink/50 mb-2 line-clamp-2 min-h-[40px]">
                  {group.description || 'Không có mô tả'}
                </p>
                <div className="bg-cream-50 p-2 rounded-lg border border-pink-100 flex items-center justify-between mb-4">
                  <span className="text-xs font-body text-ink/60">Mã lớp:</span>
                  <span className="text-sm font-bold text-pink-600 font-mono tracking-wider">{group.id}</span>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-black/5">
                  <span className="text-xs text-ink/40 font-600">
                    {new Date(group.created_at).toLocaleDateString('vi-VN')}
                  </span>
                  
                  <button 
                    onClick={(e) => handleCopyLink(e, group.id)}
                    className="flex items-center gap-1.5 text-xs font-600 text-pink-500 bg-pink-50 px-3 py-1.5 rounded-full hover:bg-pink-100 transition-colors"
                  >
                    {copiedId === group.id ? <Check size={14} /> : <Copy size={14} />}
                    {copiedId === group.id ? 'Đã chép link' : 'Copy Link'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
