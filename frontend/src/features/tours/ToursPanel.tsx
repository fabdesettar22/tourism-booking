/**
 * ToursPanel — لوحة إدارة الجولات السياحية والرحلات النهارية والترانسفرات.
 * تظهر داخل ServicesManagement كقسم منفصل (sub-tab).
 */
import { useEffect, useMemo, useState } from 'react';
import {
  MapPin, Plus, Edit, Trash2, X, Loader2, Calculator,
  CheckCircle2, XCircle, AlertTriangle, ChevronDown, Compass, Bus, Ship, Building2,
  Upload, Star, ImageIcon,
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { apiFetch } from '../../services/apiFetch';
import { CountryCityPicker } from '../../components/forms/CountryCityPicker';
import {
  toursApi,
  TOUR_TYPE_LABELS,
  DURATION_LABELS,
  type Tour, type TourQuote, type TourType, type Duration, type TourPhoto,
} from '../../services/toursApi';
import { useRef } from 'react';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; type: ToastType; message: string; }
type Lang = 'ar' | 'en' | 'ms';

// ── i18n strings ─────────────────────────────────────────
const T_STR: Record<Lang, Record<string, string>> = {
  ar: {
    title: 'الجولات السياحية والرحلات النهارية',
    summaryTpl: '{n} جولة منشورة',
    add: 'إضافة جولة',
    loading: 'تحميل...',
    noTours: 'لا توجد جولات بعد',
    addFirst: 'إضافة أول جولة',
    saved: 'تم الحفظ', deleted: 'تم الحذف',
    saving: 'جارٍ الحفظ...',
    create: 'إنشاء', save: 'حفظ', cancel: 'إلغاء',
    edit: 'تعديل', delete: 'حذف', calc: 'حساب السعر',
    confirmDelete: 'تأكيد الحذف',
    confirmDeleteMsg: 'سيتم حذف جولة {dest} نهائياً.',
    formNew: 'إضافة جولة جديدة',
    formEdit: 'تعديل جولة',
    serviceName: 'اسم الخدمة (اختياري)',
    geoTitle: 'الموقع الجغرافي للخدمة',
    country: 'الدولة', city: 'المدينة',
    tourType: 'نوع الجولة', durationLbl: 'المدة',
    origin: 'نقطة الانطلاق', destination: 'الوجهة *',
    photosOf: 'الصور ({n}/{max})',
    upload: 'رفع صورة', uploading: 'يرفع...',
    saveFirstHint: 'احفظ الجولة أولاً ثم سيمكنك رفع الصور (حد أقصى 7 صور).',
    noPhotos: 'لا توجد صور بعد — اضغط "رفع صورة" لإضافة أول صورة',
    setPrimary: 'تعيين كرئيسية', primary: 'رئيسية',
    descTitle: 'الوصف',
    descAr: 'الوصف بالعربية',
    descEn: 'Description (English)',
    descArPh: 'وصف الجولة باللغة العربية...',
    descEnPh: 'Tour description in English...',
    pricesTitle: 'الأسعار حسب شرائح pax (MYR)',
    paxLbl: 'pax',
    marginTitle: 'نسبة الربح % لكل شريحة (افتراضياً 15%)',
    guideFee: 'رسم مرشد سياحي (MYR)',
    guideMargin: 'نسبة الربح على المرشد %',
    notes: 'ملاحظات',
    quoteTitle: 'حساب السعر',
    paxCount: 'عدد الأشخاص',
    direction: 'الاتجاه',
    dirOneWay: 'اتجاه واحد', dirRoundTrip: 'ذهاب وعودة',
    includeGuide: 'تضمين مرشد سياحي (+{fee} MYR)',
    calculate: 'احسب',
    bucket: 'الشريحة',
    baseOneWay: 'السعر الأساسي',
    dirMult: 'مضاعف الاتجاه',
    base: 'الأساس',
    profit: 'الربح ({pct}%)',
    guideFeeRow: 'رسم المرشد',
    guideProfit: 'ربح على المرشد ({pct}%)',
    total: 'الإجمالي',
    addPriceFirst: 'أدخل سعراً واحداً على الأقل',
    needDest: 'أدخل الوجهة',
    failedLoad: 'فشل التحميل',
    filterAll: 'الكل',
    // tour type labels
    type_city_tour: 'جولة مدينة',
    type_day_trip: 'رحلة نهارية',
    type_inter_city: 'نقل بين المدن',
    type_island_jetty: 'نقل إلى الجزر',
  },
  en: {
    title: 'Tours & Day Trips',
    summaryTpl: '{n} tours published',
    add: 'Add Tour',
    loading: 'Loading...',
    noTours: 'No tours yet',
    addFirst: 'Add first tour',
    saved: 'Saved', deleted: 'Deleted',
    saving: 'Saving...',
    create: 'Create', save: 'Save', cancel: 'Cancel',
    edit: 'Edit', delete: 'Delete', calc: 'Calculate price',
    confirmDelete: 'Confirm deletion',
    confirmDeleteMsg: 'Tour {dest} will be permanently deleted.',
    formNew: 'New tour',
    formEdit: 'Edit tour',
    serviceName: 'Service name (optional)',
    geoTitle: 'Service availability',
    country: 'Country', city: 'City',
    tourType: 'Tour type', durationLbl: 'Duration',
    origin: 'Origin', destination: 'Destination *',
    photosOf: 'Photos ({n}/{max})',
    upload: 'Upload photo', uploading: 'Uploading...',
    saveFirstHint: 'Save the tour first to upload photos (max 7).',
    noPhotos: 'No photos yet — click "Upload" to add the first one',
    setPrimary: 'Set as primary', primary: 'Primary',
    descTitle: 'Description',
    descAr: 'Description (Arabic)',
    descEn: 'Description (English)',
    descArPh: 'Tour description in Arabic...',
    descEnPh: 'Tour description in English...',
    pricesTitle: 'Prices by pax bracket (MYR)',
    paxLbl: 'pax',
    marginTitle: 'Profit % per bracket (default 15%)',
    guideFee: 'Tour guide fee (MYR)',
    guideMargin: 'Guide profit margin %',
    notes: 'Notes',
    quoteTitle: 'Price calculator',
    paxCount: 'Number of pax',
    direction: 'Direction',
    dirOneWay: 'One way', dirRoundTrip: 'Round-trip',
    includeGuide: 'Include tour guide (+{fee} MYR)',
    calculate: 'Calculate',
    bucket: 'Bracket',
    baseOneWay: 'Base',
    dirMult: 'Direction multiplier',
    base: 'Subtotal',
    profit: 'Profit ({pct}%)',
    guideFeeRow: 'Guide fee',
    guideProfit: 'Guide profit ({pct}%)',
    total: 'Total',
    addPriceFirst: 'Enter at least one price',
    needDest: 'Enter destination',
    failedLoad: 'Failed to load',
    filterAll: 'All',
    type_city_tour: 'City Tour',
    type_day_trip: 'Day Trip',
    type_inter_city: 'Inter-city Transfer',
    type_island_jetty: 'Island Jetty',
  },
  ms: {
    title: 'Lawatan & Perjalanan Sehari',
    summaryTpl: '{n} lawatan diterbitkan',
    add: 'Tambah Lawatan',
    loading: 'Memuatkan...',
    noTours: 'Belum ada lawatan',
    addFirst: 'Tambah lawatan pertama',
    saved: 'Disimpan', deleted: 'Dipadam',
    saving: 'Menyimpan...',
    create: 'Cipta', save: 'Simpan', cancel: 'Batal',
    edit: 'Edit', delete: 'Padam', calc: 'Kira harga',
    confirmDelete: 'Sahkan pemadaman',
    confirmDeleteMsg: 'Lawatan {dest} akan dipadam selamanya.',
    formNew: 'Lawatan baharu',
    formEdit: 'Edit lawatan',
    serviceName: 'Nama perkhidmatan (pilihan)',
    geoTitle: 'Lokasi perkhidmatan',
    country: 'Negara', city: 'Bandar',
    tourType: 'Jenis lawatan', durationLbl: 'Tempoh',
    origin: 'Permulaan', destination: 'Destinasi *',
    photosOf: 'Gambar ({n}/{max})',
    upload: 'Muat naik gambar', uploading: 'Memuat naik...',
    saveFirstHint: 'Simpan lawatan dahulu untuk memuat naik gambar (maks 7).',
    noPhotos: 'Belum ada gambar — klik "Muat naik" untuk menambah yang pertama',
    setPrimary: 'Jadikan utama', primary: 'Utama',
    descTitle: 'Penerangan',
    descAr: 'Penerangan (Arab)',
    descEn: 'Description (English)',
    descArPh: 'Penerangan dalam bahasa Arab...',
    descEnPh: 'Description in English...',
    pricesTitle: 'Harga mengikut kategori pax (MYR)',
    paxLbl: 'pax',
    marginTitle: 'Margin keuntungan % per kategori (lalai 15%)',
    guideFee: 'Yuran pemandu pelancong (MYR)',
    guideMargin: 'Margin keuntungan pemandu %',
    notes: 'Nota',
    quoteTitle: 'Kalkulator harga',
    paxCount: 'Bilangan pax',
    direction: 'Arah',
    dirOneWay: 'Sehala', dirRoundTrip: 'Pergi-balik',
    includeGuide: 'Sertakan pemandu (+{fee} MYR)',
    calculate: 'Kira',
    bucket: 'Kategori',
    baseOneWay: 'Asas',
    dirMult: 'Pengganda arah',
    base: 'Jumlah kecil',
    profit: 'Keuntungan ({pct}%)',
    guideFeeRow: 'Yuran pemandu',
    guideProfit: 'Keuntungan pemandu ({pct}%)',
    total: 'Jumlah',
    addPriceFirst: 'Masukkan sekurang-kurangnya satu harga',
    needDest: 'Masukkan destinasi',
    failedLoad: 'Gagal memuatkan',
    filterAll: 'Semua',
    type_city_tour: 'Lawatan Bandar',
    type_day_trip: 'Perjalanan Sehari',
    type_inter_city: 'Pemindahan Antara Bandar',
    type_island_jetty: 'Jeti Pulau',
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

const PAX_FIELDS = [
  { key: 'price_pax_1_2',    label: '1–2',      margin: 'margin_pct_1_2' },
  { key: 'price_pax_3_4',    label: '3–4',      margin: 'margin_pct_3_4' },
  { key: 'price_pax_5_6',    label: '5–6',      margin: 'margin_pct_5_6' },
  { key: 'price_pax_7_8',    label: '7–8',      margin: 'margin_pct_7_8' },
  { key: 'price_pax_10_12',  label: '10–12',    margin: 'margin_pct_10_12' },
  { key: 'price_pax_14',     label: '14',       margin: 'margin_pct_14' },
  { key: 'price_pax_40_bus', label: '40 (Bus)', margin: 'margin_pct_40_bus' },
] as const;

const TYPE_ICONS: Record<TourType, any> = {
  city_tour:    Building2,
  day_trip:     Compass,
  inter_city:   Bus,
  island_jetty: Ship,
};

const TYPE_COLORS: Record<TourType, string> = {
  city_tour:    'bg-purple-50 text-purple-600',
  day_trip:     'bg-emerald-50 text-emerald-600',
  inter_city:   'bg-blue-50 text-blue-600',
  island_jetty: 'bg-cyan-50 text-cyan-600',
};

export function ToursPanel() {
  const { isRTL } = useLanguage();
  const t = useT();
  const [tours,    setTours]    = useState<Tour[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<TourType | 'all'>('all');
  const [toasts,   setToasts]   = useState<Toast[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<Tour | null>(null);
  const [calcFor,  setCalcFor]  = useState<Tour | null>(null);
  const [delFor,   setDelFor]   = useState<Tour | null>(null);

  const addToast = (type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 4000);
  };

  const reload = async () => {
    setLoading(true);
    try { setTours(await toursApi.list()); }
    catch (e: any) { addToast('error', e.message || t('failedLoad')); }
    finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(
    () => filter === 'all' ? tours : tours.filter(t => t.tour_type === filter),
    [tours, filter],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tours.length };
    (Object.keys(TOUR_TYPE_LABELS) as TourType[]).forEach(k => {
      c[k] = tours.filter(t => t.tour_type === k).length;
    });
    return c;
  }, [tours]);

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0F2742]">{t("title")}</h2>
            <p className="text-xs text-gray-500">{t("summaryTpl", { n: tours.length })}</p>
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B35] hover:bg-[#e85a23] text-white rounded-lg text-sm font-medium transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t("add")}
        </button>
      </div>

      {/* Type filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 inline-flex gap-1 flex-wrap">
        <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>
          {t("filterAll")} ({counts.all})
        </FilterPill>
        {(Object.keys(TOUR_TYPE_LABELS) as TourType[]).map(tourType => (
          <FilterPill key={tourType} active={filter === tourType} onClick={() => setFilter(tourType)}>
            {TOUR_TYPE_LABELS[tourType]} ({counts[tourType]})
          </FilterPill>
        ))}
      </div>

      {/* Body */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35] mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onAdd={() => { setEditing(null); setShowForm(true); }} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(tour => (
            <TourCard
              key={tour.service_id}
              tour={tour}
              onEdit={() => { setEditing(tour); setShowForm(true); }}
              onDelete={() => setDelFor(tour)}
              onCalc={() => setCalcFor(tour)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <TourFormModal
          editing={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); reload(); addToast('success', t('saved')); }}
          onError={(msg) => addToast('error', msg)}
        />
      )}
      {calcFor && <QuoteModal tour={calcFor} onClose={() => setCalcFor(null)} />}
      {delFor && (
        <ConfirmDelete
          tour={delFor}
          onCancel={() => setDelFor(null)}
          onConfirm={async () => {
            try {
              await toursApi.delete(delFor.service_id);
              addToast('success', t('deleted'));
              setDelFor(null);
              reload();
            } catch (e: any) { addToast('error', e.message || t('failedLoad')); }
          }}
        />
      )}

      <div className="fixed top-5 left-5 space-y-2 z-50">
        {toasts.map(toast => (
          <div key={toast.id} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' :
            toast.type === 'error'   ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
             toast.type === 'error'   ? <XCircle className="w-4 h-4" /> :
             <AlertTriangle className="w-4 h-4" />}
            {toast.message}
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

function TourCard({ tour, onEdit, onDelete, onCalc }: {
  tour: Tour; onEdit: () => void; onDelete: () => void; onCalc: () => void;
}) {
  const t = useT();
  const Icon = TYPE_ICONS[tour.tour_type];
  const setPrices = PAX_FIELDS.filter(f => tour[f.key as keyof Tour] != null);
  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition overflow-hidden">
      {tour.primary_photo && (
        <div className="aspect-[16/7] bg-gray-100 overflow-hidden">
          <img src={tour.primary_photo} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <header className="px-5 pt-4 pb-3 border-b border-gray-50 flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[tour.tour_type]}`}>
            <Icon className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-[#0F2742] text-sm truncate">{tour.destination_text}</h3>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{tour.origin_text || tour.origin_city_name || '—'}</span>
              <span className="text-gray-300">·</span>
              <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">{tour.tour_type_display}</span>
              <span className="text-[10px] text-gray-400">{tour.duration_display}</span>
              {tour.country_name && (
                <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />{tour.city_name || tour.country_name}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onCalc} title={t("calc")} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
            <Calculator className="w-4 h-4" />
          </button>
          <button onClick={onEdit} title={t("edit")} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={onDelete} title={t("delete")} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>
      <div className="p-4">
        <div className="grid grid-cols-4 gap-2">
          {setPrices.map(f => (
            <div key={f.key} className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">{f.label}</div>
              <div className="text-sm font-bold text-[#0F2742] mt-0.5">{String(tour[f.key as keyof Tour])}</div>
            </div>
          ))}
        </div>
        {tour.tour_guide_fee_myr && (
          <p className="text-xs text-gray-500 mt-3">
            🗺️ مرشد سياحي: <b className="text-[#0F2742]">{tour.tour_guide_fee_myr} MYR</b>
          </p>
        )}
      </div>
    </article>
  );
}

function TourFormModal({ editing, onClose, onSaved, onError }: {
  editing: Tour | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const t = useT();
  const isEdit = !!editing;
  const [serviceName, setServiceName] = useState(editing?.service_name || '');
  const [tourType, setTourType]       = useState<TourType>(editing?.tour_type || 'day_trip');
  const [duration, setDuration]       = useState<Duration>(editing?.duration || 'full_day');
  const [originText,      setOriginText]      = useState(editing?.origin_text || '');
  const [destinationText, setDestinationText] = useState(editing?.destination_text || '');
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const p: Record<string, string> = {};
    PAX_FIELDS.forEach(f => {
      const v = editing?.[f.key as keyof Tour];
      p[f.key] = v != null ? String(v) : '';
    });
    return p;
  });
  const [margins, setMargins] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    PAX_FIELDS.forEach(f => {
      const v = editing?.[f.margin as keyof Tour];
      m[f.margin] = v != null ? String(v) : '15';
    });
    return m;
  });
  const [guide, setGuide] = useState(editing?.tour_guide_fee_myr || '');
  const [guideMargin, setGuideMargin] = useState(editing?.tour_guide_margin_pct || '15');
  const [notes, setNotes] = useState(editing?.notes || '');
  const [countryId, setCountryId] = useState<number | null>(editing?.country ?? null);
  const [cityId,    setCityId]    = useState<number | null>(editing?.city    ?? null);
  const [countryCode, setCountryCode] = useState<string>(editing?.country_code || '');
  const [descAr,    setDescAr]    = useState(editing?.description_ar || '');
  const [descEn,    setDescEn]    = useState(editing?.description_en || '');
  const [photos,    setPhotos]    = useState<TourPhoto[]>(editing?.photos || []);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!destinationText.trim()) { onError(t('needDest')); return; }
    if (!Object.values(prices).some(v => v !== '')) { onError(t('addPriceFirst')); return; }
    setSaving(true);
    try {
      const numericPrices: any = {};
      PAX_FIELDS.forEach(f => {
        numericPrices[f.key] = prices[f.key] === '' ? null : Number(prices[f.key]);
      });
      const numericMargins: any = {};
      PAX_FIELDS.forEach(f => {
        numericMargins[f.margin] = Number(margins[f.margin] || 15);
      });

      if (isEdit) {
        await toursApi.update(editing!.service_id, {
          tour_type: tourType, duration,
          origin_text: originText, destination_text: destinationText,
          ...numericPrices, ...numericMargins,
          tour_guide_fee_myr: guide === '' ? null : Number(guide),
          tour_guide_margin_pct: Number(guideMargin || 15),
          country: countryId,
          city: cityId,
          description_ar: descAr,
          description_en: descEn,
          notes,
        });
      } else {
        const fallbackName = serviceName || `${originText || ''} → ${destinationText}`;
        // ننشئ Service أولاً (نحتاج city)
        const cityRes = await apiFetch('/api/v1/locations/cities/?country_code=MY&q=kuala%20lumpur');
        const cityData = cityRes.ok ? await cityRes.json() : [];
        const cityId = (cityData.results ?? cityData ?? [])[0]?.id;
        const svcRes = await apiFetch('/api/v1/services/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fallbackName,
            service_type: 'tour',
            city: cityId,
            currency: 'MYR',
            is_optional: true,
            is_active: true,
          }),
        });
        if (!svcRes.ok) { const err = await svcRes.text(); throw new Error(`فشل إنشاء الخدمة: ${err}`); }
        const svc = await svcRes.json();
        await toursApi.create({
          service: svc.id,
          tour_type: tourType, duration,
          origin_text: originText, destination_text: destinationText,
          ...numericPrices, ...numericMargins,
          tour_guide_fee_myr: guide === '' ? null : Number(guide),
          tour_guide_margin_pct: Number(guideMargin || 15),
          country: countryId,
          city: cityId,
          description_ar: descAr,
          description_en: descEn,
          notes,
        });
      }
      onSaved();
    } catch (e: any) {
      onError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <header className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-lg font-bold text-[#0F2742]">
            {isEdit ? t('formEdit') : t('formNew')}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </header>
        <div className="p-6 space-y-5">
          {!isEdit && (
            <Field label={t("serviceName")}>
              <input value={serviceName} onChange={e => setServiceName(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" placeholder="KL City Tour Full Day" />
            </Field>
          )}

          {/* 1. الدولة + المدينة (أولاً) */}
          <div>
            <h4 className="font-semibold text-[#0F2742] mb-3 text-sm">{t("geoTitle")}</h4>
            <CountryCityPicker
              countryCode={countryCode}
              initialCountryId={countryId ?? undefined}
              initialCityId={cityId ?? undefined}
              onCountryChange={(iso2, c) => {
                setCountryCode(iso2);
                setCountryId(c?.id ?? null);
                setCityId(null);
              }}
              onCityChange={(_name, c) => setCityId(c?.id ?? null)}
              countryLabel={t("country")}
              cityLabel={t("city")}
            />
          </div>

          {/* 2. نوع الجولة + المدة */}
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("tourType")}>
              <select value={tourType} onChange={e => setTourType(e.target.value as TourType)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white">
                {(Object.keys(TOUR_TYPE_LABELS) as TourType[]).map(t => (
                  <option key={t} value={t}>{TOUR_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </Field>
            <Field label={t("durationLbl")}>
              <select value={duration} onChange={e => setDuration(e.target.value as Duration)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white">
                {(Object.keys(DURATION_LABELS) as Duration[]).map(d => (
                  <option key={d} value={d}>{DURATION_LABELS[d]}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* 3. الانطلاق + الوجهة */}
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("origin")}>
              <input value={originText} onChange={e => setOriginText(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" placeholder="Bukit Bintang، Penang Hotels..." />
            </Field>
            <Field label={t("destination")}>
              <input value={destinationText} onChange={e => setDestinationText(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" placeholder="Sunway Lagoon، Cameron..." />
            </Field>
          </div>

          {/* الصور */}
          <PhotoManagerSection
            serviceId={editing?.service_id}
            photos={photos}
            setPhotos={setPhotos}
            onError={onError}
            api={toursApi}
          />

          {/* الوصف */}
          <div>
            <h4 className="font-semibold text-[#0F2742] mb-3 text-sm">{t("descTitle")}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label={t("descAr")}>
                <textarea value={descAr} onChange={e => setDescAr(e.target.value)} rows={4}
                  dir="rtl" placeholder={t("descArPh")}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" />
              </Field>
              <Field label={t("descEn")}>
                <textarea value={descEn} onChange={e => setDescEn(e.target.value)} rows={4}
                  dir="ltr" placeholder={t("descEnPh")}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" />
              </Field>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-[#0F2742] mb-3 text-sm">{t("pricesTitle")}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PAX_FIELDS.map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label} pax</label>
                  <input type="number" step="0.01" value={prices[f.key]}
                    onChange={e => setPrices(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="—" />
                </div>
              ))}
            </div>
          </div>

          <details className="border border-gray-200 rounded-lg p-3">
            <summary className="cursor-pointer text-sm font-semibold text-[#0F2742] flex items-center gap-2">
              <ChevronDown className="w-4 h-4" /> {t("marginTitle")}
            </summary>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              {PAX_FIELDS.map(f => (
                <div key={f.margin}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label} %</label>
                  <input type="number" step="0.01" min="0" max="100" value={margins[f.margin]}
                    onChange={e => setMargins(m => ({ ...m, [f.margin]: e.target.value }))}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              ))}
            </div>
          </details>

          <div className="grid grid-cols-3 gap-4">
            <Field label={t("guideFee")}>
              <input type="number" step="0.01" value={guide} onChange={e => setGuide(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" placeholder="—" />
            </Field>
            <Field label={t("guideMargin")}>
              <input type="number" step="0.01" min="0" max="100" value={guideMargin} onChange={e => setGuideMargin(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" placeholder="15" />
            </Field>
            <Field label={t("notes")}>
              <input value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" />
            </Field>
          </div>

          <div className="flex gap-2 pt-3 border-t">
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B35] hover:bg-[#e85a23] disabled:opacity-50 text-white rounded-lg text-sm font-medium shadow-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isEdit ? t('save') : t('create')}
            </button>
            <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">{t("cancel")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuoteModal({ tour, onClose }: { tour: Tour; onClose: () => void }) {
  const t = useT();
  const [pax, setPax] = useState(2);
  const [direction, setDirection] = useState<'one_way' | 'round_trip'>(
    tour.duration === 'full_day' || tour.duration === 'half_day' ? 'one_way' : 'one_way'
  );
  const [includeGuide, setIncludeGuide] = useState(false);
  const [result, setResult] = useState<TourQuote | null>(null);
  const [error, setError]   = useState('');
  const [calculating, setCalculating] = useState(false);

  const allowRoundTrip = tour.duration === 'one_way';

  const calc = async () => {
    setCalculating(true); setError(''); setResult(null);
    try {
      const r = await toursApi.quote(tour.service_id, { pax, direction, include_tour_guide: includeGuide });
      setResult(r);
    } catch (e: any) { setError(e.message); }
    finally { setCalculating(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <header className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#0F2742] flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" /> {t("quoteTitle")}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </header>
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-500">
            <MapPin className="inline w-3 h-3 me-1" />
            {tour.origin_text || tour.origin_city_name || '—'} → {tour.destination_text} · {tour.duration_display}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("paxCount")}>
              <input type="number" min={1} max={40} value={pax} onChange={e => setPax(Number(e.target.value))}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" />
            </Field>
            <Field label={t("direction")}>
              <select value={direction} onChange={e => setDirection(e.target.value as any)}
                disabled={!allowRoundTrip}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white disabled:bg-gray-50">
                <option value="one_way">{t("dirOneWay")}</option>
                {allowRoundTrip && <option value="round_trip">{t("dirRoundTrip")}</option>}
              </select>
            </Field>
          </div>

          {tour.tour_guide_fee_myr && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={includeGuide} onChange={e => setIncludeGuide(e.target.checked)} />
              {t("includeGuide", { fee: tour.tour_guide_fee_myr || "" })}
            </label>
          )}

          <button onClick={calc} disabled={calculating}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">
            {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
            {t("calculate")}
          </button>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

          {result && (
            <div className="bg-gradient-to-br from-emerald-50 to-purple-50 border border-emerald-200 rounded-lg p-4 space-y-2 text-sm">
              <Row label={t("bucket")}>{result.bucket} pax</Row>
              <Row label={t("baseOneWay")}>{result.base_one_way_myr} MYR</Row>
              <Row label={t("dirMult")}>×{result.direction_multiplier}</Row>
              <Row label={t("base")}>{result.base_myr} MYR</Row>
              <Row label={t("profit", { pct: result.margin_pct })}>+{result.profit_myr} MYR</Row>
              {Number(result.tour_guide_myr) > 0 && (
                <>
                  <Row label={t("guideFeeRow")}>+{result.tour_guide_myr} MYR</Row>
                  <Row label={t("guideProfit", { pct: result.guide_margin_pct })}>+{result.guide_profit_myr} MYR</Row>
                </>
              )}
              <hr className="border-emerald-300" />
              <Row label={t("total")} big>
                <span className="text-xl font-bold text-emerald-700">{result.total_myr} {result.currency}</span>
              </Row>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmDelete({ tour, onCancel, onConfirm }: { tour: Tour; onCancel: () => void; onConfirm: () => Promise<void> }) {
  const t = useT();
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-bold text-[#0F2742]">{t("confirmDelete")}</h3>
            <p className="text-sm text-gray-600 mt-2">
              {t("confirmDeleteMsg", { dest: tour.destination_text })}
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">{t("delete")}</button>
          <button onClick={onCancel} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">{t("cancel")}</button>
        </div>
      </div>
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

// ── PhotoManagerSection ─────────────────────────────────
const MAX_PHOTOS = 7;

function PhotoManagerSection({ serviceId, photos, setPhotos, onError, api }: {
  serviceId: number | undefined;
  photos: any[];
  setPhotos: (p: any[]) => void;
  onError: (msg: string) => void;
  api: any;
}) {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!serviceId) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <ImageIcon className="inline w-4 h-4 me-2" />
        {t("saveFirstHint")}
      </div>
    );
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      onError(`الحد الأقصى ${MAX_PHOTOS} صور`);
      return;
    }
    setUploading(true);
    const queue = Array.from(files).slice(0, remaining);
    const newPhotos = [...photos];
    for (const f of queue) {
      try {
        const photo = await api.uploadPhoto(serviceId, f);
        newPhotos.push(photo);
      } catch (e: any) { onError(e.message); }
    }
    setPhotos(newPhotos);
    setUploading(false);
  };

  const handleSetPrimary = async (photoId: number) => {
    try {
      await api.setPrimaryPhoto(serviceId, photoId);
      setPhotos(photos.map(p => ({ ...p, is_primary: p.id === photoId })));
    } catch (e: any) { onError(e.message); }
  };

  const handleDelete = async (photoId: number) => {
    try {
      await api.deletePhoto(serviceId, photoId);
      setPhotos(photos.filter(p => p.id !== photoId));
    } catch (e: any) { onError(e.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-[#0F2742] text-sm">{t("photosOf", { n: photos.length, max: MAX_PHOTOS })}</h4>
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
          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          {t("noPhotos")}
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
          {photos.map(p => (
            <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
              <img src={p.image} alt="" className="w-full h-full object-cover" />
              {p.is_primary && (
                <span className="absolute top-1 right-1 bg-amber-400 text-white text-[10px] px-1.5 rounded font-bold flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-white" />{t("primary")}
                </span>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                {!p.is_primary && (
                  <button type="button" onClick={() => handleSetPrimary(p.id)}
                    title={t("setPrimary")}
                    className="p-1.5 bg-white/90 hover:bg-amber-400 hover:text-white text-amber-600 rounded transition">
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
                <button type="button" onClick={() => handleDelete(p.id)}
                  title={t("delete")}
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

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const t = useT();
  return (
    <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
      <Compass className="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 mb-4">{t("noTours")}</p>
      <button onClick={onAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg text-sm font-medium">
        <Plus className="w-4 h-4" /> {t("addFirst")}
      </button>
    </div>
  );
}
