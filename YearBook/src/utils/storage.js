// Module lưu trữ dữ liệu với localStorage
// Cấu trúc sẵn sàng để nâng cấp lên Firebase Firestore

import { SAMPLE_MESSAGES } from '../data/sampleMessages';

const MESSAGES_KEY   = 'yearbook_messages';
const SIGNATURES_KEY = 'yearbook_signatures';

// ============================================================
//  Khởi tạo dữ liệu mẫu lần đầu chạy
// ============================================================
export function initStorage() {
  if (!localStorage.getItem(MESSAGES_KEY)) {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(SAMPLE_MESSAGES));
  }
  if (!localStorage.getItem(SIGNATURES_KEY)) {
    localStorage.setItem(SIGNATURES_KEY, JSON.stringify([]));
  }
}

// ============================================================
//  MESSAGES
// ============================================================

/** Lấy tất cả lời nhắn (mới nhất trước) */
export function getMessages() {
  const raw = localStorage.getItem(MESSAGES_KEY);
  const messages = raw ? JSON.parse(raw) : [];
  return [...messages].sort((a, b) => new Date(b.date) - new Date(a.date));
}

/** Thêm lời nhắn mới */
export function addMessage(message) {
  const messages = getMessages();
  // Thêm vào đầu mảng
  const updated = [message, ...messages];
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
  return message;
}

/** Cập nhật số tim của một lời nhắn */
export function updateHearts(id, newCount) {
  const raw = localStorage.getItem(MESSAGES_KEY);
  const messages = raw ? JSON.parse(raw) : [];
  const updated = messages.map(m =>
    m.id === id ? { ...m, hearts: newCount } : m
  );
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
}

/** Xóa lời nhắn theo id */
export function deleteMessage(id) {
  const raw = localStorage.getItem(MESSAGES_KEY);
  const messages = raw ? JSON.parse(raw) : [];
  const updated = messages.filter(m => m.id !== id);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
}

// ============================================================
//  SIGNATURES
// ============================================================

/** Lấy tất cả chữ ký */
export function getSignatures() {
  const raw = localStorage.getItem(SIGNATURES_KEY);
  return raw ? JSON.parse(raw) : [];
}

/** Lưu chữ ký mới */
export function addSignature(signature) {
  const signatures = getSignatures();
  const updated = [signature, ...signatures];
  localStorage.setItem(SIGNATURES_KEY, JSON.stringify(updated));
  return signature;
}

// ============================================================
//  HEARTS — track những lời nhắn mà người dùng đã tim
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
  return !isLiked; // trả về trạng thái mới
}

export function isLiked(id) {
  return getLikedIds().includes(id);
}

/* ============================================================
   FIREBASE READY STRUCTURE (để nâng cấp sau):

   import { db, storage } from './firebase';
   import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
   import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

   export async function addMessage(message) {
     return await addDoc(collection(db, 'messages'), message);
   }
   export async function getMessages() {
     const snap = await getDocs(collection(db, 'messages'));
     return snap.docs.map(d => ({ id: d.id, ...d.data() }));
   }
   ============================================================ */
