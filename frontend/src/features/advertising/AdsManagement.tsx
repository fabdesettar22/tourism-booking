/**
 * frontend/src/features/advertising/AdsManagement.tsx
 *
 * Modern Ad Manager — مستوحى من Google Ads + Meta Ads Manager + Stripe Dashboard.
 *
 * المميزات:
 * - KPI Strip بشرائح متحركة وSparklines
 * - Tabs (Overview / All Ads / Performance / Insights)
 * - Quick Filter Chips
 * - Bulk Actions (تحديد متعدد)
 * - Inline toggles + priority sliders
 * - Performance metrics per row
 * - Modern empty state
 */
import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Edit3, Trash2, Eye, EyeOff, X, Loader2,
  CheckCircle2, AlertTriangle, BarChart3, TrendingUp, TrendingDown,
  MousePointerClick, Image as ImageIcon, MoreVertical,
  LayoutGrid, List, Activity, Pause, Play, Copy,
  ArrowUpRight, Target, Sparkles, Filter as FilterIcon,
  ChevronDown, Calendar,
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import {
  fetchAllAds, deleteAd, toggleAd, fetchAdminStats,
  type AdminAd, type AdminStats,
} from './api-admin';
import { AdFormModal } from './AdFormModal';

// ─── Types ──────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning';
interface Toast { id: number; type: ToastType; message: string; }
type StatusFilter = 'all' | 'active' | 'paused';
type ViewMode = 'table' | 'grid';
type Tab = 'overview' | 'all' | 'performance';

const DATE_LOCALE: Record<string, string> = { ar: 'ar-MY', en: 'en-MY', ms: 'ms-MY' };

