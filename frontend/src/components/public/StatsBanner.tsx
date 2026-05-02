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
    <section className="bg-gradient-to-br from-[#FF6B35] to-[#e07a38] py-10" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="text-center text-white">
                <div className="w-12 h-12 mx-auto mb-2 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold tracking-tight">
                  {fmtNumber(item.value)}{item.plus && '+'}
                </div>
                <div className="text-xs sm:text-sm text-white/85 mt-1">{item.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
