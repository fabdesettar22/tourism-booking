import { apiFetch, BASE } from '../../services/apiFetch';
import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import {
  X, ChevronLeft, ChevronRight, Loader2, CheckCircle2,
  Moon, Building2, MapPin, Plus, Minus, Check,
  Plane, Car, Camera, Trash2, Star, Filter, User, Users,
  Baby, BedDouble, AlertTriangle, Calculator
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────
interface Country   { id: number; name: string; }
interface City      { id: number; name: string; country: number; }
interface Hotel     { id: number; name: string; city: number; stars: number; image?: string; }

interface PersonConfig {
  type: 'adult' | 'child' | 'infant';
  age?: number;
  extra_bed: boolean;
}
interface PkgCity   { city_id: number; city_name: string; nights: number; order: number; }
interface PkgHotel  {
  temp_id: string;
  package_city_idx: number;
  hotel_id: number; hotel_name: string; hotel_stars: number; hotel_image?: string;
  room_type: string;
  check_in_date: string; check_out_date: string; nights: number;
  price_per_room_night_myr: number;
  source: string; includes_breakfast: boolean;
  profit_margin_pct?: number;
}
interface PkgFlight {
  from_city_id: number; from_city_name: string;
  to_city_id: number; to_city_name: string;
  price_adult_myr: number; price_child_myr: number; price_infant_myr: number;
}
interface PkgTransfer {
  city_id: number; city_name: string;
  transfer_type: string; price_myr: number;
}
interface PkgTour {
  city_id: number; city_name: string; tour_name: string;
  price_adult_myr: number; price_child_myr: number; price_infant_myr: number;
}

const ROOM_TYPES = ['standard','superior','deluxe','suite','twin','triple','family'];

// ─── StepBar ──────────────────────────────────────────────
function StepBar({ step, steps }: { step: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 overflow-x-auto gap-1">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-1 shrink-0">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
            ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-gray-200 text-gray-400'}`}>
            {i < step ? <Check className="w-3.5 h-3.5"/> : i + 1}
          </div>
          <span className={`text-xs font-medium hidden md:block whitespace-nowrap
            ${i === step ? 'text-emerald-600' : i < step ? 'text-gray-500' : 'text-gray-400'}`}>{s}</span>
          {i < steps.length - 1 && <div className={`w-4 h-0.5 mx-0.5 ${i < step ? 'bg-emerald-400' : 'bg-gray-200'}`}/>}
        </div>
      ))}
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────
interface Props { onClose: () => void; onSuccess: () => void; }

