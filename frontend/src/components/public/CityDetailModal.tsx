import { useEffect, useState } from 'react';
import { X, Hotel, MapIcon, Loader2, MapPin } from 'lucide-react';
import { HotelCard } from './HotelCard';
import { ServiceCard } from './ServiceCard';
import {
  fetchPublicHotels, fetchPublicServices,
  type PublicHotelListItem, type PublicServiceListItem,
} from '../../services/publicApi';
import type { Language } from '../../i18n';

interface Props {
  /** قبول إما city_id (مُفضَّل) أو city_name */
  filter: { city_id?: number | null; city_name?: string } | null;
  cityDisplayName?: string;
  cityImage?: string;
  lang: Language;
  isRTL: boolean;
  onClose: () => void;
}

type Tab = 'hotels' | 'services';

export function CityDetailModal({ filter, cityDisplayName, cityImage, lang, isRTL, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('hotels');
  const [hotels, setHotels] = useState<PublicHotelListItem[]>([]);
  const [services, setServices] = useState<PublicServiceListItem[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  // مفتاح مرئي لتغيير useEffect عند تبديل المدينة
  const filterKey = filter ? `${filter.city_id ?? ''}-${filter.city_name ?? ''}` : '';

  const T = {
    inCity:    lang === 'ar' ? 'في'                  : lang === 'ms' ? 'di'              : 'in',
    hotels:    lang === 'ar' ? 'الفنادق'             : lang === 'ms' ? 'Hotel'           : 'Hotels',
    services:  lang === 'ar' ? 'الخدمات'             : lang === 'ms' ? 'Perkhidmatan'    : 'Services',
    noHotels:  lang === 'ar' ? 'لا توجد فنادق في هذه المدينة بعد' : lang === 'ms' ? 'Tiada hotel di bandar ini lagi' : 'No hotels in this city yet',
    noServices:lang === 'ar' ? 'لا توجد خدمات في هذه المدينة بعد' : lang === 'ms' ? 'Tiada perkhidmatan di bandar ini lagi' : 'No services in this city yet',
    loading:   lang === 'ar' ? 'جارٍ التحميل...'    : lang === 'ms' ? 'Memuatkan...'    : 'Loading...',
    close:     lang === 'ar' ? 'إغلاق'              : lang === 'ms' ? 'Tutup'           : 'Close',
  };

  // ESC to close
  useEffect(() => {
    if (!filter) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [filter, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!filter) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [filter]);

  // Fetch when filter changes
  useEffect(() => {
    if (!filter) return;
    setTab('hotels');
    setHotels([]);
    setServices([]);

    // بناء params: city_id (مُفضَّل) أو city_name (fallback)
    const hotelsParams = filter.city_id
      ? { city_id: filter.city_id, limit: 12 }
      : { city_name: filter.city_name, limit: 12 };
    const servicesParams = filter.city_id
      ? { city_id: filter.city_id, limit: 12 }
      : { city_name: filter.city_name, limit: 12 };

    setLoadingHotels(true);
    fetchPublicHotels(hotelsParams)
      .then(setHotels)
      .catch(() => setHotels([]))
      .finally(() => setLoadingHotels(false));

    setLoadingServices(true);
    fetchPublicServices(servicesParams)
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setLoadingServices(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  if (!filter) return null;

  const displayName = cityDisplayName || filter.city_name || '';

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl my-8 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header — صورة المدينة + اسمها */}
        <div className="relative h-44 sm:h-56 bg-gradient-to-br from-orange-400 to-amber-500 flex-shrink-0 overflow-hidden">
          {cityImage && (
            <img src={cityImage} alt={displayName} className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40" />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label={T.close}
            className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-gray-900 shadow-lg transition`}
          >
            <X className="w-5 h-5" />
          </button>

          {/* City title */}
          <div className="absolute bottom-5 inset-x-5 text-white">
            <p className="text-xs sm:text-sm text-white/80 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Malaysia
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mt-1 tracking-tight">{displayName}</h2>
            <p className="text-sm text-white/85 mt-1">
              {hotels.length} {T.hotels.toLowerCase()} · {services.length} {T.services.toLowerCase()}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-100 px-5 flex-shrink-0">
          <div className="flex gap-1">
            <button
              onClick={() => setTab('hotels')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors
                ${tab === 'hotels' ? 'border-[#FF6B35] text-[#FF6B35]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <Hotel className="w-4 h-4" />
              {T.hotels}
              <span className={`px-2 py-0.5 rounded-full text-xs ${tab === 'hotels' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                {hotels.length}
              </span>
            </button>
            <button
              onClick={() => setTab('services')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors
                ${tab === 'services' ? 'border-[#FF6B35] text-[#FF6B35]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <MapIcon className="w-4 h-4" />
              {T.services}
              <span className={`px-2 py-0.5 rounded-full text-xs ${tab === 'services' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                {services.length}
              </span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 flex-1">
          {tab === 'hotels' && (
            loadingHotels ? (
              <LoadingState text={T.loading} />
            ) : hotels.length === 0 ? (
              <EmptyState text={T.noHotels} icon={<Hotel className="w-10 h-10" />} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {hotels.map(h => <HotelCard key={h.id} hotel={h} lang={lang} />)}
              </div>
            )
          )}

          {tab === 'services' && (
            loadingServices ? (
              <LoadingState text={T.loading} />
            ) : services.length === 0 ? (
              <EmptyState text={T.noServices} icon={<MapIcon className="w-10 h-10" />} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {services.map(s => <ServiceCard key={s.id} service={s} lang={lang} />)}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}

function EmptyState({ text, icon }: { text: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
        {icon}
      </div>
      <p className="text-sm text-gray-500 max-w-xs">{text}</p>
    </div>
  );
}
