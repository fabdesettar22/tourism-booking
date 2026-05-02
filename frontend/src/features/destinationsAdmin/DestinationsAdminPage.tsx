/**
 * إدارة وجهات الصفحة الرئيسية — صور وفلاتر تحدّد الفنادق/الخدمات الظاهرة.
 */
import { useEffect, useState, useRef } from 'react';
import {
  Plus, Edit3, Trash2, X, Save, Loader2, MapPin, Eye, EyeOff,
  Image as ImageIcon, Upload, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { CountryCityPicker } from '../../components/forms/CountryCityPicker';
import {
  listDestinations, createDestination, updateDestination, deleteDestination,
  type Destination,
} from '../../services/destinationsApi';

type Toast = { id: number; type: 'success' | 'error'; message: string };

function ToastList({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium
          ${t.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {t.type === 'success' ? <CheckCircle2 className="w-5 h-5"/> : <AlertTriangle className="w-5 h-5"/>}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)}><X className="w-4 h-4 opacity-70"/></button>
        </div>
      ))}
    </div>
  );
}

export function DestinationsAdminPage() {
  const { lang, isRTL } = useLanguage();
  const [items, setItems] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Destination | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Destination | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const T = {
    title:     lang === 'ar' ? 'إدارة الوجهات السياحية' : lang === 'ms' ? 'Pengurusan Destinasi' : 'Destinations Management',
    subtitle:  lang === 'ar' ? 'البطاقات في الصفحة الرئيسية تحدّد ما يظهر للسائح' : lang === 'ms' ? 'Kad di halaman utama' : 'Cards on the homepage that filter hotels & services',
    addNew:    lang === 'ar' ? '+ وجهة جديدة'    : lang === 'ms' ? '+ Baru'         : '+ New Destination',
    empty:     lang === 'ar' ? 'لا توجد وجهات بعد' : lang === 'ms' ? 'Tiada lagi'    : 'No destinations yet',
    emptyHint: lang === 'ar' ? 'أضف وجهة لتظهر في قسم Featured Destinations' : lang === 'ms' ? 'Tambah destinasi' : 'Add a destination to show in Featured Destinations',
    edit:      lang === 'ar' ? 'تعديل' : 'Edit',
    deleteAct: lang === 'ar' ? 'حذف'   : 'Delete',
    confirmDel:lang === 'ar' ? 'حذف الوجهة؟' : 'Delete?',
    cantUndo:  lang === 'ar' ? 'لا يمكن التراجع' : "Can't be undone",
    cancel:    lang === 'ar' ? 'إلغاء' : 'Cancel',
    confirm:   lang === 'ar' ? 'تأكيد' : 'Confirm',
    saved:     lang === 'ar' ? 'تم الحفظ' : 'Saved',
    deleted:   lang === 'ar' ? 'تم الحذف' : 'Deleted',
    visible:   lang === 'ar' ? 'ظاهر' : 'Visible',
    hidden:    lang === 'ar' ? 'مخفي' : 'Hidden',
    cityFilter: lang === 'ar' ? 'الفلتر: مدينة' : 'Filter: city',
    sizeLarge: lang === 'ar' ? 'كبير'   : 'Large',
    sizeMedium: lang === 'ar' ? 'متوسط' : 'Medium',
    sizeSmall: lang === 'ar' ? 'صغير'  : 'Small',
  };

  const SIZE_LABEL: Record<string, string> = {
    large:  T.sizeLarge,
    medium: T.sizeMedium,
    small:  T.sizeSmall,
  };

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 3000);
  };

  const load = async () => {
    setLoading(true);
    try { setItems(await listDestinations()); }
    catch (e) { addToast('error', e instanceof Error ? e.message : 'Load failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteDestination(confirmDelete.id);
      setItems(prev => prev.filter(d => d.id !== confirmDelete.id));
      addToast('success', T.deleted);
      setConfirmDelete(null);
    } catch (e) {
      addToast('error', e instanceof Error ? e.message : 'Error');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35]"/>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <ToastList toasts={toasts} remove={id => setToasts(p => p.filter(x => x.id !== id))}/>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{T.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{T.subtitle}</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B35] hover:bg-[#e07a38] text-white rounded-xl text-sm font-bold shadow-md hover:scale-105 transition"
        >
          <Plus className="w-4 h-4"/>{T.addNew}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-gray-400"/>
          </div>
          <h3 className="font-bold text-gray-900 mb-1">{T.empty}</h3>
          <p className="text-sm text-gray-500 mb-6">{T.emptyHint}</p>
          <button onClick={() => { setEditing(null); setShowModal(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800">
            <Plus className="w-4 h-4"/>{T.addNew}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(d => (
            <div key={d.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition">
              <div className="relative aspect-video bg-gray-100">
                {d.image_url ? (
                  <img src={d.image_url} alt={d.name?.en || ''} className="w-full h-full object-cover"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon className="w-10 h-10"/>
                  </div>
                )}

                <span className={`absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                  ${d.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-white'}`}>
                  {d.is_active ? <Eye className="w-3 h-3"/> : <EyeOff className="w-3 h-3"/>}
                  {d.is_active ? T.visible : T.hidden}
                </span>

                <span className="absolute top-2 right-2 bg-white/95 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-gray-800">
                  #{d.display_order}
                </span>

                <span className="absolute bottom-2 right-2 bg-white/95 backdrop-blur px-2 py-0.5 rounded-full text-[10px] font-semibold text-gray-700">
                  {SIZE_LABEL[d.size]}
                </span>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-gray-900 truncate">
                  {d.name?.[lang] || d.name?.en || d.city_display || d.city_name}
                </h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3"/>
                  <strong className="text-gray-700">{d.city_display || d.city_name}</strong>
                  {(d.country_display || d.country_code) && (
                    <span className="ml-1">· {d.country_display || d.country_code}</span>
                  )}
                </p>

                <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-50">
                  <button onClick={() => { setEditing(d); setShowModal(true); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                    <Edit3 className="w-3.5 h-3.5"/>{T.edit}
                  </button>
                  <button onClick={() => setConfirmDelete(d)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5"/>{T.deleteAct}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <DestinationModal
          item={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={async () => {
            setShowModal(false);
            setEditing(null);
            await load();
            addToast('success', T.saved);
          }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-rose-600"/>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{T.confirmDel}</h3>
            <p className="text-sm text-gray-600 mb-5">"{confirmDelete.name?.[lang] || confirmDelete.city_name}" — {T.cantUndo}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">{T.cancel}</button>
              <button onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600">{T.confirm}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// Modal
// ════════════════════════════════════════════════════════
function DestinationModal({ item, onClose, onSaved }: {
  item: Destination | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { lang, isRTL } = useLanguage();
  const [nameAr, setNameAr] = useState(item?.name?.ar || '');
  const [nameEn, setNameEn] = useState(item?.name?.en || '');
  const [nameMs, setNameMs] = useState(item?.name?.ms || '');
  // Country/City picker state (FK-based)
  const [cityId,      setCityId]      = useState<number | null>(item?.city ?? null);
  const [cityName,    setCityName]    = useState(item?.city_display || item?.city_name || '');
  const [countryCode, setCountryCode] = useState(item?.country_iso2 || item?.country_code || '');
  const [size, setSize] = useState<'large' | 'medium' | 'small'>(item?.size || 'medium');
  const [displayOrder, setDisplayOrder] = useState(item?.display_order || 0);
  const [isActive, setIsActive] = useState(item?.is_active ?? true);
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const T = {
    title:    item ? (lang === 'ar' ? 'تعديل وجهة' : 'Edit') : (lang === 'ar' ? 'وجهة جديدة' : 'New Destination'),
    name:     lang === 'ar' ? 'الاسم' : 'Name',
    location: lang === 'ar' ? 'الدولة والمدينة *' : 'Country & City *',
    pickerHint: lang === 'ar' ? '💡 ستظهر للسائح الفنادق والخدمات في هذه المدينة' : '💡 Hotels & services in this city will be shown',
    size:     lang === 'ar' ? 'الحجم في الشبكة' : 'Grid size',
    order:    lang === 'ar' ? 'الترتيب' : 'Order',
    image:    lang === 'ar' ? 'الصورة *' : 'Image *',
    active:   lang === 'ar' ? 'نشط (يظهر)' : 'Active (visible)',
    cancel:   lang === 'ar' ? 'إلغاء' : 'Cancel',
    save:     lang === 'ar' ? 'حفظ' : 'Save',
    saving:   lang === 'ar' ? 'جارٍ الحفظ...' : 'Saving...',
    upload:   lang === 'ar' ? 'انقر للرفع' : 'Click to upload',
    sizeLarge:  lang === 'ar' ? 'كبير'   : 'Large',
    sizeMedium: lang === 'ar' ? 'متوسط' : 'Medium',
    sizeSmall:  lang === 'ar' ? 'صغير'  : 'Small',
  };

  const ref = useRef<HTMLInputElement>(null);
  const previewUrl = image ? URL.createObjectURL(image) : item?.image_url;

  const save = async () => {
    if (!nameEn.trim()) {
      setError(lang === 'ar' ? 'الاسم بالإنجليزية إجباري' : 'English name is required');
      return;
    }
    if (!cityId) {
      setError(lang === 'ar' ? 'يجب اختيار مدينة' : 'You must select a city');
      return;
    }
    if (!item && !image) {
      setError(lang === 'ar' ? 'الصورة إجبارية' : 'Image is required');
      return;
    }
    setSaving(true);
    setError('');

    const fd = new FormData();
    const nameJson = JSON.stringify({ ar: nameAr, en: nameEn, ms: nameMs });
    fd.append('name', nameJson);
    fd.append('city', String(cityId));   // FK
    fd.append('size', size);
    fd.append('display_order', String(displayOrder));
    fd.append('is_active', String(isActive));
    if (image) fd.append('image', image);

    try {
      if (item) await updateDestination(item.id, fd);
      else await createDestination(fd);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8" onClick={e => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">{T.title}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500"/></button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">{error}</div>
          )}

          {/* Names (3 langs) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">{T.name}</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-gray-400 uppercase">العربية</span>
                <input dir="rtl" value={nameAr} onChange={e => setNameAr(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B35]"
                  placeholder="كوالالمبور"/>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase">English *</span>
                <input value={nameEn} onChange={e => setNameEn(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B35]"
                  placeholder="Kuala Lumpur"/>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase">Melayu</span>
                <input value={nameMs} onChange={e => setNameMs(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B35]"
                  placeholder="Kuala Lumpur"/>
              </div>
            </div>
          </div>

          {/* Country & City picker (dynamic from DB) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">{T.location}</label>
            <CountryCityPicker
              lang={lang}
              isRTL={isRTL}
              required
              countryCode={countryCode}
              cityName={cityName}
              initialCityId={item?.city ?? undefined}
              onCountryChange={(iso2) => {
                setCountryCode(iso2);
                setCityId(null);
                setCityName('');
              }}
              onCityChange={(name, city) => {
                setCityName(name);
                setCityId(city?.id ? Number(city.id) : null);
              }}
            />
            <p className="text-[10px] text-gray-400 mt-2">{T.pickerHint}</p>
          </div>

          {/* Size + Order */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{T.size}</label>
              <select value={size} onChange={e => setSize(e.target.value as 'large' | 'medium' | 'small')}
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B35]">
                <option value="large">{T.sizeLarge}</option>
                <option value="medium">{T.sizeMedium}</option>
                <option value="small">{T.sizeSmall}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{T.order}</label>
              <input type="number" value={displayOrder} onChange={e => setDisplayOrder(Number(e.target.value))}
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B35]"/>
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{T.image}</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => ref.current?.click()}
                className="flex-1 h-20 border-2 border-dashed border-gray-200 hover:border-[#FF6B35] rounded-lg flex items-center justify-center gap-2 text-gray-500 hover:text-[#FF6B35] hover:bg-orange-50/30 transition">
                <Upload className="w-4 h-4"/>
                <span className="text-xs">{image ? image.name : T.upload}</span>
              </button>
              {previewUrl && (
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 flex-shrink-0">
                  <img src={previewUrl} alt="" className="w-full h-full object-cover"/>
                </div>
              )}
              <input ref={ref} type="file" accept="image/*" className="hidden"
                onChange={e => setImage(e.target.files?.[0] || null)}/>
            </div>
          </div>

          {/* Active */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="text-sm font-medium text-gray-700">{T.active}</span>
            <button onClick={() => setIsActive(!isActive)}
              className={`w-12 h-6 rounded-full relative transition-colors ${isActive ? 'bg-[#FF6B35]' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${isActive ? 'left-6' : 'left-0.5'}`}/>
            </button>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-2 sticky bottom-0 bg-white">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">{T.cancel}</button>
          <button onClick={save} disabled={saving}
            className="flex-1 px-4 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-[#e07a38] disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin"/>{T.saving}</> : <><Save className="w-4 h-4"/>{T.save}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DestinationsAdminPage;
