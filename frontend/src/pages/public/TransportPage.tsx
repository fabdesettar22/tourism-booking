import { Link } from 'react-router-dom';
import { Car, Plane, MapPin, Clock } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { InfoPageLayout } from '../../components/layout/InfoPageLayout';

const CONTENT = {
  ar: {
    eyebrow: 'النقل',
    title: 'تنقّل بسلاسة من اللحظة التي تصل فيها',
    subtitle: 'استقبال مطار، جولات بالساعة، رحلات بين المدن، أو سيارة مع سائق ليوم كامل — احجز ما يناسب رحلتك.',
    items: [
      { icon: Plane, h: 'استقبال المطار', p: 'سائق ينتظرك في الصالة باسمك، وينقلك إلى فندقك مباشرة. سيارات نظيفة، أسعار ثابتة بدون مفاجآت.' },
      { icon: Clock, h: 'تأجير بالساعة', p: 'سيارة مع سائق محترف لساعات مرنة — مثالي للتسوّق أو الاجتماعات أو زيارات قصيرة.' },
      { icon: MapPin, h: 'رحلات بين المدن', p: 'انتقالات مريحة بين المدن الماليزية الكبرى — KL، Penang، Johor، Langkawi.' },
      { icon: Car, h: 'يوم كامل', p: 'سائق وسيارة لـ 8–10 ساعات. صمّم مسارك بحرّية واستكشف على راحتك.' },
    ],
    cta: { h: 'هل أنت موفّر خدمة نقل؟', p: 'انضمّ إلى MyBridge وقدّم خدماتك لمسافرين من حول العالم.', btn: 'سجّل الآن' },
  },
  en: {
    eyebrow: 'Transport',
    title: 'Move smoothly from the moment you arrive',
    subtitle: 'Airport pickup, hourly tours, intercity rides, or a car with driver for a full day — book what fits your trip.',
    items: [
      { icon: Plane, h: 'Airport pickup', p: 'A driver waiting in the arrivals hall with your name, taking you directly to your hotel. Clean cars, fixed prices, no surprises.' },
      { icon: Clock, h: 'Hourly rental', p: 'A car with a professional driver for flexible hours — perfect for shopping, meetings or short visits.' },
      { icon: MapPin, h: 'Intercity rides', p: 'Comfortable transfers between Malaysia\'s major cities — KL, Penang, Johor, Langkawi.' },
      { icon: Car, h: 'Full day', p: 'A driver and car for 8–10 hours. Design your route freely and explore at your own pace.' },
    ],
    cta: { h: 'Are you a transport provider?', p: 'Join MyBridge and offer your services to travelers from around the world.', btn: 'Register now' },
  },
  ms: {
    eyebrow: 'Pengangkutan',
    title: 'Bergerak dengan lancar dari saat anda tiba',
    subtitle: 'Penjemputan lapangan terbang, lawatan ikut jam, perjalanan antara bandar, atau kereta dengan pemandu sepanjang hari.',
    items: [
      { icon: Plane, h: 'Penjemputan lapangan terbang', p: 'Pemandu menunggu di dewan ketibaan dengan nama anda, membawa terus ke hotel. Kereta bersih, harga tetap.' },
      { icon: Clock, h: 'Sewa ikut jam', p: 'Kereta dengan pemandu profesional untuk waktu fleksibel — sesuai untuk membeli-belah, mesyuarat atau lawatan singkat.' },
      { icon: MapPin, h: 'Perjalanan antara bandar', p: 'Pemindahan selesa antara bandar utama Malaysia — KL, Pulau Pinang, Johor, Langkawi.' },
      { icon: Car, h: 'Sehari penuh', p: 'Pemandu dan kereta untuk 8–10 jam. Reka laluan anda sendiri dan terokai mengikut rentak anda.' },
    ],
    cta: { h: 'Anda penyedia pengangkutan?', p: 'Sertai MyBridge dan tawarkan perkhidmatan kepada pengembara dari seluruh dunia.', btn: 'Daftar sekarang' },
  },
};

export function TransportPage() {
  const { lang } = useLanguage();
  const c = CONTENT[lang as 'ar' | 'en' | 'ms'] ?? CONTENT.en;

  return (
    <InfoPageLayout eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle}>
      <div className="grid sm:grid-cols-2 gap-6">
        {c.items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="p-5 rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-sm transition">
              <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3"><Icon className="w-5 h-5" /></div>
              <h3 className="text-base font-semibold text-gray-900 mb-1.5">{item.h}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.p}</p>
            </div>
          );
        })}
      </div>
      <section className="border-t border-gray-100 pt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{c.cta.h}</h2>
        <p className="text-gray-600 mb-5">{c.cta.p}</p>
        <Link to="/waitlist/transport" className="inline-flex items-center px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition shadow-sm">{c.cta.btn}</Link>
      </section>
    </InfoPageLayout>
  );
}
