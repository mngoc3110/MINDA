// Form gửi lưu bút — modal 3 bước (tên + cảm xúc → ảnh → lời nhắn)
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import MediaUpload from './ImageUpload';
import { addMessage } from '../../utils/storage';
import { generateId } from '../../utils/helpers';
import { EMOTIONS } from '../../data/sampleMessages';

const MAX_CHARS = 1000;
const STEPS = ['Giới thiệu', 'Hình ảnh', 'Lời nhắn'];

const initialForm = {
  name:        localStorage.getItem('minda_user_name') || '',
  emotion:     EMOTIONS[0],
  imageBase64: null,
  mediaType:   null,   // 'image' | 'video' | null
  message:     '',
  isPublic:    true,   // Quyền riêng tư mặc định
};

export default function SubmitForm({ isOpen, onClose, onSubmit }) {
  const [step, setStep]         = useState(0);
  const [form, setForm]         = useState({ ...initialForm, name: localStorage.getItem('minda_user_name') || '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  // Kiểm tra bước hiện tại có hợp lệ không
  const canNext = () => {
    if (step === 0) return form.name.trim().length >= 2 && form.emotion;
    if (step === 1) return true; // ảnh là tùy chọn
    if (step === 2) return form.message.trim().length >= 10;
    return false;
  };

  const handleNext = () => {
    if (step < 2) setStep(s => s + 1);
    else          handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600)); // giả lập gửi

    const newMessage = {
      id:          generateId(),
      name:        form.name.trim(),
      emoji:       form.emotion.emoji,
      bgColor:     form.emotion.bg,
      message:     form.message.trim(),
      imageBase64: form.imageBase64,
      mediaType:   form.mediaType,
      isPublic:    form.isPublic,
      date:        new Date().toISOString(),
      hearts:      0,
    };

    addMessage(newMessage);
    onSubmit(newMessage);
    setLoading(false);
    setSubmitted(true);
  };

  const handleClose = () => {
    onClose();
    // Reset sau khi đóng
    setTimeout(() => {
      setStep(0);
      setForm(initialForm);
      setSubmitted(false);
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-x-4 bottom-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50
                       bg-white rounded-3xl shadow-float max-w-lg w-full sm:w-[480px] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-cream-100">
              <div>
                <h2 className="font-display text-xl font-bold text-ink">
                  ✍️ Gửi Lưu Bút
                </h2>
                {!submitted && (
                  <p className="text-xs text-ink/40 font-body mt-0.5">
                    Bước {step + 1} / {STEPS.length} — {STEPS[step]}
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-cream-100 hover:bg-cream-200 flex items-center justify-center transition-colors"
              >
                <X size={16} className="text-ink/60" />
              </button>
            </div>

            {/* Step indicator */}
            {!submitted && (
              <div className="flex items-center justify-center gap-2 px-6 pt-4">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`step-dot ${i === step ? 'active' : i < step ? 'bg-pink-300' : ''}`}
                  />
                ))}
              </div>
            )}

            {/* Body */}
            <div className="px-6 py-5 min-h-[280px]">
              <AnimatePresence mode="wait">
                {submitted ? (
                  /* Màn hình thành công */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center text-center py-8 gap-4"
                  >
                    <motion.div
                      animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6 }}
                      className="text-6xl"
                    >
                      🎉
                    </motion.div>
                    <h3 className="font-display text-2xl font-bold text-ink">
                      Gửi thành công!
                    </h3>
                    <p className="font-body text-ink/60 text-sm max-w-xs">
                      Lời nhắn của <strong>{form.name}</strong> đã được thêm vào Tường Lưu Bút.
                      Cảm ơn bạn rất nhiều! 💕
                    </p>
                    <button onClick={handleClose} className="btn-primary mt-2">
                      <CheckCircle size={16} />
                      Tuyệt vời!
                    </button>
                  </motion.div>
                ) : step === 0 ? (
                  /* Bước 1 — Tên + Cảm xúc */
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-sm font-body font-700 text-ink mb-2">
                        Tên của bạn 👤
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => update('name', e.target.value)}
                        placeholder="Nhập tên hoặc biệt danh của bạn…"
                        className="form-input"
                        maxLength={50}
                        autoFocus
                      />
                      {form.name.length > 0 && form.name.trim().length < 2 && (
                        <p className="text-xs text-red-400 mt-1 font-body">
                          Tên cần ít nhất 2 ký tự
                        </p>
                      )}
                    </div>
                    <EmojiPicker
                      selected={form.emotion}
                      onSelect={e => update('emotion', e)}
                    />
                  </motion.div>
                ) : step === 1 ? (
                  /* Bước 2 — Upload ảnh */
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <MediaUpload
                      value={form.imageBase64}
                      mediaType={form.mediaType}
                      onChange={v => update('imageBase64', v)}
                      onTypeChange={t => update('mediaType', t)}
                    />
                  </motion.div>
                ) : (
                  /* Bước 3 — Lời nhắn */
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-2"
                  >
                    <label className="block text-sm font-body font-700 text-ink">
                      Lời nhắn của bạn 💬
                    </label>
                    <textarea
                      value={form.message}
                      onChange={e => update('message', e.target.value.slice(0, MAX_CHARS))}
                      placeholder={`Viết những gì bạn muốn nói với thầy/cô…\n\n(Ít nhất 10 ký tự)`}
                      className="form-input resize-none"
                      rows={6}
                      autoFocus
                    />
                    <div className="flex justify-between items-center">
                      {form.message.trim().length < 10 && form.message.length > 0 && (
                        <p className="text-xs text-red-400 font-body">
                          Cần thêm {10 - form.message.trim().length} ký tự nữa
                        </p>
                      )}
                      <span className="ml-auto text-xs text-ink/30 font-body">
                        {form.message.length} / {MAX_CHARS}
                      </span>
                    </div>

                    {/* ── Cài đặt quyền riêng tư ── */}
                    <div className="mt-4 bg-rose-soft/20 p-3.5 rounded-xl border border-pink-100">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <div className="relative mt-0.5">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={!form.isPublic}
                            onChange={(e) => update('isPublic', !e.target.checked)}
                          />
                          <div className={`block w-9 h-5 rounded-full transition-colors duration-300 ${!form.isPublic ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
                          <div className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform duration-300 ${!form.isPublic ? 'translate-x-4' : ''}`}></div>
                        </div>
                        <div>
                          <p className="font-body font-700 text-sm text-ink leading-tight">Gửi riêng cho thầy 🔒</p>
                          <p className="font-body text-xs text-ink/60 mt-1 leading-relaxed">
                            {!form.isPublic
                              ? 'Lời nhắn này sẽ bị ẩn khỏi tường công khai, chỉ có thầy mới đọc được.'
                              : 'Lời nhắn sẽ được hiển thị công khai trên tường lưu bút để mọi người cùng xem.'}
                          </p>
                        </div>
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer — nút điều hướng */}
            {!submitted && (
              <div className="flex items-center justify-between px-6 pb-6 gap-3">
                <button
                  onClick={() => setStep(s => s - 1)}
                  disabled={step === 0}
                  className="btn-ghost gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowLeft size={14} />
                  Quay lại
                </button>

                <button
                  onClick={handleNext}
                  disabled={!canNext() || loading}
                  className="btn-primary gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="animate-spin">⏳</span>
                  ) : step < 2 ? (
                    <>Tiếp theo <ArrowRight size={14} /></>
                  ) : (
                    <>Gửi lưu bút <Send size={14} /></>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
