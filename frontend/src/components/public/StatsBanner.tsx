import { Users, MapPin, Building, Handshake } from 'lucide-react';
import type { Language } from '../../i18n';

interface Props {
  lang: Language;
  isRTL: boolean;
  customers: number;
  destinations: number;
  suppliers: number;
  partners: number;
}

export function StatsBanner({ lang, isRTL, customers, destinations, suppliers, partners }: Props) {
  const T = {
    customers:    lang === 'ar' ? 'عميل سعيد'      : lang === 'ms' ? 'Pelanggan Gembira' : 'Happy Customers',
    destinations: lang === 'ar' ? 'وجهة'             : lang === 'ms' ? 'Destinasi'         : 'Destinations',
    suppliers:    lang === 'ar' ? 'مورد معتمد'       : lang === 'ms' ? 'Pembekal Disahkan' : 'Verified Suppliers',
    partners:     lang === 'ar' ? 'وكالة شريكة'      : lang === 'ms' ? 'Agensi Rakan'      : 'Partner Agencies',
  };

  const items = [
    { icon: Users,     value: customers,    label: T.customers,    plus: true },
    { icon: MapPin,    value: destinations, label: T.destinations, plus: true },
    { icon: Building,  value: suppliers,    label: T.suppliers,    plus: true },
    { icon: Handshake, value: partners,     label: T.partners,     plus: true },
  ];

  const fmtNumber = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
    return n.toString();
  };

  return (
    <section className="bg-gradient-to-br from-[#FF6B35] to-[#e07a38] py-5" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-4 gap-3">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center justify-center gap-2.5 text-white">
                <div className="w-8 h-8 bg-white/15 backdrop-blur-sm rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="leading-tight">
                  <div className="text-base sm:text-lg font-bold tracking-tight">
                    {fmtNumber(item.value)}{item.plus && '+'}
                  </div>
                  <div className="text-[10px] sm:text-xs text-white/80">{item.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
