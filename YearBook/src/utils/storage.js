import { SAMPLE_MESSAGES } from '../data/sampleMessages';

const YEARBOOKS_KEY = 'yearbook_collections';
const ACTIVE_YEARBOOK_KEY = 'yearbook_active_id';

// Default templates
const DEFAULT_TEACHER_YEARBOOK = {
  id: 'teacher_template_01',
  type: 'teacher',
  title: 'Kỷ Yếu Lớp (Mẫu Cô Giáo)',
  cover: {
    bgColor: '#fdf2f8', // pink-50
    stickers: []
  },
  pages: SAMPLE_MESSAGES.map(msg => ({ id: msg.id, type: 'student', content: msg, stickers: [] }))
};

export function initStorage() {
  const existing = localStorage.getItem(YEARBOOKS_KEY);
  if (!existing) {
    const defaultData = [DEFAULT_TEACHER_YEARBOOK];
    localStorage.setItem(YEARBOOKS_KEY, JSON.stringify(defaultData));
    localStorage.setItem(ACTIVE_YEARBOOK_KEY, 'teacher_template_01');
  }
}

export function getYearbooks() {
  const raw = localStorage.getItem(YEARBOOKS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveYearbooks(data) {
  localStorage.setItem(YEARBOOKS_KEY, JSON.stringify(data));
}

export function getActiveYearbookId() {
  return localStorage.getItem(ACTIVE_YEARBOOK_KEY) || 'teacher_template_01';
}

export function setActiveYearbookId(id) {
  localStorage.setItem(ACTIVE_YEARBOOK_KEY, id);
}

export function getActiveYearbook() {
  const yearbooks = getYearbooks();
  const activeId = getActiveYearbookId();
  return yearbooks.find(yb => yb.id === activeId) || yearbooks[0];
}

export function updateYearbook(id, updates) {
  const yearbooks = getYearbooks();
  const updated = yearbooks.map(yb => yb.id === id ? { ...yb, ...updates } : yb);
  saveYearbooks(updated);
  return updated.find(yb => yb.id === id);
}

export function createYearbook(title) {
  const yearbooks = getYearbooks();
  const newYb = {
    id: 'class_yb_' + Date.now(),
    type: 'class',
    title: title,
    cover: { bgColor: '#f0fdf4', stickers: [] },
    pages: []
  };
  saveYearbooks([...yearbooks, newYb]);
  return newYb;
}

export function getPersonalYearbook() {
  const yearbooks = getYearbooks();
  return yearbooks.find(yb => yb.type === 'personal');
}

export function createPersonalYearbook(title) {
  const yearbooks = getYearbooks();
  const newYb = {
    id: 'personal_yb_' + Date.now(),
    type: 'personal',
    title: title || 'Lưu Bút Của Tôi',
    cover: { bgColor: '#eff6ff', stickers: [] },
    pages: []
  };
  saveYearbooks([...yearbooks, newYb]);
  return newYb;
}

export function getTeacherYearbook() {
  const yearbooks = getYearbooks();
  return yearbooks.find(yb => yb.type === 'teacher') || yearbooks[0];
}

// ============================================================
// Hỗ trợ đồng bộ Backend Database
// ============================================================
export async function fetchMessagesFromDB(yearbookId) {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'https://minda.io.vn';
    const token = localStorage.getItem('minda_token');
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};
    
    const res = await fetch(`${API_URL}/api/yearbook/${yearbookId}/messages`, { headers });
    if (res.ok) {
      const dbMessages = await res.json();
      // Map back to pages format
      const pages = dbMessages.map(msg => ({
        id: msg.id,
        type: 'student',
        content: {
          id: msg.id,
          name: msg.author_name,
          emoji: msg.emoji,
          bgColor: msg.bg_color,
          message: msg.message,
          image: msg.image_data,
          signature: msg.signature_data,
          canvasData: msg.canvas_data,
          isPublic: msg.is_public,
          hearts: msg.hearts,
          date: msg.created_at,
          timestamp: new Date(msg.created_at).getTime(),
          avatar_url: msg.avatar_url || null  // From User table join
        },
        stickers: []
      }));
      
      // Update local storage with fresh data from DB
      const yearbooks = getYearbooks();
      let targetYb = yearbooks.find(yb => yb.id === yearbookId);
      let updated;
      
      if (targetYb) {
        updated = yearbooks.map(yb => yb.id === yearbookId ? { ...yb, pages } : yb);
      } else {
        targetYb = {
          id: yearbookId,
          type: 'class',
          title: 'Kỷ Yếu Lớp',
          cover: { bgColor: '#f0fdf4', stickers: [] },
          pages
        };
        updated = [...yearbooks, targetYb];
      }
      saveYearbooks(updated);
      return updated.find(yb => yb.id === yearbookId);
    }
  } catch (error) {
    console.error("Failed to fetch messages from DB", error);
  }
  return null;
}

export function getMessages() {
  const active = getActiveYearbook();
  if (!active) return [];
  return active.pages.map(p => p.content);
}

