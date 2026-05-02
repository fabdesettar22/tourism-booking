import { useState } from 'react';
import { StepLayout } from '../components/StepLayout';
import { supplierService } from '../../services/supplierService';
import { useLanguage } from '../../../../hooks/useLanguage';
import type { HotelType, HotelsCount } from '../../../../types/supplier';

const TYPE_KEYS: HotelType[] = [
  'HOTEL', 'GUESTHOUSE', 'BED_BREAKFAST', 'HOMESTAY', 'HOSTEL',
  'CONDO_HOTEL', 'RESORT', 'CAPSULE_HOTEL', 'FLOATING', 'MOTEL', 'LODGE', 'RIAD',
];
const TYPE_ICONS: Record<HotelType, string> = {
  HOTEL: '🏨', GUESTHOUSE: '🏡', BED_BREAKFAST: '🍳', HOMESTAY: '🏠',
  HOSTEL: '🛖', CONDO_HOTEL: '🏢', RESORT: '🌴', CAPSULE_HOTEL: '📦',
  FLOATING: '⛵', MOTEL: '🚗', LODGE: '🏕', RIAD: '🏛',
};
const PLATFORM_KEYS = ['airbnb', 'booking', 'agoda', 'tripadvisor', 'vrbo', 'other', 'none'] as const;
const PLATFORM_LABELS: Record<string, string> = {
  airbnb: 'Airbnb', booking: 'Booking.com', agoda: 'Agoda',
  tripadvisor: 'TripAdvisor', vrbo: 'VRBO',
};

interface Props {
  onNext: () => void;
  onRefresh: () => Promise<void>;
  setSaving: (v: boolean) => void;
  setError: (e: string | null) => void;
  saving: boolean;
}

export function Step0PropertyType({ onNext, onRefresh, setSaving, setError, saving }: Props) {
  const { t } = useLanguage();
  const [ht, setHt] = useState<HotelType>('HOTEL');
  const [hc, setHc] = useState<HotelsCount>('SINGLE');
  const [lo, setLo] = useState<string[]>([]);

  const toggleP = (v: string) => {
    if (v === 'none') { setLo(['none']); return; }
    setLo(p => p.includes(v) ? p.filter(x => x !== v) : [...p.filter(x => x !== 'none'), v]);
  };

  const handleNext = async () => {
    setSaving(true);
    setError(null);
    try {
      await supplierService.saveStep0({ hotel_type: ht, hotels_count: hc, listed_on: lo });
      await onRefresh();
      onNext();
    } catch {
      setError(t('supplierOnboarding.common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <StepLayout
      title={t('supplierOnboarding.step0.title')}
      subtitle={t('supplierOnboarding.step0.subtitle')}
      icon="🏨"
      onNext={handleNext}
      saving={saving}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {TYPE_KEYS.map(typeKey => {
          const label = t(`supplierOnboarding.step0.types.${typeKey}.l`);
          const desc  = t(`supplierOnboarding.step0.types.${typeKey}.d`);
          return (
            <button
              key={typeKey}
              onClick={() => setHt(typeKey)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all
                ${ht === typeKey ? 'border-[#FF6B35] bg-orange-50' : 'border-gray-100 hover:border-orange-200'}`}
            >
              <span className="text-2xl">{TYPE_ICONS[typeKey]}</span>
              <span className={`text-xs font-semibold ${ht === typeKey ? 'text-[#FF6B35]' : 'text-gray-700'}`}>
                {label}
              </span>
              <span className="text-[10px] text-gray-400">{desc}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-5">
        <p className="text-sm font-medium text-gray-700 mb-3">
          {t('supplierOnboarding.step0.hotelsCount')}
        </p>
        <div className="flex gap-3">
          {[
            { v: 'SINGLE',   l: t('supplierOnboarding.step0.single') },
            { v: 'MULTIPLE', l: t('supplierOnboarding.step0.multiple') },
          ].map(o => (
            <button
              key={o.v}
              onClick={() => setHc(o.v as HotelsCount)}
              className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all
                ${hc === o.v ? 'border-[#FF6B35] bg-orange-50 text-[#FF6B35]' : 'border-gray-100 text-gray-600'}`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">
          {t('supplierOnboarding.step0.listedOn')}
        </p>
        <div className="flex flex-wrap gap-2">
          {PLATFORM_KEYS.map(p => (
            <button
              key={p}
              onClick={() => toggleP(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                ${lo.includes(p) ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              {PLATFORM_LABELS[p] || t(`supplierOnboarding.step0.${p}`)}
            </button>
          ))}
        </div>
      </div>
    </StepLayout>
  );
}
