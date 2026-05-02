import { useState, useEffect } from 'react';
import { StepLayout } from '../components/StepLayout';
import { supplierService } from '../../services/supplierService';
import { CountryCityPicker } from '../../../../components/forms/CountryCityPicker';
import { useLanguage } from '../../../../hooks/useLanguage';

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

export function Step1BasicInfo({ onNext, onBack, onRefresh, setSaving, setError, saving, error }: Props) {
  const { t, lang, isRTL } = useLanguage();
  const [f, setF] = useState({
    hotel_name: '', star_rating: '0', is_chain: false, chain_name: '',
    address: '', address_unit: '', country: 'Malaysia', city: '',
    postal_code: '', latitude: '', longitude: '',
    has_channel_manager: false, channel_manager_name: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supplierService.getStep1().then(d => setF(x => ({ ...x, ...d }))).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const s = (k: string, v: unknown) => setF(x => ({ ...x, [k]: v }));
  const isValid = f.hotel_name.trim().length >= 2 && f.city.trim().length >= 2;

  // Local labels — only what's not in translation file
  const L = {
    notSet:        lang === 'ar' ? 'غير محدد'         : lang === 'ms' ? 'Tidak ditetapkan' : 'Not set',
    isChain:       lang === 'ar' ? 'سلسلة فندقية؟'    : lang === 'ms' ? 'Rangkaian hotel?' : 'Hotel chain?',
    chainName:     lang === 'ar' ? 'اسم السلسلة *'    : lang === 'ms' ? 'Nama Rangkaian *' : 'Chain name *',
    location:      lang === 'ar' ? 'الموقع'           : lang === 'ms' ? 'Lokasi'           : 'Location',
    addressPh:     lang === 'ar' ? 'رقم المبنى، اسم الشارع' : lang === 'ms' ? 'No. bangunan, nama jalan' : 'Building no., street name',
    postal:        lang === 'ar' ? 'الرمز البريدي'    : lang === 'ms' ? 'Poskod'           : 'Postal code',
    latitude:      lang === 'ar' ? 'خط العرض'         : lang === 'ms' ? 'Latitud'          : 'Latitude',
    longitude:     lang === 'ar' ? 'خط الطول'         : lang === 'ms' ? 'Longitud'         : 'Longitude',
    channelMgr:    'Channel Manager?',
    channelDesc:   lang === 'ar' ? 'نظام مزامنة الحجوزات' : lang === 'ms' ? 'Sistem penyelarasan tempahan' : 'Booking sync system',
    channelName:   lang === 'ar' ? 'اسم النظام'       : lang === 'ms' ? 'Nama sistem'      : 'System name',
    nextLabel:     lang === 'ar' ? 'التالي — المرافق →' : lang === 'ms' ? 'Seterusnya — Kemudahan →' : 'Next — Amenities →',
    fillNameCity:  lang === 'ar' ? 'يرجى تعبئة الاسم والمدينة.' : lang === 'ms' ? 'Sila isi nama dan bandar.' : 'Please fill name and city.',
  };

  const handleNext = async () => {
    if (!isValid) { setError(L.fillNameCity); return; }
    setSaving(true); setError(null);
    try {
      await supplierService.saveStep1(f);
      await onRefresh();
      onNext();
    } catch (e: unknown) {
      const err = e as Record<string, string[]>;
      setError(Object.values(err).flat().join(' — ') || t('supplierOnboarding.common.error'));
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
      title={t('supplierOnboarding.step1.title')}
      icon="📍"
      subtitle={t('supplierOnboarding.step1.subtitle')}
      onBack={onBack}
      onNext={handleNext}
      nextLabel={L.nextLabel}
      saving={saving}
      canProceed={isValid}
      error={error}
    >
      <div className="space-y-4">
        <div>
          <label className={lc}>{t('supplierOnboarding.step1.hotelName')} *</label>
          <input className={ic} value={f.hotel_name} onChange={e => s('hotel_name', e.target.value)} placeholder="Langkawi Beach Resort" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lc}>{t('supplierOnboarding.step1.stars')}</label>
            <select className={ic} value={f.star_rating} onChange={e => s('star_rating', e.target.value)}>
              <option value="0">{L.notSet}</option>
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={String(n)}>{n} {'⭐'.repeat(n)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lc}>{L.isChain}</label>
            <div className="flex gap-2 mt-1">
              {[
                { v: false, l: t('supplierOnboarding.common.no') },
                { v: true,  l: t('supplierOnboarding.common.yes') },
              ].map(o => (
                <button
                  key={String(o.v)}
                  onClick={() => s('is_chain', o.v)}
                  className={`flex-1 h-10 rounded-lg border text-sm font-medium transition-all
                    ${f.is_chain === o.v ? 'border-[#FF6B35] bg-orange-50 text-[#FF6B35]' : 'border-gray-200 text-gray-600'}`}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {f.is_chain && (
          <div>
            <label className={lc}>{L.chainName}</label>
            <input className={ic} value={f.chain_name} onChange={e => s('chain_name', e.target.value)} placeholder="Hilton" />
          </div>
        )}

        <div className="border-t pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{L.location}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={lc}>{t('supplierOnboarding.step1.address')} *</label>
              <input className={ic} value={f.address} onChange={e => s('address', e.target.value)} placeholder={L.addressPh} />
            </div>
            <div className="col-span-2">
              <CountryCityPicker
                isRTL={isRTL}
                required
                lockedCountryCode="MY"
                cityLabel={t('supplierOnboarding.step1.city')}
                cityName={f.city}
                onCityChange={(name) => s('city', name)}
              />
            </div>
            <div>
              <label className={lc}>{L.postal}</label>
              <input className={ic} value={f.postal_code} onChange={e => s('postal_code', e.target.value)} placeholder="50450" />
            </div>
            <div>
              <label className={lc}>{L.latitude}</label>
              <input className={ic} type="number" step="any" value={f.latitude} onChange={e => s('latitude', e.target.value)} placeholder="3.139" />
            </div>
            <div>
              <label className={lc}>{L.longitude}</label>
              <input className={ic} type="number" step="any" value={f.longitude} onChange={e => s('longitude', e.target.value)} placeholder="101.686" />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-700">{L.channelMgr}</p>
              <p className="text-xs text-gray-400">{L.channelDesc}</p>
            </div>
            <button
              onClick={() => s('has_channel_manager', !f.has_channel_manager)}
              className={`w-11 h-6 rounded-full transition-colors relative ${f.has_channel_manager ? 'bg-[#FF6B35]' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${f.has_channel_manager ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
          {f.has_channel_manager && (
            <div>
              <label className={lc}>{L.channelName}</label>
              <input className={ic} value={f.channel_manager_name} onChange={e => s('channel_manager_name', e.target.value)} placeholder="SiteMinder, Cloudbeds..." />
            </div>
          )}
        </div>
      </div>
    </StepLayout>
  );
}
