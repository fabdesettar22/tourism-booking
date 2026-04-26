import { useState } from 'react';
import { StepLayout } from '../components/StepLayout';
import { supplierService } from '../../services/supplierService';
import { useLanguage } from '../../../../hooks/useLanguage';

const ic = "w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]";
const lc = "block text-xs font-medium text-gray-600 mb-1";

interface Props {
  onBack: () => void;
  onRefresh: () => Promise<void>;
  setSaving: (v: boolean) => void;
  setError: (e: string|null) => void;
  saving: boolean;
  error: string|null;
  onComplete: () => void;
}

export function Step7Final({ onBack, onRefresh, setSaving, setError, saving, error, onComplete }: Props) {
  const { t } = useLanguage();
  const [f, setF] = useState({
    payment_method: 'ONLINE_PLATFORM',
    invoice_name_type: 'PROPERTY_NAME',
    owner_type: 'INDIVIDUAL',
    contract_first_name: '', contract_middle_name: '', contract_last_name: '',
    contract_email: '', contract_phone: '',
    contract_country: 'Malaysia', contract_address1: '',
    contract_city: '', contract_zip: '',
    business_legal_name: '',
    business_country: 'Malaysia', business_address1: '',
    business_city: '', business_zip: '',
    license_confirmed: false, terms_accepted: false, open_immediately: true,
  });

  const s = (k: string, v: unknown) => setF(x => ({ ...x, [k]: v }));

  const isValid = f.license_confirmed && f.terms_accepted && (
    f.owner_type === 'INDIVIDUAL'
      ? f.contract_first_name.trim() && f.contract_last_name.trim()
      : f.business_legal_name.trim()
  );

  const handleSubmit = async () => {
    setSaving(true); setError(null);
    try {
      await supplierService.saveFinal(f as never);
      await onRefresh();
      onComplete();
    } catch (e: unknown) {
      const err = e as Record<string, string[]>;
      setError(Object.values(err).flat().join(' — ') || t('supplierOnboarding.common.error'));
    } finally {
      setSaving(false);
    }
  };

  const Tog = ({ val, onChange }: { val: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!val)}
      className={`w-10 h-5 rounded-full relative ${val ? 'bg-[#FF6B35]' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${val ? 'left-5' : 'left-0.5'}`} />
    </button>
  );

  return (
    <StepLayout
      title={t('supplierOnboarding.final.title')}
      icon="✅"
      subtitle={t('supplierOnboarding.final.subtitle')}
      onBack={onBack}
      onNext={handleSubmit}
      nextLabel={t('supplierOnboarding.final.nextLabel')}
      saving={saving}
      canProceed={!!isValid}
      error={error}
    >
      <div className="space-y-5">

        {/* Payment method */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">{t('supplierOnboarding.final.paymentMethod')}</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { v: 'ONLINE_PLATFORM', l: t('supplierOnboarding.final.paymentOnline'),    d: t('supplierOnboarding.final.paymentOnlineDesc') },
              { v: 'AT_PROPERTY',    l: t('supplierOnboarding.final.paymentAtProperty'), d: t('supplierOnboarding.final.paymentAtPropertyDesc') },
            ].map(o => (
              <button
                key={o.v}
                onClick={() => s('payment_method', o.v)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  f.payment_method === o.v ? 'border-[#FF6B35] bg-orange-50' : 'border-gray-100'
                }`}
              >
                <p className={`text-sm font-semibold ${f.payment_method === o.v ? 'text-[#FF6B35]' : 'text-gray-700'}`}>{o.l}</p>
                <p className="text-xs text-gray-400">{o.d}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Owner type */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">{t('supplierOnboarding.final.ownerType')}</p>
          <div className="flex gap-3 mb-3">
            {[
              { v: 'INDIVIDUAL', l: t('supplierOnboarding.final.individual') },
              { v: 'BUSINESS',   l: t('supplierOnboarding.final.business') },
            ].map(o => (
              <button
                key={o.v}
                onClick={() => s('owner_type', o.v)}
                className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                  f.owner_type === o.v
                    ? 'border-[#FF6B35] bg-orange-50 text-[#FF6B35]'
                    : 'border-gray-100 text-gray-600'
                }`}
              >
                {o.l}
              </button>
            ))}
          </div>

          {f.owner_type === 'INDIVIDUAL' ? (
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lc}>{t('supplierOnboarding.final.firstName')} *</label><input className={ic} value={f.contract_first_name} onChange={e => s('contract_first_name', e.target.value)} /></div>
              <div><label className={lc}>{t('supplierOnboarding.final.lastName')} *</label><input className={ic} value={f.contract_last_name} onChange={e => s('contract_last_name', e.target.value)} /></div>
              <div><label className={lc}>{t('supplierOnboarding.final.email')}</label><input className={ic} type="email" value={f.contract_email} onChange={e => s('contract_email', e.target.value)} /></div>
              <div><label className={lc}>{t('supplierOnboarding.final.phone')}</label><input className={ic} value={f.contract_phone} onChange={e => s('contract_phone', e.target.value)} /></div>
              <div><label className={lc}>{t('supplierOnboarding.final.city')}</label><input className={ic} value={f.contract_city} onChange={e => s('contract_city', e.target.value)} /></div>
              <div><label className={lc}>{t('supplierOnboarding.final.zip')}</label><input className={ic} value={f.contract_zip} onChange={e => s('contract_zip', e.target.value)} /></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className={lc}>{t('supplierOnboarding.final.legalName')} *</label><input className={ic} value={f.business_legal_name} onChange={e => s('business_legal_name', e.target.value)} /></div>
              <div><label className={lc}>{t('supplierOnboarding.final.city')}</label><input className={ic} value={f.business_city} onChange={e => s('business_city', e.target.value)} /></div>
              <div><label className={lc}>{t('supplierOnboarding.final.zip')}</label><input className={ic} value={f.business_zip} onChange={e => s('business_zip', e.target.value)} /></div>
            </div>
          )}
        </div>

        {/* License + Terms */}
        <div className="space-y-3 border-t pt-4">
          {[
            { k: 'license_confirmed', l: t('supplierOnboarding.final.licenseConfirm') },
            { k: 'terms_accepted',    l: t('supplierOnboarding.final.termsAccept') },
          ].map(item => (
            <div
              key={item.k}
              onClick={() => s(item.k, !(f as Record<string, boolean>)[item.k])}
              className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                (f as Record<string, boolean>)[item.k]
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-100'
              }`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                (f as Record<string, boolean>)[item.k]
                  ? 'bg-[#FF6B35] border-[#FF6B35]'
                  : 'border-gray-300'
              }`}>
                {(f as Record<string, boolean>)[item.k] && (
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                    <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-700">{item.l}</span>
            </div>
          ))}
        </div>

        {/* Open immediately toggle */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
          <div>
            <p className="text-sm font-medium text-gray-700">{t('supplierOnboarding.final.openImmediately')}</p>
            <p className="text-xs text-gray-400">{t('supplierOnboarding.final.changeAnytime')}</p>
          </div>
          <Tog val={f.open_immediately} onChange={v => s('open_immediately', v)} />
        </div>

      </div>
    </StepLayout>
  );
}
