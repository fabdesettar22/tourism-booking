/**
 * AgencyBookingWizard — Wizard متطور للحجز يستخدم القالب الجديد + الحاسبة الآلية.
 *
 * يستدعي:
 *  1. GET /api/v1/packages/agency/{id}/configurator/  → يجلب المدن + الفنادق المسموحة + الجولات + النقل
 *  2. POST /api/v1/bookings/calculate/                → preview للسعر بـ EUR + USD
 *  3. POST /api/v1/bookings/                          → حفظ الحجز
 *
 * 4 خطوات:
 *   1) People       — عدد البالغين/الأطفال/الرضع
 *   2) Stay         — اختيار فندق لكل مدينة + عدد الليالي + عدد الغرف
 *   3) Extras       — جولات + نقل (اختياري)
 *   4) Client+Review — بيانات العميل + السعر النهائي + تأكيد الحجز
 */
import { apiFetch } from '../../services/apiFetch';
import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import {
  X, ChevronLeft, ChevronRight, Loader2, CheckCircle2,
  Moon, Building2, MapPin, AlertTriangle, Plus, Minus,
  Check, Users, User, Baby, Star, Sparkles, Briefcase, Car, Calculator,
} from 'lucide-react';

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────
interface ConfiguratorHotel {
  id: number; name: string; stars?: number; image?: string|null;
  room_types: { id: number; name: string; max_occupancy?: number }[];
}
interface ConfiguratorCity {
  package_city_id: number; city_id: number; city_name: string;
  order: number; default_nights: number;
  hotels: ConfiguratorHotel[];
}
interface ConfiguratorTour {
  id: number; name: string; tour_type?: string; duration?: string;
  city_id?: number; city_name?: string; destination?: string;
}
interface ConfiguratorTransfer {
  id: number; name: string; airport_code?: string; airport_name?: string;
  hotel_id?: number; hotel_name?: string; city_id?: number;
}
interface ConfiguratorResponse {
  package_id: number; title: string; description?: string;
  total_nights: number; total_days?: number;
  gift?: { id: number; name: string; subcategory?: string }|null;
  cities: ConfiguratorCity[];
  components: {
    tours: ConfiguratorTour[];
    transfers: ConfiguratorTransfer[];
    flight_routes: any[];
  };
}

// ما يختاره المستخدم لكل مدينة
interface CityChoice {
  package_city_id: number;
  city_id: number;
  city_name: string;
  hotel_id: number|null;
  room_type_id: number|null;
  nights: number;
  rooms_count: number;
  children_with_bed: number;
}

interface CalculateLine {
  component_type: string;
  cost_myr: string|number;
  commission_myr: string|number;
  total_myr: string|number;
  totals: { myr: string|number|null; eur: string|number|null; usd: string|number|null };
}

interface CalculateResponse {
  lines: CalculateLine[];
  totals_breakdown: { cost_myr: string|number; commission_myr: string|number; total_myr: string|number };
  totals: { myr: string|number|null; eur: string|number|null; usd: string|number|null };
  per_person?: { myr?: string|number|null; eur?: string|number|null; usd?: string|number|null };
  warnings?: string[];
}

