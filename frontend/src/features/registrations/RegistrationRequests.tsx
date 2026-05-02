// src/features/registrations/RegistrationRequests.tsx
import { useEffect, useState, useMemo } from 'react';
import {
  Loader2, Search, CheckCircle2, XCircle, Clock, TrendingUp,
  Building2, Store, Filter, Check, Ban, X, AlertTriangle,
  Calendar, MapPin, Mail, Phone, FileText, ExternalLink, RefreshCw,
  Eye, User, Globe, Hash,
} from 'lucide-react';
import { apiFetch } from '../../services/apiFetch';
import { useLanguage } from '../../hooks/useLanguage';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

interface AgencyPending {
  id:                  string;
  name:                string;
  name_en?:            string;
  email:               string;
  phone:               string;
  country:             string;
  city:                string;
  registration_number: string;
  agency_type:         string;
  contact_person_name: string;
  trade_license?:      string | null;
  tax_certificate?:    string | null;
  owner_id_document?:  string | null;
  logo?:               string | null;
  created_at:          string;
}

interface WaitlistPhotoItem {
  id:         number;
  url:        string | null;
  is_primary: boolean;
  order:      number;
  caption:    string;
}

interface SupplierPending {
  id:               string;
  ref_number?:      string;
  company_name:     string;
  full_name?:       string;
  supplier_type:    string;
  email:            string;
  phone:            string;
  country:          string;
  country_code?:    string;
  country_ref_name?: string;
  city:             string;
  city_ref_name?:   string;
  region?:          string;
  description?:     string;
  status:           string;
  created_at:       string;
  user_email?:      string;
  currency?:        string;
  sync_mode?:       string;
  channel_name?:    string;
  worked_before?:   boolean;
  how_did_you_hear?: string;
  type_specific?:   Record<string, unknown>;
  documents?:       Record<string, string>;
  photos?:          WaitlistPhotoItem[];
}

type TabKey = 'agencies' | 'suppliers';
type ToastType = 'success' | 'error' | 'warning';
interface Toast { id: number; type: ToastType; message: string; }

// ═══════════════════════════════════════════════════════════
// Date locale map
// ═══════════════════════════════════════════════════════════
const DATE_LOCALE: Record<string, string> = { ar: 'ar-EG', en: 'en-US', ms: 'ms-MY' };

// ═══════════════════════════════════════════════════════════
// Toast List
// ═══════════════════════════════════════════════════════════

