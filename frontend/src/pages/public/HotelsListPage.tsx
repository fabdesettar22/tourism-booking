import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2, Star, Search, MapPin, SlidersHorizontal, X,
  ChevronRight, ChevronLeft, ChevronDown, Grid3X3, List, ArrowUpDown,
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { HotelCard } from '../../components/public/HotelCard';
import { HotelListCard } from '../../components/public/HotelListCard';
import { CountryCityPicker } from '../../components/forms/CountryCityPicker';
import { fetchPublicHotels, type PublicHotelListItem } from '../../services/publicApi';

type SortKey = 'recommended' | 'starsDesc' | 'starsAsc' | 'nameAsc';
type ViewMode = 'grid' | 'list';

const T = {
  ar: {
    title: 'فنادق ماليزيا', subtitle: 'احجز إقامتك المثالية بأفضل الأسعار',
    home: 'الرئيسية', hotels: 'الفنادق',
    search: 'ابحث باسم الفندق أو المدينة...',
    filters: 'الفلاتر', stars: 'تصنيف الفندق', reviews: 'عدد التقييمات', location: 'الوجهة',
    any: 'أي', empty: 'لا توجد فنادق مطابقة', emptyHint: 'جرّب إزالة بعض الفلاتر',
    count: (n: number) => `${n} فندق`, reset: 'مسح الكل', applyFilters: 'تطبيق',
    sort: 'الترتيب', view: 'العرض', loadMore: 'عرض المزيد',
    sortOpts: { recommended: 'الموصى به', starsDesc: 'النجوم: من الأعلى', starsAsc: 'النجوم: من الأقل', nameAsc: 'الاسم: أ-ي' },
  },
  en: {
    title: 'Malaysia Hotels', subtitle: 'Book your perfect stay at the best prices',
    home: 'Home', hotels: 'Hotels',
    search: 'Search by hotel or city...',
    filters: 'Filters', stars: 'Hotel Class', reviews: 'Reviews', location: 'Destination',
    any: 'Any', empty: 'No hotels match your filters', emptyHint: 'Try removing some filters',
    count: (n: number) => `${n} properties`, reset: 'Clear all', applyFilters: 'Apply',
    sort: 'Sort', view: 'View', loadMore: 'Show more',
    sortOpts: { recommended: 'Recommended', starsDesc: 'Stars: high to low', starsAsc: 'Stars: low to high', nameAsc: 'Name (A-Z)' },
  },
  ms: {
    title: 'Hotel Malaysia', subtitle: 'Tempah penginapan sempurna pada harga terbaik',
    home: 'Utama', hotels: 'Hotel',
    search: 'Cari hotel atau bandar...',
    filters: 'Penapis', stars: 'Kelas Hotel', reviews: 'Ulasan', location: 'Destinasi',
    any: 'Mana-mana', empty: 'Tiada hotel sepadan', emptyHint: 'Cuba alih keluar penapis',
    count: (n: number) => `${n} hotel`, reset: 'Padam semua', applyFilters: 'Guna',
    sort: 'Susun', view: 'Paparan', loadMore: 'Lihat lagi',
    sortOpts: { recommended: 'Disyorkan', starsDesc: 'Bintang: tinggi-rendah', starsAsc: 'Bintang: rendah-tinggi', nameAsc: 'Nama (A-Z)' },
  },
};


const PAGE_SIZE = 24;

