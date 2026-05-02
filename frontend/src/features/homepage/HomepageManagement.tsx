/**
 * Homepage Management — لوحة تحكم الأدمن للصفحة الرئيسية
 *
 * 4 تبويبات:
 * - Hero (نصوص + شارة)
 * - Sections (إخفاء/إظهار + حدود)
 * - Trust Badges (4 شارات قابلة للتعديل)
 * - Testimonials (CRUD)
 */
import { useEffect, useState } from 'react';
import {
  Save, Eye, EyeOff, Plus, Edit3, Trash2, X, Loader2,
  CheckCircle2, AlertTriangle, Layout, Sparkles, Shield, MessageSquare,
  Star,
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import {
  fetchHomepageConfig, updateHomepageConfig,
  listTestimonialsAdmin, createTestimonial, updateTestimonial, deleteTestimonial,
  type HomepageConfig, type Testimonial,
} from '../../services/homepageConfig';

type Tab = 'hero' | 'sections' | 'trust' | 'testimonials';
type ToastType = 'success' | 'error';
interface Toast { id: number; type: ToastType; message: string }

// ═══════════════════════════════════════════════════════
// Toast list
// ═══════════════════════════════════════════════════════
function ToastList({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium
          ${t.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {t.type === 'success' ? <CheckCircle2 className="w-5 h-5"/> : <AlertTriangle className="w-5 h-5"/>}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)}><X className="w-4 h-4 opacity-70"/></button>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Tri-language input (ar/en/ms)
// ═══════════════════════════════════════════════════════
function TriLangInput({ label, value, onChange, multiline }: {
  label: string;
  value: { ar?: string; en?: string; ms?: string };
  onChange: (v: { ar?: string; en?: string; ms?: string }) => void;
  multiline?: boolean;
}) {
  const langs = [
    { k: 'ar' as const, l: 'العربية', dir: 'rtl' as const },
    { k: 'en' as const, l: 'English', dir: 'ltr' as const },
    { k: 'ms' as const, l: 'Melayu',  dir: 'ltr' as const },
  ];
  const Field = multiline ? 'textarea' : 'input';
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-gray-700 mb-2">{label}</label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {langs.map(({ k, l, dir }) => (
          <div key={k}>
            <span className="text-[10px] text-gray-400 uppercase">{l}</span>
            <Field
              dir={dir}
              value={value[k] || ''}
              onChange={(e) => onChange({ ...value, [k]: e.target.value })}
              className={`w-full ${multiline ? 'h-20 resize-none' : 'h-10'} px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B35]`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Toggle row
// ═══════════════════════════════════════════════════════
function ToggleRow({ label, description, value, onChange }: {
  label: string; description?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-colors ${value ? 'bg-[#FF6B35]' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${value ? 'left-6' : 'left-0.5'}`}/>
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════
export function HomepageManagement() {
  const { lang, isRTL } = useLanguage();
  const [tab, setTab] = useState<Tab>('hero');
  const [config, setConfig] = useState<HomepageConfig | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [editTm, setEditTm] = useState<Testimonial | null>(null);
  const [showTmModal, setShowTmModal] = useState(false);

  const T = {
    title:        lang === 'ar' ? 'تحكم الصفحة الرئيسية'  : lang === 'ms' ? 'Pengurusan Halaman Utama' : 'Homepage Management',
    subtitle:     lang === 'ar' ? 'تخصيص محتوى صفحتك الرئيسية' : lang === 'ms' ? 'Sesuaikan kandungan' : 'Customize your homepage content',
    save:         lang === 'ar' ? 'حفظ التغييرات' : lang === 'ms' ? 'Simpan' : 'Save Changes',
    saving:       lang === 'ar' ? 'جارٍ الحفظ...'  : lang === 'ms' ? 'Menyimpan...' : 'Saving...',
    saved:        lang === 'ar' ? 'تم الحفظ'      : lang === 'ms' ? 'Disimpan'    : 'Saved successfully',
    tabHero:      lang === 'ar' ? 'Hero والبحث'   : lang === 'ms' ? 'Hero'        : 'Hero & Search',
    tabSections:  lang === 'ar' ? 'الأقسام'       : lang === 'ms' ? 'Bahagian'    : 'Sections',
    tabTrust:     lang === 'ar' ? 'شارات الثقة'   : lang === 'ms' ? 'Lencana'     : 'Trust Badges',
    tabTms:       lang === 'ar' ? 'آراء العملاء'  : lang === 'ms' ? 'Testimoni'   : 'Testimonials',
    addTm:        lang === 'ar' ? '+ إضافة رأي'    : lang === 'ms' ? '+ Tambah'   : '+ Add Testimonial',
  };

  const addToast = (type: ToastType, message: string) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [cfg, tms] = await Promise.all([
        fetchHomepageConfig(),
        listTestimonialsAdmin().catch(() => []),
      ]);
      setConfig(cfg);
      setTestimonials(tms);
    } catch (e) {
      addToast('error', e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateConfig = (patch: Partial<HomepageConfig>) => {
    setConfig(c => c ? { ...c, ...patch } : c);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const updated = await updateHomepageConfig(config);
      setConfig(updated);
      setDirty(false);
      addToast('success', T.saved);
    } catch (e) {
      addToast('error', e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin"/>
    </div>
  );

  if (!config) return (
    <div className="text-center py-32 text-gray-500">Failed to load configuration</div>
  );

  return (
    <div className="max-w-5xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <ToastList toasts={toasts} remove={id => setToasts(p => p.filter(x => x.id !== id))}/>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{T.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{T.subtitle}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all
            ${dirty ? 'bg-[#FF6B35] text-white hover:bg-[#e07a38] shadow-md hover:scale-105' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin"/> {T.saving}</>
            : <><Save className="w-4 h-4"/> {T.save}</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6 -mb-px">
          {[
            { v: 'hero',         l: T.tabHero,     icon: Sparkles },
            { v: 'sections',     l: T.tabSections, icon: Layout },
            { v: 'trust',        l: T.tabTrust,    icon: Shield },
            { v: 'testimonials', l: T.tabTms,      icon: MessageSquare },
          ].map(t => {
            const Icon = t.icon;
            const active = tab === t.v;
            return (
              <button
                key={t.v}
                onClick={() => setTab(t.v as Tab)}
                className={`flex items-center gap-2 px-1 pb-3 text-sm font-medium border-b-2 transition-colors
                  ${active ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <Icon className="w-4 h-4"/>
                {t.l}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Tab: Hero ── */}
      {tab === 'hero' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-4">Hero Section</h3>
          <TriLangInput
            label={lang === 'ar' ? 'شارة Hero (الأعلى)' : 'Hero Badge'}
            value={config.hero_badge}
            onChange={v => updateConfig({ hero_badge: v })}
          />
          <TriLangInput
            label={lang === 'ar' ? 'العنوان الرئيسي' : 'Main Title'}
            value={config.hero_title}
            onChange={v => updateConfig({ hero_title: v })}
          />
          <TriLangInput
            label={lang === 'ar' ? 'الكلمة المُميَّزة' : 'Highlighted Word'}
            value={config.hero_title_highlight}
            onChange={v => updateConfig({ hero_title_highlight: v })}
          />
          <TriLangInput
            label={lang === 'ar' ? 'العنوان الفرعي' : 'Subtitle'}
            value={config.hero_subtitle}
            onChange={v => updateConfig({ hero_subtitle: v })}
            multiline
          />
          <TriLangInput
            label={lang === 'ar' ? 'نص حقل البحث' : 'Search Placeholder'}
            value={config.search_placeholder}
            onChange={v => updateConfig({ search_placeholder: v })}
          />
        </div>
      )}

      {/* ── Tab: Sections ── */}
      {tab === 'sections' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-2">
              {lang === 'ar' ? 'شريط الإحصائيات' : lang === 'ms' ? 'Statistik' : 'Stats Banner'}
            </h3>
            <ToggleRow
              label={lang === 'ar' ? 'إظهار شريط الإحصائيات' : 'Show stats banner'}
              value={config.stats_visible}
              onChange={v => updateConfig({ stats_visible: v })}
            />
            {config.stats_visible && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {[
                  { k: 'stats_customers',    l: lang === 'ar' ? 'العملاء' : 'Customers' },
                  { k: 'stats_destinations', l: lang === 'ar' ? 'الوجهات' : 'Destinations' },
                  { k: 'stats_suppliers',    l: lang === 'ar' ? 'الموردون' : 'Suppliers' },
                  { k: 'stats_partners',     l: lang === 'ar' ? 'الوكالات' : 'Partners' },
                ].map(s => (
                  <div key={s.k}>
                    <label className="text-xs font-semibold text-gray-700">{s.l}</label>
                    <input
                      type="number"
                      value={config[s.k as keyof HomepageConfig] as number}
                      onChange={e => updateConfig({ [s.k]: Number(e.target.value) } as Partial<HomepageConfig>)}
                      className="w-full h-10 px-3 mt-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B35]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visibility */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-2">
              {lang === 'ar' ? 'إظهار/إخفاء الأقسام' : 'Sections Visibility'}
            </h3>
            <ToggleRow label="Categories" value={config.show_categories} onChange={v => updateConfig({ show_categories: v })}/>
            <ToggleRow label="Featured Destinations" value={config.show_destinations} onChange={v => updateConfig({ show_destinations: v })}/>
            <ToggleRow label="Featured Hotels" value={config.show_hotels} onChange={v => updateConfig({ show_hotels: v })}/>
            <ToggleRow label="Featured Services" value={config.show_services} onChange={v => updateConfig({ show_services: v })}/>
            <ToggleRow label="Trust Section" value={config.show_trust_section} onChange={v => updateConfig({ show_trust_section: v })}/>
            <ToggleRow label="Testimonials" value={config.show_testimonials} onChange={v => updateConfig({ show_testimonials: v })}/>
            <ToggleRow label="Supplier CTA" value={config.show_supplier_cta} onChange={v => updateConfig({ show_supplier_cta: v })}/>
          </div>

          {/* Limits */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-3">{lang === 'ar' ? 'حدود الأقسام' : 'Section Limits'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700">{lang === 'ar' ? 'عدد الفنادق' : 'Hotels limit'}</label>
                <input
                  type="number" min="1" max="20"
                  value={config.hotels_limit}
                  onChange={e => updateConfig({ hotels_limit: Number(e.target.value) })}
                  className="w-full h-10 px-3 mt-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B35]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">{lang === 'ar' ? 'عدد الخدمات' : 'Services limit'}</label>
                <input
                  type="number" min="1" max="20"
                  value={config.services_limit}
                  onChange={e => updateConfig({ services_limit: Number(e.target.value) })}
                  className="w-full h-10 px-3 mt-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B35]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Trust Badges ── */}
      {tab === 'trust' && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="bg-white border border-gray-100 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 mb-4">
                {lang === 'ar' ? `شارة #${n}` : `Badge #${n}`}
              </h3>
              <TriLangInput
                label={lang === 'ar' ? 'العنوان' : 'Title'}
                value={config[`trust_badge_${n}_title` as keyof HomepageConfig] as { ar?: string; en?: string; ms?: string } || {}}
                onChange={v => updateConfig({ [`trust_badge_${n}_title`]: v } as Partial<HomepageConfig>)}
              />
              <TriLangInput
                label={lang === 'ar' ? 'الوصف' : 'Subtitle'}
                value={config[`trust_badge_${n}_subtitle` as keyof HomepageConfig] as { ar?: string; en?: string; ms?: string } || {}}
                onChange={v => updateConfig({ [`trust_badge_${n}_subtitle`]: v } as Partial<HomepageConfig>)}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Testimonials ── */}
      {tab === 'testimonials' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {lang === 'ar' ? `${testimonials.length} رأي` : `${testimonials.length} testimonials`}
            </p>
            <button
              onClick={() => { setEditTm(null); setShowTmModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800"
            >
              <Plus className="w-4 h-4"/>{T.addTm}
            </button>
          </div>

          {testimonials.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3"/>
              <p className="text-gray-500 text-sm">
                {lang === 'ar' ? 'لا توجد آراء بعد' : 'No testimonials yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testimonials.map(tm => (
                <div key={tm.id} className="bg-white border border-gray-100 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {tm.avatar_url ? (
                        <img src={tm.avatar_url} className="w-10 h-10 rounded-full object-cover"/>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#FF6B35] text-white flex items-center justify-center font-bold text-sm">
                          {tm.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{tm.name}</p>
                        <p className="text-xs text-gray-500">{tm.location}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < tm.rating ? 'fill-amber-500 text-amber-500' : 'text-gray-200'}`}/>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-3 leading-relaxed">
                    "{tm.text.en || tm.text.ar || tm.text.ms || ''}"
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <span className={`flex items-center gap-1 text-xs ${tm.is_active ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {tm.is_active ? <Eye className="w-3 h-3"/> : <EyeOff className="w-3 h-3"/>}
                      {tm.is_active ? (lang === 'ar' ? 'ظاهر' : 'Visible') : (lang === 'ar' ? 'مخفي' : 'Hidden')}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditTm(tm); setShowTmModal(true); }} className="p-1.5 hover:bg-gray-100 rounded">
                        <Edit3 className="w-3.5 h-3.5 text-gray-600"/>
                      </button>
                      <button onClick={async () => {
                        if (confirm('Delete?')) {
                          await deleteTestimonial(tm.id);
                          load();
                        }
                      }} className="p-1.5 hover:bg-rose-50 rounded">
                        <Trash2 className="w-3.5 h-3.5 text-rose-500"/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Testimonial Modal */}
      {showTmModal && (
        <TestimonialModal
          item={editTm}
          onClose={() => { setShowTmModal(false); setEditTm(null); }}
          onSaved={async () => {
            setShowTmModal(false);
            setEditTm(null);
            await load();
            addToast('success', T.saved);
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Testimonial Modal (create/edit)
// ═══════════════════════════════════════════════════════
function TestimonialModal({ item, onClose, onSaved }: {
  item: Testimonial | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { lang, isRTL } = useLanguage();
  const [name, setName] = useState(item?.name || '');
  const [location, setLocation] = useState(item?.location || '');
  const [country_code, setCountryCode] = useState(item?.country_code || '');
  const [rating, setRating] = useState(item?.rating || 5);
  const [is_active, setIsActive] = useState(item?.is_active ?? true);
  const [display_order, setDisplayOrder] = useState(item?.display_order || 0);
  const [text, setText] = useState(item?.text || { ar: '', en: '', ms: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (item) await updateTestimonial(item.id, { name, location, country_code, rating, is_active, display_order, text });
      else await createTestimonial({ name, location, country_code, rating, is_active, display_order, text });
      onSaved();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">
            {item ? (lang === 'ar' ? 'تعديل رأي' : 'Edit') : (lang === 'ar' ? 'إضافة رأي' : 'Add Testimonial')}
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500"/></button>
        </div>

        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">{lang === 'ar' ? 'الاسم' : 'Name'}</label>
              <input
                value={name} onChange={e => setName(e.target.value)}
                className="w-full h-10 px-3 mt-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B35]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">{lang === 'ar' ? 'الموقع' : 'Location'}</label>
              <input
                value={location} onChange={e => setLocation(e.target.value)}
                className="w-full h-10 px-3 mt-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B35]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">{lang === 'ar' ? 'كود الدولة' : 'Country Code'}</label>
              <input
                value={country_code} onChange={e => setCountryCode(e.target.value.toUpperCase())}
                placeholder="SA, MY, AE..." maxLength={2}
                className="w-full h-10 px-3 mt-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B35]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">{lang === 'ar' ? 'التقييم' : 'Rating'}</label>
              <select
                value={rating} onChange={e => setRating(Number(e.target.value))}
                className="w-full h-10 px-3 mt-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B35]"
              >
                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">{lang === 'ar' ? 'الترتيب' : 'Order'}</label>
              <input
                type="number"
                value={display_order} onChange={e => setDisplayOrder(Number(e.target.value))}
                className="w-full h-10 px-3 mt-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B35]"
              />
            </div>
          </div>

          <TriLangInput
            label={lang === 'ar' ? 'الرأي / الاقتباس' : 'Testimonial Text'}
            value={text}
            onChange={setText}
            multiline
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active"
              checked={is_active}
              onChange={e => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-[#FF6B35]"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              {lang === 'ar' ? 'نشط (يُعرض على الصفحة الرئيسية)' : 'Active (visible on homepage)'}
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={save}
            disabled={saving || !name || !location}
            className="flex-1 px-4 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-[#e07a38] disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : (lang === 'ar' ? 'حفظ' : 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomepageManagement;
