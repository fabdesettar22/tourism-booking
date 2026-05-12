import { useEffect, useState } from 'react';
import {
  Building2, Image as ImageIcon, BedDouble, Layers, Users as UsersIcon, Calendar,
  Plus, Trash2, Star, X, Loader2, Save, Upload, Baby, ChevronRight, ChevronLeft, Check, Eye, Coffee, Receipt, ChevronDown,
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { apiFetch, BASE } from '../../services/apiFetch';
import { CountryCityPicker } from '../../components/forms/CountryCityPicker';
import { hotelRatesApi } from '../../services/hotelRatesApi';

// ─── i18n ─────────────────────────────────────────────────
const T = {
  ar: {
    title: 'إضافة / تعديل فندق',
    step1: 'المعلومات الأساسية',
    step2: 'الطبقات والمواسم',
    step3: 'الغرف والأسعار',
    next: 'التالي', prev: 'السابق', save: 'حفظ', saving: 'جاري الحفظ…', cancel: 'إلغاء',
    name: 'اسم الفندق', stars: 'عدد النجوم', countryCity: 'الدولة - المدينة', address: 'العنوان',
    descAr: 'وصف الفندق بالعربية', descEn: 'وصف الفندق بالإنجليزية',
    photos: 'صور الفندق', addPhoto: 'إضافة صورة', primary: 'رئيسية', setPrimary: 'اجعلها رئيسية',
    pricingTiers: 'طبقات التسعير',
    tierName: 'اسم الطبقة', tierMin: 'تبدأ من غرف', tierMax: 'تنتهي عند غرف', tierMargin: 'نسبة العمولة %',
    addTier: 'إضافة طبقة',
    seasons: 'المواسم',
    seasonName: 'اسم الموسم', seasonStart: 'بداية الموسم', seasonEnd: 'نهاية الموسم',
    addSeason: 'إضافة موسم',
    tax: 'الضريبة لليلة الواحدة للغرفة',
    rooms: 'الغرف',
    addRoom: 'إضافة نوع غرفة',
    roomName: 'اسم نوع الغرفة', roomQty: 'كمية النوع', pax: 'الإشغال',
    maxExtraBeds: 'أسرّة إضافية', maxChildBeds: 'أسرّة أطفال',
    views: 'الإطلالات', addView: 'إضافة إطلالة',
    viewName: 'الإطلالة', viewCount: 'عدد الغرف',
    rates: 'الأسعار',
    weekdayRate: 'السعر العادي', weekendRate: 'السعر العطلة',
    bfIncluded: 'الفطور مشمول', bfPrice: 'سعر الفطور',
    extraBed: 'سرير إضافي', infant: 'الرضيع',
    childWithBed: 'طفل بسرير', childNoBed: 'طفل بدون سرير',
    childBreakfast: 'فطور الطفل',
    ageFrom: 'من', ageTo: 'إلى',
    price: 'السعر',
    nameRequired: 'الرجاء إدخال اسم الفندق',
    cityRequired: 'الرجاء اختيار المدينة',
    tierNameReq: 'كل طبقة تحتاج اسم',
    seasonReq: 'كل موسم يحتاج اسم وتواريخ',
    noTiers: 'أضف طبقة واحدة على الأقل',
    noSeasons: 'أضف موسم واحد على الأقل',
    saveOk: 'تم الحفظ', saveFail: 'فشل الحفظ',
    currency: 'MYR',
    season: 'الموسم', tier: 'الطبقة',
    rooms_short: 'الغرف', view_short: 'الإطلالة',
  },
  en: {
    title: 'Add / Edit Hotel',
    step1: 'Basic Information',
    step2: 'Tiers & Seasons',
    step3: 'Rooms & Pricing',
    next: 'Next', prev: 'Previous', save: 'Save', saving: 'Saving…', cancel: 'Cancel',
    name: 'Hotel Name', stars: 'Stars', countryCity: 'Country - City', address: 'Address',
    descAr: 'Description (Arabic)', descEn: 'Description (English)',
    photos: 'Photos', addPhoto: 'Add Photo', primary: 'Primary', setPrimary: 'Set as primary',
    pricingTiers: 'Pricing Tiers',
    tierName: 'Tier Name', tierMin: 'From rooms', tierMax: 'To rooms', tierMargin: 'Commission %',
    addTier: 'Add Tier',
    seasons: 'Seasons',
    seasonName: 'Season Name', seasonStart: 'Start', seasonEnd: 'End',
    addSeason: 'Add Season',
    tax: 'Tax per Night per Room',
    rooms: 'Rooms',
    addRoom: 'Add Room Type',
    roomName: 'Room Name', roomQty: 'Qty', pax: 'Capacity',
    maxExtraBeds: 'Extra beds', maxChildBeds: 'Child beds',
    views: 'Views', addView: 'Add View',
    viewName: 'View', viewCount: 'Rooms',
    rates: 'Rates',
    weekdayRate: 'Weekday', weekendRate: 'Weekend',
    bfIncluded: 'Breakfast included', bfPrice: 'BF price',
    extraBed: 'Extra bed', infant: 'Infant',
    childWithBed: 'Child w/bed', childNoBed: 'Child no bed',
    childBreakfast: 'Child breakfast',
    ageFrom: 'From', ageTo: 'To',
    price: 'Price',
    nameRequired: 'Hotel name required',
    cityRequired: 'City required',
    tierNameReq: 'Each tier needs a name',
    seasonReq: 'Each season needs name + dates',
    noTiers: 'Add at least one tier',
    noSeasons: 'Add at least one season',
    saveOk: 'Saved', saveFail: 'Save failed',
    currency: 'MYR',
    season: 'Season', tier: 'Tier',
    rooms_short: 'Rooms', view_short: 'View',
  },
  ms: {
    title: 'Tambah / Edit Hotel',
    step1: 'Maklumat Asas', step2: 'Lapisan & Musim', step3: 'Bilik & Harga',
    next: 'Seterusnya', prev: 'Kembali', save: 'Simpan', saving: 'Menyimpan…', cancel: 'Batal',
    name: 'Nama', stars: 'Bintang', countryCity: 'Negara - Bandar', address: 'Alamat',
    descAr: 'Penerangan (Arab)', descEn: 'Penerangan (Inggeris)',
    photos: 'Foto', addPhoto: 'Tambah Foto', primary: 'Utama', setPrimary: 'Tetap utama',
    pricingTiers: 'Lapisan Harga',
    tierName: 'Nama', tierMin: 'Dari bilik', tierMax: 'Hingga bilik', tierMargin: 'Komisen %',
    addTier: 'Tambah Lapisan',
    seasons: 'Musim',
    seasonName: 'Nama Musim', seasonStart: 'Mula', seasonEnd: 'Tamat',
    addSeason: 'Tambah Musim',
    tax: 'Cukai per Malam per Bilik',
    rooms: 'Bilik',
    addRoom: 'Tambah Bilik',
    roomName: 'Nama Bilik', roomQty: 'Jumlah', pax: 'Kapasiti',
    maxExtraBeds: 'Katil tambahan', maxChildBeds: 'Katil kanak',
    views: 'Pemandangan', addView: 'Tambah Pemandangan',
    viewName: 'Pemandangan', viewCount: 'Bilik',
    rates: 'Harga',
    weekdayRate: 'Hari Biasa', weekendRate: 'Hujung Minggu',
    bfIncluded: 'Sarapan termasuk', bfPrice: 'Harga sarapan',
    extraBed: 'Katil tambahan', infant: 'Bayi',
    childWithBed: 'Kanak dgn katil', childNoBed: 'Kanak tanpa katil',
    childBreakfast: 'Sarapan kanak',
    ageFrom: 'Dari', ageTo: 'Hingga',
    price: 'Harga',
    nameRequired: 'Nama hotel diperlukan',
    cityRequired: 'Bandar diperlukan',
    tierNameReq: 'Setiap lapisan perlu nama',
    seasonReq: 'Setiap musim perlu nama + tarikh',
    noTiers: 'Tambah sekurang-kurangnya satu lapisan',
    noSeasons: 'Tambah sekurang-kurangnya satu musim',
    saveOk: 'Disimpan', saveFail: 'Gagal',
    currency: 'MYR',
    season: 'Musim', tier: 'Lapisan',
    rooms_short: 'Bilik', view_short: 'Pemandangan',
  },
} as const;

type Lang = keyof typeof T;
function useT() {
  const { lang } = useLanguage();
  const ll = (lang as Lang) in T ? (lang as Lang) : 'ar';
  return (k: keyof typeof T['ar']) => T[ll][k];
}

// ─── Types ─────────────────────────────────────────────────
export interface HotelData {
  id: number; name: string; city: number; address: string; stars: number;
  description?: string; description_ar?: string; description_en?: string;
  default_margin_pct?: string; tax_per_night_per_room?: string; image?: string | null;
}

interface ExistingPhoto { id: number; image: string; is_primary: boolean }

interface TierDraft {
  id?: number; tempKey: string;
  name: string;
  min_rooms_required: number;
  max_rooms_required: number | null;
  profit_margin_pct: string;
}

interface SeasonDraft {
  id?: number; tempKey: string;
  rangeId?: number;          // HotelSeasonDateRange id
  name: string;
  start_date: string;
  end_date: string;
}

interface ViewDraft {
  tempKey: string;
  view_label: string;        // free text view label (saved as RoomCategory.view_custom or view_type if matches)
  count: number;             // number of rooms with this view
}

interface RoomDraft {
  id?: number; tempKey: string;
  name: string;
  quantity_in_hotel: number;
  pax: number;
  max_extra_beds: number;
  max_child_beds: number;
  views: ViewDraft[];
  // Photos (uploaded after category exists, queued before)
  newPhotos?: File[];
  primaryNewPhotoIdx?: number;
  existingPhotos?: { id: number; image: string; is_primary: boolean }[];
  deletedPhotoIds?: Set<number>;
}

// Price cell keyed by season_tempKey + tier_tempKey + room_tempKey + view_tempKey
interface RoomRateCell {
  rateId?: number;
  weekday: string;
  weekend: string;
  bf_included: boolean;
  bf_price: string;
}
type RatesMap = Record<string, RoomRateCell>;       // key = `${season}|${tier}|${room}|${view}`
const rateKey = (s: string, t: string, r: string, v: string) => `${s}|${t}|${r}|${v}`;

// Guest pricing keyed by season + tier
interface GuestRow {
  guestPricingId?: number;
  extra_bed: string;
  infant: string; infant_age_from: number; infant_age_to: number;
  child_with_bed: string; child_with_bed_age_from: number; child_with_bed_age_to: number;
  child_no_bed: string; child_no_bed_age_from: number; child_no_bed_age_to: number;
  child_breakfast: string; child_breakfast_age_from: number; child_breakfast_age_to: number;
}
type GuestMap = Record<string, GuestRow>;          // key = `${season}|${tier}` (we'll only use tier portion for actual save)
const guestKey = (s: string, t: string) => `${s}|${t}`;
const blankGuest = (): GuestRow => ({
  extra_bed: '', infant: '', infant_age_from: 0, infant_age_to: 2,
  child_with_bed: '', child_with_bed_age_from: 7, child_with_bed_age_to: 12,
  child_no_bed: '', child_no_bed_age_from: 3, child_no_bed_age_to: 6,
  child_breakfast: '', child_breakfast_age_from: 3, child_breakfast_age_to: 12,
});

const newKey = () => Math.random().toString(36).slice(2, 10);
const todayPlus = (d: number) => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };

