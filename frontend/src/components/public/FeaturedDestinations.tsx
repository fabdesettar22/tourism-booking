import { useEffect, useRef, useState } from 'react';
import type { Language } from '../../i18n';
import { fetchPublicDestinations, type Destination } from '../../services/destinationsApi';

// ── Fallback data ─────────────────────────────────────────
const FALLBACK_DESTINATIONS = [
  {
    name:      { ar: 'كوالالمبور', en: 'Kuala Lumpur', ms: 'Kuala Lumpur' },
    city_name: 'Kuala Lumpur',
    hotels: 48, tours: 32, rating: '4.9', price: 280,
    image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1400&q=90',
  },
  {
    name:      { ar: 'بينانغ', en: 'Penang', ms: 'Pulau Pinang' },
    city_name: 'Penang',
    hotels: 31, tours: 24, rating: '4.8', price: 180,
    image: 'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?auto=format&fit=crop&w=1400&q=90',
  },
  {
    name:      { ar: 'لنكاوي', en: 'Langkawi', ms: 'Langkawi' },
    city_name: 'Langkawi',
    hotels: 27, tours: 19, rating: '4.7', price: 220,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=90',
  },
  {
    name:      { ar: 'ملقا', en: 'Malacca', ms: 'Melaka' },
    city_name: 'Malacca',
    hotels: 18, tours: 14, rating: '4.6', price: 140,
    image: 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?auto=format&fit=crop&w=1400&q=90',
  },
  {
    name:      { ar: 'كوتا كينابالو', en: 'Kota Kinabalu', ms: 'Kota Kinabalu' },
    city_name: 'Kota Kinabalu',
    hotels: 22, tours: 17, rating: '4.8', price: 310,
    image: 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?auto=format&fit=crop&w=1400&q=90',
  },
  {
    name:      { ar: 'جوهور باهرو', en: 'Johor Bahru', ms: 'Johor Bahru' },
    city_name: 'Johor Bahru',
    hotels: 15, tours: 11, rating: '4.5', price: 160,
    image: 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?auto=format&fit=crop&w=1400&q=90',
  },
];

