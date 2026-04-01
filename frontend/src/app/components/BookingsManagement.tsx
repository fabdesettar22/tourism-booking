import { useState } from 'react';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Plane, Building, MapPin } from 'lucide-react';

interface Booking {
  id: string;
  customer: string;
  type: 'flight' | 'package' | 'tour';
  destination: string;
  package: string;
  status: 'new' | 'confirmed' | 'cancelled';
  amount: string;
  date: string;
  departureDate: string;
}

export function BookingsManagement() {
  const [filter, setFilter] = useState<'all' | 'new' | 'confirmed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const bookings: Booking[] = [
    { id: 'BK-001', customer: 'سارة أحمد محمد', type: 'package', destination: 'دبي', package: 'باقة VIP شاملة', status: 'confirmed', amount: '$3,500', date: '2026-03-28', departureDate: '2026-04-15' },
    { id: 'BK-002', customer: 'محمد علي حسن', type: 'flight', destination: 'القاهرة', package: 'تذكرة طيران', status: 'new', amount: '$850', date: '2026-03-29', departureDate: '2026-04-18' },
    { id: 'BK-003', customer: 'فاطمة خالد عبدالله', type: 'package', destination: 'اسطنبول', package: 'باقة شهر العسل', status: 'confirmed', amount: '$4,200', date: '2026-03-27', departureDate: '2026-04-20' },
    { id: 'BK-004', customer: 'عمر حسن علي', type: 'tour', destination: 'باريس', package: 'جولة سياحية 5 أيام', status: 'confirmed', amount: '$2,800', date: '2026-03-26', departureDate: '2026-04-22' },
    { id: 'BK-005', customer: 'نور عبدالله محمود', type: 'package', destination: 'لندن', package: 'باقة الأعمال', status: 'cancelled', amount: '$4,100', date: '2026-03-25', departureDate: '2026-04-25' },
    { id: 'BK-006', customer: 'أحمد يوسف إبراهيم', type: 'flight', destination: 'روما', package: 'تذكرة طيران + فندق', status: 'new', amount: '$1,950', date: '2026-03-30', departureDate: '2026-05-01' },
    { id: 'BK-007', customer: 'مريم سعيد خليل', type: 'tour', destination: 'بانكوك', package: 'جولة آسيوية', status: 'confirmed', amount: '$3,300', date: '2026-03-24', departureDate: '2026-05-10' },
    { id: 'BK-008', customer: 'خالد محمود فهد', type: 'package', destination: 'برشلونة', package: 'باقة عائلية', status: 'new', amount: '$5,600', date: '2026-03-31', departureDate: '2026-05-15' },
  ];

  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = filter === 'all' || booking.status === filter;
    const matchesSearch = booking.customer.includes(searchQuery) ||
                         booking.id.includes(searchQuery) ||
                         booking.destination.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const statusColors = {
    new: 'bg-blue-500/10 text-blue-500',
    confirmed: 'bg-green-500/10 text-green-500',
    cancelled: 'bg-red-500/10 text-red-500',
  };

  const statusLabels = {
    new: 'جديد',
    confirmed: 'مؤكد',
    cancelled: 'ملغي',
  };

  const typeIcons = {
    flight: Plane,
    package: Building,
    tour: MapPin,
  };

  const stats = [
    { label: 'إجمالي الحجوزات', value: bookings.length, color: 'bg-blue-500' },
    { label: 'حجوزات جديدة', value: bookings.filter(b => b.status === 'new').length, color: 'bg-yellow-500' },
    { label: 'حجوزات مؤكدة', value: bookings.filter(b => b.status === 'confirmed').length, color: 'bg-green-500' },
    { label: 'حجوزات ملغاة', value: bookings.filter(b => b.status === 'cancelled').length, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-1">إدارة الحجوزات</h2>
          <p className="text-muted-foreground">عرض وإدارة جميع حجوزات الوكالة</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-5 h-5" />
          <span>حجز جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                {stat.value}
              </div>
              <div>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="ابحث عن حجز، عميل، أو وجهة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-background border border-border'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilter('new')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'new' ? 'bg-primary text-primary-foreground' : 'bg-background border border-border'
                }`}
              >
                جديد
              </button>
              <button
                onClick={() => setFilter('confirmed')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'confirmed' ? 'bg-primary text-primary-foreground' : 'bg-background border border-border'
                }`}
              >
                مؤكد
              </button>
              <button
                onClick={() => setFilter('cancelled')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'cancelled' ? 'bg-primary text-primary-foreground' : 'bg-background border border-border'
                }`}
              >
                ملغي
              </button>
              <button className="px-4 py-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="text-right py-4 px-6 font-medium">رقم الحجز</th>
                <th className="text-right py-4 px-6 font-medium">النوع</th>
                <th className="text-right py-4 px-6 font-medium">العميل</th>
                <th className="text-right py-4 px-6 font-medium">الوجهة</th>
                <th className="text-right py-4 px-6 font-medium">الباقة/الخدمة</th>
                <th className="text-right py-4 px-6 font-medium">تاريخ السفر</th>
                <th className="text-right py-4 px-6 font-medium">الحالة</th>
                <th className="text-right py-4 px-6 font-medium">المبلغ</th>
                <th className="text-right py-4 px-6 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => {
                const TypeIcon = typeIcons[booking.type];
                return (
                  <tr key={booking.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                    <td className="py-4 px-6 font-medium">{booking.id}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </td>
                    <td className="py-4 px-6">{booking.customer}</td>
                    <td className="py-4 px-6">{booking.destination}</td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">{booking.package}</td>
                    <td className="py-4 px-6 text-sm">{booking.departureDate}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs ${statusColors[booking.status]}`}>
                        {statusLabels[booking.status]}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-medium">{booking.amount}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-accent rounded-lg transition-colors" title="عرض التفاصيل">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-accent rounded-lg transition-colors" title="تعديل">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors" title="حذف">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
          <span>عرض {filteredBookings.length} من {bookings.length} حجز</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-border rounded hover:bg-accent">السابق</button>
            <button className="px-3 py-1 bg-primary text-primary-foreground rounded">1</button>
            <button className="px-3 py-1 border border-border rounded hover:bg-accent">2</button>
            <button className="px-3 py-1 border border-border rounded hover:bg-accent">3</button>
            <button className="px-3 py-1 border border-border rounded hover:bg-accent">التالي</button>
          </div>
        </div>
      </div>
    </div>
  );
}
