import { create } from 'zustand';
import type { Lang } from '../lib/i18n';

export interface PreviewItem {
  title: string;
  creator: string;
  avatar_color?: string;
  platform: string;
  type?: string;
  views?: number;
  engagement?: number;
  likes?: number;
  comments?: number;
  url: string;
}

interface AppState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  currentUser: { name: string; role: string };
  preview: PreviewItem | null;
  openPreview: (item: PreviewItem) => void;
  closePreview: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  lang: 'th',
  setLang: (lang) => set({ lang }),
  currentUser: { name: 'Admin User', role: 'Admin' },
  preview: null,
  openPreview: (item) => set({ preview: item }),
  closePreview: () => set({ preview: null }),
}));
