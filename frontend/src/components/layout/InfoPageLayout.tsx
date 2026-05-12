import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';

interface InfoPageLayoutProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function InfoPageLayout({ eyebrow, title, subtitle, children }: InfoPageLayoutProps) {
  const { lang, isRTL, changeLang, t } = useLanguage();
  const back = lang === 'ar' ? '→ العودة للصفحة الرئيسية' : lang === 'ms' ? '← Kembali ke Laman Utama' : '← Back to Home';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 flex flex-col">
      <PublicNavbar lang={lang} onLangChange={changeLang} t={t} isRTL={isRTL} variant="solid" />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-orange-50 via-white to-amber-50 border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <Link to="/" className="text-orange-600 hover:text-orange-700 text-sm font-medium inline-block mb-6">{back}</Link>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-orange-600 mb-4">{eyebrow}</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-5">{title}</h1>
            <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">{subtitle}</p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-10 shadow-sm space-y-8">
            {children}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
