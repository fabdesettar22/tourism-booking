// Hotel Rates API client — YOUNEED 2026 schema
import { apiFetch } from './apiFetch';

export type BaseType   = 'room' | 'suite' | 'villa' | 'chalet' | 'apartment' | 'bungalow' | 'package';
export type ViewType   = 'standard' | 'sea' | 'hill' | 'garden' | 'pool' | 'city' | 'klcc' | 'kl_tower' | 'beach' | 'lagoon' | 'beachfront' | 'runaway' | 'street' | 'other';
export type PricingTier = 'fit' | 'fit_normal' | 'fit_promo' | 'git' | 'git_normal' | 'git_series';
export type DayType    = 'all' | 'weekday' | 'weekend';
export type SeasonType = 'flat' | 'low' | 'shoulder' | 'normal' | 'high' | 'peak' | 'super_peak' | 'tactical_promo';
export type Occupancy  = 'single' | 'double' | 'triple' | 'quad';
export type SurchargeType = 'fixed' | 'percentage';
export type InclusionUnit = 'pax' | 'night' | 'piece' | 'voucher' | 'other';

export interface RoomInclusion {
  id: number;
  room_category: number;
  label: string;
  quantity: number;
  unit: InclusionUnit;
  unit_display?: string;
  sort_order: number;
}

export interface RoomCategory {
  id: number;
  hotel: number;
  name: string;
  name_ar: string;
  base_type: BaseType;
  base_type_display?: string;
  view_type: ViewType;
  view_type_display?: string;
  view_custom: string;
  pax: number;
  max_occupancy: number;
  bed_config: string;
  quantity_in_hotel: number;
  max_extra_beds: number;
  max_child_beds: number;
  is_package: boolean;
  description: string;
  image: string | null;
  is_active: boolean;
  sort_order: number;
  inclusions: RoomInclusion[];
  photos?: RoomCategoryPhoto[];
  created_at?: string;
  updated_at?: string;
}

export interface RoomCategoryPhoto {
  id: number;
  room_category: number;
  image: string;
  is_primary: boolean;
  order: number;
  caption: string;
  uploaded_at: string;
}

export interface PricingTierDef {
  id: number;
  hotel: number;
  name: string;                 // free-text tier name
  min_rooms_required: number;
  max_rooms_required: number | null;
  profit_margin_pct: string;
  sort_order: number;
  is_active: boolean;
}

export interface HotelGuestPricing {
  id: number;
  hotel: number;
  tier: number;                 // FK → PricingTierDef.id
  tier_name?: string;
  extra_bed_price: string | null;
  infant_age_from: number;
  infant_age_to: number;
  infant_price: string | null;
  child_with_bed_age_from: number;
  child_with_bed_age_to: number;
  child_with_bed_price: string | null;
  child_no_bed_age_from: number;
  child_no_bed_age_to: number;
  child_no_bed_price: string | null;
  child_breakfast_age_from: number;
  child_breakfast_age_to: number;
  child_breakfast_price: string | null;
  notes: string;
}

export interface HotelSeasonDateRange {
  id: number;
  season: number;
  start_date: string;
  end_date: string;
  label: string;
}

export interface HotelSeason {
  id: number;
  hotel: number;
  name: string;
  season_type: SeasonType;
  season_type_display?: string;
  sort_order: number;
  notes: string;
  is_active: boolean;
  date_ranges: HotelSeasonDateRange[];
  created_at?: string;
  updated_at?: string;
}

export interface RoomRate {
  id: number;
  room_category: number;
  season: number | null;
  pricing_tier: PricingTier;
  pricing_tier_display?: string;
  day_type: DayType;
  day_type_display?: string;
  occupancy: Occupancy;
  occupancy_display?: string;
  base_rate: string;
  rate_with_breakfast: string | null;
  extra_bed_price: string | null;
  child_with_bed_price: string | null;
  child_without_bed_price: string | null;
  infant_bed_price: string | null;
  kid_breakfast_price: string | null;
  kid_breakfast_free: boolean;
  kid_breakfast_age_limit: number | null;
  tax_inclusive: boolean;
  markup_pct: string;
  currency: string;
  notes: string;
  is_active: boolean;
}

