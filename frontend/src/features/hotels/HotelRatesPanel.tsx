import { useEffect, useMemo, useState } from 'react';
import {
  BedDouble, Building2, Calculator, Calendar, CalendarDays, ChevronRight, DollarSign,
  Edit, Loader2, Plus, Save, Trash2, TrendingUp, Waves, X,
} from 'lucide-react';
import { PriceCalculatorModal } from './PriceCalculatorModal';
import { useLanguage } from '../../hooks/useLanguage';
import { apiFetch } from '../../services/apiFetch';
import {
  hotelRatesApi,
  type HotelSeason,
  type RoomCategory,
  type RoomRate,
  type HotelSurcharge,
  type ViewType,
  type BaseType,
  type PricingTier,
  type DayType,
  type Occupancy,
} from '../../services/hotelRatesApi';

// ─── i18n ─────────────────────────────────────────────────
const T_STR = {
  ar: {
    title: 'كتيب أسعار الفنادق',
    subtitle: 'إدارة فئات الغرف، المواسم، والأسعار حسب FIT/GIT/Weekday/Weekend',
    selectHotel: 'اختر فندقاً',
    noHotelSelected: 'الرجاء اختيار فندق لعرض كتيب الأسعار',
    sectionCategories: 'فئات الغرف',
    sectionSeasons: 'المواسم',
    sectionRates: 'جدول الأسعار',
    sectionSurcharges: 'الرسوم الإضافية',
    addCategory: 'إضافة فئة',
    addSeason: 'إضافة موسم',
    addRate: 'إضافة سعر',
    addSurcharge: 'إضافة رسم',
    addRange: 'نطاق تاريخي',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    loading: 'جاري التحميل…',
    saving: 'جاري الحفظ…',
    name: 'الاسم',
    nameAr: 'الاسم بالعربية',
    baseType: 'النوع',
    viewType: 'الإطلالة',
    pax: 'عدد الأشخاص',
    maxOccupancy: 'أقصى إشغال',
    bedConfig: 'تركيب الأسرّة',
    isPackage: 'باقة شاملة',
    description: 'الوصف',
    sortOrder: 'الترتيب',
    isActive: 'نشط',
    seasonName: 'اسم الموسم',
    seasonType: 'نوع الموسم',
    seasonNotes: 'ملاحظات',
    startDate: 'من تاريخ',
    endDate: 'إلى تاريخ',
    rangeLabel: 'تسمية النطاق',
    pricingTier: 'طبقة التسعير',
    dayType: 'نوع اليوم',
    occupancy: 'الإشغال',
    season: 'الموسم',
    flatRate: '— سعر ثابت —',
    baseRate: 'السعر الأساسي',
    rateBf: 'سعر مع الإفطار',
    extraBed: 'سرير إضافي',
    kidBf: 'فطور طفل',
    kidBfFree: 'مجاني',
    kidBfAge: 'الحد العمري',
    taxIncl: 'يشمل الضريبة',
    markupPct: 'نسبة الربح %',
    currency: 'العملة',
    notes: 'ملاحظات',
    surchargeName: 'تسمية الرسم',
    surchargeType: 'نوع الرسم',
    amount: 'المبلغ / النسبة',
    weekday: 'يوم الأسبوع',
    appliesToTier: 'ينطبق على طبقة',
    confirmDelete: 'هل أنت متأكد من الحذف؟',
    saveFail: 'فشل الحفظ',
    saveOk: 'تم الحفظ',
    deleteOk: 'تم الحذف',
    deleteFail: 'فشل الحذف',
    none: '—',
    noCategories: 'لا توجد فئات غرف بعد',
    noSeasons: 'لا توجد مواسم بعد (سيتم استخدام السعر الثابت)',
    noRates: 'لا توجد أسعار بعد',
    rates: 'أسعار',
    inclusions: 'محتويات الباقة',
    addInclusion: 'إضافة محتوى',
    label: 'التسمية',
    quantity: 'الكمية',
    unit: 'الوحدة',
  },
  en: {
    title: 'Hotel Rate Sheet',
    subtitle: 'Manage room categories, seasons, and FIT/GIT/Weekday/Weekend pricing',
    selectHotel: 'Select a hotel',
    noHotelSelected: 'Please select a hotel to view its rate sheet',
    sectionCategories: 'Room Categories',
    sectionSeasons: 'Seasons',
    sectionRates: 'Rate Matrix',
    sectionSurcharges: 'Surcharges',
    addCategory: 'Add Category',
    addSeason: 'Add Season',
    addRate: 'Add Rate',
    addSurcharge: 'Add Surcharge',
    addRange: 'Date Range',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading…',
    saving: 'Saving…',
    name: 'Name',
    nameAr: 'Arabic name',
    baseType: 'Type',
    viewType: 'View',
    pax: 'Pax',
    maxOccupancy: 'Max occupancy',
    bedConfig: 'Bed config',
    isPackage: 'Package deal',
    description: 'Description',
    sortOrder: 'Sort order',
    isActive: 'Active',
    seasonName: 'Season name',
    seasonType: 'Season type',
    seasonNotes: 'Notes',
    startDate: 'Start date',
    endDate: 'End date',
    rangeLabel: 'Range label',
    pricingTier: 'Pricing tier',
    dayType: 'Day type',
    occupancy: 'Occupancy',
    season: 'Season',
    flatRate: '— Flat year-round —',
    baseRate: 'Base rate',
    rateBf: 'With breakfast',
    extraBed: 'Extra bed',
    kidBf: 'Kid breakfast',
    kidBfFree: 'Free',
    kidBfAge: 'Age limit',
    taxIncl: 'Tax inclusive',
    markupPct: 'Markup %',
    currency: 'Currency',
    notes: 'Notes',
    surchargeName: 'Label',
    surchargeType: 'Type',
    amount: 'Amount / %',
    weekday: 'Weekday',
    appliesToTier: 'Applies to tier',
    confirmDelete: 'Are you sure?',
    saveFail: 'Save failed',
    saveOk: 'Saved',
    deleteOk: 'Deleted',
    deleteFail: 'Delete failed',
    none: '—',
    noCategories: 'No room categories yet',
    noSeasons: 'No seasons yet (flat rate will apply)',
    noRates: 'No rates yet',
    rates: 'rates',
    inclusions: 'Package inclusions',
    addInclusion: 'Add inclusion',
    label: 'Label',
    quantity: 'Qty',
    unit: 'Unit',
  },
  ms: {
    title: 'Helaian Kadar Hotel',
    subtitle: 'Urus kategori bilik, musim, dan harga FIT/GIT/Weekday/Weekend',
    selectHotel: 'Pilih hotel',
    noHotelSelected: 'Sila pilih hotel untuk melihat helaian kadar',
    sectionCategories: 'Kategori Bilik',
    sectionSeasons: 'Musim',
    sectionRates: 'Matriks Kadar',
    sectionSurcharges: 'Caj Tambahan',
    addCategory: 'Tambah Kategori',
    addSeason: 'Tambah Musim',
    addRate: 'Tambah Kadar',
    addSurcharge: 'Tambah Caj',
    addRange: 'Julat Tarikh',
    edit: 'Edit',
    delete: 'Padam',
    save: 'Simpan',
    cancel: 'Batal',
    loading: 'Memuatkan…',
    saving: 'Menyimpan…',
    name: 'Nama',
    nameAr: 'Nama Arab',
    baseType: 'Jenis',
    viewType: 'Pemandangan',
    pax: 'Bilangan',
    maxOccupancy: 'Penghuni Maks',
    bedConfig: 'Konfigurasi katil',
    isPackage: 'Pakej',
    description: 'Penerangan',
    sortOrder: 'Susunan',
    isActive: 'Aktif',
    seasonName: 'Nama musim',
    seasonType: 'Jenis musim',
    seasonNotes: 'Nota',
    startDate: 'Tarikh mula',
    endDate: 'Tarikh tamat',
    rangeLabel: 'Label julat',
    pricingTier: 'Lapisan harga',
    dayType: 'Jenis hari',
    occupancy: 'Penghuni',
    season: 'Musim',
    flatRate: '— Sepanjang tahun —',
    baseRate: 'Harga asas',
    rateBf: 'Dengan sarapan',
    extraBed: 'Katil tambahan',
    kidBf: 'Sarapan kanak',
    kidBfFree: 'Percuma',
    kidBfAge: 'Had umur',
    taxIncl: 'Termasuk cukai',
    markupPct: 'Margin %',
    currency: 'Mata wang',
    notes: 'Nota',
    surchargeName: 'Label',
    surchargeType: 'Jenis',
    amount: 'Jumlah / %',
    weekday: 'Hari',
    appliesToTier: 'Untuk lapisan',
    confirmDelete: 'Pasti?',
    saveFail: 'Gagal simpan',
    saveOk: 'Disimpan',
    deleteOk: 'Dipadam',
    deleteFail: 'Gagal padam',
    none: '—',
    noCategories: 'Tiada kategori bilik',
    noSeasons: 'Tiada musim (kadar tetap akan digunakan)',
    noRates: 'Tiada kadar',
    rates: 'kadar',
    inclusions: 'Kandungan pakej',
    addInclusion: 'Tambah kandungan',
    label: 'Label',
    quantity: 'Kuantiti',
    unit: 'Unit',
  },
} as const;