function ToastList({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-sm px-4">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium
          ${t.type === 'success' ? 'bg-emerald-500' : t.type === 'error' ? 'bg-red-500' : 'bg-amber-500'}`}>
          {t.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> :
           t.type === 'error'   ? <XCircle className="w-5 h-5 shrink-0" /> :
           <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)}><X className="w-4 h-4 opacity-70 hover:opacity-100" /></button>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Reject Modal
// ═══════════════════════════════════════════════════════════

function RejectModal({ name, onConfirm, onCancel, loading }: {
  name: string; onConfirm: (reason: string) => void; onCancel: () => void; loading: boolean;
}) {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');
  const canSubmit = reason.trim().length >= 10;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-7 shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 bg-red-100 rounded-full flex items-center justify-center">
            <Ban className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{t('regRequests.rejectModal.title')}</h3>
            <p className="text-xs text-gray-500">"{name}"</p>
          </div>
        </div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
          {t('regRequests.rejectModal.reasonLabel')}
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={4}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 resize-none"
          placeholder={t('regRequests.rejectModal.reasonPlaceholder')}
        />
        <p className="text-xs text-gray-400 mt-1">{t('regRequests.rejectModal.charsCount').replace('{n}', String(reason.length))}</p>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl font-medium text-sm hover:bg-gray-50">
            {t('regRequests.rejectModal.cancel')}
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={!canSubmit || loading}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium text-sm hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
            {t('regRequests.rejectModal.confirmReject')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Approve Modal
// ═══════════════════════════════════════════════════════════

function ApproveModal({ name, isAgency, supplierType, proposedCategoryName, customFields,
                       onConfirm, onCancel, loading }: {
  name: string; isAgency: boolean;
  supplierType?: string;
  proposedCategoryName?: string;
  customFields?: Array<{ name: string; type: string; value: string }>;
  onConfirm: (opts: { commission?: number; promote_to_category?: boolean; category_name?: string }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const { t, lang } = useLanguage();
  const [commission, setCommission] = useState('10');
  const [promote, setPromote] = useState(true);
  const [categoryName, setCategoryName] = useState(proposedCategoryName || '');
  const isOther = supplierType === 'other';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-7 shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 bg-emerald-100 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{t('regRequests.approveModal.title')}</h3>
            <p className="text-xs text-gray-500">"{name}"</p>
          </div>
        </div>

        {isAgency && (
          <>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              {t('regRequests.approveModal.commissionLabel')}
            </label>
            <input
              type="number"
              min="0" max="100" step="0.1"
              value={commission}
              onChange={e => setCommission(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              dir="ltr"
            />
            <p className="text-xs text-gray-400 mt-1">{t('regRequests.approveModal.commissionDefault')}</p>
          </>
        )}

        {!isAgency && !isOther && (
          <p className="text-sm text-gray-600">
            {t('regRequests.approveModal.supplierNote')}
          </p>
        )}

        {isOther && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              {t('regRequests.approveModal.supplierNote')}
            </p>

            {customFields && customFields.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs font-bold text-gray-700 mb-2">
                  {lang === 'ar' ? 'حقول مخصصة من المورد:' : lang === 'ms' ? 'Medan tersuai pembekal:' : 'Supplier custom fields:'}
                </p>
                <div className="space-y-1">
                  {customFields.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500 uppercase tracking-wider text-[10px]">{f.type}</span>
                      <span className="font-semibold text-gray-700">{f.name}:</span>
                      <span className="text-gray-900">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl p-3">
              <input
                type="checkbox"
                id="promote"
                checked={promote}
                onChange={e => setPromote(e.target.checked)}
                className="w-4 h-4 accent-[#FF6B35]"
              />
              <label htmlFor="promote" className="text-sm font-semibold text-gray-700 flex-1">
                {lang === 'ar' ? 'ترقية إلى فئة جديدة'
                  : lang === 'ms' ? 'Naik taraf ke kategori baharu'
                  : 'Promote to new category'}
              </label>
            </div>

            {promote && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  {lang === 'ar' ? 'اسم الفئة' : lang === 'ms' ? 'Nama kategori' : 'Category name'}
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  placeholder={proposedCategoryName || (lang === 'ar' ? 'مثلاً: تأجير اليخوت' : 'e.g. Yacht Rental')}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {lang === 'ar' ? 'ستُضاف فئة جديدة في فئات الخدمات وتُربط الخدمة بها'
                    : lang === 'ms' ? 'Kategori baharu akan dibuat'
                    : 'A new ServiceCategory will be created and linked'}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl font-medium text-sm hover:bg-gray-50">
            {t('regRequests.approveModal.cancel')}
          </button>
          <button
            onClick={() => onConfirm({
              commission: isAgency ? parseFloat(commission) : undefined,
              promote_to_category: isOther ? promote : undefined,
              category_name: isOther && promote ? (categoryName || proposedCategoryName) : undefined,
            })}
            disabled={loading}
            className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl font-medium text-sm hover:bg-emerald-600 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {t('regRequests.approveModal.confirmApprove')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════

export function RegistrationRequests() {
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>('agencies');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [agencies, setAgencies]   = useState<AgencyPending[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierPending[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = (type: ToastType, message: string) => {
    const id = Date.now();
    setToasts(tArr => [...tArr, { id, type, message }]);
    setTimeout(() => setToasts(tArr => tArr.filter(x => x.id !== id)), 4000);
  };

  // Modals
  const [rejectTarget, setRejectTarget]   = useState<{ id: string; name: string; type: TabKey; supplierType?: string } | null>(null);
  const [approveTarget, setApproveTarget] = useState<{
    id: string; name: string; type: TabKey; supplierType?: string;
    proposedCategoryName?: string;
    customFields?: Array<{ name: string; type: string; value: string }>;
  } | null>(null);
  const [detailItem, setDetailItem]       = useState<{ data: AgencyPending | SupplierPending; type: TabKey } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Load data ─────────────────────────────────────────
  const loadData = async () => {
    setRefreshing(true);
    try {
      const [agRes, supRes] = await Promise.all([
        apiFetch('/api/v1/waitlist-agency/admin/pending/'),
        apiFetch('/api/v1/waitlist/admin/pending/'),
      ]);

      if (agRes.ok) {
        const data = await agRes.json();
        setAgencies(data.agencies ?? []);
      }
      if (supRes.ok) {
        const data = await supRes.json();
        setSuppliers(Array.isArray(data) ? data : (data.suppliers ?? data.results ?? []));
      }
    } catch (e) {
      addToast('error', t('regRequests.toasts.loadFail'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── Stats ─────────────────────────────────────────────
  const stats = useMemo(() => ({
    totalPending: agencies.length + suppliers.length,
    agenciesPending: agencies.length,
    suppliersPending: suppliers.length,
    oldest: [...agencies, ...suppliers]
      .map(x => new Date(x.created_at).getTime())
      .sort((a, b) => a - b)[0] || null,
  }), [agencies, suppliers]);

  // ── Filter lists ──────────────────────────────────────
  const filteredAgencies = useMemo(() => {
    const q = search.toLowerCase().trim();
    return agencies.filter(a => {
      if (q && !(
        a.name?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.contact_person_name?.toLowerCase().includes(q) ||
        a.registration_number?.toLowerCase().includes(q)
      )) return false;
      if (country && a.country !== country) return false;
      if (dateFrom && new Date(a.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(a.created_at) > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [agencies, search, country, dateFrom, dateTo]);

  const filteredSuppliers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return suppliers.filter(s => {
      if (q && !(
        s.company_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q)
      )) return false;
      if (country && s.country !== country) return false;
      if (dateFrom && new Date(s.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(s.created_at) > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [suppliers, search, country, dateFrom, dateTo]);

  const countries = useMemo(() => {
    const set = new Set<string>();
    agencies.forEach(a => a.country && set.add(a.country));
    suppliers.forEach(s => s.country && set.add(s.country));
    return Array.from(set).sort();
  }, [agencies, suppliers]);

  // ── Time helper using i18n ─────────────────────────────
  const formatDaysAgo = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days === 0 && hours === 0) return t('regRequests.timeAgo.now');
    if (days === 0) return t('regRequests.timeAgo.hoursAgo').replace('{n}', String(hours));
    if (days === 1) return t('regRequests.timeAgo.yesterday');
    if (days < 30) return t('regRequests.timeAgo.daysAgo').replace('{n}', String(days));
    const months = Math.floor(days / 30);
    if (months === 1) return t('regRequests.timeAgo.monthAgo');
    return t('regRequests.timeAgo.monthsAgo').replace('{n}', String(months));
  };

  // ── Actions ───────────────────────────────────────────
  const handleApprove = async (opts: { commission?: number; promote_to_category?: boolean; category_name?: string }) => {
    if (!approveTarget) return;
    setActionLoading(true);
    const { id, name, type } = approveTarget;

    const url = type === 'agencies'
      ? `/api/v1/waitlist-agency/admin/${id}/approve/`
      : `/api/v1/waitlist/admin/${approveTarget.supplierType}/${id}/approve/`;

    const payload: Record<string, unknown> = {};
    if (type === 'agencies' && opts.commission !== undefined) payload.commission_rate = opts.commission;
    if (approveTarget.supplierType === 'other') {
      payload.promote_to_category = !!opts.promote_to_category;
      if (opts.category_name) payload.category_name = opts.category_name;
    }
    const body = JSON.stringify(payload);

    try {
      const res = await apiFetch(url, { method: 'POST', body });
      if (res.ok) {
        addToast('success', t('regRequests.toasts.approved').replace('{name}', name));
        if (type === 'agencies') setAgencies(a => a.filter(x => x.id !== id));
        else                      setSuppliers(s => s.filter(x => x.id !== id));
        setApproveTarget(null);
      } else {
        const err = await res.json().catch(() => ({}));
        addToast('error', err.error || t('regRequests.toasts.approveFail'));
      }
    } catch {
      addToast('error', t('regRequests.toasts.connectError'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    setActionLoading(true);
    const { id, name, type } = rejectTarget;

    const url = type === 'agencies'
      ? `/api/v1/waitlist-agency/admin/${id}/reject/`
      : `/api/v1/waitlist/admin/${rejectTarget.supplierType}/${id}/reject/`;

    try {
      const res = await apiFetch(url, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        addToast('success', t('regRequests.toasts.rejected').replace('{name}', name));
        if (type === 'agencies') setAgencies(a => a.filter(x => x.id !== id));
        else                      setSuppliers(s => s.filter(x => x.id !== id));
        setRejectTarget(null);
      } else {
        const err = await res.json().catch(() => ({}));
        addToast('error', err.error || t('regRequests.toasts.rejectFail'));
      }
    } catch {
      addToast('error', t('regRequests.toasts.connectError'));
    } finally {
      setActionLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch(''); setCountry(''); setDateFrom(''); setDateTo('');
  };
  const hasFilters = search || country || dateFrom || dateTo;

  // ── Render ────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35]" />
    </div>
  );

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <ToastList toasts={toasts} remove={id => setToasts(tArr => tArr.filter(x => x.id !== id))} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('regRequests.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('regRequests.subtitle')}</p>
        </div>
        <button
          onClick={loadData}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {t('regRequests.refresh')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Clock}       label={t('regRequests.stats.totalPending')}      value={stats.totalPending}      color="amber"  />
        <StatCard icon={Building2}   label={t('regRequests.stats.agenciesPending')}   value={stats.agenciesPending}   color="blue"   />
        <StatCard icon={Store}       label={t('regRequests.stats.suppliersPending')}  value={stats.suppliersPending}  color="purple" />
        <StatCard icon={TrendingUp}  label={t('regRequests.stats.oldest')}            value={stats.oldest ? formatDaysAgo(stats.oldest) : '—'} isText color="rose" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <TabButton active={activeTab === 'agencies'}  onClick={() => setActiveTab('agencies')}  icon={Building2} label={t('regRequests.tabs.agencies')}  count={filteredAgencies.length} />
        <TabButton active={activeTab === 'suppliers'} onClick={() => setActiveTab('suppliers')} icon={Store}     label={t('regRequests.tabs.suppliers')} count={filteredSuppliers.length} />
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('regRequests.searchPlaceholder')}
            className={`w-full h-10 ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]`}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`h-10 px-4 border rounded-xl text-sm font-medium flex items-center gap-2 transition-colors
            ${showFilters || hasFilters
              ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
              : 'bg-white border-gray-200 hover:bg-gray-50'}`}
        >
          <Filter className="w-4 h-4" />
          {t('regRequests.filters')}
          {hasFilters && <span className="w-5 h-5 bg-white text-[#FF6B35] rounded-full text-xs font-bold flex items-center justify-center">!</span>}
        </button>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="h-10 px-3 text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> {t('regRequests.clearFilters')}
          </button>
        )}
      </div>

      {showFilters && (
        <div className="bg-gray-50 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('regRequests.country')}</label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6B35]"
            >
              <option value="">{t('regRequests.allCountries')}</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('regRequests.fromDate')}</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6B35]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('regRequests.toDate')}</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6B35]"
            />
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {activeTab === 'agencies' ? (
          filteredAgencies.length === 0
            ? <EmptyState type="agencies" hasFilters={!!hasFilters} />
            : filteredAgencies.map(a => (
                <AgencyRow
                  key={a.id}
                  agency={a}
                  formatDaysAgo={formatDaysAgo}
                  onApprove={() => setApproveTarget({ id: a.id, name: a.name, type: 'agencies' })}
                  onReject={() => setRejectTarget({ id: a.id, name: a.name, type: 'agencies' })}
                  onViewDetails={() => setDetailItem({ data: a, type: 'agencies' })}
                />
              ))
        ) : (
          filteredSuppliers.length === 0
            ? <EmptyState type="suppliers" hasFilters={!!hasFilters} />
            : filteredSuppliers.map(s => (
                <SupplierRow
                  key={s.id}
                  supplier={s}
                  formatDaysAgo={formatDaysAgo}
                  onApprove={() => setApproveTarget({
                    id: s.id, name: s.company_name, type: 'suppliers',
                    supplierType: s.supplier_type,
                    proposedCategoryName: (s as any).proposed_category_name,
                    customFields: (s as any).custom_fields,
                  })}
                  onReject={() => setRejectTarget({ id: s.id, name: s.company_name, type: 'suppliers', supplierType: s.supplier_type })}
                  onViewDetails={() => setDetailItem({ data: s, type: 'suppliers' })}
                />
              ))
        )}
      </div>

      {/* Modals */}
      {rejectTarget && (
        <RejectModal
          name={rejectTarget.name}
          onCancel={() => setRejectTarget(null)}
          onConfirm={handleReject}
          loading={actionLoading}
        />
      )}
      {approveTarget && (
        <ApproveModal
          name={approveTarget.name}
          isAgency={approveTarget.type === 'agencies'}
          supplierType={approveTarget.supplierType}
          proposedCategoryName={approveTarget.proposedCategoryName}
          customFields={approveTarget.customFields}
          onCancel={() => setApproveTarget(null)}
          onConfirm={handleApprove}
          loading={actionLoading}
        />
      )}
      {detailItem && (
        <DetailModal
          item={detailItem.data}
          type={detailItem.type}
          formatDaysAgo={formatDaysAgo}
          onClose={() => setDetailItem(null)}
          onApprove={() => {
            const d = detailItem.data;
            const name = detailItem.type === 'agencies'
              ? (d as AgencyPending).name
              : (d as SupplierPending).company_name;
            setApproveTarget({
              id: d.id, name, type: detailItem.type,
              supplierType: (d as any).supplier_type,
              proposedCategoryName: (d as any).proposed_category_name,
              customFields: (d as any).custom_fields,
            });
            setDetailItem(null);
          }}
          onReject={() => {
            const d = detailItem.data;
            const name = detailItem.type === 'agencies'
              ? (d as AgencyPending).name
              : (d as SupplierPending).company_name;
            setRejectTarget({ id: d.id, name, type: detailItem.type, supplierType: (d as any).supplier_type });
            setDetailItem(null);
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════

function StatCard({ icon: Icon, label, value, color, isText }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string | number; color: 'amber' | 'blue' | 'purple' | 'rose';
  isText?: boolean;
}) {
  const colors = {
    amber:  { bg: 'bg-amber-50',   text: 'text-amber-600',   iconBg: 'bg-amber-100' },
    blue:   { bg: 'bg-blue-50',    text: 'text-blue-600',    iconBg: 'bg-blue-100' },
    purple: { bg: 'bg-purple-50',  text: 'text-purple-600',  iconBg: 'bg-purple-100' },
    rose:   { bg: 'bg-rose-50',    text: 'text-rose-600',    iconBg: 'bg-rose-100' },
  }[color];
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 mb-card">
      <div className={`w-11 h-11 ${colors.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${colors.text}`} />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-gray-500 mb-0.5 truncate">{label}</div>
        <div className={`${isText ? 'text-sm' : 'text-2xl'} font-bold ${colors.text}`}>{value}</div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, count }: {
  active: boolean; onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string; count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
        ${active
          ? 'text-[#FF6B35] border-[#FF6B35]'
          : 'text-gray-500 border-transparent hover:text-gray-700'}`}
    >
      <Icon className="w-4 h-4" />
      {label}
      <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 text-gray-600'}`}>
        {count}
      </span>
    </button>
  );
}

