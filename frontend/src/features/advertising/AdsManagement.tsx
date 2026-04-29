import { useState, useEffect } from 'react';
import {
  Plus, Search, Edit, Trash2, Eye, EyeOff, X, Loader2,
  CheckCircle2, XCircle, AlertTriangle, BarChart3,
  TrendingUp, MousePointerClick, Activity, Calendar,
  ChevronLeft, ChevronRight, Filter, Image as ImageIcon,
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
type StatusFilter = 'all' | 'active' | 'inactive';

const DATE_LOCALE: Record<string, string> = {
  ar: 'ar-MY', en: 'en-MY', ms: 'ms-MY'
};

const AD_TYPE_COLORS: Record<string, string> = {
  BANNER:        'bg-blue-100 text-blue-700 border-blue-200',
  HERO_BANNER:   'bg-orange-100 text-orange-700 border-orange-200',
  POPUP:         'bg-red-100 text-red-700 border-red-200',
  FEATURED_CARD: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CAROUSEL_ITEM: 'bg-purple-100 text-purple-700 border-purple-200',
};

// ─── Toast List ─────────────────────────────────────────
function ToastList({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-sm px-4">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium ${
          t.type === 'success' ? 'bg-emerald-500' :
          t.type === 'error'   ? 'bg-red-500'     : 'bg-amber-500'
        }`}>
          {t.type === 'success' ? <CheckCircle2 className="w-5 h-5"/> :
           t.type === 'error'   ? <XCircle className="w-5 h-5"/> :
                                    <AlertTriangle className="w-5 h-5"/>}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)}><X className="w-4 h-4 opacity-70 hover:opacity-100"/></button>
        </div>
      ))}
    </div>
  );
}

// ─── Stats Card ─────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, iconBg }: {
  label: string;
  value: string | number;
  sub?: string;
  icon: any;
  color: string;
  iconBg: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Confirmation Modal ─────────────────────────────────
function ConfirmModal({ title, message, onConfirm, onCancel, isRTL }: {
  title: string; message: string;
  onConfirm: () => void; onCancel: () => void; isRTL: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500"/>
        </div>
        <h2 className="text-lg font-bold text-center mb-2">{title}</h2>
        <p className="text-gray-500 text-center text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border-2 rounded-xl font-medium hover:bg-gray-50 text-sm">إلغاء</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 text-sm">تأكيد الحذف</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// AdsManagement — الصفحة الرئيسية
// ═══════════════════════════════════════════════════════

export function AdsManagement() {
  const { t, lang, isRTL } = useLanguage();
  
  const [ads, setAds]               = useState<AdminAd[]>([]);
  const [stats, setStats]           = useState<AdminStats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [toasts, setToasts]         = useState<Toast[]>([]);
  const [searchQuery, setSearch]    = useState('');
  const [statusFilter, setStatus]   = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showModal, setShowModal]   = useState(false);
  const [editingAd, setEditingAd]   = useState<AdminAd | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminAd | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 10;
  
  const addToast = (type: ToastType, message: string) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 4000);
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
    } catch (e: any) {
      addToast('error', e.message || 'فشل التحميل');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { loadData(); }, []);
  
  // ─── Actions ───────────────────────────────────────
  
  const handleToggle = async (ad: AdminAd) => {
    try {
      const result = await toggleAd(ad.id || 0);
      setAds(prev => prev.map(a => a.id === ad.id ? { ...a, is_active: result.is_active } : a));
      addToast('success', result.is_active ? 'تم تفعيل الإعلان' : 'تم إيقاف الإعلان');
    } catch (e: any) {
      addToast('error', e.message);
    }
  };
  
  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteAd(confirmDelete.id || 0);
      setAds(prev => prev.filter(a => a.id !== confirmDelete.id));
      addToast('success', `تم حذف "${confirmDelete.name}"`);
      setConfirmDelete(null);
    } catch (e: any) {
      addToast('error', e.message);
    }
  };
  
  const handleEdit = (ad: AdminAd) => {
    setEditingAd(ad);
    setShowModal(true);
  };
  
  const handleAdd = () => {
    setEditingAd(null);
    setShowModal(true);
  };
  
  const handleModalClose = (saved: boolean) => {
    setShowModal(false);
    setEditingAd(null);
    if (saved) {
      loadData();
      addToast('success', 'تم الحفظ بنجاح');
    }
  };
  
  // ─── Filtering ─────────────────────────────────────
  
  const filtered = ads.filter(ad => {
    const matchSearch = ad.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && ad.is_active) ||
      (statusFilter === 'inactive' && !ad.is_active);
    const matchType = !typeFilter || ad.ad_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });
  
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  // ─── Render ────────────────────────────────────────
  
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin"/>
      <p className="text-gray-500">جاري تحميل الإعلانات...</p>
    </div>
  );
  
  return (
    <div className="max-w-7xl mx-auto space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <ToastList toasts={toasts} remove={id => setToasts(p => p.filter(x => x.id !== id))} />
      
      {/* ─── Header ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الإعلانات</h1>
          <p className="text-sm text-gray-500 mt-1">
            إدارة الإعلانات والبنرات في الموقع
          </p>
        </div>
        <button onClick={handleAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B35] hover:bg-[#e07a38] text-white rounded-xl text-sm font-bold shadow-md transition-colors">
          <Plus className="w-4 h-4"/>
          إعلان جديد
        </button>
      </div>
      
      {/* ─── Stats Cards ──────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="إجمالي الإعلانات" value={stats.total_ads}
            icon={ImageIcon} color="text-blue-600" iconBg="bg-blue-50"/>
          <StatCard label="الإعلانات النشطة" value={stats.active_ads}
            sub={`${stats.inactive_ads} موقوف`}
            icon={CheckCircle2} color="text-emerald-600" iconBg="bg-emerald-50"/>
          <StatCard label="المشاهدات (30 يوم)"
            value={stats.views.toLocaleString(DATE_LOCALE[lang] || 'en')}
            icon={Eye} color="text-indigo-600" iconBg="bg-indigo-50"/>
          <StatCard label="النقرات (30 يوم)"
            value={stats.clicks.toLocaleString(DATE_LOCALE[lang] || 'en')}
            icon={MousePointerClick} color="text-purple-600" iconBg="bg-purple-50"/>
          <StatCard label="معدل النقر CTR" value={`${stats.ctr}%`}
            sub="آخر 30 يوم"
            icon={TrendingUp} color="text-orange-600" iconBg="bg-orange-50"/>
        </div>
      )}
      
      {/* ─── Top Performing Ads ─────────────────────── */}
      {stats && stats.top_ads.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-500"/>
            أفضل الإعلانات أداءً (آخر 30 يوم)
          </h3>
          <div className="grid gap-2">
            {stats.top_ads.map((ad, idx) => (
              <div key={ad.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">{ad.name}</p>
                  <p className="text-xs text-gray-500">{ad.ad_type}</p>
                </div>
                <div className="text-end font-mono text-xs">
                  <div className="text-blue-600">{ad.views} مشاهدة</div>
                  <div className="text-emerald-600">{ad.clicks} نقرة</div>
                </div>
                <div className="text-end">
                  <div className="text-lg font-bold text-orange-600">{ad.ctr}%</div>
                  <div className="text-xs text-gray-400">CTR</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* ─── Filters Bar ────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`}/>
          <input
            type="text"
            placeholder="ابحث باسم الإعلان..."
            value={searchQuery}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
          />
        </div>
        
        <select value={statusFilter} onChange={e => { setStatus(e.target.value as StatusFilter); setCurrentPage(1); }}
          className="border p-2.5 rounded-xl text-sm md:w-40 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">موقوف</option>
        </select>
        
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}
          className="border p-2.5 rounded-xl text-sm md:w-44 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">كل الأنواع</option>
          <option value="BANNER">بنر</option>
          <option value="HERO_BANNER">بنر رئيسي</option>
          <option value="POPUP">منبثقة</option>
          <option value="FEATURED_CARD">بطاقة مميزة</option>
          <option value="CAROUSEL_ITEM">سلايدر</option>
        </select>
      </div>
      
      {/* ─── Table ──────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className={`px-5 py-4 text-${isRTL ? 'right' : 'left'} text-xs font-semibold text-gray-500 uppercase`}>الإعلان</th>
                <th className={`px-5 py-4 text-${isRTL ? 'right' : 'left'} text-xs font-semibold text-gray-500 uppercase`}>النوع</th>
                <th className={`px-5 py-4 text-${isRTL ? 'right' : 'left'} text-xs font-semibold text-gray-500 uppercase`}>الإحصائيات</th>
                <th className={`px-5 py-4 text-${isRTL ? 'right' : 'left'} text-xs font-semibold text-gray-500 uppercase`}>الأولوية</th>
                <th className={`px-5 py-4 text-${isRTL ? 'right' : 'left'} text-xs font-semibold text-gray-500 uppercase`}>الحالة</th>
                <th className={`px-5 py-4 text-${isRTL ? 'right' : 'left'} text-xs font-semibold text-gray-500 uppercase`}>إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-200"/>
                  <p className="text-gray-400 text-sm">لا يوجد إعلانات</p>
                </td></tr>
              ) : paginated.map((ad, idx) => (
                <tr key={ad.id || ad.uid || idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {ad.image_desktop ? (
                        <img src={ad.image_desktop} alt={ad.name} className="w-16 h-10 object-cover rounded-lg border"/>
                      ) : (
                        <div className="w-16 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-gray-400"/>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate max-w-xs">{ad.name}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(ad.created_at).toLocaleDateString(DATE_LOCALE[lang] || 'en-US')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${AD_TYPE_COLORS[ad.ad_type] || 'bg-gray-100 text-gray-700'}`}>
                      {ad.ad_type}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {ad.stats ? (
                      <div className="text-xs font-mono">
                        <div className="text-blue-600">👁 {ad.stats.views}</div>
                        <div className="text-emerald-600">🖱 {ad.stats.clicks}</div>
                        <div className="text-orange-600">CTR: {ad.stats.ctr}%</div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-bold text-gray-700">{ad.priority}</span>
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => handleToggle(ad)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer transition-colors ${
                        ad.is_active
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}>
                      {ad.is_active ? '● نشط' : '○ موقوف'}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => handleToggle(ad)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                        title={ad.is_active ? 'إيقاف' : 'تفعيل'}>
                        {ad.is_active ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                      </button>
                      <button onClick={() => handleEdit(ad)}
                        className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                        title="تعديل">
                        <Edit className="w-4 h-4"/>
                      </button>
                      <button onClick={() => setConfirmDelete(ad)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                        title="حذف">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* ─── Pagination ─────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border rounded-2xl px-6 py-4">
          <span className="text-sm text-gray-500">
            {`${(currentPage-1)*itemsPerPage + 1}-${Math.min(currentPage*itemsPerPage, filtered.length)} من ${filtered.length}`}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(p-1, 1))} disabled={currentPage===1}
              className="flex items-center gap-1 px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">
              {isRTL ? <ChevronRight className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>}
              السابق
            </button>
            {Array.from({length: Math.min(totalPages, 5)}, (_, i) => i+1).map(p => (
              <button key={p} onClick={() => setCurrentPage(p)}
                className={`w-9 h-9 rounded-xl text-sm font-medium ${
                  currentPage === p ? 'bg-[#FF6B35] text-white' : 'hover:bg-gray-100 text-gray-600'
                }`}>{p}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))} disabled={currentPage===totalPages}
              className="flex items-center gap-1 px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">
              التالي
              {isRTL ? <ChevronLeft className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
            </button>
          </div>
        </div>
      )}
      
      {/* ─── Modal للإضافة/التعديل ─────────────────── */}
      {showModal && (
        <AdFormModal
          ad={editingAd}
          onClose={handleModalClose}
        />
      )}
      
      {/* ─── Confirm Delete ──────────────────────── */}
      {confirmDelete && (
        <ConfirmModal
          title="حذف الإعلان"
          message={`هل أنت متأكد من حذف "${confirmDelete.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          isRTL={isRTL}
        />
      )}
    </div>
  );
}
