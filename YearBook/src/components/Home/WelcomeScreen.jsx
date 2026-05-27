import { PenTool, BookTemplate } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WelcomeScreen({ onSelectOption }) {
  const userName = localStorage.getItem('minda_user_name');
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full text-center"
      >
        <h1 className="font-display font-bold text-4xl sm:text-5xl text-ink mb-4">
          Chào mừng {userName ? userName : 'bạn'} đến với Lưu Bút Kỷ Yếu
        </h1>
        <p className="font-body text-lg text-ink/60 mb-12 max-w-xl mx-auto">
          Hãy chọn một hành động để bắt đầu. Bạn có thể ký tên vào cuốn sổ của lớp, hoặc tự tay thiết kế một cuốn sổ riêng cho mình!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Option 1: Ký tên vào lưu bút của GV/Lớp */}
          <button 
            onClick={() => onSelectOption('sign_teacher')}
            className="group relative bg-white border border-pink-100 rounded-3xl p-8 text-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-pink-100 text-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <PenTool size={32} />
              </div>
              <h3 className="font-display font-bold text-2xl text-ink mb-2">
                Ký tên vào sổ chung
              </h3>
              <p className="font-body text-ink/60 text-sm">
                Viết những lời chúc tốt đẹp nhất gửi đến cuốn sổ kỷ yếu của Lớp / Thầy Cô.
              </p>
            </div>
          </button>

          {/* Option 2: Tạo lưu bút cá nhân */}
          <button 
            onClick={() => onSelectOption('create_personal')}
            className="group relative bg-white border border-indigo-100 rounded-3xl p-8 text-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookTemplate size={32} />
              </div>
              <h3 className="font-display font-bold text-2xl text-ink mb-2">
                Tạo sổ cho bản thân
              </h3>
              <p className="font-body text-ink/60 text-sm">
                Tạo một cuốn sổ trắng tinh khôi, tự thiết kế bìa và mời bạn bè vào ký tên!
              </p>
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
