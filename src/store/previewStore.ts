import { create } from 'zustand';

export interface PreviewData {
  title: string;
  creator: string;
  avatar_color?: string;
  platform: string;
  type?: string;
  views: number;
  engagement: number;
  url: string;
}

interface PreviewState {
  preview: PreviewData | null;
  open: (data: PreviewData) => void;
  close: () => void;
}

export const usePreviewStore = create<PreviewState>((set) => ({
  preview: null,
  open: (data) => set({ preview: data }),
  close: () => set({ preview: null }),
}));
