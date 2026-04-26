import { ReactNode } from 'react';
import { useLanguage } from '../../../../hooks/useLanguage';

interface Props {
  title: string;
  subtitle?: string;
  icon?: string;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  saving?: boolean;
  canProceed?: boolean;
  error?: string | null;
}

export function StepLayout({
  title, subtitle, icon = '🏨', children, onBack, onNext,
  nextLabel, backLabel, saving = false, canProceed = true, error,
}: Props) {
  const { t } = useLanguage();
  const next = nextLabel ?? t('supplierOnboarding.common.next');
  const back = backLabel ?? t('supplierOnboarding.common.back');

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">{icon}</span>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
        {subtitle && <p className="text-sm text-gray-500 mr-9">{subtitle}</p>}
      </div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">{children}</div>
      <div className="flex items-center justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            {back}
          </button>
        ) : <div />}
        {onNext && (
          <button
            onClick={onNext}
            disabled={saving || !canProceed}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              saving || !canProceed
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#FF6B35] text-white hover:bg-[#E55A25] shadow-sm'
            }`}
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('supplierOnboarding.common.saving')}
              </>
            ) : next}
          </button>
        )}
      </div>
    </div>
  );
}
