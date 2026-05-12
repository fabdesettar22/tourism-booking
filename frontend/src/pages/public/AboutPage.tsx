import {
  Handshake, Globe2, FileSignature, Megaphone,
  TrendingUp, Rocket, Network, Plane,
  ShieldOff, Target, BadgeCheck, Compass,
  Hotel, Briefcase, Building2, PlaneTakeoff, Landmark,
  CheckCircle2, Lock, LineChart, Mail, Phone,
  ArrowUpRight,
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';

type Lang = 'ar' | 'en' | 'ms';

const CONTENT: Record<Lang, any> = {
  en: {
    backHome: 'Back to home',
    eyebrow: 'About MyBridge',
    name: 'MyBridge.my',
    tagline: 'Connecting travel businesses.',
    tagline2: 'Unlocking new markets.',
    heroQuote: 'Beyond OTAs. Real partnerships start here.',
    type: 'B2B Digital Platform',
    geo: 'North Africa ⇄ Southeast Asia',
    aboutEyebrow: '01 — The Mission',
    aboutTitle: 'A bridge between two worlds.',
    about:
      'MyBridge is a B2B digital platform connecting travel suppliers and agencies between North Africa (Algeria) and Southeast Asia (Malaysia). We enable direct partnerships, eliminate unnecessary intermediaries, and create sustainable cross-border tourism growth.',
    whatWeDoEyebrow: '02 — What we do',
    whatWeDoTitle: 'Four ways we move the industry forward.',
    whatWeDo: [
      { n: '01', icon: Handshake,     h: 'Supplier–Agency Matching', p: 'Connect hotels, DMCs, and tourism providers directly with verified travel agents.' },
      { n: '02', icon: Globe2,        h: 'Bilateral Market Access',   p: 'Open inbound & outbound travel channels between Africa and Asia.' },
      { n: '03', icon: FileSignature, h: 'Direct Contracting System', p: 'Reduce dependency on OTAs and avoid price wars.' },
      { n: '04', icon: Megaphone,     h: 'Lead Generation',           p: 'Generate qualified B2B leads for partners.' },
    ],
    whyEyebrow: '03 — Why MyBridge',
    whyTitle: 'Built to lead an underserved corridor.',
    why: [
      { icon: TrendingUp, h: 'Untapped market opportunity', p: 'Access high-potential, underdeveloped markets.' },
      { icon: Rocket,     h: 'First-mover advantage',       p: 'Be early. Build strong positioning. Lead the way.' },
      { icon: Network,    h: 'Hybrid model',                p: 'Smart digital platform backed by real-world connections.' },
      { icon: Plane,      h: 'International presence',      p: 'Active in SITEV, trade missions and global industry platforms.' },
    ],
    valueEyebrow: '04 — Value',
    valueTitle: 'What partners actually get.',
    value: [
      { icon: ShieldOff,  h: 'No OTA price war',         p: 'Maintain rate integrity and brand positioning.' },
      { icon: Target,     h: 'Direct market penetration', p: 'Enter new regions without heavy marketing cost.' },
      { icon: BadgeCheck, h: 'Curated B2B network',      p: 'Verified and targeted partners only.' },
      { icon: Compass,    h: 'Cross-border expertise',   p: 'Specialized in Africa ⇄ Malaysia corridor.' },
    ],
    partnersEyebrow: '05 — Partners',
    partnersTitle: 'Who we work with.',
    partners: [
      { icon: Hotel,         label: 'Hotels & Resorts' },
      { icon: Briefcase,     label: 'Destination Management Companies' },
      { icon: Building2,     label: 'Inbound & Outbound Agencies' },
      { icon: PlaneTakeoff,  label: 'Airlines & Transport Operators' },
      { icon: Landmark,      label: 'Tourism Boards & Government' },
    ],
    trustEyebrow: '06 — Trust',
    trustTitle: 'Three pillars we hold ourselves to.',
    trust: [
      { icon: CheckCircle2, h: 'Verified partners', p: 'Quality over quantity.' },
      { icon: Lock,         h: 'Secure & reliable', p: 'Trust, transparency, data security.' },
      { icon: LineChart,    h: 'Growth-focused',    p: 'Built for long-term partnerships.' },
    ],
    contactEyebrow: '07 — Get in touch',
    contactTitle: 'Ready to build something real?',
    contactCTA: 'Reach out to our team — we reply within one business day.',
    contactEmail: 'Email us',
    contactPhone: 'Call us',
    contactWeb: 'Visit',
  },
  ar: {
    backHome: 'العودة للرئيسية',
    eyebrow: 'تعريف بـ MyBridge',
    name: 'MyBridge.my',
    tagline: 'نربط شركات السفر.',
    tagline2: 'نفتح أسواقاً جديدة.',
    heroQuote: 'ما وراء OTAs. الشراكات الحقيقية تبدأ هنا.',
    type: 'منصة B2B رقمية',
    geo: 'شمال إفريقيا ⇄ جنوب شرق آسيا',
    aboutEyebrow: '٠١ — المهمة',
    aboutTitle: 'جسر بين عالَمَين.',
    about:
      'MyBridge منصة B2B رقمية تربط موردي السفر والوكالات بين شمال إفريقيا (الجزائر) وجنوب شرق آسيا (ماليزيا). نُتيح شراكات مباشرة، ونُلغي الوسطاء غير الضروريين، ونخلق نمواً سياحياً مستداماً عبر الحدود.',
    whatWeDoEyebrow: '٠٢ — ماذا نقدّم',
    whatWeDoTitle: 'أربع طرق نحرّك بها القطاع إلى الأمام.',
    whatWeDo: [
      { n: '٠١', icon: Handshake,     h: 'مطابقة المورد بالوكالة', p: 'نربط الفنادق وشركات DMC ومقدّمي الخدمات مباشرة بوكلاء سفر معتمدين.' },
      { n: '٠٢', icon: Globe2,        h: 'وصول ثنائي للأسواق',     p: 'نفتح قنوات السفر الواردة والصادرة بين إفريقيا وآسيا.' },
      { n: '٠٣', icon: FileSignature, h: 'نظام تعاقد مباشر',        p: 'نُقلّل الاعتماد على OTAs ونتجنّب حروب الأسعار.' },
      { n: '٠٤', icon: Megaphone,     h: 'توليد الفرص',              p: 'نُولّد فرص B2B مؤهَّلة لشركائنا.' },
    ],
    whyEyebrow: '٠٣ — لماذا MyBridge',
    whyTitle: 'مبنيّ لقيادة ممرٍّ مُهمَل.',
    why: [
      { icon: TrendingUp, h: 'فرصة سوقية غير مُستغَلّة', p: 'أسواق واعدة وقليلة التطوير.' },
      { icon: Rocket,     h: 'ميزة السبق',                p: 'كُن من الأوائل. ابنِ موقعاً قوياً. قُد الطريق.' },
      { icon: Network,    h: 'نموذج هجين',                 p: 'منصة رقمية ذكية مدعومة بعلاقات حقيقية.' },
      { icon: Plane,      h: 'حضور دولي',                  p: 'حاضرون في SITEV، البعثات التجارية، والمحافل العالمية.' },
    ],
    valueEyebrow: '٠٤ — القيمة',
    valueTitle: 'ما الذي يحصل عليه الشركاء فعلاً.',
    value: [
      { icon: ShieldOff,  h: 'لا حرب أسعار OTA',     p: 'حافظ على نزاهة أسعارك وتموضع علامتك.' },
      { icon: Target,     h: 'اختراق سوق مباشر',      p: 'ادخل أسواقاً جديدة دون تكاليف تسويق ضخمة.' },
      { icon: BadgeCheck, h: 'شبكة B2B منتقاة',       p: 'شركاء معتمدون ومستهدفون فقط.' },
      { icon: Compass,    h: 'خبرة عبر الحدود',        p: 'متخصّصون في ممرّ إفريقيا ⇄ ماليزيا.' },
    ],
    partnersEyebrow: '٠٥ — الشركاء',
    partnersTitle: 'مع من نعمل.',
    partners: [
      { icon: Hotel,         label: 'الفنادق والمنتجعات' },
      { icon: Briefcase,     label: 'شركات إدارة الوجهات' },
      { icon: Building2,     label: 'الوكالات الواردة والصادرة' },
      { icon: PlaneTakeoff,  label: 'شركات الطيران ومُشغّلو النقل' },
      { icon: Landmark,      label: 'هيئات السياحة والحكومات' },
    ],
    trustEyebrow: '٠٦ — الثقة',
    trustTitle: 'ثلاث ركائز نلتزم بها.',
    trust: [
      { icon: CheckCircle2, h: 'شركاء معتمدون', p: 'الجودة قبل الكمّ.' },
      { icon: Lock,         h: 'آمن وموثوق',     p: 'ثقة وشفافية وأمان للبيانات.' },
      { icon: LineChart,    h: 'موجَّه للنمو',     p: 'مبنيّ من أجل شراكات طويلة الأمد.' },
    ],
    contactEyebrow: '٠٧ — تواصل',
    contactTitle: 'جاهز لبناء شيء حقيقي؟',
    contactCTA: 'تواصل مع فريقنا — نردّ خلال يوم عمل واحد.',
    contactEmail: 'راسلنا',
    contactPhone: 'اتصل بنا',
    contactWeb: 'زُرنا',
  },
  ms: {
    backHome: 'Kembali ke laman utama',
    eyebrow: 'Tentang MyBridge',
    name: 'MyBridge.my',
    tagline: 'Menghubungkan perniagaan pelancongan.',
    tagline2: 'Membuka pasaran baharu.',
    heroQuote: 'Melangkaui OTA. Perkongsian sebenar bermula di sini.',
    type: 'Platform Digital B2B',
    geo: 'Afrika Utara ⇄ Asia Tenggara',
    aboutEyebrow: '01 — Misi',
    aboutTitle: 'Jambatan antara dua dunia.',
    about:
      'MyBridge ialah platform digital B2B yang menghubungkan pembekal pelancongan dan agensi antara Afrika Utara (Algeria) dan Asia Tenggara (Malaysia). Kami memboleh­kan perkongsian terus, menghapus­kan orang tengah yang tidak perlu, dan mewujud­kan pertumbuhan pelancongan rentas sempadan yang mampan.',
    whatWeDoEyebrow: '02 — Apa kami buat',
    whatWeDoTitle: 'Empat cara kami menggerakkan industri.',
    whatWeDo: [
      { n: '01', icon: Handshake,     h: 'Padanan Pembekal–Agensi', p: 'Hubung hotel, DMC dan penyedia pelancongan terus dengan ejen disahkan.' },
      { n: '02', icon: Globe2,        h: 'Akses Pasaran Dua Hala',  p: 'Buka saluran masuk & keluar antara Afrika dan Asia.' },
      { n: '03', icon: FileSignature, h: 'Sistem Kontrak Terus',     p: 'Kurangkan kebergantungan kepada OTA, elak perang harga.' },
      { n: '04', icon: Megaphone,     h: 'Penjanaan Lead',            p: 'Hasilkan lead B2B berkualiti untuk rakan kongsi.' },
    ],
    whyEyebrow: '03 — Kenapa MyBridge',
    whyTitle: 'Dibina untuk memimpin koridor terabai.',
    why: [
      { icon: TrendingUp, h: 'Peluang pasaran belum diteroka', p: 'Akses pasaran berpotensi tinggi yang belum dibangunkan.' },
      { icon: Rocket,     h: 'Kelebihan pelopor',              p: 'Jadi awal. Bina kedudukan kukuh. Pimpin haluan.' },
      { icon: Network,    h: 'Model hibrid',                    p: 'Platform digital pintar disokong rangkaian sebenar.' },
      { icon: Plane,      h: 'Kehadiran antarabangsa',          p: 'Aktif di SITEV, misi dagang dan platform global.' },
    ],
    valueEyebrow: '04 — Nilai',
    valueTitle: 'Apa yang rakan kongsi dapat sebenarnya.',
    value: [
      { icon: ShieldOff,  h: 'Tiada perang harga OTA',  p: 'Kekalkan integriti kadar dan kedudukan jenama.' },
      { icon: Target,     h: 'Penembusan pasaran terus', p: 'Masuk wilayah baharu tanpa kos pemasaran besar.' },
      { icon: BadgeCheck, h: 'Rangkaian B2B terpilih',   p: 'Hanya rakan kongsi disahkan dan disasarkan.' },
      { icon: Compass,    h: 'Kepakaran rentas sempadan', p: 'Pakar dalam koridor Afrika ⇄ Malaysia.' },
    ],
    partnersEyebrow: '05 — Rakan kongsi',
    partnersTitle: 'Dengan siapa kami bekerja.',
    partners: [
      { icon: Hotel,         label: 'Hotel & Resort' },
      { icon: Briefcase,     label: 'Syarikat Pengurusan Destinasi' },
      { icon: Building2,     label: 'Agensi Masuk & Keluar' },
      { icon: PlaneTakeoff,  label: 'Penerbangan & Pengangkutan' },
      { icon: Landmark,      label: 'Lembaga Pelancongan & Kerajaan' },
    ],
    trustEyebrow: '06 — Kepercayaan',
    trustTitle: 'Tiga tonggak yang kami pegang.',
    trust: [
      { icon: CheckCircle2, h: 'Rakan disahkan',           p: 'Kualiti melebihi kuantiti.' },
      { icon: Lock,         h: 'Selamat & boleh dipercayai', p: 'Kepercayaan, ketelusan, keselamatan data.' },
      { icon: LineChart,    h: 'Fokus pertumbuhan',         p: 'Dibina untuk perkongsian jangka panjang.' },
    ],
    contactEyebrow: '07 — Hubungi kami',
    contactTitle: 'Bersedia membina sesuatu yang nyata?',
    contactCTA: 'Hubungi pasukan kami — kami balas dalam satu hari bekerja.',
    contactEmail: 'E-mel kami',
    contactPhone: 'Hubungi kami',
    contactWeb: 'Lawat',
  },
};

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-mono uppercase tracking-[0.2em] text-orange-600 mb-6">
    {children}
  </p>
);

