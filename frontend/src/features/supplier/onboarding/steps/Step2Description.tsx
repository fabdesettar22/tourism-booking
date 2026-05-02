import { useState, useEffect } from 'react';
import { StepLayout } from '../components/StepLayout';
import { supplierService } from '../../services/supplierService';
import { useLanguage } from '../../../../hooks/useLanguage';

const tc = "w-full p-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35] resize-none";
const ic = "w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]";
const lc = "block text-xs font-medium text-gray-600 mb-1";

interface Props {
  onNext: () => void;
  onBack: () => void;
  onRefresh: () => Promise<void>;
  setSaving: (v: boolean) => void;
  setError: (e: string | null) => void;
  saving: boolean;
  error: string | null;
}

export function Step2Description({ onNext, onBack, onRefresh, setSaving, setError, saving, error }: Props) {
  const { t, lang } = useLanguage();
  const [f, setF] = useState({
    description_property: '',
    host_name: '',
    host_bio: '',
    description_neighborhood: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supplierService.getDescription().then(d => setF(x => ({ ...x, ...d }))).finally(() => setLoading(false));
  }, []);

  const s = (k: string, v: string) => setF(x => ({ ...x, [k]: v }));

  const handleNext = async () => {
    setSaving(true);
    setError(null);
    try {
      await supplierService.saveDescription(f);
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

  // Labels (lang-specific helpers)
  const L = {
    propertyDesc:    lang === 'ar' ? 'وصف العقار (حتى 1200 حرف)' : lang === 'ms' ? 'Penerangan Hartanah (sehingga 1200 aksara)' : 'Property description (up to 1200 chars)',
    propertyDescPh:  lang === 'ar' ? 'صف فندقك وما يميزه...'    : lang === 'ms' ? 'Terangkan hotel anda...'         : 'Describe your hotel and what makes it special...',
    hostName:        lang === 'ar' ? 'اسم المضيف'              : lang === 'ms' ? 'Nama Tuan Rumah'                  : 'Host Name',
    hostBio:         lang === 'ar' ? 'نبذة عن المضيف (اختياري)' : lang === 'ms' ? 'Tentang Tuan Rumah (pilihan)'      : 'About the host (optional)',
    hostBioPh:       lang === 'ar' ? 'أخبر ضيوفك عن نفسك...'    : lang === 'ms' ? 'Beritahu tetamu tentang anda...'   : 'Tell your guests about yourself...',
    neighborhood:    lang === 'ar' ? 'وصف الحي (اختياري)'       : lang === 'ms' ? 'Penerangan Kawasan (pilihan)'      : 'Neighborhood description (optional)',
    neighborhoodPh:  lang === 'ar' ? 'المعالم القريبة، وسائل المواصلات...' : lang === 'ms' ? 'Tarikan berdekatan, pengangkutan...' : 'Nearby attractions, transportation...',
    nextLabel:       lang === 'ar' ? 'التالي — الغرف →'        : lang === 'ms' ? 'Seterusnya — Bilik →'              : 'Next — Rooms →',
  };

  return (
    <StepLayout
      title={t('supplierOnboarding.step2Description.title')}
      icon="📝"
      subtitle={t('supplierOnboarding.step2Description.subtitle')}
      onBack={onBack}
      onNext={handleNext}
      nextLabel={L.nextLabel}
      saving={saving}
      error={error}
    >
      <div className="space-y-4">
        <div>
          <label className={lc}>{L.propertyDesc}</label>
          <textarea
            className={tc} rows={5} maxLength={1200}
            value={f.description_property}
            onChange={e => s('description_property', e.target.value)}
            placeholder={L.propertyDescPh}
          />
          <p className="text-[10px] text-gray-400 mt-1 text-left">{f.description_property.length}/1200</p>
        </div>
        <div>
          <label className={lc}>{L.hostName}</label>
          <input className={ic} value={f.host_name} onChange={e => s('host_name', e.target.value)} placeholder="Ahmad Kamal" />
        </div>
        <div>
          <label className={lc}>{L.hostBio}</label>
          <textarea className={tc} rows={3} maxLength={500} value={f.host_bio} onChange={e => s('host_bio', e.target.value)} placeholder={L.hostBioPh} />
        </div>
        <div>
          <label className={lc}>{L.neighborhood}</label>
          <textarea className={tc} rows={3} maxLength={1200} value={f.description_neighborhood} onChange={e => s('description_neighborhood', e.target.value)} placeholder={L.neighborhoodPh} />
        </div>
      </div>
    </StepLayout>
  );
}
