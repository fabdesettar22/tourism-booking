import { useLanguage } from '../../hooks/useLanguage';

const STATUS_KEY = {
  CONFIRMED: 'confirmed',
  PENDING:   'pending',
  CANCELLED: 'cancelled',
} as const;

const STATUS_LABEL: Record<'ar'|'en'|'ms', Record<string, string>> = {
  ar: { confirmed: 'مؤكد',     pending: 'قيد المراجعة', cancelled: 'ملغي' },
  en: { confirmed: 'Confirmed', pending: 'Under Review', cancelled: 'Cancelled' },
  ms: { confirmed: 'Disahkan',  pending: 'Dalam Semakan', cancelled: 'Dibatalkan' },
};

const CUSTOMERS: Record<'ar'|'en'|'ms', string[]> = {
  ar: ['سارة أحمد', 'محمد علي', 'فاطمة حسن', 'أحمد خالد', 'نورة سعيد', 'يوسف محمود'],
  en: ['Sarah Ahmed', 'Mohamed Ali', 'Fatima Hassan', 'Ahmed Khaled', 'Noura Saeed', 'Youssef Mahmoud'],
  ms: ['Sarah Ahmed', 'Mohamed Ali', 'Fatima Hassan', 'Ahmed Khaled', 'Noura Saeed', 'Youssef Mahmoud'],
};

const DESTS: Record<'ar'|'en'|'ms', string[]> = {
  ar: ['دبي', 'باريس', 'مالديف', 'إسطنبول', 'بالي', 'لندن'],
  en: ['Dubai', 'Paris', 'Maldives', 'Istanbul', 'Bali', 'London'],
  ms: ['Dubai', 'Paris', 'Maldives', 'Istanbul', 'Bali', 'London'],
};

export function BookingsTable() {
  const { t, lang, isRTL } = useLanguage();
  const customers = CUSTOMERS[lang] || CUSTOMERS.en;
  const dests     = DESTS[lang] || DESTS.en;
  const statuses  = STATUS_LABEL[lang] || STATUS_LABEL.en;

  const bookings = [
    { id: 'BK001', customer: customers[0], destination: dests[0], date: '2026-04-15', statusKey: STATUS_KEY.CONFIRMED, amount: '$1,250' },
    { id: 'BK002', customer: customers[1], destination: dests[1], date: '2026-04-18', statusKey: STATUS_KEY.PENDING,   amount: '$2,800' },
    { id: 'BK003', customer: customers[2], destination: dests[2], date: '2026-04-20', statusKey: STATUS_KEY.CONFIRMED, amount: '$3,500' },
    { id: 'BK004', customer: customers[3], destination: dests[3], date: '2026-04-22', statusKey: STATUS_KEY.CANCELLED, amount: '$980'  },
    { id: 'BK005', customer: customers[4], destination: dests[4], date: '2026-04-25', statusKey: STATUS_KEY.CONFIRMED, amount: '$2,100' },
    { id: 'BK006', customer: customers[5], destination: dests[5], date: '2026-04-28', statusKey: STATUS_KEY.PENDING,   amount: '$1,750' },
  ];

  const getStatusColor = (key: string) => {
    if (key === STATUS_KEY.CONFIRMED) return 'bg-green-100 text-green-700';
    if (key === STATUS_KEY.PENDING)   return 'bg-yellow-100 text-yellow-700';
    if (key === STATUS_KEY.CANCELLED) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  const align = isRTL ? 'text-right' : 'text-left';

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3>{t('bookingsTable.title')}</h3>
        <button className="px-4 py-2 text-sm text-primary hover:bg-accent rounded-lg transition-colors">
          {t('bookingsTable.viewAll')}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
          <thead>
            <tr className="border-b border-border">
              <th className={`${align} py-3 px-4 text-sm text-muted-foreground`}>{t('bookingsTable.bookingId')}</th>
              <th className={`${align} py-3 px-4 text-sm text-muted-foreground`}>{t('bookingsTable.customer')}</th>
              <th className={`${align} py-3 px-4 text-sm text-muted-foreground`}>{t('bookingsTable.destination')}</th>
              <th className={`${align} py-3 px-4 text-sm text-muted-foreground`}>{t('bookingsTable.date')}</th>
              <th className={`${align} py-3 px-4 text-sm text-muted-foreground`}>{t('bookingsTable.status')}</th>
              <th className={`${align} py-3 px-4 text-sm text-muted-foreground`}>{t('bookingsTable.amount')}</th>
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
                  <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(booking.statusKey)}`}>
                    {statuses[booking.statusKey]}
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
