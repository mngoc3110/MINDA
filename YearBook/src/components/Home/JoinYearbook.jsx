import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, ArrowRight } from 'lucide-react';
import { getYearbooks } from '../../utils/storage';

export default function JoinYearbook({ onJoin, onCreatePersonal }) {
  const [code, setCode] = useState('');
  const [recentYearbooks, setRecentYearbooks] = useState([]);

  useEffect(() => {
    // Lấy danh sách các sổ lớp hoặc sổ cá nhân đã từng vào
    const all = getYearbooks();
    // Bỏ qua sổ mẫu của giáo viên (teacher_template_01)
    const recent = all.filter(yb => (yb.type === 'class' || yb.type === 'personal') && yb.id !== 'teacher_template_01');
    setRecentYearbooks(recent);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.trim()) {
      onJoin(code.trim());
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card max-w-md w-full p-8 text-center"
      >
        <div className="w-16 h-16 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <KeyRound size={32} />
        </div>
        
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-3">
          Tham gia Lưu bút
        </h2>
        <p className="text-ink/60 font-body text-sm mb-8">
          Vui lòng nhập Mã Kỷ Yếu (hoặc dán Link) do giáo viên cung cấp để tham gia viết lưu bút cho lớp của bạn.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input 
            type="text"
            placeholder="Nhập Mã Kỷ Yếu..."
            value={code}
            onChange={e => setCode(e.target.value)}
            className="form-input text-center text-lg tracking-wider"
            autoFocus
          />
          <button 
            type="submit"
            disabled={!code.trim()}
            className="btn-primary w-full py-3 mt-2"
          >
            Vào Sổ Kỷ Yếu <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-cream-200">
          {recentYearbooks.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-ink/50 mb-3 font-body font-600 text-left">Sổ đã tham gia gần đây:</p>
              <div className="flex flex-col gap-2">
                {recentYearbooks.map(yb => (
                  <button
                    key={yb.id}
                    onClick={() => onJoin(yb.id)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-pink-100 hover:border-pink-300 hover:shadow-md transition-all text-left group"
                  >
                    <div>
                      <h4 className="font-display font-bold text-ink text-sm group-hover:text-pink-600 transition-colors">
                        {yb.title || (yb.type === 'personal' ? 'Sổ Cá Nhân' : 'Kỷ Yếu Lớp')}
                      </h4>
                      <p className="font-body text-xs text-ink/40 mt-0.5">Mã: {yb.id}</p>
                    </div>
                    <ArrowRight size={16} className="text-pink-300 group-hover:text-pink-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-sm text-ink/50 mb-3 font-body">Bạn muốn tự tạo một cuốn sổ kỷ yếu của riêng mình?</p>
          <button 
            onClick={onCreatePersonal}
            className="w-full py-3 rounded-xl border-2 border-indigo-100 text-indigo-500 font-body font-700 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
          >
            Tạo Sổ Cá Nhân 📖
          </button>
        </div>
      </motion.div>
    </div>
  );
}