// ──────────────────────────────────────────────────────────
// Subcomponents
// ──────────────────────────────────────────────────────────
function StepBar({ step, steps }: { step: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 overflow-x-auto">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-1.5 shrink-0">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
            ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-gray-200 text-gray-400'}`}>
            {i < step ? <Check className="w-3.5 h-3.5"/> : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:block whitespace-nowrap
            ${i === step ? 'text-emerald-600' : i < step ? 'text-gray-500' : 'text-gray-400'}`}>{s}</span>
          {i < steps.length - 1 && <div className={`w-6 h-0.5 mx-1 ${i < step ? 'bg-emerald-400' : 'bg-gray-200'}`}/>}
        </div>
      ))}
    </div>
  );
}

function Counter({ value, onChange, min = 0, max = 20 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
        className="w-8 h-8 rounded-full border-2 flex items-center justify-center hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-30">
        <Minus className="w-3.5 h-3.5"/>
      </button>
      <span className="w-8 text-center font-bold text-gray-800">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
        className="w-8 h-8 rounded-full border-2 flex items-center justify-center hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-30">
        <Plus className="w-3.5 h-3.5"/>
      </button>
    </div>
  );
}

function fmt(v: any): string {
  if (v === null || v === undefined || v === '') return '—';
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return isNaN(n) ? '—' : n.toFixed(2);
}

// ──────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────
export function AgencyBookingWizard({ pkg, onClose, onSuccess }: {
  pkg: { id: number; name?: string; title?: string };
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t, isRTL } = useLanguage();
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<ConfiguratorResponse|null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // ── Group composition ──
  const [adults, setAdults] = useState(2);
  const [childrenCount, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  // ── Selections ──
  const [cityChoices, setCityChoices] = useState<CityChoice[]>([]);
  const [selectedTourIds, setSelectedTourIds] = useState<number[]>([]);
  const [selectedTransferIds, setSelectedTransferIds] = useState<number[]>([]);

  // ── Client info ──
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');

  // ── Pricing ──
  const [calc, setCalc] = useState<CalculateResponse|null>(null);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Load configurator ──
  useEffect(() => {
    setLoadingConfig(true);
    apiFetch(`/api/v1/packages/agency/${pkg.id}/configurator/`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then((data: ConfiguratorResponse) => {
        setConfig(data);
        // إعداد city choices الافتراضية
        setCityChoices((data.cities||[]).map(c => ({
          package_city_id: c.package_city_id,
          city_id: c.city_id,
          city_name: c.city_name,
          hotel_id: c.hotels[0]?.id ?? null,
          room_type_id: c.hotels[0]?.room_types?.[0]?.id ?? null,
          nights: c.default_nights,
          rooms_count: 1,
          children_with_bed: 0,
        })));
      })
      .catch(() => setConfig(null))
      .finally(() => setLoadingConfig(false));
  }, [pkg.id]);

  // ── Build calculate payload ──
  const calcPayload = useMemo(() => ({
    package_id: pkg.id,
    adults, children: childrenCount, infants,
    rooms: cityChoices
      .filter(c => c.hotel_id && c.room_type_id)
      .map(c => ({
        hotel_id: c.hotel_id,
        room_type_id: c.room_type_id,
        nights: c.nights,
        rooms_count: c.rooms_count,
        children_with_bed: c.children_with_bed,
      })),
    tours: selectedTourIds.map(id => ({ tour_id: id, direction: 'one_way' })),
    transfers: selectedTransferIds.map(id => ({ transfer_id: id, direction: 'round_trip' })),
  }), [pkg.id, adults, childrenCount, infants, cityChoices, selectedTourIds, selectedTransferIds]);

  // ── Auto-calc on selection changes ──
  useEffect(() => {
    if (loadingConfig || !config) return;
    setCalculating(true);
    apiFetch('/api/v1/bookings/calculate/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(calcPayload),
    })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then((data: CalculateResponse) => setCalc(data))
      .catch(() => setCalc(null))
      .finally(() => setCalculating(false));
  }, [loadingConfig, config, calcPayload]);

  // ── Save booking ──
  const handleSave = async () => {
    if (!clientName.trim() || !clientPhone.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch('/api/v1/bookings/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_type: 'agency', package: pkg.id,
          client_name: clientName, client_phone: clientPhone,
          client_email: clientEmail, notes,
          adults, children: childrenCount, infants,
          currency: 'MYR',
          cities: cityChoices.map((c, i) => ({
            city: c.city_id, nights: c.nights, order: i,
            hotels: c.hotel_id ? [{ hotel: c.hotel_id, nights: c.nights, rooms_count: c.rooms_count }] : [],
          })),
          services: [
            ...selectedTourIds.map(id => ({ service: id, quantity: adults + childrenCount })),
            ...selectedTransferIds.map(id => ({ service: id, quantity: 1 })),
          ],
          // مرجع للسعر المحسوب للأرشفة
          total_price: calc?.totals?.eur ?? null,
        }),
      });
      if (res.ok) onSuccess();
    } finally { setSaving(false); }
  };

  // ── Steps config ──
  const STEPS = ['People', 'Stay', 'Extras', 'Client & Confirm'];

  if (loadingConfig) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="bg-white rounded-3xl p-12 shadow-2xl flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600"/>
          <p className="text-sm text-gray-500">Loading package details...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-3 max-w-md">
          <AlertTriangle className="w-8 h-8 text-amber-500"/>
          <p className="text-sm text-gray-700 text-center">
            لا توجد تفاصيل قابلة للحجز في هذه الباقة.<br/>
            تأكد من تفعيل القالب وإضافة فنادق مسموحة في كل مدينة.
          </p>
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-xl">إغلاق</button>
        </div>
      </div>
    );
  }

  const canNext = (
    (step === 0 && (adults + childrenCount) > 0) ||
    // الفندق إجباري؛ نوع الغرفة اختياري إذا لم يوفّر الفندق أنواعاً
    (step === 1 && cityChoices.every(c => !!c.hotel_id)) ||
    (step === 2)
  );
  const canSave = clientName.trim() && clientPhone.trim();

  // ──────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-600"/>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{config.title}</h2>
              <p className="text-xs text-gray-500">
                {config.cities.length} مدن · {config.total_nights} ليالي
                {config.gift && <> · 🎁 {config.gift.name}</>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5"/></button>
        </div>

        <StepBar step={step} steps={STEPS}/>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-700">عدد الأفراد</p>
              {[
                { label: 'البالغون', sub: '12+ سنة', icon: <User className="w-4 h-4 text-blue-600"/>, val: adults, set: setAdults, min: 1 },
                { label: 'الأطفال',  sub: '2-11 سنة', icon: <Users className="w-4 h-4 text-purple-600"/>, val: childrenCount, set: setChildren },
                { label: 'الرضع',    sub: 'تحت 2',    icon: <Baby className="w-4 h-4 text-pink-600"/>, val: infants, set: setInfants },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">{item.icon}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.sub}</p>
                    </div>
                  </div>
                  <Counter value={item.val} onChange={item.set} min={item.min || 0}/>
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">اختر فندقاً وعدد الليالي لكل مدينة</p>
              {cityChoices.map((cc, ci) => {
                const cfgCity = config.cities.find(c => c.package_city_id === cc.package_city_id);
                if (!cfgCity) return null;
                const selectedHotel = (cfgCity.hotels||[]).find(h => h.id === cc.hotel_id);
                return (
                  <div key={cc.package_city_id} className="border rounded-2xl p-4 bg-gray-50/50">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-emerald-600"/>
                      <span className="font-semibold text-gray-800">{cc.city_name}</span>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">المدينة #{ci+1}</span>
                    </div>

                    {/* Hotel select */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">الفندق</label>
                      <select value={cc.hotel_id || ''}
                        onChange={e => {
                          const hid = Number(e.target.value);
                          const hotel = (cfgCity.hotels||[]).find(h => h.id === hid);
                          setCityChoices(prev => prev.map((p, i) => i === ci ? {
                            ...p, hotel_id: hid, room_type_id: hotel?.room_types?.[0]?.id ?? null,
                          } : p));
                        }}
                        className="w-full border p-2.5 rounded-xl text-sm bg-white">
                        <option value="">— اختر فندقاً —</option>
                        {(cfgCity.hotels||[]).map(h => (
                          <option key={h.id} value={h.id}>{h.name} {h.stars ? `(${h.stars}★)` : ''}</option>
                        ))}
                      </select>
                    </div>

                    {/* Room type */}
                    {selectedHotel && selectedHotel.room_types.length > 0 && (
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">نوع الغرفة</label>
                        <select value={cc.room_type_id || ''}
                          onChange={e => setCityChoices(prev => prev.map((p, i) => i === ci ? { ...p, room_type_id: Number(e.target.value) } : p))}
                          className="w-full border p-2.5 rounded-xl text-sm bg-white">
                          {selectedHotel.room_types.map(rt => (
                            <option key={rt.id} value={rt.id}>{rt.name}{rt.max_occupancy ? ` (حتى ${rt.max_occupancy})` : ''}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Nights + Rooms */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Moon className="w-3 h-3"/> الليالي</label>
                        <input type="number" min={1} value={cc.nights}
                          onChange={e => setCityChoices(prev => prev.map((p, i) => i === ci ? { ...p, nights: Math.max(1, Number(e.target.value)||1) } : p))}
                          className="w-full border p-2.5 rounded-xl text-sm bg-white" dir="ltr"/>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Building2 className="w-3 h-3"/> عدد الغرف</label>
                        <input type="number" min={1} value={cc.rooms_count}
                          onChange={e => setCityChoices(prev => prev.map((p, i) => i === ci ? { ...p, rooms_count: Math.max(1, Number(e.target.value)||1) } : p))}
                          className="w-full border p-2.5 rounded-xl text-sm bg-white" dir="ltr"/>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              {/* Tours */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><Briefcase className="w-4 h-4"/> الجولات السياحية (اختياري)</p>
                {(config.components.tours||[]).length === 0 ? (
                  <p className="text-xs text-gray-400 italic">لا توجد جولات مسموحة في هذه الباقة</p>
                ) : (
                  <div className="space-y-2">
                    {(config.components.tours||[]).map(t => {
                      const sel = selectedTourIds.includes(t.id);
                      return (
                        <label key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer
                          ${sel ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:border-blue-200'}`}>
                          <input type="checkbox" checked={sel}
                            onChange={() => setSelectedTourIds(prev => sel ? prev.filter(x => x !== t.id) : [...prev, t.id])}
                            className="w-4 h-4 accent-blue-600"/>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{t.name}</p>
                            <p className="text-xs text-gray-500">{t.city_name} · {t.destination}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Transfers */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><Car className="w-4 h-4"/> نقل المطار (اختياري)</p>
                {(config.components.transfers||[]).length === 0 ? (
                  <p className="text-xs text-gray-400 italic">لا توجد خدمات نقل مسموحة في هذه الباقة</p>
                ) : (
                  <div className="space-y-2">
                    {(config.components.transfers||[]).map(tr => {
                      const sel = selectedTransferIds.includes(tr.id);
                      return (
                        <label key={tr.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer
                          ${sel ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-gray-200 hover:border-emerald-200'}`}>
                          <input type="checkbox" checked={sel}
                            onChange={() => setSelectedTransferIds(prev => sel ? prev.filter(x => x !== tr.id) : [...prev, tr.id])}
                            className="w-4 h-4 accent-emerald-600"/>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{tr.name}</p>
                            <p className="text-xs text-gray-500">{tr.airport_code} ↔ {tr.hotel_name}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              {/* Client info */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700">بيانات العميل</p>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">الاسم الكامل *</label>
                  <input type="text" value={clientName} onChange={e=>setClientName(e.target.value)}
                    className="w-full border p-2.5 rounded-xl text-sm bg-white"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">رقم الهاتف *</label>
                    <input type="text" value={clientPhone} onChange={e=>setClientPhone(e.target.value)}
                      placeholder="+213 555 000000"
                      className="w-full border p-2.5 rounded-xl text-sm bg-white" dir="ltr"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">البريد الإلكتروني</label>
                    <input type="email" value={clientEmail} onChange={e=>setClientEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full border p-2.5 rounded-xl text-sm bg-white" dir="ltr"/>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">ملاحظات</label>
                  <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2}
                    className="w-full border p-2.5 rounded-xl text-sm bg-white resize-none"/>
                </div>
              </div>

              {/* Live price */}
              <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                    <Calculator className="w-4 h-4"/> السعر النهائي (يُحسب آلياً)
                  </p>
                  {calculating && <Loader2 className="w-4 h-4 animate-spin text-emerald-600"/>}
                </div>

                {calc ? (
                  <>
                    {calc.lines.length > 0 && (
                      <div className="space-y-1.5 mb-3 text-xs">
                        {calc.lines.map((line, i) => (
                          <div key={i} className="flex justify-between text-gray-600">
                            <span>{line.component_type}</span>
                            <span className="font-mono">{fmt(line.totals?.eur)} €</span>
                          </div>
                        ))}
                        <div className="border-t pt-1.5"></div>
                      </div>
                    )}
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-xs text-gray-600">المجموع:</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-emerald-600">{fmt(calc.totals?.eur)}</span>
                        <span className="text-sm text-gray-500">EUR</span>
                        <span className="text-xs text-gray-400">/ {fmt(calc.totals?.usd)} USD</span>
                      </div>
                    </div>
                    {calc.per_person?.eur && (
                      <div className="flex items-baseline justify-between text-xs text-gray-500">
                        <span>للفرد ({adults + childrenCount} محتسبين):</span>
                        <span className="font-semibold">{fmt(calc.per_person.eur)} EUR</span>
                      </div>
                    )}
                    {calc.warnings && calc.warnings.length > 0 && (
                      <div className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg p-2">
                        ⚠️ {calc.warnings[0]}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-500 italic">جارٍ الحساب...</p>
                )}
              </div>

              {!canSave && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"/>
                  <p className="text-xs text-amber-700">يرجى إدخال اسم العميل ورقم هاتفه</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t">
          <button onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="flex-1 py-2.5 border-2 rounded-xl font-medium text-sm hover:bg-gray-50">
            {step > 0 ? 'السابق' : 'إلغاء'}
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(step + 1)} disabled={!canNext}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
              التالي {isRTL ? <ChevronLeft className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving || !canSave}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin"/> جاري الحفظ...</>
                : <><CheckCircle2 className="w-4 h-4"/> تأكيد الحجز</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
