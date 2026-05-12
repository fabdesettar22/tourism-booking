// Gifts API client
import { apiFetch, BASE } from './apiFetch';

export type GiftSubcategory = 'sim_card' | 'flowers' | 'dates' | 'zam_zam' | 'other';

export interface GiftPhoto {
  id: number;
  image: string;
  is_primary: boolean;
  order: number;
  caption: string;
  uploaded_at: string;
}

export interface Gift {
  service_id: number;
  service_name: string;
  subcategory: GiftSubcategory;
  subcategory_display: string;
  default_is_mandatory: boolean;
  base_price: string;
  currency: string;
  profit_margin_pct: string;
  description_ar: string;
  description_en: string;
  notes: string;
  photos: GiftPhoto[];
  primary_photo: string | null;
}

export interface GiftQuote {
  quantity: number;
  unit_price_myr: string;
  base_myr: string;
  margin_pct: string;
  profit_myr: string;
  total_myr: string;
  currency: string;
}

export interface CreateGiftPayload {
  service: number;
  subcategory: GiftSubcategory;
  default_is_mandatory?: boolean;
  base_price: string | number;
  profit_margin_pct?: string | number;
  description_ar?: string;
  description_en?: string;
  notes?: string;
}

const PUBLIC = '/api/v1/services/gifts';
const ADMIN  = '/api/v1/services/admin/gifts';

export const giftsApi = {
  async list(filter?: { subcategory?: GiftSubcategory }): Promise<Gift[]> {
    const q = new URLSearchParams();
    if (filter?.subcategory) q.set('subcategory', filter.subcategory);
    const r = await apiFetch(`${PUBLIC}/?${q.toString()}`);
    if (!r.ok) throw new Error('Failed to load gifts');
    return r.json();
  },

  async retrieve(serviceId: number): Promise<Gift> {
    const r = await apiFetch(`${PUBLIC}/${serviceId}/`);
    if (!r.ok) throw new Error('Not found');
    return r.json();
  },

  async quote(serviceId: number, quantity: number): Promise<GiftQuote> {
    const r = await apiFetch(`${PUBLIC}/${serviceId}/quote/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.detail || 'Quote failed');
    }
    return r.json();
  },

  async create(payload: CreateGiftPayload): Promise<Gift> {
    const r = await apiFetch(`${ADMIN}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) { const err = await r.json(); throw new Error(JSON.stringify(err)); }
    return r.json();
  },

  async update(serviceId: number, payload: Partial<CreateGiftPayload>): Promise<Gift> {
    const r = await apiFetch(`${ADMIN}/${serviceId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) { const err = await r.json(); throw new Error(JSON.stringify(err)); }
    return r.json();
  },

  async delete(serviceId: number): Promise<void> {
    const r = await apiFetch(`${ADMIN}/${serviceId}/`, { method: 'DELETE' });
    if (!r.ok && r.status !== 204) throw new Error('Delete failed');
  },

  async uploadPhoto(serviceId: number, file: File, opts?: { is_primary?: boolean; caption?: string }): Promise<GiftPhoto> {
    const fd = new FormData();
    fd.append('image', file);
    if (opts?.is_primary) fd.append('is_primary', 'true');
    if (opts?.caption)    fd.append('caption', opts.caption);
    const token = localStorage.getItem('access_token');
    const r = await fetch(`${BASE}${ADMIN}/${serviceId}/photos/`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.detail || 'Upload failed');
    }
    return r.json();
  },

  async deletePhoto(serviceId: number, photoId: number): Promise<void> {
    const r = await apiFetch(`${ADMIN}/${serviceId}/photos/${photoId}/`, { method: 'DELETE' });
    if (!r.ok && r.status !== 204) throw new Error('Delete photo failed');
  },

  async setPrimaryPhoto(serviceId: number, photoId: number): Promise<GiftPhoto> {
    const r = await apiFetch(`${ADMIN}/${serviceId}/photos/${photoId}/set-primary/`, { method: 'POST' });
    if (!r.ok) throw new Error('Set primary failed');
    return r.json();
  },
};