const inputCls = 'w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition shadow-sm';
const cellCls  = 'w-24 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition';
const ageInputCls = 'w-14 bg-white border border-gray-200 rounded-md px-1 py-1 text-xs text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition';

interface Props {
  hotel: HotelData | null;
  onSaved: () => void;
  onCancel: () => void;
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold tracking-wide text-gray-700 mb-1.5 block uppercase">
        {label}
        {required && <span className="text-rose-500 mx-1">*</span>}
        {hint && <span className="text-[10px] font-normal text-gray-400 normal-case mx-2">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

// Section card wrapper — gives each section consistent visual identity
function SectionCard({ icon, title, accent = 'blue', count, children }: {
  icon: React.ReactNode; title: string; accent?: 'blue'|'purple'|'cyan'|'amber'|'emerald';
  count?: number; children: React.ReactNode;
}) {
  const palette: Record<string, string> = {
    blue:    'from-blue-50 to-indigo-50 border-blue-100 text-blue-600',
    purple:  'from-purple-50 to-fuchsia-50 border-purple-100 text-purple-600',
    cyan:    'from-cyan-50 to-sky-50 border-cyan-100 text-cyan-600',
    amber:   'from-amber-50 to-orange-50 border-amber-100 text-amber-600',
    emerald: 'from-emerald-50 to-teal-50 border-emerald-100 text-emerald-600',
  };
  const ring: Record<string, string> = {
    blue:    'bg-blue-100 text-blue-600',
    purple:  'bg-purple-100 text-purple-600',
    cyan:    'bg-cyan-100 text-cyan-600',
    amber:   'bg-amber-100 text-amber-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  };
  return (
    <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <header className={`flex items-center gap-3 px-5 py-3 bg-gradient-to-r ${palette[accent]} border-b ${palette[accent].split(' ').find(c => c.startsWith('border-')) || ''}`}>
        <div className={`w-9 h-9 rounded-xl ${ring[accent]} flex items-center justify-center`}>
          {icon}
        </div>
        <h3 className="font-bold text-gray-900 flex-1">{title}</h3>
        {typeof count === 'number' && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ring[accent]}`}>{count}</span>
        )}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

const dashedAddBtn = (color: 'blue'|'purple'|'cyan'|'emerald') => {
  const c = {
    blue: 'border-blue-200 text-blue-600 hover:bg-blue-50',
    purple: 'border-purple-200 text-purple-600 hover:bg-purple-50',
    cyan: 'border-cyan-200 text-cyan-600 hover:bg-cyan-50',
    emerald: 'border-emerald-200 text-emerald-600 hover:bg-emerald-50',
  }[color];
  return `mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed ${c} rounded-xl text-sm font-semibold transition`;
};

// ═══════════════════════════════════════════════════════════
export function HotelSetupForm({ hotel, onSaved, onCancel }: Props) {
  const t = useT();
  const { isRTL } = useLanguage();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [name, setName] = useState(hotel?.name || '');
  const [stars, setStars] = useState<number>(typeof hotel?.stars === 'string' ? parseFloat(hotel.stars) : (hotel?.stars as number) || 4);
  const [countryId, setCountryId] = useState<string>('');
  const [cityId, setCityId] = useState<string>(hotel?.city ? String(hotel.city) : '');
  const [address, setAddress] = useState(hotel?.address || '');
  const [descAr, setDescAr] = useState(hotel?.description_ar || '');
  const [descEn, setDescEn] = useState(hotel?.description_en || '');
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [primaryNewIdx, setPrimaryNewIdx] = useState(0);
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [deletedExistingIds, setDeletedExistingIds] = useState<Set<number>>(new Set());

  // Step 2
  const [tiers, setTiers] = useState<TierDraft[]>([
    { tempKey: newKey(), name: 'FIT', min_rooms_required: 1, max_rooms_required: null, profit_margin_pct: '8' },
  ]);
  const [seasons, setSeasons] = useState<SeasonDraft[]>([
    { tempKey: newKey(), name: 'High Season', start_date: todayPlus(30), end_date: todayPlus(120) },
  ]);
  const [taxPerNight, setTaxPerNight] = useState(hotel?.tax_per_night_per_room || '0');

  // Step 3
  const [rooms, setRooms] = useState<RoomDraft[]>([]);
  const [rates, setRates] = useState<RatesMap>({});
  const [guest, setGuest] = useState<GuestMap>({});

  // Save
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  // ─── Load existing ─────────────────────────────────────
  useEffect(() => {
    if (!hotel?.id) return;
    apiFetch(`/api/v1/hotels/${hotel.id}/photos/`).then(r => r.ok ? r.json() : []).then(d => setExistingPhotos(d || [])).catch(() => {});

    Promise.all([
      hotelRatesApi.listPricingTiers({ hotel: hotel.id }).catch(() => []),
      hotelRatesApi.listSeasons({ hotel: hotel.id }).catch(() => []),
      hotelRatesApi.listGuestPricing({ hotel: hotel.id }).catch(() => []),
      hotelRatesApi.listCategories({ hotel: hotel.id }),
      hotelRatesApi.listRates({ hotel: hotel.id }),
    ]).then(([tdefs, seasonObjs, gps, cats, ratesObj]) => {
      const tiersLoaded: TierDraft[] = tdefs.length
        ? tdefs.map(td => ({ id: td.id, tempKey: newKey(), name: td.name, min_rooms_required: td.min_rooms_required, max_rooms_required: td.max_rooms_required, profit_margin_pct: td.profit_margin_pct || '8' }))
        : tiers;
      setTiers(tiersLoaded);

      const seasonsLoaded: SeasonDraft[] = seasonObjs.length
        ? seasonObjs.flatMap(s => {
            if (!s.date_ranges.length) return [{ id: s.id, tempKey: newKey(), name: s.name, start_date: '', end_date: '' }];
            return s.date_ranges.map(r => ({ id: s.id, rangeId: r.id, tempKey: newKey(), name: s.name, start_date: r.start_date, end_date: r.end_date }));
          })
        : seasons;
      setSeasons(seasonsLoaded);

      // Build rooms from cats — group same name together (views are different RoomCategory rows with same name)
      const roomsMap = new Map<string, RoomDraft>();
      // Track catId → (room.tempKey, view.tempKey) for rate matching
      const catToRV = new Map<number, { roomKey: string; viewKey: string }>();
      for (const c of cats) {
        const key = c.name;
        if (!roomsMap.has(key)) {
          roomsMap.set(key, {
            id: undefined, tempKey: newKey(),
            name: c.name,
            quantity_in_hotel: c.quantity_in_hotel || 1,
            pax: c.pax,
            max_extra_beds: c.max_extra_beds || 0,
            max_child_beds: c.max_child_beds || 0,
            views: [],
            newPhotos: [], primaryNewPhotoIdx: 0,
            existingPhotos: (c.photos || []).map(p => ({ id: p.id, image: p.image, is_primary: p.is_primary })),
            deletedPhotoIds: new Set(),
          });
        }
        const room = roomsMap.get(key)!;
        const viewLabel = c.view_custom || c.view_type;
        const viewKey = newKey();
        room.views.push({ tempKey: viewKey, view_label: viewLabel, count: c.quantity_in_hotel || 1 });
        catToRV.set(c.id, { roomKey: room.tempKey, viewKey });
        if (!room.id) room.id = c.id;
      }
      setRooms(Array.from(roomsMap.values()));

      // Build rates map (key by season|tier|room|view)
      const ratesMap: RatesMap = {};
      for (const r of ratesObj) {
        const rv = catToRV.get(r.room_category);
        if (!rv) continue;
        const seasonDraft = seasonsLoaded.find(sd => sd.id === r.season);
        const tierDraft = tiersLoaded.find(td => td.name === r.pricing_tier);
        if (!tierDraft) continue;
        // For seasonal rates — use first matching season tempKey
        // For flat rates (season=null) — apply to ALL seasons
        const seasonKeysToFill = seasonDraft
          ? [seasonDraft.tempKey]
          : seasonsLoaded.map(s => s.tempKey);
        for (const sKey of seasonKeysToFill) {
          const k = rateKey(sKey, tierDraft.tempKey, rv.roomKey, rv.viewKey);
          const existing = ratesMap[k] || { weekday: '', weekend: '', bf_included: false, bf_price: '' };
          // Merge weekday/weekend rates from separate RoomRate rows
          if (r.day_type === 'weekday') existing.weekday = r.base_rate;
          else if (r.day_type === 'weekend') existing.weekend = r.base_rate;
          else { // 'all'
            if (!existing.weekday) existing.weekday = r.base_rate;
            if (!existing.weekend) existing.weekend = r.base_rate;
          }
          if (r.rate_with_breakfast) {
            existing.bf_included = true;
            existing.bf_price = r.rate_with_breakfast;
          }
          ratesMap[k] = existing;
        }
      }
      setRates(ratesMap);

      // Guest pricing
      const gMap: GuestMap = {};
      for (const gp of gps) {
        const tier = tiersLoaded.find(td => td.id === gp.tier);
        if (!tier) continue;
        // Use one guest row per tier (independent of season per spec — but we map to first season for simplicity)
        for (const s of seasonsLoaded) {
          gMap[guestKey(s.tempKey, tier.tempKey)] = {
            guestPricingId: gp.id,
            extra_bed: gp.extra_bed_price || '',
            infant: gp.infant_price || '',
            infant_age_from: gp.infant_age_from, infant_age_to: gp.infant_age_to,
            child_with_bed: gp.child_with_bed_price || '',
            child_with_bed_age_from: gp.child_with_bed_age_from, child_with_bed_age_to: gp.child_with_bed_age_to,
            child_no_bed: gp.child_no_bed_price || '',
            child_no_bed_age_from: gp.child_no_bed_age_from, child_no_bed_age_to: gp.child_no_bed_age_to,
            child_breakfast: gp.child_breakfast_price || '',
            child_breakfast_age_from: gp.child_breakfast_age_from || 3,
            child_breakfast_age_to: gp.child_breakfast_age_to || 12,
          };
        }
      }
      setGuest(gMap);
    }).catch(() => {});
  }, [hotel?.id]);

  // ─── Tier handlers ─────────────────────────────────────
  const addTier = () => setTiers(t => [...t, { tempKey: newKey(), name: '', min_rooms_required: 0, max_rooms_required: null, profit_margin_pct: '8' }]);
  const updateTier = (i: number, patch: Partial<TierDraft>) => setTiers(t => t.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  const removeTier = (i: number) => setTiers(t => t.filter((_, idx) => idx !== i));

  // ─── Season handlers ───────────────────────────────────
  const addSeason = () => setSeasons(s => [...s, { tempKey: newKey(), name: '', start_date: todayPlus(0), end_date: todayPlus(30) }]);
  const updateSeason = (i: number, patch: Partial<SeasonDraft>) => setSeasons(s => s.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  const removeSeason = (i: number) => setSeasons(s => s.filter((_, idx) => idx !== i));

  // ─── Room handlers ─────────────────────────────────────
  const addRoom = () => setRooms(r => [...r, {
    tempKey: newKey(), name: '', quantity_in_hotel: 1, pax: 2, max_extra_beds: 0, max_child_beds: 0,
    views: [{ tempKey: newKey(), view_label: 'standard', count: 1 }],
    newPhotos: [], primaryNewPhotoIdx: 0, existingPhotos: [], deletedPhotoIds: new Set(),
  }]);
  const updateRoom = (i: number, patch: Partial<RoomDraft>) => setRooms(r => r.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  const removeRoom = (i: number) => setRooms(r => r.filter((_, idx) => idx !== i));
  const addView = (ri: number) => setRooms(rs => rs.map((r, i) => i === ri
    ? { ...r, views: [...r.views, { tempKey: newKey(), view_label: 'standard', count: 1 }] }
    : r));
  const updateView = (ri: number, vi: number, patch: Partial<ViewDraft>) => setRooms(rs => rs.map((r, i) => i === ri
    ? { ...r, views: r.views.map((v, j) => j === vi ? { ...v, ...patch } : v) }
    : r));
  const removeView = (ri: number, vi: number) => setRooms(rs => rs.map((r, i) => i === ri
    ? { ...r, views: r.views.filter((_, j) => j !== vi) }
    : r));

  // ─── Rate cell handlers ────────────────────────────────
  const updateRate = (s: string, ti: string, ri: string, vi: string, patch: Partial<RoomRateCell>) => {
    const k = rateKey(s, ti, ri, vi);
    setRates(prev => ({
      ...prev,
      [k]: { ...(prev[k] || { weekday: '', weekend: '', bf_included: false, bf_price: '' }), ...patch },
    }));
  };

  // ─── Guest cell handlers ───────────────────────────────
  const updateGuest = (s: string, ti: string, patch: Partial<GuestRow>) => {
    const k = guestKey(s, ti);
    setGuest(prev => ({ ...prev, [k]: { ...(prev[k] || blankGuest()), ...patch } }));
  };

  // ─── Photos ────────────────────────────────────────────
  const addPhoto = (files: FileList | null) => { if (!files) return; setNewPhotos(p => [...p, ...Array.from(files)]); };
  const removeNewPhoto = (idx: number) => { setNewPhotos(p => p.filter((_, i) => i !== idx)); if (primaryNewIdx === idx) setPrimaryNewIdx(0); };
  const removeExistingPhoto = (id: number) => setDeletedExistingIds(p => new Set([...p, id]));

  // ─── Validation ────────────────────────────────────────
  const validateStep = (s: number): string | null => {
    if (s === 1 && !name.trim()) return t('nameRequired');
    if (s === 1 && !cityId) return t('cityRequired');
    if (s === 2 && tiers.length === 0) return t('noTiers');
    if (s === 2 && tiers.some(td => !td.name.trim())) return t('tierNameReq');
    if (s === 2 && seasons.length === 0) return t('noSeasons');
    if (s === 2 && seasons.some(sd => !sd.name.trim() || !sd.start_date || !sd.end_date)) return t('seasonReq');
    return null;
  };
  const goNext = () => { const e = validateStep(step); if (e) { setError(e); return; } setError(null); if (step < 3) setStep((step + 1) as 1|2|3); };
  const goPrev = () => { setError(null); if (step > 1) setStep((step - 1) as 1|2|3); };

  // ─── Save ──────────────────────────────────────────────
  const save = async () => {
    setError(null);
    for (const s of [1, 2]) { const err = validateStep(s); if (err) { setError(err); return; } }

    setSaving(true);
    try {
      // 1. Hotel
      setProgress(t('step1'));
      const hotelFd = new FormData();
      hotelFd.append('name', name);
      hotelFd.append('city', cityId);
      hotelFd.append('address', address || '-');
      hotelFd.append('stars', String(stars));
      hotelFd.append('description_ar', descAr);
      hotelFd.append('description_en', descEn);
      if (descAr) hotelFd.append('description', descAr);
      hotelFd.append('tax_per_night_per_room', taxPerNight);
      const r = await apiFetch(hotel?.id ? `/api/v1/hotels/${hotel.id}/` : `/api/v1/hotels/`, {
        method: hotel?.id ? 'PATCH' : 'POST', body: hotelFd,
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(JSON.stringify(e)); }
      const hotelObj = await r.json();
      const hotelId = hotelObj.id;

      // 2. Photos
      setProgress(t('photos'));
      for (const id of deletedExistingIds) {
        await apiFetch(`/api/v1/hotels/${hotelId}/photos/${id}/`, { method: 'DELETE' }).catch(() => {});
      }
      for (let i = 0; i < newPhotos.length; i++) {
        const fd = new FormData();
        fd.append('image', newPhotos[i]);
        if (i === primaryNewIdx) fd.append('is_primary', 'true');
        const token = localStorage.getItem('access_token');
        await fetch(`${BASE}/api/v1/hotels/${hotelId}/photos/`, {
          method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd,
        }).catch(() => {});
      }

      // 3. Tiers
      setProgress(t('pricingTiers'));
      const existingTiers = await hotelRatesApi.listPricingTiers({ hotel: hotelId }).catch(() => []);
      const tierKeyToId: Record<string, number> = {};
      const usedIds = new Set<number>();
      for (let idx = 0; idx < tiers.length; idx++) {
        const td = tiers[idx];
        const existing = td.id ? existingTiers.find(x => x.id === td.id) : existingTiers.find(x => x.name === td.name);
        const payload = {
          name: td.name, min_rooms_required: td.min_rooms_required,
          max_rooms_required: td.max_rooms_required, profit_margin_pct: td.profit_margin_pct,
          sort_order: idx,
        };
        if (existing) {
          await hotelRatesApi.updatePricingTier(existing.id, payload as any);
          tierKeyToId[td.tempKey] = existing.id; usedIds.add(existing.id);
        } else {
          const c = await hotelRatesApi.createPricingTier({ hotel: hotelId, ...payload } as any);
          tierKeyToId[td.tempKey] = c.id; usedIds.add(c.id);
        }
      }
      for (const ex of existingTiers) if (!usedIds.has(ex.id)) await hotelRatesApi.deletePricingTier(ex.id).catch(() => {});

      // 4. Seasons
      setProgress(t('seasons'));
      const existingSeasons = await hotelRatesApi.listSeasons({ hotel: hotelId }).catch(() => []);
      const seasonKeyToId: Record<string, number> = {};
      const usedSeasonIds = new Set<number>();
      // Group local seasons by name (one HotelSeason can have multiple ranges)
      const seasonsByName: Record<string, SeasonDraft[]> = {};
      for (const s of seasons) {
        if (!seasonsByName[s.name]) seasonsByName[s.name] = [];
        seasonsByName[s.name].push(s);
      }
      let seasonIdx = 0;
      for (const [seasonName, group] of Object.entries(seasonsByName)) {
        let existingSeason = existingSeasons.find(x => x.name === seasonName);
        let seasonId: number;
        if (existingSeason) {
          await hotelRatesApi.updateSeason(existingSeason.id, { name: seasonName, sort_order: seasonIdx } as any);
          seasonId = existingSeason.id;
        } else {
          const created = await hotelRatesApi.createSeason({ hotel: hotelId, name: seasonName, season_type: 'normal', sort_order: seasonIdx } as any);
          seasonId = created.id;
        }
        usedSeasonIds.add(seasonId);
        // Replace ranges
        const fullSeason = (await hotelRatesApi.listSeasons({ hotel: hotelId })).find(x => x.id === seasonId);
        if (fullSeason) {
          for (const r of fullSeason.date_ranges) await hotelRatesApi.deleteSeasonRange(r.id).catch(() => {});
        }
        for (const sd of group) {
          await hotelRatesApi.createSeasonRange({ season: seasonId, start_date: sd.start_date, end_date: sd.end_date }).catch(() => {});
          seasonKeyToId[sd.tempKey] = seasonId;
        }
        seasonIdx++;
      }
      for (const ex of existingSeasons) if (!usedSeasonIds.has(ex.id)) await hotelRatesApi.deleteSeason(ex.id).catch(() => {});

      // 5. Rooms (one RoomCategory per room×view) + rates
      setProgress(t('rooms'));
      // First clean up old categories for this hotel that are not in our list
      const existingCats = await hotelRatesApi.listCategories({ hotel: hotelId });
      const keepCatIds = new Set<number>();
      // Map roomKey+viewKey → categoryId
      const catMap: Record<string, number> = {};
      for (const room of rooms) {
        if (!room.name.trim()) continue;
        for (const view of room.views) {
          const viewLabel = view.view_label.trim() || 'standard';
          // Check if this view matches a known view_type or use view_custom
          const knownViewTypes = ['standard', 'sea', 'hill', 'garden', 'pool', 'city', 'klcc', 'kl_tower', 'beach', 'lagoon', 'beachfront', 'runaway', 'street', 'other'];
          const isKnown = knownViewTypes.includes(viewLabel.toLowerCase());
          const view_type = isKnown ? viewLabel.toLowerCase() : 'other';
          const view_custom = isKnown ? '' : viewLabel;
          const catPayload = {
            hotel: hotelId,
            name: room.name,
            base_type: 'room' as const,
            view_type, view_custom,
            pax: room.pax, max_occupancy: room.pax,
            quantity_in_hotel: view.count,
            max_extra_beds: room.max_extra_beds,
            max_child_beds: room.max_child_beds,
            is_active: true,
          };
          // Find existing by (hotel, name, view_type, count is unique constraint... try name+view)
          const existingMatch = existingCats.find(c =>
            c.name === room.name &&
            (c.view_custom || c.view_type) === viewLabel
          );
          let catId: number;
          if (existingMatch) {
            await hotelRatesApi.updateCategory(existingMatch.id, catPayload as any);
            catId = existingMatch.id;
          } else {
            const c = await hotelRatesApi.createCategory(catPayload as any);
            catId = c.id;
          }
          keepCatIds.add(catId);
          catMap[`${room.tempKey}|${view.tempKey}`] = catId;
        }
        // Upload photos on the first view's category (acts as the "room" container)
        const firstViewCatId = catMap[`${room.tempKey}|${room.views[0]?.tempKey}`];
        if (firstViewCatId) {
          // delete removed
          for (const pid of room.deletedPhotoIds || []) {
            await hotelRatesApi.deleteCategoryPhoto(firstViewCatId, pid).catch(() => {});
          }
          // upload new
          const newPhotos = room.newPhotos || [];
          for (let i = 0; i < newPhotos.length; i++) {
            await hotelRatesApi.uploadCategoryPhoto(firstViewCatId, newPhotos[i], {
              is_primary: i === (room.primaryNewPhotoIdx ?? 0),
            }).catch(() => {});
          }
        }
      }
      // Delete unused old categories
      for (const ec of existingCats) if (!keepCatIds.has(ec.id)) await hotelRatesApi.deleteCategory(ec.id).catch(() => {});

      // 6. Rates: for each season×tier×room×view → 2 rows (weekday, weekend)
      setProgress(t('rates'));
      // First clear all existing rates for these categories
      const existingRates = await hotelRatesApi.listRates({ hotel: hotelId });
      for (const er of existingRates) await hotelRatesApi.deleteRate(er.id).catch(() => {});

      for (const room of rooms) {
        for (const view of room.views) {
          const catId = catMap[`${room.tempKey}|${view.tempKey}`];
          if (!catId) continue;
          for (const season of seasons) {
            const seasonId = seasonKeyToId[season.tempKey];
            for (const td of tiers) {
              const tierId = tierKeyToId[td.tempKey];
              const k = rateKey(season.tempKey, td.tempKey, room.tempKey, view.tempKey);
              const cell = rates[k];
              if (!cell) continue;
              const wd = cell.weekday;
              const we = cell.weekend;
              if (!wd && !we) continue;
              const basePayload = {
                room_category: catId,
                season: seasonId,
                pricing_tier: td.name,
                occupancy: 'double' as const,
                markup_pct: td.profit_margin_pct,
                currency: 'MYR', tax_inclusive: true, is_active: true,
                rate_with_breakfast: cell.bf_included && cell.bf_price ? cell.bf_price : null,
              };
              if (wd) await hotelRatesApi.createRate({ ...basePayload, day_type: 'weekday', base_rate: wd } as any).catch(() => {});
              if (we) await hotelRatesApi.createRate({ ...basePayload, day_type: 'weekend', base_rate: we } as any).catch(() => {});
              if (!wd && we) await hotelRatesApi.createRate({ ...basePayload, day_type: 'all', base_rate: we } as any).catch(() => {});
            }
          }
        }
      }

      // 7. Guest pricing per tier (one row per tier — pull from any season key for simplicity)
      const existingGP = await hotelRatesApi.listGuestPricing({ hotel: hotelId });
      for (const gp of existingGP) await hotelRatesApi.deleteGuestPricing(gp.id).catch(() => {});

      for (const td of tiers) {
        const tierId = tierKeyToId[td.tempKey];
        // Use the first season's guest row for this tier
        const firstSeasonKey = seasons[0]?.tempKey;
        const row = guest[guestKey(firstSeasonKey, td.tempKey)] || blankGuest();
        await hotelRatesApi.createGuestPricing({
          hotel: hotelId, tier: tierId,
          extra_bed_price: row.extra_bed || null,
          infant_price: row.infant || null,
          infant_age_from: row.infant_age_from, infant_age_to: row.infant_age_to,
          child_with_bed_price: row.child_with_bed || null,
          child_with_bed_age_from: row.child_with_bed_age_from, child_with_bed_age_to: row.child_with_bed_age_to,
          child_no_bed_price: row.child_no_bed || null,
          child_no_bed_age_from: row.child_no_bed_age_from, child_no_bed_age_to: row.child_no_bed_age_to,
          child_breakfast_price: row.child_breakfast || null,
          child_breakfast_age_from: row.child_breakfast_age_from, child_breakfast_age_to: row.child_breakfast_age_to,
        } as any).catch(() => {});
      }

      onSaved();
    } catch (e) {
      setError(String(e));
    } finally { setSaving(false); setProgress(null); }
  };

  // ═════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-gray-50 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[94vh] overflow-hidden flex flex-col ring-1 ring-black/5">

        {/* Header — gradient, prominent */}
        <div className="relative px-6 py-5 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg leading-tight">{t('title')}</h2>
                <p className="text-xs opacity-80 mt-0.5">
                  {step === 1 ? t('step1') : step === 2 ? t('step2') : t('step3')} · {step}/3
                </p>
              </div>
            </div>
            <button onClick={onCancel} className="p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stepper — bigger, modern */}
        <div className="flex items-center gap-3 px-8 py-5 bg-white border-b border-gray-100">
          {[1, 2, 3].map((s, idx) => {
            const isActive = s === step;
            const isDone = s < step;
            return (
              <div key={s} className="flex items-center gap-3 flex-1">
                <button type="button" onClick={() => { if (s < step) setStep(s as 1|2|3); }}
                  className={`flex items-center gap-3 ${isDone ? 'cursor-pointer' : isActive ? 'cursor-default' : 'cursor-default'}`}>
                  <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                    isActive ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-110'
                    : isDone   ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isDone ? <Check className="w-5 h-5" /> : s}
                    {isActive && <span className="absolute inset-0 rounded-full ring-4 ring-blue-500/15 animate-pulse" />}
                  </div>
                  <span className={`text-sm hidden sm:inline transition ${isActive ? 'font-bold text-gray-900' : isDone ? 'font-medium text-emerald-700' : 'text-gray-400'}`}>
                    {s === 1 ? t('step1') : s === 2 ? t('step2') : t('step3')}
                  </span>
                </button>
                {idx < 2 && <div className={`flex-1 h-0.5 rounded-full transition ${isDone ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <SectionCard icon={<Building2 className="w-5 h-5"/>} title={t('step1')} accent="blue">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label={t('name')} required>
                    <input className={inputCls} value={name} onChange={e => setName(e.target.value)} />
                  </Field>
                  <Field label={t('stars')} hint="مثال: 4.5">
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-white border border-gray-200 rounded-xl shadow-sm w-fit">
                      {/* Half-star aware visual display */}
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(n => {
                          const full = stars >= n;
                          const half = !full && stars >= n - 0.5;
                          return (
                            <button key={n} type="button"
                              onClick={(e) => {
                                // Click left half → n-0.5, right half → n
                                const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const isLeftHalf = (isRTL ? x > rect.width / 2 : x < rect.width / 2);
                                setStars(isLeftHalf ? n - 0.5 : n);
                              }}
                              className={`relative p-1 rounded transition hover:bg-amber-50`}>
                              <Star className={`w-6 h-6 ${full ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}`} />
                              {half && (
                                <Star className={`w-6 h-6 absolute inset-0 m-1 fill-amber-500 text-amber-500`}
                                  style={{ clipPath: isRTL ? 'inset(0 0 0 50%)' : 'inset(0 50% 0 0)' }} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <input type="number" step={0.5} min={0} max={5}
                        value={stars}
                        onChange={e => setStars(Math.max(0, Math.min(5, parseFloat(e.target.value) || 0)))}
                        className="w-14 text-center font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg py-1" />
                    </div>
                  </Field>
                  <div className="md:col-span-2">
                    <Field label={t('countryCity')} required>
                      <CountryCityPicker
                        initialCountryId={countryId || undefined}
                        initialCityId={cityId || undefined}
                        onCountryChange={(_, country) => setCountryId(country ? String(country.id) : '')}
                        onCityChange={(_, city) => setCityId(city ? String(city.id) : '')}
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label={t('address')}>
                      <input className={inputCls} value={address} onChange={e => setAddress(e.target.value)} />
                    </Field>
                  </div>
                  <Field label={t('descAr')}>
                    <textarea rows={3} className={inputCls} value={descAr} onChange={e => setDescAr(e.target.value)} dir="rtl" />
                  </Field>
                  <Field label={t('descEn')}>
                    <textarea rows={3} className={inputCls} value={descEn} onChange={e => setDescEn(e.target.value)} dir="ltr" />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard icon={<ImageIcon className="w-5 h-5"/>} title={t('photos')} accent="emerald" count={existingPhotos.filter(p => !deletedExistingIds.has(p.id)).length + newPhotos.length}>
                <div className="hidden">{/* placeholder anchor */}</div>
                {existingPhotos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-3">
                    {existingPhotos.filter(p => !deletedExistingIds.has(p.id)).map(p => (
                      <div key={p.id} className="relative group">
                        <img src={p.image.startsWith('http') ? p.image : `${BASE}${p.image}`} className="w-full h-20 object-cover rounded-lg border" alt=""/>
                        {p.is_primary && <span className="absolute top-1 left-1 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded">{t('primary')}</span>}
                        <button onClick={() => removeExistingPhoto(p.id)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
                {newPhotos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-3">
                    {newPhotos.map((f, idx) => (
                      <div key={idx} className="relative group">
                        <img src={URL.createObjectURL(f)} className="w-full h-20 object-cover rounded-lg border" alt=""/>
                        {idx === primaryNewIdx && <span className="absolute top-1 left-1 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded">{t('primary')}</span>}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-lg transition flex items-center justify-center gap-2">
                          {idx !== primaryNewIdx && <button onClick={() => setPrimaryNewIdx(idx)} className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-emerald-600 text-white text-[10px] rounded">{t('setPrimary')}</button>}
                          <button onClick={() => removeNewPhoto(idx)} className="opacity-0 group-hover:opacity-100 p-1 bg-red-500 text-white rounded"><Trash2 className="w-3 h-3"/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-xl text-sm font-semibold text-emerald-700 hover:bg-emerald-100 cursor-pointer transition">
                  <Upload className="w-4 h-4" /> {t('addPhoto')}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => addPhoto(e.target.files)} />
                </label>
              </SectionCard>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <SectionCard icon={<Layers className="w-5 h-5"/>} title={t('pricingTiers')} accent="purple" count={tiers.length}>
                {/* Header row labels */}
                <div className="hidden md:grid grid-cols-[24px_minmax(0,1fr)_120px_120px_140px_36px] gap-2 px-2 mb-2">
                  <span/>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{t('tierName')}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 text-center">{t('tierMin')}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 text-center">{t('tierMax')}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 text-center">{t('tierMargin')}</span>
                  <span/>
                </div>
                <div className="space-y-2">
                  {tiers.map((td, idx) => (
                    <div key={td.tempKey} className="grid grid-cols-2 md:grid-cols-[24px_minmax(0,1fr)_120px_120px_140px_36px] gap-2 items-center bg-gradient-to-r from-purple-50/40 to-fuchsia-50/40 border border-purple-100 rounded-xl p-3 hover:border-purple-300 transition">
                      <span className="text-xs font-bold text-purple-700 bg-white rounded-full w-6 h-6 flex items-center justify-center shrink-0">{idx + 1}</span>
                      <input className={inputCls} placeholder={t('tierName')} value={td.name}
                        onChange={e => updateTier(idx, { name: e.target.value })} />
                      <input type="number" min={0} className={inputCls + ' text-center'} placeholder={t('tierMin')} value={td.min_rooms_required}
                        onChange={e => updateTier(idx, { min_rooms_required: Number(e.target.value) || 0 })} />
                      <input type="number" min={0} className={inputCls + ' text-center'} placeholder={t('tierMax')}
                        value={td.max_rooms_required ?? ''}
                        onChange={e => updateTier(idx, { max_rooms_required: e.target.value ? Number(e.target.value) : null })} />
                      <div className="relative">
                        <input type="number" step="0.01" className={inputCls + ' text-center pe-8'} placeholder={t('tierMargin')} value={td.profit_margin_pct}
                          onChange={e => updateTier(idx, { profit_margin_pct: e.target.value })} />
                        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">%</span>
                      </div>
                      <button onClick={() => removeTier(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg justify-self-end transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <button onClick={addTier} className={dashedAddBtn('purple')}>
                  <Plus className="w-4 h-4" /> {t('addTier')}
                </button>
              </SectionCard>

              <SectionCard icon={<Calendar className="w-5 h-5"/>} title={t('seasons')} accent="cyan" count={seasons.length}>
                <div className="hidden md:grid grid-cols-[24px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_36px] gap-2 px-2 mb-2">
                  <span/>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{t('seasonName')}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{t('seasonStart')}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{t('seasonEnd')}</span>
                  <span/>
                </div>
                <div className="space-y-2">
                  {seasons.map((sd, idx) => (
                    <div key={sd.tempKey} className="grid grid-cols-2 md:grid-cols-[24px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_36px] gap-2 items-center bg-gradient-to-r from-cyan-50/40 to-sky-50/40 border border-cyan-100 rounded-xl p-3 hover:border-cyan-300 transition">
                      <span className="text-xs font-bold text-cyan-700 bg-white rounded-full w-6 h-6 flex items-center justify-center shrink-0">{idx + 1}</span>
                      <input className={inputCls} placeholder={t('seasonName')} value={sd.name}
                        onChange={e => updateSeason(idx, { name: e.target.value })} />
                      <input type="date" className={inputCls} value={sd.start_date}
                        onChange={e => updateSeason(idx, { start_date: e.target.value })} />
                      <input type="date" className={inputCls} value={sd.end_date}
                        onChange={e => updateSeason(idx, { end_date: e.target.value })} />
                      <button onClick={() => removeSeason(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg justify-self-end transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <button onClick={addSeason} className={dashedAddBtn('cyan')}>
                  <Plus className="w-4 h-4" /> {t('addSeason')}
                </button>
              </SectionCard>

              <SectionCard icon={<Receipt className="w-5 h-5"/>} title={t('tax')} accent="amber">
                <div className="max-w-md">
                  <Field label={`${t('tax')}`} hint={`(${t('currency')})`}>
                    <div className="relative">
                      <input type="number" step="0.01" className={inputCls + ' pe-12'} value={taxPerNight}
                        onChange={e => setTaxPerNight(e.target.value)} />
                      <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600 pointer-events-none">{t('currency')}</span>
                    </div>
                  </Field>
                  <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                    💡 الإجمالي = الضريبة × عدد الغرف × عدد الليالي
                  </p>
                </div>
              </SectionCard>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <SectionCard icon={<BedDouble className="w-5 h-5"/>} title={t('rooms')} accent="blue" count={rooms.length}>
                {rooms.length === 0 ? (
                  <div className="py-10 text-center">
                    <BedDouble className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 mb-4">{t('roomName')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rooms.map((room, ri) => (
                      <div key={room.tempKey} className="border border-gray-200 rounded-xl bg-gradient-to-br from-gray-50/50 to-white p-4 hover:border-blue-200 transition">
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 rounded-full w-7 h-7 flex items-center justify-center">#{ri+1}</span>
                          <span className="text-sm font-semibold text-gray-800 flex-1">{room.name || t('roomName')}</span>
                          <button onClick={() => removeRoom(ri)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                          <Field label={t('roomName')} required>
                            <input className={inputCls} value={room.name}
                              onChange={e => updateRoom(ri, { name: e.target.value })} />
                          </Field>
                          <Field label={t('roomQty')}>
                            <input type="number" min={1} className={inputCls + ' text-center'} value={room.quantity_in_hotel}
                              onChange={e => updateRoom(ri, { quantity_in_hotel: Number(e.target.value) || 1 })} />
                          </Field>
                          <Field label={t('pax')}>
                            <input type="number" min={1} className={inputCls + ' text-center'} value={room.pax}
                              onChange={e => updateRoom(ri, { pax: Number(e.target.value) || 1 })} />
                          </Field>
                          <Field label={t('maxExtraBeds')}>
                            <input type="number" min={0} className={inputCls + ' text-center'} value={room.max_extra_beds}
                              onChange={e => updateRoom(ri, { max_extra_beds: Number(e.target.value) || 0 })} />
                          </Field>
                          <Field label={t('maxChildBeds')}>
                            <input type="number" min={0} className={inputCls + ' text-center'} value={room.max_child_beds}
                              onChange={e => updateRoom(ri, { max_child_beds: Number(e.target.value) || 0 })} />
                          </Field>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Views — nested card */}
                          <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-3">
                            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5" /> {t('views')}
                            </p>
                            <div className="space-y-2">
                              {room.views.map((v, vi) => (
                                <div key={v.tempKey} className="grid grid-cols-[minmax(0,1fr)_72px_28px] gap-2 items-center">
                                  <input className={inputCls + ' text-xs py-1.5'} placeholder={t('viewName')} value={v.view_label}
                                    onChange={e => updateView(ri, vi, { view_label: e.target.value })} />
                                  <input type="number" min={1} className={inputCls + ' text-center text-xs py-1.5'} placeholder={t('viewCount')} value={v.count}
                                    onChange={e => updateView(ri, vi, { count: Number(e.target.value) || 1 })} />
                                  {room.views.length > 1 ? (
                                    <button onClick={() => removeView(ri, vi)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded justify-self-end transition"><Trash2 className="w-3.5 h-3.5" /></button>
                                  ) : <span/>}
                                </div>
                              ))}
                            </div>
                            <button onClick={() => addView(ri)} className="mt-2 text-xs font-medium text-emerald-700 flex items-center gap-1 hover:gap-1.5 transition-all">
                              <Plus className="w-3 h-3" /> {t('addView')}
                            </button>
                          </div>

                          {/* Photos — nested card */}
                          <div className="bg-amber-50/40 border border-amber-100 rounded-lg p-3">
                            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5" /> صور الغرفة
                            </p>
                            <div className="grid grid-cols-3 gap-2 mb-2">
                              {(room.existingPhotos || []).filter(p => !(room.deletedPhotoIds?.has(p.id))).map(p => (
                                <div key={p.id} className="relative group aspect-square rounded overflow-hidden border border-gray-200">
                                  <img src={p.image.startsWith('http') ? p.image : `${BASE}${p.image}`} className="w-full h-full object-cover" alt="" />
                                  {p.is_primary && <span className="absolute top-0.5 start-0.5 bg-emerald-500 text-white text-[9px] px-1 rounded">★</span>}
                                  <button onClick={() => {
                                    const next = new Set(room.deletedPhotoIds || []);
                                    next.add(p.id);
                                    updateRoom(ri, { deletedPhotoIds: next });
                                  }} className="absolute top-0.5 end-0.5 p-0.5 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100"><Trash2 className="w-2.5 h-2.5"/></button>
                                </div>
                              ))}
                              {(room.newPhotos || []).map((f, idx) => (
                                <div key={idx} className="relative group aspect-square rounded overflow-hidden border border-gray-200">
                                  <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" alt="" />
                                  {idx === (room.primaryNewPhotoIdx ?? 0) && <span className="absolute top-0.5 start-0.5 bg-emerald-500 text-white text-[9px] px-1 rounded">★</span>}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center gap-1">
                                    {idx !== (room.primaryNewPhotoIdx ?? 0) && (
                                      <button onClick={() => updateRoom(ri, { primaryNewPhotoIdx: idx })}
                                        className="opacity-0 group-hover:opacity-100 p-1 bg-emerald-600 text-white rounded">
                                        <Star className="w-3 h-3" />
                                      </button>
                                    )}
                                    <button onClick={() => {
                                      const next = (room.newPhotos || []).filter((_, i) => i !== idx);
                                      const pIdx = room.primaryNewPhotoIdx ?? 0;
                                      updateRoom(ri, { newPhotos: next, primaryNewPhotoIdx: pIdx === idx ? 0 : (pIdx > idx ? pIdx - 1 : pIdx) });
                                    }} className="opacity-0 group-hover:opacity-100 p-1 bg-red-500 text-white rounded">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <label className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-amber-50 border-2 border-dashed border-amber-200 rounded-lg text-xs font-semibold text-amber-700 hover:bg-amber-100 cursor-pointer transition">
                              <Upload className="w-3 h-3" /> إضافة صور
                              <input type="file" accept="image/*" multiple className="hidden"
                                onChange={e => {
                                  if (!e.target.files) return;
                                  updateRoom(ri, { newPhotos: [...(room.newPhotos || []), ...Array.from(e.target.files)] });
                                }} />
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={addRoom} className={dashedAddBtn('blue')}>
                  <Plus className="w-4 h-4" /> {t('addRoom')}
                </button>
              </SectionCard>

              {/* Price matrix per season + tier */}
              {rooms.length > 0 && tiers.length > 0 && seasons.length > 0 && (
                <SectionCard icon={<Receipt className="w-5 h-5"/>} title={t('rates')} accent="amber">
                  <div className="space-y-4">
                    {seasons.map(season => (
                      <details key={season.tempKey} className="border-2 border-cyan-200 rounded-xl overflow-hidden bg-white shadow-sm" open>
                        <summary className="px-5 py-3 bg-gradient-to-r from-cyan-100 to-sky-100 cursor-pointer flex items-center justify-between font-bold text-cyan-900 hover:from-cyan-200 hover:to-sky-200 transition">
                          <span className="flex items-center gap-2.5">
                            <Calendar className="w-5 h-5" />
                            <span className="text-sm">{t('season')}: {season.name || '—'}</span>
                            <span className="text-[11px] text-cyan-700 font-medium bg-white/60 px-2 py-0.5 rounded-full">
                              {season.start_date} → {season.end_date}
                            </span>
                          </span>
                          <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="p-4 space-y-3 bg-gradient-to-b from-cyan-50/30 to-white">
                          {tiers.map(td => (
                            <details key={td.tempKey} className="border border-purple-200 rounded-xl overflow-hidden bg-white" open>
                              <summary className="px-4 py-2.5 bg-gradient-to-r from-purple-100 to-fuchsia-100 cursor-pointer flex items-center gap-2 font-semibold text-purple-900 hover:from-purple-200 hover:to-fuchsia-200 transition">
                                <Layers className="w-4 h-4" />
                                <span className="text-sm">{t('tier')}: {td.name}</span>
                                <span className="ms-auto text-[11px] bg-white/60 px-2 py-0.5 rounded-full">{td.profit_margin_pct}% margin</span>
                              </summary>
                              <div className="p-4 space-y-4">
                                {/* Room×View matrix */}
                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                                        <th className="text-start px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-600">{t('rooms_short')}</th>
                                        <th className="text-start px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-600">{t('view_short')}</th>
                                        <th className="text-center px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-blue-600">{t('weekdayRate')}</th>
                                        <th className="text-center px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-purple-600">{t('weekendRate')}</th>
                                        <th className="text-center px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-rose-600">{t('bfIncluded')}</th>
                                        <th className="text-center px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-rose-600">{t('bfPrice')}</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {rooms.flatMap(room => room.views.map((v, idx) => {
                                        const k = rateKey(season.tempKey, td.tempKey, room.tempKey, v.tempKey);
                                        const cell = rates[k] || { weekday: '', weekend: '', bf_included: false, bf_price: '' };
                                        return (
                                          <tr key={`${room.tempKey}-${v.tempKey}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                            <td className="px-3 py-2 font-semibold text-gray-800">{room.name || '—'}</td>
                                            <td className="px-3 py-2">
                                              <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">{v.view_label}</span>
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                              <input type="number" step="0.01" className={cellCls} value={cell.weekday}
                                                onChange={e => updateRate(season.tempKey, td.tempKey, room.tempKey, v.tempKey, { weekday: e.target.value })} />
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                              <input type="number" step="0.01" className={cellCls} value={cell.weekend}
                                                onChange={e => updateRate(season.tempKey, td.tempKey, room.tempKey, v.tempKey, { weekend: e.target.value })} />
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                              <input type="checkbox" className="w-4 h-4 accent-rose-500" checked={cell.bf_included}
                                                onChange={e => updateRate(season.tempKey, td.tempKey, room.tempKey, v.tempKey, { bf_included: e.target.checked })} />
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                              <input type="number" step="0.01" className={cellCls + (cell.bf_included ? '' : ' opacity-40')} value={cell.bf_price} disabled={!cell.bf_included}
                                                onChange={e => updateRate(season.tempKey, td.tempKey, room.tempKey, v.tempKey, { bf_price: e.target.value })} />
                                            </td>
                                          </tr>
                                        );
                                      }))}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Guest pricing matrix for this tier */}
                                <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 p-4">
                                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-3 flex items-center gap-1.5">
                                    <UsersIcon className="w-3.5 h-3.5" /> أسعار الضيوف الإضافيين
                                  </p>
                                  <GuestRowEditor
                                    row={guest[guestKey(season.tempKey, td.tempKey)] || blankGuest()}
                                    onChange={patch => updateGuest(season.tempKey, td.tempKey, patch)}
                                    t={t}
                                  />
                                </div>
                              </div>
                            </details>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                </SectionCard>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex-1 min-w-0">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg">
                <X className="w-4 h-4 text-rose-500 shrink-0"/>
                <p className="text-sm text-rose-700 truncate">{error}</p>
              </div>
            )}
            {progress && !error && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0"/>
                <p className="text-sm text-blue-700">{progress}</p>
              </div>
            )}
          </div>
          <button onClick={onCancel} className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition">{t('cancel')}</button>
          {step > 1 && (
            <button onClick={goPrev} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl shadow-sm transition">
              {isRTL ? <ChevronRight className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>}{t('prev')}
            </button>
          )}
          {step < 3 ? (
            <button onClick={goNext} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/30 transition">
              {t('next')}{isRTL ? <ChevronLeft className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
            </button>
          ) : (
            <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/30 disabled:opacity-60 transition">
              {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
              {saving ? t('saving') : t('save')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Guest pricing sub-editor ─────────────────────────────
function GuestRowEditor({ row, onChange, t }: { row: GuestRow; onChange: (p: Partial<GuestRow>) => void; t: ReturnType<typeof useT> }) {
  return (
    <div className="space-y-1.5">
      <RowInputs label={t('extraBed')} icon={<BedDouble className="w-3 h-3 text-blue-500" />}>
        <input type="number" step="0.01" className={cellCls} placeholder={t('price')} value={row.extra_bed}
          onChange={e => onChange({ extra_bed: e.target.value })} />
      </RowInputs>

      <RowInputs label={t('infant')} icon={<Baby className="w-3 h-3 text-amber-500" />}>
        <Age from={row.infant_age_from} to={row.infant_age_to} onChange={(f,t2)=>onChange({infant_age_from:f,infant_age_to:t2})} t={t}/>
        <input type="number" step="0.01" className={cellCls} placeholder={t('price')} value={row.infant}
          onChange={e => onChange({ infant: e.target.value })} />
      </RowInputs>

      <RowInputs label={t('childWithBed')} icon={<Baby className="w-3 h-3 text-purple-500" />}>
        <Age from={row.child_with_bed_age_from} to={row.child_with_bed_age_to} onChange={(f,t2)=>onChange({child_with_bed_age_from:f,child_with_bed_age_to:t2})} t={t}/>
        <input type="number" step="0.01" className={cellCls} placeholder={t('price')} value={row.child_with_bed}
          onChange={e => onChange({ child_with_bed: e.target.value })} />
      </RowInputs>

      <RowInputs label={t('childNoBed')} icon={<Baby className="w-3 h-3 text-orange-500" />}>
        <Age from={row.child_no_bed_age_from} to={row.child_no_bed_age_to} onChange={(f,t2)=>onChange({child_no_bed_age_from:f,child_no_bed_age_to:t2})} t={t}/>
        <input type="number" step="0.01" className={cellCls} placeholder={t('price')} value={row.child_no_bed}
          onChange={e => onChange({ child_no_bed: e.target.value })} />
      </RowInputs>

      <RowInputs label={t('childBreakfast')} icon={<Coffee className="w-3 h-3 text-rose-500" />}>
        <Age from={row.child_breakfast_age_from} to={row.child_breakfast_age_to} onChange={(f,t2)=>onChange({child_breakfast_age_from:f,child_breakfast_age_to:t2})} t={t}/>
        <input type="number" step="0.01" className={cellCls} placeholder={t('price')} value={row.child_breakfast}
          onChange={e => onChange({ child_breakfast: e.target.value })} />
      </RowInputs>
    </div>
  );
}

function RowInputs({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-32 flex items-center gap-1 text-gray-700 font-medium">{icon} {label}</span>
      {children}
    </div>
  );
}

function Age({ from, to, onChange, t }: { from: number; to: number; onChange: (f: number, t: number) => void; t: ReturnType<typeof useT> }) {
  return (
    <div className="flex items-center gap-1">
      <input type="number" min={0} max={18} className={ageInputCls} placeholder={t('ageFrom')} value={from} onChange={e => onChange(Number(e.target.value) || 0, to)} />
      <span className="text-gray-400 text-[10px]">→</span>
      <input type="number" min={0} max={18} className={ageInputCls} placeholder={t('ageTo')} value={to} onChange={e => onChange(from, Number(e.target.value) || 0)} />
    </div>
  );
}
