/**
 * AirportTransfersPanel — لوحة إدارة خدمات النقل من/إلى المطار.
 * تظهر داخل ServicesManagement كقسم منفصل.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PlaneLanding, Plus, Edit, Trash2, X, Loader2, Calculator,
  CheckCircle2, XCircle, AlertTriangle, ChevronDown, Hotel as HotelIcon, MapPin,
  Search, Upload, Star, ImageIcon,
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { apiFetch } from '../../services/apiFetch';
import { CountryCityPicker } from '../../components/forms/CountryCityPicker';
import {
  airportTransfersApi,
  type Airport,
  type AirportTransferRow,
  type QuoteResult,
  type TransferPhoto,
} from '../../services/airportTransfersApi';

// ── Types ─────────────────────────────────────────────────
interface HotelLite { id: number; name: string; city: number; }
interface CityLite  { id: number; name: string; }
type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; type: ToastType; message: string; }
type Lang = 'ar' | 'en' | 'ms';

// ── i18n strings ─────────────────────────────────────────
const T: Record<Lang, Record<string, string>> = {
  ar: {
    title: 'النقل من/إلى المطار',
    summaryTpl: '{n} خدمة منشورة · {m} مطار',
    add: 'إضافة خدمة نقل',
    loading: 'تحميل...',
    noServices: 'لا توجد خدمات نقل من المطار بعد',
    addFirst: 'إضافة أول خدمة',
    saved: 'تم الحفظ', deleted: 'تم الحذف',
    saving: 'جارٍ الحفظ...',
    create: 'إنشاء', save: 'حفظ التعديلات', cancel: 'إلغاء',
    edit: 'تعديل', delete: 'حذف', calc: 'حساب السعر',
    confirmDelete: 'تأكيد الحذف',
    confirmDeleteMsg: 'سيتم حذف خدمة {a} ↔ {b} نهائياً. هذا الإجراء لا يمكن التراجع عنه.',
    formNew: 'إضافة خدمة نقل جديدة',
    formEdit: 'تعديل خدمة نقل',
    serviceName: 'اسم الخدمة (اختياري — يُولَّد تلقائياً إذا تُرك فارغاً)',
    geoTitle: 'الموقع الجغرافي للخدمة',
    country: 'الدولة', city: 'المدينة',
    airport: 'المطار', hotel: 'الفندق',
    chooseAirport: '— اختر مطاراً —', chooseHotel: '— اختر فندقاً —',
    photosTitle: 'الصور',
    photosOf: 'الصور ({n}/{max})',
    upload: 'رفع صورة', uploading: 'يرفع...',
    saveFirstHint: 'احفظ الخدمة أولاً ثم سيمكنك رفع الصور (حد أقصى 7 صور).',
    noPhotos: 'لا توجد صور بعد — اضغط "رفع صورة" لإضافة أول صورة',
    setPrimary: 'تعيين كرئيسية', primary: 'رئيسية',
    descTitle: 'الوصف',
    descAr: 'الوصف بالعربية',
    descEn: 'Description (English)',
    descArPh: 'وصف الخدمة باللغة العربية...',
    descEnPh: 'Service description in English...',
    pricesTitle: 'الأسعار حسب شرائح pax (MYR — اتجاه واحد)',
    paxLbl: 'pax',
    marginTitle: 'نسبة الربح % لكل شريحة (افتراضياً 10%)',
    guideFee: 'رسم مرشد سياحي (MYR)',
    guideMargin: 'نسبة الربح على المرشد %',
    notes: 'ملاحظات',
    quoteTitle: 'حساب السعر',
    paxCount: 'عدد الأشخاص',
    direction: 'الاتجاه',
    dirToHotel: 'مطار → فندق',
    dirToAirport: 'فندق → مطار',
    dirRoundTrip: 'ذهاب وعودة',
    includeGuide: 'تضمين مرشد سياحي (+{fee} MYR)',
    calculate: 'احسب',
    bucket: 'الشريحة',
    baseOneWay: 'السعر الأساسي (اتجاه واحد)',
    dirMult: 'مضاعف الاتجاه',
    base: 'الأساس',
    profit: 'الربح ({pct}%)',
    guideFeeRow: 'رسم المرشد',
    guideProfit: 'ربح على المرشد ({pct}%)',
    total: 'الإجمالي',
    addPriceFirst: 'أدخل سعراً واحداً على الأقل',
    chooseAH: 'اختر مطاراً وفندقاً',
    needLoc: 'اختر دولة ومدينة',
    failedLoad: 'فشل التحميل',
  },
  en: {
    title: 'Airport Transfers',
    summaryTpl: '{n} services published · {m} airports',
    add: 'Add Transfer',
    loading: 'Loading...',
    noServices: 'No airport transfers yet',
    addFirst: 'Add first service',
    saved: 'Saved', deleted: 'Deleted',
    saving: 'Saving...',
    create: 'Create', save: 'Save changes', cancel: 'Cancel',
    edit: 'Edit', delete: 'Delete', calc: 'Calculate price',
    confirmDelete: 'Confirm deletion',
    confirmDeleteMsg: 'Service {a} ↔ {b} will be permanently deleted. This cannot be undone.',
    formNew: 'New transfer service',
    formEdit: 'Edit transfer service',
    serviceName: 'Service name (optional — auto-generated if blank)',
    geoTitle: 'Service availability',
    country: 'Country', city: 'City',
    airport: 'Airport', hotel: 'Hotel',
    chooseAirport: '— select airport —', chooseHotel: '— select hotel —',
    photosTitle: 'Photos',
    photosOf: 'Photos ({n}/{max})',
    upload: 'Upload photo', uploading: 'Uploading...',
    saveFirstHint: 'Save the service first to upload photos (max 7).',
    noPhotos: 'No photos yet — click "Upload photo" to add the first one',
    setPrimary: 'Set as primary', primary: 'Primary',
    descTitle: 'Description',
    descAr: 'Description (Arabic)',
    descEn: 'Description (English)',
    descArPh: 'Service description in Arabic...',
    descEnPh: 'Service description in English...',
    pricesTitle: 'Prices by pax bracket (MYR — one-way)',
    paxLbl: 'pax',
    marginTitle: 'Profit % per bracket (default 10%)',
    guideFee: 'Tour guide fee (MYR)',
    guideMargin: 'Guide profit margin %',
    notes: 'Notes',
    quoteTitle: 'Price calculator',
    paxCount: 'Number of pax',
    direction: 'Direction',
    dirToHotel: 'Airport → Hotel',
    dirToAirport: 'Hotel → Airport',
    dirRoundTrip: 'Round-trip',
    includeGuide: 'Include tour guide (+{fee} MYR)',
    calculate: 'Calculate',
    bucket: 'Bracket',
    baseOneWay: 'Base (one-way)',
    dirMult: 'Direction multiplier',
    base: 'Subtotal',
    profit: 'Profit ({pct}%)',
    guideFeeRow: 'Guide fee',
    guideProfit: 'Guide profit ({pct}%)',
    total: 'Total',
    addPriceFirst: 'Enter at least one price',
    chooseAH: 'Select airport and hotel',
    needLoc: 'Select country and city',
    failedLoad: 'Failed to load',
  },
  ms: {
    title: 'Pemindahan Lapangan Terbang',
    summaryTpl: '{n} perkhidmatan diterbitkan · {m} lapangan terbang',
    add: 'Tambah Pemindahan',
    loading: 'Memuatkan...',
    noServices: 'Tiada pemindahan lapangan terbang lagi',
    addFirst: 'Tambah perkhidmatan pertama',
    saved: 'Disimpan', deleted: 'Dipadam',
    saving: 'Menyimpan...',
    create: 'Cipta', save: 'Simpan perubahan', cancel: 'Batal',
    edit: 'Edit', delete: 'Padam', calc: 'Kira harga',
    confirmDelete: 'Sahkan pemadaman',
    confirmDeleteMsg: 'Perkhidmatan {a} ↔ {b} akan dipadam selamanya. Tindakan ini tidak boleh dibuat asal.',
    formNew: 'Perkhidmatan pemindahan baharu',
    formEdit: 'Edit perkhidmatan pemindahan',
    serviceName: 'Nama perkhidmatan (pilihan)',
    geoTitle: 'Lokasi perkhidmatan',
    country: 'Negara', city: 'Bandar',
    airport: 'Lapangan terbang', hotel: 'Hotel',
    chooseAirport: '— pilih lapangan terbang —', chooseHotel: '— pilih hotel —',
    photosTitle: 'Gambar',
    photosOf: 'Gambar ({n}/{max})',
    upload: 'Muat naik gambar', uploading: 'Memuat naik...',
    saveFirstHint: 'Simpan perkhidmatan dahulu untuk memuat naik gambar (maks 7).',
    noPhotos: 'Belum ada gambar — klik "Muat naik" untuk menambah yang pertama',
    setPrimary: 'Jadikan utama', primary: 'Utama',
    descTitle: 'Penerangan',
    descAr: 'Penerangan (Arab)',
    descEn: 'Description (English)',
    descArPh: 'Penerangan dalam bahasa Arab...',
    descEnPh: 'Description in English...',
    pricesTitle: 'Harga mengikut kategori pax (MYR — sehala)',
    paxLbl: 'pax',
    marginTitle: 'Margin keuntungan % per kategori (lalai 10%)',
    guideFee: 'Yuran pemandu pelancong (MYR)',
    guideMargin: 'Margin keuntungan pemandu %',
    notes: 'Nota',
    quoteTitle: 'Kalkulator harga',
    paxCount: 'Bilangan pax',
    direction: 'Arah',
    dirToHotel: 'Lapangan → Hotel',
    dirToAirport: 'Hotel → Lapangan',
    dirRoundTrip: 'Pergi-balik',
    includeGuide: 'Sertakan pemandu (+{fee} MYR)',
    calculate: 'Kira',
    bucket: 'Kategori',
    baseOneWay: 'Asas (sehala)',
    dirMult: 'Pengganda arah',
    base: 'Jumlah kecil',
    profit: 'Keuntungan ({pct}%)',
    guideFeeRow: 'Yuran pemandu',
    guideProfit: 'Keuntungan pemandu ({pct}%)',
    total: 'Jumlah',
    addPriceFirst: 'Masukkan sekurang-kurangnya satu harga',
    chooseAH: 'Pilih lapangan terbang dan hotel',
    needLoc: 'Pilih negara dan bandar',
    failedLoad: 'Gagal memuatkan',
  },
};

const tt = (lang: Lang, key: string, vars?: Record<string, string | number>): string => {
  let s = (T[lang] || T.en)[key] || (T.en[key] || key);
  if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.replace(`{${k}}`, String(v)); });
  return s;
};

// Hook: returns a translator bound to the current language.
function useT() {
  const { lang } = useLanguage();
  return (key: string, vars?: Record<string, string | number>) => tt(lang as Lang, key, vars);
}

const PAX_FIELDS = [
  { key: 'price_pax_1_2',    label: '1–2',         margin: 'margin_pct_1_2' },
  { key: 'price_pax_3_4',    label: '3–4',         margin: 'margin_pct_3_4' },
  { key: 'price_pax_5_6',    label: '5–6',         margin: 'margin_pct_5_6' },
  { key: 'price_pax_7_8',    label: '7–8',         margin: 'margin_pct_7_8' },
  { key: 'price_pax_10_12',  label: '10–12',       margin: 'margin_pct_10_12' },
  { key: 'price_pax_14',     label: '14',          margin: 'margin_pct_14' },
  { key: 'price_pax_40_bus', label: '40 (Bus)',    margin: 'margin_pct_40_bus' },
] as const;

// ── Component ─────────────────────────────────────────────
export function AirportTransfersPanel() {
  const { isRTL } = useLanguage();
  const t = useT();

  const [airports,    setAirports]    = useState<Airport[]>([]);
  const [hotels,      setHotels]      = useState<HotelLite[]>([]);
  const [cities,      setCities]      = useState<Record<number, CityLite>>({});
  const [transfers,   setTransfers]   = useState<AirportTransferRow[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [toasts,      setToasts]      = useState<Toast[]>([]);

  // Modal state
  const [showForm,    setShowForm]    = useState(false);
  const [editing,     setEditing]     = useState<AirportTransferRow | null>(null);
  const [calcFor,     setCalcFor]     = useState<AirportTransferRow | null>(null);
  const [deleteFor,   setDeleteFor]   = useState<AirportTransferRow | null>(null);

  // ── Toasts ──────────────────────────────────────────────
  const addToast = (type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, type, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  // ── Load all ────────────────────────────────────────────
  const reload = async () => {
    setLoading(true);
    try {
      const [airs, list, hotelsRes] = await Promise.all([
        airportTransfersApi.listAirports(),
        airportTransfersApi.list(),
        apiFetch('/api/v1/hotels/?page_size=200'),
      ]);
      setAirports(airs);
      setTransfers(list);
      const hotelData = hotelsRes.ok ? await hotelsRes.json() : { results: [] };
      const arr: HotelLite[] = (hotelData.results ?? hotelData ?? []).map((h: any) => ({
        id: h.id, name: h.name, city: h.city,
      }));
      setHotels(arr);
    } catch (e: any) {
      addToast('error', e.message || t('failedLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  // إعادة تحميل قائمة المطارات بعد إنشاء مطار جديد من الفورم
  useEffect(() => {
    const handler = async () => {
      try {
        const airs = await airportTransfersApi.listAirports();
        setAirports(airs);
        addToast('success', t('saved'));
      } catch {}
    };
    window.addEventListener('airport-created', handler);
    return () => window.removeEventListener('airport-created', handler);
  }, []);

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <PlaneLanding className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0F2742]">{t("title")}</h2>
            <p className="text-xs text-gray-500">{t("summaryTpl", { n: transfers.length, m: airports.length })}</p>
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

      {/* Body */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35] mx-auto" />
        </div>
      ) : transfers.length === 0 ? (
        <EmptyState onAdd={() => { setEditing(null); setShowForm(true); }} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {transfers.map(t => (
            <TransferCard
              key={t.service_id}
              transfer={t}
              onEdit={() => { setEditing(t); setShowForm(true); }}
              onDelete={() => setDeleteFor(t)}
              onCalc={() => setCalcFor(t)}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <TransferFormModal
          editing={editing}
          airports={airports}
          hotels={hotels}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); reload(); addToast('success', t('saved')); }}
          onError={(msg) => addToast('error', msg)}
        />
      )}

      {/* Calculator Modal */}
      {calcFor && (
        <QuoteModal transfer={calcFor} onClose={() => setCalcFor(null)} />
      )}

      {/* Delete Confirmation */}
      {deleteFor && (
        <ConfirmDelete
          transfer={deleteFor}
          onCancel={() => setDeleteFor(null)}
          onConfirm={async () => {
            try {
              await airportTransfersApi.delete(deleteFor.service_id);
              addToast('success', t('deleted'));
              setDeleteFor(null);
              reload();
            } catch (e: any) {
              addToast('error', e.message);
            }
          }}
        />
      )}

      {/* Toasts */}
      <div className="fixed top-5 left-5 space-y-2 z-50">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
            t.type === 'success' ? 'bg-emerald-600 text-white' :
            t.type === 'error'   ? 'bg-red-600 text-white' :
            'bg-blue-600 text-white'
          }`}>
            {t.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
             t.type === 'error'   ? <XCircle className="w-4 h-4" /> :
             <AlertTriangle className="w-4 h-4" />}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Transfer Card ─────────────────────────────────────────
function TransferCard({ transfer, onEdit, onDelete, onCalc }: {
  transfer: AirportTransferRow;
  onEdit: () => void;
  onDelete: () => void;
  onCalc: () => void;
}) {
  const t = useT();
  const setPrices = PAX_FIELDS.filter(f => transfer[f.key as keyof AirportTransferRow] != null);
  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition overflow-hidden">
      {transfer.primary_photo && (
        <div className="aspect-[16/7] bg-gray-100 overflow-hidden">
          <img src={transfer.primary_photo} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <header className="px-5 pt-4 pb-3 border-b border-gray-50 flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <PlaneLanding className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-[#0F2742] text-sm truncate">
              {transfer.airport_detail.code} ↔ {transfer.hotel_name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1"><HotelIcon className="w-3 h-3" />{transfer.hotel_city}</span>
              {transfer.country_name && (
                <span className="flex items-center gap-1 text-gray-400">
                  <MapPin className="w-3 h-3" />{transfer.city_name || transfer.country_name}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
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
              <div className="text-sm font-bold text-[#0F2742] mt-0.5">
                {String(transfer[f.key as keyof AirportTransferRow])}
              </div>
            </div>
          ))}
        </div>
        {transfer.tour_guide_fee_myr && (
          <p className="text-xs text-gray-500 mt-3">
            🗺️ مرشد سياحي: <b className="text-[#0F2742]">{transfer.tour_guide_fee_myr} MYR</b>
          </p>
        )}
      </div>
    </article>
  );
}

// ── Form Modal ────────────────────────────────────────────
function TransferFormModal({ editing, airports, hotels, onClose, onSaved, onError }: {
  editing: AirportTransferRow | null;
  airports: Airport[];
  hotels: HotelLite[];
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const t = useT();
  const isEdit = !!editing;
  const [serviceName, setServiceName] = useState(editing?.service_name || '');
  const [airportId, setAirportId] = useState<number | ''>(editing?.airport ?? '');
  const [hotelId, setHotelId]     = useState<number | ''>(editing?.hotel ?? '');
  const [prices, setPrices]       = useState<Record<string, string>>(() => {
    const p: Record<string, string> = {};
    PAX_FIELDS.forEach(f => {
      const v = editing?.[f.key as keyof AirportTransferRow];
      p[f.key] = v != null ? String(v) : '';
    });
    return p;
  });
  const [margins, setMargins] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    PAX_FIELDS.forEach(f => {
      const v = editing?.[f.margin as keyof AirportTransferRow];
      m[f.margin] = v != null ? String(v) : '10';
    });
    return m;
  });
  const [guide, setGuide] = useState(editing?.tour_guide_fee_myr || '');
  const [guideMargin, setGuideMargin] = useState(editing?.tour_guide_margin_pct || '10');
  const [notes, setNotes] = useState(editing?.notes || '');
  const [countryId, setCountryId] = useState<number | null>(editing?.country ?? null);
  const [cityId,    setCityId]    = useState<number | null>(editing?.city    ?? null);
  const [countryCode, setCountryCode] = useState<string>(editing?.country_code || '');
  const [descAr,    setDescAr]    = useState(editing?.description_ar || '');
  const [descEn,    setDescEn]    = useState(editing?.description_en || '');
  const [photos,    setPhotos]    = useState<TransferPhoto[]>(editing?.photos || []);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!airportId || !hotelId) {
      onError(t('chooseAH')); return;
    }
    if (!Object.values(prices).some(v => v !== '')) {
      onError(t('addPriceFirst')); return;
    }
    setSaving(true);
    try {
      const numericPrices: any = {};
      PAX_FIELDS.forEach(f => {
        numericPrices[f.key] = prices[f.key] === '' ? null : Number(prices[f.key]);
      });
      const numericMargins: any = {};
      PAX_FIELDS.forEach(f => {
        numericMargins[f.margin] = Number(margins[f.margin] || 10);
      });

      if (isEdit) {
        await airportTransfersApi.update(editing!.service_id, {
          airport: Number(airportId),
          hotel:   Number(hotelId),
          ...numericPrices,
          ...numericMargins,
          tour_guide_fee_myr: guide === '' ? null : Number(guide),
          tour_guide_margin_pct: Number(guideMargin || 10),
          country: countryId,
          city: cityId,
          description_ar: descAr,
          description_en: descEn,
          notes,
        });
      } else {
        // Create Service first via the existing services API, then the AirportTransfer
        const hotel = hotels.find(h => h.id === Number(hotelId));
        const serviceRes = await apiFetch('/api/v1/services/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: serviceName || `${airports.find(a => a.id === Number(airportId))?.code} → ${hotel?.name || 'فندق'}`,
            service_type: 'transport',
            city: hotel?.city,
            currency: 'MYR',
            is_optional: true,
            is_active: true,
          }),
        });
        if (!serviceRes.ok) {
          const err = await serviceRes.text();
          throw new Error(`فشل إنشاء الخدمة: ${err}`);
        }
        const svc = await serviceRes.json();
        await airportTransfersApi.create({
          service: svc.id,
          airport: Number(airportId),
          hotel:   Number(hotelId),
          ...numericPrices,
          ...numericMargins,
          tour_guide_fee_myr: guide === '' ? null : Number(guide),
          tour_guide_margin_pct: Number(guideMargin || 10),
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
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6 space-y-5">
          {!isEdit && (
            <Field label={t("serviceName")}>
              <input value={serviceName} onChange={e => setServiceName(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" placeholder="KLIA → Bukit Bintang" />
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

          {/* 2. المطار + الفندق */}
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("airport")}>
              <AirportPicker
                airports={airports}
                value={airportId}
                onChange={setAirportId}
                onAirportCreated={(a) => {
                  window.dispatchEvent(new CustomEvent('airport-created', { detail: a }));
                }}
              />
            </Field>
            <Field label={t("hotel")}>
              <select value={hotelId} onChange={e => setHotelId(e.target.value ? Number(e.target.value) : '')}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="">{t("chooseHotel")}</option>
                {hotels.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* الصور */}
          <PhotoManagerSection
            serviceId={editing?.service_id}
            photos={photos}
            setPhotos={setPhotos}
            onError={onError}
            api={airportTransfersApi}
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
                  <input type="number" step="0.01"
                    value={prices[f.key]}
                    onChange={e => setPrices(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="—" />
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
                  <input type="number" step="0.01" min="0" max="100"
                    value={margins[f.margin]}
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
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" placeholder="10" />
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
            <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Quote Modal ───────────────────────────────────────────
function QuoteModal({ transfer, onClose }: { transfer: AirportTransferRow; onClose: () => void }) {
  const t = useT();
  const [pax, setPax] = useState(2);
  const [direction, setDirection] = useState<'to_hotel' | 'to_airport' | 'round_trip'>('round_trip');
  const [includeGuide, setIncludeGuide] = useState(false);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [error, setError]   = useState('');
  const [calculating, setCalculating] = useState(false);

  const calc = async () => {
    setCalculating(true); setError(''); setResult(null);
    try {
      const r = await airportTransfersApi.quote(transfer.service_id, {
        pax, direction, include_tour_guide: includeGuide,
      });
      setResult(r);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <header className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#0F2742] flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            {t("quoteTitle")}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </header>
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-500">
            <MapPin className="inline w-3 h-3 me-1" />
            {transfer.airport_detail.code} ↔ {transfer.hotel_name}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("paxCount")}>
              <input type="number" min={1} max={40} value={pax} onChange={e => setPax(Number(e.target.value))}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" />
            </Field>
            <Field label={t("direction")}>
              <select value={direction} onChange={e => setDirection(e.target.value as any)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="to_hotel">{t("dirToHotel")}</option>
                <option value="to_airport">{t("dirToAirport")}</option>
                <option value="round_trip">{t("dirRoundTrip")}</option>
              </select>
            </Field>
          </div>

          {transfer.tour_guide_fee_myr && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={includeGuide} onChange={e => setIncludeGuide(e.target.checked)} />
              {t("includeGuide", { fee: transfer.tour_guide_fee_myr || "" })}
            </label>
          )}

          <button onClick={calc} disabled={calculating}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">
            {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
            {t("calculate")}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-4 space-y-2 text-sm">
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
                <span className="text-xl font-bold text-emerald-700">
                  {result.total_myr} {result.currency}
                </span>
              </Row>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Confirm Delete ────────────────────────────────────────
function ConfirmDelete({ transfer, onCancel, onConfirm }: {
  transfer: AirportTransferRow;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
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
              {t("confirmDeleteMsg", { a: transfer.airport_detail.code, b: transfer.hotel_name })}
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">
            {t("delete")}
          </button>
          <button onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────
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

// ── AirportPicker — combobox مع خيار إضافة مطار جديد ──────
function AirportPicker({ airports, value, onChange, onAirportCreated }: {
  airports: Airport[];
  value: number | '';
  onChange: (v: number | '') => void;
  onAirportCreated: (a: Airport) => void;
}) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // عرض اسم المطار المختار
  const selected = airports.find(a => a.id === value);
  const display = selected ? `${selected.code} — ${selected.name}` : '';

  // فلترة حسب البحث
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return airports;
    return airports.filter(a =>
      a.code.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      (a.city_name || '').toLowerCase().includes(q)
    );
  }, [airports, query]);

  // هل الاسم المكتوب جديد (لا يطابق أي موجود)؟
  const exactMatch = airports.some(a =>
    a.name.toLowerCase() === query.trim().toLowerCase() ||
    a.code.toLowerCase() === query.trim().toLowerCase()
  );
  const canCreate = query.trim().length >= 2 && !exactMatch;

  // إغلاق عند الضغط خارجاً
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCreate = async () => {
    setCreating(true); setError('');
    try {
      const created = await airportTransfersApi.createAirport({ name: query.trim() });
      onAirportCreated(created);
      onChange(created.id);
      setQuery('');
      setOpen(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <div
        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white flex items-center justify-between cursor-text hover:border-[#FF6B35]"
        onClick={() => setOpen(true)}
      >
        {open ? (
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ابحث أو اكتب اسم مطار جديد..."
            className="flex-1 outline-none bg-transparent"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canCreate) {
                e.preventDefault();
                handleCreate();
              }
            }}
          />
        ) : (
          <span className={display ? 'text-gray-900' : 'text-gray-400'}>
            {display || '— اختر مطاراً أو اكتب اسماً جديداً —'}
          </span>
        )}
        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </div>

      {open && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {filtered.length === 0 && !canCreate && (
            <div className="p-3 text-sm text-gray-400 text-center">
              لا توجد نتائج
            </div>
          )}

          {filtered.map(a => (
            <button
              key={a.id}
              type="button"
              onClick={() => { onChange(a.id); setQuery(''); setOpen(false); }}
              className={`w-full text-right px-3 py-2 hover:bg-gray-50 text-sm flex items-center justify-between ${
                a.id === value ? 'bg-orange-50 text-[#FF6B35]' : 'text-gray-700'
              }`}
            >
              <span>{a.name}</span>
              <span className="text-xs text-gray-400 font-mono">{a.code}</span>
            </button>
          ))}

          {canCreate && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="w-full text-right px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-sm text-emerald-700 font-medium border-t border-emerald-200 flex items-center justify-between disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                إضافة مطار جديد: <b>"{query.trim()}"</b>
              </span>
              <span className="text-xs text-emerald-600">Enter ↵</span>
            </button>
          )}

          {error && (
            <div className="px-3 py-2 bg-red-50 text-red-700 text-xs">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── PhotoManagerSection — قابل لإعادة الاستخدام (Airport + Tour) ──
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
      } catch (e: any) {
        onError(e.message);
      }
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
          onChange={e => handleFiles(e.target.files)}
          className="hidden" />
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
  return (
    <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
      <PlaneLanding className="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 mb-4">{t("noServices")}</p>
      <button onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg text-sm font-medium">
        <Plus className="w-4 h-4" />
        {t("addFirst")}
      </button>
    </div>
  );
}
