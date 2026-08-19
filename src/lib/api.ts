// API client utility for communicating with the backend
// Automatically attaches Supabase JWT token to all requests

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
  return match ? match[2] : null;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) return null as T;
  return response.json();
}

export const api = {
  // Notes
  notes: {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch<{ data: unknown[]; pagination: unknown }>(`/api/notes${query}`);
    },
    get: (id: string) => apiFetch<{ data: unknown }>(`/api/notes/${id}`),
    create: (body: unknown) =>
      apiFetch<{ data: unknown }>('/api/notes', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (id: string, body: unknown) =>
      apiFetch<{ data: unknown }>(`/api/notes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      apiFetch<null>(`/api/notes/${id}`, { method: 'DELETE' }),
    generate: (id: string) =>
      apiFetch<{ message: string; jobId: string }>(`/api/notes/${id}/generate`, {
        method: 'POST',
      }),
    status: (id: string) =>
      apiFetch<{ data: unknown }>(`/api/notes/${id}/status`),
    updateSection: (noteId: string, sectionId: string, body: unknown) =>
      apiFetch<{ data: unknown }>(`/api/notes/${noteId}/sections/${sectionId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
  },

  // Subjects
  subjects: {
    list: () => apiFetch<{ data: unknown[] }>('/api/subjects'),
    create: (body: unknown) =>
      apiFetch<{ data: unknown }>('/api/subjects', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (id: string, body: unknown) =>
      apiFetch<{ data: unknown }>(`/api/subjects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      apiFetch<null>(`/api/subjects/${id}`, { method: 'DELETE' }),
  },

  // Sources
  sources: {
    extract: (url: string) =>
      apiFetch<{ data: unknown }>('/api/sources/extract', {
        method: 'POST',
        body: JSON.stringify({ url }),
      }),
  },
};
