export function BookingsTable() {
  const bookings = [
    { id: 'BK001', customer: 'سارة أحمد', destination: 'دبي', date: '2026-04-15', status: 'مؤكد', amount: '$1,250' },
    { id: 'BK002', customer: 'محمد علي', destination: 'باريس', date: '2026-04-18', status: 'قيد المراجعة', amount: '$2,800' },
    { id: 'BK003', customer: 'فاطمة حسن', destination: 'مالديف', date: '2026-04-20', status: 'مؤكد', amount: '$3,500' },
    { id: 'BK004', customer: 'أحمد خالد', destination: 'إسطنبول', date: '2026-04-22', status: 'ملغي', amount: '$980' },
    { id: 'BK005', customer: 'نورة سعيد', destination: 'بالي', date: '2026-04-25', status: 'مؤكد', amount: '$2,100' },
    { id: 'BK006', customer: 'يوسف محمود', destination: 'لندن', date: '2026-04-28', status: 'قيد المراجعة', amount: '$1,750' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'مؤكد':
        return 'bg-green-100 text-green-700';
      case 'قيد المراجعة':
        return 'bg-yellow-100 text-yellow-700';
      case 'ملغي':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3>الحجوزات الأخيرة</h3>
        <button className="px-4 py-2 text-sm text-primary hover:bg-accent rounded-lg transition-colors">
          عرض الكل
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full" dir="rtl">
          <thead>
            <tr className="border-b border-border">
              <th className="text-right py-3 px-4 text-sm text-muted-foreground">رقم الحجز</th>
              <th className="text-right py-3 px-4 text-sm text-muted-foreground">العميل</th>
              <th className="text-right py-3 px-4 text-sm text-muted-foreground">الوجهة</th>
              <th className="text-right py-3 px-4 text-sm text-muted-foreground">التاريخ</th>
              <th className="text-right py-3 px-4 text-sm text-muted-foreground">الحالة</th>
              <th className="text-right py-3 px-4 text-sm text-muted-foreground">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                <td className="py-4 px-4">{booking.id}</td>
                <td className="py-4 px-4">{booking.customer}</td>
                <td className="py-4 px-4">{booking.destination}</td>
                <td className="py-4 px-4 text-muted-foreground">{booking.date}</td>
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </td>
                <td className="py-4 px-4">{booking.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
