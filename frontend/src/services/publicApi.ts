// Public API — للسائح (لا تتطلب تسجيل دخول)

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export interface PublicHotelListItem {
  id: number;
  name: string;
  stars: number;
  city_name: string | null;
  country_name: string | null;
  image: string | null;
}

export interface PublicHotelPhoto {
  id: number;
  image: string | null;
  is_primary: boolean;
  order: number;
  caption: string;
}

export interface PublicHotelDetail extends PublicHotelListItem {
  description: string;
  address: string;
  country_code: string | null;
  latitude: string | null;
  longitude: string | null;
  amenities: string[];
  check_in_time: string | null;
  check_out_time: string | null;
  photos: PublicHotelPhoto[];
}

export interface PublicServiceListItem {
  id: number;
  name: string;
  service_type: string;
  city_name: string | null;
  country_name: string | null;
  image: string | null;
  final_price: number | null;
  currency: string;
  price_per: string;
}

export interface PublicServicePhoto {
  id: number;
  image: string | null;
  is_primary: boolean;
  order: number;
  caption: string;
}

export interface PublicServiceDetail extends PublicServiceListItem {
  description: string;
  category_name: string | null;
  country_code: string | null;
  duration_hours: string | null;
  max_participants: number;
  includes_guide: boolean;
  includes_meals: boolean;
  pickup_location: string;
  dropoff_location: string;
  meeting_point: string;
  vehicle_type: string;
  vehicle_capacity: number;
  extra_data: Record<string, unknown>;
  photos: PublicServicePhoto[];
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

function unwrap<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && 'results' in data) {
    return (data as PaginatedResponse<T>).results;
  }
  return [];
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API ${path} failed with ${res.status}`);
  }
  return res.json();
}

// ═══════════════════════════════════════════════════════════
// Hotels
// ═══════════════════════════════════════════════════════════

export interface FetchHotelsParams {
  limit?: number;
  offset?: number;
  country_code?: string;
  city_id?: number;
  city_name?: string;
  stars_min?: number;
}

export async function fetchPublicHotels(
  params: FetchHotelsParams = {},
): Promise<PublicHotelListItem[]> {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') search.append(k, String(v));
  });
  if (!search.has('limit')) search.append('limit', '12');

  const data = await get<unknown>(`/api/v1/public/hotels/?${search.toString()}`);
  return unwrap<PublicHotelListItem>(data);
}

export async function fetchPublicHotelById(id: number | string): Promise<PublicHotelDetail> {
  return get<PublicHotelDetail>(`/api/v1/public/hotels/${id}/`);
}

// ═══════════════════════════════════════════════════════════
// Services
// ═══════════════════════════════════════════════════════════

export interface FetchServicesParams {
  limit?: number;
  offset?: number;
  service_type?: string;
  country_code?: string;
  city_id?: number;
  city_name?: string;
}

export async function fetchPublicServices(
  params: FetchServicesParams = {},
): Promise<PublicServiceListItem[]> {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') search.append(k, String(v));
  });
  if (!search.has('limit')) search.append('limit', '12');

  const data = await get<unknown>(`/api/v1/public/services/?${search.toString()}`);
  return unwrap<PublicServiceListItem>(data);
}

export async function fetchPublicServiceById(id: number | string): Promise<PublicServiceDetail> {
  return get<PublicServiceDetail>(`/api/v1/public/services/${id}/`);
}
