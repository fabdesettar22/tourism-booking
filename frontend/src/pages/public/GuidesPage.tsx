import { Link } from 'react-router-dom';
import { Compass, Languages, Award, Heart } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { InfoPageLayout } from '../../components/layout/InfoPageLayout';

const CONTENT = {
  ar: {
    eyebrow: 'دليل سياحي',
    title: 'أدلّة محليّون يصنعون رحلتك',
    subtitle: 'تعرّف على وجهتك من خلال خبراء محليّين مرخّصين — يتحدّثون لغتك، ويعرفون كل تفصيل.',
    items: [
      { icon: Compass, h: 'خبرة محليّة عميقة', p: 'كل دليل ابن المنطقة، يأخذك إلى ما لا يظهر في خرائط السائح العاديّة.' },
      { icon: Languages, h: 'بلغتك', p: 'أدلّة يتحدّثون العربية والإنجليزية والماليزية والفرنسية وغيرها — اختر من يناسبك.' },
      { icon: Award, h: 'مرخّصون رسمياً', p: 'كل دليل على المنصّة موثّق برخصة MOTAC الماليزية أو ما يعادلها في بلده.' },
      { icon: Heart, h: 'تجربة مخصّصة', p: 'نصف يوم، يوم كامل، أو تجارب متخصّصة — ثقافية، طبيعية، طعام، تصوير.' },
    ],
    cta: { h: 'هل أنت دليل سياحي؟', p: 'انضمّ إلى MyBridge ووصِل إلى مسافرين من 3 قارّات.', btn: 'سجّل الآن' },
  },
  en: {
    eyebrow: 'Tour Guide',
    title: 'Local guides who shape your journey',
    subtitle: 'Discover your destination through licensed local experts — they speak your language and know every detail.',
    items: [
      { icon: Compass, h: 'Deep local expertise', p: 'Every guide is a local who takes you beyond the standard tourist map.' },
      { icon: Languages, h: 'In your language', p: 'Guides speak Arabic, English, Malay, French and more — pick the right fit for you.' },
      { icon: Award, h: 'Officially licensed', p: 'Every guide on the platform is verified with a MOTAC license or its equivalent in their country.' },
      { icon: Heart, h: 'Tailored experiences', p: 'Half-day, full-day or themed experiences — cultural, nature, food, photography.' },
    ],
    cta: { h: 'Are you a tour guide?', p: 'Join MyBridge and reach travelers from 3 continents.', btn: 'Register now' },
  },
  ms: {
    eyebrow: 'Pemandu Pelancong',
    title: 'Pemandu tempatan yang membentuk perjalanan anda',
    subtitle: 'Terokai destinasi anda melalui pakar tempatan berlesen — mereka bertutur bahasa anda dan tahu setiap perinci.',
    items: [
      { icon: Compass, h: 'Kepakaran tempatan mendalam', p: 'Setiap pemandu adalah anak tempatan yang membawa anda ke tempat yang tidak ada pada peta pelancong biasa.' },
      { icon: Languages, h: 'Dalam bahasa anda', p: 'Pemandu bertutur Arab, Inggeris, Melayu, Perancis dan lain-lain — pilih yang sesuai untuk anda.' },
      { icon: Award, h: 'Berlesen rasmi', p: 'Setiap pemandu di platform disahkan dengan lesen MOTAC atau setara di negara mereka.' },
      { icon: Heart, h: 'Pengalaman tersuai', p: 'Separuh hari, sehari penuh atau pengalaman bertema — budaya, alam, makanan, fotografi.' },
    ],
    cta: { h: 'Anda seorang pemandu pelancong?', p: 'Sertai MyBridge dan capai pengembara dari 3 benua.', btn: 'Daftar sekarang' },
  },
};

export function GuidesPage() {
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
        <Link to="/waitlist/guide" className="inline-flex items-center px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition shadow-sm">{c.cta.btn}</Link>
      </section>
    </InfoPageLayout>
  );
}
