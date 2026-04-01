import { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Building, Phone, Mail, MapPin, Star } from 'lucide-react';

interface Agency {
  id: string;
  name: string;
  country: string;
  city: string;
  phone: string;
  email: string;
  rating: number;
  totalBookings: number;
  status: 'active' | 'inactive';
  joinDate: string;
}

export function AgenciesManagement() {
  const [searchQuery, setSearchQuery] = useState('');

  const agencies: Agency[] = [
    { id: 'AG-001', name: 'وكالة السفر الذهبية', country: 'الإمارات', city: 'دبي', phone: '+971 4 123 4567', email: 'info@goldtravel.ae', rating: 4.8, totalBookings: 342, status: 'active', joinDate: '2024-01-15' },
    { id: 'AG-002', name: 'رحلات الشرق', country: 'مصر', city: 'القاهرة', phone: '+20 2 987 6543', email: 'contact@easttrips.eg', rating: 4.5, totalBookings: 287, status: 'active', joinDate: '2024-02-20' },
    { id: 'AG-003', name: 'بوابة السياحة', country: 'السعودية', city: 'الرياض', phone: '+966 11 234 5678', email: 'support@tourismdoor.sa', rating: 4.9, totalBookings: 456, status: 'active', joinDate: '2023-11-10' },
    { id: 'AG-004', name: 'عالم السفر', country: 'تركيا', city: 'اسطنبول', phone: '+90 212 345 6789', email: 'hello@travelworld.tr', rating: 4.3, totalBookings: 198, status: 'active', joinDate: '2024-03-05' },
    { id: 'AG-005', name: 'وكالة الأحلام', country: 'الأردن', city: 'عمان', phone: '+962 6 456 7890', email: 'info@dreamsagency.jo', rating: 4.6, totalBookings: 234, status: 'inactive', joinDate: '2023-09-18' },
    { id: 'AG-006', name: 'السياحة المتميزة', country: 'قطر', city: 'الدوحة', phone: '+974 4 567 8901', email: 'contact@premiumtour.qa', rating: 4.7, totalBookings: 312, status: 'active', joinDate: '2024-01-28' },
  ];

  const filteredAgencies = agencies.filter(agency =>
    agency.name.includes(searchQuery) ||
    agency.country.includes(searchQuery) ||
    agency.city.includes(searchQuery) ||
    agency.id.includes(searchQuery)
  );

  const stats = [
    { label: 'إجمالي الوكالات', value: agencies.length, color: 'bg-blue-500' },
    { label: 'وكالات نشطة', value: agencies.filter(a => a.status === 'active').length, color: 'bg-green-500' },
    { label: 'وكالات غير نشطة', value: agencies.filter(a => a.status === 'inactive').length, color: 'bg-gray-500' },
    { label: 'إجمالي الحجوزات', value: agencies.reduce((sum, a) => sum + a.totalBookings, 0), color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-1">إدارة الوكالات الشريكة</h2>
          <p className="text-muted-foreground">عرض وإدارة الوكالات السياحية الشريكة</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-5 h-5" />
          <span>إضافة وكالة</span>
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
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث عن وكالة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {filteredAgencies.map((agency) => (
            <div key={agency.id} className="bg-background border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm mb-1">{agency.name}</h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      agency.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
                    }`}>
                      {agency.status === 'active' ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{agency.city}, {agency.country}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span dir="ltr" className="text-right w-full">{agency.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="break-all">{agency.email}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium text-sm">{agency.rating}</span>
                </div>
                <span className="text-sm text-muted-foreground">{agency.totalBookings} حجز</span>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">عرض</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-accent rounded-lg hover:bg-accent/80 transition-colors">
                  <Edit className="w-4 h-4" />
                  <span className="text-sm">تعديل</span>
                </button>
                <button className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
