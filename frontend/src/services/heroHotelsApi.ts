// Hero Hotels API — admin CRUD

import { apiFetch } from './apiFetch';

export type HeroCardType = 'hotel' | 'partner' | 'sponsor' | 'custom';
export type HeroMediaKind = 'image' | 'video' | 'none';

export interface HeroHotelCard {
  id:               number;
  card_type:        HeroCardType;
  name:             string;
  location:         string;
  stars:            number | null;
  description:      string;
  logo:             string | null;
  card_image:       string | null;
  card_video:       string | null;
  hero_image:       string | null;
  hero_video:       string | null;
  link_url:         string;
  cta_text:         string;
  logo_url:         string | null;
  card_image_url:   string | null;
  card_video_url:   string | null;
  hero_image_url:   string | null;
  hero_video_url:   string | null;
  card_media_kind:  HeroMediaKind;
  hero_media_kind:  HeroMediaKind;
  display_order:    number;
  is_active:        boolean;
  created_at:       string;
  updated_at:       string;
}

export async function listHeroHotels(): Promise<HeroHotelCard[]> {
  const res = await apiFetch('/api/v1/hero-hotels/admin/');
  if (!res.ok) throw new Error('Failed to load hero hotels');
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results || []);
}

export async function getHeroHotel(id: number): Promise<HeroHotelCard> {
  const res = await apiFetch(`/api/v1/hero-hotels/admin/${id}/`);
  if (!res.ok) throw new Error('Not found');
  return res.json();
}

export async function createHeroHotel(formData: FormData): Promise<HeroHotelCard> {
  const res = await apiFetch('/api/v1/hero-hotels/admin/', {
    method: 'POST',
    body: formData,  // multipart/form-data — apiFetch لا يضيف Content-Type عند FormData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(err));
  }
  return res.json();
}

export async function updateHeroHotel(id: number, formData: FormData): Promise<HeroHotelCard> {
  const res = await apiFetch(`/api/v1/hero-hotels/admin/${id}/`, {
    method: 'PATCH',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(err));
  }
  return res.json();
}

export async function deleteHeroHotel(id: number): Promise<void> {
  const res = await apiFetch(`/api/v1/hero-hotels/admin/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
}
