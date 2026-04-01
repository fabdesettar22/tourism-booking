import { Calendar, Users, DollarSign, TrendingUp } from 'lucide-react';
import { StatCard } from './StatCard';
import { BookingsTable } from './BookingsTable';
import { RevenueChart } from './RevenueChart';
import { PopularDestinations } from './PopularDestinations';

export function DashboardContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1">مرحباً بك، أحمد</h2>
        <p className="text-muted-foreground">هذا ملخص لنشاط وكالتك السياحية اليوم</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي الحجوزات"
          value="1,234"
          change="12.5%"
          trend="up"
          icon={Calendar}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="العملاء النشطين"
          value="892"
          change="8.2%"
          trend="up"
          icon={Users}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="الإيرادات"
          value="$125,430"
          change="15.3%"
          trend="up"
          icon={DollarSign}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="معدل النمو"
          value="23.5%"
          change="3.1%"
          trend="up"
          icon={TrendingUp}
          color="bg-orange-50 text-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <PopularDestinations />
        </div>
      </div>

      <BookingsTable />
    </div>
  );
}
