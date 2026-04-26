import { useState, useEffect } from 'react';
import { StepLayout } from '../components/StepLayout';
import { supplierService } from '../../services/supplierService';
import { useLanguage } from '../../../../hooks/useLanguage';

const ic = "w-full h-9 px-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]";
const lc = "block text-[10px] font-medium text-gray-500 mb-1";

interface Props {
  onNext: () => void;
  onBack: () => void;
  onRefresh: () => Promise<void>;
  setSaving: (v: boolean) => void;
  setError: (e: string | null) => void;
  saving: boolean;
  error: string | null;
}

export function Step5PricePlans({ onNext, onBack, onRefresh, setSaving, setError, saving, error }: Props) {
  const { t } = useLanguage();

  const PD = [
    { type: 'STANDARD',       label: t('supplierOnboarding.pricePlans.standard'),       desc: t('supplierOnboarding.pricePlans.standardDesc'),       icon: '📋' },
    { type: 'NON_REFUNDABLE', label: t('supplierOnboarding.pricePlans.nonRefundable'),  desc: t('supplierOnboarding.pricePlans.nonRefundableDesc'),  icon: '🔒' },
    { type: 'WEEKLY',         label: t('supplierOnboarding.pricePlans.weekly'),         desc: t('supplierOnboarding.pricePlans.weeklyDesc'),         icon: '📅' },
  ];

  const [plans, setPlans] = useState([
    { plan_type: 'STANDARD',       is_enabled: true,  discount_pct: '0',  min_nights: 1, cancellation_free_days: 7 },
    { plan_type: 'NON_REFUNDABLE', is_enabled: false, discount_pct: '15', min_nights: 1, cancellation_free_days: 0 },
    { plan_type: 'WEEKLY',         is_enabled: false, discount_pct: '10', min_nights: 7, cancellation_free_days: 7 },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supplierService.getPricePlans()
      .then(({ plans: p }) => {
        if (p.length) setPlans(p.map(x => ({ ...x, discount_pct: String(x.discount_pct) })));
      })
      .finally(() => setLoading(false));
  }, []);

  const up = (type: string, k: string, v: unknown) =>
    setPlans(pl => pl.map(p => p.plan_type === type ? { ...p, [k]: v } : p));

  const handleNext = async () => {
    setSaving(true); setError(null);
    try {
      await supplierService.savePricePlans(plans as never);
      await onRefresh();
      onNext();
    } catch {
      setError(t('supplierOnboarding.common.error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-7 h-7 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <StepLayout
      title={t('supplierOnboarding.pricePlans.title')}
      icon="📋"
      subtitle={t('supplierOnboarding.pricePlans.subtitle')}
      onBack={onBack}
      onNext={handleNext}
      nextLabel={t('supplierOnboarding.pricePlans.nextLabel')}
      saving={saving}
      error={error}
    >
      <div className="space-y-4">
        {PD.map(pd => {
          const p = plans.find(x => x.plan_type === pd.type)!;
          return (
            <div
              key={pd.type}
              className={`border-2 rounded-xl p-4 transition-all ${
                p.is_enabled ? 'border-[#FF6B35] bg-orange-50/20' : 'border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span>{pd.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{pd.label}</p>
                    <p className="text-xs text-gray-400">{pd.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => up(pd.type, 'is_enabled', !p.is_enabled)}
                  className={`w-10 h-5 rounded-full relative ${p.is_enabled ? 'bg-[#FF6B35]' : 'bg-gray-200'}`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                      p.is_enabled ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
              {p.is_enabled && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className={lc}>{t('supplierOnboarding.pricePlans.discountPct')}</label>
                    <input
                      className={ic} type="number" min="0" max="50"
                      value={p.discount_pct}
                      onChange={e => up(pd.type, 'discount_pct', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={lc}>{t('supplierOnboarding.pricePlans.minNights')}</label>
                    <input
                      className={ic} type="number" min="1"
                      value={p.min_nights}
                      onChange={e => up(pd.type, 'min_nights', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className={lc}>{t('supplierOnboarding.pricePlans.cancellationFreeDays')}</label>
                    <input
                      className={ic} type="number" min="0"
                      value={p.cancellation_free_days}
                      onChange={e => up(pd.type, 'cancellation_free_days', Number(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </StepLayout>
  );
}
