import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../services/apiFetch';
import { useLanguage } from '../../hooks/useLanguage';

type Route = {
  id: string;
  origin_iata: string;
  destination_iata: string;
  base_price: string | null;
  commission_percentage: string;
  commission_amount: string | null;
  final_price: string | null;
  uses_manual_pricing?: boolean;
  currency: string;
  display_title: string;
  is_active: boolean;
  created_at: string;
};

const emptyForm = () => ({
  origin_iata: '',
  destination_iata: '',
  base_price: '',
  commission_percentage: '10.00',
  currency: 'MYR',
  display_title: '',
  is_active: false,
});

const STRINGS = {
  ar: {
    title: 'مسارات تذاكر الطيران',
    subtitle: 'عرّف المسار، أدخل سعر التذكرة يدوياً ونسبة العمولة. إن تُرك السعر فارغاً تُجلب الأسعار live من المزوّد عند الحجز.',
    add: '+ إضافة مسار',
    edit: 'تعديل',
    from: 'من (IATA)',
    to: 'إلى (IATA)',
    basePrice: 'سعر الرحلة',
    basePriceHint: 'اتركه فارغاً للأسعار المباشرة (Duffel)',
    commission: 'نسبة العمولة %',
    finalPrice: 'السعر النهائي',
    currency: 'العملة',
    displayTitle: 'العنوان للعرض (اختياري)',
    active: 'مُفعَّل للبيع',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    confirmDelete: 'حذف هذا المسار؟',
    empty: 'لا توجد مسارات. أضف أوّل مسار.',
    loading: 'جارٍ التحميل...',
    activeLabel: 'مُفعَّل',
    inactive: 'غير مُفعَّل',
    errFields: 'املأ المطارين ونسبة العمولة',
    manual: 'سعر يدوي',
    live: 'سعر مباشر',
  },
  en: {
    title: 'Flight Routes',
    subtitle: 'Define the route, enter a manual ticket price and commission %. Leave price empty for live Duffel pricing at booking.',
    add: '+ Add Route',
    edit: 'Edit',
    from: 'From (IATA)',
    to: 'To (IATA)',
    basePrice: 'Ticket price',
    basePriceHint: 'Leave empty for live provider pricing',
    commission: 'Commission %',
    finalPrice: 'Final price',
    currency: 'Currency',
    displayTitle: 'Display title (optional)',
    active: 'Active for sale',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    confirmDelete: 'Delete this route?',
    empty: 'No routes yet. Add your first route.',
    loading: 'Loading…',
    activeLabel: 'Active',
    inactive: 'Inactive',
    errFields: 'Fill airports and commission %',
    manual: 'Manual price',
    live: 'Live pricing',
  },
  ms: {
    title: 'Laluan Penerbangan',
    subtitle: 'Tentukan laluan, masukkan harga tiket manual dan % komisen. Kosongkan harga untuk harga langsung dari pembekal.',
    add: '+ Tambah Laluan',
    edit: 'Edit',
    from: 'Dari (IATA)',
    to: 'Ke (IATA)',
    basePrice: 'Harga tiket',
    basePriceHint: 'Kosongkan untuk harga langsung',
    commission: 'Komisen %',
    finalPrice: 'Harga akhir',
    currency: 'Mata wang',
    displayTitle: 'Tajuk paparan (pilihan)',
    active: 'Aktif untuk dijual',
    save: 'Simpan',
    cancel: 'Batal',
    delete: 'Padam',
    confirmDelete: 'Padam laluan ini?',
    empty: 'Tiada laluan. Tambah yang pertama.',
    loading: 'Memuatkan…',
    activeLabel: 'Aktif',
    inactive: 'Tidak aktif',
    errFields: 'Isi lapangan terbang dan komisen %',
    manual: 'Harga manual',
    live: 'Harga langsung',
  },
};

function calcFinalPreview(basePrice: string, commissionPct: string): string | null {
  const base = parseFloat(basePrice);
  const pct = parseFloat(commissionPct);
  if (!basePrice || Number.isNaN(base) || Number.isNaN(pct)) return null;
  const commission = Math.round(base * pct) / 100;
  return (base + commission).toFixed(2);
}

