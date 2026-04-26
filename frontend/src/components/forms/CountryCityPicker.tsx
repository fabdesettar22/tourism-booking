// frontend/src/components/forms/CountryCityPicker.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../hooks/useLanguage';

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// ════════════════════════════════════════════════════════════════
// Module-level cache
// ════════════════════════════════════════════════════════════════
const _cache = {
  countries:    null as any[] | null,
  countriesAt:  0,
  cities:       new Map<string, any[]>(),
  citiesAt:     new Map<string, number>(),
};
const CACHE_TTL = 5 * 60 * 1000;

// ════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════

interface Country {
  id: number;
  iso2: string;
  iso3: string;
  name_en: string;
  name_ar: string;
  phone_code: string;
  label: string;
}

interface City {
  id: number;
  name: string;
  name_ar: string;
  name_en: string;
  admin1: string;
  country_id: number;
  country_iso2: string;
  population: number;
  label: string;
}

interface Props {
  countryCode?: string;
  cityName?: string;
  initialCityId?: number | string;
  initialCountryId?: number | string;
  onCountryChange?: (iso2: string, country: Country | null) => void;
  onCityChange?: (cityName: string, city: City | null) => void;
  showCountry?: boolean;
  lockedCountryCode?: string;
  /** Override the auto-detected language (otherwise uses useLanguage) */
  lang?: 'ar' | 'en' | 'ms';
  /** Override RTL detection (otherwise uses useLanguage) */
  isRTL?: boolean;
  required?: boolean;
  countryLabel?: string;
  cityLabel?: string;
  inputClassName?: string;
  disabled?: boolean;
}

// ════════════════════════════════════════════════════════════════
// Component
// ════════════════════════════════════════════════════════════════

