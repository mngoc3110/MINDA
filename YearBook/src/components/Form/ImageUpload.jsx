// Component upload ảnh VÀ video — drag & drop + click, preview tức thì
import { useState, useRef } from 'react';
import { X, Film, Camera } from 'lucide-react';
import { fileToBase64 } from '../../utils/helpers';

// Các loại file được chấp nhận
const ACCEPTED_IMAGE = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ACCEPTED_VIDEO = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/mov'];
const MAX_IMAGE_MB = 5;
const MAX_VIDEO_MB = 50;

export default function MediaUpload({ value, mediaType, onChange, onTypeChange }) {
  const [dragging, setDragging]   = useState(false);
  const [tab, setTab]             = useState('image'); // 'image' | 'video'
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;

    const isImage = ACCEPTED_IMAGE.includes(file.type);
    const isVideo = ACCEPTED_VIDEO.includes(file.type);

    if (!isImage && !isVideo) {
      alert('Vui lòng chọn file ảnh (JPG, PNG, GIF, WebP) hoặc video (MP4, WebM, MOV)');
      return;
    }

    // Kiểm tra kích thước
    const maxMB = isImage ? MAX_IMAGE_MB : MAX_VIDEO_MB;
    if (file.size > maxMB * 1024 * 1024) {
      alert(`File quá lớn! ${isImage ? 'Ảnh' : 'Video'} tối đa ${maxMB}MB`);
      return;
    }

    const base64 = await fileToBase64(file);
    onChange(base64);
    onTypeChange(isImage ? 'image' : 'video');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const clearMedia = () => {
    onChange(null);
    onTypeChange(null);
    // Reset input values
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  return (
    <div>
      <label className="block text-sm font-body font-700 text-ink mb-2">
        Ảnh / Video kỷ niệm{' '}
        <span className="text-ink/40 font-400">(tùy chọn)</span>
      </label>

      {/* Tab chọn loại media */}
      {!value && (
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setTab('image')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-body font-600 transition-all ${
              tab === 'image'
                ? 'bg-pink-100 text-pink-600 border-2 border-pink-300'
                : 'bg-cream-100 text-ink/50 border-2 border-transparent hover:border-cream-300'
            }`}
          >
            <Camera size={13} />
            Ảnh
          </button>
          <button
            type="button"
            onClick={() => setTab('video')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-body font-600 transition-all ${
              tab === 'video'
                ? 'bg-purple-100 text-purple-600 border-2 border-purple-300'
                : 'bg-cream-100 text-ink/50 border-2 border-transparent hover:border-cream-300'
            }`}
          >
            <Film size={13} />
            Video
          </button>
        </div>
      )}

      {value ? (
        /* ─── Preview media đã chọn ─── */
        <div className="relative rounded-xl overflow-hidden border-2 border-pink-200">
          {mediaType === 'video' ? (
            <video
              src={value}
              controls
              className="w-full max-h-52 bg-black"
              playsInline
            />
          ) : (
            <img
              src={value}
              alt="Preview"
              className="w-full max-h-52 object-cover"
            />
          )}

          {/* Nút xóa */}
          <button
            type="button"
            onClick={clearMedia}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
          >
            <X size={14} />
          </button>

          {/* Badge loại file */}
          <div className="absolute bottom-2 left-2 bg-black/40 text-white text-xs font-body px-2 py-0.5 rounded-full flex items-center gap-1">
            {mediaType === 'video' ? <Film size={10} /> : <Camera size={10} />}
            {mediaType === 'video' ? 'Video đã chọn ✓' : 'Ảnh đã chọn ✓'}
          </div>
        </div>
      ) : (
        /* ─── Khu vực drag & drop ─── */
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            dragging
              ? 'border-pink-400 bg-rose-soft/50 scale-[1.02]'
              : tab === 'video'
                ? 'border-purple-200 bg-purple-50/50 hover:border-purple-300 hover:bg-purple-50'
                : 'border-cream-300 bg-cream-50 hover:border-pink-300 hover:bg-rose-soft/20'
          }`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => tab === 'video' ? videoInputRef.current?.click() : imageInputRef.current?.click()}
        >
          <div className={`text-4xl mb-2 transition-transform ${dragging ? 'scale-125' : ''}`}>
            {tab === 'video' ? '🎬' : '📸'}
          </div>
          <p className="font-body font-600 text-ink/60 text-sm mb-1">
            {tab === 'video' ? 'Kéo thả video vào đây' : 'Kéo thả ảnh vào đây'}
          </p>
          <p className="font-body text-ink/40 text-xs">
            hoặc{' '}
            <span className={`underline ${tab === 'video' ? 'text-purple-500' : 'text-pink-500'}`}>
              chọn file từ thiết bị
            </span>
          </p>
          <p className="font-body text-ink/30 text-xs mt-1">
            {tab === 'video'
              ? 'MP4, WebM, MOV · Tối đa 50MB'
              : 'JPG, PNG, GIF, WebP · Tối đa 5MB'}
          </p>
        </div>
      )}

      {/* Input ẩn — ảnh */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handleFile(e.target.files[0])}
      />

      {/* Input ẩn — video */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg,video/quicktime,.mov,.mp4,.webm"
        className="hidden"
        onChange={e => handleFile(e.target.files[0])}
      />
    </div>
  );
}
