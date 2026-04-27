/**
 * frontend/src/features/advertising/api.ts
 *
 * API client للنظام الإعلاني.
 *
 * يدير:
 * - الاتصال بـ Django backend
 * - session_id (في sessionStorage)
 * - تعامل أخطاء ذكي (silent failures للـ tracking)
 */

import type {
  AdsResponse,
  Placement,
  TrackEventBody,
  TrackEventResponse,
  PlacementsResponse,
} from './types';

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const PREFIX = `${BASE}/api/v1/advertising`;

// ═══════════════════════════════════════════════════════
// Session ID Management
// ═══════════════════════════════════════════════════════

const SESSION_KEY = 'mybridge_ad_session_id';

/**
 * يُرجع session_id ثابت لكل tab/window.
 * يُولِّد UUID جديد في المرة الأولى.
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = generateUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

/**
 * UUID v4 مبسّط (لا يحتاج crypto.randomUUID للـ legacy browsers).
 */
function generateUUID(): string {
  // crypto.randomUUID متاح في معظم المتصفحات الحديثة
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ═══════════════════════════════════════════════════════
// Device Detection (Frontend)
// ═══════════════════════════════════════════════════════

export function detectDevice(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  
  const ua = navigator.userAgent.toLowerCase();
  
  // Tablet أولاً (iPad له 'mobile' أحياناً)
  if (/ipad|tablet|kindle|silk|playbook/i.test(ua)) {
    return 'tablet';
  }
  
  if (/mobile|android|iphone|ipod|blackberry|opera mini|opera mobi|webos|palm|phone/i.test(ua)) {
    return 'mobile';
  }
  
  return 'desktop';
}

// ═══════════════════════════════════════════════════════
// API Calls
// ═══════════════════════════════════════════════════════

export interface FetchAdsOptions {
  placement: Placement;
  lang?: string;
  country?: string;
  limit?: number;
  signal?: AbortSignal;
}

/**
 * جلب الإعلانات النشطة لمكان معين.
 *
 * @example
 *   const data = await fetchActiveAds({
 *     placement: 'HOME_HERO_TOP',
 *     lang: 'ar',
 *   });
 */
export async function fetchActiveAds(opts: FetchAdsOptions): Promise<AdsResponse> {
  const params = new URLSearchParams();
  params.set('placement', opts.placement);
  if (opts.lang) params.set('lang', opts.lang);
  if (opts.country) params.set('country', opts.country);
  if (opts.limit) params.set('limit', String(opts.limit));
  
  const url = `${PREFIX}/ads/?${params.toString()}`;
  
  const res = await fetch(url, {
    method: 'GET',
    signal: opts.signal,
    headers: { Accept: 'application/json' },
  });
  
  if (!res.ok) {
    throw new Error(`فشل جلب الإعلانات (${res.status})`);
  }
  
  return res.json();
}

/**
 * تسجيل event على إعلان.
 *
 * هذه الدالة silent — لا ترمي errors لتجنب إزعاج UX.
 *
 * @example
 *   trackAdEvent(ad.uid, {
 *     event_type: 'CLICK',
 *     placement_key: 'HOME_HERO_TOP',
 *   });
 */
export async function trackAdEvent(
  creativeUid: string,
  body: Omit<TrackEventBody, 'session_id' | 'device_type'>,
): Promise<TrackEventResponse | null> {
  try {
    const url = `${PREFIX}/ads/${creativeUid}/track/`;
    
    const fullBody: TrackEventBody = {
      ...body,
      session_id: getSessionId(),
      device_type: detectDevice(),
    };
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(fullBody),
      // keepalive: للسماح بإكمال الطلب حتى لو غادر المستخدم الصفحة
      keepalive: true,
    });
    
    if (!res.ok) {
      // Silent fail — لا نُربك المستخدم
      console.warn(`[Ad tracking failed] ${res.status}`);
      return null;
    }
    
    return res.json();
  } catch (err) {
    console.warn('[Ad tracking error]', err);
    return null;
  }
}

/**
 * جلب قائمة الـ placements والـ choices.
 * مفيد للأدمن أو لإنشاء UI ديناميكي.
 */
export async function fetchPlacements(): Promise<PlacementsResponse> {
  const res = await fetch(`${PREFIX}/placements/`, {
    headers: { Accept: 'application/json' },
  });
  
  if (!res.ok) {
    throw new Error(`فشل جلب الـ placements (${res.status})`);
  }
  
  return res.json();
}