export interface HotelSurcharge {
  id: number;
  hotel: number;
  room_category: number | null;
  name: string;
  surcharge_type: SurchargeType;
  surcharge_type_display?: string;
  amount: string;
  weekday: number | null;
  weekday_display?: string;
  date_start: string | null;
  date_end: string | null;
  applies_to_tier: PricingTier | '';
  notes: string;
  is_active: boolean;
}

const PUBLIC = '/api/v1/hotel-rates';
const ADMIN  = '/api/v1/hotel-rates/admin';

// Generic helper
async function jsonOrThrow<T>(r: Response, errMsg: string): Promise<T> {
  if (!r.ok) {
    let detail = errMsg;
    try { const e = await r.json(); detail = JSON.stringify(e); } catch {}
    throw new Error(detail);
  }
  return r.json();
}

// ─── Quote (Calculator) ────────────────────────────────────
export interface QuoteRequest {
  room_category: number;
  check_in: string;
  check_out: string;
  pricing_tier?: string;          // free-text tier name
  occupancy?: Occupancy;
  number_of_rooms?: number;       // NEW
  adults?: number;
  children_with_bed?: number;
  children_without_bed?: number;
  infants?: number;
  extra_beds?: number;
  apply_markup?: boolean;
  apply_tax?: boolean;
}

export interface QuoteSurchargeDetail {
  name: string;
  amount: string;
  type: 'fixed' | 'percentage';
}

export interface QuoteLine {
  date: string;
  weekday: number;
  weekday_label: string;
  day_type: DayType;
  season: string | null;
  rooms_count: number;
  base_rate_per_room: string;
  rooms_amount: string;
  extra_beds_amount: string;
  infant_amount: string;
  child_with_bed_amount: string;
  child_without_bed_amount: string;
  child_breakfast_amount: string;
  surcharges_amount: string;
  surcharges_detail: QuoteSurchargeDetail[];
  night_total: string;
}

export interface QuoteResult {
  nights: number;
  currency: string;
  pricing_tier: string;
  occupancy: Occupancy;
  guests: {
    adults: number;
    children_with_bed: number;
    children_without_bed: number;
    infants: number;
    extra_beds: number;
    rooms: number;
  };
  check_in: string;
  check_out: string;
  hotel: { id: number; name: string; stars: number };
  room_category: { id: number; name: string; view_type: string; pax: number };
  lines: QuoteLine[];
  totals: {
    rooms_total: string;
    extra_beds_total: string;
    infants_total: string;
    children_with_bed_total: string;
    children_without_bed_total: string;
    child_breakfast_total: string;
    surcharges_total: string;
    subtotal: string;
    margin_pct: string;
    markup_amount: string;
    tax_per_unit: string;
    tax_total: string;
    grand_total: string;
  };
}

