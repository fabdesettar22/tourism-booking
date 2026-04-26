import { useState, useEffect } from 'react';
import {
  Calendar, Users, DollarSign, CheckCircle2,
  Clock, XCircle, TrendingUp, Loader2,
  AlertTriangle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { apiFetch } from '../../services/apiFetch';
import { useLanguage } from '../../hooks/useLanguage';
import type { AuthUser } from '../../services/authService';

interface Props { user: AuthUser; }

interface Stats {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  total_persons: number;
  adults: number;
  children: number;
  infants: number;
  total_revenue: number;
  commission_rate: number;
  commission_earned: number;
  currency: string;
}

interface WeekDay { date: string; label: string; count: number; }

interface RecentBooking {
  id: number;
  reference_number: string;
  client_name: string;
  client_phone: string;
  status: string;
  booking_type: string;
  adults: number;
  children: number;
  infants: number;
  total_price: string | null;
  currency: string;
  created_at: string;
  package__name: string | null;
}

const PIE_COLORS = ['#f59e0b', '#10b981', '#ef4444', '#3b82f6'];

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  pending:   { color: 'text-amber-600',   bg: 'bg-amber-50' },
  confirmed: { color: 'text-emerald-600', bg: 'bg-emerald-50' },
  cancelled: { color: 'text-red-600',     bg: 'bg-red-50' },
  completed: { color: 'text-blue-600',    bg: 'bg-blue-50' },
};

const DATE_LOCALE = { ar: 'ar-SA', en: 'en-US', ms: 'ms-MY' } as const;

