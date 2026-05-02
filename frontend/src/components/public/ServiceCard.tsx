import { Link } from 'react-router-dom';
import { Star, MapPin, Car, Utensils, MapIcon, Activity, Sparkles, Package } from 'lucide-react';
import type { PublicServiceListItem } from '../../services/publicApi';

interface Props {
  service: PublicServiceListItem;
  lang: 'ar' | 'en' | 'ms';
}

const SERVICE_ICONS: Record<string, typeof Car> = {
  transport: Car,
  meal:      Utensils,
  tour:      MapIcon,
  activity:  Activity,
  other:     Sparkles,
};

const SERVICE_LABELS: Record<string, { ar: string; en: string; ms: string }> = {
  transport: { ar: 'نقل',     en: 'Transport',  ms: 'Pengangkutan' },
  meal:      { ar: 'مطعم',    en: 'Restaurant', ms: 'Restoran' },
  tour:      { ar: 'جولة',    en: 'Tour',       ms: 'Lawatan' },
  activity:  { ar: 'نشاط',    en: 'Activity',   ms: 'Aktiviti' },
  visa:      { ar: 'تأشيرة',  en: 'Visa',       ms: 'Visa' },
  insurance: { ar: 'تأمين',   en: 'Insurance',  ms: 'Insurans' },
  flight:    { ar: 'طيران',   en: 'Flight',     ms: 'Penerbangan' },
  other:     { ar: 'خدمة',    en: 'Service',    ms: 'Perkhidmatan' },
};

export function ServiceCard({ service, lang }: Props) {
  const isRTL = lang === 'ar';
  const Icon = SERVICE_ICONS[service.service_type] || Package;
  const typeLabel = SERVICE_LABELS[service.service_type]?.[lang] || service.service_type;

  // Mock rating + reviews (real backend integration later)
  const rating = (4.5 + (service.id % 5) / 10).toFixed(1);
  const reviews = 50 + (service.id * 7) % 300;

  return (
    <Link
      to={`/services/${service.id}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Image (Klook 4:3 ratio) */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {service.image ? (
          <img
            src={service.image}
            alt={service.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Icon className="w-14 h-14" />
          </div>
        )}

        {/* Top-left badge: category */}
        <div className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} bg-white/95 backdrop-blur-sm text-gray-800 px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-semibold shadow-sm`}>
          <Icon className="w-3.5 h-3.5 text-[#FF6B35]" />
          {typeLabel}
        </div>

        {/* Top-right rating pill (Klook-style) */}
        <div className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs font-bold shadow-sm`}>
          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
          <span className="text-gray-900">{rating}</span>
          <span className="text-gray-500 font-normal">({reviews})</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-[15px] line-clamp-2 leading-snug min-h-[2.5em] group-hover:text-[#FF6B35] transition-colors">
          {service.name}
        </h3>
        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {service.city_name}{service.country_name ? `, ${service.country_name}` : ''}
          </span>
        </div>

      </div>
    </Link>
  );
}