// ── SVG Icons (no emojis) ─────────────────────────────────
const HotelIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
    strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const TourIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
    strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const ArrowIcon = ({ rtl }: { rtl: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"
    style={{ transform: rtl ? 'scaleX(-1)' : 'none' }}>
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

// ── Types ─────────────────────────────────────────────────
interface DestinationDisplay {
  city_id?:    number | null;
  city_name:   string;
  displayName: string;
  image:       string;
  hotels?:     number;
  tours?:      number;
  rating?:     string;
  price?:      number;
}

interface Props {
  lang:          Language;
  isRTL:         boolean;
  onSelectCity?: (
    filter: { city_id?: number | null; city_name?: string },
    displayName: string,
    image: string,
  ) => void;
}

// ── Main Component ────────────────────────────────────────
export function FeaturedDestinations({ lang, isRTL, onSelectCity }: Props) {
  const [destinations, setDestinations] = useState<DestinationDisplay[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedIdx, setSelectedIdx]   = useState(0);
  const [prevIdx, setPrevIdx]           = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    fetchPublicDestinations()
      .then(items => {
        if (items.length === 0) {
          setDestinations(FALLBACK_DESTINATIONS.map(d => ({
            city_id: null, city_name: d.city_name,
            displayName: d.name[lang] || d.name.en || d.city_name,
            image: d.image, hotels: d.hotels, tours: d.tours, rating: d.rating, price: d.price,
          })));
        } else {
          setDestinations(items.map((d: Destination, i: number) => {
            const fb = FALLBACK_DESTINATIONS[i % FALLBACK_DESTINATIONS.length];
            return {
              city_id: d.city ?? null,
              city_name: d.city_display || d.city_name,
              displayName: d.name?.[lang] || d.name?.en || d.city_display || d.city_name,
              image: d.image_url || d.image || fb.image,
              hotels: fb.hotels, tours: fb.tours, rating: fb.rating, price: fb.price,
            };
          }));
        }
      })
      .catch(() => setDestinations(FALLBACK_DESTINATIONS.map(d => ({
        city_id: null, city_name: d.city_name,
        displayName: d.name[lang] || d.name.en || d.city_name,
        image: d.image, hotels: d.hotels, tours: d.tours, rating: d.rating, price: d.price,
      }))))
      .finally(() => setLoading(false));
  }, [lang]);

  const handleSelect = (i: number) => {
    if (i === selectedIdx || transitioning) return;
    setPrevIdx(selectedIdx);
    setTransitioning(true);
    setSelectedIdx(i);
    setTimeout(() => { setPrevIdx(null); setTransitioning(false); }, 700);
  };

  const T = {
    sectionLabel: lang === 'ar' ? 'وجهات ماليزيا'   : lang === 'ms' ? 'Destinasi Malaysia'  : 'Malaysian Destinations',
    title:        lang === 'ar' ? 'وجهات'            : lang === 'ms' ? 'Destinasi'            : 'Top',
    titleAccent:  lang === 'ar' ? 'مميزة'            : lang === 'ms' ? 'Popular'              : 'Destinations',
    subtitle:     lang === 'ar' ? 'اكتشف أروع وجهات ماليزيا — من ناطحات السحاب إلى شواطئ الجزر الخلابة'
                                : lang === 'ms' ? 'Temui destinasi terbaik Malaysia — dari pencakar langit ke pantai pulau yang indah'
                                : 'Discover Malaysia\'s finest — from glittering skylines to pristine island shores',
    viewAll:   lang === 'ar' ? 'عرض الكل'    : lang === 'ms' ? 'Lihat Semua'   : 'View All',
    hotels:    lang === 'ar' ? 'فندق'         : lang === 'ms' ? 'Hotel'         : 'Hotels',
    tours:     lang === 'ar' ? 'جولة'         : lang === 'ms' ? 'Lawatan'       : 'Tours',
    explore:   lang === 'ar' ? 'استكشف المدينة' : lang === 'ms' ? 'Jelajah Bandar' : 'Explore City',
    topPick:   lang === 'ar' ? 'الأكثر شعبية' : lang === 'ms' ? 'Paling Popular'  : 'Top Pick',
    startFrom: lang === 'ar' ? 'يبدأ من'      : lang === 'ms' ? 'Bermula dari'  : 'From',
    rating:    lang === 'ar' ? 'تقييم'         : lang === 'ms' ? 'Penilaian'     : 'Rating',
    perNight:  lang === 'ar' ? 'MYR / ليلة'   : lang === 'ms' ? 'MYR / malam'   : 'MYR / night',
    malaysia:  'Malaysia',
  };

  if (loading) {
    return (
      <section className="bg-[#FAF9F5] py-24" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-48 bg-[#1E2A78]/8 rounded-full animate-pulse mb-4" />
          <div className="h-14 w-96 bg-[#1E2A78]/8 rounded-xl animate-pulse mb-10" />
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 290px' }}>
            <div className="h-[560px] rounded-[2rem] bg-[#1E2A78]/6 animate-pulse" />
            <div className="flex flex-col gap-3 h-[560px]">
              {[1,2,3,4,5,6].map(i => <div key={i} className="flex-1 rounded-2xl bg-[#1E2A78]/6 animate-pulse" />)}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (destinations.length === 0) return null;

  const featured = destinations[selectedIdx];
  const prev     = prevIdx !== null ? destinations[prevIdx] : null;

  return (
    <section className="bg-[#FAF9F5] py-24 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section Header ─────────────────────────────── */}
        <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 ${isRTL ? 'text-right' : ''}`}>
          <div>
            {/* Editorial label */}
            <div className={`flex items-center gap-3 mb-5 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <span className="text-[#1E2A78]/20 text-[11px] font-bold tracking-[0.4em] uppercase select-none">01</span>
              <span className="h-px w-10 bg-[#F26522]/60" />
              <span className="text-[#F26522] text-[11px] font-bold tracking-[0.3em] uppercase">
                {T.sectionLabel}
              </span>
            </div>

            {/* Heading */}
            <h2 className="font-display text-5xl md:text-6xl font-light text-[#0F1226] tracking-tight leading-[1.1]">
              {T.title}{' '}
              <em className="text-[#F26522] not-italic font-semibold">{T.titleAccent}</em>
            </h2>

            <p className="text-[#5B6178] mt-4 text-[15px] max-w-xl font-light leading-relaxed">
              {T.subtitle}
            </p>
          </div>

          {/* View all button */}
          <a
            href="/destinations"
            className={`group inline-flex items-center gap-2.5 text-[#1E2A78] text-sm font-semibold
              border border-[#1E2A78]/18 hover:border-[#F26522] hover:text-[#F26522]
              px-5 py-3 rounded-2xl transition-all duration-300 flex-shrink-0
              hover:bg-[#F26522]/4 hover:shadow-[0_4px_16px_rgba(242,101,34,0.15)]
              ${isRTL ? 'flex-row-reverse self-start sm:self-auto' : 'self-start sm:self-auto'}`}
          >
            {T.viewAll}
            <span className={`transition-transform duration-300 ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}>
              <ArrowIcon rtl={isRTL} />
            </span>
          </a>
        </div>

        {/* ── Split Layout ────────────────────────────────── */}
        {/*
          dir="rtl" on the <section> makes CSS grid place column-1 on the RIGHT.
          So FeaturedCard (1fr, first in DOM) = right in Arabic, left in English.
        */}
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 290px' }}>

          {/* ── Featured Card ─── */}
          <div className="relative rounded-[2rem] overflow-hidden h-[560px] shadow-[0_32px_80px_rgba(15,18,38,0.22)] group">

            {/* Previous image (fades out) */}
            {prev && (
              <img
                key={`prev-${prev.image}`}
                src={prev.image}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ animation: 'imgFadeOut 0.7s ease forwards' }}
              />
            )}

            {/* Current image (Ken Burns + fade in) */}
            <img
              key={`curr-${featured.image}`}
              src={featured.image}
              alt={featured.displayName}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ animation: 'kenBurns 12s ease-out forwards, imgFadeIn 0.7s ease forwards' }}
            />

            {/* Cinematic overlay layers */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />

            {/* Top badge */}
            {selectedIdx === 0 && (
              <div className={`absolute top-6 ${isRTL ? 'right-6' : 'left-6'}`}>
                <span className="inline-flex items-center gap-1.5 bg-[#F26522] text-white text-[10px] font-bold px-3.5 py-1.5 rounded-full shadow-lg shadow-[#F26522]/40 tracking-wider uppercase">
                  <StarIcon />
                  {T.topPick}
                </span>
              </div>
            )}

            {/* Destination counter (top right / top left for RTL) */}
            <div className={`absolute top-6 ${isRTL ? 'left-6' : 'right-6'}`}>
              <span className="text-white/30 text-xs font-mono tracking-widest" dir="ltr">
                {String(selectedIdx + 1).padStart(2,'0')} / {String(destinations.length).padStart(2,'0')}
              </span>
            </div>

            {/* Bottom content */}
            <div className={`absolute bottom-0 inset-x-0 p-7 sm:p-9 ${isRTL ? 'text-right' : 'text-left'}`}>

              {/* Country label */}
              <p className="text-[#F26522]/75 text-[10px] font-bold tracking-[0.3em] uppercase mb-2">
                {featured.city_name} · {T.malaysia}
              </p>

              {/* City name — large serif display */}
              <h3
                className="font-display font-light text-white leading-none mb-6"
                style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', textShadow: '0 2px 40px rgba(0,0,0,0.4)' }}
              >
                {featured.displayName}
              </h3>

              {/* Stats bar — rating + price only */}
              <div className={`inline-flex items-center gap-0 mb-6 rounded-2xl overflow-hidden
                border border-white/12 shadow-[0_8px_32px_rgba(0,0,0,0.3)]
                ${isRTL ? 'flex-row-reverse' : ''}`}
                style={{ backdropFilter: 'blur(16px)', background: 'rgba(0,0,0,0.35)' }}
              >
                {[
                  { icon: <StarIcon />, value: featured.rating ?? '—', label: T.rating  },
                  { icon: null,         value: `${featured.price ?? '—'}`, label: T.perNight },
                ].map((s, i, arr) => (
                  <div
                    key={i}
                    className={`text-center py-3.5 px-8
                      ${i < arr.length - 1
                        ? isRTL ? 'border-l border-white/10' : 'border-r border-white/10'
                        : ''
                      }`}
                  >
                    <div className={`flex items-center justify-center gap-1.5 text-[#F26522] mb-0.5
                      ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {s.icon && <span className="opacity-80">{s.icon}</span>}
                      <span className="font-display text-xl font-semibold leading-none">
                        {s.value}
                      </span>
                    </div>
                    <p className="text-[9px] text-white/45 tracking-wide uppercase leading-none">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => onSelectCity?.(
                  { city_id: featured.city_id, city_name: featured.city_name },
                  featured.displayName,
                  featured.image,
                )}
                className={`group/btn inline-flex items-center gap-3
                  bg-[#F26522] hover:bg-[#E05A1A]
                  text-white font-semibold text-sm tracking-wide
                  px-7 py-3.5 rounded-2xl
                  shadow-[0_8px_32px_rgba(242,101,34,0.45)]
                  hover:shadow-[0_12px_40px_rgba(242,101,34,0.55)]
                  transition-all duration-300 hover:-translate-y-0.5
                  ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                {T.explore}
                <span className={`transition-transform duration-300
                  ${isRTL ? 'group-hover/btn:-translate-x-1' : 'group-hover/btn:translate-x-1'}`}>
                  <ArrowIcon rtl={isRTL} />
                </span>
              </button>
            </div>
          </div>

          {/* ── Mini Cards Panel ─── */}
          <div
            className="flex flex-col gap-2.5 h-[560px] overflow-y-auto"
            style={{ scrollbarWidth: 'none' }}
          >
            {destinations.map((d, i) => {
              const isActive = i === selectedIdx;
              const num = String(i + 1).padStart(2, '0');
              return (
                <button
                  key={`${d.city_id ?? d.city_name}-${i}`}
                  onClick={() => handleSelect(i)}
                  className={`
                    relative flex-1 rounded-2xl overflow-hidden cursor-pointer
                    transition-all duration-400 group/card text-left
                    min-h-[72px]
                    ${isActive
                      ? 'shadow-[0_8px_28px_rgba(242,101,34,0.3)] scale-[1.01]'
                      : 'opacity-70 hover:opacity-95 hover:scale-[1.005] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]'
                    }
                  `}
                >
                  {/* Image */}
                  <img
                    src={d.image}
                    alt={d.displayName}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                  />

                  {/* Subtle bottom gradient for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent transition-opacity duration-300" />

                  {/* Hover: extra brightness overlay */}
                  <div className="absolute inset-0 bg-white/0 group-hover/card:bg-white/5 transition-all duration-300" />

                  {/* Selected accent border */}
                  <div className={`
                    absolute top-0 bottom-0 w-[3px]
                    transition-all duration-300
                    ${isRTL ? 'right-0' : 'left-0'}
                    ${isActive ? 'bg-[#F26522] opacity-100' : 'bg-transparent opacity-0'}
                  `} />

                  {/* City name — bottom right, navy → orange on hover */}
                  <div className="absolute bottom-3 right-3">
                    <span
                      className={`
                        inline-block font-semibold leading-none
                        bg-white/90 backdrop-blur-sm rounded-lg
                        shadow-[0_2px_8px_rgba(0,0,0,0.15)]
                        transition-all duration-300 ease-out
                        ${isActive
                          ? 'text-[#F26522] text-[13px] px-3 py-1.5'
                          : 'text-[#1E2A78] text-[10px] px-2.5 py-1 group-hover/card:text-[#F26522] group-hover/card:text-[13px] group-hover/card:px-3 group-hover/card:py-1.5'
                        }
                      `}
                    >
                      {d.displayName}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* ── CSS Animations ───────────────────────────────── */}
      <style>{`
        @keyframes kenBurns {
          0%   { transform: scale(1.06) translate(0.5%, 0.5%); }
          100% { transform: scale(1.0)  translate(0%, 0%); }
        }
        @keyframes imgFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes imgFadeOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
      `}</style>
    </section>
  );
}
