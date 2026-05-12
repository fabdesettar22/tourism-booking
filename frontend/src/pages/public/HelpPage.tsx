import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { InfoPageLayout } from '../../components/layout/InfoPageLayout';

const CONTENT = {
  ar: {
    eyebrow: 'مركز المساعدة',
    title: 'كيف يمكننا مساعدتك؟',
    subtitle: 'إجابات سريعة على الأسئلة الشائعة. لم تجد ما تبحث عنه؟ تواصل معنا مباشرة.',
    faqs: [
      { q: 'كيف أحجز عبر MyBridge؟', a: 'تصفّح الفنادق أو الخدمات، اختر التواريخ والغرف، ثم تابع لإكمال الدفع. ستصلك رسالة تأكيد فورية على بريدك الإلكتروني.' },
      { q: 'هل يمكنني إلغاء الحجز؟', a: 'نعم — تختلف سياسة الإلغاء حسب الفندق أو الخدمة. تظهر السياسة بوضوح أثناء الحجز وقبل تأكيد الدفع.' },
      { q: 'ما طرق الدفع المتاحة؟', a: 'نقبل البطاقات الائتمانية الرئيسية (Visa / Mastercard) والتحويل البنكي المحلي في ماليزيا. سنضيف وسائل دفع إقليمية إضافية قريباً.' },
      { q: 'كيف أصبح وكالة شريكة؟', a: 'سجّل وكالتك من صفحة "انضم كوكالة" — يراجع فريقنا الطلب خلال 48 ساعة عمل ويتواصل معك لإتمام التفعيل.' },
      { q: 'كيف أدرج فندقي أو خدمتي؟', a: 'املأ نموذج التسجيل المخصّص (فندق / مطعم / دليل / نقل / نشاط / صحة) ثم أرفق الصور والوصف. يتم النشر بعد المراجعة.' },
      { q: 'كم تستغرق المراجعة؟', a: 'عادةً 24–48 ساعة عمل. قد تطول قليلاً إن احتجنا توثيقاً إضافياً (رخصة MOTAC، SSM، إلخ).' },
      { q: 'كيف أتواصل مع الدعم؟', a: 'عبر contact@mybridge.my أو واتساب +60 17-421 2823. الردّ خلال 24 ساعة عمل.' },
    ],
  },
  en: {
    eyebrow: 'Help Center',
    title: 'How can we help you?',
    subtitle: 'Quick answers to the most common questions. Cannot find what you are looking for? Reach out directly.',
    faqs: [
      { q: 'How do I book through MyBridge?', a: 'Browse hotels or services, select your dates and rooms, then proceed to checkout. You receive an instant confirmation email.' },
      { q: 'Can I cancel a booking?', a: 'Yes — the cancellation policy varies by hotel or service and is clearly shown during booking and before payment confirmation.' },
      { q: 'Which payment methods are accepted?', a: 'We accept major credit cards (Visa / Mastercard) and Malaysian local bank transfer. Additional regional payment methods are coming soon.' },
      { q: 'How do I become a partner agency?', a: 'Register your agency from the "Join as Agency" page — our team reviews the request within 48 business hours and reaches out to complete activation.' },
      { q: 'How do I list my hotel or service?', a: 'Fill the dedicated registration form (hotel / restaurant / guide / transport / activity / wellness), upload photos and description. Listing goes live after review.' },
      { q: 'How long does review take?', a: 'Usually 24–48 business hours. It may take longer if we need additional documentation (MOTAC license, SSM, etc.).' },
      { q: 'How can I contact support?', a: 'Email contact@mybridge.my or WhatsApp +60 17-421 2823. We respond within 24 business hours.' },
    ],
  },
  ms: {
    eyebrow: 'Pusat Bantuan',
    title: 'Bagaimana kami boleh membantu?',
    subtitle: 'Jawapan pantas kepada soalan lazim. Tidak menemui yang anda cari? Hubungi kami terus.',
    faqs: [
      { q: 'Bagaimana saya tempah melalui MyBridge?', a: 'Layari hotel atau perkhidmatan, pilih tarikh dan bilik, kemudian teruskan ke pembayaran. Anda akan menerima e-mel pengesahan segera.' },
      { q: 'Bolehkah saya batalkan tempahan?', a: 'Ya — polisi pembatalan berbeza mengikut hotel atau perkhidmatan dan dipaparkan dengan jelas semasa tempahan dan sebelum pengesahan bayaran.' },
      { q: 'Apakah kaedah pembayaran yang diterima?', a: 'Kami menerima kad kredit utama (Visa / Mastercard) dan pemindahan bank tempatan Malaysia. Kaedah pembayaran serantau lain akan ditambah tidak lama lagi.' },
      { q: 'Bagaimana saya menjadi agensi rakan kongsi?', a: 'Daftar agensi anda dari halaman "Sertai sebagai Agensi" — pasukan kami menyemak permohonan dalam 48 jam bekerja dan menghubungi anda untuk pengaktifan.' },
      { q: 'Bagaimana saya senaraikan hotel atau perkhidmatan saya?', a: 'Isi borang pendaftaran khusus (hotel / restoran / pemandu / pengangkutan / aktiviti / kesihatan), muat naik gambar dan keterangan. Tersenarai selepas semakan.' },
      { q: 'Berapa lama semakan mengambil masa?', a: 'Biasanya 24–48 jam bekerja. Mungkin lebih lama jika kami memerlukan dokumentasi tambahan (lesen MOTAC, SSM, dll.).' },
      { q: 'Bagaimana saya hubungi sokongan?', a: 'E-mel contact@mybridge.my atau WhatsApp +60 17-421 2823. Kami membalas dalam 24 jam bekerja.' },
    ],
  },
};

export function HelpPage() {
  const { lang } = useLanguage();
  const c = CONTENT[lang as 'ar' | 'en' | 'ms'] ?? CONTENT.en;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <InfoPageLayout eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle}>
      {c.faqs.map((f, i) => (
        <div key={i} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 text-start py-2 group"
          >
            <span className="text-base md:text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition">{f.q}</span>
            <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && <p className="text-gray-600 leading-relaxed mt-2">{f.a}</p>}
        </div>
      ))}
    </InfoPageLayout>
  );
}
