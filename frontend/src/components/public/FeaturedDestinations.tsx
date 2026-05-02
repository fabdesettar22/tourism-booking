import { useEffect, useState } from 'react';
import type { Language } from '../../i18n';
import { fetchPublicDestinations, type Destination } from '../../services/destinationsApi';

// صور افتراضية لو الـ Backend فارغ
const FALLBACK_DESTINATIONS: Array<{
  name: { ar: string; en: string; ms: string };
  city_name: string;
  image: string;
  size: 'large' | 'medium' | 'small';
}> = [
  { name: { ar: 'كوالالمبور',    en: 'Kuala Lumpur',  ms: 'Kuala Lumpur' },
    city_name: 'Kuala Lumpur',  size: 'large',
    image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=900&q=80' },
  { name: { ar: 'بينانغ',         en: 'Penang',        ms: 'Pulau Pinang' },
    city_name: 'Penang',        size: 'medium',
    image: 'https://images.unsplash.com/photo-1593265928515-1baa1b6f2664?w=900&q=80' },
  { name: { ar: 'لنكاوي',         en: 'Langkawi',      ms: 'Langkawi' },
    city_name: 'Langkawi',      size: 'medium',
    image: 'https://images.unsplash.com/photo-1568840370-83b2acea3b9c?w=900&q=80' },
  { name: { ar: 'ملقا',           en: 'Malacca',       ms: 'Melaka' },
    city_name: 'Malacca',       size: 'small',
    image: 'https://images.unsplash.com/photo-1570173544823-3525a6b00bdb?w=600&q=80' },
  { name: { ar: 'كوتا كينابالو',   en: 'Kota Kinabalu', ms: 'Kota Kinabalu' },
    city_name: 'Kota Kinabalu', size: 'small',
    image: 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=600&q=80' },
  { name: { ar: 'جوهور باهرو',     en: 'Johor Bahru',   ms: 'Johor Bahru' },
    city_name: 'Johor Bahru',   size: 'small',
    image: 'https://images.unsplash.com/photo-1599661046827-dacde6976549?w=600&q=80' },
];

interface DestinationDisplay {
  city_id?:   number | null;     // FK (مُفضَّل)
  city_name:  string;            // fallback
  displayName: string;
  image: string;
  size: 'large' | 'medium' | 'small';
}

interface Props {
  lang: Language;
  isRTL: boolean;
  onSelectCity?: (
    filter: { city_id?: number | null; city_name?: string },
    displayName: string,
    image: string,
  ) => void;
}

export function FeaturedDestinations({ lang, isRTL, onSelectCity }: Props) {
  const [destinations, setDestinations] = useState<DestinationDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicDestinations()
      .then(items => {
        if (items.length === 0) {
          setDestinations(FALLBACK_DESTINATIONS.map(d => ({
            city_id:     null,
            city_name:   d.city_name,
            displayName: d.name[lang] || d.name.en || d.city_name,
            image:       d.image,
            size:        d.size,
          })));
        } else {
          setDestinations(items.map((d: Destination) => ({
            city_id:     d.city ?? null,
            city_name:   d.city_display || d.city_name,
            displayName: d.name?.[lang] || d.name?.en || d.city_display || d.city_name,
            image:       d.image_url || d.image || '',
            size:        d.size,
          })));
        }
      })
      .catch(() => {
        setDestinations(FALLBACK_DESTINATIONS.map(d => ({
          city_id:     null,
          city_name:   d.city_name,
          displayName: d.name[lang] || d.name.en || d.city_name,
          image:       d.image,
          size:        d.size,
        })));
      })
      .finally(() => setLoading(false));
  }, [lang]);

  const T = {
    title:    lang === 'ar' ? 'وجهات شعبية'              : lang === 'ms' ? 'Destinasi Popular'         : 'Popular Destinations',
    subtitle: lang === 'ar' ? 'استكشف أفضل المدن الماليزية' : lang === 'ms' ? 'Terokai bandar terbaik' : 'Explore the best Malaysian cities',
  };

  if (loading) {
    return (
      <section className="bg-white py-14" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">{T.title}</h2>
            <p className="text-gray-500 mt-2">{T.subtitle}</p>
          </div>
          <div className="grid grid-cols-12 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="col-span-6 sm:col-span-4 aspect-[4/3] bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (destinations.length === 0) return null;

  // ── حساب أحجام البطاقات في الشبكة ──
  const getColSpan = (size: 'large' | 'medium' | 'small', idx: number, total: number) => {
    if (size === 'large') return 'col-span-12 sm:col-span-7 row-span-2 sm:min-h-[400px]';
    if (size === 'medium') return 'col-span-6 sm:col-span-5';
    // small
    return total <= 6 ? 'col-span-6 sm:col-span-4' : 'col-span-6 sm:col-span-3';
  };

  return (
    <section className="bg-white py-14" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">{T.title}</h2>
          <p className="text-gray-500 mt-2">{T.subtitle}</p>
        </div>

        <div className="grid grid-cols-12 gap-3 sm:gap-4 auto-rows-[150px] sm:auto-rows-[200px]">
          {destinations.map((d, i) => (
            <DestCard
              key={`${d.city_id ?? d.city_name}-${i}`}
              displayName={d.displayName}
              image={d.image}
              onClick={() => onSelectCity?.(
                { city_id: d.city_id, city_name: d.city_name },
                d.displayName,
                d.image,
              )}
              className={getColSpan(d.size, i, destinations.length)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DestCard({ displayName, image, onClick, className }: {
  displayName: string;
  image: string;
  onClick?: () => void;
  className: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-2xl overflow-hidden group cursor-pointer ${className}`}
    >
      {image && (
        <img
          src={image}
          alt={displayName}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 text-white text-start">
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{displayName}</h3>
      </div>

      <div className="absolute top-3 end-3 w-9 h-9 rounded-full bg-white/95 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-gray-900">→</span>
      </div>
    </button>
  );
}