export const hotelRatesApi = {
  // ── Quote ───────────────────────────────────────────────
  quote: async (req: QuoteRequest): Promise<QuoteResult> => {
    const r = await apiFetch(`${PUBLIC}/quote/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.detail || JSON.stringify(err));
    }
    return r.json();
  },
  // ── Categories ─────────────────────────────────────────
  listCategories: async (filter?: { hotel?: number; base_type?: BaseType; view_type?: ViewType }): Promise<RoomCategory[]> => {
    const q = new URLSearchParams();
    if (filter?.hotel) q.set('hotel', String(filter.hotel));
    if (filter?.base_type) q.set('base_type', filter.base_type);
    if (filter?.view_type) q.set('view_type', filter.view_type);
    const r = await apiFetch(`${PUBLIC}/categories/?${q}`);
    return jsonOrThrow(r, 'Failed to load categories');
  },
  createCategory: async (payload: Partial<RoomCategory>): Promise<RoomCategory> => {
    const r = await apiFetch(`${ADMIN}/categories/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    return jsonOrThrow(r, 'Create failed');
  },
  updateCategory: async (id: number, payload: Partial<RoomCategory>): Promise<RoomCategory> => {
    const r = await apiFetch(`${ADMIN}/categories/${id}/`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    return jsonOrThrow(r, 'Update failed');
  },
  deleteCategory: async (id: number): Promise<void> => {
    const r = await apiFetch(`${ADMIN}/categories/${id}/`, { method: 'DELETE' });
    if (!r.ok && r.status !== 204) throw new Error('Delete failed');
  },

  // Room category photos
  listCategoryPhotos: async (categoryId: number): Promise<RoomCategoryPhoto[]> => {
    const r = await apiFetch(`${ADMIN}/categories/${categoryId}/photos/`);
    return jsonOrThrow(r, 'Failed to load room photos');
  },
  uploadCategoryPhoto: async (categoryId: number, file: File, opts?: { is_primary?: boolean; caption?: string }): Promise<RoomCategoryPhoto> => {
    const fd = new FormData();
    fd.append('image', file);
    if (opts?.is_primary) fd.append('is_primary', 'true');
    if (opts?.caption) fd.append('caption', opts.caption);
    const token = localStorage.getItem('access_token');
    const r = await fetch(`${BASE}${ADMIN}/categories/${categoryId}/photos/`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.detail || 'Upload failed'); }
    return r.json();
  },
  deleteCategoryPhoto: async (categoryId: number, photoId: number): Promise<void> => {
    const r = await apiFetch(`${ADMIN}/categories/${categoryId}/photos/${photoId}/`, { method: 'DELETE' });
    if (!r.ok && r.status !== 204) throw new Error('Delete photo failed');
  },
  setPrimaryCategoryPhoto: async (categoryId: number, photoId: number): Promise<RoomCategoryPhoto> => {
    const r = await apiFetch(`${ADMIN}/categories/${categoryId}/photos/${photoId}/set-primary/`, { method: 'POST' });
    return jsonOrThrow(r, 'Set primary failed');
  },

  // ── Seasons ────────────────────────────────────────────
  listSeasons: async (filter?: { hotel?: number }): Promise<HotelSeason[]> => {
    const q = new URLSearchParams();
    if (filter?.hotel) q.set('hotel', String(filter.hotel));
    const r = await apiFetch(`${PUBLIC}/seasons/?${q}`);
    return jsonOrThrow(r, 'Failed to load seasons');
  },
  createSeason: async (payload: Partial<HotelSeason>): Promise<HotelSeason> => {
    const r = await apiFetch(`${ADMIN}/seasons/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    return jsonOrThrow(r, 'Create season failed');
  },
  updateSeason: async (id: number, payload: Partial<HotelSeason>): Promise<HotelSeason> => {
    const r = await apiFetch(`${ADMIN}/seasons/${id}/`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    return jsonOrThrow(r, 'Update season failed');
  },
  deleteSeason: async (id: number): Promise<void> => {
    const r = await apiFetch(`${ADMIN}/seasons/${id}/`, { method: 'DELETE' });
    if (!r.ok && r.status !== 204) throw new Error('Delete season failed');
  },

  // ── Season date ranges ─────────────────────────────────
  createSeasonRange: async (payload: { season: number; start_date: string; end_date: string; label?: string }): Promise<HotelSeasonDateRange> => {
    const r = await apiFetch(`${ADMIN}/season-ranges/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    return jsonOrThrow(r, 'Create range failed');
  },
  deleteSeasonRange: async (id: number): Promise<void> => {
    const r = await apiFetch(`${ADMIN}/season-ranges/${id}/`, { method: 'DELETE' });
    if (!r.ok && r.status !== 204) throw new Error('Delete range failed');
  },

  // ── Rates ──────────────────────────────────────────────
  listRates: async (filter?: { category?: number; hotel?: number; tier?: PricingTier }): Promise<RoomRate[]> => {
    const q = new URLSearchParams();
    if (filter?.category) q.set('category', String(filter.category));
    if (filter?.hotel) q.set('hotel', String(filter.hotel));
    if (filter?.tier) q.set('tier', filter.tier);
    const r = await apiFetch(`${PUBLIC}/rates/?${q}`);
    return jsonOrThrow(r, 'Failed to load rates');
  },
  createRate: async (payload: Partial<RoomRate>): Promise<RoomRate> => {
    const r = await apiFetch(`${ADMIN}/rates/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    return jsonOrThrow(r, 'Create rate failed');
  },
  updateRate: async (id: number, payload: Partial<RoomRate>): Promise<RoomRate> => {
    const r = await apiFetch(`${ADMIN}/rates/${id}/`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    return jsonOrThrow(r, 'Update rate failed');
  },
  deleteRate: async (id: number): Promise<void> => {
    const r = await apiFetch(`${ADMIN}/rates/${id}/`, { method: 'DELETE' });
    if (!r.ok && r.status !== 204) throw new Error('Delete rate failed');
  },

  // ── Surcharges ─────────────────────────────────────────
  listSurcharges: async (filter?: { hotel?: number }): Promise<HotelSurcharge[]> => {
    const r = await apiFetch(`${ADMIN}/surcharges/${filter?.hotel ? `?hotel=${filter.hotel}` : ''}`);
    return jsonOrThrow(r, 'Failed to load surcharges');
  },
  createSurcharge: async (payload: Partial<HotelSurcharge>): Promise<HotelSurcharge> => {
    const r = await apiFetch(`${ADMIN}/surcharges/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    return jsonOrThrow(r, 'Create surcharge failed');
  },
  deleteSurcharge: async (id: number): Promise<void> => {
    const r = await apiFetch(`${ADMIN}/surcharges/${id}/`, { method: 'DELETE' });
    if (!r.ok && r.status !== 204) throw new Error('Delete surcharge failed');
  },

  // ── Pricing tier defs ──────────────────────────────────
  listPricingTiers: async (filter?: { hotel?: number }): Promise<PricingTierDef[]> => {
    const q = new URLSearchParams();
    if (filter?.hotel) q.set('hotel', String(filter.hotel));
    const r = await apiFetch(`${PUBLIC}/pricing-tiers/?${q}`);
    return jsonOrThrow(r, 'Failed to load tiers');
  },
  createPricingTier: async (payload: Partial<PricingTierDef>): Promise<PricingTierDef> => {
    const r = await apiFetch(`${ADMIN}/pricing-tiers/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    return jsonOrThrow(r, 'Create tier failed');
  },
  updatePricingTier: async (id: number, payload: Partial<PricingTierDef>): Promise<PricingTierDef> => {
    const r = await apiFetch(`${ADMIN}/pricing-tiers/${id}/`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    return jsonOrThrow(r, 'Update tier failed');
  },
  deletePricingTier: async (id: number): Promise<void> => {
    const r = await apiFetch(`${ADMIN}/pricing-tiers/${id}/`, { method: 'DELETE' });
    if (!r.ok && r.status !== 204) throw new Error('Delete tier failed');
  },

  // ── Hotel guest pricing ────────────────────────────────
  listGuestPricing: async (filter?: { hotel?: number }): Promise<HotelGuestPricing[]> => {
    const q = new URLSearchParams();
    if (filter?.hotel) q.set('hotel', String(filter.hotel));
    const r = await apiFetch(`${PUBLIC}/guest-pricing/?${q}`);
    return jsonOrThrow(r, 'Failed to load guest pricing');
  },
  createGuestPricing: async (payload: Partial<HotelGuestPricing>): Promise<HotelGuestPricing> => {
    const r = await apiFetch(`${ADMIN}/guest-pricing/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    return jsonOrThrow(r, 'Create guest pricing failed');
  },
  updateGuestPricing: async (id: number, payload: Partial<HotelGuestPricing>): Promise<HotelGuestPricing> => {
    const r = await apiFetch(`${ADMIN}/guest-pricing/${id}/`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    return jsonOrThrow(r, 'Update guest pricing failed');
  },
  deleteGuestPricing: async (id: number): Promise<void> => {
    const r = await apiFetch(`${ADMIN}/guest-pricing/${id}/`, { method: 'DELETE' });
    if (!r.ok && r.status !== 204) throw new Error('Delete guest pricing failed');
  },

  // ── Inclusions ─────────────────────────────────────────
  createInclusion: async (payload: Partial<RoomInclusion>): Promise<RoomInclusion> => {
    const r = await apiFetch(`${ADMIN}/inclusions/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    return jsonOrThrow(r, 'Create inclusion failed');
  },
  deleteInclusion: async (id: number): Promise<void> => {
    const r = await apiFetch(`${ADMIN}/inclusions/${id}/`, { method: 'DELETE' });
    if (!r.ok && r.status !== 204) throw new Error('Delete inclusion failed');
  },
};
