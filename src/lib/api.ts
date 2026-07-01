const BASE = '/api';

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(BASE + path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!r.ok) throw new Error(`API error ${r.status}`);
  return r.json();
}

const get = <T>(path: string) => req<T>(path);
const post = <T>(path: string, body: unknown) => req<T>(path, { method: 'POST', body: JSON.stringify(body) });
const put = <T>(path: string, body: unknown) => req<T>(path, { method: 'PUT', body: JSON.stringify(body) });
const del = <T>(path: string) => req<T>(path, { method: 'DELETE' });

export const api = {
  programs: {
    list: () => get<any[]>('/programs'),
    stats: (id: number) => get<any>(`/programs/${id}/stats`),
    table: (id: number) => get<any[]>(`/programs/${id}/table`),
    create: (body: any) => post<any>('/programs', body),
    update: (id: number, body: any) => put<any>(`/programs/${id}`, body),
    delete: (id: number) => del<any>(`/programs/${id}`),
  },
  creators: {
    list: (program_id?: number) => get<any[]>(`/creators${program_id ? `?program_id=${program_id}` : ''}`),
    get: (id: number) => get<any>(`/creators/${id}`),
    create: (body: any) => post<any>('/creators', body),
    update: (id: number, body: any) => put<any>(`/creators/${id}`, body),
    delete: (id: number) => del<any>(`/creators/${id}`),
    refresh: () => post<any>('/creators/refresh', {}),
  },
  contents: {
    list: (params?: Record<string, any>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return get<any[]>(`/contents${q}`);
    },
    createEpisode: (body: any) => post<any>('/contents/episodes', body),
    submit: (body: any) => post<any>('/contents/submit', body),
    import: (body: any) => post<any>('/contents/import', body),
    updateLink: (id: number, body: any) => put<any>(`/contents/links/${id}`, body),
    review: () => get<any[]>('/contents/review'),
    updateReview: (id: number, body: any) => put<any>(`/contents/review/${id}`, body),
  },
  games: {
    list: () => get<any[]>('/games'),
    contents: (id: number) => get<any[]>(`/games/${id}/contents`),
    create: (body: any) => post<any>('/games', body),
    update: (id: number, body: any) => put<any>(`/games/${id}`, body),
    delete: (id: number) => del<any>(`/games/${id}`),
  },
  rewards: {
    list: () => get<any[]>('/rewards'),
    byProgram: () => get<any[]>('/rewards/by-program'),
    cpm: () => get<any[]>('/rewards/cpm'),
    create: (body: any) => post<any>('/rewards', body),
    update: (id: number, body: any) => put<any>(`/rewards/${id}`, body),
  },
  analytics: {
    overview: () => get<any>('/analytics/overview'),
    monthly: () => get<any[]>('/analytics/monthly'),
    byPlatform: () => get<any[]>('/analytics/by-platform'),
    byProgram: () => get<any[]>('/analytics/by-program'),
    byCreator: (program_id?: number) => get<any[]>(`/analytics/by-creator${program_id ? `?program_id=${program_id}` : ''}`),
    byType: () => get<any[]>('/analytics/by-type'),
    comparison: (mode: string) => get<any[]>(`/analytics/comparison?mode=${mode}`),
  },
  audit: {
    list: (params?: Record<string, any>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return get<any>(`/audit${q}`);
    },
    tags: () => get<any[]>('/audit/tags'),
  },
  users: {
    list: () => get<any[]>('/users'),
    roles: () => get<any[]>('/users/roles'),
    create: (body: any) => post<any>('/users', body),
    update: (id: number, body: any) => put<any>(`/users/${id}`, body),
    delete: (id: number) => del<any>(`/users/${id}`),
    updateRole: (id: number, body: any) => put<any>(`/users/roles/${id}`, body),
    createRole: (body: any) => post<any>('/users/roles', body),
    changePassword: (body: any) => post<any>('/users/change-password', body),
  },
  export: {
    preview: (params?: Record<string, any>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return get<any>(`/export/preview${q}`);
    },
    export: (body: any) => post<any>('/export', body),
  },
};
