import { useState } from 'react';
import { useOnboarding } from '../hooks/useOnboarding';
import { useLanguage } from '../../../hooks/useLanguage';
import { LANGUAGES, type Language } from '../../../i18n/index';
import { StepProgress }      from './components/StepProgress';
import { Step0PropertyType } from './steps/Step0PropertyType';
import { Step1BasicInfo }    from './steps/Step1BasicInfo';
import { Step2Amenities }    from './steps/Step2Amenities';
import { Step2Services }     from './steps/Step2Services';
import { Step2Description }  from './steps/Step2Description';
import { Step3Rooms }        from './steps/Step3Rooms';
import { Step4Photos }       from './steps/Step4Photos';
import { Step5Pricing }      from './steps/Step5Pricing';
import { Step5PricePlans }   from './steps/Step5PricePlans';
import { Step6Availability } from './steps/Step6Availability';
import { Step7Final }        from './steps/Step7Final';
import { StepComplete }      from './steps/StepComplete';

interface Props { onLogout?: () => void; }

export function HotelOnboardingWizard({ onLogout }: Props = {}) {
  const { status, currentStep, loading, saving, error, goToStep, goNext, goPrev, refreshStatus, setSaving, setError } = useOnboarding();
  const [completed, setCompleted] = useState(false);
  const { t, lang, changeLang, isRTL } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"/>
        <p className="text-sm text-gray-500">{t('supplierOnboarding.wizard.loading')}</p>
      </div>
    </div>
  );

  const cp = { onRefresh: refreshStatus, setSaving, setError, saving, error };

  const renderStep = () => {
    if (completed) return (
      <StepComplete
        hotelName={status?.hotel_name || t('supplierOnboarding.wizard.myHotel')}
        completionPct={status?.completion_pct || 100}
      />
    );
    switch (currentStep) {
      case 0:    return <Step0PropertyType   {...cp} onNext={goNext}/>;
      case 1:    return <Step1BasicInfo      {...cp} onNext={goNext} onBack={goPrev}/>;
      case '2a': return <Step2Amenities      {...cp} onNext={goNext} onBack={goPrev}/>;
      case '2b': return <Step2Services       {...cp} onNext={goNext} onBack={goPrev}/>;
      case '2c': return <Step2Description    {...cp} onNext={goNext} onBack={goPrev}/>;
      case 3:    return <Step3Rooms          {...cp} onNext={goNext} onBack={goPrev}/>;
      case 4:    return <Step4Photos         {...cp} onNext={goNext} onBack={goPrev}/>;
      case '5a': return <Step5Pricing        {...cp} onNext={goNext} onBack={goPrev}/>;
      case '5b': return <Step5PricePlans     {...cp} onNext={goNext} onBack={goPrev}/>;
      case 6:    return <Step6Availability   {...cp} onNext={goNext} onBack={goPrev}/>;
      case 7:    return <Step7Final          {...cp} onBack={goPrev} onComplete={async()=>{ await refreshStatus(); setCompleted(true); }}/>;
      default:   return null;
    }
  };

  // ── Status label translation ───────────────────────
  const getStatusLabel = (s?: string) => {
    if (s === 'DRAFT')          return t('supplierOnboarding.wizard.status.draft');
    if (s === 'PENDING_REVIEW') return t('supplierOnboarding.wizard.status.pendingReview');
    if (s === 'APPROVED')       return t('supplierOnboarding.wizard.status.approved');
    if (s === 'REJECTED')       return t('supplierOnboarding.wizard.status.rejected');
    return s || '';
  };

  const currentLangObj = LANGUAGES.find(l => l.code === lang);

  return (
    <div className="min-h-screen bg-[#F9FAFB]" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">

          {/* ── Logo + Title ── */}
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="MYBRIDGE" className="h-8 w-auto"/>
            <div>
              <p className="text-xs text-gray-400">{t('supplierOnboarding.wizard.brand')}</p>
              <p className="text-sm font-semibold text-gray-800">
                {t('supplierOnboarding.wizard.title')}
              </p>
            </div>
          </div>

          {/* ── Right side: Status + % + Lang switcher + Logout ── */}
          <div className="flex items-center gap-2">

            {/* Status badge */}
            {status && (
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                status.content_status === 'APPROVED'        ? 'bg-green-100 text-green-700' :
                status.content_status === 'PENDING_REVIEW'  ? 'bg-amber-100 text-amber-700' :
                status.content_status === 'REJECTED'        ? 'bg-red-100 text-red-700'     :
                'bg-gray-100 text-gray-600'
              }`}>
                {getStatusLabel(status.content_status)}
              </span>
            )}

            {/* Completion % */}
            {status && (
              <span className="text-sm font-bold text-[#FF6B35]">{status.completion_pct}%</span>
            )}

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(o => !o)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-[#FF6B35] hover:border-orange-200 transition-colors"
              >
                <span className="text-base">{currentLangObj?.flag}</span>
                <span>{currentLangObj?.label}</span>
                <svg className={`w-3 h-3 transition-transform ${langOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              {langOpen && (
                <>
                  {/* Overlay لإغلاق القائمة عند الضغط خارجها */}
                  <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                  <div className={`absolute top-full mt-2 z-50 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-[140px] ${isRTL ? 'left-0' : 'right-0'}`}>
                    {LANGUAGES.map(L => (
                      <button
                        key={L.code}
                        onClick={() => { changeLang(L.code as Language); setLangOpen(false); }}
                        className={`w-full text-start flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                          lang === L.code ? 'bg-orange-50 text-[#FF6B35] font-semibold' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base">{L.flag}</span>
                        <span>{L.label}</span>
                        {lang === L.code && (
                          <svg className="w-3.5 h-3.5 ms-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M5 13l4 4L19 7"/>
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Logout */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
                {t('supplierOnboarding.wizard.logout')}
              </button>
            )}

          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {!completed && status && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <StepProgress
              currentStep={currentStep}
              stepsStatus={status.steps_status}
              completionPct={status.completion_pct}
              onStepClick={goToStep}
            />
          </div>
        )}
        {renderStep()}
      </div>
    </div>
  );
}
