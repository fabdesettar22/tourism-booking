import type { OnboardingStepsStatus } from '../../../../types/supplier';
import type { OnboardingStep } from '../../hooks/useOnboarding';
import { useLanguage } from '../../../../hooks/useLanguage';

interface Props {
  currentStep: OnboardingStep;
  stepsStatus: OnboardingStepsStatus;
  completionPct: number;
  onStepClick: (s: OnboardingStep) => void;
}

export function StepProgress({ currentStep, stepsStatus, completionPct, onStepClick }: Props) {
  const { t } = useLanguage();

  const STEPS = [
    { key: 0,    labelKey: 'step0',  icon: '🏨', sk: 'step0_property_type' },
    { key: 1,    labelKey: 'step1',  icon: '📍', sk: 'step1_basic_info' },
    { key: '2a', labelKey: 'step2a', icon: '✨', sk: 'step2_amenities' },
    { key: '2b', labelKey: 'step2b', icon: '🛎', sk: 'step2_services' },
    { key: '2c', labelKey: 'step2c', icon: '📝', sk: 'step2_description' },
    { key: 3,    labelKey: 'step3',  icon: '🛏', sk: 'step3_rooms' },
    { key: 4,    labelKey: 'step4',  icon: '📷', sk: 'step4_photos' },
    { key: '5a', labelKey: 'step5a', icon: '💰', sk: 'step5_pricing' },
    { key: '5b', labelKey: 'step5b', icon: '📋', sk: 'step5_pricing' },
    { key: 6,    labelKey: 'step6',  icon: '📅', sk: 'step6_availability' },
    { key: 7,    labelKey: 'step7',  icon: '✅', sk: 'step7_final' },
  ] as const;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {t('supplierOnboarding.progress.registrationProgress')}
        </span>
        <span className="text-sm font-bold text-[#FF6B35]">{completionPct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-[#FF6B35] rounded-full transition-all duration-500"
          style={{ width: `${completionPct}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {STEPS.map(step => {
          const isActive = currentStep === step.key;
          const isDone = (stepsStatus as Record<string, boolean>)[step.sk];
          return (
            <button
              key={String(step.key)}
              onClick={() => onStepClick(step.key as OnboardingStep)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                isActive
                  ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
                  : isDone
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-[#FF6B35]'
              }`}
            >
              <span className="text-[11px]">{step.icon}</span>
              <span>{t(`supplierOnboarding.progress.${step.labelKey}`)}</span>
              {isDone && !isActive && (
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                  <polyline points="2,6 5,9 10,3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