export async function addMessage(message) {
  const active = getActiveYearbook();
  if (!active) return message;
  
  // Kiểm tra học sinh đã có bài chưa — nếu rồi thì UPDATE thay vì tạo mới
  const existingPage = active.pages?.find(
    p => p.content?.name?.trim().toLowerCase() === message.name?.trim().toLowerCase()
  );
  
  if (existingPage) {
    // Cập nhật bài hiện có
    const updates = {
      emoji: message.emoji,
      bgColor: message.bgColor,
      message: message.message,
      image: message.image,
      signature: message.signature,
      isPublic: message.isPublic,
      canvasData: message.canvasData
    };
    const result = await updateMessageInDB(existingPage.id, updates);
    // Trả về message với id của bài cũ để UI cập nhật đúng
    return result || { ...message, id: existingPage.id };
  }
  
  // 1. Lưu DB (bài hoàn toàn mới)
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'https://minda.io.vn';
    await fetch(`${API_URL}/api/yearbook/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: message.id,
        yearbook_id: active.id,
        author_name: message.name,
        emoji: message.emoji,
        bg_color: message.bgColor,
        message: message.message,
        image_data: message.image,
        signature_data: message.signature,
        is_public: message.isPublic,
        canvas_data: message.canvasData
      })
    });
  } catch (err) {
    console.error("Failed to save message to DB", err);
  }

  // 2. Cập nhật Local
  const newPage = {
    id: message.id,
    type: 'student',
    content: message,
    stickers: []
  };
  
  updateYearbook(active.id, { pages: [newPage, ...(active.pages || [])] });
  return message;
}

export async function updateHearts(id, newCount) {
  const active = getActiveYearbook();
  if (!active) return;
  
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'https://minda.io.vn';
    await fetch(`${API_URL}/api/yearbook/messages/${id}/heart`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hearts: newCount })
    });
  } catch (err) {}

  const updatedPages = active.pages.map(p => 
    p.id === id ? { ...p, content: { ...p.content, hearts: newCount } } : p
  );
  updateYearbook(active.id, { pages: updatedPages });
}

export function deleteMessage(id) {
  const active = getActiveYearbook();
  if (!active) return;
  const updatedPages = active.pages.filter(p => p.id !== id);
  updateYearbook(active.id, { pages: updatedPages });
}

// ============================================================
//  HEARTS
// ============================================================
const LIKED_KEY = 'yearbook_liked';

export function getLikedIds() {
  const raw = localStorage.getItem(LIKED_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function toggleLike(id) {
  const liked = getLikedIds();
  const isLiked = liked.includes(id);
  const updated = isLiked ? liked.filter(x => x !== id) : [...liked, id];
  localStorage.setItem(LIKED_KEY, JSON.stringify(updated));
  return !isLiked;
}

export function isLiked(id) {
  return getLikedIds().includes(id);
}

// ============================================================
//  SIGNATURES (Tương thích ngược)
// ============================================================
const SIGNATURES_KEY = 'yearbook_signatures';

export function getSignatures() {
  const raw = localStorage.getItem(SIGNATURES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function addSignature(signature) {
  const signatures = getSignatures();
  const updated = [signature, ...signatures];
  localStorage.setItem(SIGNATURES_KEY, JSON.stringify(updated));
  return signature;
}

// ============================================================
//  API: GROUPS & MESSAGE UPDATES
// ============================================================

export async function fetchYearbookGroups() {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'https://minda.io.vn';
    const token = localStorage.getItem('minda_token');
    if (!token) return [];
    
    const res = await fetch(`${API_URL}/api/yearbook/groups`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch yearbook groups", err);
  }
  return [];
}

export async function createYearbookGroupDB(title, description = '') {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'https://minda.io.vn';
    const token = localStorage.getItem('minda_token');
    if (!token) return null;
    
    const res = await fetch(`${API_URL}/api/yearbook/groups`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({ title, description })
    });
    
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to create yearbook group", err);
  }
  return null;
}

export async function fetchYearbookGroup(id) {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'https://minda.io.vn';
    const res = await fetch(`${API_URL}/api/yearbook/groups/${id}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch yearbook group details", err);
  }
  return null;
}

export async function updateMessageInDB(messageId, updates) {
  const active = getActiveYearbook();
  if (!active) return null;
  
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'https://minda.io.vn';
    const token = localStorage.getItem('minda_token');
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/api/yearbook/messages/${messageId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        emoji: updates.emoji,
        bg_color: updates.bgColor,
        message: updates.message,
        image_data: updates.image,
        signature_data: updates.signature,
        is_public: updates.isPublic,
        canvas_data: updates.canvasData
      })
    });
    
    if (res.ok) {
      const dbMessage = await res.json();
      const updatedContent = {
        id: dbMessage.id,
        name: dbMessage.author_name,
        emoji: dbMessage.emoji,
        bgColor: dbMessage.bg_color,
        message: dbMessage.message,
        image: dbMessage.image_data,
        signature: dbMessage.signature_data,
        canvasData: dbMessage.canvas_data,
        isPublic: dbMessage.is_public,
        hearts: dbMessage.hearts,
        date: dbMessage.created_at,
        timestamp: new Date(dbMessage.created_at).getTime()
      };
      
      // 2. Cập nhật Local
      const updatedPages = active.pages.map(p => 
        p.id === messageId ? { ...p, content: updatedContent } : p
      );
      updateYearbook(active.id, { pages: updatedPages });
      return updatedContent;
    }
  } catch (err) {
    console.error("Failed to update message in DB", err);
  }
  return null;
}
