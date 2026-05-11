import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';

type PublicRoute = {
  id: string;
  origin_iata: string;
  destination_iata: string;
  departure_date: string;
  return_date: string | null;
  adults: number;
  children: number;
  cabin_class: string;
  title: string;
  cheapest_price: string | null;
  currency: string;
};

type PublicOffer = {
  id: string;
  owner_iata: string;
  owner_name: string;
  price: string;
  currency: string;
  total_duration_min: number;
  slices_summary: Array<{ stops: number; origin: string; destination: string; departing_at: string; arriving_at: string }>;
};

export function FlightsPage() {
  const { lang } = useLanguage();
  const rtl = lang === 'ar';
  const [routes, setRoutes] = useState<PublicRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PublicRoute | null>(null);
  const [offers, setOffers] = useState<PublicOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [booking, setBooking] = useState<PublicOffer | null>(null);

  const t = {
    ar: { title: 'تذاكر الطيران', subtitle: 'اكتشف أفضل أسعار الرحلات', startingFrom: 'يبدأ من', noRoutes: 'لا توجد رحلات متاحة حالياً', viewOffers: 'عرض العروض', back: '← رجوع', loading: 'جارٍ التحميل...', stops: 'توقفات', direct: 'مباشر', book: 'احجز', noOffers: 'لا عروض متاحة', from: 'من', to: 'إلى', departure: 'المغادرة' },
    en: { title: 'Flight Tickets', subtitle: 'Find the best flight prices', startingFrom: 'From', noRoutes: 'No flights available right now', viewOffers: 'View offers', back: '← Back', loading: 'Loading…', stops: 'stops', direct: 'Direct', book: 'Book', noOffers: 'No offers available', from: 'From', to: 'To', departure: 'Departure' },
    ms: { title: 'Tiket Penerbangan', subtitle: 'Cari harga penerbangan terbaik', startingFrom: 'Dari', noRoutes: 'Tiada penerbangan tersedia sekarang', viewOffers: 'Lihat tawaran', back: '← Kembali', loading: 'Memuatkan…', stops: 'persinggahan', direct: 'Terus', book: 'Tempah', noOffers: 'Tiada tawaran', from: 'Dari', to: 'Ke', departure: 'Berlepas' },
  }[lang];

  useEffect(() => {
    fetch('/api/v1/flights/public/routes/')
      .then(r => r.json())
      .then(d => setRoutes(Array.isArray(d) ? d : d.results || []))
      .finally(() => setLoading(false));
  }, []);

  const openRoute = async (r: PublicRoute) => {
    setSelected(r); setLoadingOffers(true); setOffers([]);
    const res = await fetch(`/api/v1/flights/public/routes/${r.id}/offers/`);
    if (res.ok) setOffers(await res.json());
    setLoadingOffers(false);
  };

  if (selected) {
    return (
      <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto p-6">
          <button onClick={() => { setSelected(null); setOffers([]); }} className="text-[#FF6B35] font-semibold mb-4">{t.back}</button>
          <h1 className="text-3xl font-bold mb-2">{selected.title}</h1>
          <p className="text-gray-600 mb-6">{t.departure}: {selected.departure_date}{selected.return_date ? ` ↔ ${selected.return_date}` : ''} · {selected.cabin_class}</p>

          {loadingOffers ? (
            <div className="text-center text-gray-400 py-12">{t.loading}</div>
          ) : offers.length === 0 ? (
            <div className="text-center text-gray-500 py-12">{t.noOffers}</div>
          ) : (
            <div className="space-y-3">
              {offers.map(o => (
                <div key={o.id} className="bg-white rounded-xl border p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-lg">{o.owner_name || o.owner_iata}</div>
                    <div className="text-sm text-gray-600">
                      {o.slices_summary?.[0]?.stops === 0 ? t.direct : `${o.slices_summary?.[0]?.stops} ${t.stops}`} · {Math.round(o.total_duration_min/60)}h {o.total_duration_min%60}m
                    </div>
                    {o.slices_summary?.[0] && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(o.slices_summary[0].departing_at).toLocaleString()} → {new Date(o.slices_summary[0].arriving_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#FF6B35]">{o.price} {o.currency}</div>
                    <button onClick={() => setBooking(o)} className="mt-2 bg-[#FF6B35] hover:bg-[#e07a38] text-white px-5 py-2 rounded-lg font-semibold">{t.book}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {booking && <BookingModal offer={booking} onClose={() => setBooking(null)} lang={lang} />}
      </div>
    );
  }

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-2">{t.title} ✈️</h1>
        <p className="text-gray-600 mb-8">{t.subtitle}</p>
        {loading ? (
          <div className="text-center text-gray-400 py-12">{t.loading}</div>
        ) : routes.length === 0 ? (
          <div className="text-center text-gray-500 py-16 bg-white rounded-xl border">{t.noRoutes}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {routes.map(r => (
              <button key={r.id} onClick={() => openRoute(r)} className="text-start bg-white border rounded-xl p-6 hover:shadow-lg transition">
                <div className="text-2xl font-bold mb-1">{r.origin_iata} → {r.destination_iata}</div>
                <div className="text-sm text-gray-600 mb-3">{r.departure_date}{r.return_date ? ` ↔ ${r.return_date}` : ''}</div>
                <div className="text-xs uppercase text-gray-500 mb-1">{t.startingFrom}</div>
                <div className="text-2xl font-bold text-[#FF6B35]">
                  {r.cheapest_price ? `${r.cheapest_price} ${r.currency}` : '—'}
                </div>
                <div className="mt-3 inline-block text-[#FF6B35] font-semibold text-sm">{t.viewOffers} →</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingModal({ offer, onClose, lang }: { offer: PublicOffer; onClose: () => void; lang: string }) {
  const rtl = lang === 'ar';
  const [form, setForm] = useState({ customer_name: '', customer_email: '', customer_phone: '', passport_number: '', passenger_count: 1, notes: '' });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const t = {
    ar: { title: 'طلب حجز', name: 'الاسم الكامل', email: 'البريد الإلكتروني', phone: 'الهاتف', passport: 'رقم الجواز', count: 'عدد المسافرين', notes: 'ملاحظات', send: 'إرسال الطلب', cancel: 'إلغاء', success: 'تم استلام طلبك! سنتواصل معك قريباً.', sending: 'جارٍ الإرسال...' },
    en: { title: 'Booking Request', name: 'Full name', email: 'Email', phone: 'Phone', passport: 'Passport number', count: 'Passengers', notes: 'Notes', send: 'Send request', cancel: 'Cancel', success: 'Request received! We will contact you shortly.', sending: 'Sending…' },
    ms: { title: 'Permintaan Tempahan', name: 'Nama penuh', email: 'E-mel', phone: 'Telefon', passport: 'No. pasport', count: 'Penumpang', notes: 'Catatan', send: 'Hantar permintaan', cancel: 'Batal', success: 'Permintaan diterima! Kami akan menghubungi anda.', sending: 'Menghantar…' },
  }[lang as 'ar' | 'en' | 'ms'];

  const submit = async () => {
    setSending(true); setError('');
    try {
      const res = await fetch('/api/v1/flights/booking-requests/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, offer: offer.id }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); setError(JSON.stringify(e)); }
      else setDone(true);
    } finally { setSending(false); }
  };

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-1">{t.title}</h3>
        <p className="text-sm text-gray-600 mb-4">{offer.owner_name} · {offer.price} {offer.currency}</p>
        {done ? (
          <div className="text-center py-6">
            <div className="text-green-600 text-lg font-semibold mb-2">✓</div>
            <p className="text-gray-700">{t.success}</p>
            <button onClick={onClose} className="mt-4 bg-[#FF6B35] text-white px-6 py-2 rounded-lg">OK</button>
          </div>
        ) : (
          <div className="space-y-3">
            <input placeholder={t.name} value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            <input type="email" placeholder={t.email} value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            <input placeholder={t.phone} value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            <input placeholder={t.passport} value={form.passport_number} onChange={e => setForm({ ...form, passport_number: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            <input type="number" min={1} placeholder={t.count} value={form.passenger_count} onChange={e => setForm({ ...form, passenger_count: +e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            <textarea placeholder={t.notes} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border rounded-lg px-3 py-2" />
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg border">{t.cancel}</button>
              <button disabled={sending || !form.customer_name || !form.customer_email || !form.customer_phone} onClick={submit} className="px-5 py-2 rounded-lg bg-[#FF6B35] text-white font-semibold disabled:opacity-50">
                {sending ? t.sending : t.send}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
