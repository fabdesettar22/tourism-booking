import { MapPin } from 'lucide-react';

export function PopularDestinations() {
  const destinations = [
    { name: 'دبي', country: 'الإمارات', bookings: 245, trend: '+12%' },
    { name: 'باريس', country: 'فرنسا', bookings: 198, trend: '+8%' },
    { name: 'مالديف', country: 'المالديف', bookings: 167, trend: '+15%' },
    { name: 'إسطنبول', country: 'تركيا', bookings: 143, trend: '+6%' },
    { name: 'بالي', country: 'إندونيسيا', bookings: 128, trend: '+10%' },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="mb-6">
        <h3 className="mb-1">الوجهات الأكثر شعبية</h3>
        <p className="text-sm text-muted-foreground">هذا الشهر</p>
      </div>

      <div className="space-y-4">
        {destinations.map((destination, index) => (
          <div key={destination.name} className="flex items-center gap-4 p-3 hover:bg-accent rounded-lg transition-colors">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="mb-0.5">{destination.name}</p>
              <p className="text-sm text-muted-foreground">{destination.country}</p>
            </div>
            <div className="text-left">
              <p className="mb-0.5">{destination.bookings}</p>
              <p className="text-sm text-green-600">{destination.trend}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
