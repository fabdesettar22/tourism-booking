import ActivationCard from '../../components/admin/ActivationCard';
import { apiFetch, BASE } from '../../services/apiFetch';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import {
  Plus, Search, Edit, Trash2, Car, Camera,
  Briefcase, Bus, X, Loader2, CheckCircle2, XCircle,
  AlertTriangle, MapPin, Users, CalendarDays, Tag, ToggleLeft,
  ToggleRight, ChevronLeft, ChevronRight, Grid, List, Globe,
  Upload, Gift, PlaneLanding, PlaneTakeoff
} from 'lucide-react';
import { CountryCityPicker } from '../../components/forms/CountryCityPicker';

// ─── Types ────────────────────────────────────────────────
interface City { id: number; name: string; country: number; }
interface Country { id: number; name: string; }
interface ServiceCategory { id: number; name: string; slug: string; }
interface Service {
  id: number; name: string; description: string;
  category: number; city: number;
  base_price: string; currency: string;
  discount_percentage?: string;
  breakfast_included: boolean;
  vehicle_type: string;
  max_participants: number;
  is_optional: boolean;
  is_transfer: boolean;
  relative_day: number;
  category_data: Record<string, any>;
  image?: string;
}
type ToastType = 'success' | 'error' | 'warning';
interface Toast { id: number; type: ToastType; message: string; }

// ─── Category Data Fields ────────────────────────────────
type FieldType = 'text' | 'number' | 'checkbox' | 'select' | 'time';
interface CatField {
  key: string;
  type: FieldType;
  optionsKey?: string; // مفتاح للخيارات في t('servicesMgmt.fieldOptions.*')
  hasPlaceholder?: boolean;
}

const CAT_DATA_FIELDS: Record<string, CatField[]> = {
  'airport-to-hotel': [
    { key: 'vehicle_type',  type: 'select',  optionsKey: 'vehicle_type' },
    { key: 'seats',         type: 'number',  hasPlaceholder: true },
    { key: 'flight_number', type: 'text',    hasPlaceholder: true },
    { key: 'arrival_time',  type: 'time' },
    { key: 'arabic_driver', type: 'checkbox' },
    { key: 'name_board',    type: 'checkbox' },
    { key: 'ac',            type: 'checkbox' },
  ],
  'hotel-to-airport': [
    { key: 'vehicle_type',   type: 'select',  optionsKey: 'vehicle_type' },
    { key: 'seats',          type: 'number',  hasPlaceholder: true },
    { key: 'flight_number',  type: 'text',    hasPlaceholder: true },
    { key: 'departure_time', type: 'time' },
    { key: 'arabic_driver',  type: 'checkbox' },
    { key: 'ac',             type: 'checkbox' },
    { key: 'luggage_help',   type: 'checkbox' },
  ],
  'city-tour': [
    { key: 'tour_type',      type: 'select',  optionsKey: 'tour_type' },
    { key: 'duration_hours', type: 'number',  hasPlaceholder: true },
    { key: 'language',       type: 'select',  optionsKey: 'language' },
    { key: 'sites',          type: 'text',    hasPlaceholder: true },
    { key: 'meeting_point',  type: 'text',    hasPlaceholder: true },
    { key: 'includes_entry', type: 'checkbox' },
    { key: 'includes_meal',  type: 'checkbox' },
    { key: 'includes_photo', type: 'checkbox' },
  ],
  'gifts-simcard': [
    { key: 'simcard_type',  type: 'select',  optionsKey: 'simcard_type' },
    { key: 'simcard_data',  type: 'select',  optionsKey: 'simcard_data' },
    { key: 'simcard_days',  type: 'number',  hasPlaceholder: true },
    { key: 'bouquet_color', type: 'select',  optionsKey: 'bouquet_color' },
    { key: 'bouquet_size',  type: 'select',  optionsKey: 'bouquet_size' },
    { key: 'zam_zam',       type: 'checkbox' },
    { key: 'dates',         type: 'checkbox' },
  ],
  'vehicle-type': [
    { key: 'vehicle_type',  type: 'select',  optionsKey: 'vehicle_type_simple' },
    { key: 'seats',         type: 'number',  hasPlaceholder: true },
    { key: 'ac',            type: 'checkbox' },
    { key: 'arabic_driver', type: 'checkbox' },
    { key: 'wifi',          type: 'checkbox' },
    { key: 'luggage_space', type: 'checkbox' },
  ],
};

// ─── Category Config (icons + colors + i18n key) ──────────
const CAT_CONFIG: Record<string, { icon: any; color: string; bg: string; labelKey: string; defaultOptional: boolean }> = {
  'airport-to-hotel': { icon: PlaneLanding, color: 'text-blue-600',   bg: 'bg-blue-50',   labelKey: 'airportToHotel', defaultOptional: false },
  'hotel-to-airport': { icon: PlaneTakeoff, color: 'text-indigo-600', bg: 'bg-indigo-50', labelKey: 'hotelToAirport', defaultOptional: false },
  'city-tour':        { icon: Camera,       color: 'text-purple-600', bg: 'bg-purple-50', labelKey: 'cityTour',       defaultOptional: true  },
  'gifts-simcard':    { icon: Gift,         color: 'text-pink-600',   bg: 'bg-pink-50',   labelKey: 'giftsSimcard',   defaultOptional: false },
  'vehicle-type':     { icon: Bus,          color: 'text-cyan-600',   bg: 'bg-cyan-50',   labelKey: 'vehicleType',    defaultOptional: false },
  default:            { icon: Briefcase,    color: 'text-gray-600',   bg: 'bg-gray-50',   labelKey: 'other',          defaultOptional: true  },
};
const getCatConfig = (slug: string) => CAT_CONFIG[slug] || CAT_CONFIG.default;

