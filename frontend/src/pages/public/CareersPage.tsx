import { Link } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { InfoPageLayout } from '../../components/layout/InfoPageLayout';

const CONTENT = {
  ar: {
    eyebrow: 'الوظائف',
    title: 'انضم إلى فريق MyBridge',
    subtitle: 'نبني الجسر الرقمي بين شمال إفريقيا وجنوب شرق آسيا — ونبحث عن أشخاص يشاركوننا الطموح.',
    why: { h: 'لماذا نحن؟', items: [
      'مهمّة واضحة: ربط ملايين المسافرين بالخدمات الصحيحة عبر القارّات.',
      'فريق صغير، أثر كبير: قراراتك تظهر في المنتج خلال أيام.',
      'بيئة مرنة: عمل عن بُعد، أوقات مرنة، ثقافة قائمة على الثقة.',
      'تطوير مستمرّ: ميزانية تعلّم سنوية وفرص نموّ حقيقية.',
    ] },
    open: { h: 'الفرص الحالية', empty: 'لا توجد وظائف مفتوحة في الوقت الحالي. أرسل سيرتك الذاتية وسنتواصل معك حين تتوفّر فرصة مناسبة.' },
    cta: { h: 'لم تجد دورك؟', p: 'نحن دائماً منفتحون على المواهب الاستثنائية في الهندسة، التصميم، التشغيل، والشراكات.', btn: 'تواصل معنا' },
  },
  en: {
    eyebrow: 'Careers',
    title: 'Join the MyBridge team',
    subtitle: 'We are building the digital bridge between North Africa and Southeast Asia — and we are looking for people who share the ambition.',
    why: { h: 'Why us?', items: [
      'A clear mission: connecting millions of travelers to the right services across continents.',
      'Small team, big impact: your decisions ship in days, not quarters.',
      'Flexible environment: remote-first, flexible hours, trust-based culture.',
      'Continuous growth: yearly learning budget and real career development.',
    ] },
    open: { h: 'Open positions', empty: 'No open roles right now. Send us your CV and we will reach out when something matches.' },
    cta: { h: 'Do not see your role?', p: 'We are always open to exceptional talent in engineering, design, operations, and partnerships.', btn: 'Get in touch' },
  },
  ms: {
    eyebrow: 'Kerjaya',
    title: 'Sertai pasukan MyBridge',
    subtitle: 'Kami membina jambatan digital antara Afrika Utara dan Asia Tenggara — dan kami mencari orang yang berkongsi cita-cita yang sama.',
    why: { h: 'Mengapa kami?', items: [
      'Misi jelas: menghubungkan jutaan pengembara dengan perkhidmatan yang tepat merentas benua.',
      'Pasukan kecil, impak besar: keputusan anda dilaksana dalam beberapa hari.',
      'Persekitaran fleksibel: kerja jauh, waktu fleksibel, budaya berasaskan kepercayaan.',
      'Pertumbuhan berterusan: bajet pembelajaran tahunan dan peluang pembangunan kerjaya.',
    ] },
    open: { h: 'Jawatan tersedia', empty: 'Tiada jawatan terbuka pada masa ini. Hantar CV anda dan kami akan menghubungi apabila ada padanan.' },
    cta: { h: 'Tidak nampak peranan anda?', p: 'Kami sentiasa terbuka kepada bakat luar biasa dalam kejuruteraan, reka bentuk, operasi, dan perkongsian.', btn: 'Hubungi kami' },
  },
};

export function CareersPage() {
  const { lang } = useLanguage();
  const c = CONTENT[lang as 'ar' | 'en' | 'ms'] ?? CONTENT.en;

  return (
    <InfoPageLayout eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle}>
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{c.why.h}</h2>
        <ul className="space-y-3">
          {c.why.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
              <span className="text-gray-700 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-gray-100 pt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{c.open.h}</h2>
        <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-6 text-gray-700">{c.open.empty}</div>
      </section>

      <section className="border-t border-gray-100 pt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{c.cta.h}</h2>
        <p className="text-gray-600 leading-relaxed mb-5">{c.cta.p}</p>
        <Link to="/contact" className="inline-flex items-center px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition shadow-sm">{c.cta.btn}</Link>
      </section>
    </InfoPageLayout>
  );
}
