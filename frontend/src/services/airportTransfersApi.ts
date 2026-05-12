// Airport Transfers API client
import { apiFetch, BASE } from './apiFetch';

export interface TransferPhoto {
  id: number;
  image: string;
  is_primary: boolean;
  order: number;
  caption: string;
  uploaded_at: string;
}

export interface Airport {
  id: number;
  code: string;
  name: string;
  city: number | null;
  city_name: string | null;
  is_active: boolean;
}

export interface AirportTransferRow {
  service_id: number;
  service_name: string;
  airport: number;
  airport_detail: Airport;
  hotel: number;
  hotel_name: string;
  hotel_city: string;
  country: number | null;
  country_name: string | null;
  country_code: string | null;
  city: number | null;
  city_name: string | null;
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
  photos: TransferPhoto[];
  primary_photo: string | null;
}

export interface QuoteResult {
  bucket: string;
  base_one_way_myr: string;
  direction: 'to_hotel' | 'to_airport' | 'round_trip';
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

export interface CreateTransferPayload {
  service: number;
  airport: number;
  hotel: number;
  country?: number | null;
  city?: number | null;
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

const PUBLIC = '/api/v1/services/airport-transfers';
const ADMIN  = '/api/v1/services/admin/airport-transfers';

export const airportTransfersApi = {
  // ── Public ───────────────────────────────────────────
  async listAirports(): Promise<Airport[]> {
    const r = await apiFetch('/api/v1/services/airports/');
    if (!r.ok) throw new Error('Failed to load airports');
    return r.json();
  },

  // ── Admin: create new airport (auto-generates code if not provided) ──
  async createAirport(payload: { name: string; code?: string; city?: number | null }): Promise<Airport> {
    const r = await apiFetch('/api/v1/services/admin/airports/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: payload.name,
        code: payload.code,
        city: payload.city ?? null,
        is_active: true,
      }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.detail || JSON.stringify(err) || 'فشل إنشاء المطار');
    }
    return r.json();
  },

  async list(filter?: { airport?: string; hotel?: number }): Promise<AirportTransferRow[]> {
    const q = new URLSearchParams();
    if (filter?.airport) q.set('airport', filter.airport);
    if (filter?.hotel)   q.set('hotel', String(filter.hotel));
    const r = await apiFetch(`${PUBLIC}/?${q.toString()}`);
    if (!r.ok) throw new Error('Failed to load airport transfers');
    return r.json();
  },

  async retrieve(serviceId: number): Promise<AirportTransferRow> {
    const r = await apiFetch(`${PUBLIC}/${serviceId}/`);
    if (!r.ok) throw new Error('Not found');
    return r.json();
  },

  async quote(
    serviceId: number,
    body: { pax: number; direction: string; include_tour_guide?: boolean },
  ): Promise<QuoteResult> {
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

  // ── Admin ────────────────────────────────────────────
  async create(payload: CreateTransferPayload): Promise<AirportTransferRow> {
    const r = await apiFetch(`${ADMIN}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const err = await r.json();
      throw new Error(JSON.stringify(err));
    }
    return r.json();
  },

  async update(serviceId: number, payload: Partial<CreateTransferPayload>): Promise<AirportTransferRow> {
    const r = await apiFetch(`${ADMIN}/${serviceId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const err = await r.json();
      throw new Error(JSON.stringify(err));
    }
    return r.json();
  },

  async delete(serviceId: number): Promise<void> {
    const r = await apiFetch(`${ADMIN}/${serviceId}/`, { method: 'DELETE' });
    if (!r.ok && r.status !== 204) throw new Error('Delete failed');
  },

  // ── Photos ────────────────────────────────────────────
  async uploadPhoto(serviceId: number, file: File, opts?: { is_primary?: boolean; caption?: string }): Promise<TransferPhoto> {
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

  async setPrimaryPhoto(serviceId: number, photoId: number): Promise<TransferPhoto> {
    const r = await apiFetch(`${ADMIN}/${serviceId}/photos/${photoId}/set-primary/`, { method: 'POST' });
    if (!r.ok) throw new Error('Set primary failed');
    return r.json();
  },
};

export const BASE_URL = BASE;
