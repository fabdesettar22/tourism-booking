/**
 * frontend/src/features/advertising/AdSlot.tsx
 *
 * المكوّن العام لعرض الإعلانات في أي مكان.
 *
 * @example
 *   <AdSlot placement="HOME_HERO_TOP" />
 *   <AdSlot placement="HOME_MIDDLE" className="my-8" />
 *   <AdSlot placement="HOME_SIDEBAR" fallback={<DefaultBanner />} />
 */

import React from 'react';
import { useAds, useAdImpression, useAdClick } from './useAds';
import type { AdCreative, AdSlotProps, AdType } from './types';
import { useLanguage } from '../../hooks/useLanguage';

// ═══════════════════════════════════════════════════════
// AdSlot — المكوّن الرئيسي
// ═══════════════════════════════════════════════════════

export function AdSlot({
  placement,
  className = '',
  fallback = null,
  limit = 1,
  onLoad,
  onError,
}: AdSlotProps) {
  const { ads, loading, error } = useAds({ placement, limit });
  
  React.useEffect(() => {
    if (!loading && ads.length > 0 && onLoad) onLoad(ads);
    if (error && onError) onError(error);
  }, [loading, ads, error, onLoad, onError]);
  
  // Loading state
  if (loading) {
    return (
      <div className={`ad-slot-loading ${className}`}>
        <AdSkeleton />
      </div>
    );
  }
  
  // Error or no ads
  if (error || ads.length === 0) {
    return <>{fallback}</>;
  }
  
  // Render ads (واحد أو أكثر)
  return (
    <div className={`ad-slot ${className}`}>
      {ads.map((ad) => (
        <AdRenderer key={ad.uid} ad={ad} placement={placement} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// AdRenderer — يختار component مناسب حسب النوع
// ═══════════════════════════════════════════════════════

interface AdRendererProps {
  ad: AdCreative;
  placement: AdSlotProps['placement'];
}

function AdRenderer({ ad, placement }: AdRendererProps) {
  // POPUP له component منفصل (AdPopup)
  if (ad.ad_type === 'POPUP') {
    return null;  // Popup يُعرض من خلال AdPopup component
  }
  
  switch (ad.ad_type) {
    case 'HERO_BANNER':
      return <HeroBannerAd ad={ad} placement={placement} />;
    case 'FEATURED_CARD':
      return <FeaturedCardAd ad={ad} placement={placement} />;
    case 'CAROUSEL_ITEM':
    case 'BANNER':
    default:
      return <BannerAd ad={ad} placement={placement} />;
  }
}

// ═══════════════════════════════════════════════════════
// 1. BannerAd — بنر بسيط
// ═══════════════════════════════════════════════════════

function BannerAd({ ad, placement }: AdRendererProps) {
  const { isRTL } = useLanguage();
  const impressionRef = useAdImpression({ adUid: ad.uid, placement });
  const handleClick = useAdClick(ad.uid, placement);
  
  return (
    <div
      ref={impressionRef as React.RefCallback<HTMLDivElement>}
      onClick={() => handleClick(ad.link, ad.link_target)}
      className="relative rounded-2xl overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick(ad.link, ad.link_target);
      }}
      aria-label={ad.image_alt_text || ad.title}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Image — picture للـ responsive */}
      <picture>
        {ad.image_mobile && (
          <source media="(max-width: 768px)" srcSet={ad.image_mobile} />
        )}
        <img
          src={ad.image_desktop}
          alt={ad.image_alt_text || ad.title}
          className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </picture>
      
      {/* Overlay مع title (اختياري) */}
      {(ad.title || ad.button_text) && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-6">
          {ad.title && (
            <h3 className="text-white text-xl md:text-2xl font-bold mb-2 drop-shadow-lg">
              {ad.title}
            </h3>
          )}
          {ad.description && (
            <p className="text-white/90 text-sm md:text-base mb-4 line-clamp-2">
              {ad.description}
            </p>
          )}
          {ad.button_text && (
            <button
              type="button"
              className="self-start bg-[#FF6B35] hover:bg-[#e07a38] text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                handleClick(ad.link, ad.link_target);
              }}
            >
              {ad.button_text}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 2. HeroBannerAd — بنر رئيسي full-width
// ═══════════════════════════════════════════════════════

function HeroBannerAd({ ad, placement }: AdRendererProps) {
  const { isRTL } = useLanguage();
  const impressionRef = useAdImpression({ adUid: ad.uid, placement });
  const handleClick = useAdClick(ad.uid, placement);
  
  return (
    <div
      ref={impressionRef as React.RefCallback<HTMLDivElement>}
      className="relative w-full h-[400px] md:h-[600px] overflow-hidden rounded-3xl group"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Background image */}
      <picture>
        {ad.image_mobile && (
          <source media="(max-width: 768px)" srcSet={ad.image_mobile} />
        )}
        <img
          src={ad.image_desktop}
          alt={ad.image_alt_text || ad.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
      </picture>
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center items-start p-8 md:p-16 max-w-3xl">
        {ad.title && (
          <h1 className="text-white text-3xl md:text-5xl font-extrabold mb-4 drop-shadow-2xl">
            {ad.title}
          </h1>
        )}
        {ad.description && (
          <p className="text-white/90 text-base md:text-xl mb-6 max-w-2xl leading-relaxed">
            {ad.description}
          </p>
        )}
        {ad.button_text && (
          <button
            type="button"
            onClick={() => handleClick(ad.link, ad.link_target)}
            className="bg-[#FF6B35] hover:bg-[#e07a38] text-white px-8 py-3.5 rounded-xl text-base md:text-lg font-bold transition-all shadow-2xl hover:shadow-orange-500/50 hover:-translate-y-1"
          >
            {ad.button_text} {isRTL ? '←' : '→'}
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 3. FeaturedCardAd — بطاقة عمودية مميزة
// ═══════════════════════════════════════════════════════

function FeaturedCardAd({ ad, placement }: AdRendererProps) {
  const { isRTL } = useLanguage();
  const impressionRef = useAdImpression({ adUid: ad.uid, placement });
  const handleClick = useAdClick(ad.uid, placement);
  
  return (
    <div
      ref={impressionRef as React.RefCallback<HTMLDivElement>}
      onClick={() => handleClick(ad.link, ad.link_target)}
      className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer group max-w-sm"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Image */}
      <div className="aspect-[3/4] overflow-hidden">
        <picture>
          {ad.image_mobile && (
            <source media="(max-width: 768px)" srcSet={ad.image_mobile} />
          )}
          <img
            src={ad.image_desktop}
            alt={ad.image_alt_text || ad.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        </picture>
      </div>
      
      {/* Content */}
      <div className="p-5">
        {ad.title && (
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {ad.title}
          </h3>
        )}
        {ad.description && (
          <p className="text-sm text-gray-600 line-clamp-3 mb-4">
            {ad.description}
          </p>
        )}
        {ad.button_text && (
          <button
            type="button"
            className="w-full bg-[#FF6B35] hover:bg-[#e07a38] text-white py-2.5 rounded-xl text-sm font-bold transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleClick(ad.link, ad.link_target);
            }}
          >
            {ad.button_text}
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// AdSkeleton — placeholder loading
// ═══════════════════════════════════════════════════════

function AdSkeleton() {
  return (
    <div className="w-full bg-gray-100 rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-[16/6] bg-gray-200" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Default export
// ═══════════════════════════════════════════════════════

export default AdSlot;
