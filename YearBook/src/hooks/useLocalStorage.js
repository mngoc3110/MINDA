// Hook tùy chỉnh để đồng bộ state với localStorage
import { useState, useEffect } from 'react';

/**
 * useLocalStorage — giống useState nhưng persist qua reload
 * @param {string} key - localStorage key
 * @param {*} initialValue - Giá trị mặc định
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`useLocalStorage: không đọc được key "${key}"`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      // Cho phép truyền function như setState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`useLocalStorage: không ghi được key "${key}"`, error);
    }
  };

  return [storedValue, setValue];
}
