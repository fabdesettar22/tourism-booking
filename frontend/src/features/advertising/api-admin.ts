/**
 * frontend/src/features/advertising/api-admin.ts
 *
 * API client للأدمن — CRUD كامل للإعلانات.
 *
 * يستخدم apiFetch (JWT تلقائي) للمصادقة.
 */

import { apiFetch } from '../../services/apiFetch';
import type { AdType, Placement, DeviceType } from './types';

const BASE = '/api/v1/advertising';

// ═══════════════════════════════════════════════════════
// Types للأدمن
// ═══════════════════════════════════════════════════════

export interface AdminAd {
  uid: string;
  id?: number;
  name: string;
  ad_type: AdType;
  content: Record<string, { title?: string; description?: string; button?: string }>;
  image_desktop: string | null;
  image_mobile: string | null;
  image_alt_text: string;
  link_url: string;
  link_target: 'SAME_TAB' | 'NEW_TAB';
  linked_hotel: number | null;
  linked_package: string | null;
  linked_agency: number | null;
  is_active: boolean;
  priority: number;
  weight: number;
  cost: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  
  // computed by backend
  targeting_summary?: {
    languages?: string[];
    countries?: string[];
    devices?: string[];
    user_types?: string[];
    max_views_per_user_day?: number | null;
    max_views_per_session?: number | null;
  };
  placements_count?: number;
  stats?: {
    views: number;
    clicks: number;
    ctr: number;
  };
}

export interface AdminListResponse {
  count: number;
  ads: AdminAd[];
}

export interface AdminStats {
  total_ads: number;
  active_ads: number;
  inactive_ads: number;
  period_days: number;
  views: number;
  clicks: number;
  closes: number;
  ctr: number;
  by_type: Array<{ ad_type: string; count: number }>;
  top_ads: Array<{
    id: number;
    name: string;
    ad_type: string;
    views: number;
    clicks: number;
    ctr: number;
  }>;
}

export interface AdFormData {
  name: string;
  ad_type: AdType;
  content: Record<string, { title?: string; description?: string; button?: string }>;
  image_desktop?: File;
  image_mobile?: File;
  image_alt_text?: string;
  link_url?: string;
  link_target?: 'SAME_TAB' | 'NEW_TAB';
  is_active?: boolean;
  priority?: number;
  weight?: number;
  
  // Placement (required)
  placement_key: Placement;
  start_date?: string;
  end_date?: string;
  
  // Targeting (optional - default: للجميع)
  languages?: string[];
  countries?: string[];
  devices?: DeviceType[];
  user_types?: string[];
  max_views_per_user_day?: number;
  max_views_per_session?: number;
}

// ═══════════════════════════════════════════════════════
// API Functions
// ═══════════════════════════════════════════════════════

/**
 * قائمة كل الإعلانات (للأدمن).
 */
export async function fetchAllAds(): Promise<AdminListResponse> {
  const res = await apiFetch(`${BASE}/admin/ads/`);
  if (!res.ok) throw new Error('فشل جلب قائمة الإعلانات');
  return res.json();
}

/**
 * تفاصيل إعلان محدد.
 */
export async function fetchAdDetail(adId: number): Promise<AdminAd> {
  const res = await apiFetch(`${BASE}/admin/ads/${adId}/`);
  if (!res.ok) throw new Error('فشل جلب تفاصيل الإعلان');
  return res.json();
}

/**
 * إنشاء إعلان جديد (مع image upload).
 */
export async function createAd(data: AdFormData): Promise<AdminAd> {
  const formData = buildFormData(data);
  
  const res = await apiFetch(`${BASE}/admin/ads/create/`, {
    method: 'POST',
    body: formData,
    // لا نضع Content-Type — المتصفح سيُضيف boundary لـ multipart
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'فشل إنشاء الإعلان');
  }
  return res.json();
}

/**
 * تعديل إعلان.
 */
export async function updateAd(adId: number, data: Partial<AdFormData>): Promise<AdminAd> {
  const formData = buildFormData(data);
  
  const res = await apiFetch(`${BASE}/admin/ads/${adId}/`, {
    method: 'PATCH',
    body: formData,
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'فشل تعديل الإعلان');
  }
  return res.json();
}

/**
 * حذف إعلان.
 */
export async function deleteAd(adId: number): Promise<void> {
  const res = await apiFetch(`${BASE}/admin/ads/${adId}/`, {
    method: 'DELETE',
  });
  
  if (!res.ok && res.status !== 204) {
    throw new Error('فشل حذف الإعلان');
  }
}

/**
 * تبديل حالة الإعلان (تفعيل/إيقاف).
 */
export async function toggleAd(adId: number): Promise<{ id: number; is_active: boolean }> {
  const res = await apiFetch(`${BASE}/admin/ads/${adId}/toggle/`, {
    method: 'POST',
  });
  
  if (!res.ok) throw new Error('فشل تغيير الحالة');
  return res.json();
}

/**
 * إحصائيات عامة.
 */
export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await apiFetch(`${BASE}/admin/stats/`);
  if (!res.ok) throw new Error('فشل جلب الإحصائيات');
  return res.json();
}

// ═══════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════

/**
 * يحول AdFormData إلى FormData (للـ image upload).
 */
function buildFormData(data: Partial<AdFormData>): FormData {
  const fd = new FormData();
  
  // Files first
  if (data.image_desktop instanceof File) {
    fd.append('image_desktop', data.image_desktop);
  }
  if (data.image_mobile instanceof File) {
    fd.append('image_mobile', data.image_mobile);
  }
  
  // Simple fields
  const simpleFields: (keyof AdFormData)[] = [
    'name', 'ad_type', 'image_alt_text', 'link_url', 'link_target',
    'placement_key', 'start_date', 'end_date',
    'is_active', 'priority', 'weight',
    'max_views_per_user_day', 'max_views_per_session',
  ];
  
  for (const field of simpleFields) {
    const value = data[field];
    if (value !== undefined && value !== null && value !== '') {
      fd.append(field, String(value));
    }
  }
  
  // JSON fields (content, targeting arrays)
  if (data.content) {
    fd.append('content', JSON.stringify(data.content));
  }
  if (data.languages) {
    fd.append('languages', JSON.stringify(data.languages));
  }
  if (data.countries) {
    fd.append('countries', JSON.stringify(data.countries));
  }
  if (data.devices) {
    fd.append('devices', JSON.stringify(data.devices));
  }
  if (data.user_types) {
    fd.append('user_types', JSON.stringify(data.user_types));
  }
  
  return fd;
}