type Lang = keyof typeof T_STR;
function useT() {
  const { lang } = useLanguage();
  const ll = (lang as Lang) in T_STR ? (lang as Lang) : 'ar';
  return (k: keyof typeof T_STR['ar']) => T_STR[ll][k];
}

// ─── Choice options (mirror backend enums) ────────────────
const BASE_TYPES: { value: BaseType; label: string }[] = [
  { value: 'room',      label: 'Room' },
  { value: 'suite',     label: 'Suite' },
  { value: 'villa',     label: 'Villa' },
  { value: 'chalet',    label: 'Chalet' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'bungalow',  label: 'Bungalow' },
  { value: 'package',   label: 'Package' },
];
const VIEW_TYPES: { value: ViewType; label: string }[] = [
  { value: 'standard',   label: 'Standard' },
  { value: 'sea',        label: 'Sea View' },
  { value: 'hill',       label: 'Hill View' },
  { value: 'garden',     label: 'Garden' },
  { value: 'pool',       label: 'Pool' },
  { value: 'city',       label: 'City' },
  { value: 'klcc',       label: 'KLCC' },
  { value: 'kl_tower',   label: 'KL Tower' },
  { value: 'beach',      label: 'Beach' },
  { value: 'lagoon',     label: 'Lagoon' },
  { value: 'beachfront', label: 'Beachfront' },
  { value: 'runaway',    label: 'Runaway' },
  { value: 'street',     label: 'Street' },
  { value: 'other',      label: 'Other' },
];
const TIERS: { value: PricingTier; label: string }[] = [
  { value: 'fit',         label: 'FIT' },
  { value: 'fit_normal',  label: 'FIT Normal' },
  { value: 'fit_promo',   label: 'FIT Promo' },
  { value: 'git',         label: 'GIT' },
  { value: 'git_normal',  label: 'GIT Normal' },
  { value: 'git_series',  label: 'GIT Series' },
];
const DAY_TYPES: { value: DayType; label: string }[] = [
  { value: 'all',     label: 'All days' },
  { value: 'weekday', label: 'Weekday' },
  { value: 'weekend', label: 'Weekend' },
];
const OCCUPANCIES: { value: Occupancy; label: string }[] = [
  { value: 'single', label: 'Single' },
  { value: 'double', label: 'Double' },
  { value: 'triple', label: 'Triple' },
  { value: 'quad',   label: 'Quad' },
];
const SEASON_TYPES = ['flat', 'low', 'shoulder', 'normal', 'high', 'peak', 'super_peak', 'tactical_promo'] as const;

