// Homepage Config + Testimonials API

import { apiFetch } from './apiFetch';

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// ── Types ──────────────────────────────────────────────
interface MultiLang { ar?: string; en?: string; ms?: string }

export interface HomepageConfig {
  id: number;
  // Hero
  hero_badge:           MultiLang;
  hero_title:           MultiLang;
  hero_title_highlight: MultiLang;
  hero_subtitle:        MultiLang;
  search_placeholder:   MultiLang;
  // Stats
  stats_visible:        boolean;
  stats_customers:      number;
  stats_destinations:   number;
  stats_suppliers:      number;
  stats_partners:       number;
  // Visibility
  show_destinations:    boolean;
  show_hotels:          boolean;
  show_services:        boolean;
  show_trust_section:   boolean;
  show_testimonials:    boolean;
  show_supplier_cta:    boolean;
  show_categories:      boolean;
  // Limits
  hotels_limit:         number;
  services_limit:       number;
  // Trust badges
  trust_badge_1_title:    MultiLang;
  trust_badge_1_subtitle: MultiLang;
  trust_badge_2_title:    MultiLang;
  trust_badge_2_subtitle: MultiLang;
  trust_badge_3_title:    MultiLang;
  trust_badge_3_subtitle: MultiLang;
  trust_badge_4_title:    MultiLang;
  trust_badge_4_subtitle: MultiLang;
  updated_at:             string;
}

export interface Testimonial {
  id:            number;
  name:          string;
  location:      string;
  country_code:  string;
  text:          MultiLang;
  rating:        number;
  avatar:        string | null;
  avatar_url:    string | null;
  is_active:     boolean;
  display_order: number;
  created_at:    string;
}

// ── Public API ──────────────────────────────────────────
export async function fetchHomepageConfig(): Promise<HomepageConfig> {
  const res = await fetch(`${BASE}/api/v1/site-settings/homepage/`);
  if (!res.ok) throw new Error('Failed to load homepage config');
  return res.json();
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  const res = await fetch(`${BASE}/api/v1/site-settings/testimonials/`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results || []);
}

// ── Admin API ───────────────────────────────────────────
export async function updateHomepageConfig(patch: Partial<HomepageConfig>): Promise<HomepageConfig> {
  const res = await apiFetch('/api/v1/site-settings/homepage/', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error('Failed to update homepage config');
  return res.json();
}

export async function listTestimonialsAdmin(): Promise<Testimonial[]> {
  const res = await apiFetch('/api/v1/site-settings/admin/testimonials/');
  if (!res.ok) throw new Error('Failed to load testimonials');
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results || []);
}

export async function createTestimonial(data: Partial<Testimonial>): Promise<Testimonial> {
  const res = await apiFetch('/api/v1/site-settings/admin/testimonials/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create testimonial');
  return res.json();
}

export async function updateTestimonial(id: number, data: Partial<Testimonial>): Promise<Testimonial> {
  const res = await apiFetch(`/api/v1/site-settings/admin/testimonials/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update testimonial');
  return res.json();
}

export async function deleteTestimonial(id: number): Promise<void> {
  const res = await apiFetch(`/api/v1/site-settings/admin/testimonials/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete testimonial');
}
