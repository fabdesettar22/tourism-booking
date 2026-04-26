import { apiFetch } from '../../services/apiFetch';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import {
  Search, Eye, Trash2, Loader2, CheckCircle2, XCircle,
  AlertTriangle, X, Building2, Moon, Users,
  ChevronLeft, ChevronRight, Phone, Mail, Package,
  Sparkles, CalendarDays, Star, Tag, Check, Clock, Plus, Globe
} from 'lucide-react';
import { BookingWizard } from './BookingWizard';

// ─── Types ────────────────────────────────────────────────
interface BookingCity {
  id: number; city: number; city_name: string; country_name: string;
  nights: number; order: number;
  hotels: { id: number; hotel: number; hotel_name: string; hotel_stars: number; nights: number; }[];
}
interface BookingService {
  id: number; service: number; service_name: string;
  service_category: string; is_optional: boolean; quantity: number; price: string;
}
interface Booking {
  id: number; booking_type: 'agency' | 'custom';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  package: number | null; package_name: string | null;
  client_name: string; client_phone: string; client_email: string; notes: string;
  adults: number; children: number; infants: number;
  country: number | null; country_name: string | null;
  total_price: string | null; currency: string;
  total_nights: number; reference_number: string;
  agency: number | null; agency_name?: string;
  cities: BookingCity[]; services: BookingService[];
  created_at: string; updated_at: string;
}
type ToastType = 'success' | 'error' | 'warning';
interface Toast { id: number; type: ToastType; message: string; }

interface TourPackage {
  id: number; name: string; is_customizable: boolean;
  base_price: string; currency: string; final_price: number;
  cities: any[]; total_nights: number; is_active: boolean;
}

