import { ReactNode } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { Link } from 'react-router-dom';

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  const { isRTL, lang } = useLanguage();
  const back = lang === 'ar' ? 'العودة للصفحة الرئيسية' : lang === 'ms' ? 'Kembali ke Laman Utama' : 'Back to Home';
  const updatedLabel = lang === 'ar' ? 'آخر تحديث' : lang === 'ms' ? 'Kemaskini terakhir' : 'Last updated';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-12">
        <Link to="/" className="text-orange-600 hover:text-orange-700 text-sm font-medium inline-block mb-6">
          {isRTL ? '→ ' : '← '}{back}
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-sm text-gray-500 mb-8">{updatedLabel}: {lastUpdated}</p>
        <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
