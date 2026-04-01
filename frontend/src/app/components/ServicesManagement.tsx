import { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Briefcase, Car, Camera, UtensilsCrossed, Shield, Wifi } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  category: 'transport' | 'tours' | 'food' | 'insurance' | 'other';
  description: string;
  price: string;
  provider: string;
  bookings: number;
  rating: number;
  available: boolean;
  status: 'active' | 'inactive';
}

export function ServicesManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'transport' | 'tours' | 'food' | 'insurance' | 'other'>('all');

  const services: Service[] = [
    {
      id: 'SV-001',
      name: 'خدمة النقل من المطار',
      category: 'transport',
      description: 'خدمة نقل فاخرة من وإلى المطار مع سائق محترف',
      price: '$50',
      provider: 'شركة النقل الذهبي',
      bookings: 456,
      rating: 4.8,
      available: true,
      status: 'active',
    },
    {
      id: 'SV-002',
      name: 'تأجير سيارة فاخرة',
      category: 'transport',
      description: 'تأجير سيارات فاخرة بسائق أو بدون سائق',
      price: '$120/يوم',
      provider: 'شركة تأجير السيارات الممتازة',
      bookings: 287,
      rating: 4.6,
      available: true,
      status: 'active',
    },
    {
      id: 'SV-003',
      name: 'جولة سياحية في المدينة',
      category: 'tours',
      description: 'جولة شاملة لأهم معالم المدينة مع مرشد سياحي',
      price: '$80',
      provider: 'وكالة الجولات السياحية',
      bookings: 678,
      rating: 4.9,
      available: true,
      status: 'active',
    },
    {
      id: 'SV-004',
      name: 'جولة صحراوية',
      category: 'tours',
      description: 'مغامرة صحراوية مع عشاء تقليدي تحت النجوم',
      price: '$150',
      provider: 'مغامرات الصحراء',
      bookings: 234,
      rating: 4.7,
      available: true,
      status: 'active',
    },
    {
      id: 'SV-005',
      name: 'تأمين السفر الشامل',
      category: 'insurance',
      description: 'تأمين شامل يغطي جميع حالات الطوارئ أثناء السفر',
      price: '$45',
      provider: 'شركة التأمين العالمية',
      bookings: 892,
      rating: 4.5,
      available: true,
      status: 'active',
    },
    {
      id: 'SV-006',
      name: 'تأمين الرحلات الجوية',
      category: 'insurance',
      description: 'تأمين ضد إلغاء أو تأخير الرحلات الجوية',
      price: '$25',
      provider: 'شركة التأمين العالمية',
      bookings: 567,
      rating: 4.4,
      available: true,
      status: 'active',
    },
    {
      id: 'SV-007',
      name: 'عشاء فاخر في مطعم محلي',
      category: 'food',
      description: 'تجربة طعام فاخرة في أفضل المطاعم المحلية',
      price: '$90',
      provider: 'شبكة المطاعم الفاخرة',
      bookings: 345,
      rating: 4.8,
      available: true,
      status: 'active',
    },
    {
      id: 'SV-008',
      name: 'جولة طعام الشارع',
      category: 'food',
      description: 'اكتشف أشهى الأطعمة المحلية مع مرشد محلي',
      price: '$40',
      provider: 'جولات الطعام المحلية',
      bookings: 423,
      rating: 4.6,
      available: true,
      status: 'active',
    },
    {
      id: 'SV-009',
      name: 'جلسة تصوير احترافية',
      category: 'other',
      description: 'جلسة تصوير احترافية في أجمل المواقع السياحية',
      price: '$200',
      provider: 'استوديو التصوير الاحترافي',
      bookings: 156,
      rating: 4.9,
      available: true,
      status: 'active',
    },
    {
      id: 'SV-010',
      name: 'واي فاي محمول',
      category: 'other',
      description: 'جهاز واي فاي محمول لاستخدام الإنترنت في أي مكان',
      price: '$10/يوم',
      provider: 'شركة الاتصالات',
      bookings: 734,
      rating: 4.3,
      available: false,
      status: 'inactive',
    },
  ];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.includes(searchQuery) ||
                         service.description.includes(searchQuery) ||
                         service.id.includes(searchQuery);
    const matchesCategory = filterCategory === 'all' || service.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryLabels = {
    transport: 'مواصلات',
    tours: 'جولات',
    food: 'طعام',
    insurance: 'تأمين',
    other: 'أخرى',
  };

  const categoryIcons: { [key: string]: any } = {
    transport: Car,
    tours: Camera,
    food: UtensilsCrossed,
    insurance: Shield,
    other: Briefcase,
  };

  const stats = [
    { label: 'إجمالي الخدمات', value: services.length, color: 'bg-blue-500' },
    { label: 'خدمات نشطة', value: services.filter(s => s.status === 'active').length, color: 'bg-green-500' },
    { label: 'إجمالي الحجوزات', value: services.reduce((sum, s) => sum + s.bookings, 0), color: 'bg-purple-500' },
    { label: 'خدمات متاحة', value: services.filter(s => s.available).length, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-1">إدارة الخدمات</h2>
          <p className="text-muted-foreground">عرض وإدارة الخدمات الإضافية المتاحة</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-5 h-5" />
          <span>إضافة خدمة</span>
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
                placeholder="ابحث عن خدمة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-background border border-border'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilterCategory('transport')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterCategory === 'transport' ? 'bg-primary text-primary-foreground' : 'bg-background border border-border'
                }`}
              >
                مواصلات
              </button>
              <button
                onClick={() => setFilterCategory('tours')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterCategory === 'tours' ? 'bg-primary text-primary-foreground' : 'bg-background border border-border'
                }`}
              >
                جولات
              </button>
              <button
                onClick={() => setFilterCategory('food')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterCategory === 'food' ? 'bg-primary text-primary-foreground' : 'bg-background border border-border'
                }`}
              >
                طعام
              </button>
              <button
                onClick={() => setFilterCategory('insurance')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterCategory === 'insurance' ? 'bg-primary text-primary-foreground' : 'bg-background border border-border'
                }`}
              >
                تأمين
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {filteredServices.map((service) => {
            const CategoryIcon = categoryIcons[service.category];
            return (
              <div key={service.id} className="bg-background border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <CategoryIcon className="w-12 h-12 text-primary/40" />
                  <span className="absolute top-3 right-3 px-3 py-1 bg-accent rounded-full text-xs">
                    {categoryLabels[service.category]}
                  </span>
                  <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs ${
                    service.available ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                  }`}>
                    {service.available ? 'متاح' : 'غير متاح'}
                  </span>
                </div>

                <div className="p-6">
                  <div className="mb-3">
                    <h3 className="font-medium mb-1">{service.name}</h3>
                    <p className="text-xs text-muted-foreground">{service.provider}</p>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {service.description}
                  </p>

                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">التقييم:</span>
                      <span className="text-sm font-medium">⭐ {service.rating}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-sm text-muted-foreground">{service.bookings} حجز</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-muted-foreground text-sm">السعر</span>
                    <span className="text-xl font-bold text-primary">{service.price}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">عرض</span>
                    </button>
                    <button className="p-2 bg-accent rounded-lg hover:bg-accent/80 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