function AgencyRow({ agency, formatDaysAgo, onApprove, onReject, onViewDetails }: {
  agency: AgencyPending;
  formatDaysAgo: (ts: number) => string;
  onApprove: () => void; onReject: () => void; onViewDetails: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div
      onClick={onViewDetails}
      className="bg-white border border-gray-100 rounded-2xl p-5 mb-card cursor-pointer hover:border-[#FF6B35]/30"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-orange-50 flex items-center justify-center">
          {agency.logo ? (
            <img src={agency.logo} alt={agency.name} className="w-full h-full object-cover" />
          ) : (
            <Building2 className="w-6 h-6 text-[#FF6B35]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-bold text-gray-900 text-base">{agency.name}</h3>
              {agency.name_en && <p className="text-xs text-gray-500 mt-0.5">{agency.name_en}</p>}
            </div>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDaysAgo(new Date(agency.created_at).getTime())}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-xs text-gray-600">
            <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /> {agency.email}</div>
            <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> {agency.phone}</div>
            <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {agency.country} — {agency.city}</div>
            <div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-gray-400" /> {agency.registration_number}</div>
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {agency.trade_license && (
              <a href={agency.trade_license} target="_blank" rel="noreferrer"
                 className="text-xs text-[#FF6B35] hover:underline flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> {t('regRequests.documents.tradeLicense')}
              </a>
            )}
            {agency.tax_certificate && (
              <a href={agency.tax_certificate} target="_blank" rel="noreferrer"
                 className="text-xs text-[#FF6B35] hover:underline flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> {t('regRequests.documents.taxCertificate')}
              </a>
            )}
            {agency.owner_id_document && (
              <a href={agency.owner_id_document} target="_blank" rel="noreferrer"
                 className="text-xs text-[#FF6B35] hover:underline flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> {t('regRequests.documents.ownerId')}
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={onViewDetails}
            className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-4 h-4" /> {t('regRequests.actions.details')}
          </button>
          <button
            onClick={onApprove}
            className="mb-btn px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> {t('regRequests.actions.approve')}
          </button>
          <button
            onClick={onReject}
            className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Ban className="w-4 h-4" /> {t('regRequests.actions.reject')}
          </button>
        </div>
      </div>
    </div>
  );
}

function SupplierRow({ supplier, formatDaysAgo, onApprove, onReject, onViewDetails }: {
  supplier: SupplierPending;
  formatDaysAgo: (ts: number) => string;
  onApprove: () => void; onReject: () => void; onViewDetails: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div
      onClick={onViewDetails}
      className="bg-white border border-gray-100 rounded-2xl p-5 mb-card cursor-pointer hover:border-[#FF6B35]/30"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl shrink-0 bg-purple-50 flex items-center justify-center">
          <Store className="w-6 h-6 text-purple-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-bold text-gray-900 text-base">{supplier.company_name}</h3>
              <span className="inline-block mt-1 text-[11px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                {supplier.supplier_type}
              </span>
            </div>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDaysAgo(new Date(supplier.created_at).getTime())}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-xs text-gray-600">
            <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /> {supplier.email || supplier.user_email}</div>
            <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> {supplier.phone}</div>
            <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {supplier.country} — {supplier.city}</div>
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={onViewDetails}
            className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-4 h-4" /> {t('regRequests.actions.details')}
          </button>
          <button
            onClick={onApprove}
            className="mb-btn px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> {t('regRequests.actions.approve')}
          </button>
          <button
            onClick={onReject}
            className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Ban className="w-4 h-4" /> {t('regRequests.actions.reject')}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ type, hasFilters }: { type: TabKey; hasFilters: boolean }) {
  const { t } = useLanguage();
  const message = hasFilters
    ? t('regRequests.empty.noMatch')
    : (type === 'agencies' ? t('regRequests.empty.noAgencies') : t('regRequests.empty.noSuppliers'));
  return (
    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center">
      <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
        {type === 'agencies' ? <Building2 className="w-6 h-6 text-gray-400" /> : <Store className="w-6 h-6 text-gray-400" />}
      </div>
      <p className="text-sm text-gray-500 font-medium">{message}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Detail Modal
// ═══════════════════════════════════════════════════════════

function DetailModal({ item, type, formatDaysAgo, onClose, onApprove, onReject }: {
  item: AgencyPending | SupplierPending;
  type: TabKey;
  formatDaysAgo: (ts: number) => string;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { t, lang, isRTL } = useLanguage();
  const isAgency = type === 'agencies';
  const agency   = isAgency ? (item as AgencyPending) : null;
  const supplier = !isAgency ? (item as SupplierPending) : null;

  const title = isAgency ? agency!.name : supplier!.company_name;
  const subtitle = isAgency ? agency!.name_en : supplier!.supplier_type;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl my-8 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="relative p-6 text-white"
          style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FF8F3C 50%, #FFB547 100%)' }}
        >
          <button
            onClick={onClose}
            className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors`}
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/95 flex items-center justify-center shrink-0 overflow-hidden">
              {isAgency && agency!.logo ? (
                <img src={agency!.logo} alt={title} className="w-full h-full object-cover" />
              ) : isAgency ? (
                <Building2 className="w-7 h-7 text-[#FF6B35]" />
              ) : (
                <Store className="w-7 h-7 text-[#FF6B35]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{title}</h2>
              {subtitle && <p className="text-sm text-white/85 mt-0.5">{subtitle}</p>}
              <p className="text-xs text-white/75 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDaysAgo(new Date(item.created_at).getTime())}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">

          <DetailSection title={t('regRequests.detail.contactInfo')} icon={User}>
            <DetailRow icon={Mail}  label={t('regRequests.detail.email')} value={isAgency ? agency!.email : supplier!.email} copyable />
            <DetailRow icon={Phone} label={t('regRequests.detail.phone')} value={item.phone} copyable />
            {!isAgency && supplier!.full_name && (
              <DetailRow icon={User} label={lang === 'ar' ? 'الاسم الكامل' : lang === 'ms' ? 'Nama Penuh' : 'Full Name'} value={supplier!.full_name} />
            )}
            {isAgency && (
              <DetailRow icon={User} label={t('regRequests.detail.contactPerson')} value={agency!.contact_person_name} />
            )}
          </DetailSection>

          <DetailSection title={t('regRequests.detail.location')} icon={MapPin}>
            <DetailRow icon={Globe}  label={t('regRequests.detail.country')} value={(supplier?.country_ref_name) || item.country} />
            <DetailRow icon={MapPin} label={t('regRequests.detail.city')}    value={(supplier?.city_ref_name) || item.city} />
            {!isAgency && supplier!.region && (
              <DetailRow icon={MapPin} label={lang === 'ar' ? 'المنطقة' : lang === 'ms' ? 'Kawasan' : 'Region'} value={supplier!.region} />
            )}
          </DetailSection>

          {/* 🆕 وصف الخدمة */}
          {!isAgency && supplier!.description && (
            <DetailSection title={lang === 'ar' ? 'وصف الخدمة' : lang === 'ms' ? 'Penerangan' : 'Description'} icon={FileText}>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {supplier!.description}
              </p>
            </DetailSection>
          )}

          {/* 🆕 الصور المرفوعة */}
          {!isAgency && supplier!.photos && supplier!.photos.length > 0 && (
            <DetailSection
              title={lang === 'ar' ? `الصور (${supplier!.photos.length})` : lang === 'ms' ? `Gambar (${supplier!.photos.length})` : `Photos (${supplier!.photos.length})`}
              icon={Eye}
            >
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {supplier!.photos.map(photo => (
                  <a
                    key={photo.id}
                    href={photo.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-100 hover:border-[#FF6B35] transition group"
                  >
                    {photo.url && (
                      <img src={photo.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                    )}
                    {photo.is_primary && (
                      <span className="absolute top-1 left-1 bg-[#FF6B35] text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                        ★
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </DetailSection>
          )}

          {/* 🆕 حقول خاصة بنوع الخدمة (الأسعار + التفاصيل) */}
          {!isAgency && supplier!.type_specific && Object.keys(supplier!.type_specific).length > 0 && (
            <DetailSection
              title={lang === 'ar' ? 'تفاصيل الخدمة والأسعار' : lang === 'ms' ? 'Butiran Perkhidmatan & Harga' : 'Service Details & Prices'}
              icon={FileText}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(supplier!.type_specific).map(([key, value]) => {
                  if (value === null || value === undefined || value === '' ||
                      (Array.isArray(value) && value.length === 0)) return null;
                  const displayValue = typeof value === 'boolean'
                    ? (value ? '✓' : '✗')
                    : Array.isArray(value)
                      ? value.join(', ')
                      : String(value);
                  const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                  const isPrice = key.startsWith('price_') || key === 'base_price';
                  return (
                    <div key={key} className="flex justify-between gap-3 text-xs py-1">
                      <span className="text-gray-500">{label}:</span>
                      <span className={`font-semibold ${isPrice ? 'text-[#FF6B35]' : 'text-gray-800'}`}>
                        {displayValue}{isPrice ? ` ${supplier!.currency || 'MYR'}` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </DetailSection>
          )}

          {/* 🆕 الوثائق */}
          {!isAgency && supplier!.documents && Object.keys(supplier!.documents).length > 0 && (
            <DetailSection
              title={lang === 'ar' ? 'الوثائق المرفقة' : lang === 'ms' ? 'Dokumen' : 'Documents'}
              icon={FileText}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(supplier!.documents).map(([key, url]) => (
                  <DocumentTile key={key} label={key.replace(/_/g, ' ')} url={url} />
                ))}
              </div>
            </DetailSection>
          )}

          {/* 🆕 معلومات إضافية */}
          {!isAgency && (supplier!.sync_mode || supplier!.how_did_you_hear) && (
            <DetailSection
              title={lang === 'ar' ? 'معلومات إضافية' : lang === 'ms' ? 'Maklumat Tambahan' : 'Additional Info'}
              icon={FileText}
            >
              {supplier!.sync_mode && (
                <DetailRow
                  icon={Hash}
                  label={lang === 'ar' ? 'نمط التزامن' : lang === 'ms' ? 'Mod Penyegerakan' : 'Sync Mode'}
                  value={supplier!.sync_mode === 'MANUAL' ? (lang === 'ar' ? 'يدوي' : 'Manual') : (supplier!.channel_name || 'Channel Manager')}
                />
              )}
              {supplier!.how_did_you_hear && (
                <DetailRow
                  icon={Hash}
                  label={lang === 'ar' ? 'كيف عرف عنا' : lang === 'ms' ? 'Cara mengetahui' : 'How did you hear'}
                  value={supplier!.how_did_you_hear}
                />
              )}
            </DetailSection>
          )}

          {isAgency && (
            <DetailSection title={t('regRequests.detail.legalReg')} icon={FileText}>
              <DetailRow icon={Hash}      label={t('regRequests.detail.registrationNo')} value={agency!.registration_number} copyable />
              <DetailRow icon={Building2} label={t('regRequests.detail.agencyType')}     value={agency!.agency_type} />
            </DetailSection>
          )}

          {isAgency && (
            <DetailSection title={t('regRequests.detail.attachedDocs')} icon={FileText}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <DocumentTile label={t('regRequests.documents.tradeLicense')}   url={agency!.trade_license} />
                <DocumentTile label={t('regRequests.documents.taxCertificate')} url={agency!.tax_certificate} />
                <DocumentTile label={t('regRequests.documents.ownerId')}        url={agency!.owner_id_document} />
              </div>
            </DetailSection>
          )}

          <DetailSection title={t('regRequests.detail.requestInfo')} icon={Calendar}>
            <DetailRow
              icon={Calendar}
              label={t('regRequests.detail.submittedAt')}
              value={new Date(item.created_at).toLocaleString(DATE_LOCALE[lang] || 'en-US', {
                dateStyle: 'long',
                timeStyle: 'short',
              })}
            />
            <DetailRow icon={Hash} label={t('regRequests.detail.requestId')} value={item.id} copyable />
          </DetailSection>
        </div>

        {/* Footer actions */}
        <div className="border-t border-gray-100 p-4 flex items-center justify-between gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-medium hover:bg-gray-100"
          >
            {t('regRequests.detail.close')}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onReject}
              className="px-5 py-2.5 border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium rounded-xl flex items-center gap-2 transition-colors"
            >
              <Ban className="w-4 h-4" /> {t('regRequests.detail.rejectRequest')}
            </button>
            <button
              onClick={onApprove}
              className="mb-btn px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> {t('regRequests.detail.approveRequest')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailSection({ title, icon: Icon, children }: {
  title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </div>
      <div className="bg-gray-50 rounded-xl p-3 space-y-2">
        {children}
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, copyable }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; copyable?: boolean;
}) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-gray-500">{label}</div>
        <div className="text-gray-900 font-medium truncate">{value}</div>
      </div>
      {copyable && (
        <button
          onClick={handleCopy}
          className="text-xs text-gray-400 hover:text-[#FF6B35] px-2 py-1 rounded hover:bg-white transition-colors shrink-0"
        >
          {copied ? t('regRequests.detail.copied') : t('regRequests.detail.copy')}
        </button>
      )}
    </div>
  );
}

function DocumentTile({ label, url }: { label: string; url?: string | null }) {
  const { t } = useLanguage();
  if (!url) {
    return (
      <div className="bg-gray-100 border-2 border-dashed border-gray-200 rounded-xl p-3 text-center">
        <FileText className="w-5 h-5 text-gray-400 mx-auto mb-1" />
        <div className="text-[11px] text-gray-400">{label}</div>
        <div className="text-[10px] text-gray-400 mt-0.5">{t('regRequests.documents.notAttached')}</div>
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer"
       className="mb-feature bg-white border border-gray-200 rounded-xl p-3 text-center hover:border-[#FF6B35] block">
      <FileText className="w-5 h-5 text-[#FF6B35] mx-auto mb-1" />
      <div className="text-[11px] text-gray-700 font-medium">{label}</div>
      <div className="text-[10px] text-[#FF6B35] mt-0.5 flex items-center justify-center gap-0.5">
        <ExternalLink className="w-2.5 h-2.5" /> {t('regRequests.documents.open')}
      </div>
    </a>
  );
}
