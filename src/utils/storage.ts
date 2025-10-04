const STORAGE_KEYS = {
  API_KEY: "resume_doctor_api_key",
  FORM_DATA: "resume_doctor_form_data",
} as const;

/**
 * Save data to localStorage
 */
export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to save to storage:", error);
  }
}

/**
 * Load data from localStorage
 */
export function loadFromStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error("Failed to load from storage:", error);
    return null;
  }
}

/**
 * Remove data from localStorage
 */
export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to remove from storage:", error);
  }
}

/**
 * Clear all app data from localStorage
 */
export function clearAllStorage(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error("Failed to clear storage:", error);
  }
}

export const StorageKeys = STORAGE_KEYS;