export function HotelsListPage() {
  const { lang, isRTL, changeLang, t } = useLanguage();
  const tr = T[lang];
  const ChevronStart = isRTL ? ChevronLeft : ChevronRight;

  const [hotels, setHotels] = useState<PublicHotelListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [starsMin, setStarsMin] = useState<number | undefined>();
  const [countryCode, setCountryCode] = useState('');
  const [cityId, setCityId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('recommended');
  const [view, setView] = useState<ViewMode>('grid');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // close sort dropdown on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPublicHotels({
      limit: 60,
      stars_min: starsMin,
      country_code: countryCode || undefined,
      city_id: cityId || undefined,
    })
      .then((data) => { setHotels(data); setVisible(PAGE_SIZE); })
      .catch(() => setHotels([]))
      .finally(() => setLoading(false));
  }, [starsMin, countryCode, cityId]);

  const filtered = useMemo(() => hotels.filter(h => {
    if (query.trim()) {
      const q = query.toLowerCase();
      const hit = h.name.toLowerCase().includes(q) ||
                  (h.city_name || '').toLowerCase().includes(q) ||
                  (h.country_name || '').toLowerCase().includes(q);
      if (!hit) return false;
    }
    return true;
  }), [hotels, query]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortKey) {
      case 'starsDesc': arr.sort((a, b) => b.stars - a.stars); break;
      case 'starsAsc':  arr.sort((a, b) => a.stars - b.stars); break;
      case 'nameAsc': arr.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'recommended':
      default: arr.sort((a, b) => b.stars - a.stars);
    }
    return arr;
  }, [filtered, sortKey]);

  const shown = sorted.slice(0, visible);

  // Active filter chips with individual removal
  const chips: { label: string; clear: () => void }[] = [];
  if (starsMin) chips.push({ label: `${starsMin}+ ★`, clear: () => setStarsMin(undefined) });
  if (countryCode) chips.push({ label: countryCode, clear: () => { setCountryCode(''); setCityId(null); } });
  if (cityId) chips.push({ label: `City #${cityId}`, clear: () => setCityId(null) });

  // Counts per stars option (pre-stars filter, post-other filters)
  const starsCount = (s: number) => hotels.filter(h => {
    if (h.stars < s) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      if (!h.name.toLowerCase().includes(q) && !(h.city_name || '').toLowerCase().includes(q)) return false;
    }
    return true;
  }).length;

  const reset = () => {
    setQuery(''); setStarsMin(undefined);
    setCountryCode(''); setCityId(null); setSortKey('recommended');
  };

  const FiltersPanel = (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#FF6B35]" /> {tr.location}
        </h3>
        <CountryCityPicker
          countryCode={countryCode}
          cityName=""
          onCountryChange={(iso2) => { setCountryCode(iso2); setCityId(null); }}
          onCityChange={(_n, city) => setCityId(city?.id ?? null)}
          lang={lang}
          isRTL={isRTL}
        />
      </div>

      <div className="border-t border-gray-100" />

      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">{tr.stars}</h3>
        <div className="space-y-2">
          {[5, 4, 3].map((s) => {
            const active = starsMin === s;
            const c = starsCount(s);
            return (
              <button
                key={s}
                onClick={() => setStarsMin(active ? undefined : s)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all border focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 ${
                  active
                    ? 'bg-orange-50 border-[#FF6B35] text-[#FF6B35] font-semibold'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="flex">
                    {Array.from({ length: s }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </span>
                  <span>{s}+</span>
                </span>
                <span className={`text-xs ${active ? 'text-[#FF6B35]' : 'text-gray-400'}`}>{c}</span>
              </button>
            );
          })}
        </div>
      </div>

      {chips.length > 0 && (
        <button onClick={reset} className="w-full text-sm text-gray-500 hover:text-[#FF6B35] py-2 underline">
          {tr.reset}
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F8FA]" dir={isRTL ? 'rtl' : 'ltr'}>
      <PublicNavbar lang={lang} onLangChange={changeLang} t={t} isRTL={isRTL} variant="solid" />

      {/* Hero */}
      <div className="relative pt-24 pb-10 bg-[#0F2742] overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=70&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F2742]/80 via-[#0F2742]/60 to-[#0F2742]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-white/70 mb-4">
            <Link to="/" className="hover:text-white">{tr.home}</Link>
            <ChevronStart className="w-3.5 h-3.5" />
            <span className="text-white font-medium">{tr.hotels}</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 tracking-tight">{tr.title}</h1>
          <p className="text-white/80 text-base sm:text-lg mb-7">{tr.subtitle}</p>

          {/* Search */}
          <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 p-1.5 max-w-3xl flex items-center">
            <Search className={`w-5 h-5 text-gray-400 ${isRTL ? 'mr-3 ml-1' : 'ml-3 mr-1'} shrink-0`} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={tr.search}
              className="flex-1 px-3 py-3 text-sm sm:text-base focus:outline-none bg-transparent"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-2 text-gray-400 hover:text-gray-600" aria-label="Clear">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sticky toolbar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">
            {loading ? '...' : tr.count(sorted.length)}
          </span>

          {chips.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-gray-300">•</span>
              {chips.map((c, i) => (
                <button
                  key={i}
                  onClick={c.clear}
                  className="group inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-orange-50 text-[#FF6B35] rounded-full font-medium hover:bg-orange-100"
                >
                  {c.label}
                  <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                </button>
              ))}
              <button onClick={reset} className="text-xs text-gray-500 hover:text-[#FF6B35] underline">
                {tr.reset}
              </button>
            </div>
          )}

          <div className={`${isRTL ? 'mr-auto' : 'ml-auto'} flex items-center gap-2`}>
            {/* Sort */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setSortOpen(o => !o)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
                aria-haspopup="listbox"
                aria-expanded={sortOpen}
              >
                <ArrowUpDown className="w-4 h-4" />
                <span className="hidden sm:inline">{tr.sortOpts[sortKey]}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
              </button>
              {sortOpen && (
                <div className={`absolute top-full mt-1 ${isRTL ? 'left-0' : 'right-0'} bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-40 min-w-[200px]`}>
                  {(Object.keys(tr.sortOpts) as SortKey[]).map(k => (
                    <button
                      key={k}
                      onClick={() => { setSortKey(k); setSortOpen(false); }}
                      className={`w-full text-start px-4 py-2.5 text-sm transition-colors hover:bg-orange-50 ${
                        sortKey === k ? 'text-[#FF6B35] font-semibold bg-orange-50' : 'text-gray-700'
                      }`}
                    >
                      {tr.sortOpts[k]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View toggle */}
            <div className="hidden sm:flex items-center bg-gray-100 rounded-xl p-0.5">
              <button
                onClick={() => setView('grid')}
                aria-label="Grid view"
                aria-pressed={view === 'grid'}
                className={`p-1.5 rounded-lg transition-colors ${view === 'grid' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                aria-label="List view"
                aria-pressed={view === 'list'}
                className={`p-1.5 rounded-lg transition-colors ${view === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile filter button */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
            >
              <SlidersHorizontal className="w-4 h-4" /> {tr.filters}
              {chips.length > 0 && (
                <span className="bg-[#FF6B35] text-white text-xs px-1.5 py-0.5 rounded-full">{chips.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-32 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#FF6B35]" /> {tr.filters}
              </h2>
              {FiltersPanel}
            </div>
          </aside>

          {/* Results */}
          <main>
            {loading ? (
              view === 'list' ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex gap-4 bg-white rounded-2xl border border-gray-100 p-4">
                      <div className="w-[280px] h-[200px] bg-gray-200 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-3 py-2">
                        <div className="h-3 bg-gray-200 rounded w-1/4" />
                        <div className="h-5 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-8">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-square rounded-2xl bg-gray-200 mb-3" />
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              )
            ) : sorted.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 py-16 px-6 text-center">
                <div className="text-5xl mb-3">🏨</div>
                <p className="text-gray-900 font-semibold mb-1">{tr.empty}</p>
                <p className="text-sm text-gray-500 mb-5">{tr.emptyHint}</p>
                {chips.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {chips.map((c, i) => (
                      <button
                        key={i}
                        onClick={c.clear}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-[#FF6B35] rounded-full text-sm hover:bg-orange-100"
                      >
                        <X className="w-3.5 h-3.5" /> {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : view === 'list' ? (
              <div className="space-y-4">
                {shown.map(h => <HotelListCard key={h.id} hotel={h} lang={lang} />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-8">
                {shown.map(h => <HotelCard key={h.id} hotel={h} lang={lang} />)}
              </div>
            )}

            {/* Load more */}
            {!loading && sorted.length > visible && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setVisible(v => v + PAGE_SIZE)}
                  className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-[#FF6B35] hover:text-[#FF6B35] shadow-sm transition-colors"
                >
                  {tr.loadMore} ({sorted.length - visible})
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFiltersOpen(false)} />
          <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} bottom-0 w-full max-w-sm bg-white shadow-2xl flex flex-col`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">{tr.filters}</h2>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-2 text-gray-500 hover:text-gray-900" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{FiltersPanel}</div>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-3 bg-[#FF6B35] text-white rounded-xl font-semibold hover:bg-[#e07a38] transition-colors"
              >
                {tr.applyFilters}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
