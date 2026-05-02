/**
 * Hero Hotels Management — إدارة بطاقات Hero الدوّارة (مستقلة عن النظام الإعلاني).
 */
import { useEffect, useState, useRef } from 'react';
import {
  Plus, Edit3, Trash2, X, Save, Loader2, Star, MapPin,
  Image as ImageIcon, Eye, EyeOff, Upload, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import {
  listHeroHotels, createHeroHotel, updateHeroHotel, deleteHeroHotel,
  type HeroHotelCard,
} from '../../services/heroHotelsApi';

type Toast = { id: number; type: 'success' | 'error'; message: string };

// ════════════════════════════════════════════════════════
// Toast list
// ════════════════════════════════════════════════════════
function ToastList({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div key={t.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium
            ${t.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {t.type === 'success' ? <CheckCircle2 className="w-5 h-5"/> : <AlertTriangle className="w-5 h-5"/>}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)}><X className="w-4 h-4 opacity-70"/></button>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// Main
// ════════════════════════════════════════════════════════
export function HeroHotelsManagement() {
  const { lang, isRTL } = useLanguage();
  const [hotels, setHotels] = useState<HeroHotelCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<HeroHotelCard | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<HeroHotelCard | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const T = {
    title:       lang === 'ar' ? 'فنادق Hero الدوّارة'    : lang === 'ms' ? 'Hotel Hero Berputar' : 'Rotating Hero Hotels',
    subtitle:    lang === 'ar' ? 'البطاقات التي تظهر في Hero الصفحة الرئيسية' : lang === 'ms' ? 'Kad di bahagian Hero halaman utama' : 'Cards shown in homepage Hero section',
    addNew:      lang === 'ar' ? '+ إضافة بطاقة'         : lang === 'ms' ? '+ Tambah Kad'      : '+ New Card',
    empty:       lang === 'ar' ? 'لا توجد بطاقات بعد'    : lang === 'ms' ? 'Tiada kad lagi'    : 'No cards yet',
    emptyHint:   lang === 'ar' ? 'أضف فندقاً ليظهر في Hero الصفحة الرئيسية الدوّار' : lang === 'ms' ? 'Tambah hotel untuk dipaparkan' : 'Add a hotel to display in the rotating Hero',
    edit:        lang === 'ar' ? 'تعديل'    : lang === 'ms' ? 'Edit'   : 'Edit',
    deleteAct:   lang === 'ar' ? 'حذف'      : lang === 'ms' ? 'Padam'  : 'Delete',
    confirmDel:  lang === 'ar' ? 'حذف البطاقة؟' : lang === 'ms' ? 'Padam kad?' : 'Delete card?',
    cantUndo:    lang === 'ar' ? 'لا يمكن التراجع' : lang === 'ms' ? 'Tidak boleh dibuat asal' : "Can't be undone",
    cancel:      lang === 'ar' ? 'إلغاء' : lang === 'ms' ? 'Batal' : 'Cancel',
    confirm:     lang === 'ar' ? 'تأكيد الحذف' : lang === 'ms' ? 'Sahkan' : 'Confirm Delete',
    saved:       lang === 'ar' ? 'تم الحفظ'  : lang === 'ms' ? 'Disimpan' : 'Saved',
    deleted:     lang === 'ar' ? 'تم الحذف' : lang === 'ms' ? 'Dipadam' : 'Deleted',
    visible:     lang === 'ar' ? 'ظاهر'   : lang === 'ms' ? 'Aktif'  : 'Visible',
    hidden:      lang === 'ar' ? 'مخفي'   : lang === 'ms' ? 'Tersembunyi' : 'Hidden',
    order:       lang === 'ar' ? 'الترتيب' : lang === 'ms' ? 'Tertib' : 'Order',
  };

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 3000);
  };

  const load = async () => {
    setLoading(true);
    try { setHotels(await listHeroHotels()); }
    catch (e) { addToast('error', e instanceof Error ? e.message : 'Load failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteHeroHotel(confirmDelete.id);
      setHotels(prev => prev.filter(h => h.id !== confirmDelete.id));
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

      {/* Header */}
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

      {/* Empty state */}
      {hotels.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-gray-400"/>
          </div>
          <h3 className="font-bold text-gray-900 mb-1">{T.empty}</h3>
          <p className="text-sm text-gray-500 mb-6">{T.emptyHint}</p>
          <button
            onClick={() => { setEditing(null); setShowModal(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800"
          >
            <Plus className="w-4 h-4"/> {T.addNew}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hotels.map(h => (
            <div key={h.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition">
              {/* Card image (preview) */}
              <div className="relative aspect-video bg-gray-100">
                {h.card_image_url ? (
                  <img src={h.card_image_url} alt={h.name} className="w-full h-full object-cover"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon className="w-10 h-10"/>
                  </div>
                )}

                {/* Status badge */}
                <span className={`absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                  ${h.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-white'}`}>
                  {h.is_active ? <Eye className="w-3 h-3"/> : <EyeOff className="w-3 h-3"/>}
                  {h.is_active ? T.visible : T.hidden}
                </span>

                {/* Order badge */}
                <span className="absolute top-2 right-2 bg-white/95 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-gray-800">
                  #{h.display_order}
                </span>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start gap-2">
                  {h.logo_url && (
                    <img src={h.logo_url} alt="" className="w-10 h-10 rounded-lg object-contain bg-gray-50 flex-shrink-0"/>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-gray-900 truncate">{h.name}</h3>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        h.card_type === 'hotel' ? 'bg-blue-100 text-blue-700' :
                        h.card_type === 'partner' ? 'bg-emerald-100 text-emerald-700' :
                        h.card_type === 'sponsor' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>{h.card_type}</span>
                    </div>
                    {h.location && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3"/>{h.location}
                      </p>
                    )}
                  </div>
                </div>

                {h.card_type === 'hotel' && h.stars ? (
                  <div className="flex items-center gap-0.5 mt-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < (h.stars||0) ? 'fill-amber-500 text-amber-500' : 'text-gray-200'}`}/>
                    ))}
                  </div>
                ) : null}

                <p className="text-xs text-gray-600 line-clamp-2 mt-3 leading-relaxed">
                  {h.description}
                </p>

                <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-50">
                  <button onClick={() => { setEditing(h); setShowModal(true); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                    <Edit3 className="w-3.5 h-3.5"/>{T.edit}
                  </button>
                  <button onClick={() => setConfirmDelete(h)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5"/>{T.deleteAct}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <HeroHotelModal
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

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-rose-600"/>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{T.confirmDel}</h3>
            <p className="text-sm text-gray-600 mb-5">"{confirmDelete.name}" — {T.cantUndo}</p>
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
// Modal — create/edit
// ════════════════════════════════════════════════════════
function HeroHotelModal({ item, onClose, onSaved }: {
  item: HeroHotelCard | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { lang, isRTL } = useLanguage();
  const [cardType, setCardType] = useState<'hotel'|'partner'|'sponsor'|'custom'>(item?.card_type || 'hotel');
  const [name, setName] = useState(item?.name || '');
  const [location, setLocation] = useState(item?.location || '');
  const [stars, setStars] = useState<number>(item?.stars || 5);
  const [description, setDescription] = useState(item?.description || '');
  const [linkUrl, setLinkUrl] = useState(item?.link_url || '');
  const [ctaText, setCtaText] = useState(item?.cta_text || '');
  const [displayOrder, setDisplayOrder] = useState(item?.display_order || 0);
  const [isActive, setIsActive] = useState(item?.is_active ?? true);
  const [logo, setLogo] = useState<File | null>(null);
  const [cardImage, setCardImage] = useState<File | null>(null);
  const [cardVideo, setCardVideo] = useState<File | null>(null);
  const [heroImage, setHeroImage] = useState<File | null>(null);
  const [heroVideo, setHeroVideo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isHotel = cardType === 'hotel';

  const T = {
    title:    item ? (lang === 'ar' ? 'تعديل بطاقة' : 'Edit Card') : (lang === 'ar' ? 'إضافة بطاقة' : 'New Card'),
    name:     lang === 'ar' ? 'اسم الفندق *' : 'Hotel name *',
    location: lang === 'ar' ? 'الموقع *'     : 'Location *',
    stars:    lang === 'ar' ? 'النجوم'        : 'Stars',
    desc:     lang === 'ar' ? 'الوصف *'      : 'Description *',
    descPh:   lang === 'ar' ? 'وصف مختصر يظهر في البطاقة' : 'Short description shown on card',
    logo:     lang === 'ar' ? 'الشعار (PNG شفاف)' : 'Logo (transparent PNG)',
    cardImg:  lang === 'ar' ? 'صورة البطاقة (داخل البطاقة)' : 'Card Image (inside card)',
    heroImg:  lang === 'ar' ? 'صورة الخلفية (Hero الكامل)'  : 'Hero Background (full Hero)',
    order:    lang === 'ar' ? 'ترتيب العرض'  : 'Display order',
    orderPh:  lang === 'ar' ? '0 = أولاً'    : '0 = first',
    active:   lang === 'ar' ? 'نشط (يظهر في الصفحة الرئيسية)' : 'Active (visible on homepage)',
    upload:   lang === 'ar' ? 'انقر للرفع'   : 'Click to upload',
    cancel:   lang === 'ar' ? 'إلغاء' : 'Cancel',
    save:     lang === 'ar' ? 'حفظ'   : 'Save',
    saving:   lang === 'ar' ? 'جارٍ الحفظ...' : 'Saving...',
  };

  const save = async () => {
    if (!name.trim()) {
      setError(lang === 'ar' ? 'الاسم إجباري' : 'Name is required');
      return;
    }
    if (isHotel && (!location.trim())) {
      setError(lang === 'ar' ? 'الموقع إجباري للفنادق' : 'Location is required for hotels');
      return;
    }
    // عند الإنشاء، يجب رفع media واحد على الأقل لكل من card و hero
    if (!item) {
      if (!cardImage && !cardVideo) {
        setError(lang === 'ar' ? 'ارفع صورة أو فيديو للبطاقة' : 'Upload card image or video');
        return;
      }
      if (!heroImage && !heroVideo) {
        setError(lang === 'ar' ? 'ارفع صورة أو فيديو للخلفية' : 'Upload hero image or video');
        return;
      }
    }

    setSaving(true);
    setError('');

    const fd = new FormData();
    fd.append('card_type', cardType);
    fd.append('name', name);
    fd.append('description', description);
    fd.append('display_order', String(displayOrder));
    fd.append('is_active', String(isActive));
    if (isHotel) {
      fd.append('location', location);
      fd.append('stars', String(stars));
    } else {
      fd.append('location', '');
    }
    if (linkUrl) fd.append('link_url', linkUrl);
    if (ctaText) fd.append('cta_text', ctaText);
    if (logo)       fd.append('logo', logo);
    if (cardImage)  fd.append('card_image', cardImage);
    if (cardVideo)  fd.append('card_video', cardVideo);
    if (heroImage)  fd.append('hero_image', heroImage);
    if (heroVideo)  fd.append('hero_video', heroVideo);

    try {
      if (item) await updateHeroHotel(item.id, fd);
      else await createHeroHotel(fd);
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
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">{T.title}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500"/></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Card type selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {lang === 'ar' ? 'نوع البطاقة *' : 'Card type *'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {([
                { v: 'hotel',   l_ar: 'فندق',   l_en: 'Hotel' },
                { v: 'partner', l_ar: 'شريك',   l_en: 'Partner' },
                { v: 'sponsor', l_ar: 'ممول',   l_en: 'Sponsor' },
                { v: 'custom',  l_ar: 'عام',    l_en: 'Custom' },
              ] as const).map(opt => (
                <button key={opt.v} type="button" onClick={() => setCardType(opt.v)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    cardType === opt.v
                      ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}>
                  {lang === 'ar' ? opt.l_ar : opt.l_en}
                </button>
              ))}
            </div>
          </div>

          {/* Name + (Location for hotels) */}
          <div className={`grid ${isHotel ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{T.name}</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B35]"
                placeholder={isHotel ? 'Mandarin Oriental' : (lang === 'ar' ? 'اسم الشركة/الراعي' : 'Company / sponsor name')}/>
            </div>
            {isHotel && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{T.location}</label>
                <input value={location} onChange={e => setLocation(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B35]"
                  placeholder="Kuala Lumpur"/>
              </div>
            )}
          </div>

          {/* Stars (hotels only) + Order */}
          <div className="grid grid-cols-2 gap-3">
            {isHotel && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{T.stars}</label>
                <select value={stars} onChange={e => setStars(Number(e.target.value))}
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B35]">
                  {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
                </select>
              </div>
            )}
            <div className={isHotel ? '' : 'col-span-2'}>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{T.order}</label>
              <input type="number" value={displayOrder} onChange={e => setDisplayOrder(Number(e.target.value))}
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B35]"
                placeholder={T.orderPh}/>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{T.desc}</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={3} placeholder={T.descPh}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-[#FF6B35]"/>
          </div>

          {/* CTA (optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {lang === 'ar' ? 'رابط الزر (اختياري)' : 'CTA link (optional)'}
              </label>
              <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} type="url"
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B35]"
                placeholder="https://..."/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {lang === 'ar' ? 'نص الزر (اختياري)' : 'CTA text (optional)'}
              </label>
              <input value={ctaText} onChange={e => setCtaText(e.target.value)} maxLength={40}
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B35]"
                placeholder={lang === 'ar' ? 'احجز الآن' : 'Book now'}/>
            </div>
          </div>

          {/* Logo (optional) */}
          <FileField label={T.logo} current={item?.logo_url} file={logo} onChange={setLogo} lang={lang} uploadText={T.upload}/>

          {/* Card media — image OR video */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
            <p className="text-xs font-bold text-gray-700 mb-2">
              {lang === 'ar' ? '📸 media البطاقة (صورة أو فيديو)' : '📸 Card media (image OR video)'}
            </p>
            <div className="space-y-2">
              <FileField label={T.cardImg} current={item?.card_image_url} file={cardImage} onChange={setCardImage} lang={lang} uploadText={T.upload}/>
              <FileField label={lang === 'ar' ? 'فيديو البطاقة' : 'Card video'} accept="video/*"
                current={item?.card_video_url} file={cardVideo} onChange={setCardVideo} lang={lang} uploadText={T.upload}/>
            </div>
          </div>

          {/* Hero media — image OR video */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
            <p className="text-xs font-bold text-gray-700 mb-2">
              {lang === 'ar' ? '🌅 media الخلفية (صورة أو فيديو)' : '🌅 Hero background (image OR video)'}
            </p>
            <div className="space-y-2">
              <FileField label={T.heroImg} current={item?.hero_image_url} file={heroImage} onChange={setHeroImage} lang={lang} uploadText={T.upload}/>
              <FileField label={lang === 'ar' ? 'فيديو الخلفية' : 'Hero video'} accept="video/*"
                current={item?.hero_video_url} file={heroVideo} onChange={setHeroVideo} lang={lang} uploadText={T.upload}/>
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="text-sm font-medium text-gray-700">{T.active}</span>
            <button onClick={() => setIsActive(!isActive)}
              className={`w-12 h-6 rounded-full relative transition-colors ${isActive ? 'bg-[#FF6B35]' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${isActive ? 'left-6' : 'left-0.5'}`}/>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-2 sticky bottom-0 bg-white">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
            {T.cancel}
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 px-4 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-[#e07a38] disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin"/>{T.saving}</> : <><Save className="w-4 h-4"/>{T.save}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// File field with preview
// ════════════════════════════════════════════════════════
function FileField({ label, current, file, onChange, uploadText, accept = 'image/*' }: {
  label: string;
  current: string | null | undefined;
  file: File | null;
  onChange: (f: File | null) => void;
  lang: string;
  uploadText: string;
  accept?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const previewUrl = file ? URL.createObjectURL(file) : current;
  const isVideo = accept.includes('video');

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-3">
        <button type="button"
          onClick={() => ref.current?.click()}
          className="flex-1 h-20 border-2 border-dashed border-gray-200 hover:border-[#FF6B35] rounded-lg flex items-center justify-center gap-2 text-gray-500 hover:text-[#FF6B35] hover:bg-orange-50/30 transition">
          <Upload className="w-4 h-4"/>
          <span className="text-xs">{file ? file.name : uploadText}</span>
        </button>
        {previewUrl && (
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 flex-shrink-0">
            {isVideo ? (
              <video src={previewUrl} muted playsInline className="w-full h-full object-cover" />
            ) : (
              <img src={previewUrl} alt="" className="w-full h-full object-cover"/>
            )}
          </div>
        )}
        <input ref={ref} type="file" accept={accept} className="hidden"
          onChange={e => onChange(e.target.files?.[0] || null)}/>
      </div>
    </div>
  );
}

export default HeroHotelsManagement;
