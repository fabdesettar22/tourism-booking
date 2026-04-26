import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function RevenueChart() {
  const data = [
    { month: 'يناير', revenue: 12000, bookings: 45 },
    { month: 'فبراير', revenue: 15000, bookings: 52 },
    { month: 'مارس', revenue: 18000, bookings: 61 },
    { month: 'أبريل', revenue: 22000, bookings: 73 },
    { month: 'مايو', revenue: 25000, bookings: 85 },
    { month: 'يونيو', revenue: 28000, bookings: 92 },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="mb-1">نظرة عامة على الإيرادات</h3>
          <p className="text-sm text-muted-foreground">آخر 6 أشهر</p>
        </div>
        <select className="px-4 py-2 bg-input-background border border-border rounded-lg text-sm">
          <option>آخر 6 أشهر</option>
          <option>آخر 3 أشهر</option>
          <option>السنة الحالية</option>
        </select>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="month"
            stroke="var(--color-muted-foreground)"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="var(--color-muted-foreground)"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              direction: 'rtl'
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '14px', direction: 'rtl' }}
          />
          <Bar dataKey="revenue" fill="var(--color-chart-1)" name="الإيرادات ($)" radius={[8, 8, 0, 0]} />
          <Bar dataKey="bookings" fill="var(--color-chart-2)" name="الحجوزات" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
