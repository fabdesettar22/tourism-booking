import { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function FinancialReports() {
  const [period, setPeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly');

  const financialData = {
    daily: {
      revenue: '$12,450',
      expenses: '$4,200',
      profit: '$8,250',
      growth: '+8.5%',
    },
    monthly: {
      revenue: '$342,500',
      expenses: '$125,300',
      profit: '$217,200',
      growth: '+15.3%',
    },
    yearly: {
      revenue: '$3,856,000',
      expenses: '$1,423,000',
      profit: '$2,433,000',
      growth: '+23.7%',
    },
  };

  const currentData = financialData[period];

  const monthlyRevenue = [
    { month: 'يناير', revenue: 285000, expenses: 105000, profit: 180000 },
    { month: 'فبراير', revenue: 312000, expenses: 118000, profit: 194000 },
    { month: 'مارس', revenue: 342500, expenses: 125300, profit: 217200 },
    { month: 'أبريل', revenue: 298000, expenses: 112000, profit: 186000 },
    { month: 'مايو', revenue: 356000, expenses: 131000, profit: 225000 },
    { month: 'يونيو', revenue: 389000, expenses: 142000, profit: 247000 },
  ];

  const revenueByCategory = [
    { category: 'باقات سياحية', amount: '$156,800', percentage: 45.8, color: 'bg-blue-500' },
    { category: 'رحلات طيران', amount: '$98,450', percentage: 28.7, color: 'bg-green-500' },
    { category: 'حجوزات فنادق', amount: '$62,100', percentage: 18.1, color: 'bg-purple-500' },
    { category: 'خدمات إضافية', amount: '$25,150', percentage: 7.4, color: 'bg-orange-500' },
  ];

  const topCustomers = [
    { name: 'فاطمة خالد', bookings: 15, spent: '$56,800' },
    { name: 'سارة أحمد', bookings: 12, spent: '$42,500' },
    { name: 'أحمد يوسف', bookings: 10, spent: '$35,600' },
    { name: 'خالد محمود', bookings: 9, spent: '$31,900' },
    { name: 'محمد علي', bookings: 8, spent: '$28,300' },
  ];

  const expenses = [
    { category: 'رواتب الموظفين', amount: '$45,000', percentage: 35.9 },
    { category: 'عمولات الوكالات', amount: '$32,500', percentage: 25.9 },
    { category: 'تسويق وإعلان', amount: '$18,200', percentage: 14.5 },
    { category: 'مصاريف تشغيلية', amount: '$15,600', percentage: 12.4 },
    { category: 'صيانة وتطوير', amount: '$14,000', percentage: 11.2 },
  ];

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-1">التقارير المالية</h2>
          <p className="text-muted-foreground">عرض تفصيلي للإيرادات والمصروفات</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'daily' | 'monthly' | 'yearly')}
            className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="daily">يومي</option>
            <option value="monthly">شهري</option>
            <option value="yearly">سنوي</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
            <Download className="w-5 h-5" />
            <span>تصدير التقرير</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-muted-foreground text-sm mb-1">إجمالي الإيرادات</p>
              <h3 className="mb-2">{currentData.revenue}</h3>
              <div className="flex items-center gap-1 text-green-500">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">{currentData.growth}</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-muted-foreground text-sm mb-1">إجمالي المصروفات</p>
              <h3 className="mb-2">{currentData.expenses}</h3>
              <div className="flex items-center gap-1 text-red-500">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm">-3.2%</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <ArrowDownRight className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-muted-foreground text-sm mb-1">صافي الربح</p>
              <h3 className="mb-2">{currentData.profit}</h3>
              <div className="flex items-center gap-1 text-green-500">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">+18.7%</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="mb-6">الإيرادات والمصروفات الشهرية</h3>
          <div className="space-y-4">
            {monthlyRevenue.map((item) => (
              <div key={item.month}>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-muted-foreground">{item.month}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-green-500">${(item.revenue / 1000).toFixed(0)}k</span>
                    <span className="text-red-500">${(item.expenses / 1000).toFixed(0)}k</span>
                  </div>
                </div>
                <div className="relative h-8 bg-accent rounded overflow-hidden">
                  <div
                    className="absolute top-0 right-0 h-full bg-green-500/30 transition-all"
                    style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                  ></div>
                  <div
                    className="absolute top-0 right-0 h-full bg-green-500 transition-all"
                    style={{ width: `${(item.profit / maxRevenue) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="mb-6">الإيرادات حسب الفئة</h3>
          <div className="space-y-4">
            {revenueByCategory.map((item) => (
              <div key={item.category}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">{item.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                    <span className="text-sm font-medium">{item.amount}</span>
                  </div>
                </div>
                <div className="h-2 bg-accent rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} transition-all`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="mb-6">أفضل العملاء</h3>
          <div className="space-y-4">
            {topCustomers.map((customer, index) => (
              <div key={customer.name} className="flex items-center gap-4 p-3 bg-background rounded-lg">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">{customer.bookings} حجز</p>
                </div>
                <span className="font-medium text-green-500">{customer.spent}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="mb-6">تفاصيل المصروفات</h3>
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div key={expense.category} className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm mb-1">{expense.category}</p>
                  <div className="h-2 bg-accent rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all"
                      style={{ width: `${expense.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="mr-4 text-left">
                  <p className="font-medium text-sm">{expense.amount}</p>
                  <p className="text-xs text-muted-foreground">{expense.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
