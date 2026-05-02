// Destinations API — admin CRUD + public list

import { apiFetch } from './apiFetch';

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

interface MultiLang { ar?: string; en?: string; ms?: string }

export interface Destination {
  id:               number;
  name:             MultiLang;
  description:      MultiLang;
  image:            string | null;
  image_url:        string | null;
  city:             number | null;          // City.id (FK)
  city_display:     string;                 // اسم المدينة المعروض
  country_display:  string;                 // اسم الدولة المعروض
  country_iso2:     string;                 // كود ISO2 للدولة
  city_name:        string;                 // legacy
  country_code:     string;                 // legacy
  size:             'large' | 'medium' | 'small';
  display_order:    number;
  is_active:        boolean;
  created_at:       string;
  updated_at:       string;
}

// ── Public ──
export async function fetchPublicDestinations(): Promise<Destination[]> {
  const res = await fetch(`${BASE}/api/v1/site-settings/destinations/`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results || []);
}

// ── Admin ──
export async function listDestinations(): Promise<Destination[]> {
  const res = await apiFetch('/api/v1/site-settings/admin/destinations/');
  if (!res.ok) throw new Error('Failed to load destinations');
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results || []);
}

export async function createDestination(formData: FormData): Promise<Destination> {
  const res = await apiFetch('/api/v1/site-settings/admin/destinations/', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(JSON.stringify(await res.json().catch(() => ({}))));
  return res.json();
}

export async function updateDestination(id: number, formData: FormData): Promise<Destination> {
  const res = await apiFetch(`/api/v1/site-settings/admin/destinations/${id}/`, {
    method: 'PATCH',
    body: formData,
  });
  if (!res.ok) throw new Error(JSON.stringify(await res.json().catch(() => ({}))));
  return res.json();
}

export async function deleteDestination(id: number): Promise<void> {
  const res = await apiFetch(`/api/v1/site-settings/admin/destinations/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
}
