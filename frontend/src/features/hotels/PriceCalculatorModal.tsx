import { useEffect, useMemo, useState } from 'react';
import {
  Calculator, Calendar, Users, Baby, BedDouble, X,
  Loader2, Receipt, TrendingUp, AlertCircle, Building2, Star,
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { apiFetch } from '../../services/apiFetch';
import {
  hotelRatesApi,
  type QuoteResult,
  type RoomCategory,
  type PricingTierDef,
  type Occupancy,
} from '../../services/hotelRatesApi';

const T = {
  ar: {
    title: 'الآلة الحاسبة لتسعير الإقامة',
    subtitle: 'احسب التكلفة الكاملة للإقامة (يشمل المواسم، الرسوم، الضرائب)',
    selectHotel: 'اختر فندقاً',
    selectRoom: 'اختر نوع الغرفة',
    checkIn: 'تاريخ الدخول',
    checkOut: 'تاريخ الخروج',
    pricingTier: 'طبقة التسعير',
    occupancy: 'الإشغال',
    adults: 'البالغون',
    childrenWithBed: 'أطفال بسرير',
    childrenWithoutBed: 'أطفال بدون سرير',
    infants: 'الرضع',
    extraBeds: 'أسرّة إضافية',
    calculate: 'احسب',
    calculating: 'جاري الحساب…',
    nights: 'ليالي',
    night: 'ليلة',
    breakdown: 'تفاصيل الليالي',
    summary: 'ملخص التكلفة',
    rooms: 'إجمالي الغرف',
    numRooms: 'عدد الغرف',
    extraBedsTotal: 'إجمالي الأسرّة الإضافية',
    infantsTotal: 'إجمالي الرضع',
    childrenWithBedTotal: 'إجمالي طفل بسرير',
    childrenWithoutBedTotal: 'إجمالي طفل بدون سرير',
    childBreakfastTotal: 'إجمالي فطور الأطفال',
    surchargesTotal: 'إجمالي الرسوم الإضافية',
    subtotal: 'المجموع الفرعي',
    markup: 'هامش الربح',
    tax: 'الضريبة',
    taxFormula: 'الضريبة = الضريبة لكل غرفة × عدد الغرف × عدد الليالي',
    grandTotal: 'الإجمالي النهائي',
    pleaseSelect: 'الرجاء اختيار فندق وغرفة وتاريخ',
    error: 'حدث خطأ',
    close: 'إغلاق',
    weekday: 'يوم',
    weekend: 'عطلة',
    flat: 'ثابت',
    options: 'خيارات الحساب',
    applyMarkup: 'تطبيق هامش الربح',
    applyTax: 'تطبيق الضريبة',
    seasonNone: 'بدون موسم',
    noTiers: 'لا توجد طبقات تسعير لهذا الفندق',
  },
  en: {
    title: 'Stay Pricing Calculator',
    subtitle: 'Calculate full stay cost (includes seasons, surcharges, taxes)',
    selectHotel: 'Select hotel',
    selectRoom: 'Select room type',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    pricingTier: 'Pricing Tier',
    occupancy: 'Occupancy',
    adults: 'Adults',
    childrenWithBed: 'Children with bed',
    childrenWithoutBed: 'Children without bed',
    infants: 'Infants',
    extraBeds: 'Extra beds',
    calculate: 'Calculate',
    calculating: 'Calculating…',
    nights: 'nights',
    night: 'night',
    breakdown: 'Nights Breakdown',
    summary: 'Cost Summary',
    rooms: 'Rooms total',
    numRooms: 'Number of rooms',
    extraBedsTotal: 'Extra beds total',
    infantsTotal: 'Infants total',
    childrenWithBedTotal: 'Children with bed',
    childrenWithoutBedTotal: 'Children no bed',
    childBreakfastTotal: 'Children breakfast',
    surchargesTotal: 'Surcharges total',
    subtotal: 'Subtotal',
    markup: 'Markup',
    tax: 'Tax',
    taxFormula: 'Tax = per-room × rooms × nights',
    grandTotal: 'Grand Total',
    pleaseSelect: 'Please select hotel, room, and dates',
    error: 'Error',
    close: 'Close',
    weekday: 'Weekday',
    weekend: 'Weekend',
    flat: 'Flat',
    options: 'Calc options',
    applyMarkup: 'Apply markup',
    applyTax: 'Apply tax',
    seasonNone: 'No season',
    noTiers: 'No pricing tiers configured for this hotel',
  },
  ms: {
    title: 'Kalkulator Harga Penginapan',
    subtitle: 'Kira kos penuh penginapan (termasuk musim, caj, cukai)',
    selectHotel: 'Pilih hotel',
    selectRoom: 'Pilih jenis bilik',
    checkIn: 'Tarikh masuk',
    checkOut: 'Tarikh keluar',
    pricingTier: 'Lapisan harga',
    occupancy: 'Penghuni',
    adults: 'Dewasa',
    childrenWithBed: 'Kanak dengan katil',
    childrenWithoutBed: 'Kanak tanpa katil',
    infants: 'Bayi',
    extraBeds: 'Katil tambahan',
    calculate: 'Kira',
    calculating: 'Mengira…',
    nights: 'malam',
    night: 'malam',
    breakdown: 'Pecahan Malam',
    summary: 'Ringkasan Kos',
    rooms: 'Jumlah bilik',
    numRooms: 'Bilangan bilik',
    extraBedsTotal: 'Jumlah katil tambahan',
    infantsTotal: 'Jumlah bayi',
    childrenWithBedTotal: 'Kanak dengan katil',
    childrenWithoutBedTotal: 'Kanak tanpa katil',
    childBreakfastTotal: 'Sarapan kanak',
    surchargesTotal: 'Jumlah caj',
    subtotal: 'Subjumlah',
    markup: 'Margin',
    tax: 'Cukai',
    taxFormula: 'Cukai = setiap bilik × bilik × malam',
    grandTotal: 'Jumlah Akhir',
    pleaseSelect: 'Sila pilih hotel, bilik, dan tarikh',
    error: 'Ralat',
    close: 'Tutup',
    weekday: 'Hari Biasa',
    weekend: 'Hujung Minggu',
    flat: 'Tetap',
    options: 'Pilihan',
    applyMarkup: 'Guna margin',
    applyTax: 'Guna cukai',
    seasonNone: 'Tiada musim',
    noTiers: 'Tiada lapisan harga',
  },
} as const;

type Lang = keyof typeof T;
function useT() {
  const { lang } = useLanguage();
  const ll = (lang as Lang) in T ? (lang as Lang) : 'ar';
  return (k: keyof typeof T['ar']) => T[ll][k];
}

interface Hotel {
  id: number;
  name: string;
  stars: number;
}

interface Props {
  initialHotelId?: number;
  initialCategoryId?: number;
  onClose: () => void;
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none';

const todayPlus = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export function PriceCalculatorModal({ initialHotelId, initialCategoryId, onClose }: Props) {
  const t = useT();
  const { isRTL } = useLanguage();

  // Inputs
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [tierDefs, setTierDefs] = useState<PricingTierDef[]>([]);
  const [hotelId, setHotelId] = useState<number | null>(initialHotelId ?? null);
  const [categoryId, setCategoryId] = useState<number | null>(initialCategoryId ?? null);
  const [checkIn, setCheckIn] = useState(todayPlus(7));
  const [checkOut, setCheckOut] = useState(todayPlus(10));
  const [pricingTier, setPricingTier] = useState<string>('FIT');
  const [occupancy, setOccupancy] = useState<Occupancy>('double');
  const [numberOfRooms, setNumberOfRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [childrenWithBed, setChildrenWithBed] = useState(0);
  const [childrenWithoutBed, setChildrenWithoutBed] = useState(0);
  const [infants, setInfants] = useState(0);
  const [extraBeds, setExtraBeds] = useState(0);
  const [applyMarkup, setApplyMarkup] = useState(true);
  const [applyTax, setApplyTax] = useState(true);

  // Result
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load hotels
  useEffect(() => {
    apiFetch('/api/v1/hotels/').then(r => r.ok ? r.json() : null).then(d => {
      if (!d) return;
      const list = Array.isArray(d) ? d : (d.results || []);
      setHotels(list);
      if (!hotelId && list.length) setHotelId(list[0].id);
    });
  }, []);

  // Load categories + tier defs when hotel changes
  useEffect(() => {
    if (!hotelId) { setCategories([]); setTierDefs([]); return; }
    Promise.all([
      hotelRatesApi.listCategories({ hotel: hotelId }),
      hotelRatesApi.listPricingTiers({ hotel: hotelId }).catch(() => []),
    ]).then(([cats, tiers]) => {
      setCategories(cats);
      setTierDefs(tiers);
      if (!cats.find(cat => cat.id === categoryId)) setCategoryId(cats[0]?.id ?? null);
      if (tiers.length && !tiers.find(t => t.name === pricingTier)) {
        setPricingTier(tiers[0].name);
      }
    }).catch(() => {});
  }, [hotelId]);

  // Calculate
  const calculate = async () => {
    if (!categoryId) { setError(t('pleaseSelect')); return; }
    setError(null);
    setCalculating(true);
    try {
      const r = await hotelRatesApi.quote({
        room_category: categoryId,
        check_in: checkIn,
        check_out: checkOut,
        pricing_tier: pricingTier,
        occupancy,
        number_of_rooms: numberOfRooms,
        adults,
        children_with_bed: childrenWithBed,
        children_without_bed: childrenWithoutBed,
        infants,
        extra_beds: extraBeds,
        apply_markup: applyMarkup,
        apply_tax: applyTax,
      });
      setResult(r);
    } catch (e) {
      setError(String(e));
      setResult(null);
    } finally {
      setCalculating(false);
    }
  };

  // Auto-recalculate when key inputs change (debounced)
  useEffect(() => {
    if (!categoryId || !checkIn || !checkOut) return;
    const handle = setTimeout(() => calculate(), 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, checkIn, checkOut, pricingTier, occupancy, numberOfRooms, adults, childrenWithBed, childrenWithoutBed, infants, extraBeds, applyMarkup, applyTax]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{t('title')}</h2>
              <p className="text-xs text-gray-500">{t('subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body — 2 columns: inputs (40%) + result (60%) */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

          {/* Left: Inputs */}
          <div className="lg:w-2/5 lg:border-l border-gray-200 overflow-y-auto p-5 space-y-4 bg-gray-50">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> {t('selectHotel')}
              </label>
              <select className={inputCls} value={hotelId ?? ''} onChange={e => setHotelId(Number(e.target.value) || null)}>
                <option value="">—</option>
                {hotels.map(h => (
                  <option key={h.id} value={h.id}>{h.name} ({h.stars}★)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block flex items-center gap-1.5">
                <BedDouble className="w-3.5 h-3.5" /> {t('selectRoom')}
              </label>
              <select className={inputCls} value={categoryId ?? ''} onChange={e => setCategoryId(Number(e.target.value) || null)}>
                <option value="">—</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.view_type !== 'standard' ? `(${c.view_type_display})` : ''} — {c.pax}p
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {t('checkIn')}
                </label>
                <input type="date" className={inputCls} value={checkIn} onChange={e => setCheckIn(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {t('checkOut')}
                </label>
                <input type="date" className={inputCls} value={checkOut} onChange={e => setCheckOut(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">{t('pricingTier')}</label>
                {tierDefs.length === 0 ? (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">{t('noTiers')}</p>
                ) : (
                  <select className={inputCls} value={pricingTier} onChange={e => setPricingTier(e.target.value)}>
                    {tierDefs.map(td => (
                      <option key={td.id} value={td.name}>
                        {td.name}{td.min_rooms_required > 0 ? ` (≥ ${td.min_rooms_required})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">{t('occupancy')}</label>
                <select className={inputCls} value={occupancy} onChange={e => setOccupancy(e.target.value as Occupancy)}>
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="triple">Triple</option>
                  <option value="quad">Quad</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3 space-y-2.5">
              <NumField label={t('numRooms')} value={numberOfRooms} onChange={setNumberOfRooms} min={1} icon={<BedDouble className="w-3 h-3"/>} />
            </div>

            <div className="border-t border-gray-200 pt-3 space-y-2.5">
              <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Guests
              </p>
              <NumField label={t('adults')} value={adults} onChange={setAdults} min={1} />
              <NumField label={t('childrenWithBed')} value={childrenWithBed} onChange={setChildrenWithBed} />
              <NumField label={t('childrenWithoutBed')} value={childrenWithoutBed} onChange={setChildrenWithoutBed} />
              <NumField label={t('infants')} value={infants} onChange={setInfants} icon={<Baby className="w-3 h-3"/>} />
              <NumField label={t('extraBeds')} value={extraBeds} onChange={setExtraBeds} icon={<BedDouble className="w-3 h-3"/>} />
            </div>

            <div className="border-t border-gray-200 pt-3 space-y-2">
              <p className="text-xs font-bold text-gray-700 mb-1">{t('options')}</p>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={applyMarkup} onChange={e => setApplyMarkup(e.target.checked)} />
                {t('applyMarkup')}
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={applyTax} onChange={e => setApplyTax(e.target.checked)} />
                {t('applyTax')}
              </label>
            </div>
          </div>

          {/* Right: Result */}
          <div className="lg:w-3/5 flex-1 overflow-y-auto p-5 bg-white">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-start gap-2 mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5"/>
                <span>{error}</span>
              </div>
            )}

            {calculating && !result && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            )}

            {!result && !calculating && !error && (
              <EmptyResultState t={t} />
            )}

            {result && (
              <ResultPanel result={result} t={t} calculating={calculating} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          {result ? (
            <div className="text-sm text-gray-700">
              <span className="font-medium">{result.hotel.name}</span>
              <span className="text-gray-400 mx-2">·</span>
              <span>{result.nights} {result.nights === 1 ? t('night') : t('nights')}</span>
              <span className="text-gray-400 mx-2">·</span>
              <span className="font-bold text-blue-600">{result.totals.grand_total} {result.currency}</span>
            </div>
          ) : <div/>}
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg">
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub components ────────────────────────────────────────

function NumField({ label, value, onChange, min = 0, icon }: { label: string; value: number; onChange: (n: number) => void; min?: number; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-600 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
          className="w-7 h-7 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100">−</button>
        <input type="number" min={min} value={value}
          onChange={e => onChange(Math.max(min, Number(e.target.value) || 0))}
          className="w-12 text-center bg-white border border-gray-200 rounded-lg py-1 text-sm" />
        <button type="button" onClick={() => onChange(value + 1)}
          className="w-7 h-7 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100">+</button>
      </div>
    </div>
  );
}

function EmptyResultState({ t }: { t: ReturnType<typeof useT> }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
        <Receipt className="w-10 h-10 text-blue-300" />
      </div>
      <p className="text-sm text-gray-500 max-w-xs">{t('pleaseSelect')}</p>
    </div>
  );
}

function ResultPanel({ result, t, calculating }: { result: QuoteResult; t: ReturnType<typeof useT>; calculating: boolean }) {
  const c = result.currency;
  const totalNum = parseFloat(result.totals.grand_total);
  const perNight = result.nights > 0 ? (totalNum / result.nights).toFixed(2) : '0';

  return (
    <div className={`space-y-5 ${calculating ? 'opacity-60' : ''}`}>
      {/* Header summary */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white rounded-2xl p-5 shadow-lg">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs opacity-80">{result.hotel.name}</p>
            <p className="text-sm font-medium opacity-90 flex items-center gap-1">
              {Array.from({ length: result.hotel.stars }).map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-300 text-amber-300" />)}
              <span className="mx-1.5 opacity-60">·</span>
              {result.room_category.name}
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2 py-1 rounded">
            {result.pricing_tier}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{result.totals.grand_total}</span>
          <span className="text-sm opacity-80">{c}</span>
        </div>
        <div className="flex items-center gap-3 text-xs opacity-80 mt-2">
          <span>{result.nights} {result.nights === 1 ? t('night') : t('nights')}</span>
          <span>·</span>
          <span>≈ {perNight} {c} / {t('night')}</span>
          {!result.tax_inclusive && <span className="bg-amber-300/30 px-2 py-0.5 rounded">+TAX</span>}
        </div>
      </div>

      {/* Nights breakdown */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-blue-600" /> {t('breakdown')}
        </h3>
        <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
          {result.lines.map((ln, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-gray-900">{ln.date}</span>
                  <span className="text-[10px] text-gray-500">({ln.weekday_label})</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    ln.day_type === 'weekend' ? 'bg-purple-100 text-purple-700' : ln.day_type === 'weekday' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {ln.day_type === 'weekend' ? t('weekend') : ln.day_type === 'weekday' ? t('weekday') : t('flat')}
                  </span>
                  {ln.season && <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">{ln.season}</span>}
                </div>
                {ln.surcharges_detail.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {ln.surcharges_detail.map((s, j) => (
                      <span key={j} className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                        +{s.amount} {s.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right ms-2">
                <div className="text-sm font-bold text-gray-900">{ln.night_total}</div>
                <div className="text-[10px] text-gray-400">{ln.rooms_count}× {ln.base_rate_per_room}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost summary */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
          <Receipt className="w-4 h-4 text-blue-600" /> {t('summary')}
        </h3>
        <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200">
          <Row label={`${t('rooms')} (${result.guests.rooms} × ${result.nights}n)`} value={`${result.totals.rooms_total} ${c}`} />
          {parseFloat(result.totals.extra_beds_total) > 0 && (
            <Row label={t('extraBedsTotal')} value={`${result.totals.extra_beds_total} ${c}`} />
          )}
          {parseFloat(result.totals.infants_total) > 0 && (
            <Row label={t('infantsTotal')} value={`${result.totals.infants_total} ${c}`} />
          )}
          {parseFloat(result.totals.children_with_bed_total) > 0 && (
            <Row label={t('childrenWithBedTotal')} value={`${result.totals.children_with_bed_total} ${c}`} />
          )}
          {parseFloat(result.totals.children_without_bed_total) > 0 && (
            <Row label={t('childrenWithoutBedTotal')} value={`${result.totals.children_without_bed_total} ${c}`} />
          )}
          {parseFloat(result.totals.child_breakfast_total) > 0 && (
            <Row label={t('childBreakfastTotal')} value={`${result.totals.child_breakfast_total} ${c}`} />
          )}
          {parseFloat(result.totals.surcharges_total) > 0 && (
            <Row label={t('surchargesTotal')} value={`${result.totals.surcharges_total} ${c}`} highlight="amber" />
          )}
          <Row label={t('subtotal')} value={`${result.totals.subtotal} ${c}`} bold />
          {parseFloat(result.totals.markup_amount) > 0 && (
            <Row label={`${t('markup')} (${result.totals.margin_pct}%)`} value={`+ ${result.totals.markup_amount} ${c}`} highlight="emerald" />
          )}
          {parseFloat(result.totals.tax_total) > 0 && (
            <Row
              label={`${t('tax')} (${result.totals.tax_per_unit}${c} × ${result.guests.rooms}r × ${result.nights}n)`}
              value={`+ ${result.totals.tax_total} ${c}`} highlight="red" />
          )}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-between">
            <span className="font-bold text-gray-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              {t('grandTotal')}
            </span>
            <span className="text-xl font-bold text-blue-600">{result.totals.grand_total} {c}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: 'amber' | 'emerald' | 'red' }) {
  const valColor = highlight === 'amber' ? 'text-amber-700' : highlight === 'emerald' ? 'text-emerald-700' : highlight === 'red' ? 'text-red-700' : '';
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <span className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-gray-900' : valColor || 'text-gray-700'}`}>{value}</span>
    </div>
  );
}
