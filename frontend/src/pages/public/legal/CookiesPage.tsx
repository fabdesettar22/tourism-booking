import { useLanguage } from '../../../hooks/useLanguage';
import { LegalLayout } from './LegalLayout';

const CONTENT = {
  ar: {
    title: 'سياسة ملفات الارتباط (Cookies)',
    sections: [
      { h: '1. ما هي ملفات الارتباط؟', p: 'ملفات الارتباط هي ملفات نصية صغيرة يحفظها متصفّحك على جهازك عند زيارتك لموقع ما. تساعدنا في تذكّر تفضيلاتك وتحسين أدائك على المنصة.' },
      { h: '2. أنواع الملفات التي نستخدمها', p: 'ملفات ضرورية: لتشغيل المنصة (تسجيل الدخول، عربة الحجز، اللغة، CSRF). ملفات تفضيلية: تحفظ اللغة والعملة وإعدادات العرض. ملفات تحليلية: لقياس الأداء (Google Analytics، Plausible) بشكل مجمّع. ملفات تسويقية: لعرض إعلانات ملائمة عبر شركاء (تُفعَّل بموافقتك فقط).' },
      { h: '3. أمثلة على الملفات', p: 'session_id (ضروري — انتهاء الجلسة)، lang (تفضيلي — سنة)، _ga (تحليلي — سنتان)، sidebar_state (تفضيلي — أسبوع).' },
      { h: '4. ملفات الارتباط من أطراف ثالثة', p: 'قد تُضبط بعض الملفات من قِبل خدمات نستخدمها مثل Google Analytics وStripe وحلول الخرائط. لا نتحكّم مباشرةً في هذه الملفات وتخضع لسياسات تلك الأطراف.' },
      { h: '5. كيف تتحكّم بملفات الارتباط؟', p: 'يمكنك قبول أو رفض الملفات غير الضرورية من شريط الموافقة عند زيارتك الأولى. يمكنك أيضاً إدارتها من إعدادات متصفحك (Chrome / Safari / Firefox / Edge) — لكن تعطيل الملفات الضرورية قد يمنع المنصة من العمل بشكل صحيح.' },
      { h: '6. مدة التخزين', p: 'ملفات الجلسة تُحذف عند إغلاق المتصفح. الملفات الدائمة تنتهي حسب المدة المحدّدة لكل ملف (من ساعة إلى سنتين كحدّ أقصى).' },
      { h: '7. التحديثات', p: 'قد نُحدّث هذه السياسة لمواكبة التغييرات التقنية أو القانونية. سيظهر تاريخ آخر تحديث أعلى الصفحة.' },
      { h: '8. التواصل', p: 'لأي استفسار حول استخدامنا لملفات الارتباط: privacy@mybridge.my' },
    ],
  },
  en: {
    title: 'Cookies Policy',
    sections: [
      { h: '1. What are cookies?', p: 'Cookies are small text files your browser stores on your device when you visit a website. They help us remember your preferences and improve your experience on the platform.' },
      { h: '2. Types of cookies we use', p: 'Essential cookies: required to operate the platform (login, booking cart, language, CSRF). Preference cookies: store language, currency and display settings. Analytics cookies: measure performance (Google Analytics, Plausible) in aggregate. Marketing cookies: deliver relevant ads through partners (set only with your consent).' },
      { h: '3. Examples of cookies', p: 'session_id (essential — session lifetime), lang (preference — 1 year), _ga (analytics — 2 years), sidebar_state (preference — 1 week).' },
      { h: '4. Third-party cookies', p: 'Some cookies are set by services we integrate, such as Google Analytics, Stripe and mapping providers. We do not directly control these and they are governed by their own policies.' },
      { h: '5. How to control cookies', p: 'You can accept or reject non-essential cookies from the consent banner on your first visit. You can also manage them from your browser settings (Chrome / Safari / Firefox / Edge) — disabling essential cookies may prevent the platform from working properly.' },
      { h: '6. Storage duration', p: 'Session cookies are deleted when you close the browser. Persistent cookies expire based on the duration set for each cookie (from one hour up to a maximum of two years).' },
      { h: '7. Updates', p: 'We may update this Policy to reflect technical or legal changes. The latest update date appears at the top of the page.' },
      { h: '8. Contact', p: 'For any question about our use of cookies: privacy@mybridge.my' },
    ],
  },
  ms: {
    title: 'Dasar Kuki',
    sections: [
      { h: '1. Apakah kuki?', p: 'Kuki adalah fail teks kecil yang disimpan oleh pelayar anda pada peranti apabila anda melawat sesuatu laman web. Ia membantu kami mengingati pilihan anda dan menambah baik pengalaman anda di platform.' },
      { h: '2. Jenis kuki yang digunakan', p: 'Kuki penting: diperlukan untuk mengendali platform (log masuk, troli tempahan, bahasa, CSRF). Kuki pilihan: menyimpan bahasa, mata wang dan tetapan paparan. Kuki analitik: mengukur prestasi (Google Analytics, Plausible) secara agregat. Kuki pemasaran: memaparkan iklan berkaitan melalui rakan kongsi (hanya dengan persetujuan anda).' },
      { h: '3. Contoh kuki', p: 'session_id (penting — sepanjang sesi), lang (pilihan — 1 tahun), _ga (analitik — 2 tahun), sidebar_state (pilihan — 1 minggu).' },
      { h: '4. Kuki pihak ketiga', p: 'Sebahagian kuki ditetapkan oleh perkhidmatan yang kami integrasikan seperti Google Analytics, Stripe dan penyedia peta. Kami tidak mengawalnya secara langsung dan ia tertakluk kepada dasar masing-masing.' },
      { h: '5. Cara mengawal kuki', p: 'Anda boleh menerima atau menolak kuki bukan penting dari sepanduk persetujuan pada lawatan pertama. Anda juga boleh menguruskannya dari tetapan pelayar (Chrome / Safari / Firefox / Edge) — melumpuhkan kuki penting boleh menghalang platform daripada berfungsi dengan betul.' },
      { h: '6. Tempoh penyimpanan', p: 'Kuki sesi dipadamkan apabila anda menutup pelayar. Kuki berterusan tamat tempoh mengikut tempoh yang ditetapkan untuk setiap kuki (dari satu jam hingga maksimum dua tahun).' },
      { h: '7. Kemaskini', p: 'Kami mungkin mengemaskini Dasar ini untuk mencerminkan perubahan teknikal atau undang-undang. Tarikh kemaskini terkini dipaparkan di bahagian atas halaman.' },
      { h: '8. Hubungan', p: 'Untuk sebarang pertanyaan mengenai penggunaan kuki kami: privacy@mybridge.my' },
    ],
  },
};

export function CookiesPage() {
  const { lang } = useLanguage();
  const c = CONTENT[lang as 'ar' | 'en' | 'ms'] ?? CONTENT.en;
  return (
    <LegalLayout title={c.title} lastUpdated="2026-05-03">
      {c.sections.map((s) => (
        <section key={s.h}>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{s.h}</h2>
          <p>{s.p}</p>
        </section>
      ))}
    </LegalLayout>
  );
}
