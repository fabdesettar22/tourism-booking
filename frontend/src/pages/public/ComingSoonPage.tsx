import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faClock } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../../hooks/useLanguage';
import { PublicNavbar } from '../../components/layout/PublicNavbar';

interface Props { pageName: string; }

export function ComingSoonPage({ pageName }: Props) {
  const navigate = useNavigate();
  const { lang, changeLang, t, isRTL } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F9FAFB]" dir={isRTL ? 'rtl' : 'ltr'}>

      <PublicNavbar
        variant="solid"
        lang={lang}
        onLangChange={changeLang}
        t={t}
        isRTL={isRTL}
        onLogin={() => navigate('/supplier')}
        onSupplier={() => navigate('/register/supplier')}
        onAgency={() => navigate('/register/agency')}
      />

      <div className="pt-16 flex flex-col items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faClock} className="text-[#FF6B35] text-3xl" />
          </div>
          <div className="mb-3">
            <img src="/logo.svg" alt="MYBRIDGE" className="h-10 w-auto mx-auto mb-4" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{pageName}</h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            {lang === 'ar'
              ? 'هذه الصفحة قيد الإنشاء. سنطلقها قريباً مع إطلاق المنصة الكامل.'
              : lang === 'ms'
              ? 'Halaman ini sedang dalam pembinaan. Kami akan melancarkannya tidak lama lagi.'
              : 'This page is under construction. We will launch it soon with the full platform release.'}
          </p>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-2 h-2 bg-[#FF6B35] rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-gray-700">
                {lang === 'ar' ? 'قريباً جداً' : lang === 'ms' ? 'Akan datang' : 'Coming Soon'}
              </span>
            </div>
            <p className="text-xs text-gray-400">www.mybridge.com</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#e07a38] text-white font-semibold px-6 py-3 rounded-xl transition-colors mx-auto"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            {lang === 'ar' ? 'العودة للرئيسية' : lang === 'ms' ? 'Kembali ke Utama' : 'Back to Home'}
          </button>
        </div>
      </div>
    </div>
  );
}
