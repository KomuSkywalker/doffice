import { todayKey } from "./dates";

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
