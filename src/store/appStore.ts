import { create } from 'zustand';
import type { Lang } from '../lib/i18n';

interface AppState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  currentUser: { name: string; role: string };
}

export const useAppStore = create<AppState>((set) => ({
  lang: 'th',
  setLang: (lang) => set({ lang }),
  currentUser: { name: 'Admin User', role: 'Admin' },
}));