export function FlightsManagement() {
  const { lang } = useLanguage();
  const rtl = lang === 'ar';
  const t = STRINGS[lang as 'ar' | 'en' | 'ms'] || STRINGS.en;

  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');

  const previewFinal = useMemo(
    () => calcFinalPreview(form.base_price, form.commission_percentage),
    [form.base_price, form.commission_percentage],
  );

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await apiFetch('/api/v1/flights/routes/');
      const data = await r.json();
      setRoutes(Array.isArray(data) ? data : data.results || []);
    } catch (e: unknown) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (r: Route) => {
    setEditingId(r.id);
    setForm({
      origin_iata: r.origin_iata,
      destination_iata: r.destination_iata,
      base_price: r.base_price ?? '',
      commission_percentage: r.commission_percentage,
      currency: r.currency,
      display_title: r.display_title || '',
      is_active: r.is_active,
    });
    setShowForm(true);
  };

  const submit = async () => {
    setError('');
    if (!form.origin_iata || !form.destination_iata || !form.commission_percentage) {
      setError(t.errFields);
      return;
    }
    const payload = {
      origin_iata: form.origin_iata.toUpperCase(),
      destination_iata: form.destination_iata.toUpperCase(),
      commission_percentage: form.commission_percentage,
      currency: form.currency,
      display_title: form.display_title,
      is_active: form.is_active,
      base_price: form.base_price.trim() === '' ? null : form.base_price,
    };
    const url = editingId ? `/api/v1/flights/routes/${editingId}/` : '/api/v1/flights/routes/';
    const method = editingId ? 'PATCH' : 'POST';
    const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      setError(JSON.stringify(e));
      return;
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    await apiFetch(`/api/v1/flights/routes/${id}/`, { method: 'DELETE' });
    load();
  };

  const toggleActive = async (r: Route) => {
    const res = await apiFetch(`/api/v1/flights/routes/${r.id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !r.is_active }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      setError(JSON.stringify(e));
      return;
    }
    load();
  };

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.title} ✈️</h1>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">{t.subtitle}</p>
        </div>
        <button
          onClick={() => {
            setShowForm(s => !s);
            setEditingId(null);
            setForm(emptyForm());
          }}
          className="bg-[#FF6B35] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#e07a38]"
        >
          {showForm ? t.cancel : t.add}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">{error}</div>
      )}

      {showForm && (
        <div className="bg-white border rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label={t.from}>
            <input
              maxLength={3}
              value={form.origin_iata}
              onChange={e => setForm({ ...form, origin_iata: e.target.value.toUpperCase() })}
              placeholder="KUL"
              className="input"
            />
          </Field>
          <Field label={t.to}>
            <input
              maxLength={3}
              value={form.destination_iata}
              onChange={e => setForm({ ...form, destination_iata: e.target.value.toUpperCase() })}
              placeholder="DXB"
              className="input"
            />
          </Field>
          <Field label={t.basePrice} hint={t.basePriceHint}>
            <input
              type="number"
              step="0.01"
              min={0}
              value={form.base_price}
              onChange={e => setForm({ ...form, base_price: e.target.value })}
              placeholder="850.00"
              className="input"
            />
          </Field>
          <Field label={t.commission}>
            <input
              type="number"
              step="0.01"
              min={0}
              max={100}
              value={form.commission_percentage}
              onChange={e => setForm({ ...form, commission_percentage: e.target.value })}
              className="input"
            />
          </Field>
          <Field label={t.currency}>
            <select
              value={form.currency}
              onChange={e => setForm({ ...form, currency: e.target.value })}
              className="input"
            >
              {['MYR', 'USD', 'SAR', 'AED', 'SGD', 'EUR'].map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          {previewFinal && (
            <Field label={t.finalPrice}>
              <div className="input bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold flex items-center">
                {previewFinal} {form.currency}
              </div>
            </Field>
          )}
          <Field label={t.displayTitle}>
            <input
              value={form.display_title}
              onChange={e => setForm({ ...form, display_title: e.target.value })}
              placeholder="Kuala Lumpur → Dubai"
              className="input"
            />
          </Field>
          <label className="flex items-end gap-2 pb-1">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">{t.active}</span>
          </label>
          <div className="md:col-span-3 flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(emptyForm());
              }}
              className="px-5 py-2.5 rounded-lg border"
            >
              {t.cancel}
            </button>
            <button onClick={submit} className="px-5 py-2.5 rounded-lg bg-[#FF6B35] text-white font-semibold">
              {t.save}
            </button>
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
            <div
              key={r.id}
              className="bg-white border rounded-xl p-5 flex items-center justify-between flex-wrap gap-3"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-bold">
                    {r.display_title || `${r.origin_iata} → ${r.destination_iata}`}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.base_price ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {r.base_price ? t.manual : t.live}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {r.origin_iata} → {r.destination_iata} · {t.commission} {r.commission_percentage}% · {r.currency}
                </div>
                {r.base_price && (
                  <div className="text-sm font-semibold text-[#FF6B35] mt-1">
                    {r.base_price} + {r.commission_amount ?? '—'} = {r.final_price ?? '—'} {r.currency}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={() => toggleActive(r)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded ${
                    r.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {r.is_active ? t.activeLabel : t.inactive}
                </button>
                <button onClick={() => startEdit(r)} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50">
                  {t.edit}
                </button>
                <button
                  onClick={() => remove(r.id)}
                  className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
                >
                  {t.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`.input{width:100%;border:1px solid #e5e7eb;border-radius:.5rem;padding:.55rem .75rem;font-size:.9rem;background:white;}`}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-600 mb-1">{label}</span>
      {hint && <span className="block text-[10px] text-gray-400 mb-1">{hint}</span>}
      {children}
    </label>
  );
}
