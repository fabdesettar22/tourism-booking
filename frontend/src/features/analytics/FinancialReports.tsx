import { useState, useEffect } from 'react';
import { apiFetch } from '../../services/apiFetch';
import {
  DollarSign, TrendingUp, CheckCircle2, XCircle, Clock,
  Loader2, RefreshCw, CreditCard
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────
interface BookingStats {
  stats: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    total_revenue: number;
    commission_rate: number;
    commission_earned: number;
    currency: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────
function fmt(val: string | number, currency = 'MYR') {
  return `${parseFloat(String(val)).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

// ─── Stat Card ────────────────────────────────────────────
function StatCard({ label, value, currency, sub, icon, color, iconBg }:
  { label: string; value: string; currency?: string; sub?: string; icon: any; color: string; iconBg: string }) {
  const Icon = icon;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {currency && <p className="text-xs text-gray-400 mt-0.5">{currency}</p>}
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────
export function FinancialReports() {
  const [stats, setStats]   = useState<BookingStats['stats'] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/v1/bookings/dashboard-stats/');
      if (res.ok) {
        const d = await res.json();
        setStats(d.stats);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin"/>
      <p className="text-gray-500">جاري تحميل التقارير المالية...</p>
    </div>
  );

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen -m-8 p-8" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">التقارير المالية</h1>
          <p className="text-gray-500 text-sm mt-0.5">إحصاءات الإيرادات والحجوزات</p>
        </div>
        <button onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-medium hover:bg-gray-50">
          <RefreshCw className="w-4 h-4"/> تحديث
        </button>
      </div>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="إجمالي الإيرادات"
            value={stats.total_revenue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            currency={stats.currency} icon={TrendingUp} color="text-emerald-600" iconBg="bg-emerald-50"/>
          <StatCard label="إجمالي الحجوزات"
            value={String(stats.total)}
            icon={CreditCard} color="text-blue-600" iconBg="bg-blue-50"/>
          <StatCard label="العمولات المكتسبة"
            value={stats.commission_earned.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            currency={stats.currency}
            sub={`نسبة العمولة: ${stats.commission_rate}%`}
            icon={DollarSign} color="text-purple-600" iconBg="bg-purple-50"/>
        </div>
      )}

      {/* Booking Stats */}
      {stats && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-bold text-gray-800 mb-4">توزيع الحجوزات حسب الحالة</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'معلقة',  val: stats.pending,   color: 'text-amber-600',   bg: 'bg-amber-50',   icon: Clock },
              { label: 'مؤكدة',  val: stats.confirmed, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
              { label: 'ملغاة',  val: stats.cancelled, color: 'text-red-600',     bg: 'bg-red-50',     icon: XCircle },
              { label: 'مكتملة', val: stats.completed, color: 'text-blue-600',    bg: 'bg-blue-50',    icon: CheckCircle2 },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-4 ${s.bg} flex items-center gap-3`}>
                <s.icon className={`w-5 h-5 ${s.color}`}/>
                <div>
                  <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">إجمالي الإيرادات</span>
              <span className="font-bold text-emerald-600">{fmt(stats.total_revenue, stats.currency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">العمولات المكتسبة ({stats.commission_rate}%)</span>
              <span className="font-bold text-purple-600">{fmt(stats.commission_earned, stats.currency)}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
