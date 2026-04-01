import { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, User, Phone, Mail, MapPin, Calendar, DollarSign } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  totalBookings: number;
  totalSpent: string;
  lastBooking: string;
  joinDate: string;
  status: 'active' | 'inactive';
}

export function CustomersManagement() {
  const [searchQuery, setSearchQuery] = useState('');

  const customers: Customer[] = [
    { id: 'CU-001', name: 'سارة أحمد محمد', email: 'sara.ahmed@email.com', phone: '+966 50 123 4567', country: 'السعودية', city: 'جدة', totalBookings: 12, totalSpent: '$42,500', lastBooking: '2026-03-28', joinDate: '2024-05-10', status: 'active' },
    { id: 'CU-002', name: 'محمد علي حسن', email: 'm.ali@email.com', phone: '+971 55 234 5678', country: 'الإمارات', city: 'دبي', totalBookings: 8, totalSpent: '$28,300', lastBooking: '2026-03-25', joinDate: '2024-07-22', status: 'active' },
    { id: 'CU-003', name: 'فاطمة خالد عبدالله', email: 'fatima.k@email.com', phone: '+965 99 345 6789', country: 'الكويت', city: 'الكويت', totalBookings: 15, totalSpent: '$56,800', lastBooking: '2026-03-30', joinDate: '2023-11-05', status: 'active' },
    { id: 'CU-004', name: 'عمر حسن علي', email: 'omar.h@email.com', phone: '+20 10 456 7890', country: 'مصر', city: 'القاهرة', totalBookings: 6, totalSpent: '$18,200', lastBooking: '2026-02-15', joinDate: '2024-08-14', status: 'active' },
    { id: 'CU-005', name: 'نور عبدالله محمود', email: 'noor.abdullah@email.com', phone: '+962 79 567 8901', country: 'الأردن', city: 'عمان', totalBookings: 4, totalSpent: '$12,400', lastBooking: '2025-12-20', joinDate: '2024-09-30', status: 'inactive' },
    { id: 'CU-006', name: 'أحمد يوسف إبراهيم', email: 'ahmed.y@email.com', phone: '+974 33 678 9012', country: 'قطر', city: 'الدوحة', totalBookings: 10, totalSpent: '$35,600', lastBooking: '2026-03-29', joinDate: '2024-03-18', status: 'active' },
    { id: 'CU-007', name: 'مريم سعيد خليل', email: 'mariam.s@email.com', phone: '+968 92 789 0123', country: 'عمان', city: 'مسقط', totalBookings: 7, totalSpent: '$24,100', lastBooking: '2026-03-26', joinDate: '2024-06-25', status: 'active' },
    { id: 'CU-008', name: 'خالد محمود فهد', email: 'khaled.m@email.com', phone: '+973 36 890 1234', country: 'البحرين', city: 'المنامة', totalBookings: 9, totalSpent: '$31,900', lastBooking: '2026-03-27', joinDate: '2024-04-12', status: 'active' },
  ];

  const filteredCustomers = customers.filter(customer =>
    customer.name.includes(searchQuery) ||
    customer.email.includes(searchQuery) ||
    customer.phone.includes(searchQuery) ||
    customer.id.includes(searchQuery)
  );

  const stats = [
    { label: 'إجمالي العملاء', value: customers.length, color: 'bg-blue-500' },
    { label: 'عملاء نشطون', value: customers.filter(c => c.status === 'active').length, color: 'bg-green-500' },
    { label: 'إجمالي الحجوزات', value: customers.reduce((sum, c) => sum + c.totalBookings, 0), color: 'bg-purple-500' },
    { label: 'إجمالي الإيرادات', value: '$249,800', color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-1">قاعدة بيانات العملاء</h2>
          <p className="text-muted-foreground">عرض وإدارة جميع عملاء الوكالة</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-5 h-5" />
          <span>إضافة عميل</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                {typeof stat.value === 'number' ? stat.value : stat.value}
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
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث عن عميل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="text-right py-4 px-6 font-medium">رقم العميل</th>
                <th className="text-right py-4 px-6 font-medium">الاسم</th>
                <th className="text-right py-4 px-6 font-medium">البريد الإلكتروني</th>
                <th className="text-right py-4 px-6 font-medium">الهاتف</th>
                <th className="text-right py-4 px-6 font-medium">الموقع</th>
                <th className="text-right py-4 px-6 font-medium">عدد الحجوزات</th>
                <th className="text-right py-4 px-6 font-medium">إجمالي الإنفاق</th>
                <th className="text-right py-4 px-6 font-medium">الحالة</th>
                <th className="text-right py-4 px-6 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                  <td className="py-4 px-6 font-medium">{customer.id}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <span>{customer.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-muted-foreground">{customer.email}</td>
                  <td className="py-4 px-6 text-sm" dir="ltr">{customer.phone}</td>
                  <td className="py-4 px-6 text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{customer.city}, {customer.country}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-sm">
                      {customer.totalBookings}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-medium text-green-500">{customer.totalSpent}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs ${
                      customer.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
                    }`}>
                      {customer.status === 'active' ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
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
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
          <span>عرض {filteredCustomers.length} من {customers.length} عميل</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-border rounded hover:bg-accent">السابق</button>
            <button className="px-3 py-1 bg-primary text-primary-foreground rounded">1</button>
            <button className="px-3 py-1 border border-border rounded hover:bg-accent">2</button>
            <button className="px-3 py-1 border border-border rounded hover:bg-accent">التالي</button>
          </div>
        </div>
      </div>
    </div>
  );
}
