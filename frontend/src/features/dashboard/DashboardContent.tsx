import { apiFetch } from '../../services/apiFetch';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import {
  Calendar, Users, Package, AlertTriangle, Zap, TrendingUp,
  Building2, Loader2, ArrowUpLeft, Clock, XCircle, CreditCard,
  UserX, Plane, Hotel, Briefcase, Settings, DollarSign, BarChart3,
  MapPin, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

interface Booking {
  id: number; reference_number?: string;
  booking_type: 'agency' | 'custom';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  client_name: string; client_phone: string;
  adults: number; children: number; infants: number;
  package_name: string | null; total_nights: number;
  total_price: string | null; currency: string;
  cities: { city_name: string; country_name: string; nights: number }[];
  created_at: string;
}
interface HotelT { id: number; name: string; stars: number; city: number; }
interface CityT  { id: number; name: string; country: number; }
interface TourPackage { id: number; name: string; is_active: boolean; is_customizable: boolean; base_price: string; currency: string; }
interface Agency { id: number; name: string; is_active: boolean; status: string; }
interface UserT  { id: number; username: string; role: string; is_active: boolean; }

const DATE_LOCALE: Record<'ar'|'en'|'ms', string> = { ar: 'ar-SA', en: 'en-US', ms: 'ms-MY' };

const SS_STYLE: Record<string, {bg:string;text:string;icon:string;border:string}> = {
  pending:   {bg:'#fef9ee',text:'#92400e',icon:'⏳',border:'#fcd34d'},
  confirmed: {bg:'#eff6ff',text:'#1d4ed8',icon:'✈', border:'#93c5fd'},
  completed: {bg:'#f0fdf4',text:'#166534',icon:'✓', border:'#86efac'},
  cancelled: {bg:'#fff1f2',text:'#9f1239',icon:'✕', border:'#fca5a5'},
};

// Days names per language (arrays — handled in component because t() returns strings)
const DAYS_LOCAL: Record<'ar'|'en'|'ms', string[]> = {
  ar: ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'],
  en: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  ms: ['Ahad','Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu'],
};

const TBL_HEADERS: Record<'ar'|'en'|'ms', string[]> = {
  ar: ['الفاتورة','النوع','الحجز','الحالة','السعر','العميل','التاريخ'],
  en: ['INVOICE','TYPE','BOOKING','STATUS','PRICE','CUSTOMER','DATE'],
  ms: ['INVOIS','JENIS','TEMPAHAN','STATUS','HARGA','PELANGGAN','TARIKH'],
};

function CalendarModal({ show, onClose, day, dayBookings, currentDate }: {
  show: boolean; onClose: () => void; day: number | null;
  dayBookings: Booking[]; currentDate: Date;
}) {
  const { t, lang, isRTL } = useLanguage();
  if (!show || !day || dayBookings.length === 0) return null;
  const locale = DATE_LOCALE[lang];

  const filters = [
    { label: t('adminDashboard.dayModal.filters.all'),       value: dayBookings.length,                                  color: 'text-gray-700' },
    { label: t('adminDashboard.dayModal.filters.confirmed'), value: dayBookings.filter(b=>b.status==='confirmed').length, color: 'text-blue-600' },
    { label: t('adminDashboard.dayModal.filters.pending'),   value: dayBookings.filter(b=>b.status==='pending').length,   color: 'text-amber-600' },
    { label: t('adminDashboard.dayModal.filters.completed'), value: dayBookings.filter(b=>b.status==='completed').length, color: 'text-green-600' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)'}}
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 bg-blue-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">
                {day} {currentDate.toLocaleString(locale, {month:'long', year:'numeric'})}
              </p>
              <p className="text-blue-200 text-xs">
                {t('adminDashboard.dayModal.bookingsCount').replace('{n}', String(dayBookings.length))}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 rounded-lg">✕</button>
        </div>
        <div className="grid grid-cols-4 divide-x divide-x-reverse divide-gray-100 border-b bg-gray-50">
          {filters.map((s,i) => (
            <div key={i} className="px-3 py-2 text-center">
              <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {dayBookings.map((b,i) => {
            const s = SS_STYLE[b.status];
            const statusLabel = t(`adminDashboard.statusLabels.${b.status}`);
            return (
              <div key={i} className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base"
                  style={{background:s.bg, border:`1px solid ${s.border}`}}>
                  {s.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-800">{b.client_name}</p>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{background:s.bg,color:s.text}}>{statusLabel}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2" dir="ltr">{b.client_phone}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {b.package_name && (
                      <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                        <Package className="w-3 h-3" /> {b.package_name}
                      </span>
                    )}
                    <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                      <Users className="w-3 h-3" /> {b.adults+b.children+b.infants} {t('adminDashboard.dayModal.personsSuffix')}
                    </span>
                    {b.total_price && parseFloat(b.total_price) > 0 && (
                      <span className="flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full">
                        <DollarSign className="w-3 h-3" /> {b.currency} {parseFloat(b.total_price).toLocaleString()}
                      </span>
                    )}
                    {b.cities.map((c,ci) => (
                      <span key={ci} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                        <MapPin className="w-3 h-3" /> {c.city_name}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 font-mono">
                    #{b.reference_number || b.id} • {new Date(b.created_at).toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit'})}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-5 py-3 border-t bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">
            {t('adminDashboard.dayModal.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingsCalendar({ bookings }: { bookings: Booking[] }) {
  const { t, lang, isRTL } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selDay, setSelDay]           = useState<number | null>(null);
  const [selBookings, setSelBookings] = useState<Booking[]>([]);
  const [showModal, setShowModal]     = useState(false);

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const locale = DATE_LOCALE[lang];
  const monthName = currentDate.toLocaleString(locale, {month:'long', year:'numeric'});
  const firstDay  = new Date(year, month, 1).getDay();
  const daysCount = new Date(year, month + 1, 0).getDate();
  const today     = new Date();
  const DAYS = DAYS_LOCAL[lang] || DAYS_LOCAL.en;

  const getDay = (day: number) => {
    const str = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return bookings.filter(b => b.created_at.startsWith(str));
  };

  const onDayClick = (day: number) => {
    const d = getDay(day);
    if (d.length === 0) return;
    setSelDay(day); setSelBookings(d); setShowModal(true);
  };

  const cells: (number|null)[] = [];
  for (let i=0; i<firstDay; i++) cells.push(null);
  for (let d=1; d<=daysCount; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const mb = bookings.filter(b => { const d=new Date(b.created_at); return d.getMonth()===month && d.getFullYear()===year; });

  const summary = [
    { label: t('adminDashboard.calendar.monthTotal'),     value: mb.length,                                 color: 'text-gray-700' },
    { label: t('adminDashboard.calendar.monthConfirmed'), value: mb.filter(b=>b.status==='confirmed').length, color: 'text-blue-600' },
    { label: t('adminDashboard.calendar.monthPending'),   value: mb.filter(b=>b.status==='pending').length,   color: 'text-amber-600' },
    { label: t('adminDashboard.calendar.monthCompleted'), value: mb.filter(b=>b.status==='completed').length, color: 'text-green-600' },
  ];

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">{t('adminDashboard.calendar.title')}</h2>
            <span className="text-sm text-gray-500">{monthName}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3">
              {Object.entries(SS_STYLE).map(([k,v]) => (
                <div key={k} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{background:v.border}} />
                  <span className="text-xs text-gray-400">{t(`adminDashboard.statusLabels.${k}`)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentDate(new Date(year,month-1,1))} className="p-1.5 hover:bg-gray-100 rounded-lg">
                {isRTL ? <ChevronRight className="w-4 h-4 text-gray-500" /> : <ChevronLeft className="w-4 h-4 text-gray-500" />}
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                {t('adminDashboard.calendar.today')}
              </button>
              <button onClick={() => setCurrentDate(new Date(year,month+1,1))} className="p-1.5 hover:bg-gray-100 rounded-lg">
                {isRTL ? <ChevronLeft className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 divide-x divide-x-reverse divide-gray-100 border-b bg-gray-50">
          {summary.map((s,i) => (
            <div key={i} className="px-4 py-2 text-center">
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS.map(d => <div key={d} className="py-2.5 text-center text-xs font-semibold text-gray-400">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            const isToday   = day!==null && today.getDate()===day && today.getMonth()===month && today.getFullYear()===year;
            const isSel     = day!==null && day===selDay && showModal;
            const db        = day ? getDay(day) : [];
            const isLastRow = idx >= cells.length - 7;
            const isLastCol = (idx+1) % 7 === 0;
            return (
              <div key={idx} onClick={() => day && onDayClick(day)}
                className="min-h-[88px] p-2 transition-colors"
                style={{
                  borderRight:  isLastCol ? 'none' : '0.5px solid #f1f5f9',
                  borderBottom: isLastRow ? 'none' : '0.5px solid #f1f5f9',
                  background:   day===null ? '#f9fafb' : isSel ? '#eff6ff' : isToday ? '#fafbff' : 'white',
                  cursor:       db.length > 0 ? 'pointer' : 'default',
                }}>
                {day !== null && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday?'bg-blue-600 text-white':isSel?'bg-blue-100 text-blue-700':'text-gray-600'}`}>{day}</span>
                      {db.length > 0 && <span className="text-xs font-bold text-gray-400 bg-gray-100 rounded-full w-4 h-4 flex items-center justify-center">{db.length}</span>}
                    </div>
                    <div className="space-y-0.5">
                      {db.slice(0,2).map((b,bi) => {
                        const s = SS_STYLE[b.status];
                        return (
                          <div key={bi} className="px-1.5 py-0.5 rounded text-xs truncate"
                            style={{background:s.bg,color:s.text,borderLeft:`2px solid ${s.border}`}}>
                            {s.icon} {b.client_name.split(' ')[0]}
                          </div>
                        );
                      })}
                      {db.length > 2 && <div className="text-xs text-blue-500 font-medium px-1">+{db.length-2} {t('adminDashboard.calendar.moreSuffix')}</div>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <CalendarModal
        show={showModal}
        onClose={() => setShowModal(false)}
        day={selDay}
        dayBookings={selBookings}
        currentDate={currentDate}
      />
    </>
  );
}

export function DashboardContent() {
  const { t, lang, isRTL } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [, setPackages] = useState<TourPackage[]>([]);
  const [, setHotels]   = useState<HotelT[]>([]);
  const [, setCities]   = useState<CityT[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [users,    setUsers]    = useState<UserT[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [bR,pR,hR,cR,aR,uR] = await Promise.all([
        apiFetch('/api/v1/bookings/'),
        apiFetch('/api/v1/packages/'),
        apiFetch('/api/v1/hotels/'),
        apiFetch('/api/v1/locations/cities/'),
        apiFetch('/api/v1/accounts/agencies/'),
        apiFetch('/api/v1/accounts/users/'),
      ]);
      if(bR.ok){const d=await bR.json();setBookings(Array.isArray(d)?d:d.results||[]);}
      if(pR.ok){const d=await pR.json();setPackages(Array.isArray(d)?d:d.results||[]);}
      if(hR.ok){const d=await hR.json();setHotels(Array.isArray(d)?d:d.results||[]);}
      if(cR.ok){const d=await cR.json();setCities(Array.isArray(d)?d:d.results||[]);}
      if(aR.ok){const d=await aR.json();setAgencies(Array.isArray(d)?d:d.results||[]);}
      if(uR.ok){const d=await uR.json();setUsers(Array.isArray(d)?d:d.results||[]);}
    } catch(e){console.error(e);}
    finally{setLoading(false);}
  };

  const locale = DATE_LOCALE[lang];
  const now         = new Date();
  const thisMonth   = bookings.filter(b=>new Date(b.created_at).getMonth()===now.getMonth());
  const lastMonth   = bookings.filter(b=>new Date(b.created_at).getMonth()===now.getMonth()-1);
  const pending     = bookings.filter(b=>b.status==='pending');
  const cancelled   = bookings.filter(b=>b.status==='cancelled');
  const thisRevenue = thisMonth.filter(b=>b.status==='confirmed'||b.status==='completed').reduce((s,b)=>s+parseFloat(b.total_price||'0'),0);
  const lastRevenue = lastMonth.filter(b=>b.status==='confirmed'||b.status==='completed').reduce((s,b)=>s+parseFloat(b.total_price||'0'),0);

  const chartData: {date:string;confirmed:number;pending:number;cancelled:number}[] = [];
  for(let i=29;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    const ds=d.toISOString().split('T')[0];
    const lb=d.toLocaleDateString(locale,{month:'short',day:'numeric'});
    chartData.push({
      date:lb,
      confirmed:bookings.filter(b=>b.created_at.startsWith(ds)&&b.status==='confirmed').length,
      pending:  bookings.filter(b=>b.created_at.startsWith(ds)&&b.status==='pending').length,
      cancelled:bookings.filter(b=>b.created_at.startsWith(ds)&&b.status==='cancelled').length,
    });
  }

  if(loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;

  const overviewCards = [
    { label: t('adminDashboard.cards.totalBookings'),     value: bookings.length,              icon: <Calendar className="w-5 h-5 text-blue-500"/>,    bg: 'bg-blue-50' },
    { label: t('adminDashboard.cards.totalUsers'),        value: users.length,                 icon: <Users className="w-5 h-5 text-green-500"/>,      bg: 'bg-green-50' },
    { label: t('adminDashboard.cards.thisMonthBookings'), value: thisMonth.length,             icon: <TrendingUp className="w-5 h-5 text-purple-500"/>,bg: 'bg-purple-50' },
    { label: t('adminDashboard.cards.thisMonthRevenue'),  value: `MYR ${thisRevenue.toFixed(0)}`,icon: <DollarSign className="w-5 h-5 text-teal-500"/>, bg: 'bg-teal-50' },
  ];

  const actionItems = [
    { label: t('adminDashboard.actionItems.unpaidLabel'),          sub: t('adminDashboard.actionItems.unpaidSub'),          value: pending.length,                                        color: 'text-red-500',    bg: 'bg-red-50',    icon: <CreditCard className="w-4 h-4 text-red-400"/> },
    { label: t('adminDashboard.actionItems.cancelledLabel'),       sub: t('adminDashboard.actionItems.cancelledSub'),       value: cancelled.length,                                      color: 'text-orange-500', bg: 'bg-orange-50', icon: <XCircle className="w-4 h-4 text-orange-400"/> },
    { label: t('adminDashboard.actionItems.pendingAgenciesLabel'), sub: t('adminDashboard.actionItems.pendingAgenciesSub'), value: agencies.filter(a=>a.status==='pending').length,        color: 'text-green-500',  bg: 'bg-green-50',  icon: <Building2 className="w-4 h-4 text-green-400"/> },
    { label: t('adminDashboard.actionItems.inactiveUsersLabel'),   sub: t('adminDashboard.actionItems.inactiveUsersSub'),   value: users.filter(u=>!u.is_active).length,                  color: 'text-gray-500',   bg: 'bg-gray-50',   icon: <UserX className="w-4 h-4 text-gray-400"/> },
  ];

  const quickActionsItems = [
    { label: t('adminDashboard.quickActionsItems.bookings'),     sub: t('adminDashboard.quickActionsItems.bookingsSub'),     icon: <Calendar className="w-5 h-5 text-blue-500"/>,     bg: 'bg-blue-50' },
    { label: t('adminDashboard.quickActionsItems.users'),        sub: t('adminDashboard.quickActionsItems.usersSub'),        icon: <Users className="w-5 h-5 text-green-500"/>,       bg: 'bg-green-50' },
    { label: t('adminDashboard.quickActionsItems.packages'),     sub: t('adminDashboard.quickActionsItems.packagesSub'),     icon: <Package className="w-5 h-5 text-purple-500"/>,    bg: 'bg-purple-50' },
    { label: t('adminDashboard.quickActionsItems.hotels'),       sub: t('adminDashboard.quickActionsItems.hotelsSub'),       icon: <Hotel className="w-5 h-5 text-orange-500"/>,      bg: 'bg-orange-50' },
    { label: t('adminDashboard.quickActionsItems.destinations'), sub: t('adminDashboard.quickActionsItems.destinationsSub'), icon: <MapPin className="w-5 h-5 text-red-500"/>,        bg: 'bg-red-50' },
    { label: t('adminDashboard.quickActionsItems.services'),     sub: t('adminDashboard.quickActionsItems.servicesSub'),     icon: <Briefcase className="w-5 h-5 text-teal-500"/>,    bg: 'bg-teal-50' },
    { label: t('adminDashboard.quickActionsItems.agencies'),     sub: t('adminDashboard.quickActionsItems.agenciesSub'),     icon: <Building2 className="w-5 h-5 text-indigo-500"/>,  bg: 'bg-indigo-50' },
    { label: t('adminDashboard.quickActionsItems.settings'),     sub: t('adminDashboard.quickActionsItems.settingsSub'),     icon: <Settings className="w-5 h-5 text-gray-500"/>,     bg: 'bg-gray-50' },
  ];

  const perfCards = [
    {
      title: t('adminDashboard.perfThis'),
      period: now.toLocaleString(locale, { month: 'long', year: 'numeric' }),
      range: `${now.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} - ${t('adminDashboard.rangeTodaySuffix')}`,
      bk: thisMonth.length,
      rev: thisRevenue,
      byType: [
        { label: t('adminDashboard.typePackages'), count: thisMonth.filter(b=>b.booking_type==='agency').length },
        { label: t('adminDashboard.typeCustom'),   count: thisMonth.filter(b=>b.booking_type==='custom').length },
      ],
    },
    {
      title: t('adminDashboard.perfLast'),
      period: new Date(now.getFullYear(), now.getMonth()-1).toLocaleString(locale, { month: 'long', year: 'numeric' }),
      range: `${new Date(now.getFullYear(), now.getMonth()-1, 1).toLocaleDateString(locale, { month: 'short', day: 'numeric' })} - ${new Date(now.getFullYear(), now.getMonth(), 0).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}`,
      bk: lastMonth.length,
      rev: lastRevenue,
      byType: [
        { label: t('adminDashboard.typePackages'), count: lastMonth.filter(b=>b.booking_type==='agency').length },
        { label: t('adminDashboard.typeCustom'),   count: lastMonth.filter(b=>b.booking_type==='custom').length },
      ],
    },
  ];

  const tableHeaders = TBL_HEADERS[lang] || TBL_HEADERS.en;

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen -m-8 p-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-800">{t('adminDashboard.title')}</h1>
        <p className="text-gray-500 text-sm">{t('adminDashboard.subtitle')}</p>
      </div>

      {/* Overview */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
          <BarChart3 className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">{t('adminDashboard.overview')}</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-x-reverse divide-gray-100">
          {overviewCards.map((item,i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-5">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.bg}`}>{item.icon}</div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                <p className="text-2xl font-bold text-gray-800">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <BookingsCalendar bookings={bookings} />

      {/* Actions + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-700">{t('adminDashboard.actionsSection')}</h2>
            </div>
            {pending.length>0 && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                {t('adminDashboard.pendingBadge').replace('{n}', String(pending.length))}
              </span>
            )}
          </div>
          <div className="divide-y divide-gray-50">
            {actionItems.map((item,i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.bg}`}>{item.icon}</div>
                <div className="flex-1">
                  <p className={`text-xs font-bold tracking-wide ${item.color}`}>{item.label}</p>
                  <p className="text-xs text-gray-500">{item.sub}</p>
                </div>
                <span className={`text-2xl font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
            <Zap className="w-4 h-4 text-gray-500"/>
            <h2 className="text-sm font-semibold text-gray-700">{t('adminDashboard.quickActions')}</h2>
          </div>
          <div className="grid grid-cols-2 gap-px bg-gray-100">
            {quickActionsItems.map((item,i) => (
              <div key={i} className="bg-white flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.bg}`}>{item.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* This Month / Last Month */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {perfCards.map((card,i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500"/>
                <h2 className="text-sm font-semibold text-gray-700">{card.title}</h2>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-700">{card.period}</p>
                <p className="text-xs text-gray-400">{card.range}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-500"/>
                    <span className="text-xs text-gray-500">{t('adminDashboard.bookingsLabel')}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{card.bk}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-500"/>
                    <span className="text-xs text-gray-500">{t('adminDashboard.revenueLabel')}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">MYR {card.rev.toFixed(2)}</p>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">{t('adminDashboard.byType')}</p>
                {card.byType.map((tt,j) => (
                  <div key={j} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400"/>
                      <span className="text-sm text-gray-600">{tt.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{tt.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Analytics */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
          <TrendingUp className="w-4 h-4 text-gray-500"/>
          <h2 className="text-sm font-semibold text-gray-700">{t('adminDashboard.revAnalytics')}</h2>
        </div>
        <div className="p-5">
          <p className="text-sm font-medium text-gray-600 mb-4 text-center">{t('adminDashboard.chartTitle')}</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="date" tick={{fontSize:10,fill:'#94a3b8'}} stroke="transparent" interval={4}/>
              <YAxis allowDecimals={false} tick={{fontSize:10,fill:'#94a3b8'}} stroke="transparent"/>
              <Tooltip contentStyle={{borderRadius:'8px',fontSize:'12px',border:'1px solid #e2e8f0'}}/>
              <Legend wrapperStyle={{fontSize:'12px'}}/>
              <Line type="monotone" dataKey="confirmed" name={t('adminDashboard.chartLegends.confirmed')} stroke="#10b981" strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="pending"   name={t('adminDashboard.chartLegends.pending')}   stroke="#f59e0b" strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="cancelled" name={t('adminDashboard.chartLegends.cancelled')} stroke="#ef4444" strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500"/>
            <h2 className="text-sm font-semibold text-gray-700">{t('adminDashboard.recentBookings')}</h2>
          </div>
          <button className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
            {t('adminDashboard.viewAll')} <ArrowUpLeft className="w-3 h-3"/>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {tableHeaders.map(h=>(
                  <th key={h} className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-semibold text-gray-500 uppercase tracking-wide`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.length===0
                ? <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">{t('adminDashboard.noBookingsYet')}</td></tr>
                : bookings.slice(0,8).map(b => {
                  const ST: Record<string, string> = {
                    pending: 'bg-amber-100 text-amber-700',
                    confirmed: 'bg-green-100 text-green-700',
                    cancelled: 'bg-red-100 text-red-700',
                    completed: 'bg-blue-100 text-blue-700',
                  };
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3"><span className="text-blue-600 text-sm font-medium">#{b.reference_number||b.id}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Plane className="w-3.5 h-3.5 text-gray-400"/>
                          <span className="text-sm text-gray-600">
                            {b.booking_type==='agency' ? t('adminDashboard.typePackages') : t('adminDashboard.typeCustom')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="text-sm text-gray-600">{b.package_name || t('adminDashboard.customPackage')}</span></td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${ST[b.status]}`}>
                          {t(`adminDashboard.statusLabels.${b.status}`).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3"><p className="text-sm font-semibold text-gray-700">{b.total_price ? `${b.currency} ${parseFloat(b.total_price).toLocaleString()}` : '—'}</p></td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-700">{b.client_name}</p>
                        <p className="text-xs text-gray-400" dir="ltr">{b.client_phone}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(b.created_at).toLocaleDateString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
