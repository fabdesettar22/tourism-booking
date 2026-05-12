// Tours / Excursions API client
import { apiFetch, BASE } from './apiFetch';

export interface TourPhoto {
  id: number;
  image: string;
  is_primary: boolean;
  order: number;
  caption: string;
  uploaded_at: string;
}

export type TourType = 'city_tour' | 'day_trip' | 'inter_city' | 'island_jetty';
export type Duration = 'half_day' | 'full_day' | 'one_way';
export type Direction = 'one_way' | 'round_trip';

export interface Tour {
  service_id: number;
  service_name: string;
  tour_type: TourType;
  tour_type_display: string;
  duration: Duration;
  duration_display: string;
  country: number | null;
  country_name: string | null;
  country_code: string | null;
  city: number | null;
  city_name: string | null;
  origin_city: number | null;
  origin_city_name: string | null;
  origin_text: string;
  destination_city: number | null;
  destination_city_name: string | null;
  destination_text: string;
  price_pax_1_2: string | null;
  price_pax_3_4: string | null;
  price_pax_5_6: string | null;
  price_pax_7_8: string | null;
  price_pax_10_12: string | null;
  price_pax_14: string | null;
  price_pax_40_bus: string | null;
  margin_pct_1_2: string;
  margin_pct_3_4: string;
  margin_pct_5_6: string;
  margin_pct_7_8: string;
  margin_pct_10_12: string;
  margin_pct_14: string;
  margin_pct_40_bus: string;
  tour_guide_fee_myr: string | null;
  tour_guide_margin_pct: string;
  currency: string;
  notes: string;
  description_ar: string;
  description_en: string;
  photos: TourPhoto[];
  primary_photo: string | null;
}

export interface TourQuote {
  bucket: string;
  base_one_way_myr: string;
  direction: Direction;
  direction_multiplier: number;
  base_myr: string;
  margin_pct: string;
  profit_myr: string;
  tour_guide_myr: string;
  guide_margin_pct: string;
  guide_profit_myr: string;
  total_myr: string;
  currency: string;
}

export interface CreateTourPayload {
  service: number;
  tour_type: TourType;
  duration: Duration;
  country?: number | null;
  city?: number | null;
  origin_city?: number | null;
  origin_text?: string;
  destination_city?: number | null;
  destination_text: string;
  price_pax_1_2: string | number;
  price_pax_3_4?: string | number | null;
  price_pax_5_6?: string | number | null;
  price_pax_7_8?: string | number | null;
  price_pax_10_12?: string | number | null;
  price_pax_14?: string | number | null;
  price_pax_40_bus?: string | number | null;
  margin_pct_1_2?: string | number;
  margin_pct_3_4?: string | number;
  margin_pct_5_6?: string | number;
  margin_pct_7_8?: string | number;
  margin_pct_10_12?: string | number;
  margin_pct_14?: string | number;
  margin_pct_40_bus?: string | number;
  tour_guide_fee_myr?: string | number | null;
  tour_guide_margin_pct?: string | number;
  notes?: string;
  description_ar?: string;
  description_en?: string;
}

const PUBLIC = '/api/v1/services/tours';
const ADMIN  = '/api/v1/services/admin/tours';

export const toursApi = {
  async list(filter?: { type?: TourType; duration?: Duration }): Promise<Tour[]> {
    const q = new URLSearchParams();
    if (filter?.type)     q.set('type', filter.type);
    if (filter?.duration) q.set('duration', filter.duration);
    const r = await apiFetch(`${PUBLIC}/?${q.toString()}`);
    if (!r.ok) throw new Error('Failed to load tours');
    return r.json();
  },

  async retrieve(serviceId: number): Promise<Tour> {
    const r = await apiFetch(`${PUBLIC}/${serviceId}/`);
    if (!r.ok) throw new Error('Not found');
    return r.json();
  },

  async quote(serviceId: number, body: { pax: number; direction?: Direction; include_tour_guide?: boolean }): Promise<TourQuote> {
    const r = await apiFetch(`${PUBLIC}/${serviceId}/quote/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.detail || 'Quote failed');
    }
    return r.json();
  },

  async create(payload: CreateTourPayload): Promise<Tour> {
    const r = await apiFetch(`${ADMIN}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) { const err = await r.json(); throw new Error(JSON.stringify(err)); }
    return r.json();
  },

  async update(serviceId: number, payload: Partial<CreateTourPayload>): Promise<Tour> {
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

  // ── Photos ────────────────────────────────────────────
  async uploadPhoto(serviceId: number, file: File, opts?: { is_primary?: boolean; caption?: string }): Promise<TourPhoto> {
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

  async setPrimaryPhoto(serviceId: number, photoId: number): Promise<TourPhoto> {
    const r = await apiFetch(`${ADMIN}/${serviceId}/photos/${photoId}/set-primary/`, { method: 'POST' });
    if (!r.ok) throw new Error('Set primary failed');
    return r.json();
  },
};

export const TOUR_TYPE_LABELS: Record<TourType, string> = {
  city_tour:    'جولة مدينة',
  day_trip:     'رحلة نهارية',
  inter_city:   'نقل بين المدن',
  island_jetty: 'نقل إلى الجزر',
};

export const DURATION_LABELS: Record<Duration, string> = {
  half_day: 'نصف يوم',
  full_day: 'يوم كامل',
  one_way:  'اتجاه واحد',
};