interface Hotel {
  id: number;
  name: string;
  city?: number;
  hotel_chain?: string;
  default_margin_pct?: string;
}

// ═══════════════════════════════════════════════════════════
// Main panel
// ═══════════════════════════════════════════════════════════
export function HotelRatesPanel() {
  const t = useT();
  const { isRTL, lang } = useLanguage();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [seasons, setSeasons] = useState<HotelSeason[]>([]);
  const [rates, setRates] = useState<RoomRate[]>([]);
  const [surcharges, setSurcharges] = useState<HotelSurcharge[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  // Modal state
  const [editingCategory, setEditingCategory] = useState<RoomCategory | 'new' | null>(null);
  const [editingSeason, setEditingSeason] = useState<HotelSeason | 'new' | null>(null);
  const [editingRate, setEditingRate] = useState<RoomRate | { categoryId: number } | null>(null);
  const [editingSurcharge, setEditingSurcharge] = useState<HotelSurcharge | 'new' | null>(null);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  useEffect(() => {
    apiFetch('/api/v1/hotels/').then(r => r.ok ? r.json() : null).then(d => {
      if (!d) return;
      const list: Hotel[] = Array.isArray(d) ? d : (d.results || []);
      setHotels(list);
      if (list.length && !selectedHotelId) setSelectedHotelId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedHotelId) return;
    setLoading(true);
    Promise.all([
      hotelRatesApi.listCategories({ hotel: selectedHotelId }),
      hotelRatesApi.listSeasons({ hotel: selectedHotelId }),
      hotelRatesApi.listRates({ hotel: selectedHotelId }),
      hotelRatesApi.listSurcharges({ hotel: selectedHotelId }).catch(() => []),
    ])
      .then(([c, s, r, sc]) => { setCategories(c); setSeasons(s); setRates(r); setSurcharges(sc); })
      .catch(e => setToast({ type: 'err', msg: String(e) }))
      .finally(() => setLoading(false));
  }, [selectedHotelId]);

  const showToast = (type: 'ok' | 'err', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const reload = async () => {
    if (!selectedHotelId) return;
    const [c, s, r, sc] = await Promise.all([
      hotelRatesApi.listCategories({ hotel: selectedHotelId }),
      hotelRatesApi.listSeasons({ hotel: selectedHotelId }),
      hotelRatesApi.listRates({ hotel: selectedHotelId }),
      hotelRatesApi.listSurcharges({ hotel: selectedHotelId }).catch(() => []),
    ]);
    setCategories(c); setSeasons(s); setRates(r); setSurcharges(sc);
  };

  const ratesByCategory = useMemo(() => {
    const m: Record<number, RoomRate[]> = {};
    for (const r of rates) (m[r.room_category] ||= []).push(r);
    return m;
  }, [rates]);

  const align = isRTL ? 'text-right' : 'text-left';

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {toast && (
        <div className={`fixed top-4 ${isRTL ? 'left-4' : 'right-4'} z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'ok' ? 'bg-emerald-600' : 'bg-red-600'
        } text-white text-sm`}>{toast.msg}</div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className={align}>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-blue-600" /> {t('title')}
          </h2>
          <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCalculatorOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition shadow-md">
            <Calculator className="w-4 h-4" />
            {lang === 'ar' ? 'الآلة الحاسبة' : lang === 'en' ? 'Calculator' : 'Kalkulator'}
          </button>
          <Building2 className="w-4 h-4 text-gray-500" />
          <select
            value={selectedHotelId ?? ''}
            onChange={e => setSelectedHotelId(Number(e.target.value) || null)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white min-w-[200px]"
          >
            <option value="">{t('selectHotel')}</option>
            {hotels.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedHotelId ? (
        <EmptyState icon={<Building2 className="w-12 h-12 text-gray-300" />} text={t('noHotelSelected')} />
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Section: Seasons */}
          <Section
            icon={<Calendar className="w-4 h-4 text-purple-600" />}
            title={`${t('sectionSeasons')} (${seasons.length})`}
            action={<HeaderButton onClick={() => setEditingSeason('new')} icon={<Plus className="w-3.5 h-3.5"/>}>{t('addSeason')}</HeaderButton>}
          >
            {seasons.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">{t('noSeasons')}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {seasons.map(s => (
                  <SeasonCard
                    key={s.id} season={s}
                    onEdit={() => setEditingSeason(s)}
                    onDelete={async () => {
                      if (!confirm(t('confirmDelete'))) return;
                      try { await hotelRatesApi.deleteSeason(s.id); await reload(); showToast('ok', t('deleteOk')); }
                      catch (e) { showToast('err', String(e)); }
                    }}
                    onAddRange={async () => {
                      const start = prompt(t('startDate') + ' (YYYY-MM-DD)');
                      if (!start) return;
                      const end = prompt(t('endDate') + ' (YYYY-MM-DD)');
                      if (!end) return;
                      const label = prompt(t('rangeLabel') + ' (optional)') || '';
                      try { await hotelRatesApi.createSeasonRange({ season: s.id, start_date: start, end_date: end, label }); await reload(); showToast('ok', t('saveOk')); }
                      catch (e) { showToast('err', String(e)); }
                    }}
                    onDeleteRange={async (id) => {
                      try { await hotelRatesApi.deleteSeasonRange(id); await reload(); }
                      catch (e) { showToast('err', String(e)); }
                    }}
                    t={t}
                  />
                ))}
              </div>
            )}
          </Section>

          {/* Section: Categories */}
          <Section
            icon={<BedDouble className="w-4 h-4 text-blue-600" />}
            title={`${t('sectionCategories')} (${categories.length})`}
            action={<HeaderButton onClick={() => setEditingCategory('new')} icon={<Plus className="w-3.5 h-3.5"/>}>{t('addCategory')}</HeaderButton>}
          >
            {categories.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">{t('noCategories')}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map(c => (
                  <CategoryCard
                    key={c.id} category={c} rates={ratesByCategory[c.id] || []}
                    seasons={seasons} t={t}
                    onEdit={() => setEditingCategory(c)}
                    onDelete={async () => {
                      if (!confirm(t('confirmDelete'))) return;
                      try { await hotelRatesApi.deleteCategory(c.id); await reload(); showToast('ok', t('deleteOk')); }
                      catch (e) { showToast('err', String(e)); }
                    }}
                    onAddRate={() => setEditingRate({ categoryId: c.id })}
                    onEditRate={(r) => setEditingRate(r)}
                    onDeleteRate={async (id) => {
                      if (!confirm(t('confirmDelete'))) return;
                      try { await hotelRatesApi.deleteRate(id); await reload(); showToast('ok', t('deleteOk')); }
                      catch (e) { showToast('err', String(e)); }
                    }}
                  />
                ))}
              </div>
            )}
          </Section>

          {/* Section: Surcharges */}
          <Section
            icon={<TrendingUp className="w-4 h-4 text-amber-600" />}
            title={`${t('sectionSurcharges')} (${surcharges.length})`}
            action={<HeaderButton onClick={() => setEditingSurcharge('new')} icon={<Plus className="w-3.5 h-3.5"/>}>{t('addSurcharge')}</HeaderButton>}
          >
            {surcharges.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">—</p>
            ) : (
              <div className="space-y-2">
                {surcharges.map(s => (
                  <SurchargeRow key={s.id} s={s} t={t} onDelete={async () => {
                    if (!confirm(t('confirmDelete'))) return;
                    try { await hotelRatesApi.deleteSurcharge(s.id); await reload(); showToast('ok', t('deleteOk')); }
                    catch (e) { showToast('err', String(e)); }
                  }} />
                ))}
              </div>
            )}
          </Section>
        </>
      )}

      {/* Modals */}
      {editingCategory && selectedHotelId && (
        <CategoryModal
          hotelId={selectedHotelId}
          category={editingCategory === 'new' ? null : editingCategory}
          onClose={() => setEditingCategory(null)}
          onSaved={async () => { await reload(); showToast('ok', t('saveOk')); setEditingCategory(null); }}
          onError={(e) => showToast('err', String(e))}
          t={t}
        />
      )}
      {editingSeason && selectedHotelId && (
        <SeasonModal
          hotelId={selectedHotelId}
          season={editingSeason === 'new' ? null : editingSeason}
          onClose={() => setEditingSeason(null)}
          onSaved={async () => { await reload(); showToast('ok', t('saveOk')); setEditingSeason(null); }}
          onError={(e) => showToast('err', String(e))}
          t={t}
        />
      )}
      {editingRate && (
        <RateModal
          rate={'id' in editingRate ? editingRate : null}
          categoryId={'categoryId' in editingRate ? editingRate.categoryId : (editingRate as RoomRate).room_category}
          seasons={seasons}
          onClose={() => setEditingRate(null)}
          onSaved={async () => { await reload(); showToast('ok', t('saveOk')); setEditingRate(null); }}
          onError={(e) => showToast('err', String(e))}
          t={t}
        />
      )}
      {editingSurcharge && selectedHotelId && (
        <SurchargeModal
          hotelId={selectedHotelId}
          categories={categories}
          surcharge={editingSurcharge === 'new' ? null : editingSurcharge}
          onClose={() => setEditingSurcharge(null)}
          onSaved={async () => { await reload(); showToast('ok', t('saveOk')); setEditingSurcharge(null); }}
          onError={(e) => showToast('err', String(e))}
          t={t}
        />
      )}

      {/* Calculator Modal */}
      {calculatorOpen && (
        <PriceCalculatorModal
          initialHotelId={selectedHotelId ?? undefined}
          onClose={() => setCalculatorOpen(false)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════

function Section({ icon, title, action, children }: {
  icon: React.ReactNode; title: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function HeaderButton({ children, icon, onClick }: { children: React.ReactNode; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition">
      {icon} {children}
    </button>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 flex flex-col items-center gap-3">
      {icon}
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}

function SeasonCard({ season, onEdit, onDelete, onAddRange, onDeleteRange, t }: {
  season: HotelSeason;
  onEdit: () => void;
  onDelete: () => void;
  onAddRange: () => void;
  onDeleteRange: (id: number) => void;
  t: ReturnType<typeof useT>;
}) {
  const colors: Record<string, string> = {
    flat: 'bg-gray-100 text-gray-700', low: 'bg-blue-100 text-blue-700',
    shoulder: 'bg-cyan-100 text-cyan-700', normal: 'bg-emerald-100 text-emerald-700',
    high: 'bg-amber-100 text-amber-700', peak: 'bg-orange-100 text-orange-700',
    super_peak: 'bg-red-100 text-red-700', tactical_promo: 'bg-purple-100 text-purple-700',
  };
  return (
    <div className="border border-gray-200 rounded-xl p-3 bg-gradient-to-br from-white to-gray-50">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-medium text-sm">{season.name}</div>
          <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded mt-1 ${colors[season.season_type] || 'bg-gray-100'}`}>
            {season.season_type_display || season.season_type}
          </span>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-1 text-gray-400 hover:text-blue-600"><Edit className="w-3.5 h-3.5"/></button>
          <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
        </div>
      </div>
      <div className="space-y-1">
        {season.date_ranges.map(r => (
          <div key={r.id} className="flex items-center justify-between text-xs text-gray-600 bg-white rounded px-2 py-1 border border-gray-100">
            <span>{r.start_date} → {r.end_date}{r.label ? ` (${r.label})` : ''}</span>
            <button onClick={() => onDeleteRange(r.id)} className="text-gray-300 hover:text-red-600">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button onClick={onAddRange} className="w-full text-xs text-blue-600 hover:bg-blue-50 rounded py-1 flex items-center justify-center gap-1">
          <Plus className="w-3 h-3"/> {t('addRange')}
        </button>
      </div>
      {season.notes && <p className="text-xs text-gray-400 mt-2 italic">{season.notes}</p>}
    </div>
  );
}

function CategoryCard({ category, rates, seasons, onEdit, onDelete, onAddRate, onEditRate, onDeleteRate, t }: {
  category: RoomCategory;
  rates: RoomRate[];
  seasons: HotelSeason[];
  onEdit: () => void;
  onDelete: () => void;
  onAddRate: () => void;
  onEditRate: (r: RoomRate) => void;
  onDeleteRate: (id: number) => void;
  t: ReturnType<typeof useT>;
}) {
  const seasonNameById = useMemo(() => {
    const m: Record<number, string> = {};
    for (const s of seasons) m[s.id] = s.name;
    return m;
  }, [seasons]);

  return (
    <div className="border border-gray-200 rounded-2xl p-4 bg-white hover:shadow-md transition">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-gray-900">{category.name}</h4>
            {category.is_package && (
              <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">PACKAGE</span>
            )}
            {category.view_type !== 'standard' && (
              <span className="text-[10px] px-1.5 py-0.5 bg-cyan-100 text-cyan-700 rounded">
                {category.view_type_display || category.view_type}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {category.base_type_display || category.base_type} · {category.pax} pax
            {category.bed_config ? ` · ${category.bed_config}` : ''}
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-blue-600"><Edit className="w-4 h-4"/></button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
        </div>
      </div>

      {/* Inclusions for packages */}
      {category.is_package && category.inclusions.length > 0 && (
        <div className="mb-3 bg-amber-50 border border-amber-100 rounded-lg p-2">
          <p className="text-[10px] font-semibold text-amber-700 mb-1">{t('inclusions')}:</p>
          <ul className="space-y-0.5">
            {category.inclusions.map(i => (
              <li key={i.id} className="text-xs text-amber-800 flex items-center gap-1">
                <ChevronRight className="w-3 h-3" /> {i.label} × {i.quantity} {i.unit_display || i.unit}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rates table */}
      <div className="border-t border-gray-100 pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700">{rates.length} {t('rates')}</span>
          <button onClick={onAddRate} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            <Plus className="w-3 h-3"/> {t('addRate')}
          </button>
        </div>
        {rates.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-2">{t('noRates')}</p>
        ) : (
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {rates.map(r => (
              <div key={r.id} className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1.5 hover:bg-gray-100 transition">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-700">{r.pricing_tier_display || r.pricing_tier}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-600">{r.season ? seasonNameById[r.season] || `S${r.season}` : t('flatRate')}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-600">{r.day_type_display || r.day_type}</span>
                  {r.occupancy !== 'double' && <span className="text-purple-600">{r.occupancy}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">
                    {r.currency} {Number(r.base_rate).toFixed(0)}{!r.tax_inclusive ? '++' : ''}
                  </span>
                  <button onClick={() => onEditRate(r)} className="text-gray-400 hover:text-blue-600">
                    <Edit className="w-3 h-3"/>
                  </button>
                  <button onClick={() => onDeleteRate(r.id)} className="text-gray-400 hover:text-red-600">
                    <Trash2 className="w-3 h-3"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SurchargeRow({ s, onDelete, t }: { s: HotelSurcharge; onDelete: () => void; t: ReturnType<typeof useT> }) {
  const sign = s.surcharge_type === 'percentage' ? '%' : 'RM';
  return (
    <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
      <div className="flex items-center gap-3 flex-1 flex-wrap">
        <Waves className="w-4 h-4 text-amber-600 flex-shrink-0"/>
        <span className="text-sm font-medium text-gray-900">{s.name}</span>
        <span className="text-sm font-bold text-amber-700">+{s.amount}{sign}</span>
        {s.weekday !== null && (
          <span className="text-xs px-1.5 py-0.5 bg-white rounded border border-amber-200">
            {s.weekday_display || `WD ${s.weekday}`}
          </span>
        )}
        {s.date_start && (
          <span className="text-xs text-gray-600">
            {s.date_start}{s.date_end && s.date_end !== s.date_start ? ` → ${s.date_end}` : ''}
          </span>
        )}
        {s.applies_to_tier && (
          <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">{s.applies_to_tier}</span>
        )}
      </div>
      <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-600">
        <Trash2 className="w-4 h-4"/>
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Modals
// ═══════════════════════════════════════════════════════════

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-700 mb-1 block">{label}</span>
      {children}
    </label>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none';

function SaveBar({ onCancel, onSave, saving, t }: { onCancel: () => void; onSave: () => void; saving: boolean; t: ReturnType<typeof useT> }) {
  return (
    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
      <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded">
        {t('cancel')}
      </button>
      <button onClick={onSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-60">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Save className="w-3.5 h-3.5"/>}
        {saving ? t('saving') : t('save')}
      </button>
    </div>
  );
}

// ─── Category modal ──────────────────────────────────────
function CategoryModal({ hotelId, category, onClose, onSaved, onError, t }: {
  hotelId: number; category: RoomCategory | null;
  onClose: () => void; onSaved: () => void; onError: (e: string) => void;
  t: ReturnType<typeof useT>;
}) {
  const [form, setForm] = useState({
    name: category?.name || '',
    name_ar: category?.name_ar || '',
    base_type: (category?.base_type || 'room') as BaseType,
    view_type: (category?.view_type || 'standard') as ViewType,
    pax: category?.pax ?? 2,
    max_occupancy: category?.max_occupancy ?? 2,
    bed_config: category?.bed_config || '',
    is_package: category?.is_package || false,
    description: category?.description || '',
    sort_order: category?.sort_order ?? 0,
    is_active: category?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (category) await hotelRatesApi.updateCategory(category.id, form);
      else await hotelRatesApi.createCategory({ ...form, hotel: hotelId });
      onSaved();
    } catch (e) { onError(String(e)); }
    finally { setSaving(false); }
  };

  return (
    <ModalShell title={category ? t('edit') : t('addCategory')} onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('name')}>
            <input className={inputCls} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </Field>
          <Field label={t('nameAr')}>
            <input className={inputCls} value={form.name_ar} onChange={e => setForm({...form, name_ar: e.target.value})} />
          </Field>
          <Field label={t('baseType')}>
            <select className={inputCls} value={form.base_type} onChange={e => setForm({...form, base_type: e.target.value as BaseType})}>
              {BASE_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label={t('viewType')}>
            <select className={inputCls} value={form.view_type} onChange={e => setForm({...form, view_type: e.target.value as ViewType})}>
              {VIEW_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label={t('pax')}>
            <input type="number" min={1} className={inputCls} value={form.pax} onChange={e => setForm({...form, pax: Number(e.target.value)})} />
          </Field>
          <Field label={t('maxOccupancy')}>
            <input type="number" min={1} className={inputCls} value={form.max_occupancy} onChange={e => setForm({...form, max_occupancy: Number(e.target.value)})} />
          </Field>
          <Field label={t('bedConfig')}>
            <input className={inputCls} value={form.bed_config} onChange={e => setForm({...form, bed_config: e.target.value})} placeholder="1 King + Sofa Bed"/>
          </Field>
          <Field label={t('sortOrder')}>
            <input type="number" className={inputCls} value={form.sort_order} onChange={e => setForm({...form, sort_order: Number(e.target.value)})} />
          </Field>
        </div>
        <Field label={t('description')}>
          <textarea rows={3} className={inputCls} value={form.description} onChange={e => setForm({...form, description: e.target.value})}/>
        </Field>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_package} onChange={e => setForm({...form, is_package: e.target.checked})}/>
            {t('isPackage')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})}/>
            {t('isActive')}
          </label>
        </div>
        <SaveBar onCancel={onClose} onSave={save} saving={saving} t={t}/>
      </div>
    </ModalShell>
  );
}

// ─── Season modal ────────────────────────────────────────
function SeasonModal({ hotelId, season, onClose, onSaved, onError, t }: {
  hotelId: number; season: HotelSeason | null;
  onClose: () => void; onSaved: () => void; onError: (e: string) => void;
  t: ReturnType<typeof useT>;
}) {
  const [form, setForm] = useState({
    name: season?.name || '',
    season_type: season?.season_type || 'flat',
    sort_order: season?.sort_order ?? 0,
    notes: season?.notes || '',
    is_active: season?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (season) await hotelRatesApi.updateSeason(season.id, form);
      else await hotelRatesApi.createSeason({ ...form, hotel: hotelId });
      onSaved();
    } catch (e) { onError(String(e)); }
    finally { setSaving(false); }
  };

  return (
    <ModalShell title={season ? t('edit') : t('addSeason')} onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('seasonName')}>
            <input className={inputCls} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </Field>
          <Field label={t('seasonType')}>
            <select className={inputCls} value={form.season_type} onChange={e => setForm({...form, season_type: e.target.value as typeof form.season_type})}>
              {SEASON_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label={t('sortOrder')}>
            <input type="number" className={inputCls} value={form.sort_order} onChange={e => setForm({...form, sort_order: Number(e.target.value)})} />
          </Field>
          <label className="flex items-end gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})}/>
            {t('isActive')}
          </label>
        </div>
        <Field label={t('seasonNotes')}>
          <input className={inputCls} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Apr–Jun + Sept March"/>
        </Field>
        <p className="text-xs text-gray-500 italic">
          💡 {t('startDate')} ranges يمكن إضافتها بعد حفظ الموسم.
        </p>
        <SaveBar onCancel={onClose} onSave={save} saving={saving} t={t}/>
      </div>
    </ModalShell>
  );
}

// ─── Rate modal ──────────────────────────────────────────
function RateModal({ rate, categoryId, seasons, onClose, onSaved, onError, t }: {
  rate: RoomRate | null; categoryId: number; seasons: HotelSeason[];
  onClose: () => void; onSaved: () => void; onError: (e: string) => void;
  t: ReturnType<typeof useT>;
}) {
  const [form, setForm] = useState({
    season: rate?.season ?? null as number | null,
    pricing_tier: (rate?.pricing_tier || 'fit') as PricingTier,
    day_type: (rate?.day_type || 'all') as DayType,
    occupancy: (rate?.occupancy || 'double') as Occupancy,
    base_rate: rate?.base_rate || '',
    rate_with_breakfast: rate?.rate_with_breakfast || '',
    extra_bed_price: rate?.extra_bed_price || '',
    kid_breakfast_price: rate?.kid_breakfast_price || '',
    kid_breakfast_free: rate?.kid_breakfast_free ?? false,
    kid_breakfast_age_limit: rate?.kid_breakfast_age_limit ?? null as number | null,
    tax_inclusive: rate?.tax_inclusive ?? true,
    markup_pct: rate?.markup_pct || '10',
    currency: rate?.currency || 'MYR',
    notes: rate?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.base_rate) { onError(t('baseRate')); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        room_category: categoryId,
        rate_with_breakfast: form.rate_with_breakfast || null,
        extra_bed_price: form.extra_bed_price || null,
        kid_breakfast_price: form.kid_breakfast_price || null,
      };
      if (rate) await hotelRatesApi.updateRate(rate.id, payload as Partial<RoomRate>);
      else await hotelRatesApi.createRate(payload as Partial<RoomRate>);
      onSaved();
    } catch (e) { onError(String(e)); }
    finally { setSaving(false); }
  };

  return (
    <ModalShell title={rate ? t('edit') : t('addRate')} onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('season')}>
            <select className={inputCls} value={form.season ?? ''} onChange={e => setForm({...form, season: e.target.value ? Number(e.target.value) : null})}>
              <option value="">{t('flatRate')}</option>
              {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label={t('pricingTier')}>
            <select className={inputCls} value={form.pricing_tier} onChange={e => setForm({...form, pricing_tier: e.target.value as PricingTier})}>
              {TIERS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label={t('dayType')}>
            <select className={inputCls} value={form.day_type} onChange={e => setForm({...form, day_type: e.target.value as DayType})}>
              {DAY_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label={t('occupancy')}>
            <select className={inputCls} value={form.occupancy} onChange={e => setForm({...form, occupancy: e.target.value as Occupancy})}>
              {OCCUPANCIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label={`${t('baseRate')} *`}>
            <input className={inputCls} value={form.base_rate} onChange={e => setForm({...form, base_rate: e.target.value})} placeholder="310.00"/>
          </Field>
          <Field label={t('rateBf')}>
            <input className={inputCls} value={form.rate_with_breakfast} onChange={e => setForm({...form, rate_with_breakfast: e.target.value})} placeholder="optional"/>
          </Field>
          <Field label={t('extraBed')}>
            <input className={inputCls} value={form.extra_bed_price} onChange={e => setForm({...form, extra_bed_price: e.target.value})}/>
          </Field>
          <Field label={t('kidBf')}>
            <input className={inputCls} value={form.kid_breakfast_price} onChange={e => setForm({...form, kid_breakfast_price: e.target.value})}/>
          </Field>
          <Field label={t('markupPct')}>
            <input className={inputCls} value={form.markup_pct} onChange={e => setForm({...form, markup_pct: e.target.value})}/>
          </Field>
          <Field label={t('currency')}>
            <input className={inputCls} value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}/>
          </Field>
        </div>
        <div className="flex gap-4 flex-wrap items-end">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.tax_inclusive} onChange={e => setForm({...form, tax_inclusive: e.target.checked})}/>
            {t('taxIncl')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.kid_breakfast_free} onChange={e => setForm({...form, kid_breakfast_free: e.target.checked})}/>
            {t('kidBfFree')}
          </label>
          {form.kid_breakfast_free && (
            <Field label={t('kidBfAge')}>
              <input type="number" className={inputCls + ' w-20'} value={form.kid_breakfast_age_limit ?? ''} onChange={e => setForm({...form, kid_breakfast_age_limit: e.target.value ? Number(e.target.value) : null})} placeholder="6"/>
            </Field>
          )}
        </div>
        <Field label={t('notes')}>
          <input className={inputCls} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}/>
        </Field>
        <SaveBar onCancel={onClose} onSave={save} saving={saving} t={t}/>
      </div>
    </ModalShell>
  );
}

// ─── Surcharge modal ─────────────────────────────────────
function SurchargeModal({ hotelId, categories, surcharge, onClose, onSaved, onError, t }: {
  hotelId: number; categories: RoomCategory[]; surcharge: HotelSurcharge | null;
  onClose: () => void; onSaved: () => void; onError: (e: string) => void;
  t: ReturnType<typeof useT>;
}) {
  const [form, setForm] = useState({
    name: surcharge?.name || '',
    surcharge_type: surcharge?.surcharge_type || 'fixed',
    amount: surcharge?.amount || '',
    weekday: surcharge?.weekday ?? null as number | null,
    date_start: surcharge?.date_start || '',
    date_end: surcharge?.date_end || '',
    room_category: surcharge?.room_category ?? null as number | null,
    applies_to_tier: surcharge?.applies_to_tier || '',
    notes: surcharge?.notes || '',
    is_active: surcharge?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name || !form.amount) { onError(t('saveFail')); return; }
    if (form.weekday === null && !form.date_start) {
      onError('Pick a weekday OR a date range');
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<HotelSurcharge> = {
        ...form,
        hotel: hotelId,
        weekday: form.weekday,
        date_start: form.date_start || null,
        date_end: form.date_end || form.date_start || null,
      } as Partial<HotelSurcharge>;
      await hotelRatesApi.createSurcharge(payload);
      onSaved();
    } catch (e) { onError(String(e)); }
    finally { setSaving(false); }
  };

  return (
    <ModalShell title={surcharge ? t('edit') : t('addSurcharge')} onClose={onClose}>
      <div className="space-y-3">
        <Field label={`${t('surchargeName')} *`}>
          <input className={inputCls} value={form.name} onChange={e => setForm({...form, name: e.target.value})}/>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('surchargeType')}>
            <select className={inputCls} value={form.surcharge_type} onChange={e => setForm({...form, surcharge_type: e.target.value as 'fixed' | 'percentage'})}>
              <option value="fixed">Fixed RM</option>
              <option value="percentage">Percentage %</option>
            </select>
          </Field>
          <Field label={`${t('amount')} *`}>
            <input className={inputCls} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}/>
          </Field>
          <Field label={t('weekday')}>
            <select className={inputCls} value={form.weekday ?? ''} onChange={e => setForm({...form, weekday: e.target.value === '' ? null : Number(e.target.value)})}>
              <option value="">—</option>
              <option value={0}>Monday</option>
              <option value={1}>Tuesday</option>
              <option value={2}>Wednesday</option>
              <option value={3}>Thursday</option>
              <option value={4}>Friday</option>
              <option value={5}>Saturday</option>
              <option value={6}>Sunday</option>
            </select>
          </Field>
          <Field label={t('appliesToTier')}>
            <select className={inputCls} value={form.applies_to_tier} onChange={e => setForm({...form, applies_to_tier: e.target.value as PricingTier | ''})}>
              <option value="">All tiers</option>
              {TIERS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label={t('startDate')}>
            <input type="date" className={inputCls} value={form.date_start} onChange={e => setForm({...form, date_start: e.target.value})}/>
          </Field>
          <Field label={t('endDate')}>
            <input type="date" className={inputCls} value={form.date_end} onChange={e => setForm({...form, date_end: e.target.value})}/>
          </Field>
        </div>
        <Field label={t('notes')}>
          <input className={inputCls} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}/>
        </Field>
        <SaveBar onCancel={onClose} onSave={save} saving={saving} t={t}/>
      </div>
    </ModalShell>
  );
}
