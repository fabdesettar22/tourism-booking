import { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8000';

type Offer = {
  duffel_offer_id: string;
  owner_iata: string;
  owner_name: string;
  base_amount: string;
  commission_amount: string;
  total_amount: string;
  currency: string;
  duration_min: number;
  expires_at: string | null;
  slices: Array<{
    origin: string;
    destination: string;
    departing_at: string;
    arriving_at: string;
    stops: number;
  }>;
};

type SearchResult = {
  route: { id: string; origin: string; destination: string; commission_percentage: string; display_title: string; currency: string };
  offers: Offer[];
};

const STRINGS = {
  ar: { title: 'ابحث عن رحلتك', subtitle: 'احصل على أفضل أسعار التذاكر بشكل مباشر', from: 'من (IATA)', to: 'إلى (IATA)', dep: 'تاريخ المغادرة', ret: 'تاريخ العودة (اختياري)', adults: 'بالغون', children: 'أطفال', infants: 'رضّع', cabin: 'فئة المقعد', search: 'بحث', searching: 'جارٍ البحث...', stops: 'توقفات', direct: 'مباشر', book: 'اطلب الحجز', noOffers: 'لا توجد عروض لهذا المسار في هذا التاريخ.', notAvailable: 'هذا المسار غير متاح. جرّب وجهة أخرى.', errFields: 'املأ كل الحقول المطلوبة' },
  en: { title: 'Search your flight', subtitle: 'Get the best ticket prices live', from: 'From (IATA)', to: 'To (IATA)', dep: 'Departure', ret: 'Return (optional)', adults: 'Adults', children: 'Children', infants: 'Infants', cabin: 'Cabin', search: 'Search', searching: 'Searching…', stops: 'stops', direct: 'Direct', book: 'Request booking', noOffers: 'No offers for this route on this date.', notAvailable: 'This route is not available. Try another destination.', errFields: 'Fill required fields' },
  ms: { title: 'Cari penerbangan anda', subtitle: 'Dapatkan harga terbaik secara langsung', from: 'Dari (IATA)', to: 'Ke (IATA)', dep: 'Berlepas', ret: 'Pulang (pilihan)', adults: 'Dewasa', children: 'Kanak-kanak', infants: 'Bayi', cabin: 'Kelas', search: 'Cari', searching: 'Mencari…', stops: 'persinggahan', direct: 'Terus', book: 'Minta tempahan', noOffers: 'Tiada tawaran untuk laluan ini pada tarikh ini.', notAvailable: 'Laluan ini tidak tersedia. Cuba destinasi lain.', errFields: 'Isi semua medan yang diperlukan' },
};

export function FlightsPage() {
  const { lang } = useLanguage();
  const rtl = lang === 'ar';
  const t = STRINGS[lang as 'ar' | 'en' | 'ms'] || STRINGS.en;

  const [form, setForm] = useState({
    origin: '', destination: '',
    departure_date: '', return_date: '',
    adults: 1, children: 0, infants: 0,
    cabin_class: 'economy',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState('');

  const submit = async () => {
    setError(''); setResult(null);
    if (!form.origin || !form.destination || !form.departure_date) {
      setError(t.errFields); return;
    }
    setLoading(true);
    try {
      const payload: any = { ...form };
      if (!payload.return_date) delete payload.return_date;
      payload.origin = payload.origin.toUpperCase();
      payload.destination = payload.destination.toUpperCase();
      const res = await fetch(`${API_BASE}/api/v1/flights/search/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 404) { setError(t.notAvailable); return; }
      if (!res.ok) { const e = await res.json().catch(() => ({})); setError(e.detail || JSON.stringify(e)); return; }
      setResult(await res.json());
    } finally { setLoading(false); }
  };

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-2">{t.title} ✈️</h1>
        <p className="text-gray-600 mb-6">{t.subtitle}</p>

        <div className="bg-white border rounded-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label={t.from}>
            <input maxLength={3} value={form.origin}
              onChange={e => setForm({ ...form, origin: e.target.value.toUpperCase() })}
              placeholder="KUL" className="input" />
          </Field>
          <Field label={t.to}>
            <input maxLength={3} value={form.destination}
              onChange={e => setForm({ ...form, destination: e.target.value.toUpperCase() })}
              placeholder="DXB" className="input" />
          </Field>
          <Field label={t.dep}>
            <input type="date" value={form.departure_date}
              onChange={e => setForm({ ...form, departure_date: e.target.value })} className="input" />
          </Field>
          <Field label={t.ret}>
            <input type="date" value={form.return_date}
              onChange={e => setForm({ ...form, return_date: e.target.value })} className="input" />
          </Field>
          <Field label={t.adults}>
            <input type="number" min={1} max={9} value={form.adults}
              onChange={e => setForm({ ...form, adults: +e.target.value })} className="input" />
          </Field>
          <Field label={t.children}>
            <input type="number" min={0} max={8} value={form.children}
              onChange={e => setForm({ ...form, children: +e.target.value })} className="input" />
          </Field>
          <Field label={t.infants}>
            <input type="number" min={0} max={4} value={form.infants}
              onChange={e => setForm({ ...form, infants: +e.target.value })} className="input" />
          </Field>
          <Field label={t.cabin}>
            <select value={form.cabin_class}
              onChange={e => setForm({ ...form, cabin_class: e.target.value })} className="input">
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First</option>
            </select>
          </Field>
          <div className="col-span-2 md:col-span-4 flex justify-end">
            <button onClick={submit} disabled={loading}
              className="bg-[#FF6B35] hover:bg-[#e07a38] disabled:opacity-50 text-white px-8 py-3 rounded-lg font-bold">
              {loading ? t.searching : t.search}
            </button>
          </div>
        </div>

        {error && <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">{error}</div>}

        {result && (
          <div className="mt-6 space-y-3">
            {(result.offers || []).length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center text-gray-500">{t.noOffers}</div>
            ) : (result.offers || []).map((o, idx) => (
              <div key={o.duffel_offer_id || `offer-${idx}`} className="bg-white rounded-xl border p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-[220px]">
                  <div className="font-bold text-lg">{o.owner_name || o.owner_iata || result.route.display_title}</div>
                  <div className="text-sm text-gray-600">
                    {!o.slices?.length
                      ? `${result.route.origin} → ${result.route.destination}`
                      : o.slices[0]?.stops === 0
                        ? t.direct
                        : `${o.slices[0]?.stops ?? '?'} ${t.stops}`}
                    {o.duration_min > 0 && (
                      <>
                        {' · '}
                        {Math.floor(o.duration_min / 60)}h {o.duration_min % 60}m
                      </>
                    )}
                  </div>
                  {o.slices[0] && (
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(o.slices[0].departing_at).toLocaleString()} → {new Date(o.slices[0].arriving_at).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#FF6B35]">{o.total_amount} {o.currency}</div>
                  <button className="mt-2 bg-[#FF6B35] hover:bg-[#e07a38] text-white px-5 py-2 rounded-lg font-semibold">
                    {t.book}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`.input{width:100%;border:1px solid #e5e7eb;border-radius:.5rem;padding:.55rem .75rem;font-size:.9rem;background:white;}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