export function AgencyDashboard({ user }: Props) {
  const { t, lang, isRTL } = useLanguage();
  const [stats, setStats]     = useState<Stats | null>(null);
  const [weekData, setWeekData] = useState<WeekDay[]>([]);
  const [recent, setRecent]   = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const fullName = `${user.first_name} ${user.last_name}`.trim() || user.username;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('agencyDashboard.greetingMorning');
    if (h < 17) return t('agencyDashboard.greetingAfternoon');
    return t('agencyDashboard.greetingEvening');
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiFetch('/api/v1/bookings/dashboard-stats/');
        if (!res.ok) { setError(t('agencyDashboard.errorFetch')); return; }
        const data = await res.json();
        setStats(data.stats);
        setWeekData(data.week_data);
        setRecent(data.recent);
      } catch { setError(t('agencyDashboard.errorConnection')); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, [t]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      <p className="text-gray-500">{t('agencyDashboard.loadingMsg')}</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertTriangle className="w-12 h-12 text-amber-400" />
      <p className="text-gray-600">{error}</p>
    </div>
  );

  if (!stats) return null;

  const pieData = [
    { name: t('agencyDashboard.pieLabels.pending'),   value: stats.pending   },
    { name: t('agencyDashboard.pieLabels.confirmed'), value: stats.confirmed },
    { name: t('agencyDashboard.pieLabels.cancelled'), value: stats.cancelled },
    { name: t('agencyDashboard.pieLabels.completed'), value: stats.completed },
  ].filter(d => d.value > 0);

  const greetingDir = isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r';
  const dateLocale  = DATE_LOCALE[lang] || 'en-US';

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Greeting */}
      <div className={`${greetingDir} from-blue-600 to-blue-800 rounded-2xl p-6 text-white`}>
        <h2 className="text-2xl font-bold mb-1">{greeting()}، {fullName}</h2>
        <p className="text-blue-100 text-sm">
          {user.agency_name && `${t('agencyDashboard.agency')} ${user.agency_name} — `}
          {t('agencyDashboard.summarySubtitle')}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
            {t('agencyDashboard.commissionLabel')} {stats.commission_rate}%
          </span>
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
            {stats.currency}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: t('agencyDashboard.cards.totalBookings'),
            value: stats.total,
            icon: <Calendar className="w-6 h-6 text-blue-600" />,
            color: 'bg-blue-50',
            sub: t('agencyDashboard.cards.totalBookingsSub').replace('{n}', String(stats.pending)),
          },
          {
            label: t('agencyDashboard.cards.totalTravelers'),
            value: stats.total_persons,
            icon: <Users className="w-6 h-6 text-purple-600" />,
            color: 'bg-purple-50',
            sub: t('agencyDashboard.cards.totalTravelersSub'),
          },
          {
            label: t('agencyDashboard.cards.confirmed'),
            value: stats.confirmed,
            icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
            color: 'bg-emerald-50',
            sub: t('agencyDashboard.cards.confirmedSub').replace('{n}', String(stats.total)),
          },
          {
            label: t('agencyDashboard.cards.commissionEarned'),
            value: `${stats.commission_earned.toLocaleString()} ${stats.currency}`,
            icon: <DollarSign className="w-6 h-6 text-amber-600" />,
            color: 'bg-amber-50',
            sub: t('agencyDashboard.cards.commissionEarnedSub').replace('{p}', String(stats.commission_rate)),
          },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.color}`}>
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">{card.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border shadow-sm">
          <h3 className="font-bold text-gray-900 mb-1">{t('agencyDashboard.weekChart')}</h3>
          <p className="text-sm text-gray-400 mb-4">{t('agencyDashboard.weekChartSub')}</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" name={t('agencyDashboard.weekChartLegend')} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl p-6 border shadow-sm">
          <h3 className="font-bold text-gray-900 mb-1">{t('agencyDashboard.distribution')}</h3>
          <p className="text-sm text-gray-400 mb-4">{t('agencyDashboard.distributionSub')}</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-300">
              <p className="text-sm">{t('agencyDashboard.noBookingsYet')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('agencyDashboard.statusLabels.pending'),   value: stats.pending,   icon: <Clock className="w-5 h-5" />,        ...STATUS_STYLE.pending },
          { label: t('agencyDashboard.statusLabels.confirmed'), value: stats.confirmed, icon: <CheckCircle2 className="w-5 h-5" />, ...STATUS_STYLE.confirmed },
          { label: t('agencyDashboard.statusLabels.completed'), value: stats.completed, icon: <TrendingUp className="w-5 h-5" />,   ...STATUS_STYLE.completed },
          { label: t('agencyDashboard.statusLabels.cancelled'), value: stats.cancelled, icon: <XCircle className="w-5 h-5" />,      ...STATUS_STYLE.cancelled },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-4 border flex items-center gap-3 ${s.bg}`}>
            <span className={s.color}>{s.icon}</span>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-600">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-bold text-gray-900">{t('agencyDashboard.recentBookings')}</h3>
          <p className="text-sm text-gray-400">{t('agencyDashboard.recentBookingsSub')}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {[
                  t('agencyDashboard.tableHeaders.ref'),
                  t('agencyDashboard.tableHeaders.client'),
                  t('agencyDashboard.tableHeaders.package'),
                  t('agencyDashboard.tableHeaders.persons'),
                  t('agencyDashboard.tableHeaders.status'),
                  t('agencyDashboard.tableHeaders.date'),
                ].map((h, i) => (
                  <th key={i} className={`px-5 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-semibold text-gray-500`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recent.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400 text-sm">{t('agencyDashboard.noBookingsYet')}</td></tr>
              ) : recent.map(b => {
                const sc = STATUS_STYLE[b.status] ?? STATUS_STYLE.pending;
                const statusLabel = t(`agencyDashboard.statusLabels.${b.status}`) || b.status;
                return (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-xs font-mono text-gray-500">{b.reference_number}</td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-gray-900">{b.client_name}</p>
                      <p className="text-xs text-gray-400" dir="ltr">{b.client_phone}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {b.package__name || (b.booking_type === 'custom' ? t('agencyDashboard.customPackage') : '—')}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {b.adults + b.children + b.infants} {t('agencyDashboard.persons')}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sc.bg} ${sc.color}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {new Date(b.created_at).toLocaleDateString(dateLocale)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Persons Breakdown */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4">{t('agencyDashboard.travelersBreakdown')}</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: t('agencyDashboard.adults'),   value: stats.adults,   color: 'bg-blue-500' },
            { label: t('agencyDashboard.children'), value: stats.children, color: 'bg-emerald-500' },
            { label: t('agencyDashboard.infants'),  value: stats.infants,  color: 'bg-amber-500' },
          ].map((p, i) => (
            <div key={i} className="text-center p-4 rounded-2xl bg-gray-50">
              <div className={`w-3 h-3 rounded-full ${p.color} mx-auto mb-2`} />
              <p className="text-2xl font-bold text-gray-900">{p.value}</p>
              <p className="text-sm text-gray-500">{p.label}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
