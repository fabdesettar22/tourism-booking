import { useState, useEffect } from 'react';
import {
  X, Loader2, Upload, Image as ImageIcon, AlertCircle,
  Save, Globe, MapPin, Smartphone, Users, Settings as SettingsIcon,
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { createAd, updateAd, type AdminAd } from './api-admin';
import type { AdType, Placement, DeviceType } from './types';

// ─── Constants ──────────────────────────────────────────

const AD_TYPES: { value: AdType; label: string }[] = [
  { value: 'BANNER',         label: 'بنر صورة' },
  { value: 'HERO_BANNER',    label: 'بنر رئيسي عريض' },
  { value: 'POPUP',          label: 'نافذة منبثقة' },
  { value: 'FEATURED_CARD',  label: 'بطاقة مميزة' },
  { value: 'CAROUSEL_ITEM',  label: 'عنصر سلايدر' },
];

const PLACEMENTS: { value: Placement; label: string }[] = [
  { value: 'HOME_HERO_TOP',     label: 'الرئيسية - فوق Hero' },
  { value: 'HOME_HERO_BG',      label: 'الرئيسية - خلفية Hero' },
  { value: 'HOME_MIDDLE',       label: 'الرئيسية - وسط الصفحة' },
  { value: 'HOME_BOTTOM',       label: 'الرئيسية - أسفل الصفحة' },
  { value: 'HOME_SIDEBAR',      label: 'الرئيسية - شريط جانبي' },
  { value: 'HOME_BANNER_FULL',  label: 'الرئيسية - بنر عريض كامل' },
  { value: 'SEARCH_TOP',        label: 'صفحة البحث - أعلى النتائج' },
  { value: 'HOTEL_DETAIL_SIDE', label: 'صفحة الفندق - جانبي' },
  { value: 'POPUP_ENTRY',       label: 'نافذة دخول الموقع' },
  { value: 'POPUP_EXIT',        label: 'نافذة قبل المغادرة' },
  { value: 'FOOTER_BANNER',     label: 'بنر فوق التذييل' },
  { value: 'DASHBOARD_TOP',     label: 'لوحة الوكالة - أعلى' },
];

const ALL_DEVICES: DeviceType[] = ['mobile', 'desktop', 'tablet'];
const ALL_USER_TYPES = ['anonymous', 'tourist', 'agency', 'supplier', 'admin'];
const ALL_LANGUAGES = ['ar', 'en', 'ms'];

interface ContentLang {
  title?: string;
  description?: string;
  button?: string;
}

interface FormState {
  name: string;
  ad_type: AdType;
  placement_key: Placement;
  content: Record<string, ContentLang>;
  image_desktop?: File;
  image_mobile?: File;
  image_alt_text: string;
  link_url: string;
  link_target: 'SAME_TAB' | 'NEW_TAB';
  is_active: boolean;
  priority: number;
  start_date: string;
  end_date: string;
  // Targeting
  languages: string[];
  countries: string[];
  devices: DeviceType[];
  user_types: string[];
  max_views_per_user_day: number | null;
  max_views_per_session: number | null;
}

const DEFAULT_FORM: FormState = {
  name: '',
  ad_type: 'BANNER',
  placement_key: 'HOME_HERO_TOP',
  content: {
    ar: { title: '', description: '', button: '' },
    en: { title: '', description: '', button: '' },
    ms: { title: '', description: '', button: '' },
  },
  image_alt_text: '',
  link_url: '/',
  link_target: 'SAME_TAB',
  is_active: false,
  priority: 50,
  start_date: '',
  end_date: '',
  languages: ['all'],
  countries: ['all'],
  devices: ['mobile', 'desktop', 'tablet'],
  user_types: ['anonymous', 'tourist'],
  max_views_per_user_day: null,
  max_views_per_session: null,
};

// ═══════════════════════════════════════════════════════
// AdFormModal Component
// ═══════════════════════════════════════════════════════

interface Props {
  ad: AdminAd | null;  // null = إضافة جديد، object = تعديل
  onClose: (saved: boolean) => void;
}

export function AdFormModal({ ad, onClose }: Props) {
  const { isRTL } = useLanguage();
  
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [activeTab, setActiveTab] = useState<'content' | 'images' | 'targeting' | 'advanced'>('content');
  const [activeLang, setActiveLang] = useState<string>('ar');
  const [previewDesktop, setPreviewDesktop] = useState<string>('');
  const [previewMobile, setPreviewMobile] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  
  const isEditing = ad !== null;
  
  // ─── Pre-fill عند التعديل ──────────────────────────
  
  useEffect(() => {
    if (ad) {
      setForm({
        name: ad.name,
        ad_type: ad.ad_type,
        placement_key: 'HOME_HERO_TOP',  // سنستخرجه من targeting_summary لاحقاً
        content: ad.content || DEFAULT_FORM.content,
        image_alt_text: ad.image_alt_text || '',
        link_url: ad.link_url || '/',
        link_target: ad.link_target || 'SAME_TAB',
        is_active: ad.is_active,
        priority: ad.priority,
        start_date: '',
        end_date: '',
        languages: ad.targeting_summary?.languages || ['all'],
        countries: ad.targeting_summary?.countries || ['all'],
        devices: (ad.targeting_summary?.devices as DeviceType[]) || ['mobile', 'desktop', 'tablet'],
        user_types: ad.targeting_summary?.user_types || ['anonymous', 'tourist'],
        max_views_per_user_day: ad.targeting_summary?.max_views_per_user_day || null,
        max_views_per_session: ad.targeting_summary?.max_views_per_session || null,
      });
      
      if (ad.image_desktop) setPreviewDesktop(ad.image_desktop);
      if (ad.image_mobile) setPreviewMobile(ad.image_mobile);
    }
  }, [ad]);
  
  // ─── Handlers ─────────────────────────────────────
  
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };
  
  const setContent = (lang: string, field: keyof ContentLang, value: string) => {
    setForm(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [lang]: {
          ...(prev.content[lang] || {}),
          [field]: value,
        },
      },
    }));
  };
  
  const handleImageUpload = (which: 'desktop' | 'mobile', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (which === 'desktop') {
      setField('image_desktop', file);
      setPreviewDesktop(URL.createObjectURL(file));
    } else {
      setField('image_mobile', file);
      setPreviewMobile(URL.createObjectURL(file));
    }
  };
  
  const toggleArray = <T extends string>(field: keyof FormState, value: T) => {
    const current = form[field] as T[];
    if (current.includes(value)) {
      setField(field, current.filter(v => v !== value) as any);
    } else {
      setField(field, [...current, value] as any);
    }
  };
  
  const handleSave = async () => {
    setError('');
    
    // Validation
    if (!form.name.trim()) {
      setError('اسم الإعلان مطلوب');
      setActiveTab('content');
      return;
    }
    if (!isEditing && !form.image_desktop) {
      setError('صورة سطح المكتب مطلوبة');
      setActiveTab('images');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        ad_type: form.ad_type,
        placement_key: form.placement_key,
        content: form.content,
        image_desktop: form.image_desktop,
        image_mobile: form.image_mobile,
        image_alt_text: form.image_alt_text,
        link_url: form.link_url,
        link_target: form.link_target,
        is_active: form.is_active,
        priority: form.priority,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        languages: form.languages,
        countries: form.countries,
        devices: form.devices,
        user_types: form.user_types,
        max_views_per_user_day: form.max_views_per_user_day || undefined,
        max_views_per_session: form.max_views_per_session || undefined,
      };
      
      if (isEditing && ad) {
        await updateAd(ad.id || 0, payload);
      } else {
        await createAd(payload);
      }
      
      onClose(true);
    } catch (e: any) {
      setError(e.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };
  
  // ─── Render ───────────────────────────────────────
  
  const tabs = [
    { id: 'content',   label: 'المحتوى',   icon: Globe },
    { id: 'images',    label: 'الصور',     icon: ImageIcon },
    { id: 'targeting', label: 'الاستهداف', icon: Users },
    { id: 'advanced',  label: 'متقدم',     icon: SettingsIcon },
  ];
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">
            {isEditing ? 'تعديل الإعلان' : 'إعلان جديد'}
          </h2>
          <button onClick={() => onClose(false)} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5"/>
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1 p-3 bg-gray-50 border-b overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#FF6B35] text-white shadow-md'
                  : 'text-gray-600 hover:bg-white'
              }`}>
              <tab.icon className="w-4 h-4"/>
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5"/>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          {/* ─── TAB 1: المحتوى ───────────────────────── */}
          {activeTab === 'content' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم الإعلان (داخلي)</label>
                  <input value={form.name} onChange={e => setField('name', e.target.value)}
                    placeholder="بنر العرض الخاص"
                    className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-sm"/>
                  <p className="text-xs text-gray-400 mt-1">للأدمن فقط - لا يظهر للزوار</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">نوع الإعلان</label>
                  <select value={form.ad_type} onChange={e => setField('ad_type', e.target.value as AdType)}
                    className="w-full border p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-sm">
                    {AD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">موقع العرض</label>
                <select value={form.placement_key} onChange={e => setField('placement_key', e.target.value as Placement)}
                  className="w-full border p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-sm">
                  {PLACEMENTS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              
              {/* Content Multilang */}
              <div className="border-2 border-gray-100 rounded-2xl p-4">
                <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4"/> المحتوى متعدد اللغات
                </h4>
                
                <div className="flex gap-1 mb-4">
                  {ALL_LANGUAGES.map(lng => (
                    <button key={lng} onClick={() => setActiveLang(lng)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors uppercase ${
                        activeLang === lng
                          ? 'bg-[#FF6B35] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {lng === 'ar' ? 'العربية' : lng === 'en' ? 'English' : 'Malay'}
                    </button>
                  ))}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">العنوان</label>
                    <input
                      value={form.content[activeLang]?.title || ''}
                      onChange={e => setContent(activeLang, 'title', e.target.value)}
                      placeholder={activeLang === 'ar' ? 'عنوان الإعلان' : activeLang === 'en' ? 'Ad title' : 'Tajuk iklan'}
                      className="w-full border p-2.5 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">الوصف</label>
                    <textarea
                      value={form.content[activeLang]?.description || ''}
                      onChange={e => setContent(activeLang, 'description', e.target.value)}
                      rows={2}
                      placeholder="وصف قصير"
                      className="w-full border p-2.5 rounded-lg text-sm resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">نص الزر</label>
                    <input
                      value={form.content[activeLang]?.button || ''}
                      onChange={e => setContent(activeLang, 'button', e.target.value)}
                      placeholder={activeLang === 'ar' ? 'احجز الآن' : activeLang === 'en' ? 'Book Now' : 'Tempah'}
                      className="w-full border p-2.5 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
              
              {/* Link */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">رابط الإعلان</label>
                  <input value={form.link_url} onChange={e => setField('link_url', e.target.value)}
                    placeholder="/ أو https://example.com"
                    dir="ltr"
                    className="w-full border p-3 rounded-xl text-sm"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">فتح في</label>
                  <select value={form.link_target} onChange={e => setField('link_target', e.target.value as any)}
                    className="w-full border p-3 rounded-xl bg-white text-sm">
                    <option value="SAME_TAB">نفس النافذة</option>
                    <option value="NEW_TAB">نافذة جديدة</option>
                  </select>
                </div>
              </div>
            </>
          )}
          
          {/* ─── TAB 2: الصور ───────────────────────── */}
          {activeTab === 'images' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">صورة سطح المكتب *</label>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 hover:border-[#FF6B35] transition-colors">
                  {previewDesktop ? (
                    <div className="relative">
                      <img src={previewDesktop} alt="" className="w-full h-64 object-cover rounded-xl"/>
                      <label className="absolute top-3 left-3 cursor-pointer">
                        <span className="bg-white/90 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white">
                          تغيير الصورة
                        </span>
                        <input type="file" accept="image/*" hidden onChange={e => handleImageUpload('desktop', e)}/>
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-48 cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-300 mb-3"/>
                      <p className="text-sm text-gray-500">اضغط لرفع صورة</p>
                      <p className="text-xs text-gray-400 mt-1">JPG / PNG / WebP — موصى به: 1920x600</p>
                      <input type="file" accept="image/*" hidden onChange={e => handleImageUpload('desktop', e)}/>
                    </label>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">صورة الهاتف (اختياري)</label>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 hover:border-[#FF6B35] transition-colors">
                  {previewMobile ? (
                    <div className="relative">
                      <img src={previewMobile} alt="" className="max-h-64 object-contain rounded-xl mx-auto"/>
                      <label className="absolute top-3 left-3 cursor-pointer">
                        <span className="bg-white/90 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                          تغيير
                        </span>
                        <input type="file" accept="image/*" hidden onChange={e => handleImageUpload('mobile', e)}/>
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-32 cursor-pointer">
                      <Smartphone className="w-10 h-10 text-gray-300 mb-2"/>
                      <p className="text-sm text-gray-500">اضغط لرفع صورة موبايل</p>
                      <p className="text-xs text-gray-400 mt-1">إن لم تُرفع، يُستخدم صورة سطح المكتب</p>
                      <input type="file" accept="image/*" hidden onChange={e => handleImageUpload('mobile', e)}/>
                    </label>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">النص البديل (Alt Text)</label>
                <input value={form.image_alt_text} onChange={e => setField('image_alt_text', e.target.value)}
                  placeholder="وصف الصورة لذوي الاحتياجات"
                  className="w-full border p-3 rounded-xl text-sm"/>
              </div>
            </>
          )}
          
          {/* ─── TAB 3: الاستهداف ───────────────────── */}
          {activeTab === 'targeting' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اللغات المستهدفة</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setField('languages', ['all'])}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      form.languages.includes('all')
                        ? 'bg-[#FF6B35] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    الكل
                  </button>
                  {ALL_LANGUAGES.map(lng => (
                    <button key={lng} onClick={() => {
                      const current = form.languages.filter(l => l !== 'all');
                      const updated = current.includes(lng)
                        ? current.filter(l => l !== lng)
                        : [...current, lng];
                      setField('languages', updated.length > 0 ? updated : ['all']);
                    }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors uppercase ${
                        form.languages.includes(lng)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {lng}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الأجهزة</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_DEVICES.map(d => (
                    <button key={d} onClick={() => toggleArray('devices', d)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                        form.devices.includes(d)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">أنواع المستخدمين</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_USER_TYPES.map(u => (
                    <button key={u} onClick={() => toggleArray('user_types', u)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                        form.user_types.includes(u)
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">حد المشاهدات/يوم</label>
                  <input type="number" min="0"
                    value={form.max_views_per_user_day || ''}
                    onChange={e => setField('max_views_per_user_day', e.target.value ? Number(e.target.value) : null)}
                    placeholder="غير محدود"
                    className="w-full border p-3 rounded-xl text-sm"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">حد المشاهدات/جلسة</label>
                  <input type="number" min="0"
                    value={form.max_views_per_session || ''}
                    onChange={e => setField('max_views_per_session', e.target.value ? Number(e.target.value) : null)}
                    placeholder="غير محدود"
                    className="w-full border p-3 rounded-xl text-sm"/>
                </div>
              </div>
            </>
          )}
          
          {/* ─── TAB 4: متقدم ───────────────────────── */}
          {activeTab === 'advanced' && (
            <>
              <div>
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 rounded-xl">
                  <input type="checkbox" checked={form.is_active}
                    onChange={e => setField('is_active', e.target.checked)}
                    className="w-5 h-5 accent-[#FF6B35]"/>
                  <div>
                    <span className="font-medium text-gray-800">تفعيل الإعلان</span>
                    <p className="text-xs text-gray-500 mt-0.5">سيظهر للزوار فور التفعيل</p>
                  </div>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الأولوية: <span className="text-[#FF6B35] font-bold">{form.priority}</span>
                </label>
                <input type="range" min="0" max="100" value={form.priority}
                  onChange={e => setField('priority', Number(e.target.value))}
                  className="w-full accent-[#FF6B35]"/>
                <p className="text-xs text-gray-400 mt-1">أعلى = يظهر أولاً عند تساوي شروط أخرى</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">تاريخ البدء (اختياري)</label>
                  <input type="datetime-local" value={form.start_date}
                    onChange={e => setField('start_date', e.target.value)}
                    className="w-full border p-3 rounded-xl text-sm"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">تاريخ الانتهاء (اختياري)</label>
                  <input type="datetime-local" value={form.end_date}
                    onChange={e => setField('end_date', e.target.value)}
                    className="w-full border p-3 rounded-xl text-sm"/>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button onClick={() => onClose(false)} disabled={saving}
            className="flex-1 py-3 border-2 rounded-xl font-medium hover:bg-white text-sm transition-colors">
            إلغاء
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 bg-[#FF6B35] hover:bg-[#e07a38] text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60 text-sm shadow-md transition-colors">
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin"/> جاري الحفظ...</>
            ) : (
              <><Save className="w-4 h-4"/> {isEditing ? 'حفظ التعديلات' : 'إنشاء الإعلان'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdFormModal;
