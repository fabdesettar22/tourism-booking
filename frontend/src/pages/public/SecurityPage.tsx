import { Shield, Lock, CreditCard, Eye, Server, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { InfoPageLayout } from '../../components/layout/InfoPageLayout';

const CONTENT = {
  ar: {
    eyebrow: 'الأمان والثقة',
    title: 'سلامتك أولويتنا الأولى',
    subtitle: 'نطبّق أعلى معايير الأمان لحماية بياناتك ومدفوعاتك ومعاملاتك على المنصة.',
    items: [
      { icon: Lock, h: 'تشفير كامل', p: 'كل اتصال مع mybridge.my مشفّر عبر TLS 1.3. بيانات الدخول والمعاملات لا تُنقل أبداً بنص واضح.' },
      { icon: CreditCard, h: 'مدفوعات آمنة', p: 'تتم المعاملات عبر بوّابات دفع متوافقة مع PCI-DSS Level 1. لا نخزّن أرقام البطاقات على خوادمنا أبداً.' },
      { icon: Shield, h: 'حماية الحساب', p: 'نستخدم JWT مع rotating refresh tokens وكلمة مرور مشفّرة (bcrypt). محاولات الدخول المشبوهة تُحظر تلقائياً.' },
      { icon: Eye, h: 'خصوصية البيانات', p: 'نلتزم بمعايير PDPA الماليزية. لا نبيع بياناتك ولا نشاركها مع جهات تسويقية خارجية.' },
      { icon: Server, h: 'بنية تحتية محمية', p: 'الخوادم محميّة بجدران نارية متقدّمة، نسخ احتياطي يومي مشفّر، ومراقبة على مدار الساعة.' },
      { icon: AlertTriangle, h: 'إبلاغ عن ثغرة', p: 'إن اكتشفت ثغرة أمنية، أبلغنا فوراً على security@mybridge.my — نقدّر إسهام الباحثين الأمنيين.' },
    ],
  },
  en: {
    eyebrow: 'Security & Trust',
    title: 'Your safety is our top priority',
    subtitle: 'We apply the highest security standards to protect your data, payments, and transactions across the platform.',
    items: [
      { icon: Lock, h: 'End-to-end encryption', p: 'Every connection with mybridge.my is encrypted via TLS 1.3. Login credentials and transactions are never transmitted in clear text.' },
      { icon: CreditCard, h: 'Secure payments', p: 'Transactions go through PCI-DSS Level 1 compliant payment gateways. We never store card numbers on our servers.' },
      { icon: Shield, h: 'Account protection', p: 'We use JWT with rotating refresh tokens and bcrypt password hashing. Suspicious login attempts are automatically blocked.' },
      { icon: Eye, h: 'Data privacy', p: 'We comply with Malaysia\'s PDPA. We do not sell your data nor share it with external marketing parties.' },
      { icon: Server, h: 'Hardened infrastructure', p: 'Servers are protected by advanced firewalls, encrypted daily backups, and 24/7 monitoring.' },
      { icon: AlertTriangle, h: 'Report a vulnerability', p: 'If you discover a security issue, please report it to security@mybridge.my — we appreciate the work of security researchers.' },
    ],
  },
  ms: {
    eyebrow: 'Keselamatan & Kepercayaan',
    title: 'Keselamatan anda keutamaan kami',
    subtitle: 'Kami mengaplikasi piawaian keselamatan tertinggi untuk melindungi data, pembayaran dan transaksi anda.',
    items: [
      { icon: Lock, h: 'Penyulitan menyeluruh', p: 'Setiap sambungan dengan mybridge.my disulitkan melalui TLS 1.3. Kelayakan log masuk dan transaksi tidak pernah dihantar dalam teks jelas.' },
      { icon: CreditCard, h: 'Pembayaran selamat', p: 'Transaksi melalui gerbang pembayaran patuh PCI-DSS Tahap 1. Kami tidak menyimpan nombor kad pada pelayan kami.' },
      { icon: Shield, h: 'Perlindungan akaun', p: 'Kami menggunakan JWT dengan rotating refresh tokens dan kata laluan bcrypt. Cubaan log masuk mencurigakan disekat secara automatik.' },
      { icon: Eye, h: 'Privasi data', p: 'Kami mematuhi PDPA Malaysia. Kami tidak menjual data anda mahupun berkongsi dengan pihak pemasaran luar.' },
      { icon: Server, h: 'Infrastruktur dilindungi', p: 'Pelayan dilindungi oleh tembok api lanjutan, sandaran harian disulitkan, dan pemantauan 24/7.' },
      { icon: AlertTriangle, h: 'Laporkan kelemahan', p: 'Jika anda menemui isu keselamatan, sila laporkan ke security@mybridge.my — kami menghargai sumbangan penyelidik keselamatan.' },
    ],
  },
};

export function SecurityPage() {
  const { lang } = useLanguage();
  const c = CONTENT[lang as 'ar' | 'en' | 'ms'] ?? CONTENT.en;

  return (
    <InfoPageLayout eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle}>
      <div className="grid sm:grid-cols-2 gap-6 -m-2">
        {c.items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="p-4 rounded-xl hover:bg-orange-50/40 transition">
              <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1.5">{item.h}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.p}</p>
            </div>
          );
        })}
      </div>
    </InfoPageLayout>
  );
}
