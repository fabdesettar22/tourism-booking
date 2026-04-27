/**
 * frontend/src/features/advertising/types.ts
 *
 * TypeScript types للنظام الإعلاني.
 * يطابق الـ Django models و serializers.
 */

// ─── Enums ─────────────────────────────────────────────

export type AdType =
  | 'BANNER'
  | 'HERO_BANNER'
  | 'POPUP'
  | 'FEATURED_CARD'
  | 'CAROUSEL_ITEM';

export type Placement =
  | 'HOME_HERO_TOP'
  | 'HOME_HERO_BG'
  | 'HOME_MIDDLE'
  | 'HOME_BOTTOM'
  | 'HOME_SIDEBAR'
  | 'HOME_BANNER_FULL'
  | 'SEARCH_TOP'
  | 'HOTEL_DETAIL_SIDE'
  | 'POPUP_ENTRY'
  | 'POPUP_EXIT'
  | 'FOOTER_BANNER'
  | 'DASHBOARD_TOP';

export type EventType = 'VIEW' | 'CLICK' | 'CLOSE' | 'DISMISS';

export type DeviceType = 'mobile' | 'desktop' | 'tablet';

export type LinkTarget = 'SAME_TAB' | 'NEW_TAB';

// ─── الإعلان (كما يصل من API) ──────────────────────────

export interface AdCreative {
  uid: string;
  ad_type: AdType;
  title: string;            // مُترجم بالفعل (للغة المطلوبة)
  description: string;
  button_text: string;
  image_desktop: string;     // URL كامل
  image_mobile: string;      // URL كامل (يأتي fallback من desktop)
  image_alt_text: string;
  link: string;              // الرابط النهائي
  link_target: LinkTarget;
  linked_hotel_id: number | null;
  linked_package_id: string | null;  // CustomPackage.id (UUID)
  linked_agency_id: number | null;
  priority: number;
}

// ─── Response: GET /ads/ ─────────────────────────────

export interface AdsResponse {
  placement: Placement;
  language: string;
  count: number;
  ads: AdCreative[];
}

// ─── Body: POST /ads/{uid}/track/ ─────────────────────

export interface TrackEventBody {
  event_type: EventType;
  placement_key: Placement;
  session_id?: string;
  language?: string;
  country?: string;
  device_type?: DeviceType;
}

export interface TrackEventResponse {
  tracked: boolean;
  event_id: string;
  event_type: EventType;
}

// ─── Response: GET /placements/ ──────────────────────

export interface PlacementChoice {
  key: string;
  label: string;
}

export interface PlacementsResponse {
  placements: PlacementChoice[];
  ad_types: PlacementChoice[];
  device_types: PlacementChoice[];
  user_types: PlacementChoice[];
}

// ─── خيارات للـ AdSlot component ──────────────────────

export interface AdSlotProps {
  placement: Placement;
  className?: string;
  fallback?: React.ReactNode;  // ما يظهر إذا لا يوجد إعلان
  limit?: number;               // عدد الإعلانات (افتراضي 1)
  onLoad?: (ads: AdCreative[]) => void;
  onError?: (error: Error) => void;
}
