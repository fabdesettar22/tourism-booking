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
    <section className="bg-[#080D30] border-y border-[#F26522]/15 py-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center justify-center gap-3 text-white">
                <div className="w-9 h-9 bg-[#F26522]/12 border border-[#F26522]/25 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#F26522]" />
                </div>
                <div className="leading-tight">
                  <div className="text-lg font-bold tracking-tight text-white">
                    {fmtNumber(item.value)}{item.plus && '+'}
                  </div>
                  <div className="text-[11px] text-gray-400">{item.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