const STATUS_STYLE: Record<string, { color: string; dot: string; icon: any }> = {
  pending:   { color: 'bg-amber-50 text-amber-600',     dot: 'bg-amber-400',   icon: Clock },
  confirmed: { color: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-400', icon: CheckCircle2 },
  cancelled: { color: 'bg-red-50 text-red-600',         dot: 'bg-red-400',     icon: XCircle },
  completed: { color: 'bg-blue-50 text-blue-600',       dot: 'bg-blue-400',    icon: Check },
};

const TYPE_STYLE: Record<string, { color: string; icon: any }> = {
  agency: { color: 'bg-blue-50 text-blue-700',     icon: Package },
  custom: { color: 'bg-purple-50 text-purple-700', icon: Sparkles },
};

const DATE_LOCALE: Record<'ar'|'en'|'ms', string> = { ar: 'ar-SA', en: 'en-US', ms: 'ms-MY' };

// Table headers per language
const TABLE_HEADERS: Record<'ar'|'en'|'ms', string[]> = {
  ar: ['#','النوع','العميل','الباقة','الأفراد','الليالي','السعر','الحالة','التاريخ','إجراءات'],
  en: ['#','Type','Client','Package','Persons','Nights','Price','Status','Date','Actions'],
  ms: ['#','Jenis','Pelanggan','Pakej','Orang','Malam','Harga','Status','Tarikh','Tindakan'],
};

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

// ─── Delete Modal ─────────────────────────────────────────
function DeleteModal({ name, onConfirm, onCancel, loading }: { name:string; onConfirm:()=>void; onCancel:()=>void; loading:boolean }) {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl w-full max-w-sm mx-4 p-8 shadow-2xl text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-8 h-8 text-red-500"/></div>
        <h3 className="text-xl font-bold mb-2">{t('bookingsMgmt.deleteModal.title')}</h3>
        <p className="text-gray-500 mb-6">{t('bookingsMgmt.deleteModal.confirm')} <span className="font-semibold text-gray-800">"{name}"</span>?</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 border-2 rounded-xl font-medium hover:bg-gray-50">{t('bookingsMgmt.deleteModal.cancel')}</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-60">
            {loading?<Loader2 className="w-4 h-4 animate-spin"/>:<Trash2 className="w-4 h-4"/>} {t('bookingsMgmt.deleteModal.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Booking Details Modal ────────────────────────────────
function BookingDetailsModal({ booking, onClose, onStatusChange }: {
  booking: Booking; onClose: () => void;
  onStatusChange: (id: number, status: string) => void;
}) {
  const { t, lang, isRTL } = useLanguage();
  const sc = STATUS_STYLE[booking.status];
  const tc = TYPE_STYLE[booking.booking_type];
  const TypeIcon = tc.icon;
  const statusLabel = t(`bookingsMgmt.statusConfig.${booking.status}`);
  const typeLabel = t(`bookingsMgmt.typeConfig.${booking.booking_type}`);
  const locale = DATE_LOCALE[lang];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">

        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tc.color}`}>
              <TypeIcon className="w-5 h-5"/>
            </div>
            <div>
              <h2 className="text-lg font-bold">{t('bookingsMgmt.detailsModal.title')} #{booking.id}</h2>
              {booking.reference_number && <p className="text-xs font-mono text-blue-500">{booking.reference_number}</p>}
              <p className="text-xs text-gray-500">{new Date(booking.created_at).toLocaleDateString(locale)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${sc.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}/>
              {statusLabel}
            </span>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5"/></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Client Info */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">{t('bookingsMgmt.detailsModal.clientInfo')}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center"><Users className="w-4 h-4 text-blue-600"/></div>
                <div><p className="text-xs text-gray-400">{t('bookingsMgmt.detailsModal.name')}</p><p className="text-sm font-semibold">{booking.client_name}</p></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center"><Phone className="w-4 h-4 text-emerald-600"/></div>
                <div><p className="text-xs text-gray-400">{t('bookingsMgmt.detailsModal.phone')}</p><p className="text-sm font-semibold" dir="ltr">{booking.client_phone}</p></div>
              </div>
              {booking.client_email && (
                <div className="flex items-center gap-2 col-span-2">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center"><Mail className="w-4 h-4 text-purple-600"/></div>
                  <div><p className="text-xs text-gray-400">{t('bookingsMgmt.detailsModal.email')}</p><p className="text-sm font-semibold" dir="ltr">{booking.client_email}</p></div>
                </div>
              )}
            </div>
          </div>

          {/* Persons */}
          <div className="flex gap-3">
            {[
              { label: t('bookingsMgmt.detailsModal.adults'),   val: booking.adults,   color: 'bg-blue-50 text-blue-700' },
              { label: t('bookingsMgmt.detailsModal.children'), val: booking.children, color: 'bg-purple-50 text-purple-700' },
              { label: t('bookingsMgmt.detailsModal.infants'),  val: booking.infants,  color: 'bg-pink-50 text-pink-700' },
            ].map(p => (
              <div key={p.label} className={`flex-1 rounded-xl p-3 text-center ${p.color}`}>
                <p className="text-2xl font-bold">{p.val}</p>
                <p className="text-xs">{p.label}</p>
              </div>
            ))}
            <div className="flex-1 rounded-xl p-3 text-center bg-gray-50 text-gray-700">
              <p className="text-2xl font-bold">{booking.total_nights}</p>
              <p className="text-xs">{t('bookingsMgmt.detailsModal.nights')}</p>
            </div>
          </div>

          {/* Package */}
          {booking.package_name && (
            <div className="flex items-center gap-3 bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
              <Package className="w-5 h-5 text-emerald-600 shrink-0"/>
              <div>
                <p className="text-xs text-emerald-600 font-medium">{t('bookingsMgmt.detailsModal.bookedPackage')}</p>
                <p className="font-semibold text-gray-800">{booking.package_name}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isRTL ? 'mr-auto' : 'ml-auto'} ${tc.color}`}>{typeLabel}</span>
            </div>
          )}

          {/* Cities */}
          {booking.cities.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">{t('bookingsMgmt.detailsModal.itinerary')}</p>
              <div className="space-y-2">
                {booking.cities.map((c, i) => (
                  <div key={i} className="border rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{i+1}</div>
                        <span className="font-semibold text-gray-900">{c.city_name}</span>
                        <span className="text-xs text-gray-400">{c.country_name}</span>
                      </div>
                      {c.nights > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                          <Moon className="w-3 h-3"/> {c.nights} {t('bookingsMgmt.detailsModal.nights')}
                        </span>
                      )}
                    </div>
                    {c.hotels.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {c.hotels.map((h, hi) => (
                          <span key={hi} className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-xl">
                            <Building2 className="w-3 h-3"/>
                            {h.hotel_name}
                            <div className="flex">{[1,2,3,4,5].map(s=><Star key={s} className={`w-2.5 h-2.5 ${s<=h.hotel_stars?'text-amber-400 fill-amber-400':'text-gray-200 fill-gray-200'}`}/>)}</div>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {booking.services.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">{t('bookingsMgmt.detailsModal.services')}</p>
              <div className="flex flex-wrap gap-2">
                {booking.services.map((s, i) => (
                  <span key={i} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border
                    ${s.is_optional ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    <Tag className="w-3 h-3"/> {s.service_name}
                    {!s.is_optional && <span className="text-red-400">{t('bookingsMgmt.detailsModal.mandatory')}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {booking.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">{t('bookingsMgmt.detailsModal.notes')}</p>
              <p className="text-sm text-gray-700">{booking.notes}</p>
            </div>
          )}

          {/* Status Change */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">{t('bookingsMgmt.detailsModal.changeStatus')}</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(STATUS_STYLE) as string[]).map(key => {
                const val = STATUS_STYLE[key];
                const lbl = t(`bookingsMgmt.statusConfig.${key}`);
                return (
                  <button key={key} onClick={() => onStatusChange(booking.id, key)}
                    disabled={booking.status === key}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all disabled:opacity-40
                      ${booking.status === key ? `${val.color} border-current/20` : 'border-gray-200 hover:border-gray-300'}`}>
                    <span className={`w-2 h-2 rounded-full ${val.dot}`}/>
                    {lbl}
                    {booking.status === key && <Check className={`w-3.5 h-3.5 ${isRTL ? 'mr-auto' : 'ml-auto'}`}/>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Package Picker Modal ─────────────────────────────────
function PackagePickerModal({ onSelect, onClose }: {
  onSelect: (pkg: TourPackage) => void; onClose: () => void;
}) {
  const { t, isRTL } = useLanguage();
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiFetch(`/api/v1/packages/`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setPackages(Array.isArray(d) ? d : d.results || []); setLoading(false); });
  }, []);

  const filtered = packages.filter(p =>
    p.is_active && p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold">{t('bookingsMgmt.pickerModal.title')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5"/></button>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`}/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder={t('bookingsMgmt.pickerModal.searchPlaceholder')}
              className={`w-full ${isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}/>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {loading
            ? <div className="flex items-center justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>
            : filtered.length === 0
              ? <div className="text-center py-10 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-200"/>
                  <p className="text-sm">{t('bookingsMgmt.pickerModal.noPackages')}</p>
                </div>
              : filtered.map(pkg => (
                <button key={pkg.id} onClick={() => onSelect(pkg)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all ${isRTL ? 'text-right' : 'text-left'} group`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0
                    ${pkg.is_customizable ? 'bg-purple-50' : 'bg-emerald-50'}`}>
                    {pkg.is_customizable
                      ? <Sparkles className="w-5 h-5 text-purple-600"/>
                      : <Package className="w-5 h-5 text-emerald-600"/>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 text-sm">{pkg.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${pkg.is_customizable ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {pkg.is_customizable ? t('bookingsMgmt.pickerModal.customizable') : t('bookingsMgmt.pickerModal.fixed')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Globe className="w-3 h-3"/>{pkg.cities?.length || 0} {t('bookingsMgmt.pickerModal.cities')}</span>
                      {pkg.total_nights > 0 && <span className="flex items-center gap-1"><Moon className="w-3 h-3"/>{pkg.total_nights} {t('bookingsMgmt.pickerModal.nights')}</span>}
                    </div>
                  </div>
                  <div className={`${isRTL ? 'text-left' : 'text-right'} shrink-0`}>
                    <p className="font-bold text-emerald-600">{pkg.final_price?.toFixed(0) || pkg.base_price}</p>
                    <p className="text-xs text-gray-400">{pkg.currency}</p>
                  </div>
                </button>
              ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────
function StatCard({ icon, label, value, color, textColor }: { icon: React.ReactNode; label: string; value: number; color: string; textColor: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl flex items-center gap-4 px-5 py-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────
export function BookingsManagement() {
  const { t, lang, isRTL } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Booking|null>(null);
  const [viewingBooking, setViewingBooking] = useState<Booking|null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [showPicker, setShowPicker] = useState(false);
  const [wizardPkg, setWizardPkg] = useState<TourPackage|null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const addToast = (type: ToastType, msg: string) => {
    const id = Date.now();
    setToasts(p=>[...p,{id,type,message:msg}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),4000);
  };

  useEffect(()=>{ fetchBookings(); },[]);

  const fetchBookings = async () => {
    try {
      const res = await apiFetch(`/api/v1/bookings/`);
      if(res.ok){ const d=await res.json(); setBookings(Array.isArray(d)?d:d.results||[]); }
      else addToast('error', t('bookingsMgmt.toasts.loadFail'));
    } catch { addToast('error', t('bookingsMgmt.toasts.connectFail')); }
    finally { setLoading(false); }
  };

  const filtered = bookings.filter(b => {
    const ms = b.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               b.client_phone.includes(searchQuery) ||
               String(b.id).includes(searchQuery) ||
               (b.package_name||'').toLowerCase().includes(searchQuery.toLowerCase());
    const mst = filterStatus==='all' || b.status===filterStatus;
    const mt = filterType==='all' || b.booking_type===filterType;
    return ms && mst && mt;
  });

  const totalPages = Math.ceil(filtered.length/itemsPerPage);
  const paginated = filtered.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await apiFetch(`/api/v1/bookings/${id}/update-status/`, {
        method: 'PATCH', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ status }),
      });
      if(res.ok){
        const data = await res.json();
        setBookings(prev => prev.map(b => b.id===id ? {
          ...b,
          status: status as any,
          total_price: data.total_price || b.total_price
        } : b));
        if(viewingBooking?.id===id) setViewingBooking(prev => prev ? {
          ...prev,
          status: status as any,
          total_price: data.total_price || prev.total_price
        } : null);
        addToast('success', t('bookingsMgmt.toasts.statusUpdated').replace('{id}', String(id)));
      } else {
        const err = await res.json();
        addToast('error', err.error || err.detail || t('bookingsMgmt.toasts.statusUpdateFail'));
      }
    } catch { addToast('error', t('bookingsMgmt.toasts.connectError')); }
  };

  const confirmDelete = async () => {
    if(!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const res = await apiFetch(`/api/v1/bookings/${deleteTarget.id}/`, {method:'DELETE'});
      if(res.ok){
        setBookings(prev=>prev.filter(b=>b.id!==deleteTarget.id));
        addToast('success', t('bookingsMgmt.toasts.deleted').replace('{id}', String(deleteTarget.id)));
      }
      else addToast('error', t('bookingsMgmt.toasts.deleteFail'));
    } catch { addToast('error', t('bookingsMgmt.toasts.connectError')); }
    finally { setDeletingId(null); setDeleteTarget(null); }
  };

  const pendingCount   = bookings.filter(b=>b.status==='pending').length;
  const confirmedCount = bookings.filter(b=>b.status==='confirmed').length;
  const cancelledCount = bookings.filter(b=>b.status==='cancelled').length;
  const completedCount = bookings.filter(b=>b.status==='completed').length;

  if(loading) return(
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin"/>
      <p className="text-gray-500">{t('bookingsMgmt.loadingMsg')}</p>
    </div>
  );

  const tableHeaders = TABLE_HEADERS[lang] || TABLE_HEADERS.en;
  const align = isRTL ? 'text-right' : 'text-left';
  const locale = DATE_LOCALE[lang];

  const statusFilterOptions = ['all','pending','confirmed','cancelled','completed'];
  const typeFilterOptions = ['all','agency','custom'];

  return(
    <div className="space-y-6 bg-gray-50 min-h-screen -m-8 p-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <ToastNotif toasts={toasts} remove={id=>setToasts(p=>p.filter(t=>t.id!==id))}/>

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('bookingsMgmt.title')}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t('bookingsMgmt.subtitle')}</p>
        </div>
        <button onClick={()=>setShowPicker(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4"/> {t('bookingsMgmt.bookPackage')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Clock className="w-5 h-5 text-amber-600"/>}        label={t('bookingsMgmt.statsLabels.pending')}   value={pendingCount}   color="bg-amber-50"   textColor="text-amber-600"/>
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-green-600"/>} label={t('bookingsMgmt.statsLabels.confirmed')} value={confirmedCount} color="bg-green-50"   textColor="text-green-600"/>
        <StatCard icon={<XCircle className="w-5 h-5 text-red-600"/>}        label={t('bookingsMgmt.statsLabels.cancelled')} value={cancelledCount} color="bg-red-50"     textColor="text-red-600"/>
        <StatCard icon={<Check className="w-5 h-5 text-blue-600"/>}         label={t('bookingsMgmt.statsLabels.completed')} value={completedCount} color="bg-blue-50"    textColor="text-blue-600"/>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`}/>
            <input type="text" placeholder={t('bookingsMgmt.searchPlaceholder')} value={searchQuery}
              onChange={e=>{setSearchQuery(e.target.value);setCurrentPage(1);}}
              className={`w-full ${isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}/>
          </div>
          <div className="flex border border-gray-200 rounded-xl overflow-hidden shrink-0">
            {statusFilterOptions.map(s=>{
              const lbl = s === 'all' ? t('bookingsMgmt.filters.all') : t(`bookingsMgmt.statusConfig.${s}`);
              return (
                <button key={s} onClick={()=>{setFilterStatus(s);setCurrentPage(1);}}
                  className={`px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap border-l border-gray-200 first:border-l-0
                    ${filterStatus===s?'bg-blue-600 text-white':'text-gray-600 hover:bg-gray-50'}`}>
                  {lbl}
                </button>
              );
            })}
          </div>
          <div className="flex border border-gray-200 rounded-xl overflow-hidden shrink-0">
            {typeFilterOptions.map(tp=>{
              const lbl = tp === 'all' ? t('bookingsMgmt.filters.allTypes') : t(`bookingsMgmt.typeConfig.${tp}`);
              return (
                <button key={tp} onClick={()=>{setFilterType(tp);setCurrentPage(1);}}
                  className={`px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap border-l border-gray-200 first:border-l-0
                    ${filterType===tp?'bg-blue-600 text-white':'text-gray-600 hover:bg-gray-50'}`}>
                  {lbl}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {filtered.length === 0
          ? <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                <CalendarDays className="w-8 h-8 text-gray-300"/>
              </div>
              <h3 className="text-base font-semibold text-gray-600 mb-1">{t('bookingsMgmt.empty.title')}</h3>
              <p className="text-gray-400 text-sm">{t('bookingsMgmt.empty.subtitle')}</p>
            </div>
          : <>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {tableHeaders.map((h,i)=>(
                      <th key={i} className={`px-4 py-3 ${align} text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(b => {
                    const sc = STATUS_STYLE[b.status];
                    const tc = TYPE_STYLE[b.booking_type];
                    const TypeIcon = tc.icon;
                    const statusLabel = t(`bookingsMgmt.statusConfig.${b.status}`);
                    const typeLabel = t(`bookingsMgmt.typeConfig.${b.booking_type}`);
                    return (
                      <tr key={b.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={()=>setViewingBooking(b)}>
                        <td className="px-4 py-3">
                          <p className="text-xs font-mono font-semibold text-blue-600">#{b.id}</p>
                          {b.reference_number && <p className="text-xs text-gray-400 font-mono">{b.reference_number}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${tc.color}`}>
                            <TypeIcon className="w-3 h-3"/> {typeLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-sm text-gray-900">{b.client_name}</p>
                          <p className="text-xs text-gray-400" dir="ltr">{b.client_phone}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[160px] truncate">
                          {b.package_name || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Users className="w-3.5 h-3.5"/>
                            <span>{b.adults + b.children + b.infants}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {b.total_nights > 0
                            ? <span className="flex items-center gap-1 text-xs text-gray-600"><Moon className="w-3.5 h-3.5"/>{b.total_nights}</span>
                            : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {b.total_price
                            ? <span className="text-xs font-semibold text-emerald-600">{parseFloat(b.total_price).toLocaleString()} {b.currency}</span>
                            : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${sc.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}/>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(b.created_at).toLocaleDateString(locale)}
                        </td>
                        <td className="px-4 py-3" onClick={e=>e.stopPropagation()}>
                          <div className="flex gap-1">
                            <button onClick={()=>setViewingBooking(b)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title={t('bookingsMgmt.tooltips.view')}>
                              <Eye className="w-4 h-4"/>
                            </button>
                            <button onClick={()=>setDeleteTarget(b)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title={t('bookingsMgmt.tooltips.delete')}>
                              <Trash2 className="w-4 h-4"/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <span className="text-sm text-gray-500">
                    {t('bookingsMgmt.pagination')
                      .replace('{from}', String((currentPage-1)*itemsPerPage+1))
                      .replace('{to}', String(Math.min(currentPage*itemsPerPage,filtered.length)))
                      .replace('{total}', String(filtered.length))}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>setCurrentPage(p=>Math.max(p-1,1))} disabled={currentPage===1}
                      className="flex items-center gap-1 px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">
                      {isRTL ? <ChevronRight className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>}
                      {t('bookingsMgmt.prev')}
                    </button>
                    <div className="flex gap-1">
                      {Array.from({length:Math.min(totalPages,5)},(_,i)=>i+1).map(p=>(
                        <button key={p} onClick={()=>setCurrentPage(p)}
                          className={`w-9 h-9 rounded-xl text-sm font-medium ${currentPage===p?'bg-blue-600 text-white':'hover:bg-gray-100 text-gray-600'}`}>{p}
                        </button>
                      ))}
                    </div>
                    <button onClick={()=>setCurrentPage(p=>Math.min(p+1,totalPages))} disabled={currentPage===totalPages}
                      className="flex items-center gap-1 px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">
                      {t('bookingsMgmt.next')}
                      {isRTL ? <ChevronLeft className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                    </button>
                  </div>
                </div>
              )}
            </>
        }
      </div>

      {/* Modals */}
      {showPicker && (
        <PackagePickerModal
          onClose={()=>setShowPicker(false)}
          onSelect={pkg=>{ setWizardPkg(pkg); setShowPicker(false); }}
        />
      )}
      {wizardPkg && (
        <BookingWizard
          pkg={wizardPkg as any}
          onClose={()=>setWizardPkg(null)}
          onSuccess={()=>{ setWizardPkg(null); fetchBookings(); addToast('success', t('bookingsMgmt.toasts.bookingSuccess')); }}
        />
      )}
      {deleteTarget && <DeleteModal name={`${deleteTarget.client_name}`} loading={deletingId===deleteTarget.id} onConfirm={confirmDelete} onCancel={()=>setDeleteTarget(null)}/>}
      {viewingBooking && <BookingDetailsModal booking={viewingBooking} onClose={()=>setViewingBooking(null)} onStatusChange={handleStatusChange}/>}
    </div>
  );
}