export function CountryCityPicker({
  countryCode = '',
  cityName = '',
  initialCityId,
  initialCountryId,
  onCountryChange,
  onCityChange,
  showCountry = true,
  lockedCountryCode,
  lang: langProp,
  isRTL: isRTLProp,
  required = false,
  countryLabel,
  cityLabel,
  inputClassName,
  disabled = false,
}: Props) {

  // i18n: prop overrides take precedence; otherwise uses context
  const ctx = useLanguage();
  const lang = (langProp ?? ctx.lang) as 'ar' | 'en' | 'ms';
  const isRTL = isRTLProp !== undefined ? isRTLProp : ctx.isRTL;
  const t = ctx.t;

  // ── State ──────────────────────────────────────────
  const [countries, setCountries]       = useState<Country[]>([]);
  const [countryQuery, setCountryQuery] = useState('');
  const [showCountryList, setShowCountryList] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  const [cities, setCities]             = useState<City[]>([]);
  const [cityQuery, setCityQuery]       = useState(cityName);
  const [showCityList, setShowCityList] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const countryRef = useRef<HTMLDivElement>(null);
  const cityRef    = useRef<HTMLDivElement>(null);

  // ── Helper: name based on language ────────────────
  const getLabel = (item: { name_ar?: string; name_en?: string; name?: string; label?: string }) => {
    if (lang === 'ar') return item.name_ar || item.name_en || item.name || item.label || '';
    return item.name_en || item.name || item.label || '';
  };

  // ── Default styles ─────────────────────────────────
  const defaultInputCls = isRTL
    ? 'w-full h-12 pr-4 pl-10 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-colors bg-white'
    : 'w-full h-12 pl-4 pr-10 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-colors bg-white';

  const inputCls = inputClassName || defaultInputCls;
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide';

  // ── Fetch countries (cached + debounced) ──────────
  useEffect(() => {
    const now = Date.now();
    const q = countryQuery.trim().toLowerCase();

    if (!q && _cache.countries && (now - _cache.countriesAt) < CACHE_TTL) {
      setCountries(_cache.countries);
      return;
    }

    const handler = setTimeout(async () => {
      try {
        const url = q
          ? `${BASE}/api/v1/locations/countries/?search=${encodeURIComponent(q)}`
          : `${BASE}/api/v1/locations/countries/`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.results ?? []);
          setCountries(list);
          if (!q) {
            _cache.countries   = list;
            _cache.countriesAt = now;
          }
        }
      } catch {}
    }, 300);
    return () => clearTimeout(handler);
  }, [countryQuery]);

  // ── Initial: country from countryCode ─────────────
  useEffect(() => {
    if (!countryCode || selectedCountry?.iso2 === countryCode) return;
    (async () => {
      try {
        const res = await fetch(`${BASE}/api/v1/locations/countries/?search=${countryCode}`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.results ?? []);
          const exact = list.find((c: Country) => c.iso2 === countryCode);
          if (exact) {
            setSelectedCountry(exact);
            setCountryQuery(getLabel(exact));
          }
        }
      } catch {}
    })();
  }, [countryCode]);

  // ── Initial: city by ID (edit mode) ────────────────
  useEffect(() => {
    if (!initialCityId) return;
    (async () => {
      try {
        const res = await fetch(`${BASE}/api/v1/locations/cities/${initialCityId}/`);
        if (res.ok) {
          const city = await res.json();
          setCityQuery(getLabel(city));
          if (city.country_id && !selectedCountry) {
            const cRes = await fetch(`${BASE}/api/v1/locations/countries/${city.country_id}/`);
            if (cRes.ok) {
              const country = await cRes.json();
              setSelectedCountry(country);
              setCountryQuery(getLabel(country));
            }
          }
        }
      } catch {}
    })();
  }, [initialCityId]);

  // ── Initial: country by ID (edit mode) ─────────────
  useEffect(() => {
    if (!initialCountryId || selectedCountry) return;
    (async () => {
      try {
        const res = await fetch(`${BASE}/api/v1/locations/countries/${initialCountryId}/`);
        if (res.ok) {
          const country = await res.json();
          setSelectedCountry(country);
          setCountryQuery(getLabel(country));
        }
      } catch {}
    })();
  }, [initialCountryId]);

  // ── Fetch cities (cached) ──────────────────────────
  const fetchCities = useCallback(async (iso2: string, q: string = '') => {
    if (!iso2) { setCities([]); return; }

    const cacheKey = `${iso2}:${q.toLowerCase()}`;
    const now      = Date.now();
    const cachedAt = _cache.citiesAt.get(cacheKey) || 0;

    if (_cache.cities.has(cacheKey) && (now - cachedAt) < CACHE_TTL) {
      setCities(_cache.cities.get(cacheKey)!);
      return;
    }

    setLoadingCities(true);
    try {
      const url = `${BASE}/api/v1/locations/cities/?country_code=${iso2}${q ? `&q=${encodeURIComponent(q)}` : ''}&limit=50`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results ?? []);
        setCities(list);
        _cache.cities.set(cacheKey, list);
        _cache.citiesAt.set(cacheKey, now);
      }
    } catch {} finally {
      setLoadingCities(false);
    }
  }, []);

  useEffect(() => {
    const code = lockedCountryCode || selectedCountry?.iso2;
    if (code) fetchCities(code, '');
  }, [selectedCountry?.iso2, lockedCountryCode, fetchCities]);

  useEffect(() => {
    const code = lockedCountryCode || selectedCountry?.iso2;
    if (!code) return;
    const handler = setTimeout(() => {
      fetchCities(code, cityQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [cityQuery, selectedCountry?.iso2, lockedCountryCode, fetchCities]);

  // ── Outside click → close dropdowns ────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setShowCountryList(false);
      }
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setShowCityList(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Handlers ───────────────────────────────────────
  const handleCountrySelect = (c: Country) => {
    setSelectedCountry(c);
    setCountryQuery(getLabel(c));
    setShowCountryList(false);
    setCityQuery('');
    onCountryChange?.(c.iso2, c);
    onCityChange?.('', null);
  };

  const handleCitySelect = (city: City) => {
    const cityLabelStr = getLabel(city);
    setCityQuery(cityLabelStr);
    setShowCityList(false);
    onCityChange?.(cityLabelStr, city);
  };

  // ── Render ─────────────────────────────────────────
  return (
    <div className={`grid grid-cols-1 ${showCountry && !lockedCountryCode ? 'md:grid-cols-2' : ''} gap-4`}>

      {/* Country Picker */}
      {showCountry && !lockedCountryCode && (
        <div ref={countryRef} className="relative">
          <label className={labelCls}>
            {(countryLabel || t('countryCity.countryLabel')).replace(/\s*\*\s*$/, '')}
            {required && <span className="text-red-500 ms-1">*</span>}
          </label>
          <div className="relative">
            <input
              type="text"
              className={inputCls}
              placeholder={t('countryCity.searchCountry')}
              value={countryQuery}
              onChange={(e) => {
                setCountryQuery(e.target.value);
                setShowCountryList(true);
                if (selectedCountry && e.target.value !== getLabel(selectedCountry)) {
                  setSelectedCountry(null);
                  onCountryChange?.('', null);
                }
              }}
              onFocus={() => setShowCountryList(true)}
              disabled={disabled}
              autoComplete="off"
            />
            <span className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`}>
              🌍
            </span>
          </div>

          {showCountryList && countries.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-50">
              {countries.slice(0, 100).map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleCountrySelect(c)}
                  className={`w-full ${isRTL ? 'text-right' : 'text-left'} px-4 py-2.5 hover:bg-orange-50 transition-colors flex items-center justify-between gap-2 border-b border-gray-100 last:border-0`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  <span className="text-sm text-gray-900">{getLabel(c)}</span>
                  <span className="text-xs text-gray-400 font-mono">{c.iso2}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* City Picker */}
      <div ref={cityRef} className="relative">
        <label className={labelCls}>
          {cityLabel || t('countryCity.cityLabel')}
          {required && <span className="text-red-500 ms-1">*</span>}
        </label>
        <div className="relative">
          <input
            type="text"
            className={inputCls}
            placeholder={
              !selectedCountry && !lockedCountryCode
                ? t('countryCity.selectCountryFirst')
                : t('countryCity.searchCity')
            }
            value={cityQuery}
            onChange={(e) => {
              setCityQuery(e.target.value);
              setShowCityList(true);
              onCityChange?.(e.target.value, null);
            }}
            onFocus={() => setShowCityList(true)}
            disabled={disabled || (!selectedCountry && !lockedCountryCode)}
            autoComplete="off"
          />
          <span className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`}>
            📍
          </span>
        </div>

        {showCityList && (selectedCountry || lockedCountryCode) && (
          <div className="absolute top-full left-0 right-0 mt-1 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-50">
            {loadingCities ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                {t('countryCity.loading')}
              </div>
            ) : cities.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                {t('countryCity.noResults')}
              </div>
            ) : (
              cities.map(city => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => handleCitySelect(city)}
                  className={`w-full ${isRTL ? 'text-right' : 'text-left'} px-4 py-2.5 hover:bg-orange-50 transition-colors flex items-center justify-between gap-2 border-b border-gray-100 last:border-0`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  <div className="flex flex-col items-start">
                    <span className="text-sm text-gray-900">{getLabel(city)}</span>
                    {city.admin1 && (
                      <span className="text-xs text-gray-400">{t('countryCity.region').replace('{name}', city.admin1)}</span>
                    )}
                  </div>
                  {city.population > 0 && (
                    <span className="text-xs text-gray-400">
                      {city.population.toLocaleString()}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
