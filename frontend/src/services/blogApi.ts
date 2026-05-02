// Blog API client
const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function http<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) return null as T;
  return res.json();
}

// ─── Types ─────────────────────────────────────────────
export type BlogStatus = 'draft' | 'published' | 'scheduled';
export type BlogLang = 'ar' | 'en' | 'ms';

export interface BlogCategory {
  id: number;
  name_ar: string; name_en: string; name_ms: string;
  slug: string;
  target_audience: 'tourist' | 'partner' | 'supplier' | 'all';
  color: string;
  icon: string;
  order: number;
}

export interface BlogTag {
  id: number;
  name_ar: string; name_en: string; name_ms: string;
  slug: string;
}

export interface BlogAuthorMini {
  id: number;
  full_name: string;
  email: string;
}

export interface BlogPostListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image: string | null;
  category: BlogCategory | null;
  tags: BlogTag[];
  language: BlogLang;
  status: BlogStatus;
  published_at: string | null;
  read_time: number;
  view_count: number;
  is_featured: boolean;
  author: BlogAuthorMini;
}

export interface BlogRelatedHotel {
  hotel_id: number;
  name: string;
  image: string | null;
  city_name: string | null;
  stars: number;
  order: number;
}

export interface BlogRelatedService {
  service_id: number;
  name: string;
  image: string | null;
  service_type: string;
  order: number;
}

export interface BlogPostDetail extends BlogPostListItem {
  content: string;
  meta_title: string;
  meta_description: string;
  og_image: string | null;
  translation_group: string | null;
  scheduled_at: string | null;
  updated_at: string;
  created_at: string;
  related_hotels: BlogRelatedHotel[];
  related_services: BlogRelatedService[];
}

export interface BlogTranslation {
  language: BlogLang;
  slug: string;
  title: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface BlogStats {
  total: number;
  published: number;
  drafts: number;
  scheduled: number;
  total_views: number;
}

// ─── Public ────────────────────────────────────────────
export interface PublicListParams {
  lang?: BlogLang;
  category?: string;
  tag?: string;
  featured?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}

export const blogApi = {
  list(params: PublicListParams = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
    });
    return http<Paginated<BlogPostListItem>>(`/api/v1/blog/posts/?${q.toString()}`);
  },
  get(slug: string) { return http<BlogPostDetail>(`/api/v1/blog/posts/${slug}/`); },
  related(slug: string) { return http<BlogPostListItem[]>(`/api/v1/blog/posts/related/${slug}/`); },
  translations(slug: string) { return http<BlogTranslation[]>(`/api/v1/blog/posts/${slug}/translations/`); },
  categories() { return http<BlogCategory[]>('/api/v1/blog/categories/'); },
  tags() { return http<BlogTag[]>('/api/v1/blog/tags/'); },

  // ─── Admin ─────────────────────────────────────────
  adminList(params: Record<string, any> = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
    });
    return http<Paginated<BlogPostListItem>>(`/api/v1/blog/admin/posts/?${q.toString()}`);
  },
  adminGet(id: string) { return http<BlogPostDetail>(`/api/v1/blog/admin/posts/${id}/`); },
  adminCreate(payload: any) {
    return http<BlogPostDetail>('/api/v1/blog/admin/posts/', {
      method: 'POST', body: JSON.stringify(payload),
    });
  },
  adminUpdate(id: string, payload: any) {
    return http<BlogPostDetail>(`/api/v1/blog/admin/posts/${id}/`, {
      method: 'PATCH', body: JSON.stringify(payload),
    });
  },
  adminDelete(id: string) {
    return http<void>(`/api/v1/blog/admin/posts/${id}/`, { method: 'DELETE' });
  },
  adminPublish(id: string) {
    return http<BlogPostDetail>(`/api/v1/blog/admin/posts/${id}/publish/`, { method: 'POST' });
  },
  adminUnpublish(id: string) {
    return http<BlogPostDetail>(`/api/v1/blog/admin/posts/${id}/unpublish/`, { method: 'POST' });
  },
  adminDuplicate(id: string) {
    return http<BlogPostDetail>(`/api/v1/blog/admin/posts/${id}/duplicate/`, { method: 'POST' });
  },
  adminRevisions(id: string) {
    return http<{ id: number; title: string; created_at: string; edited_by_email: string }[]>(
      `/api/v1/blog/admin/posts/${id}/revisions/`,
    );
  },
  adminRestore(id: string, revisionId: number) {
    return http<BlogPostDetail>(
      `/api/v1/blog/admin/posts/${id}/restore/${revisionId}/`, { method: 'POST' },
    );
  },
  async adminUploadImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch(`${BASE}/api/v1/blog/admin/upload-image/`, {
      method: 'POST', headers: authHeaders(), body: fd,
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.url;
  },
  adminStats() { return http<BlogStats>('/api/v1/blog/admin/stats/'); },
  adminCategoriesList() { return http<BlogCategory[]>('/api/v1/blog/admin/categories/'); },
  adminCategoriesCreate(p: Partial<BlogCategory>) {
    return http<BlogCategory>('/api/v1/blog/admin/categories/', { method: 'POST', body: JSON.stringify(p) });
  },
  adminCategoriesUpdate(id: number, p: Partial<BlogCategory>) {
    return http<BlogCategory>(`/api/v1/blog/admin/categories/${id}/`, { method: 'PATCH', body: JSON.stringify(p) });
  },
  adminCategoriesDelete(id: number) {
    return http<void>(`/api/v1/blog/admin/categories/${id}/`, { method: 'DELETE' });
  },
  adminTagsList() { return http<BlogTag[]>('/api/v1/blog/admin/tags/'); },
  adminTagsCreate(p: Partial<BlogTag>) {
    return http<BlogTag>('/api/v1/blog/admin/tags/', { method: 'POST', body: JSON.stringify(p) });
  },
  adminTagsUpdate(id: number, p: Partial<BlogTag>) {
    return http<BlogTag>(`/api/v1/blog/admin/tags/${id}/`, { method: 'PATCH', body: JSON.stringify(p) });
  },
  adminTagsDelete(id: number) {
    return http<void>(`/api/v1/blog/admin/tags/${id}/`, { method: 'DELETE' });
  },
};