export function CustomPackageWizard({ onClose, onSuccess }: Props) {
  const { t, isRTL } = useLanguage();
  const STEPS = t('customWiz.steps') as unknown as string[]; // returns array via translate engine

  const [step, setStep]           = useState(0);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [packageId, setPackageId] = useState<number | null>(null);

  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities]       = useState<City[]>([]);
  const [hotels, setHotels]       = useState<Hotel[]>([]);

  // Step 0
  const [clientName, setClientName]   = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [countryId, setCountryId]     = useState<number | null>(null);
  const [totalNights, setTotalNights] = useState(7);
  const [totalDays, setTotalDays]     = useState(8);

  // Step 1
  const [persons, setPersons] = useState<PersonConfig[]>([
    { type: 'adult', extra_bed: false },
    { type: 'adult', extra_bed: false },
  ]);

  const adults   = persons.filter(p => p.type === 'adult').length;
  const children = persons.filter(p => p.type === 'child').length;
  const infants  = persons.filter(p => p.type === 'infant').length;
  const totalPax = persons.length;

  // Step 2
  const [pkgCities, setPkgCities]   = useState<PkgCity[]>([]);
  const citiesNightsSum = pkgCities.reduce((s, c) => s + c.nights, 0);

  // Step 3
  const [pkgHotels, setPkgHotels]   = useState<PkgHotel[]>([]);
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [roomTypeFilter, setRoomTypeFilter] = useState('superior');
  const [hotelPrices, setHotelPrices] = useState<Record<string, any>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  // Step 4
  const [pkgFlights, setPkgFlights] = useState<PkgFlight[]>([]);
  const [flightFilter, setFlightFilter] = useState<number | null>(null);

  // Step 5
  const [pkgTransfers, setPkgTransfers] = useState<PkgTransfer[]>([]);
  const [pkgTours, setPkgTours]         = useState<PkgTour[]>([]);
  const [transferFilter, setTransferFilter] = useState<number | null>(null);
  const [tourFilter, setTourFilter]         = useState<number | null>(null);

  // Step 6
  const [pricing, setPricing]     = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/v1/locations/countries/').then(r => r.json()),
      apiFetch('/api/v1/locations/cities/').then(r => r.json()),
      apiFetch('/api/v1/hotels/').then(r => r.json()),
    ]).then(([c, ci, h]) => {
      setCountries(Array.isArray(c) ? c : []);
      setCities(Array.isArray(ci) ? ci : []);
      setHotels(Array.isArray(h) ? h : h.results || []);
    });
  }, []);

  const filteredCities = cities.filter(c => c.country === countryId);

  const fetchHotelPrices = useCallback(async (cityIdx: number) => {
    const city = pkgCities[cityIdx];
    if (!city) return;
    const cityHotels = hotels.filter(h => h.city === city.city_id);
    setLoadingPrices(true);
    const prices: Record<string, any> = {};
    await Promise.all(cityHotels.map(async h => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const checkout = new Date(Date.now() + city.nights * 86400000).toISOString().split('T')[0];
        const res = await apiFetch(
          `/api/v1/packages/${packageId}/best-hotel-price/?hotel_id=${h.id}&room_type=${roomTypeFilter}&check_in=${today}&check_out=${checkout}&pax_count=${totalPax}`
        );
        if (res.ok) prices[h.id] = await res.json();
      } catch {}
    }));
    setHotelPrices(prices);
    setLoadingPrices(false);
  }, [pkgCities, hotels, packageId, roomTypeFilter, totalPax]);

  const savePackage = async (): Promise<number | null> => {
    const agency = JSON.parse(localStorage.getItem('user') || '{}')?.agency || 1;
    const res = await apiFetch('/api/v1/packages/', {
      method: 'POST',
      body: JSON.stringify({
        title: `${clientName} — ${totalNights}`,
        agency, country: countryId,
        total_nights: totalNights, total_days: totalDays,
        status: 'draft',
        peak_surcharge_pct: 0,
        currency_cost: 'MYR', currency_sell: 'EUR',
        is_custom_order: true,
        client_name: clientName, client_phone: clientPhone, client_email: clientEmail,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id;
  };

  const handleNext = async () => {
    setError('');

    if (step === 0) {
      if (!clientName.trim() || !clientPhone.trim() || !countryId) {
        setError(t('customWiz.errors.requireBasics'));
        return;
      }
      setSaving(true);
      const id = await savePackage();
      setSaving(false);
      if (!id) { setError(t('customWiz.errors.packageFailed')); return; }
      setPackageId(id);
    }

    if (step === 1 && packageId) {
      if (adults === 0) { setError(t('customWiz.errors.requireAdult')); return; }
      setSaving(true);
      await apiFetch(`/api/v1/packages/${packageId}/set-pax/`, {
        method: 'POST',
        body: JSON.stringify({
          adults_count: adults, children_count: children, infants_count: infants,
          extra_bed_children: persons.filter(p => p.type === 'child').some(p => p.extra_bed),
          extra_bed_infants: persons.filter(p => p.type === 'infant').some(p => p.extra_bed),
        }),
      });
      setSaving(false);
    }

    if (step === 2 && packageId) {
      if (pkgCities.length === 0) { setError(t('customWiz.errors.requireCity')); return; }
      if (citiesNightsSum !== totalNights) {
        setError(t('customWiz.errors.nightsMismatch')
          .replace('{sum}', String(citiesNightsSum))
          .replace('{total}', String(totalNights)));
        return;
      }
      setSaving(true);
      for (const c of pkgCities) {
        await apiFetch(`/api/v1/packages/${packageId}/add-city/`, {
          method: 'POST',
          body: JSON.stringify({ city_id: c.city_id, nights: c.nights, order: c.order }),
        });
      }
      setSaving(false);
      await fetchHotelPrices(0);
    }

    if (step === 3 && packageId) {
      if (pkgHotels.length === 0) { setError(t('customWiz.errors.requireHotel')); return; }
      setSaving(true);
      for (const h of pkgHotels) {
        await apiFetch(`/api/v1/packages/${packageId}/add-hotel/`, {
          method: 'POST',
          body: JSON.stringify({
            package_city_id: h.package_city_idx,
            hotel_id: h.hotel_id, room_type: h.room_type,
            rooms_count: Math.ceil(totalPax / 2),
            check_in_date: h.check_in_date, check_out_date: h.check_out_date,
            nights: h.nights, price_per_room_night_myr: h.price_per_room_night_myr,
            source: h.source,
          }),
        });
      }
      setSaving(false);
    }

    if (step === 4 && packageId) {
      setSaving(true);
      for (const f of pkgFlights) {
        await apiFetch(`/api/v1/packages/${packageId}/add-flight/`, {
          method: 'POST', body: JSON.stringify(f),
        });
      }
      setSaving(false);
    }

    if (step === 5 && packageId) {
      setSaving(true);
      for (const tt of pkgTransfers) {
        await apiFetch(`/api/v1/packages/${packageId}/add-transfer/`, {
          method: 'POST', body: JSON.stringify(tt),
        });
      }
      for (const tt of pkgTours) {
        await apiFetch(`/api/v1/packages/${packageId}/add-tour/`, {
          method: 'POST', body: JSON.stringify(tt),
        });
      }
      setSaving(false);
      setCalculating(true);
      const res = await apiFetch(`/api/v1/packages/${packageId}/calculate-price/`, { method: 'POST' });
      if (res.ok) setPricing(await res.json());
      setCalculating(false);
    }

    setStep(s => s + 1);
  };

  const handlePublish = async () => {
    if (!packageId) return;
    setSaving(true);
    await apiFetch(`/api/v1/packages/${packageId}/publish/`, { method: 'POST' });
    setSaving(false);
    onSuccess();
  };

  const addPerson = (type: 'adult' | 'child' | 'infant') => {
    setPersons(prev => [...prev, { type, age: type !== 'adult' ? 1 : undefined, extra_bed: false }]);
  };

  const removePerson = (idx: number) => {
    setPersons(prev => prev.filter((_, i) => i !== idx));
  };

  const updatePerson = (idx: number, data: Partial<PersonConfig>) => {
    setPersons(prev => prev.map((p, i) => i === idx ? { ...p, ...data } : p));
  };

  const filteredHotels = (cityId: number) => hotels
    .filter(h => h.city === cityId)
    .filter(h => !starFilter || h.stars === starFilter)
    .sort((a, b) => {
      const pa = parseFloat(hotelPrices[a.id]?.price_myr || '9999999');
      const pb = parseFloat(hotelPrices[b.id]?.price_myr || '9999999');
      return pa - pb;
    });

  // الترجمات للأنواع غير القابلة للترجمة (ROOM_TYPES, transfer types)
  const transferTypeLabel = (key: string) => t(`customWiz.step5.transferTypes.${key}`);

  const stepsArray = Array.isArray(STEPS) ? STEPS : ['','','','','','',''];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[95vh]">

        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t('customWiz.title')}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{stepsArray[step]}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5"/></button>
        </div>

        <StepBar step={step} steps={stepsArray}/>

        {error && (
          <div className="mx-5 mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 shrink-0"/> {error}
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-6 space-y-4">

          {/* ── Step 0 ── */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                <h3 className="font-semibold text-blue-800 text-sm flex items-center gap-2">
                  <User className="w-4 h-4"/> {t('customWiz.step0.clientInfo')}
                </h3>
                <input value={clientName} onChange={e => setClientName(e.target.value)}
                  placeholder={t('customWiz.step0.clientName')}
                  className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"/>
                <input value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                  placeholder={t('customWiz.step0.clientPhone')} dir="ltr"
                  className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"/>
                <input value={clientEmail} onChange={e => setClientEmail(e.target.value)}
                  placeholder={t('customWiz.step0.clientEmail')} dir="ltr"
                  className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('customWiz.step0.country')}</label>
                <select value={countryId || ''} onChange={e => setCountryId(Number(e.target.value))}
                  className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white">
                  <option value="">{t('customWiz.step0.selectCountry')}</option>
                  {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('customWiz.step0.nights')}</label>
                  <input type="number" min={1} value={totalNights}
                    onChange={e => { setTotalNights(Number(e.target.value)); setTotalDays(Number(e.target.value) + 1); }}
                    className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" dir="ltr"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('customWiz.step0.days')}</label>
                  <input type="number" min={1} value={totalDays} onChange={e => setTotalDays(Number(e.target.value))}
                    className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" dir="ltr"/>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => addPerson('adult')}
                  className="py-2.5 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 text-sm hover:bg-blue-50 flex items-center justify-center gap-1.5">
                  <Plus className="w-3.5 h-3.5"/>
                  <span>{t('customWiz.step1.addAdult')}</span>
                </button>
                <button onClick={() => addPerson('child')}
                  className="py-2.5 border-2 border-dashed border-amber-200 rounded-xl text-amber-600 text-sm hover:bg-amber-50 flex items-center justify-center gap-1.5">
                  <Plus className="w-3.5 h-3.5"/>
                  <span>{t('customWiz.step1.addChild')}</span>
                </button>
                <button onClick={() => addPerson('infant')}
                  className="py-2.5 border-2 border-dashed border-purple-200 rounded-xl text-purple-600 text-sm hover:bg-purple-50 flex items-center justify-center gap-1.5">
                  <Plus className="w-3.5 h-3.5"/>
                  <span>{t('customWiz.step1.addInfant')}</span>
                </button>
              </div>

              <div className="space-y-2">
                {persons.map((p, i) => {
                  const sameType = persons.slice(0, i).filter(x => x.type === p.type).length + 1;
                  const labelKey = p.type === 'adult' ? 'adultLabel' : p.type === 'child' ? 'childLabel' : 'infantLabel';
                  const label = t(`customWiz.step1.${labelKey}`).replace('{n}', String(sameType));
                  const colors = {
                    adult:  { border: isRTL ? 'border-r-4 border-r-blue-400'   : 'border-l-4 border-l-blue-400',   bg: 'bg-blue-50',   avatar: 'bg-blue-100 text-blue-700' },
                    child:  { border: isRTL ? 'border-r-4 border-r-amber-400'  : 'border-l-4 border-l-amber-400',  bg: 'bg-amber-50',  avatar: 'bg-amber-100 text-amber-700' },
                    infant: { border: isRTL ? 'border-r-4 border-r-purple-400' : 'border-l-4 border-l-purple-400', bg: 'bg-purple-50', avatar: 'bg-purple-100 text-purple-700' },
                  };
                  const c = colors[p.type];
                  return (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${c.border} ${c.bg}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${c.avatar}`}>
                        {p.type === 'adult' ? <User className="w-4 h-4"/> : p.type === 'child' ? <Users className="w-4 h-4"/> : <Baby className="w-4 h-4"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{label}</p>
                        {p.type !== 'adult' && (
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-gray-500">{t('customWiz.step1.age')}</span>
                              <input type="number"
                                min={p.type === 'child' ? 3 : 0}
                                max={p.type === 'child' ? 11 : 2}
                                value={p.age || ''}
                                onChange={e => updatePerson(i, { age: Number(e.target.value) })}
                                className="w-14 border p-1 rounded-lg text-xs text-center bg-white"
                                dir="ltr"/>
                              <span className="text-xs text-gray-400">{p.type === 'child' ? t('customWiz.step1.childRange') : t('customWiz.step1.infantRange')}</span>
                            </div>
                            <button
                              onClick={() => updatePerson(i, { extra_bed: !p.extra_bed })}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all
                                ${p.extra_bed
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                              <BedDouble className="w-3 h-3"/>
                              {t('customWiz.step1.extraBed')}
                            </button>
                          </div>
                        )}
                      </div>
                      <button onClick={() => removePerson(i)}
                        className="p-1.5 rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all shrink-0">
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-4 gap-2 mt-2">
                {[
                  { label: t('customWiz.step1.stats.adults'),   val: adults,   color: 'text-blue-600' },
                  { label: t('customWiz.step1.stats.children'), val: children, color: 'text-amber-600' },
                  { label: t('customWiz.step1.stats.infants'),  val: infants,  color: 'text-purple-600' },
                  { label: t('customWiz.step1.stats.total'),    val: totalPax, color: 'text-emerald-600' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-2.5 text-center border">
                    <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div className="space-y-3">
              <div className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium
                ${citiesNightsSum === totalNights ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                  citiesNightsSum > totalNights ? 'bg-red-50 border-red-200 text-red-700' :
                  'bg-amber-50 border-amber-200 text-amber-700'}`}>
                <span>{t('customWiz.step2.summary')}</span>
                <span className="font-bold">
                  {t('customWiz.step2.summaryLine')
                    .replace('{sum}', String(citiesNightsSum))
                    .replace('{total}', String(totalNights))}
                  {citiesNightsSum === totalNights ? ' ' + t('customWiz.step2.complete') :
                   citiesNightsSum > totalNights ? ' ' + t('customWiz.step2.exceeded') :
                   ' ' + t('customWiz.step2.remaining').replace('{n}', String(totalNights - citiesNightsSum))}
                </span>
              </div>

              {pkgCities.map((c, i) => (
                <div key={i} className="border-2 border-dashed border-blue-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i+1}</div>
                    <select value={c.city_id || ''} onChange={e => {
                        const city = filteredCities.find(fc => fc.id === Number(e.target.value));
                        setPkgCities(prev => prev.map((pc, idx) => idx === i ? {...pc, city_id: Number(e.target.value), city_name: city?.name || ''} : pc));
                      }}
                      className="flex-1 border p-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                      <option value="">{t('customWiz.step2.selectCity')}</option>
                      {filteredCities.map(fc => <option key={fc.id} value={fc.id}>{fc.name}</option>)}
                    </select>
                    <div className="flex items-center gap-1">
                      <Moon className="w-4 h-4 text-gray-400"/>
                      <input type="number" min={1} max={totalNights} value={c.nights}
                        onChange={e => setPkgCities(prev => prev.map((pc, idx) => idx === i ? {...pc, nights: Number(e.target.value)} : pc))}
                        className="w-16 border p-2 rounded-xl text-sm text-center" dir="ltr"/>
                    </div>
                    <button onClick={() => setPkgCities(prev => prev.filter((_, idx) => idx !== i))}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              ))}

              <button onClick={() => setPkgCities(prev => [...prev, { city_id: 0, city_name: '', nights: 1, order: prev.length + 1 }])}
                className="w-full py-3 border-2 border-dashed border-blue-300 rounded-2xl text-blue-600 text-sm font-medium hover:bg-blue-50 flex items-center justify-center gap-2">
                <Plus className="w-4 h-4"/> {t('customWiz.step2.addCity')}
              </button>
            </div>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap bg-gray-50 p-3 rounded-xl border">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-gray-400"/>
                  <span className="text-xs text-gray-500">{t('customWiz.step3.stars')}</span>
                  {[null,3,4,5].map(s => (
                    <button key={String(s)} onClick={() => setStarFilter(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors
                        ${starFilter === s ? 'bg-amber-100 border-amber-300 text-amber-800' : 'border-gray-200 bg-white hover:border-amber-200 text-gray-500'}`}>
                      {s === null ? t('customWiz.step3.all') : `${s}★`}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">{t('customWiz.step3.roomType')}</span>
                  <select value={roomTypeFilter} onChange={e => setRoomTypeFilter(e.target.value)}
                    className="border p-1.5 rounded-lg text-xs bg-white text-gray-700">
                    {ROOM_TYPES.map(rt => (
                      <option key={rt} value={rt}>{rt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {pkgCities.map((city, ci) => (
                <div key={ci} className="border rounded-2xl overflow-hidden">
                  <div className="bg-blue-50 px-4 py-2.5 flex items-center justify-between border-b">
                    <span className="font-medium text-blue-800 text-sm flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5"/> {t('customWiz.step3.cityHeader').replace('{city}', city.city_name).replace('{n}', String(city.nights))}
                    </span>
                    <button onClick={() => fetchHotelPrices(ci)}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      {loadingPrices ? <Loader2 className="w-3 h-3 animate-spin"/> : null}
                      {t('customWiz.step3.refreshPrices')}
                    </button>
                  </div>
                  <div className="p-3 space-y-2">
                    {filteredHotels(city.city_id).length === 0 && (
                      <p className="text-center text-gray-400 text-sm py-6">{t('customWiz.step3.noHotels')}</p>
                    )}
                    {filteredHotels(city.city_id).map(h => {
                      const priceData = hotelPrices[h.id];
                      const isSelected = pkgHotels.some(ph => ph.hotel_id === h.id && ph.package_city_idx === ci + 1);
                      const img = h.image ? (h.image.startsWith('http') ? h.image : `${BASE}${h.image}`) : null;
                      const totalPrice = priceData?.price_myr ? (parseFloat(priceData.price_myr) * city.nights).toFixed(0) : null;
                      const margin = pkgHotels.find(ph => ph.hotel_id === h.id && ph.package_city_idx === ci + 1)?.profit_margin_pct ?? 20;

                      return (
                        <div key={h.id} className={`border rounded-xl overflow-hidden transition-all
                          ${isSelected ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <div className="flex">
                            <div className="w-24 bg-blue-50 flex items-center justify-center shrink-0">
                              {img
                                ? <img src={img} className="w-full h-full object-cover" alt={h.name}/>
                                : <Building2 className="w-8 h-8 text-gray-300"/>
                              }
                            </div>
                            <div className="flex-1 p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{h.name}</p>
                                  <div className="flex mt-0.5">
                                    {[1,2,3,4,5].map(s => (
                                      <Star key={s} className={`w-3 h-3 ${s <= h.stars ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}/>
                                    ))}
                                  </div>
                                </div>
                                {priceData?.source === 'contract' && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 shrink-0">{t('customWiz.step3.partnership')}</span>
                                )}
                              </div>

                              <div className="mt-2 flex items-end justify-between gap-2">
                                <div>
                                  <p className="text-xs text-gray-400">{roomTypeFilter}</p>
                                  {priceData?.price_myr ? (
                                    <div>
                                      <p className="text-xs text-gray-500">RM {parseFloat(priceData.price_myr).toFixed(0)}{t('customWiz.step3.perNight')}</p>
                                      <p className="font-bold text-emerald-600 text-sm">RM {totalPrice} ({city.nights})</p>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-400">{t('customWiz.step3.noPriceAvailable')}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {isSelected && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-gray-500">{t('customWiz.step3.profitMargin')}</span>
                                      <input type="number" min={0} max={100}
                                        value={margin}
                                        onChange={e => setPkgHotels(prev => prev.map(ph =>
                                          ph.hotel_id === h.id && ph.package_city_idx === ci + 1
                                            ? {...ph, profit_margin_pct: Number(e.target.value)}
                                            : ph
                                        ))}
                                        className="w-14 border p-1 rounded-lg text-xs text-center bg-white"
                                        dir="ltr"/>
                                    </div>
                                  )}
                                  <button onClick={() => {
                                    if (isSelected) {
                                      setPkgHotels(prev => prev.filter(ph => !(ph.hotel_id === h.id && ph.package_city_idx === ci + 1)));
                                    } else {
                                      const today = new Date().toISOString().split('T')[0];
                                      const checkout = new Date(Date.now() + city.nights * 86400000).toISOString().split('T')[0];
                                      setPkgHotels(prev => [...prev, {
                                        temp_id: `${ci}-${h.id}`,
                                        package_city_idx: ci + 1,
                                        hotel_id: h.id, hotel_name: h.name,
                                        hotel_stars: h.stars, hotel_image: h.image,
                                        room_type: roomTypeFilter,
                                        check_in_date: today, check_out_date: checkout,
                                        nights: city.nights,
                                        price_per_room_night_myr: parseFloat(priceData?.price_myr || '0'),
                                        source: priceData?.source || 'manual',
                                        includes_breakfast: priceData?.includes_breakfast || false,
                                        profit_margin_pct: 20,
                                      }]);
                                    }
                                  }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                                      ${isSelected
                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                        : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700'}`}>
                                    {isSelected ? t('customWiz.step3.selected') : t('customWiz.step3.select')}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Step 4 ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400"/>
                <span className="text-sm text-gray-600">{t('customWiz.step4.maxPriceFilter')}</span>
                <input type="number" value={flightFilter || ''} onChange={e => setFlightFilter(e.target.value ? Number(e.target.value) : null)}
                  placeholder={t('customWiz.step4.noLimit')}
                  className="border p-1.5 rounded-lg text-sm w-28" dir="ltr"/>
              </div>

              {pkgFlights.map((f, i) => (
                <div key={i} className="border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <Plane className="w-4 h-4 text-blue-500"/>
                      {f.from_city_name} → {f.to_city_name}
                    </span>
                    <button onClick={() => setPkgFlights(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400"><Trash2 className="w-4 h-4"/></button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><label className="text-gray-500">{t('customWiz.step4.adult')}</label>
                      <input type="number" value={f.price_adult_myr}
                        onChange={e => setPkgFlights(prev => prev.map((pf, idx) => idx === i ? {...pf, price_adult_myr: Number(e.target.value)} : pf))}
                        className="w-full border p-2 rounded-lg mt-1" dir="ltr"/></div>
                    <div><label className="text-gray-500">{t('customWiz.step4.child')}</label>
                      <input type="number" value={f.price_child_myr}
                        onChange={e => setPkgFlights(prev => prev.map((pf, idx) => idx === i ? {...pf, price_child_myr: Number(e.target.value)} : pf))}
                        className="w-full border p-2 rounded-lg mt-1" dir="ltr"/></div>
                    <div><label className="text-gray-500">{t('customWiz.step4.infant')}</label>
                      <input type="number" value={f.price_infant_myr}
                        onChange={e => setPkgFlights(prev => prev.map((pf, idx) => idx === i ? {...pf, price_infant_myr: Number(e.target.value)} : pf))}
                        className="w-full border p-2 rounded-lg mt-1" dir="ltr"/></div>
                  </div>
                  <div className="text-xs text-emerald-600 font-medium">
                    {t('customWiz.step4.flightTotal').replace('{n}', String((f.price_adult_myr * adults + f.price_child_myr * children + f.price_infant_myr * infants).toFixed(0)))}
                  </div>
                </div>
              ))}

              {pkgCities.length > 1 && pkgCities.slice(0, -1).map((c, i) => {
                const next = pkgCities[i + 1];
                const exists = pkgFlights.some(f => f.from_city_id === c.city_id && f.to_city_id === next.city_id);
                if (exists) return null;
                return (
                  <button key={i} onClick={() => setPkgFlights(prev => [...prev, {
                      from_city_id: c.city_id, from_city_name: c.city_name,
                      to_city_id: next.city_id, to_city_name: next.city_name,
                      price_adult_myr: 350, price_child_myr: 350, price_infant_myr: 250,
                    }])}
                    className="w-full py-2.5 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 text-sm hover:bg-blue-50 flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4"/> {c.city_name} → {next.city_name}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Step 5 ── */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Car className="w-4 h-4 text-emerald-600"/> {t('customWiz.step5.transfersTitle')}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-gray-400"/>
                  <span className="text-xs text-gray-600">{t('customWiz.step5.priceLimitMYR')}</span>
                  <input type="number" value={transferFilter || ''} onChange={e => setTransferFilter(e.target.value ? Number(e.target.value) : null)}
                    placeholder={t('customWiz.step4.noLimit')} className="border p-1.5 rounded-lg text-xs w-24" dir="ltr"/>
                </div>
                <div className="space-y-2">
                  {pkgTransfers.map((tt, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 border rounded-xl p-3">
                      <select value={tt.city_id} onChange={e => setPkgTransfers(prev => prev.map((pt, idx) => idx === i ? {...pt, city_id: Number(e.target.value), city_name: pkgCities.find(c => c.city_id === Number(e.target.value))?.city_name || ''} : pt))}
                        className="flex-1 border p-1.5 rounded-lg text-xs bg-white">
                        {pkgCities.map(c => <option key={c.city_id} value={c.city_id}>{c.city_name}</option>)}
                      </select>
                      <select value={tt.transfer_type} onChange={e => setPkgTransfers(prev => prev.map((pt, idx) => idx === i ? {...pt, transfer_type: e.target.value} : pt))}
                        className="border p-1.5 rounded-lg text-xs bg-white">
                        {['airport_pickup','intercity','local'].map(k => <option key={k} value={k}>{transferTypeLabel(k)}</option>)}
                      </select>
                      <input type="number" value={tt.price_myr} onChange={e => setPkgTransfers(prev => prev.map((pt, idx) => idx === i ? {...pt, price_myr: Number(e.target.value)} : pt))}
                        className="w-20 border p-1.5 rounded-lg text-xs" dir="ltr"/>
                      <span className="text-xs text-gray-400">MYR</span>
                      <button onClick={() => setPkgTransfers(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  ))}
                  <button onClick={() => {
                      const city = pkgCities[0];
                      if (!city) return;
                      setPkgTransfers(prev => [...prev, { city_id: city.city_id, city_name: city.city_name, transfer_type: 'airport_pickup', price_myr: 100 }]);
                    }}
                    className="w-full py-2.5 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-600 text-sm hover:bg-emerald-50 flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4"/> {t('customWiz.step5.addTransfer')}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Camera className="w-4 h-4 text-purple-600"/> {t('customWiz.step5.toursTitle')}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-gray-400"/>
                  <span className="text-xs text-gray-600">{t('customWiz.step5.priceLimitMYR')}</span>
                  <input type="number" value={tourFilter || ''} onChange={e => setTourFilter(e.target.value ? Number(e.target.value) : null)}
                    placeholder={t('customWiz.step4.noLimit')} className="border p-1.5 rounded-lg text-xs w-24" dir="ltr"/>
                </div>
                <div className="space-y-2">
                  {pkgTours.map((tt, i) => (
                    <div key={i} className="bg-gray-50 border rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <select value={tt.city_id} onChange={e => setPkgTours(prev => prev.map((pt, idx) => idx === i ? {...pt, city_id: Number(e.target.value), city_name: pkgCities.find(c => c.city_id === Number(e.target.value))?.city_name || ''} : pt))}
                          className="flex-1 border p-1.5 rounded-lg text-xs bg-white">
                          {pkgCities.map(c => <option key={c.city_id} value={c.city_id}>{c.city_name}</option>)}
                        </select>
                        <input value={tt.tour_name} onChange={e => setPkgTours(prev => prev.map((pt, idx) => idx === i ? {...pt, tour_name: e.target.value} : pt))}
                          placeholder={t('customWiz.step5.tourNamePlaceholder')} className="flex-1 border p-1.5 rounded-lg text-xs"/>
                        <button onClick={() => setPkgTours(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div><label className="text-gray-500">{t('customWiz.step5.adult')}</label>
                          <input type="number" value={tt.price_adult_myr} onChange={e => setPkgTours(prev => prev.map((pt, idx) => idx === i ? {...pt, price_adult_myr: Number(e.target.value)} : pt))}
                            className="w-full border p-1.5 rounded-lg mt-1" dir="ltr"/></div>
                        <div><label className="text-gray-500">{t('customWiz.step5.child')}</label>
                          <input type="number" value={tt.price_child_myr} onChange={e => setPkgTours(prev => prev.map((pt, idx) => idx === i ? {...pt, price_child_myr: Number(e.target.value)} : pt))}
                            className="w-full border p-1.5 rounded-lg mt-1" dir="ltr"/></div>
                        <div><label className="text-gray-500">{t('customWiz.step5.infant')}</label>
                          <input type="number" value={tt.price_infant_myr} onChange={e => setPkgTours(prev => prev.map((pt, idx) => idx === i ? {...pt, price_infant_myr: Number(e.target.value)} : pt))}
                            className="w-full border p-1.5 rounded-lg mt-1" dir="ltr"/></div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => {
                      const city = pkgCities[0];
                      if (!city) return;
                      setPkgTours(prev => [...prev, { city_id: city.city_id, city_name: city.city_name, tour_name: '', price_adult_myr: 300, price_child_myr: 0, price_infant_myr: 0 }]);
                    }}
                    className="w-full py-2.5 border-2 border-dashed border-purple-300 rounded-xl text-purple-600 text-sm hover:bg-purple-50 flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4"/> {t('customWiz.step5.addTour')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 6 ── */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
                <h3 className="font-bold text-blue-800 flex items-center gap-2"><User className="w-4 h-4"/> {t('customWiz.step6.clientHeader')}</h3>
                <p className="text-sm"><span className="text-gray-500">{t('customWiz.step6.name')}</span> <span className="font-semibold mx-1">{clientName}</span></p>
                <p className="text-sm"><span className="text-gray-500">{t('customWiz.step6.phone')}</span> <span className="font-semibold mx-1" dir="ltr">{clientPhone}</span></p>
              </div>

              <div className="bg-gray-50 border rounded-2xl p-4 space-y-2">
                <h3 className="font-bold text-gray-800">{t('customWiz.step6.tripSummary')}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">{t('customWiz.step6.country')}</span> <span className="font-semibold mx-1">{countries.find(c => c.id === countryId)?.name}</span></div>
                  <div><span className="text-gray-500">{t('customWiz.step6.nights')}</span> <span className="font-semibold mx-1">{totalNights}</span></div>
                  <div><span className="text-gray-500">{t('customWiz.step6.persons')}</span> <span className="font-semibold mx-1">
                    {t('customWiz.step6.personsBreakdown')
                      .replace('{total}', String(totalPax))
                      .replace('{adults}', String(adults))
                      .replace('{children}', String(children))
                      .replace('{infants}', String(infants))}
                  </span></div>
                  <div><span className="text-gray-500">{t('customWiz.step6.cities')}</span> <span className="font-semibold mx-1">{pkgCities.map(c => c.city_name).join(' · ')}</span></div>
                  <div><span className="text-gray-500">{t('customWiz.step6.hotels')}</span> <span className="font-semibold mx-1">{pkgHotels.length}</span></div>
                  <div><span className="text-gray-500">{t('customWiz.step6.tours')}</span> <span className="font-semibold mx-1">{pkgTours.length}</span></div>
                </div>
              </div>

              {calculating && (
                <div className="flex items-center justify-center gap-2 py-4 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin"/> {t('customWiz.step6.calculatingPrice')}
                </div>
              )}

              {pricing && !calculating && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
                  <h3 className="font-bold text-emerald-800 flex items-center gap-2"><Calculator className="w-4 h-4"/> {t('customWiz.step6.finalPrice')}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">{t('customWiz.step6.totalCost')}</p>
                      <p className="font-bold text-gray-800">{pricing.total_cost_myr} MYR</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">{t('customWiz.step6.sellingB2C')}</p>
                      <p className="text-2xl font-bold text-emerald-600">{pricing.selling_price_b2c_eur} €</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">{t('customWiz.step6.perPersonB2C')}</p>
                      <p className="font-bold text-blue-600">{pricing.price_per_pax_b2c_eur} €</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">{t('customWiz.step6.forB2B')}</p>
                      <p className="font-bold text-amber-600">{pricing.selling_price_b2b_eur} €</p>
                    </div>
                  </div>
                  {pricing.breakdown && (
                    <p className="text-xs text-gray-400 text-center">
                      {t('customWiz.step6.breakdown')
                        .replace('{hotels}', String(pricing.breakdown.hotels_myr))
                        .replace('{flights}', String(pricing.breakdown.flights_myr))
                        .replace('{transfers}', String(pricing.breakdown.transfers_myr))
                        .replace('{tours}', String(pricing.breakdown.tours_myr))}
                    </p>
                  )}
                </div>
              )}

              {pricing && (
                <div className="flex gap-3">
                  <button onClick={() => onSuccess()}
                    className="flex-1 py-3 border-2 rounded-xl text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2">
                    <Moon className="w-4 h-4"/> {t('customWiz.step6.saveDraft')}
                  </button>
                  <button onClick={handlePublish} disabled={saving}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-60">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>}
                    {t('customWiz.step6.confirmPackage')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {step < 6 && (
          <div className="flex gap-3 p-5 border-t">
            <button onClick={() => { setError(''); setStep(s => Math.max(0, s - 1)); }} disabled={step === 0}
              className="flex items-center gap-2 px-5 py-3 border-2 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-40">
              {isRTL ? <ChevronRight className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>}
              {t('customWiz.prev')}
            </button>
            <button onClick={handleNext} disabled={saving || calculating}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-60">
              {saving || calculating
                ? <><Loader2 className="w-4 h-4 animate-spin"/> {calculating ? t('customWiz.calculating') : t('customWiz.saving')}</>
                : <>{step === 5 ? t('customWiz.finalize') : t('customWiz.next')} {isRTL ? <ChevronLeft className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