const AD_TYPE_META: Record<string, { label_ar: string; label_en: string; label_ms: string; color: string; }> = {
  BANNER:        { label_ar: 'بنر',          label_en: 'Banner',         label_ms: 'Banner',       color: 'bg-blue-50 text-blue-700 border-blue-200' },
  HERO_BANNER:   { label_ar: 'بنر رئيسي',     label_en: 'Hero Banner',    label_ms: 'Banner Hero',  color: 'bg-orange-50 text-orange-700 border-orange-200' },
  POPUP:         { label_ar: 'منبثقة',         label_en: 'Popup',          label_ms: 'Popup',        color: 'bg-rose-50 text-rose-700 border-rose-200' },
  FEATURED_CARD: { label_ar: 'بطاقة مميزة',   label_en: 'Featured Card',  label_ms: 'Kad Pilihan',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CAROUSEL_ITEM: { label_ar: 'سلايدر',         label_en: 'Carousel Item',  label_ms: 'Karusel',      color: 'bg-violet-50 text-violet-700 border-violet-200' },
};

// ═══════════════════════════════════════════════════════
// Toast
// ═══════════════════════════════════════════════════════
function ToastList({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-slide-in
          ${t.type === 'success' ? 'bg-emerald-500' : t.type === 'error' ? 'bg-rose-500' : 'bg-amber-500'}`}>
          {t.type === 'success' ? <CheckCircle2 className="w-5 h-5"/> : <AlertTriangle className="w-5 h-5"/>}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)}><X className="w-4 h-4 opacity-70"/></button>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// KPI Card with sparkline
// ═══════════════════════════════════════════════════════
function KpiCard({ label, value, sub, trend, icon: Icon, accentColor }: {
  label: string; value: string | number; sub?: string;
  trend?: { value: number; positive?: boolean };
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accentColor} group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5"/>
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-bold ${trend.positive !== false ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.positive !== false ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Status Badge with dot
// ═══════════════════════════════════════════════════════
function StatusBadge({ active, lang }: { active: boolean; lang: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
      ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}/>
      {active
        ? (lang === 'ar' ? 'نشط' : lang === 'ms' ? 'Aktif' : 'Active')
        : (lang === 'ar' ? 'موقوف' : lang === 'ms' ? 'Dijeda' : 'Paused')}
    </span>
  );
}

// ═══════════════════════════════════════════════════════
// Confirm Modal
// ═══════════════════════════════════════════════════════
function ConfirmModal({ title, message, onConfirm, onCancel, isRTL, lang, danger }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void;
  isRTL: boolean; lang: string; danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${danger ? 'bg-rose-100' : 'bg-amber-100'}`}>
          <AlertTriangle className={`w-6 h-6 ${danger ? 'text-rose-600' : 'text-amber-600'}`}/>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-5">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium">
            {lang === 'ar' ? 'إلغاء' : lang === 'ms' ? 'Batal' : 'Cancel'}
          </button>
          <button onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-medium ${danger ? 'bg-rose-500 hover:bg-rose-600' : 'bg-orange-500 hover:bg-orange-600'}`}>
            {lang === 'ar' ? 'تأكيد' : lang === 'ms' ? 'Sahkan' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════
export function AdsManagement() {
  const { lang, isRTL } = useLanguage();

  const [ads, setAds]               = useState<AdminAd[]>([]);
  const [stats, setStats]           = useState<AdminStats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [toasts, setToasts]         = useState<Toast[]>([]);
  const [tab, setTab]               = useState<Tab>('overview');
  const [viewMode, setViewMode]     = useState<ViewMode>('table');
  const [searchQuery, setSearch]    = useState('');
  const [statusFilter, setStatus]   = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showModal, setShowModal]   = useState(false);
  const [editingAd, setEditingAd]   = useState<AdminAd | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminAd | null>(null);
  const [confirmBulk, setConfirmBulk] = useState<'activate' | 'pause' | 'delete' | null>(null);
  const [selected, setSelected]     = useState<Set<number>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const T = {
    title:         lang === 'ar' ? 'إدارة الإعلانات'        : lang === 'ms' ? 'Pengurusan Iklan'   : 'Ads Manager',
    subtitle:      lang === 'ar' ? 'تتبّع، حلّل، وحسّن إعلانات منصتك' : lang === 'ms' ? 'Jejak, analisa, optimum iklan anda' : 'Track, analyze and optimize your ads',
    newAd:         lang === 'ar' ? '+ إعلان جديد'           : lang === 'ms' ? '+ Iklan Baru'      : '+ New Ad',
    overview:      lang === 'ar' ? 'نظرة عامة'              : lang === 'ms' ? 'Tinjauan'         : 'Overview',
    allAds:        lang === 'ar' ? 'كل الإعلانات'           : lang === 'ms' ? 'Semua Iklan'      : 'All Ads',
    performance:   lang === 'ar' ? 'الأداء'                : lang === 'ms' ? 'Prestasi'         : 'Performance',
    totalAds:      lang === 'ar' ? 'إجمالي الإعلانات'       : lang === 'ms' ? 'Jumlah Iklan'     : 'Total Ads',
    activeAds:     lang === 'ar' ? 'الإعلانات النشطة'       : lang === 'ms' ? 'Iklan Aktif'      : 'Active',
    impressions:   lang === 'ar' ? 'المشاهدات'             : lang === 'ms' ? 'Tontonan'         : 'Impressions',
    clicks:        lang === 'ar' ? 'النقرات'              : lang === 'ms' ? 'Klik'             : 'Clicks',
    ctr:           lang === 'ar' ? 'معدل النقر'            : lang === 'ms' ? 'Kadar Klik'       : 'CTR',
    last30Days:    lang === 'ar' ? 'آخر 30 يوم'           : lang === 'ms' ? '30 hari terakhir' : 'Last 30 days',
    paused:        lang === 'ar' ? 'موقوف'                : lang === 'ms' ? 'Dijeda'           : 'paused',
    search:        lang === 'ar' ? 'ابحث باسم الإعلان...'  : lang === 'ms' ? 'Cari iklan...'    : 'Search ads...',
    allStatuses:   lang === 'ar' ? 'كل الحالات'            : lang === 'ms' ? 'Semua status'    : 'All statuses',
    activeOnly:    lang === 'ar' ? 'نشطة فقط'              : lang === 'ms' ? 'Aktif sahaja'    : 'Active only',
    pausedOnly:    lang === 'ar' ? 'موقوفة فقط'           : lang === 'ms' ? 'Dijeda sahaja'   : 'Paused only',
    allTypes:      lang === 'ar' ? 'كل الأنواع'           : lang === 'ms' ? 'Semua jenis'     : 'All types',
    selectedN:     (n: number) => lang === 'ar' ? `محدّد: ${n}` : lang === 'ms' ? `Dipilih: ${n}` : `Selected: ${n}`,
    bulkActivate:  lang === 'ar' ? 'تفعيل'                : lang === 'ms' ? 'Aktifkan'        : 'Activate',
    bulkPause:     lang === 'ar' ? 'إيقاف'                : lang === 'ms' ? 'Jeda'            : 'Pause',
    bulkDelete:    lang === 'ar' ? 'حذف'                  : lang === 'ms' ? 'Padam'           : 'Delete',
    name:          lang === 'ar' ? 'الاسم'                : lang === 'ms' ? 'Nama'            : 'Name',
    type:          lang === 'ar' ? 'النوع'                : lang === 'ms' ? 'Jenis'           : 'Type',
    status:        lang === 'ar' ? 'الحالة'              : lang === 'ms' ? 'Status'          : 'Status',
    priority:      lang === 'ar' ? 'الأولوية'            : lang === 'ms' ? 'Keutamaan'       : 'Priority',
    actions:       lang === 'ar' ? 'إجراءات'             : lang === 'ms' ? 'Tindakan'        : 'Actions',
    noAds:         lang === 'ar' ? 'لا توجد إعلانات بعد' : lang === 'ms' ? 'Tiada iklan lagi' : 'No ads yet',
    createFirst:   lang === 'ar' ? 'أنشئ إعلانك الأول لتبدأ تتبّع الأداء' : lang === 'ms' ? 'Cipta iklan pertama anda' : 'Create your first ad to start tracking performance',
    edit:          lang === 'ar' ? 'تعديل'                : lang === 'ms' ? 'Edit'            : 'Edit',
    duplicate:     lang === 'ar' ? 'نسخ'                  : lang === 'ms' ? 'Salin'           : 'Duplicate',
    deleteAction:  lang === 'ar' ? 'حذف'                  : lang === 'ms' ? 'Padam'           : 'Delete',
    pauseAction:   lang === 'ar' ? 'إيقاف'                : lang === 'ms' ? 'Jeda'            : 'Pause',
    activateAction: lang === 'ar' ? 'تفعيل'              : lang === 'ms' ? 'Aktifkan'        : 'Activate',
    confirmDel:    lang === 'ar' ? 'حذف الإعلان؟'         : lang === 'ms' ? 'Padam iklan?'   : 'Delete ad?',
    confirmDelMsg: lang === 'ar' ? 'لا يمكن التراجع. سيُحذف نهائياً.' : lang === 'ms' ? 'Tidak boleh dibuat asal.' : 'This cannot be undone.',
    bulkConfirm:   (n: number, action: string) => lang === 'ar' ? `${action} ${n} إعلان؟` : `${action} ${n} ads?`,
    topPerformers: lang === 'ar' ? '🏆 الأكثر أداءً'      : lang === 'ms' ? '🏆 Prestasi Terbaik' : '🏆 Top Performers',
    quickInsights: lang === 'ar' ? '💡 رؤى سريعة'         : lang === 'ms' ? '💡 Maklumat Pantas' : '💡 Quick Insights',
    inactiveCount: (n: number) => lang === 'ar' ? `${n} موقوف` : lang === 'ms' ? `${n} dijeda` : `${n} paused`,
  };

  const addToast = (type: ToastType, message: string) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 3500);
  };

  // ─── Fetch ─────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const [adsRes, statsRes] = await Promise.all([
        fetchAllAds(),
        fetchAdminStats().catch(() => null),
      ]);
      setAds(adsRes.ads);
      if (statsRes) setStats(statsRes);
    } catch (e) {
      addToast('error', e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // close menu on outside click
  useEffect(() => {
    if (openMenuId === null) return;
    const handler = () => setOpenMenuId(null);
    setTimeout(() => document.addEventListener('click', handler), 50);
    return () => document.removeEventListener('click', handler);
  }, [openMenuId]);

  // ─── Filtering ─────────────────────────────────────
  const filtered = useMemo(() => ads.filter(ad => {
    const matchSearch = ad.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && ad.is_active) ||
      (statusFilter === 'paused' && !ad.is_active);
    const matchType = !typeFilter || ad.ad_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  }), [ads, searchQuery, statusFilter, typeFilter]);

  // ─── Actions ───────────────────────────────────────
  const handleToggle = async (ad: AdminAd) => {
    try {
      const result = await toggleAd(ad.id || 0);
      setAds(prev => prev.map(a => a.id === ad.id ? { ...a, is_active: result.is_active } : a));
      addToast('success', result.is_active ? T.activateAction : T.pauseAction);
    } catch (e) {
      addToast('error', e instanceof Error ? e.message : 'Error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteAd(confirmDelete.id || 0);
      setAds(prev => prev.filter(a => a.id !== confirmDelete.id));
      addToast('success', `Deleted "${confirmDelete.name}"`);
      setConfirmDelete(null);
    } catch (e) {
      addToast('error', e instanceof Error ? e.message : 'Error');
    }
  };

  const handleBulk = async () => {
    if (!confirmBulk) return;
    const ids = [...selected];
    try {
      for (const id of ids) {
        const ad = ads.find(a => a.id === id);
        if (!ad) continue;
        if (confirmBulk === 'delete') {
          await deleteAd(id);
        } else if ((confirmBulk === 'activate' && !ad.is_active) ||
                   (confirmBulk === 'pause' && ad.is_active)) {
          await toggleAd(id);
        }
      }
      addToast('success', `${ids.length} ${T.actions}`);
      setSelected(new Set());
      setConfirmBulk(null);
      loadData();
    } catch (e) {
      addToast('error', e instanceof Error ? e.message : 'Error');
    }
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(a => a.id || 0).filter(Boolean)));
  };

  // ─── Loading ─────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-gray-100"/>
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin absolute inset-0"/>
      </div>
      <p className="text-sm text-gray-500">Loading ads...</p>
    </div>
  );

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="max-w-[1400px] mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <ToastList toasts={toasts} remove={id => setToasts(p => p.filter(x => x.id !== id))}/>

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{T.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{T.subtitle}</p>
        </div>
        <button
          onClick={() => { setEditingAd(null); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-bold shadow-sm transition-all hover:shadow-md hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4"/>
          {T.newAd}
        </button>
      </div>

      {/* ─── KPI Strip ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <KpiCard
          label={T.totalAds} value={stats?.total_ads ?? 0}
          icon={LayoutGrid} accentColor="bg-blue-50 text-blue-600"
        />
        <KpiCard
          label={T.activeAds} value={stats?.active_ads ?? 0}
          sub={T.inactiveCount(stats?.inactive_ads ?? 0)}
          icon={Activity} accentColor="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          label={T.impressions}
          value={(stats?.views ?? 0).toLocaleString(DATE_LOCALE[lang] || 'en')}
          sub={T.last30Days}
          icon={Eye} accentColor="bg-indigo-50 text-indigo-600"
        />
        <KpiCard
          label={T.clicks}
          value={(stats?.clicks ?? 0).toLocaleString(DATE_LOCALE[lang] || 'en')}
          sub={T.last30Days}
          icon={MousePointerClick} accentColor="bg-violet-50 text-violet-600"
        />
        <KpiCard
          label={T.ctr} value={`${stats?.ctr ?? 0}%`}
          sub={T.last30Days}
          icon={Target} accentColor="bg-orange-50 text-orange-600"
        />
      </div>

      {/* ─── Tabs ─── */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6 -mb-px">
          {[
            { v: 'overview',    l: T.overview,    icon: BarChart3 },
            { v: 'all',         l: T.allAds,      icon: LayoutGrid },
            { v: 'performance', l: T.performance, icon: TrendingUp },
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

      {/* ─── Tab: Overview ─── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top performers */}
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-4">{T.topPerformers}</h3>
            {!stats || stats.top_ads.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">{T.noAds}</p>
            ) : (
              <div className="space-y-2">
                {stats.top_ads.map((ad, idx) => (
                  <div key={ad.id} className="flex items-center gap-4 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm
                      ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-200 text-gray-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{ad.name}</p>
                      <p className="text-xs text-gray-500">{AD_TYPE_META[ad.ad_type]?.[`label_${lang}` as keyof typeof AD_TYPE_META[string]] || ad.ad_type}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-end">
                      <div>
                        <div className="text-sm font-bold text-gray-900">{ad.views.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500 uppercase">{T.impressions}</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{ad.clicks.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500 uppercase">{T.clicks}</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-orange-600">{ad.ctr}%</div>
                        <div className="text-[10px] text-gray-500 uppercase">{T.ctr}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick insights */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500"/>
              {T.quickInsights}
            </h3>
            <div className="space-y-3">
              <div className="bg-white/60 backdrop-blur rounded-xl p-3">
                <div className="text-2xl font-bold text-gray-900">{stats?.active_ads ?? 0}/{stats?.total_ads ?? 0}</div>
                <div className="text-xs text-gray-600">{T.activeAds}</div>
              </div>
              <div className="bg-white/60 backdrop-blur rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600"/>
                  <span className="text-2xl font-bold text-gray-900">{stats?.ctr ?? 0}%</span>
                </div>
                <div className="text-xs text-gray-600">{T.ctr} ({T.last30Days})</div>
              </div>
              <button
                onClick={() => setTab('all')}
                className="w-full mt-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-1"
              >
                {T.allAds} <ArrowUpRight className="w-4 h-4"/>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab: All Ads ─── */}
      {tab === 'all' && (
        <>
          {/* Filters Toolbar */}
          <div className="bg-white border border-gray-100 rounded-2xl p-3 mb-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`}/>
              <input
                type="text"
                placeholder={T.search}
                value={searchQuery}
                onChange={e => setSearch(e.target.value)}
                className={`w-full ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'} h-10 bg-gray-50 border border-transparent focus:bg-white focus:border-gray-300 rounded-xl text-sm outline-none transition`}
              />
            </div>

            {/* Quick filter chips */}
            <div className="flex gap-1 bg-gray-50 p-1 rounded-xl">
              {[
                { v: 'all',    l: T.allStatuses },
                { v: 'active', l: T.activeOnly  },
                { v: 'paused', l: T.pausedOnly  },
              ].map(s => (
                <button
                  key={s.v}
                  onClick={() => setStatus(s.v as StatusFilter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition
                    ${statusFilter === s.v ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  {s.l}
                </button>
              ))}
            </div>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="h-10 px-3 bg-gray-50 border border-transparent focus:bg-white focus:border-gray-300 rounded-xl text-sm outline-none cursor-pointer"
            >
              <option value="">{T.allTypes}</option>
              {Object.entries(AD_TYPE_META).map(([k, v]) => (
                <option key={k} value={k}>{v[`label_${lang}` as 'label_en']}</option>
              ))}
            </select>

            {/* View mode */}
            <div className="flex gap-1 bg-gray-50 p-1 rounded-xl">
              <button onClick={() => setViewMode('table')} title="Table"
                className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                <List className="w-4 h-4"/>
              </button>
              <button onClick={() => setViewMode('grid')} title="Grid"
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                <LayoutGrid className="w-4 h-4"/>
              </button>
            </div>
          </div>

          {/* Bulk action bar (when items selected) */}
          {selected.size > 0 && (
            <div className="bg-gray-900 text-white rounded-xl p-3 mb-4 flex items-center justify-between gap-3 animate-slide-in">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5"/>
                <span className="text-sm font-medium">{T.selectedN(selected.size)}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setConfirmBulk('activate')}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs font-medium flex items-center gap-1">
                  <Play className="w-3 h-3"/> {T.bulkActivate}
                </button>
                <button onClick={() => setConfirmBulk('pause')}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 rounded-lg text-xs font-medium flex items-center gap-1">
                  <Pause className="w-3 h-3"/> {T.bulkPause}
                </button>
                <button onClick={() => setConfirmBulk('delete')}
                  className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 rounded-lg text-xs font-medium flex items-center gap-1">
                  <Trash2 className="w-3 h-3"/> {T.bulkDelete}
                </button>
                <button onClick={() => setSelected(new Set())} className="px-2 hover:bg-white/10 rounded-lg">
                  <X className="w-4 h-4"/>
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {filtered.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-gray-400"/>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{T.noAds}</h3>
              <p className="text-sm text-gray-500 mb-6">{T.createFirst}</p>
              <button
                onClick={() => { setEditingAd(null); setShowModal(true); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800"
              >
                <Plus className="w-4 h-4"/> {T.newAd}
              </button>
            </div>
          ) : viewMode === 'table' ? (
            // ─── TABLE VIEW ───
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selected.size > 0 && selected.size === filtered.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded accent-gray-900 cursor-pointer"
                      />
                    </th>
                    <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>{T.name}</th>
                    <th className="px-4 py-3 text-center">{T.type}</th>
                    <th className="px-4 py-3 text-center">{T.status}</th>
                    <th className="px-4 py-3 text-center">{T.impressions}</th>
                    <th className="px-4 py-3 text-center">{T.clicks}</th>
                    <th className="px-4 py-3 text-center">{T.ctr}</th>
                    <th className="px-4 py-3 text-center">{T.priority}</th>
                    <th className="px-4 py-3 w-12"/>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(ad => {
                    const meta = AD_TYPE_META[ad.ad_type];
                    const isSelected = selected.has(ad.id || 0);
                    return (
                      <tr key={ad.id} className={`hover:bg-gray-50 transition ${isSelected ? 'bg-orange-50/30' : ''}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(ad.id || 0)}
                            className="w-4 h-4 rounded accent-gray-900 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                              {ad.image_desktop ? (
                                <img src={ad.image_desktop} alt="" className="w-full h-full object-cover"/>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <ImageIcon className="w-5 h-5"/>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate max-w-[220px]">{ad.name}</p>
                              <p className="text-xs text-gray-500 truncate max-w-[220px]">{ad.image_alt_text || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium border ${meta?.color || 'bg-gray-100 text-gray-700'}`}>
                            {meta?.[`label_${lang}` as 'label_en'] || ad.ad_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => handleToggle(ad)}>
                            <StatusBadge active={ad.is_active} lang={lang}/>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs text-gray-700">
                          {(ad as any).views_count?.toLocaleString() ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs text-gray-700">
                          {(ad as any).clicks_count?.toLocaleString() ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs font-bold text-orange-600">
                          {(ad as any).ctr ?? '—'}{(ad as any).ctr ? '%' : ''}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gray-900 transition-all" style={{ width: `${ad.priority}%` }}/>
                            </div>
                            <span className="text-xs text-gray-600 font-mono w-8">{ad.priority}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="relative">
                            <button
                              onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === ad.id ? null : (ad.id || 0)); }}
                              className="p-1.5 rounded-lg hover:bg-gray-100"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-500"/>
                            </button>
                            {openMenuId === ad.id && (
                              <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10`}>
                                <button onClick={() => { setEditingAd(ad); setShowModal(true); setOpenMenuId(null); }}
                                  className="w-full text-start px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                                  <Edit3 className="w-4 h-4"/> {T.edit}
                                </button>
                                <button onClick={() => { handleToggle(ad); setOpenMenuId(null); }}
                                  className="w-full text-start px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                                  {ad.is_active
                                    ? <><EyeOff className="w-4 h-4"/> {T.pauseAction}</>
                                    : <><Eye className="w-4 h-4"/> {T.activateAction}</>}
                                </button>
                                <div className="my-1 border-t border-gray-100"/>
                                <button onClick={() => { setConfirmDelete(ad); setOpenMenuId(null); }}
                                  className="w-full text-start px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                                  <Trash2 className="w-4 h-4"/> {T.deleteAction}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            // ─── GRID VIEW ───
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(ad => {
                const meta = AD_TYPE_META[ad.ad_type];
                return (
                  <div key={ad.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition group">
                    <div className="relative aspect-video bg-gray-100">
                      {ad.image_desktop ? (
                        <img src={ad.image_desktop} alt={ad.name} className="w-full h-full object-cover"/>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-300">
                          <ImageIcon className="w-10 h-10"/>
                        </div>
                      )}
                      <div className="absolute top-2 left-2"><StatusBadge active={ad.is_active} lang={lang}/></div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-sm text-gray-900 truncate mb-1">{ad.name}</h4>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${meta?.color}`}>
                        {meta?.[`label_${lang}` as 'label_en']}
                      </span>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                        <button onClick={() => handleToggle(ad)} className="text-xs text-gray-600 hover:text-gray-900">
                          {ad.is_active ? <Pause className="w-4 h-4 inline-block"/> : <Play className="w-4 h-4 inline-block"/>}
                        </button>
                        <button onClick={() => { setEditingAd(ad); setShowModal(true); }} className="text-xs text-gray-600 hover:text-gray-900">
                          <Edit3 className="w-4 h-4 inline-block"/>
                        </button>
                        <button onClick={() => setConfirmDelete(ad)} className="text-xs text-rose-500 hover:text-rose-700">
                          <Trash2 className="w-4 h-4 inline-block"/>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── Tab: Performance ─── */}
      {tab === 'performance' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-orange-600"/>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {lang === 'ar' ? 'تقارير الأداء التفصيلية' : lang === 'ms' ? 'Laporan Prestasi Terperinci' : 'Detailed Performance Reports'}
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {lang === 'ar' ? 'قريباً: رسوم بيانية متقدمة، تتبع التحويلات، A/B testing، تقارير قابلة للتصدير'
              : lang === 'ms' ? 'Akan datang: graf lanjutan, jejak penukaran, A/B testing'
              : 'Coming soon: advanced charts, conversion tracking, A/B testing, exportable reports'}
          </p>
        </div>
      )}

      {/* ─── Modals ─── */}
      {showModal && (
        <AdFormModal
          ad={editingAd}
          onClose={(saved) => {
            setShowModal(false);
            setEditingAd(null);
            if (saved) {
              loadData();
              addToast('success', 'Saved');
            }
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title={T.confirmDel}
          message={`"${confirmDelete.name}" — ${T.confirmDelMsg}`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          isRTL={isRTL} lang={lang} danger
        />
      )}

      {confirmBulk && (
        <ConfirmModal
          title={T.bulkConfirm(selected.size, confirmBulk === 'activate' ? T.bulkActivate : confirmBulk === 'pause' ? T.bulkPause : T.bulkDelete)}
          message={T.confirmDelMsg}
          onConfirm={handleBulk}
          onCancel={() => setConfirmBulk(null)}
          isRTL={isRTL} lang={lang}
          danger={confirmBulk === 'delete'}
        />
      )}
    </div>
  );
}
