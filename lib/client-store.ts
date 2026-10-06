import { todayKey } from "./dates";

const KEY_STORAGE = "almanak-anahtar";

const keyListeners = new Set<() => void>();

function readStoredKey() {
  try {
    return sessionStorage.getItem(KEY_STORAGE);
  } catch {
    return null;
  }
}

export function writeKeyHeader(): Record<string, string> {
  const stored = readStoredKey();
  return stored ? { "x-almanak-key": stored } : {};
}

export function saveWriteKey(value: string) {
  try {
    sessionStorage.setItem(KEY_STORAGE, value);
  } catch {
    return;
  }
  for (const listener of keyListeners) listener();
}

export function subscribeWriteKey(listener: () => void) {
  keyListeners.add(listener);
  return () => {
    keyListeners.delete(listener);
  };
}

export function hasWriteKeySnapshot() {
  return readStoredKey() !== null;
}

export function hasWriteKeyServerSnapshot() {
  return false;
}

export function subscribeToday(listener: () => void) {
  const timer = window.setInterval(listener, 30_000);
  const onFocus = () => listener();
  window.addEventListener("focus", onFocus);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", onFocus);
  };
}

export function todaySnapshot() {
  return todayKey();
}
