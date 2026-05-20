import type { EesOption } from "./ees-data";

const STORAGE_KEY = "ees-practice-v2";

export interface EesSavedState {
  answers: Record<number, EesOption["id"]>;
  favorites: number[];
  hubTab: number;
  solutionsUnlocked: number[];
}

export function loadEesState(): EesSavedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EesSavedState;
  } catch {
    return null;
  }
}

export function saveEesState(state: EesSavedState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

export function clearEesState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