// ─── Toast ────────────────────────────────────────────────
function ToastNotif({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-sm px-4">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium
          ${t.type==='success'?'bg-emerald-500':t.type==='error'?'bg-red-500':'bg-amber-500'}`}>
          {t.type==='success'?<CheckCircle2 className="w-5 h-5 shrink-0"/>:t.type==='error'?<XCircle className="w-5 h-5 shrink-0"/>:<AlertTriangle className="w-5 h-5 shrink-0"/>}
          <span className="flex-1">{t.message}</span>
          <button onClick={()=>remove(t.id)}><X className="w-4 h-4 opacity-70 hover:opacity-100"/></button>
        </div>
      ))}
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────
function DeleteModal({ name, onConfirm, onCancel, loading }: { name:string; onConfirm:()=>void; onCancel:()=>void; loading:boolean }) {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl w-full max-w-sm mx-4 p-8 shadow-2xl text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-8 h-8 text-red-500"/></div>
        <h3 className="text-xl font-bold mb-2">{t('servicesMgmt.deleteModal.title')}</h3>
        <p className="text-gray-500 mb-6">{t('servicesMgmt.deleteModal.confirm')} <span className="font-semibold text-gray-800">"{name}"</span>?</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 border-2 rounded-xl font-medium hover:bg-gray-50">{t('servicesMgmt.deleteModal.cancel')}</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-60">
            {loading?<Loader2 className="w-4 h-4 animate-spin"/>:<Trash2 className="w-4 h-4"/>} {t('servicesMgmt.deleteModal.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string|number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div><p className="text-2xl font-bold text-gray-800">{value}</p><p className="text-sm text-gray-500">{label}</p></div>
    </div>
  );
}

// ─── Service Card ─────────────────────────────────────────
function ServiceCard({ service, cities, categories, onEdit, onDelete, onUpdate, lang }: {
  service: Service; cities: City[]; categories: ServiceCategory[];
  onEdit: () => void; onDelete: () => void; onUpdate?: () => void; lang?: 'ar' | 'en' | 'ms';
}) {
  const { t, isRTL } = useLanguage();
  const city = cities.find(c => c.id === service.city);
  const cat = categories.find(c => c.id === service.category);
  const cfg = getCatConfig(cat?.slug || '');
  const Icon = cfg.icon;
  const discountedPrice = service.discount_percentage
    ? (parseFloat(service.base_price) * (1 - parseFloat(service.discount_percentage) / 100)).toFixed(2)
    : null;

  const imgUrl = service.image
    ? (service.image.startsWith('http') ? service.image : `${BASE}${service.image}`)
    : null;

  return (
    <div className="group bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className={`h-28 ${cfg.bg} flex items-center justify-center relative overflow-hidden`}>
        {imgUrl
          ? <img src={imgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={service.name}/>
          : <Icon className={`w-14 h-14 ${cfg.color} opacity-30`}/>
        }
        <div className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} flex flex-col gap-1`}>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} border border-current/20`}>
            {t(`servicesMgmt.catConfig.${cfg.labelKey}`)}
          </span>
        </div>
        <div className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} flex flex-col gap-1`}>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${service.is_optional?'bg-amber-50 text-amber-600':'bg-red-50 text-red-600'}`}>
            {service.is_optional ? t('servicesMgmt.optional') : t('servicesMgmt.required')}
          </span>
        </div>
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button onClick={onEdit} className="bg-white text-blue-600 p-2.5 rounded-full hover:bg-blue-50 shadow-lg"><Edit className="w-4 h-4"/></button>
          <button onClick={onDelete} className="bg-white text-red-500 p-2.5 rounded-full hover:bg-red-50 shadow-lg"><Trash2 className="w-4 h-4"/></button>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base leading-snug mb-1">{service.name}</h3>
        {service.description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{service.description}</p>}

        <div className="flex flex-wrap gap-1.5 mb-3">
          {city && (
            <span className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
              <MapPin className="w-3 h-3"/> {city.name}
            </span>
          )}
          <span className="flex items-center gap-1 bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full">
            <CalendarDays className="w-3 h-3"/> {t('servicesMgmt.dayLabel').replace('{n}', String(service.relative_day))}
          </span>
          <span className="flex items-center gap-1 bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-full">
            <Users className="w-3 h-3"/> {t('servicesMgmt.persons').replace('{n}', String(service.max_participants))}
          </span>
          {service.is_transfer && (
            <span className="flex items-center gap-1 bg-cyan-50 text-cyan-700 text-xs px-2 py-1 rounded-full">
              <Bus className="w-3 h-3"/> {t('servicesMgmt.transfer')}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div>
            {discountedPrice ? (
              <div>
                <span className="text-xs line-through text-gray-400">{service.base_price}</span>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-blue-600">{discountedPrice}</span>
                  <span className="text-xs text-gray-500">{service.currency}</span>
                  <span className="text-xs bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full">-{service.discount_percentage}%</span>
                </div>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-blue-600">{service.base_price}</span>
                <span className="text-xs text-gray-500">{service.currency}</span>
              </div>
            )}
          </div>
          {service.breakfast_included && (
            <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-full">{t('servicesMgmt.breakfast')}</span>
          )}
        </div>
      </div>
      {/* 🆕 ActivationCard */}
      <ActivationCard
        itemId={service.id}
        itemType="service"
        isActive={service.is_active ?? false}
        basePrice={service.base_price}
        currency={service.currency}
        commissionPercentage={service.commission_percentage}
        isReadyForActivation={service.is_ready_for_activation ?? false}
        missingForActivation={service.missing_for_activation ?? []}
        onUpdate={onUpdate}
        lang={lang}
      />
    </div>
  );
}

// ─── Add Category Modal ───────────────────────────────────
function AddCategoryModal({ onSave, onClose, saving }: {
  onSave: (name: string, slug: string, desc: string) => void;
  onClose: () => void; saving: boolean;
}) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [desc, setDesc] = useState('');
  const autoSlug = (n: string) => n.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{t('servicesMgmt.addCatModal.title')}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5"/></button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('servicesMgmt.addCatModal.catName')}</label>
          <input value={name} onChange={e=>{ setName(e.target.value); setSlug(autoSlug(e.target.value)); }}
            className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder={t('servicesMgmt.addCatModal.catNamePlaceholder')}/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('servicesMgmt.addCatModal.slug')}</label>
          <input value={slug} onChange={e=>setSlug(e.target.value)} dir="ltr"
            className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono" placeholder={t('servicesMgmt.addCatModal.slugPlaceholder')}/>
          <p className="text-xs text-gray-400 mt-1">{t('servicesMgmt.addCatModal.slugHint')}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('servicesMgmt.addCatModal.desc')}</label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={2}
            className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" placeholder={t('servicesMgmt.addCatModal.descPlaceholder')}/>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 border-2 rounded-xl font-medium hover:bg-gray-50 text-sm">{t('servicesMgmt.addCatModal.cancel')}</button>
          <button onClick={()=>onSave(name,slug,desc)} disabled={saving||!name.trim()||!slug.trim()}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
            {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Plus className="w-4 h-4"/>} {t('servicesMgmt.addCatModal.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helper to read translated array option from t() lookups ──
function useTranslatedOptions() {
  const { lang } = useLanguage();
  // الترجمات index.ts يُرجِع نص فقط لكنه يقرأ array via dot notation lookup
  // لذا نقرأ مباشرة من i18n/translations
  // Simpler: نُمرِّر optionsKey وقاموس داخلي بالترجمة المباشرة
  const OPTIONS: Record<'ar'|'en'|'ms', Record<string, string[]>> = {
    ar: {
      vehicle_type: ['حافلة','فان','سيارة خاصة','سيارة فاخرة'],
      vehicle_type_simple: ['حافلة','فان','سيارة'],
      tour_type: ['جماعية','خاصة','عائلية','VIP'],
      language: ['عربي','عربي وإنجليزي','إنجليزي','متعدد اللغات'],
      simcard_type: ['ماليزيا','سنغافورة','إندونيسيا','دولية'],
      simcard_data: ['5 GB','10 GB','20 GB','غير محدود'],
      bouquet_color: ['أحمر','أبيض','وردي','مختلط'],
      bouquet_size: ['صغير','متوسط','كبير'],
    },
    en: {
      vehicle_type: ['Bus','Van','Private Car','Luxury Car'],
      vehicle_type_simple: ['Bus','Van','Car'],
      tour_type: ['Group','Private','Family','VIP'],
      language: ['Arabic','Arabic & English','English','Multilingual'],
      simcard_type: ['Malaysia','Singapore','Indonesia','International'],
      simcard_data: ['5 GB','10 GB','20 GB','Unlimited'],
      bouquet_color: ['Red','White','Pink','Mixed'],
      bouquet_size: ['Small','Medium','Large'],
    },
    ms: {
      vehicle_type: ['Bas','Van','Kereta Persendirian','Kereta Mewah'],
      vehicle_type_simple: ['Bas','Van','Kereta'],
      tour_type: ['Berkumpulan','Persendirian','Keluarga','VIP'],
      language: ['Arab','Arab & Inggeris','Inggeris','Pelbagai Bahasa'],
      simcard_type: ['Malaysia','Singapura','Indonesia','Antarabangsa'],
      simcard_data: ['5 GB','10 GB','20 GB','Tanpa Had'],
      bouquet_color: ['Merah','Putih','Pink','Bercampur'],
      bouquet_size: ['Kecil','Sederhana','Besar'],
    },
  };
  return (key: string): string[] => OPTIONS[lang]?.[key] || OPTIONS.en[key] || [];
}

// ─── Service Modal ────────────────────────────────────────
function ServiceModal({ editing, cities, categories, onSave, onClose, onCategoryAdded, saving }: {
  editing: Service | null; cities: City[]; countries: Country[]; categories: ServiceCategory[];
  onSave: (data: any, imageFile: File|null) => void;
  onCategoryAdded: (cat: ServiceCategory) => void;
  onClose: () => void; saving: boolean;
}) {
  const { t, isRTL } = useLanguage();
  const getOptions = useTranslatedOptions();
  const [form, setForm] = useState({
    name: editing?.name || '',
    description: editing?.description || '',
    category: editing?.category?.toString() || '',
    country: '',
    city: editing?.city?.toString() || '',
    base_price: editing?.base_price || '',
    currency: editing?.currency || 'MYR',
    discount_percentage: editing?.discount_percentage || '',
    max_participants: editing?.max_participants?.toString() || '1',
    relative_day: editing?.relative_day?.toString() || '1',
    is_optional: editing?.is_optional ?? true,
    is_transfer: editing?.is_transfer ?? false,
    breakfast_included: editing?.breakfast_included ?? false,
    vehicle_type: editing?.vehicle_type || '',
    category_data: editing?.category_data || {} as Record<string, string>,
  });
  const [imageFile, setImageFile] = useState<File|null>(null);
  const [imagePreview, setImagePreview] = useState<string|null>(
    editing?.image ? (editing.image.startsWith('http') ? editing.image : `${BASE}${editing.image}`) : null
  );
  const [showAddCat, setShowAddCat] = useState(false);
  const [savingCat, setSavingCat] = useState(false);

  useEffect(() => {
    if (editing) {
      const city = cities.find(c => c.id === editing.city);
      if (city) setForm(f => ({...f, country: city.country.toString()}));
    }
  }, []);

  const handleImageChange = (file: File|null) => {
    setImageFile(file);
    if(file){ const r=new FileReader(); r.onload=e=>setImagePreview(e.target?.result as string); r.readAsDataURL(file); }
    else setImagePreview(null);
  };

  const selCat = categories.find(c => c.id === Number(form.category));
  const cfg = getCatConfig(selCat?.slug || '');
  const Icon = cfg.icon;

  const handleSaveCat = async (name: string, slug: string, desc: string) => {
    setSavingCat(true);
    try {
      const res = await apiFetch(`/api/v1/services/categories/`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ name, slug, description: desc }),
      });
      if (res.ok) {
        const cat = await res.json();
        onCategoryAdded(cat);
        setForm(f => ({...f, category: cat.id.toString()}));
        setShowAddCat(false);
      }
    } finally { setSavingCat(false); }
  };

  const dynFields = selCat ? (CAT_DATA_FIELDS[selCat.slug] || []) : [];

  return (
    <>
    {showAddCat && <AddCategoryModal onSave={handleSaveCat} onClose={()=>setShowAddCat(false)} saving={savingCat}/>}
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg}`}>
              <Icon className={`w-5 h-5 ${cfg.color}`}/>
            </div>
            <h2 className="text-lg font-bold">{editing ? t('servicesMgmt.serviceModal.titleEdit') : t('servicesMgmt.serviceModal.titleNew')}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5"/></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">{t('servicesMgmt.serviceModal.categoryRequired')}</label>
              <button onClick={()=>setShowAddCat(true)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Plus className="w-3.5 h-3.5"/> {t('servicesMgmt.serviceModal.newCategory')}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map(cat => {
                const c = getCatConfig(cat.slug);
                const CI = c.icon;
                return (
                  <button key={cat.id} type="button"
                    onClick={()=>setForm({
                      ...form,
                      category: cat.id.toString(),
                      category_data: {},
                      is_optional: getCatConfig(cat.slug).defaultOptional,
                    })}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                      ${form.category===cat.id.toString()
                        ? `${c.bg} ${c.color} border-current/30 shadow-sm`
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                    <CI className="w-4 h-4 shrink-0"/> {cat.name}
                    {!getCatConfig(cat.slug).defaultOptional &&
                      <span className={`text-xs bg-red-50 text-red-500 px-1.5 rounded-full ${isRTL ? 'mr-auto' : 'ml-auto'}`}>{t('servicesMgmt.serviceModal.requiredBadge')}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Country/City */}
          <CountryCityPicker
            isRTL={isRTL}
            required
            countryLabel={t('servicesMgmt.serviceModal.countryLabel')}
            cityLabel={t('servicesMgmt.serviceModal.cityLabel')}
            initialCountryId={form.country || undefined}
            initialCityId={form.city || undefined}
            onCountryChange={(_iso, country) => {
              setForm({...form, country: country ? String(country.id) : '', city: ''});
            }}
            onCityChange={(_name, city) => {
              setForm({...form, city: city ? String(city.id) : ''});
            }}
          />

          {/* Name & Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('servicesMgmt.serviceModal.serviceName')}</label>
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}
              className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder={t('servicesMgmt.serviceModal.serviceNamePlaceholder')}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('servicesMgmt.serviceModal.desc')}</label>
            <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={2}
              className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" placeholder={t('servicesMgmt.serviceModal.descPlaceholder')}/>
          </div>

          {/* Price/Currency/Discount */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('servicesMgmt.serviceModal.price')}</label>
              <input type="number" value={form.base_price} onChange={e=>setForm({...form,base_price:e.target.value})}
                className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="0.00" dir="ltr"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('servicesMgmt.serviceModal.currency')}</label>
              <select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}
                className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm">
                {['MYR','USD','EUR','SAR','AED','DZD'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('servicesMgmt.serviceModal.discount')}</label>
              <input type="number" value={form.discount_percentage} onChange={e=>setForm({...form,discount_percentage:e.target.value})}
                className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="0" dir="ltr"/>
            </div>
          </div>

          {/* Day & Participants */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <CalendarDays className="w-3.5 h-3.5 inline ml-1"/>{t('servicesMgmt.serviceModal.relativeDay')}
              </label>
              <input type="number" min={1} value={form.relative_day} onChange={e=>setForm({...form,relative_day:e.target.value})}
                className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" dir="ltr"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Users className="w-3.5 h-3.5 inline ml-1"/>{t('servicesMgmt.serviceModal.maxParticipants')}
              </label>
              <input type="number" min={1} value={form.max_participants} onChange={e=>setForm({...form,max_participants:e.target.value})}
                className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" dir="ltr"/>
            </div>
          </div>

          {/* Dynamic Fields */}
          {dynFields.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${cfg.bg}`}>
                  <Icon className={`w-3 h-3 ${cfg.color}`}/>
                </div>
                {t('servicesMgmt.serviceModal.catDetails').replace('{cat}', selCat?.name || '')}
              </label>
              <div className="bg-gray-50 border rounded-xl p-4 space-y-3">
                {dynFields.map(field => {
                  const val = (form.category_data as any)[field.key];
                  const update = (v: any) => setForm({...form, category_data:{...form.category_data,[field.key]:v}});
                  const fieldLabel = t(`servicesMgmt.fields.${field.key}`);
                  const placeholder = field.hasPlaceholder ? t(`servicesMgmt.fields.${field.key}Ph`) : '';

                  if (field.type === 'checkbox') return (
                    <label key={field.key} className="flex items-center justify-between bg-white border rounded-xl px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors">
                      <span className="text-sm text-gray-700">{fieldLabel}</span>
                      <button type="button" onClick={()=>update(!val)}>
                        {val
                          ? <ToggleRight className="w-7 h-7 text-blue-600"/>
                          : <ToggleLeft className="w-7 h-7 text-gray-300"/>}
                      </button>
                    </label>
                  );

                  if (field.type === 'select') return (
                    <div key={field.key} className="flex items-center gap-3">
                      <label className="text-xs text-gray-600 w-32 shrink-0">{fieldLabel}</label>
                      <select value={val||''} onChange={e=>update(e.target.value)}
                        className="flex-1 border p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                        <option value="">{t('servicesMgmt.serviceModal.selectOption')}</option>
                        {(field.optionsKey ? getOptions(field.optionsKey) : []).map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  );

                  return (
                    <div key={field.key} className="flex items-center gap-3">
                      <label className="text-xs text-gray-600 w-32 shrink-0">{fieldLabel}</label>
                      <input type={field.type === 'time' ? 'time' : field.type}
                        value={val||''} placeholder={placeholder}
                        onChange={e=>update(e.target.value)}
                        dir={field.type==='number'||field.type==='time'?'ltr':(isRTL?'rtl':'ltr')}
                        className="flex-1 border p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"/>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vehicle type for transfers */}
          {(selCat?.slug==='transport'||selCat?.slug==='transfer'||form.is_transfer) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Car className="w-3.5 h-3.5 inline ml-1"/>{t('servicesMgmt.serviceModal.vehicleType')}
              </label>
              <input value={form.vehicle_type} onChange={e=>setForm({...form,vehicle_type:e.target.value})}
                className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder={t('servicesMgmt.serviceModal.vehicleTypePlaceholder')}/>
            </div>
          )}

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('servicesMgmt.serviceModal.image')}</label>
            <label className="block cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={e=>handleImageChange(e.target.files?.[0]||null)}/>
              {imagePreview
                ?<div className="relative rounded-xl overflow-hidden h-32 border-2 border-blue-300">
                    <img src={imagePreview} className="w-full h-full object-cover" alt="preview"/>
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-lg">{t('servicesMgmt.serviceModal.changeImage')}</span>
                    </div>
                  </div>
                :<div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <Upload className="w-7 h-7 text-gray-300 mx-auto mb-1"/>
                    <p className="text-sm text-gray-400">{t('servicesMgmt.serviceModal.uploadHint')}</p>
                  </div>
              }
            </label>
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-1">
            {[
              { key:'is_optional', label: t('servicesMgmt.serviceModal.toggles.optional'), sub: t('servicesMgmt.serviceModal.toggles.optionalSub'), icon:<Tag className="w-4 h-4"/> },
              { key:'is_transfer', label: t('servicesMgmt.serviceModal.toggles.transfer'), sub: t('servicesMgmt.serviceModal.toggles.transferSub'), icon:<Bus className="w-4 h-4"/> },
              { key:'breakfast_included', label: t('servicesMgmt.serviceModal.toggles.breakfast'), sub: t('servicesMgmt.serviceModal.toggles.breakfastSub'), icon:<span className="text-sm">🍳</span> },
            ].map(opt => (
              <label key={opt.key} className="flex items-center justify-between bg-gray-50 border rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-blue-600">{opt.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.sub}</p>
                  </div>
                </div>
                <button type="button" onClick={()=>setForm({...form,[opt.key]:!(form as any)[opt.key]})}>
                  {(form as any)[opt.key]
                    ?<ToggleRight className="w-8 h-8 text-blue-600"/>
                    :<ToggleLeft className="w-8 h-8 text-gray-300"/>}
                </button>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t">
          <button onClick={onClose} className="flex-1 py-3 border-2 rounded-xl font-medium hover:bg-gray-50 text-sm">{t('servicesMgmt.serviceModal.cancel')}</button>
          <button onClick={()=>onSave(form,imageFile)} disabled={saving}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-60 text-sm shadow-sm">
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin"/>{t('servicesMgmt.serviceModal.saving')}</>
              : <><Plus className="w-4 h-4"/>{editing ? t('servicesMgmt.serviceModal.saveEdit') : t('servicesMgmt.serviceModal.addService')}</>}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

// Table headers per language
const TABLE_HEADERS: Record<'ar'|'en'|'ms', string[]> = {
  ar: ['الخدمة','الفئة','المدينة','اليوم','المشاركين','السعر','النوع','إجراءات'],
  en: ['Service','Category','City','Day','Participants','Price','Type','Actions'],
  ms: ['Perkhidmatan','Kategori','Bandar','Hari','Peserta','Harga','Jenis','Tindakan'],
};

// ─── Main Component ───────────────────────────────────────
export function ServicesManagement() {
  const { t, lang, isRTL } = useLanguage();
  const [cities, setCities] = useState<City[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service|null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [viewMode, setViewMode] = useState<'card'|'table'>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<number|null>(null);
  const [filterCity, setFilterCity] = useState<number|null>(null);
  const [filterOptional, setFilterOptional] = useState<'all'|'optional'|'required'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'table' ? 8 : 12;

  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service|null>(null);

  const addToast = (type: ToastType, msg: string) => {
    const id = Date.now();
    setToasts(p=>[...p,{id,type,message:msg}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),4000);
  };

  useEffect(()=>{ fetchAll(); },[]);

  const fetchAll = async () => {
    try {
      const [cR, ciR, catR, sR] = await Promise.all([
        apiFetch(`/api/v1/locations/countries/`),
        apiFetch(`/api/v1/locations/cities/`),
        apiFetch(`/api/v1/services/categories/`),
        apiFetch(`/api/v1/services/`),
      ]);
      if(cR.ok) setCountries(await cR.json());
      if(ciR.ok) setCities(await ciR.json());
      if(catR.ok) setCategories(await catR.json());
      if(sR.ok){ const d=await sR.json(); setServices(Array.isArray(d)?d:d.results||[]); }
      else addToast('error', t('servicesMgmt.toasts.loadFail'));
    } catch { addToast('error', t('servicesMgmt.toasts.connectFail')); }
    finally { setLoading(false); }
  };

  const hasFilters = !!(searchQuery||filterCategory||filterCity||filterOptional!=='all');
  const filtered = services.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = !filterCategory || s.category === filterCategory;
    const matchCity = !filterCity || s.city === filterCity;
    const matchOpt = filterOptional==='all' || (filterOptional==='optional'?s.is_optional:!s.is_optional);
    return matchSearch && matchCat && matchCity && matchOpt;
  });

  const totalPages = Math.ceil(filtered.length/itemsPerPage);
  const paginated = filtered.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage);
  const resetFilters = () => { setSearchQuery(''); setFilterCategory(null); setFilterCity(null); setFilterOptional('all'); setCurrentPage(1); };

  const handleSave = async (form: any, imageFile: File|null) => {
    if(!form.name.trim()||!form.category||!form.city||!form.base_price||!form.relative_day){
      addToast('warning', t('servicesMgmt.toasts.validateInput')); return;
    }
    setSaving(true);
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('description', form.description || '');
    fd.append('category', form.category);
    fd.append('city', form.city);
    fd.append('base_price', form.base_price);
    fd.append('currency', form.currency);
    if(form.discount_percentage) fd.append('discount_percentage', form.discount_percentage);
    fd.append('max_participants', form.max_participants);
    fd.append('relative_day', form.relative_day);
    fd.append('is_optional', form.is_optional.toString());
    fd.append('is_transfer', form.is_transfer.toString());
    fd.append('breakfast_included', form.breakfast_included.toString());
    fd.append('vehicle_type', form.vehicle_type || '');
    fd.append('category_data', JSON.stringify(form.category_data || {}));
    if(imageFile) fd.append('image', imageFile);

    const url = editingService ? `${BASE}/api/v1/services/${editingService.id}/` : `${BASE}/api/v1/services/`;
    try {
      const res = await apiFetch(url, { method: editingService?'PUT':'POST', body: fd });
      if(res.ok){
        const data = await res.json();
        setServices(p=>editingService?p.map(s=>s.id===data.id?data:s):[...p,data]);
        setShowModal(false);
        const msg = editingService
          ? t('servicesMgmt.toasts.edited').replace('{name}', data.name)
          : t('servicesMgmt.toasts.added').replace('{name}', data.name);
        addToast('success', msg);
      } else { addToast('error', t('servicesMgmt.toasts.saveFail')); }
    } catch { addToast('error', t('servicesMgmt.toasts.connectError')); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if(!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const res = await apiFetch(`/api/v1/services/${deleteTarget.id}/`,{method:'DELETE'});
      if(res.ok){
        setServices(p=>p.filter(s=>s.id!==deleteTarget.id));
        addToast('success', t('servicesMgmt.toasts.deleted').replace('{name}', deleteTarget.name));
      }
      else addToast('error', t('servicesMgmt.toasts.deleteFail'));
    } catch { addToast('error', t('servicesMgmt.toasts.connectError')); }
    finally { setDeletingId(null); setDeleteTarget(null); }
  };

  const optionalCount = services.filter(s=>s.is_optional).length;
  const transferCount = services.filter(s=>s.is_transfer).length;

  if(loading) return(
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin"/>
      <p className="text-gray-500">{t('servicesMgmt.loadingMsg')}</p>
    </div>
  );

  const tableHeaders = TABLE_HEADERS[lang] || TABLE_HEADERS.en;
  const align = isRTL ? 'text-right' : 'text-left';

  return(
    <div className="max-w-7xl mx-auto space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <ToastNotif toasts={toasts} remove={id=>setToasts(p=>p.filter(t=>t.id!==id))}/>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('servicesMgmt.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('servicesMgmt.subtitle')}</p>
        </div>
        <button onClick={()=>{ setEditingService(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4"/> {t('servicesMgmt.addService')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Briefcase className="w-6 h-6 text-blue-600"/>} label={t('servicesMgmt.stats.total')}     value={services.length} color="bg-blue-50"/>
        <StatCard icon={<Tag className="w-6 h-6 text-amber-600"/>}      label={t('servicesMgmt.stats.optional')}  value={optionalCount}   color="bg-amber-50"/>
        <StatCard icon={<Bus className="w-6 h-6 text-cyan-600"/>}       label={t('servicesMgmt.stats.transfers')} value={transferCount}   color="bg-cyan-50"/>
        <StatCard icon={<Globe className="w-6 h-6 text-purple-600"/>}   label={t('servicesMgmt.stats.filtered')}  value={filtered.length} color="bg-purple-50"/>
      </div>

      {/* Quick category filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={()=>{setFilterCategory(null);setCurrentPage(1);}}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-colors
            ${!filterCategory?'bg-blue-600 text-white border-blue-600':'bg-white border-gray-200 hover:bg-gray-50'}`}>
          {t('servicesMgmt.quickFilter.all')}
        </button>
        {categories.map(cat=>{
          const cfg=getCatConfig(cat.slug);
          const Icon=cfg.icon;
          return(
            <button key={cat.id} onClick={()=>{setFilterCategory(cat.id);setCurrentPage(1);}}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-colors
                ${filterCategory===cat.id?`${cfg.bg} ${cfg.color} border-current/20`:'bg-white border-gray-200 hover:bg-gray-50'}`}>
              <Icon className="w-4 h-4"/> {cat.name}
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="bg-white border rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center shadow-sm">
        <div className="flex-1 relative w-full">
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`}/>
          <input type="text" placeholder={t('servicesMgmt.searchPlaceholder')} value={searchQuery}
            onChange={e=>{setSearchQuery(e.target.value);setCurrentPage(1);}}
            className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}/>
        </div>
        <select value={filterCity||''} onChange={e=>{setFilterCity(e.target.value?Number(e.target.value):null);setCurrentPage(1);}}
          className="border p-2.5 rounded-xl text-sm md:w-44 w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">{t('servicesMgmt.allCities')}</option>
          {cities.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterOptional} onChange={e=>{setFilterOptional(e.target.value as any);setCurrentPage(1);}}
          className="border p-2.5 rounded-xl text-sm md:w-44 w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">{t('servicesMgmt.optionalFilter.all')}</option>
          <option value="optional">{t('servicesMgmt.optionalFilter.optional')}</option>
          <option value="required">{t('servicesMgmt.optionalFilter.required')}</option>
        </select>
        <div className="flex border rounded-xl overflow-hidden shrink-0">
          <button onClick={()=>{setViewMode('card');setCurrentPage(1);}}
            className={`px-4 py-2.5 flex items-center gap-1.5 text-sm transition-colors ${viewMode==='card'?'bg-blue-600 text-white':'hover:bg-gray-50'}`}>
            <Grid className="w-4 h-4"/> {t('servicesMgmt.cards')}
          </button>
          <button onClick={()=>{setViewMode('table');setCurrentPage(1);}}
            className={`px-4 py-2.5 flex items-center gap-1.5 text-sm transition-colors ${viewMode==='table'?'bg-blue-600 text-white':'hover:bg-gray-50'}`}>
            <List className="w-4 h-4"/> {t('servicesMgmt.table')}
          </button>
        </div>
        {hasFilters&&<button onClick={resetFilters} className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 whitespace-nowrap shrink-0">{t('servicesMgmt.clearFilters')}</button>}
      </div>

      {/* Card View */}
      {viewMode==='card'&&(
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {paginated.length===0
            ?<div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6"><Briefcase className="w-12 h-12 text-gray-300"/></div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">{hasFilters?t('servicesMgmt.empty.noResults'):t('servicesMgmt.empty.noServices')}</h3>
                <p className="text-gray-400 mb-6 max-w-xs">{hasFilters?t('servicesMgmt.empty.tryFilters'):t('servicesMgmt.empty.startAdding')}</p>
                {hasFilters&&<button onClick={resetFilters} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">{t('servicesMgmt.empty.reset')}</button>}
              </div>
            :paginated.map(s=>(
                <ServiceCard key={s.id} service={s} cities={cities} categories={categories}
                  onEdit={()=>{ setEditingService(s); setShowModal(true); }}
                  onDelete={()=>setDeleteTarget(s)}/>
              ))
          }
        </div>
      )}

      {/* Table View */}
      {viewMode==='table'&&(
        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>{tableHeaders.map((h,i)=>(
                <th key={i} className={`px-5 py-4 ${align} text-xs font-semibold text-gray-500 uppercase tracking-wider`}>{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length===0
                ?<tr><td colSpan={8} className="text-center py-16 text-gray-400">{t('servicesMgmt.noResults')}</td></tr>
                :paginated.map(s=>{
                  const city=cities.find(c=>c.id===s.city);
                  const cat=categories.find(c=>c.id===s.category);
                  const cfg=getCatConfig(cat?.slug||'');
                  const Icon=cfg.icon;
                  return(
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                          {s.description&&<p className="text-xs text-gray-400 truncate max-w-[180px]">{s.description}</p>}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                          <Icon className="w-3 h-3"/> {t(`servicesMgmt.catConfig.${cfg.labelKey}`)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {city&&<span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"><MapPin className="w-3 h-3"/>{city.name}</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full"><CalendarDays className="w-3 h-3"/>{t('servicesMgmt.dayLabel').replace('{n}', String(s.relative_day))}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600"><Users className="w-3 h-3"/>{s.max_participants}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-semibold text-blue-600 text-sm">{s.base_price} {s.currency}</span>
                        {s.discount_percentage&&<span className="text-xs text-red-400 block">-{s.discount_percentage}%</span>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${s.is_optional?'bg-amber-50 text-amber-600':'bg-red-50 text-red-600'}`}>
                            {s.is_optional?t('servicesMgmt.optional'):t('servicesMgmt.required')}
                          </span>
                          {s.is_transfer&&<span className="text-xs bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded-full w-fit">{t('servicesMgmt.transfer')}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button onClick={()=>{setEditingService(s);setShowModal(true);}} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"><Edit className="w-4 h-4"/></button>
                          <button onClick={()=>setDeleteTarget(s)} className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages>1&&(
        <div className="flex items-center justify-between bg-white border rounded-2xl px-6 py-4 shadow-sm">
          <span className="text-sm text-gray-500">
            {t('servicesMgmt.pagination')
              .replace('{from}', String((currentPage-1)*itemsPerPage+1))
              .replace('{to}', String(Math.min(currentPage*itemsPerPage,filtered.length)))
              .replace('{total}', String(filtered.length))}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={()=>setCurrentPage(p=>Math.max(p-1,1))} disabled={currentPage===1}
              className="flex items-center gap-1 px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">
              {isRTL ? <ChevronRight className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>}
              {t('servicesMgmt.prev')}
            </button>
            <div className="flex gap-1">{Array.from({length:Math.min(totalPages,5)},(_,i)=>i+1).map(p=>(
              <button key={p} onClick={()=>setCurrentPage(p)}
                className={`w-9 h-9 rounded-xl text-sm font-medium ${currentPage===p?'bg-blue-600 text-white':'hover:bg-gray-100 text-gray-600'}`}>{p}</button>
            ))}</div>
            <button onClick={()=>setCurrentPage(p=>Math.min(p+1,totalPages))} disabled={currentPage===totalPages}
              className="flex items-center gap-1 px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">
              {t('servicesMgmt.next')}
              {isRTL ? <ChevronLeft className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {deleteTarget&&<DeleteModal name={deleteTarget.name} loading={deletingId===deleteTarget.id} onConfirm={confirmDelete} onCancel={()=>setDeleteTarget(null)}/>}
      {showModal&&<ServiceModal editing={editingService} cities={cities} countries={countries} categories={categories} onSave={handleSave} onCategoryAdded={cat=>setCategories(p=>[...p,cat])} onClose={()=>setShowModal(false)} saving={saving}/>}
    </div>
  );
}
