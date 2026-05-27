import { motion } from 'framer-motion';
import { User, LogIn, BookOpen } from 'lucide-react';

export default function GuestJoinScreen({ yearbookId, onJoinAsGuest }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full text-center"
      >
        <div className="w-20 h-20 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <BookOpen size={40} />
        </div>
        
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-ink mb-4">
          Bạn nhận được lời mời tham gia kỷ yếu!
        </h1>
        
        <p className="font-body text-base sm:text-lg text-ink/70 mb-10 max-w-xl mx-auto">
          Ai đó đã gửi cho bạn đường link tham gia cuốn sổ kỷ yếu có mã <strong>{yearbookId}</strong>. Bạn muốn tham gia với tư cách nào?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Option 1: Guest */}
          <button 
            onClick={() => onJoinAsGuest(yearbookId)}
            className="flex flex-col items-center p-8 bg-white border border-cream-200 hover:border-pink-300 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className="w-14 h-14 bg-cream-50 text-ink/60 group-hover:text-pink-500 group-hover:bg-pink-50 rounded-full flex items-center justify-center mb-4 transition-colors">
              <User size={28} />
            </div>
            <h3 className="font-display font-bold text-xl text-ink mb-2">Xem ngay (Khách)</h3>
            <p className="font-body text-sm text-ink/60 text-center leading-relaxed">
              Vào thẳng trang kỷ yếu. Bạn chỉ cần nhập tên của mình khi muốn gửi lưu bút. Thích hợp cho bạn bè ngoài trường.
            </p>
          </button>

          {/* Option 2: Login */}
          <a 
            href="/login"
            className="flex flex-col items-center p-8 bg-indigo-600 text-white border border-indigo-500 hover:bg-indigo-500 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className="w-14 h-14 bg-white/20 text-white rounded-full flex items-center justify-center mb-4 transition-colors">
              <LogIn size={28} />
            </div>
            <h3 className="font-display font-bold text-xl text-white mb-2">Đăng nhập MINDA</h3>
            <p className="font-body text-sm text-white/80 text-center leading-relaxed">
              Sử dụng tài khoản học sinh MINDA. Hệ thống sẽ tự động liên kết và lưu lại cuốn sổ này vào tài khoản của bạn mãi mãi.
            </p>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
