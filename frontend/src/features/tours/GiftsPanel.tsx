/**
 * GiftsPanel — لوحة إدارة الهدايا.
 * تظهر داخل ServicesManagement كقسم منفصل (sub-tab 4).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Gift as GiftIcon, Plus, Edit, Trash2, X, Loader2, Calculator,
  CheckCircle2, XCircle, AlertTriangle, Smartphone, Flower2, Cookie, Droplet,
  Star, Upload, ImageIcon,
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { apiFetch } from '../../services/apiFetch';
import {
  giftsApi,
  type Gift, type GiftQuote, type GiftSubcategory, type GiftPhoto,
} from '../../services/giftsApi';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; type: ToastType; message: string; }
type Lang = 'ar' | 'en' | 'ms';

// ── i18n ─────────────────────────────────────────────────
const T_STR: Record<Lang, Record<string, string>> = {
  ar: {
    title: 'الهدايا',
    summaryTpl: '{n} هدية منشورة',
    add: 'إضافة هدية',
    loading: 'تحميل...',
    noGifts: 'لا توجد هدايا بعد',
    addFirst: 'إضافة أول هدية',
    saved: 'تم الحفظ', deleted: 'تم الحذف',
    saving: 'جارٍ الحفظ...',
    create: 'إنشاء', save: 'حفظ', cancel: 'إلغاء',
    edit: 'تعديل', delete: 'حذف', calc: 'حساب السعر',
    confirmDelete: 'تأكيد الحذف',
    confirmDeleteMsg: 'سيتم حذف هدية {name} نهائياً.',
    formNew: 'إضافة هدية جديدة',
    formEdit: 'تعديل الهدية',
    serviceName: 'اسم الهدية',
    subcategory: 'الفئة الفرعية',
    isMandatory: 'إجبارية بشكل افتراضي',
    isMandatoryHint: 'إذا فُعِّلت، تُضاف الهدية تلقائياً لكل باقة كعنصر إجباري',
    price: 'السعر (MYR)',
    margin: 'نسبة الربح %',
    descTitle: 'الوصف',
    descAr: 'الوصف بالعربية',
    descEn: 'Description (English)',
    descArPh: 'وصف الهدية باللغة العربية...',
    descEnPh: 'Gift description in English...',
    notes: 'ملاحظات',
    photosOf: 'الصور ({n}/{max})',
    upload: 'رفع صورة', uploading: 'يرفع...',
    saveFirstHint: 'احفظ الهدية أولاً ثم سيمكنك رفع الصور (حد أقصى 7 صور).',
    noPhotos: 'لا توجد صور بعد — اضغط "رفع صورة" لإضافة أول صورة',
    setPrimary: 'تعيين كرئيسية', primary: 'رئيسية',
    quoteTitle: 'حساب السعر',
    quantity: 'الكمية',
    calculate: 'احسب',
    unitPrice: 'سعر الوحدة',
    base: 'الأساس',
    profit: 'الربح ({pct}%)',
    total: 'الإجمالي',
    needPrice: 'أدخل السعر',
    failedLoad: 'فشل التحميل',
    filterAll: 'الكل',
    mandatoryBadge: 'إجبارية',
    optionalBadge: 'اختيارية',
    sub_sim_card: 'شريحة اتصال',
    sub_flowers: 'باقة ورد',
    sub_dates: 'تمر',
    sub_zam_zam: 'ماء زمزم',
    sub_other: 'أخرى',
  },
  en: {
    title: 'Gifts',
    summaryTpl: '{n} gifts published',
    add: 'Add Gift',
    loading: 'Loading...',
    noGifts: 'No gifts yet',
    addFirst: 'Add first gift',
    saved: 'Saved', deleted: 'Deleted',
    saving: 'Saving...',
    create: 'Create', save: 'Save', cancel: 'Cancel',
    edit: 'Edit', delete: 'Delete', calc: 'Calculate price',
    confirmDelete: 'Confirm deletion',
    confirmDeleteMsg: 'Gift {name} will be permanently deleted.',
    formNew: 'New gift',
    formEdit: 'Edit gift',
    serviceName: 'Gift name',
    subcategory: 'Subcategory',
    isMandatory: 'Mandatory by default',
    isMandatoryHint: 'If enabled, this gift is auto-added to every package as mandatory',
    price: 'Price (MYR)',
    margin: 'Profit margin %',
    descTitle: 'Description',
    descAr: 'Description (Arabic)',
    descEn: 'Description (English)',
    descArPh: 'Gift description in Arabic...',
    descEnPh: 'Gift description in English...',
    notes: 'Notes',
    photosOf: 'Photos ({n}/{max})',
    upload: 'Upload photo', uploading: 'Uploading...',
    saveFirstHint: 'Save the gift first to upload photos (max 7).',
    noPhotos: 'No photos yet — click "Upload" to add the first one',
    setPrimary: 'Set as primary', primary: 'Primary',
    quoteTitle: 'Price calculator',
    quantity: 'Quantity',
    calculate: 'Calculate',
    unitPrice: 'Unit price',
    base: 'Subtotal',
    profit: 'Profit ({pct}%)',
    total: 'Total',
    needPrice: 'Enter price',
    failedLoad: 'Failed to load',
    filterAll: 'All',
    mandatoryBadge: 'Mandatory',
    optionalBadge: 'Optional',
    sub_sim_card: 'SIM Card',
    sub_flowers: 'Flowers',
    sub_dates: 'Dates',
    sub_zam_zam: 'Zam Zam Water',
    sub_other: 'Other',
  },
  ms: {
    title: 'Hadiah',
    summaryTpl: '{n} hadiah diterbitkan',
    add: 'Tambah Hadiah',
    loading: 'Memuatkan...',
    noGifts: 'Belum ada hadiah',
    addFirst: 'Tambah hadiah pertama',
    saved: 'Disimpan', deleted: 'Dipadam',
    saving: 'Menyimpan...',
    create: 'Cipta', save: 'Simpan', cancel: 'Batal',
    edit: 'Edit', delete: 'Padam', calc: 'Kira harga',
    confirmDelete: 'Sahkan pemadaman',
    confirmDeleteMsg: 'Hadiah {name} akan dipadam selamanya.',
    formNew: 'Hadiah baharu',
    formEdit: 'Edit hadiah',
    serviceName: 'Nama hadiah',
    subcategory: 'Sub-kategori',
    isMandatory: 'Wajib secara lalai',
    isMandatoryHint: 'Jika dihidupkan, hadiah ini ditambah secara automatik ke setiap pakej sebagai wajib',
    price: 'Harga (MYR)',
    margin: 'Margin keuntungan %',
    descTitle: 'Penerangan',
    descAr: 'Penerangan (Arab)',
    descEn: 'Description (English)',
    descArPh: 'Penerangan hadiah dalam bahasa Arab...',
    descEnPh: 'Gift description in English...',
    notes: 'Nota',
    photosOf: 'Gambar ({n}/{max})',
    upload: 'Muat naik gambar', uploading: 'Memuat naik...',
    saveFirstHint: 'Simpan hadiah dahulu untuk memuat naik gambar (maks 7).',
    noPhotos: 'Belum ada gambar — klik "Muat naik" untuk menambah yang pertama',
    setPrimary: 'Jadikan utama', primary: 'Utama',
    quoteTitle: 'Kalkulator harga',
    quantity: 'Kuantiti',
    calculate: 'Kira',
    unitPrice: 'Harga seunit',
    base: 'Jumlah kecil',
    profit: 'Keuntungan ({pct}%)',
    total: 'Jumlah',
    needPrice: 'Masukkan harga',
    failedLoad: 'Gagal memuatkan',
    filterAll: 'Semua',
    mandatoryBadge: 'Wajib',
    optionalBadge: 'Pilihan',
    sub_sim_card: 'Kad SIM',
    sub_flowers: 'Bunga',
    sub_dates: 'Kurma',
    sub_zam_zam: 'Air Zam Zam',
    sub_other: 'Lain-lain',
  },
};

const tt = (lang: Lang, key: string, vars?: Record<string, string | number>): string => {
  let s = (T_STR[lang] || T_STR.en)[key] || (T_STR.en[key] || key);
  if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.replace(`{${k}}`, String(v)); });
  return s;
};

function useT() {
  const { lang } = useLanguage();
  return (key: string, vars?: Record<string, string | number>) => tt(lang as Lang, key, vars);
}

// ── Icons + colors per subcategory ───────────────────────
const SUB_META: Record<GiftSubcategory, { Icon: any; color: string }> = {
  sim_card: { Icon: Smartphone, color: 'bg-purple-50 text-purple-600' },
  flowers:  { Icon: Flower2,    color: 'bg-pink-50 text-pink-600' },
  dates:    { Icon: Cookie,     color: 'bg-amber-50 text-amber-600' },
  zam_zam:  { Icon: Droplet,    color: 'bg-cyan-50 text-cyan-600' },
  other:    { Icon: GiftIcon,   color: 'bg-gray-50 text-gray-600' },
};

const SUBS: GiftSubcategory[] = ['sim_card', 'flowers', 'dates', 'zam_zam', 'other'];
const MAX_PHOTOS = 7;

// ── Main component ──────────────────────────────────────
export function GiftsPanel() {
  const { isRTL } = useLanguage();
  const t = useT();

  const [gifts,   setGifts]   = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<GiftSubcategory | 'all'>('all');
  const [toasts,  setToasts]  = useState<Toast[]>([]);
  const [showForm,setShowForm]= useState(false);
  const [editing, setEditing] = useState<Gift | null>(null);
  const [calcFor, setCalcFor] = useState<Gift | null>(null);
  const [delFor,  setDelFor]  = useState<Gift | null>(null);

  const addToast = (type: ToastType, msg: string) => {
    const id = Date.now() + Math.random();
    setToasts(ts => [...ts, { id, type, message: msg }]);
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 4000);
  };

  const reload = async () => {
    setLoading(true);
    try { setGifts(await giftsApi.list()); }
    catch (e: any) { addToast('error', e.message || t('failedLoad')); }
    finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(
    () => filter === 'all' ? gifts : gifts.filter(g => g.subcategory === filter),
    [gifts, filter],
  );
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: gifts.length };
    SUBS.forEach(s => { c[s] = gifts.filter(g => g.subcategory === s).length; });
    return c;
  }, [gifts]);

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
            <GiftIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0F2742]">{t('title')}</h2>
            <p className="text-xs text-gray-500">{t('summaryTpl', { n: gifts.length })}</p>
          </div>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B35] hover:bg-[#e85a23] text-white rounded-lg text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" />{t('add')}
        </button>
      </div>

      {/* Filter pills */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 inline-flex gap-1 flex-wrap">
        <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>
          {t('filterAll')} ({counts.all})
        </FilterPill>
        {SUBS.map(s => (
          <FilterPill key={s} active={filter === s} onClick={() => setFilter(s)}>
            {t(`sub_${s}`)} ({counts[s]})
          </FilterPill>
        ))}
      </div>

      {/* Body */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-[#FF6B35] mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState onAdd={() => { setEditing(null); setShowForm(true); }} t={t} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(g => (
            <GiftCard key={g.service_id} gift={g}
              onEdit={() => { setEditing(g); setShowForm(true); }}
              onDelete={() => setDelFor(g)}
              onCalc={() => setCalcFor(g)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <GiftFormModal
          editing={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); reload(); addToast('success', t('saved')); }}
          onError={(msg) => addToast('error', msg)}
        />
      )}
      {calcFor && <QuoteModal gift={calcFor} onClose={() => setCalcFor(null)} />}
      {delFor && (
        <ConfirmDelete gift={delFor}
          onCancel={() => setDelFor(null)}
          onConfirm={async () => {
            try {
              await giftsApi.delete(delFor.service_id);
              addToast('success', t('deleted'));
              setDelFor(null);
              reload();
            } catch (e: any) { addToast('error', e.message); }
          }}
        />
      )}

      {/* Toasts */}
      <div className="fixed top-5 left-5 space-y-2 z-50">
        {toasts.map(x => (
          <div key={x.id} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium ${
            x.type === 'success' ? 'bg-emerald-600 text-white' :
            x.type === 'error'   ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
          }`}>
            {x.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
             x.type === 'error'   ? <XCircle className="w-4 h-4" /> :
             <AlertTriangle className="w-4 h-4" />}
            {x.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: any }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
        active ? 'bg-[#0F2742] text-white' : 'text-gray-600 hover:bg-gray-50'
      }`}>{children}</button>
  );
}