export function AboutPage() {
  const { lang, changeLang, t, isRTL } = useLanguage();
  const c = CONTENT[(lang as Lang)] ?? CONTENT.en;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-white text-gray-900 antialiased selection:bg-orange-200">
      <PublicNavbar
        lang={lang}
        onLangChange={changeLang}
        t={t}
        isRTL={isRTL}
        variant="solid"
      />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-24 pb-32 md:pt-32 md:pb-40">
        <Eyebrow>{c.eyebrow}</Eyebrow>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.02]">
          {c.tagline}
          <br />
          <span className="text-gray-400">{c.tagline2}</span>
        </h1>
        <div className="mt-12 max-w-2xl">
          <p className="text-xl md:text-2xl text-gray-600 font-light leading-relaxed">
            "{c.heroQuote}"
          </p>
        </div>
        <div className="mt-12 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            {c.type}
          </span>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            {c.geo}
          </span>
        </div>
      </section>

      {/* Mission */}
      <section className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 md:py-32 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <Eyebrow>{c.aboutEyebrow}</Eyebrow>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              {c.aboutTitle}
            </h2>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <p className="text-xl md:text-2xl text-gray-700 font-light leading-relaxed">
              {c.about}
            </p>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 md:py-32">
          <div className="grid lg:grid-cols-12 gap-12 mb-16">
            <div className="lg:col-span-6">
              <Eyebrow>{c.whatWeDoEyebrow}</Eyebrow>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
                {c.whatWeDoTitle}
              </h2>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-px bg-gray-200 border border-gray-200 rounded-2xl overflow-hidden">
            {c.whatWeDo.map((it: any) => {
              const I = it.icon;
              return (
                <div key={it.h} className="bg-white p-8 md:p-10 group hover:bg-orange-50/40 transition-colors">
                  <div className="flex items-start justify-between mb-8">
                    <span className="text-xs font-mono text-gray-400">{it.n}</span>
                    <I className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold mb-3 tracking-tight">{it.h}</h3>
                  <p className="text-gray-600 leading-relaxed">{it.p}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 md:py-32">
          <div className="grid lg:grid-cols-12 gap-12 mb-16">
            <div className="lg:col-span-7">
              <Eyebrow>{c.whyEyebrow}</Eyebrow>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
                {c.whyTitle}
              </h2>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {c.why.map((it: any, i: number) => {
              const I = it.icon;
              return (
                <div key={it.h} className="border-t border-gray-900 pt-6">
                  <div className="flex items-center justify-between mb-8">
                    <I className="w-6 h-6 text-gray-900" />
                    <span className="text-xs font-mono text-gray-400">0{i + 1}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-3 tracking-tight">{it.h}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{it.p}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Value */}
      <section className="border-t border-gray-100 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 md:py-32">
          <div className="grid lg:grid-cols-12 gap-12 mb-16">
            <div className="lg:col-span-7">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-orange-400 mb-6">
                {c.valueEyebrow}
              </p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
                {c.valueTitle}
              </h2>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
            {c.value.map((it: any) => {
              const I = it.icon;
              return (
                <div key={it.h} className="flex gap-6 border-t border-white/10 pt-8">
                  <I className="w-6 h-6 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2 tracking-tight">{it.h}</h3>
                    <p className="text-white/60 leading-relaxed">{it.p}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 md:py-32">
          <div className="grid lg:grid-cols-12 gap-12 mb-16">
            <div className="lg:col-span-7">
              <Eyebrow>{c.partnersEyebrow}</Eyebrow>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
                {c.partnersTitle}
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-gray-200 border border-gray-200 rounded-2xl overflow-hidden">
            {c.partners.map((it: any) => {
              const I = it.icon;
              return (
                <div key={it.label} className="bg-white p-6 md:p-8 flex flex-col items-center justify-center text-center min-h-[160px] group hover:bg-orange-50/40 transition-colors">
                  <I className="w-7 h-7 text-gray-700 group-hover:text-orange-600 mb-4 transition-colors" />
                  <p className="text-sm font-medium text-gray-800 leading-snug">{it.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 md:py-32">
          <div className="grid lg:grid-cols-12 gap-12 mb-16">
            <div className="lg:col-span-7">
              <Eyebrow>{c.trustEyebrow}</Eyebrow>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
                {c.trustTitle}
              </h2>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {c.trust.map((it: any, i: number) => {
              const I = it.icon;
              return (
                <div key={it.h} className="bg-white border border-gray-200 rounded-2xl p-8 md:p-10">
                  <div className="flex items-center justify-between mb-10">
                    <I className="w-7 h-7 text-orange-600" />
                    <span className="text-xs font-mono text-gray-400">0{i + 1}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 tracking-tight">{it.h}</h3>
                  <p className="text-gray-600 leading-relaxed">{it.p}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 md:py-32">
          <Eyebrow>{c.contactEyebrow}</Eyebrow>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight max-w-3xl mb-6">
            {c.contactTitle}
          </h2>
          <p className="text-xl text-gray-600 font-light max-w-2xl mb-16">
            {c.contactCTA}
          </p>
          <div className="grid md:grid-cols-3 border-t border-gray-200">
            <a href="mailto:contact@mybridge.my" className="group py-8 md:py-10 border-b md:border-b-0 md:border-e border-gray-200 flex items-center justify-between hover:bg-orange-50/40 transition-colors px-1 md:px-6">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-2">{c.contactEmail}</p>
                <p className="text-base md:text-lg font-medium">contact@mybridge.my</p>
              </div>
              <Mail className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
            </a>
            <a href="tel:+60174212823" dir="ltr" className="group py-8 md:py-10 border-b md:border-b-0 md:border-e border-gray-200 flex items-center justify-between hover:bg-orange-50/40 transition-colors px-1 md:px-6">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-2">{c.contactPhone}</p>
                <p className="text-base md:text-lg font-medium">+60 17-421 2823</p>
              </div>
              <Phone className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
            </a>
            <a href="https://www.mybridge.my" className="group py-8 md:py-10 flex items-center justify-between hover:bg-orange-50/40 transition-colors px-1 md:px-6">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-2">{c.contactWeb}</p>
                <p className="text-base md:text-lg font-medium">www.mybridge.my</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
            </a>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
