/**
 * frontend/src/features/advertising/AdPopup.tsx
 *
 * Popup modal للإعلانات.
 *
 * أنواع:
 * - POPUP_ENTRY : يظهر بعد X ثوان من دخول الموقع
 * - POPUP_EXIT  : يظهر عند محاولة المغادرة (desktop only)
 *
 * يدعم:
 * - Frequency cap (localStorage)
 * - ESC key to close
 * - Click backdrop to close
 * - Auto-dismiss after delay
 * - Smooth animations
 *
 * @example
 *   <AdPopup placement="POPUP_ENTRY" delay={3000} />
 *   <AdPopup placement="POPUP_EXIT" />
 */

import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAds, useAdImpression, useAdClick, useAdClose } from './useAds';
import type { Placement } from './types';

// ═══════════════════════════════════════════════════════
// Frequency Cap (localStorage)
// ═══════════════════════════════════════════════════════

const POPUP_SHOWN_KEY = 'mybridge_popup_shown';

interface PopupShownRecord {
  [adUid: string]: string;  // ISO date YYYY-MM-DD
}

function getPopupShownToday(): PopupShownRecord {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(POPUP_SHOWN_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function markPopupShown(adUid: string) {
  if (typeof window === 'undefined') return;
  try {
    const record = getPopupShownToday();
    record[adUid] = new Date().toISOString().split('T')[0];
    localStorage.setItem(POPUP_SHOWN_KEY, JSON.stringify(record));
  } catch {
    // Ignore storage errors
  }
}

function wasShownToday(adUid: string): boolean {
  const record = getPopupShownToday();
  const today = new Date().toISOString().split('T')[0];
  return record[adUid] === today;
}

// ═══════════════════════════════════════════════════════
// AdPopup Component
// ═══════════════════════════════════════════════════════

export interface AdPopupProps {
  placement: Extract<Placement, 'POPUP_ENTRY' | 'POPUP_EXIT'>;
  /** التأخير قبل ظهور popup_entry (بالـ ms) — افتراضي 3000 */
  delay?: number;
  /** هل نحترم frequency cap؟ — افتراضي true */
  respectFrequencyCap?: boolean;
}

export function AdPopup({
  placement,
  delay = 3000,
  respectFrequencyCap = true,
}: AdPopupProps) {
  const { isRTL, lang } = useLanguage();
  const { ads } = useAds({ placement });
  
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitListenerRef = useRef<((e: MouseEvent) => void) | null>(null);
  
  const ad = ads[0];
  const adUid = ad?.uid;
  
  const handleClose = useAdClose(adUid || '', placement);
  const handleClick = useAdClick(adUid || '', placement);
  const impressionRef = useAdImpression({
    adUid: adUid || '',
    placement,
    threshold: 0.1,  // popup يظهر بكامله — threshold منخفض
  });
  
  // ─── إظهار popup ───────────────────────────────────────
  
  useEffect(() => {
    if (!ad) return;
    
    // تحقق من frequency cap
    if (respectFrequencyCap && wasShownToday(ad.uid)) return;
    
    if (placement === 'POPUP_ENTRY') {
      // يظهر بعد delay ms
      timerRef.current = setTimeout(() => {
        setIsOpen(true);
        markPopupShown(ad.uid);
      }, delay);
    } else if (placement === 'POPUP_EXIT') {
      // يظهر عند mouse leave (desktop only)
      const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
      if (isMobile) return;  // لا exit intent على الموبايل
      
      exitListenerRef.current = (e: MouseEvent) => {
        // الماوس خرج من النافذة من الأعلى
        if (e.clientY < 10) {
          setIsOpen(true);
          markPopupShown(ad.uid);
          if (exitListenerRef.current) {
            document.removeEventListener('mouseleave', exitListenerRef.current);
          }
        }
      };
      document.addEventListener('mouseleave', exitListenerRef.current);
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (exitListenerRef.current) {
        document.removeEventListener('mouseleave', exitListenerRef.current);
      }
    };
  }, [ad, placement, delay, respectFrequencyCap]);
  
  // ─── ESC key handler ──────────────────────────────────
  
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeWithAnimation();
    };
    
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // ─── إغلاق ───────────────────────────────────────────
  
  function closeWithAnimation() {
    setIsAnimatingOut(true);
    handleClose();
    setTimeout(() => {
      setIsOpen(false);
      setIsAnimatingOut(false);
    }, 200);
  }
  
  // ─── render ──────────────────────────────────────────
  
  if (!ad || !isOpen) return null;
  
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ad-popup-title"
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-200 ${
        isAnimatingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Backdrop */}
      <div
        onClick={closeWithAnimation}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      {/* Modal */}
      <div
        ref={impressionRef as React.RefCallback<HTMLDivElement>}
        className={`relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transition-transform duration-200 ${
          isAnimatingOut ? 'scale-95' : 'scale-100'
        }`}
      >
        {/* Close button */}
        <button
          onClick={closeWithAnimation}
          aria-label="إغلاق"
          className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} z-10 w-9 h-9 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-colors`}
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>
        
        {/* Image */}
        {ad.image_desktop && (
          <picture>
            {ad.image_mobile && (
              <source media="(max-width: 768px)" srcSet={ad.image_mobile} />
            )}
            <img
              src={ad.image_desktop}
              alt={ad.image_alt_text || ad.title}
              className="w-full h-56 md:h-64 object-cover"
            />
          </picture>
        )}
        
        {/* Content */}
        <div className="p-6 md:p-8 text-center">
          {ad.title && (
            <h2
              id="ad-popup-title"
              className="text-2xl md:text-3xl font-bold text-gray-900 mb-3"
            >
              {ad.title}
            </h2>
          )}
          {ad.description && (
            <p className="text-gray-600 text-sm md:text-base mb-6 leading-relaxed">
              {ad.description}
            </p>
          )}
          
          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-center">
            <button
              onClick={closeWithAnimation}
              className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              لاحقاً
            </button>
            {ad.button_text && (
              <button
                onClick={() => {
                  handleClick(ad.link, ad.link_target);
                  closeWithAnimation();
                }}
                className="px-8 py-3 bg-[#FF6B35] hover:bg-[#e07a38] text-white rounded-xl font-bold transition-colors shadow-lg"
              >
                {ad.button_text}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdPopup;