function GiftCard({ gift, onEdit, onDelete, onCalc }: {
  gift: Gift; onEdit: () => void; onDelete: () => void; onCalc: () => void;
}) {
  const t = useT();
  const meta = SUB_META[gift.subcategory];
  const Icon = meta.Icon;
  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition overflow-hidden">
      {gift.primary_photo && (
        <div className="aspect-[16/7] bg-gray-100 overflow-hidden">
          <img src={gift.primary_photo} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <header className="px-5 pt-4 pb-3 border-b border-gray-50 flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}>
            <Icon className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-[#0F2742] text-sm truncate">{gift.service_name}</h3>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
              <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">{t(`sub_${gift.subcategory}`)}</span>
              {gift.default_is_mandatory ? (
                <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-semibold">{t('mandatoryBadge')}</span>
              ) : (
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-semibold">{t('optionalBadge')}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onCalc} title={t('calc')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
            <Calculator className="w-4 h-4" />
          </button>
          <button onClick={onEdit} title={t('edit')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={onDelete} title={t('delete')} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>
      <div className="p-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wide">{t('price')}</div>
          <div className="text-lg font-bold text-[#0F2742]">{gift.base_price} <span className="text-xs font-normal text-gray-500">{gift.currency}</span></div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gray-500 uppercase tracking-wide">{t('margin')}</div>
          <div className="text-lg font-bold text-[#FF6B35]">{gift.profit_margin_pct}%</div>
        </div>
      </div>
    </article>
  );
}

function GiftFormModal({ editing, onClose, onSaved, onError }: {
  editing: Gift | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const t = useT();
  const isEdit = !!editing;
  const [serviceName, setServiceName] = useState(editing?.service_name || '');
  const [subcategory, setSubcategory] = useState<GiftSubcategory>(editing?.subcategory || 'other');
  const [isMandatory, setIsMandatory] = useState(editing?.default_is_mandatory ?? false);
  const [price, setPrice]     = useState(editing?.base_price || '');
  const [margin, setMargin]   = useState(editing?.profit_margin_pct || '15');
  const [descAr, setDescAr]   = useState(editing?.description_ar || '');
  const [descEn, setDescEn]   = useState(editing?.description_en || '');
  const [notes,  setNotes]    = useState(editing?.notes || '');
  const [photos, setPhotos]   = useState<GiftPhoto[]>(editing?.photos || []);
  const [saving, setSaving]   = useState(false);

  const handleSave = async () => {
    if (price === '' || Number(price) <= 0) { onError(t('needPrice')); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await giftsApi.update(editing!.service_id, {
          subcategory,
          default_is_mandatory: isMandatory,
          base_price: Number(price),
          profit_margin_pct: Number(margin || 15),
          description_ar: descAr,
          description_en: descEn,
          notes,
        });
      } else {
        const cityRes = await apiFetch('/api/v1/locations/cities/?country_code=MY&q=kuala%20lumpur');
        const cityData = cityRes.ok ? await cityRes.json() : [];
        const cityId = (cityData.results ?? cityData ?? [])[0]?.id;
        const svcRes = await apiFetch('/api/v1/services/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: serviceName || `Gift — ${subcategory}`,
            service_type: 'other',
            city: cityId,
            currency: 'MYR',
            is_optional: !isMandatory,
            is_active: true,
          }),
        });
        if (!svcRes.ok) { const err = await svcRes.text(); throw new Error(err); }
        const svc = await svcRes.json();
        await giftsApi.create({
          service: svc.id,
          subcategory,
          default_is_mandatory: isMandatory,
          base_price: Number(price),
          profit_margin_pct: Number(margin || 15),
          description_ar: descAr,
          description_en: descEn,
          notes,
        });
      }
      onSaved();
    } catch (e: any) { onError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <header className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-lg font-bold text-[#0F2742]">{isEdit ? t('formEdit') : t('formNew')}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </header>
        <div className="p-6 space-y-5">
          {!isEdit && (
            <Field label={t('serviceName')}>
              <input value={serviceName} onChange={e => setServiceName(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm"
                placeholder="DiGi 5GB SIM Card / Bouquet Premium..." />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label={t('subcategory')}>
              <select value={subcategory} onChange={e => setSubcategory(e.target.value as GiftSubcategory)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white">
                {SUBS.map(s => <option key={s} value={s}>{t(`sub_${s}`)}</option>)}
              </select>
            </Field>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-gray-50 rounded-lg w-full">
                <input type="checkbox" checked={isMandatory} onChange={e => setIsMandatory(e.target.checked)}
                  className="w-4 h-4 accent-[#FF6B35]" />
                <div>
                  <div className="text-sm font-medium text-[#0F2742]">{t('isMandatory')}</div>
                  <div className="text-[10px] text-gray-500">{t('isMandatoryHint')}</div>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t('price')}>
              <input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" placeholder="0.00" />
            </Field>
            <Field label={t('margin')}>
              <input type="number" step="0.01" min="0" max="100" value={margin} onChange={e => setMargin(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" placeholder="15" />
            </Field>
          </div>

          {/* Photos */}
          <PhotoManagerSection
            serviceId={editing?.service_id}
            photos={photos}
            setPhotos={setPhotos}
            onError={onError}
          />

          {/* Description */}
          <div>
            <h4 className="font-semibold text-[#0F2742] mb-3 text-sm">{t('descTitle')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label={t('descAr')}>
                <textarea value={descAr} onChange={e => setDescAr(e.target.value)} rows={4}
                  dir="rtl" placeholder={t('descArPh')}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" />
              </Field>
              <Field label={t('descEn')}>
                <textarea value={descEn} onChange={e => setDescEn(e.target.value)} rows={4}
                  dir="ltr" placeholder={t('descEnPh')}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" />
              </Field>
            </div>
          </div>

          <Field label={t('notes')}>
            <input value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" />
          </Field>

          <div className="flex gap-2 pt-3 border-t">
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B35] hover:bg-[#e85a23] disabled:opacity-50 text-white rounded-lg text-sm font-medium shadow-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isEdit ? t('save') : t('create')}
            </button>
            <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">{t('cancel')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuoteModal({ gift, onClose }: { gift: Gift; onClose: () => void }) {
  const t = useT();
  const [quantity, setQuantity] = useState(1);
  const [result, setResult] = useState<GiftQuote | null>(null);
  const [error, setError]   = useState('');
  const [calculating, setCalculating] = useState(false);

  const calc = async () => {
    setCalculating(true); setError(''); setResult(null);
    try { setResult(await giftsApi.quote(gift.service_id, quantity)); }
    catch (e: any) { setError(e.message); }
    finally { setCalculating(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <header className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#0F2742] flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" /> {t('quoteTitle')}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </header>
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-500">{gift.service_name} ({t(`sub_${gift.subcategory}`)})</p>

          <Field label={t('quantity')}>
            <input type="number" min={1} max={999} value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" />
          </Field>

          <button onClick={calc} disabled={calculating}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">
            {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
            {t('calculate')}
          </button>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

          {result && (
            <div className="bg-gradient-to-br from-emerald-50 to-pink-50 border border-emerald-200 rounded-lg p-4 space-y-2 text-sm">
              <Row label={t('unitPrice')}>{result.unit_price_myr} MYR</Row>
              <Row label={t('quantity')}>×{result.quantity}</Row>
              <Row label={t('base')}>{result.base_myr} MYR</Row>
              <Row label={t('profit', { pct: result.margin_pct })}>+{result.profit_myr} MYR</Row>
              <hr className="border-emerald-300" />
              <Row label={t('total')} big>
                <span className="text-xl font-bold text-emerald-700">{result.total_myr} {result.currency}</span>
              </Row>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmDelete({ gift, onCancel, onConfirm }: { gift: Gift; onCancel: () => void; onConfirm: () => Promise<void> }) {
  const t = useT();
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-bold text-[#0F2742]">{t('confirmDelete')}</h3>
            <p className="text-sm text-gray-600 mt-2">{t('confirmDeleteMsg', { name: gift.service_name })}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">{t('delete')}</button>
          <button onClick={onCancel} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">{t('cancel')}</button>
        </div>
      </div>
    </div>
  );
}

function PhotoManagerSection({ serviceId, photos, setPhotos, onError }: {
  serviceId: number | undefined;
  photos: GiftPhoto[];
  setPhotos: (p: GiftPhoto[]) => void;
  onError: (msg: string) => void;
}) {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!serviceId) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <ImageIcon className="inline w-4 h-4 me-2" />{t('saveFirstHint')}
      </div>
    );
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;
    setUploading(true);
    const queue = Array.from(files).slice(0, remaining);
    const newPhotos = [...photos];
    for (const f of queue) {
      try { newPhotos.push(await giftsApi.uploadPhoto(serviceId, f)); }
      catch (e: any) { onError(e.message); }
    }
    setPhotos(newPhotos);
    setUploading(false);
  };

  const handleSetPrimary = async (id: number) => {
    try {
      await giftsApi.setPrimaryPhoto(serviceId, id);
      setPhotos(photos.map(p => ({ ...p, is_primary: p.id === id })));
    } catch (e: any) { onError(e.message); }
  };

  const handleDelete = async (id: number) => {
    try {
      await giftsApi.deletePhoto(serviceId, id);
      setPhotos(photos.filter(p => p.id !== id));
    } catch (e: any) { onError(e.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-[#0F2742] text-sm">{t('photosOf', { n: photos.length, max: MAX_PHOTOS })}</h4>
        <button type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || photos.length >= MAX_PHOTOS}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6B35] hover:bg-[#e85a23] disabled:opacity-50 text-white rounded-lg text-xs font-medium">
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          {uploading ? t('uploading') : t('upload')}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple
          onChange={e => handleFiles(e.target.files)} className="hidden" />
      </div>
      {photos.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-400 text-sm">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />{t('noPhotos')}
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
          {photos.map(p => (
            <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
              <img src={p.image} alt="" className="w-full h-full object-cover" />
              {p.is_primary && (
                <span className="absolute top-1 right-1 bg-amber-400 text-white text-[10px] px-1.5 rounded font-bold flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-white" />{t('primary')}
                </span>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                {!p.is_primary && (
                  <button type="button" onClick={() => handleSetPrimary(p.id)} title={t('setPrimary')}
                    className="p-1.5 bg-white/90 hover:bg-amber-400 hover:text-white text-amber-600 rounded transition">
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
                <button type="button" onClick={() => handleDelete(p.id)} title={t('delete')}
                  className="p-1.5 bg-white/90 hover:bg-red-500 hover:text-white text-red-600 rounded transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, children, big }: { label: string; children: any; big?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${big ? 'pt-1' : ''}`}>
      <span className="text-xs text-gray-600">{label}</span>
      <span className="font-medium text-[#0F2742]">{children}</span>
    </div>
  );
}

function EmptyState({ onAdd, t }: { onAdd: () => void; t: (k: string, v?: any) => string }) {
  return (
    <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
      <GiftIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 mb-4">{t('noGifts')}</p>
      <button onClick={onAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg text-sm font-medium">
        <Plus className="w-4 h-4" />{t('addFirst')}
      </button>
    </div>
  );
}
