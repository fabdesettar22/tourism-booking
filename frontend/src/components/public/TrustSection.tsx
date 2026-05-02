import { ShieldCheck, Heart, BadgeCheck, Globe } from 'lucide-react';
import type { Language } from '../../i18n';
import type { HomepageConfig } from '../../services/homepageConfig';

interface Props {
  lang: Language;
  isRTL: boolean;
  config?: HomepageConfig | null;
}

export function TrustSection({ lang, isRTL, config }: Props) {
  const cfg = (key: keyof HomepageConfig, defaultText: string): string => {
    if (config && config[key]) {
      const val = config[key] as Record<string, string | undefined>;
      return val[lang] || val.en || defaultText;
    }
    return defaultText;
  };

  const items = [
    {
      icon: ShieldCheck,
      bg: 'bg-blue-50',
      fg: 'text-blue-600',
      title:    cfg('trust_badge_1_title',    lang === 'ar' ? 'موثّق MOTAC'              : lang === 'ms' ? 'Disahkan MOTAC'           : 'MOTAC Approved'),
      subtitle: cfg('trust_badge_1_subtitle', lang === 'ar' ? 'مرخّص من وزارة السياحة'    : lang === 'ms' ? 'Berlesen oleh Kementerian' : 'Licensed by Tourism Ministry'),
    },
    {
      icon: Heart,
      bg: 'bg-emerald-50',
      fg: 'text-emerald-600',
      title:    cfg('trust_badge_2_title',    lang === 'ar' ? 'صديق للحلال'              : lang === 'ms' ? 'Mesra Halal'              : 'Halal-Friendly'),
      subtitle: cfg('trust_badge_2_subtitle', lang === 'ar' ? 'خيارات حلال معتمدة'        : lang === 'ms' ? 'Pilihan halal disahkan'   : 'Halal certified options'),
    },
    {
      icon: BadgeCheck,
      bg: 'bg-orange-50',
      fg: 'text-[#FF6B35]',
      title:    cfg('trust_badge_3_title',    lang === 'ar' ? 'موردون موثوقون'           : lang === 'ms' ? 'Pembekal Disahkan'        : 'Verified Suppliers'),
      subtitle: cfg('trust_badge_3_subtitle', lang === 'ar' ? 'كل مورد مُراجَع يدوياً'    : lang === 'ms' ? 'Setiap pembekal disemak'   : 'Every supplier reviewed'),
    },
    {
      icon: Globe,
      bg: 'bg-violet-50',
      fg: 'text-violet-600',
      title:    cfg('trust_badge_4_title',    lang === 'ar' ? 'دعم 3 لغات'              : lang === 'ms' ? 'Sokongan 3 Bahasa'        : 'Multi-Language'),
      subtitle: cfg('trust_badge_4_subtitle', lang === 'ar' ? 'عربي · إنجليزي · ماليزي'   : lang === 'ms' ? 'Arab · Inggeris · Melayu' : 'Arabic · English · Malay'),
    },
  ];

  return (
    <section className="bg-gray-50 py-14" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 hover:shadow-md transition-shadow text-start"
              >
                <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.fg} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" strokeWidth={2} />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.subtitle}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
