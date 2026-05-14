// Utility functions — các hàm tiện ích dùng chung

/**
 * Format ngày thành tiếng Việt thân thiện
 * @param {string} isoDate - ISO date string
 * @returns {string} Ngày định dạng tiếng Việt
 */
export function formatDate(isoDate) {
  const date = new Date(isoDate);
  const now  = new Date();
  const diff = now - date; // milliseconds

  const minutes = Math.floor(diff / 60000);
  const hours   = Math.floor(diff / 3600000);
  const days    = Math.floor(diff / 86400000);

  if (minutes < 1)   return 'Vừa xong';
  if (minutes < 60)  return `${minutes} phút trước`;
  if (hours < 24)    return `${hours} giờ trước`;
  if (days < 7)      return `${days} ngày trước`;

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

/**
 * Cắt ngắn văn bản nếu quá dài
 * @param {string} text - Văn bản gốc
 * @param {number} maxLength - Độ dài tối đa
 * @returns {string}
 */
export function truncateText(text, maxLength = 180) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Tạo chữ cái đầu của tên để hiển thị avatar
 * @param {string} name
 * @returns {string} 1-2 ký tự đầu
 */
export function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Convert File sang base64 string
 * @param {File} file
 * @returns {Promise<string>}
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Debounce function
 * @param {Function} fn
 * @param {number} delay ms
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate random ID đơn giản (dùng khi không có uuid)
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
