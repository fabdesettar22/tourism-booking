/**
 * frontend/src/features/advertising/useAds.ts
 *
 * React hooks للنظام الإعلاني.
 *
 * Hooks:
 * - useAds(placement)           : جلب الإعلانات لمكان
 * - useAdImpression(adUid, ...) : تتبع VIEW عند ظهور الإعلان (IntersectionObserver)
 * - useAdClick()                : helper لتسجيل CLICK والانتقال
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { fetchActiveAds, trackAdEvent } from './api';
import type { AdCreative, Placement } from './types';

// ═══════════════════════════════════════════════════════
// useAds — جلب الإعلانات لمكان معين
// ═══════════════════════════════════════════════════════

export interface UseAdsOptions {
  placement: Placement;
  limit?: number;
  enabled?: boolean;  // إيقاف الـ fetch (للـ conditional rendering)
}

export interface UseAdsResult {
  ads: AdCreative[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * Hook رئيسي لجلب الإعلانات.
 *
 * @example
 *   const { ads, loading } = useAds({ placement: 'HOME_HERO_TOP' });
 */
export function useAds(opts: UseAdsOptions): UseAdsResult {
  const { lang } = useLanguage();
  const [ads, setAds] = useState<AdCreative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const enabled = opts.enabled !== false;
  
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    
    const controller = new AbortController();
    let active = true;
    
    setLoading(true);
    setError(null);
    
    fetchActiveAds({
      placement: opts.placement,
      lang,
      limit: opts.limit || 1,
      signal: controller.signal,
    })
      .then((data) => {
        if (!active) return;
        setAds(data.ads || []);
      })
      .catch((err: Error) => {
        if (!active || err.name === 'AbortError') return;
        console.warn('[useAds] failed to fetch ads:', err);
        setError(err);
        setAds([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    
    return () => {
      active = false;
      controller.abort();
    };
  }, [opts.placement, opts.limit, lang, enabled, refreshKey]);
  
  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);
  
  return { ads, loading, error, refresh };
}

// ═══════════════════════════════════════════════════════
// useAdImpression — تتبع VIEW عند ظهور الإعلان
// ═══════════════════════════════════════════════════════

export interface UseAdImpressionOptions {
  adUid: string;
  placement: Placement;
  /** نسبة الظهور المطلوبة (0-1) - افتراضي 0.5 (50%) */
  threshold?: number;
  /** هل يُسجَّل مرة واحدة فقط لكل mount؟ - افتراضي true */
  once?: boolean;
}

/**
 * Hook لتتبع VIEW تلقائياً عند ظهور الإعلان في الـ viewport.
 *
 * @example
 *   const ref = useAdImpression({
 *     adUid: ad.uid,
 *     placement: 'HOME_HERO_TOP',
 *   });
 *   return <div ref={ref}>...</div>
 */
export function useAdImpression(
  opts: UseAdImpressionOptions
): React.RefCallback<HTMLElement> {
  const { lang } = useLanguage();
  const trackedRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  const { adUid, placement, threshold = 0.5, once = true } = opts;
  
  return useCallback(
    (node: HTMLElement | null) => {
      // Cleanup observer سابق
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      
      if (!node || !adUid || (once && trackedRef.current)) return;
      
      // إنشاء observer جديد
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
              if (once && trackedRef.current) return;
              trackedRef.current = true;
              
              trackAdEvent(adUid, {
                event_type: 'VIEW',
                placement_key: placement,
                language: lang,
              });
              
              if (once && observerRef.current) {
                observerRef.current.disconnect();
              }
            }
          });
        },
        { threshold }
      );
      
      observerRef.current.observe(node);
    },
    [adUid, placement, threshold, once, lang]
  );
}

// ═══════════════════════════════════════════════════════
// useAdClick — تسجيل CLICK + الانتقال للرابط
// ═══════════════════════════════════════════════════════

/**
 * Helper لتسجيل CLICK والانتقال للرابط.
 *
 * @example
 *   const handleClick = useAdClick(ad.uid, 'HOME_HERO_TOP');
 *   <a onClick={() => handleClick(ad.link, ad.link_target)}>...</a>
 */
export function useAdClick(adUid: string, placement: Placement) {
  const { lang } = useLanguage();
  
  return useCallback(
    (link: string, target: 'SAME_TAB' | 'NEW_TAB' = 'SAME_TAB') => {
      // 1. سجّل CLICK (silent - بدون انتظار)
      trackAdEvent(adUid, {
        event_type: 'CLICK',
        placement_key: placement,
        language: lang,
      });
      
      // 2. انتقل للرابط
      if (!link || link === '#') return;
      
      if (target === 'NEW_TAB') {
        window.open(link, '_blank', 'noopener,noreferrer');
      } else {
        // إن كان رابط داخلي (يبدأ بـ /) → استخدم react-router لاحقاً
        // الآن نستخدم window.location للبساطة
        if (link.startsWith('/')) {
          window.location.href = link;
        } else {
          window.location.href = link;
        }
      }
    },
    [adUid, placement, lang]
  );
}

// ═══════════════════════════════════════════════════════
// useAdClose — تسجيل CLOSE (لـ popups)
// ═══════════════════════════════════════════════════════

/**
 * Helper لتسجيل CLOSE event (للـ popups).
 */
export function useAdClose(adUid: string, placement: Placement) {
  const { lang } = useLanguage();
  
  return useCallback(() => {
    trackAdEvent(adUid, {
      event_type: 'CLOSE',
      placement_key: placement,
      language: lang,
    });
  }, [adUid, placement, lang]);
}
