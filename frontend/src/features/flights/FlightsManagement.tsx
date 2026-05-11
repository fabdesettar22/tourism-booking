import { useEffect, useState } from 'react';
import { apiFetch } from '../../services/apiFetch';
import { useLanguage } from '../../hooks/useLanguage';

type Route = {
  id: string;
  origin_iata: string;
  destination_iata: string;
  departure_date: string;
  return_date: string | null;
  adults: number;
  children: number;
  cabin_class: string;
  commission_percentage: string;
  currency: string;
  display_title: string;
  is_active: boolean;
  last_refreshed_at: string | null;
  offers_count: number;
};

type Offer = {
  id: string;
  owner_iata: string;
  owner_name: string;
  base_amount: string;
  base_currency: string;
  commission_amount: string;
  total_amount: string;
  total_duration_min: number;
  slices_summary: Array<{ stops: number; origin: string; destination: string; departing_at: string; arriving_at: string }>;
};

const empty = (): Partial<Route> => ({
  origin_iata: '',
  destination_iata: '',
  departure_date: '',
  return_date: null,
  adults: 1,
  children: 0,
  cabin_class: 'economy',
  commission_percentage: '10.00',
  currency: 'MYR',
  display_title: '',
});

export function FlightsManagement() {
  const { lang } = useLanguage();
  const rtl = lang === 'ar';

  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Route>>(empty());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [offersById, setOffersById] = useState<Record<string, Offer[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState('');

  const t = {
    ar: { title: 'تذاكر الطيران', add: '+ إضافة مسار', from: 'من', to: 'إلى', depart: 'تاريخ المغادرة', return: 'العودة (اختياري)', adults: 'بالغون', children: 'أطفال', cabin: 'فئة المقعد', commission: 'العمولة %', currency: 'العملة', save: 'حفظ', cancel: 'إلغاء', refresh: 'تحديث الأسعار', activate: 'تفعيل', deactivate: 'إلغاء التفعيل', delete: 'حذف', view: 'العروض', empty: 'لا توجد مسارات. أضف أوّل مسار.', loading: 'جارٍ التحميل...', refreshing: 'جارٍ الجلب...', active: 'مُفعَّل', inactive: 'غير مُفعَّل', base: 'الأصلي', total: 'النهائي', stops: 'توقفات', direct: 'مباشر', neverRefreshed: 'لم يُحدَّث بعد', refreshFirst: 'حدّث الأسعار أولاً قبل التفعيل' },
    en: { title: 'Flight Tickets', add: '+ Add Route', from: 'From', to: 'To', depart: 'Departure', return: 'Return (optional)', adults: 'Adults', children: 'Children', cabin: 'Cabin', commission: 'Commission %', currency: 'Currency', save: 'Save', cancel: 'Cancel', refresh: 'Refresh prices', activate: 'Activate', deactivate: 'Deactivate', delete: 'Delete', view: 'Offers', empty: 'No routes yet. Add your first route.', loading: 'Loading…', refreshing: 'Fetching…', active: 'Active', inactive: 'Inactive', base: 'Base', total: 'Total', stops: 'stops', direct: 'Direct', neverRefreshed: 'Never refreshed', refreshFirst: 'Refresh prices before activating' },
    ms: { title: 'Tiket Penerbangan', add: '+ Tambah Laluan', from: 'Dari', to: 'Ke', depart: 'Berlepas', return: 'Pulang (pilihan)', adults: 'Dewasa', children: 'Kanak-kanak', cabin: 'Kelas', commission: 'Komisen %', currency: 'Mata wang', save: 'Simpan', cancel: 'Batal', refresh: 'Muat semula harga', activate: 'Aktifkan', deactivate: 'Nyahaktif', delete: 'Padam', view: 'Tawaran', empty: 'Tiada laluan. Tambah laluan pertama anda.', loading: 'Memuatkan…', refreshing: 'Mengambil…', active: 'Aktif', inactive: 'Tidak aktif', base: 'Asas', total: 'Jumlah', stops: 'persinggahan', direct: 'Terus', neverRefreshed: 'Belum dimuat semula', refreshFirst: 'Muat semula harga sebelum mengaktifkan' },
  }[lang];

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await apiFetch('/api/v1/flights/routes/');
      const data = await r.json();
      setRoutes(Array.isArray(data) ? data : data.results || []);
    } catch (e: any) { setError(String(e?.message || e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    setError('');
    if (!form.origin_iata || !form.destination_iata || !form.departure_date) {
      setError(rtl ? 'املأ كل الحقول المطلوبة' : 'Fill required fields'); return;
    }
    const payload = { ...form, origin_iata: form.origin_iata?.toUpperCase(), destination_iata: form.destination_iata?.toUpperCase(), return_date: form.return_date || null };
    const r = await apiFetch('/api/v1/flights/routes/', { method: 'POST', body: JSON.stringify(payload) });
    if (!r.ok) { const e = await r.json().catch(() => ({})); setError(JSON.stringify(e)); return; }
    setShowForm(false); setForm(empty()); load();
  };

  const refresh = async (id: string) => {
    setBusyId(id); setError('');
    const r = await apiFetch(`/api/v1/flights/routes/${id}/refresh/`, { method: 'POST' });
    if (!r.ok) { const e = await r.json().catch(() => ({})); setError(e.detail || JSON.stringify(e)); }
    else {
      const data = await r.json();
      setOffersById(prev => ({ ...prev, [id]: data.offers }));
      load();
    }
    setBusyId(null);
  };

  const toggleActive = async (route: Route) => {
    const action = route.is_active ? 'deactivate' : 'activate';
    const r = await apiFetch(`/api/v1/flights/routes/${route.id}/${action}/`, { method: 'POST' });
    if (!r.ok) { const e = await r.json().catch(() => ({})); setError(e.detail || JSON.stringify(e)); return; }
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(rtl ? 'حذف هذا المسار؟' : 'Delete this route?')) return;
    await apiFetch(`/api/v1/flights/routes/${id}/`, { method: 'DELETE' });
    load();
  };

  const loadOffers = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (offersById[id]) return;
    const r = await apiFetch(`/api/v1/flights/routes/${id}/offers/`);
    if (r.ok) {
      const data = await r.json();
      setOffersById(prev => ({ ...prev, [id]: data }));
    }
  };

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{t.title} ✈️</h1>
        <button onClick={() => setShowForm(s => !s)} className="bg-[#FF6B35] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#e07a38]">
          {showForm ? t.cancel : t.add}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">{error}</div>}

      {showForm && (
        <div className="bg-white border rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label={t.from}><input maxLength={3} value={form.origin_iata || ''} onChange={e => setForm({ ...form, origin_iata: e.target.value.toUpperCase() })} placeholder="KUL" className="input" /></Field>
          <Field label={t.to}><input maxLength={3} value={form.destination_iata || ''} onChange={e => setForm({ ...form, destination_iata: e.target.value.toUpperCase() })} placeholder="DXB" className="input" /></Field>
          <Field label={t.cabin}>
            <select value={form.cabin_class} onChange={e => setForm({ ...form, cabin_class: e.target.value })} className="input">
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First</option>
            </select>
          </Field>
          <Field label={t.depart}><input type="date" value={form.departure_date || ''} onChange={e => setForm({ ...form, departure_date: e.target.value })} className="input" /></Field>
          <Field label={t.return}><input type="date" value={form.return_date || ''} onChange={e => setForm({ ...form, return_date: e.target.value || null })} className="input" /></Field>
          <Field label={t.adults}><input type="number" min={1} value={form.adults || 1} onChange={e => setForm({ ...form, adults: +e.target.value })} className="input" /></Field>
          <Field label={t.children}><input type="number" min={0} value={form.children || 0} onChange={e => setForm({ ...form, children: +e.target.value })} className="input" /></Field>
          <Field label={t.commission}><input type="number" step="0.01" min={0} max={100} value={form.commission_percentage || ''} onChange={e => setForm({ ...form, commission_percentage: e.target.value })} className="input" /></Field>
          <Field label={t.currency}>
            <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="input">
              {['MYR','USD','SAR','AED','SGD','EUR'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <div className="md:col-span-3 flex gap-3 justify-end">
            <button onClick={() => { setShowForm(false); setForm(empty()); }} className="px-5 py-2.5 rounded-lg border">{t.cancel}</button>
            <button onClick={submit} className="px-5 py-2.5 rounded-lg bg-[#FF6B35] text-white font-semibold">{t.save}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-12">{t.loading}</div>
      ) : routes.length === 0 ? (
        <div className="bg-gray-50 border border-dashed rounded-xl p-12 text-center text-gray-500">{t.empty}</div>
      ) : (
        <div className="space-y-3">
          {routes.map(r => (
            <div key={r.id} className="bg-white border rounded-xl p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="text-lg font-bold">
                    {r.display_title || `${r.origin_iata} → ${r.destination_iata}`}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {r.departure_date}{r.return_date ? ` ↔ ${r.return_date}` : ''} · {r.cabin_class} · {r.adults}+{r.children} · {t.commission} {r.commission_percentage}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {r.last_refreshed_at ? `↻ ${new Date(r.last_refreshed_at).toLocaleString()}` : t.neverRefreshed} · {r.offers_count} {t.view}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {r.is_active ? t.active : t.inactive}
                  </span>
                  <button disabled={busyId === r.id} onClick={() => refresh(r.id)} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 disabled:opacity-50">
                    {busyId === r.id ? t.refreshing : t.refresh}
                  </button>
                  <button onClick={() => toggleActive(r)} className={`px-3 py-1.5 text-sm rounded text-white ${r.is_active ? 'bg-gray-500' : 'bg-green-600'}`}>
                    {r.is_active ? t.deactivate : t.activate}
                  </button>
                  <button onClick={() => loadOffers(r.id)} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50">
                    {t.view} {expanded === r.id ? '▲' : '▼'}
                  </button>
                  <button onClick={() => remove(r.id)} className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50">
                    {t.delete}
                  </button>
                </div>
              </div>

              {expanded === r.id && (
                <div className="mt-4 border-t pt-4 space-y-2">
                  {(offersById[r.id] || []).length === 0 ? (
                    <div className="text-sm text-gray-500">—</div>
                  ) : offersById[r.id].map(o => (
                    <div key={o.id} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded">
                      <div className="text-sm">
                        <div className="font-semibold">{o.owner_iata} · {o.owner_name}</div>
                        <div className="text-gray-600">
                          {o.slices_summary?.[0]?.stops === 0 ? t.direct : `${o.slices_summary?.[0]?.stops} ${t.stops}`} · {Math.round(o.total_duration_min/60)}h{o.total_duration_min%60}m
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-gray-400 line-through text-xs">{t.base}: {o.base_amount} {o.base_currency}</div>
                        <div className="font-bold text-lg text-[#FF6B35]">{o.total_amount} {o.base_currency}</div>
                        <div className="text-xs text-gray-500">+{o.commission_amount}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
