import { useState, useEffect } from 'react';
import { StepLayout } from '../components/StepLayout';
import { supplierService } from '../../services/supplierService';
import { useLanguage } from '../../../../hooks/useLanguage';

const ic = "w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]";
const lc = "block text-xs font-medium text-gray-600 mb-1";

const BREAKFAST_TYPES = [
  { v: 'HALAL',       ar: 'حلال',   en: 'Halal',       ms: 'Halal' },
  { v: 'CONTINENTAL', ar: 'قاري',   en: 'Continental', ms: 'Kontinental' },
  { v: 'BUFFET',      ar: 'بوفيه',  en: 'Buffet',      ms: 'Bufet' },
  { v: 'ASIAN',       ar: 'آسيوي',  en: 'Asian',       ms: 'Asia' },
  { v: 'AMERICAN',    ar: 'أمريكي', en: 'American',    ms: 'Amerika' },
];

const LANGS = [
  { v: 'ar', l: 'العربية' },
  { v: 'en', l: 'English' },
  { v: 'fr', l: 'Français' },
  { v: 'ms', l: 'Melayu' },
  { v: 'zh', l: '中文' },
];

interface Props {
  onNext: () => void;
  onBack: () => void;
  onRefresh: () => Promise<void>;
  setSaving: (v: boolean) => void;
  setError: (e: string | null) => void;
  saving: boolean;
  error: string | null;
}

export function Step2Services({ onNext, onBack, onRefresh, setSaving, setError, saving, error }: Props) {
  const { t, lang } = useLanguage();
  const [f, setF] = useState({
    breakfast_available: false, breakfast_included: false, breakfast_price: '',
    breakfast_currency: 'MYR', breakfast_types: [] as string[],
    parking_available: 'NO', parking_price: '', parking_price_unit: 'DAY',
    parking_reservation: false, parking_location: 'ON_SITE', parking_private: true,
    spoken_languages: [] as string[],
    checkin_from: '14:00', checkin_until: '23:00',
    checkout_from: '07:00', checkout_until: '12:00',
    children_allowed: true, pets_policy: 'ON_REQUEST', pets_free: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supplierService.getServices().then(d => setF(x => ({ ...x, ...d }))).finally(() => setLoading(false));
  }, []);

  const s = (k: string, v: unknown) => setF(x => ({ ...x, [k]: v }));
  const tl = (k: string, v: string) => setF(x => ({
    ...x,
    [k]: (x as Record<string, string[]>)[k].includes(v)
      ? (x as Record<string, string[]>)[k].filter((i: string) => i !== v)
      : [...(x as Record<string, string[]>)[k], v],
  }));

  const L = {
    title:           lang === 'ar' ? 'الخدمات وقواعد المنزل' : lang === 'ms' ? 'Perkhidmatan & Peraturan'   : 'Services & House Rules',
    subtitle:        lang === 'ar' ? 'إفطار، موقف، لغات، أوقات' : lang === 'ms' ? 'Sarapan, parkir, bahasa, masa' : 'Breakfast, parking, languages, hours',
    nextLabel:       lang === 'ar' ? 'التالي — الأوصاف →'  : lang === 'ms' ? 'Seterusnya — Penerangan →' : 'Next — Description →',
    breakfast:       lang === 'ar' ? 'الإفطار'             : lang === 'ms' ? 'Sarapan'                  : 'Breakfast',
    included:        lang === 'ar' ? 'مشمول'              : lang === 'ms' ? 'Termasuk'                : 'Included',
    paid:            lang === 'ar' ? 'مدفوع'              : lang === 'ms' ? 'Berbayar'                : 'Paid',
    price:           lang === 'ar' ? 'السعر'              : lang === 'ms' ? 'Harga'                   : 'Price',
    parking:         lang === 'ar' ? 'موقف السيارات'      : lang === 'ms' ? 'Tempat Letak Kereta'      : 'Parking',
    parkingNo:       lang === 'ar' ? 'لا يوجد'            : lang === 'ms' ? 'Tiada'                   : 'None',
    parkingFree:     lang === 'ar' ? 'مجاني'              : lang === 'ms' ? 'Percuma'                 : 'Free',
    parkingPaid:     lang === 'ar' ? 'مدفوع'              : lang === 'ms' ? 'Berbayar'                : 'Paid',
    parkingPriceDay: lang === 'ar' ? 'السعر يومياً'        : lang === 'ms' ? 'Harga sehari'            : 'Price per day',
    languages:       lang === 'ar' ? 'اللغات'             : lang === 'ms' ? 'Bahasa'                  : 'Languages',
    timesTitle:      lang === 'ar' ? 'أوقات الوصول والمغادرة' : lang === 'ms' ? 'Masa Daftar Masuk/Keluar' : 'Check-in / Check-out times',
    checkinFrom:     lang === 'ar' ? 'وصول من'            : lang === 'ms' ? 'Daftar masuk dari'       : 'Check-in from',
    checkinUntil:    lang === 'ar' ? 'وصول حتى'           : lang === 'ms' ? 'Daftar masuk hingga'     : 'Check-in until',
    checkoutFrom:    lang === 'ar' ? 'مغادرة من'          : lang === 'ms' ? 'Daftar keluar dari'      : 'Check-out from',
    checkoutUntil:   lang === 'ar' ? 'مغادرة حتى'         : lang === 'ms' ? 'Daftar keluar hingga'    : 'Check-out until',
    rules:           lang === 'ar' ? 'قواعد'             : lang === 'ms' ? 'Peraturan'               : 'Rules',
    childrenAllowed: lang === 'ar' ? 'الأطفال مسموح'      : lang === 'ms' ? 'Kanak-kanak dibenarkan'   : 'Children allowed',
    pets:            lang === 'ar' ? 'الحيوانات'          : lang === 'ms' ? 'Haiwan peliharaan'        : 'Pets',
    petsYes:         lang === 'ar' ? 'مسموح'              : lang === 'ms' ? 'Dibenarkan'              : 'Allowed',
    petsOnReq:       lang === 'ar' ? 'عند الطلب'          : lang === 'ms' ? 'Atas permintaan'          : 'On request',
    petsNo:          lang === 'ar' ? 'لا'                : lang === 'ms' ? 'Tidak'                   : 'No',
  };

  const handleNext = async () => {
    setSaving(true);
    setError(null);
    try {
      await supplierService.saveServices(f as never);
      await onRefresh();
      onNext();
    } catch {
      setError(t('supplierOnboarding.common.error'));
    } finally {
      setSaving(false);
    }
  };

  const Tog = ({ val, onChange }: { val: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!val)}
      className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${val ? 'bg-[#FF6B35]' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${val ? 'left-5' : 'left-0.5'}`} />
    </button>
  );

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-7 h-7 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <StepLayout
      title={L.title}
      icon="🛎"
      subtitle={L.subtitle}
      onBack={onBack}
      onNext={handleNext}
      nextLabel={L.nextLabel}
      saving={saving}
      error={error}
    >
      <div className="space-y-5">
        {/* Breakfast */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700">🍳 {L.breakfast}</p>
            <Tog val={f.breakfast_available} onChange={v => s('breakfast_available', v)} />
          </div>
          {f.breakfast_available && (
            <div className="space-y-2 border-r-2 border-orange-100 pr-3">
              <div className="flex items-center gap-2">
                <Tog val={f.breakfast_included} onChange={v => s('breakfast_included', v)} />
                <span className="text-xs text-gray-600">{f.breakfast_included ? L.included : L.paid}</span>
              </div>
              {!f.breakfast_included && (
                <div className="flex gap-2">
                  <input
                    className={ic + ' flex-1'} type="number" placeholder={L.price}
                    value={f.breakfast_price} onChange={e => s('breakfast_price', e.target.value)}
                  />
                  <select className={ic + ' w-20'} value={f.breakfast_currency} onChange={e => s('breakfast_currency', e.target.value)}>
                    {['MYR', 'USD', 'EUR'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {BREAKFAST_TYPES.map(b => (
                  <button
                    key={b.v}
                    onClick={() => tl('breakfast_types', b.v)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all
                      ${f.breakfast_types.includes(b.v) ? 'bg-[#FF6B35] text-white border-[#FF6B35]' : 'bg-white text-gray-600 border-gray-200'}`}
                  >
                    {b[lang as 'ar' | 'en' | 'ms']}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Parking */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">🚗 {L.parking}</p>
          <div className="flex gap-2 mb-2">
            {[
              { v: 'NO',   l: L.parkingNo },
              { v: 'FREE', l: L.parkingFree },
              { v: 'PAID', l: L.parkingPaid },
            ].map(o => (
              <button
                key={o.v}
                onClick={() => s('parking_available', o.v)}
                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all
                  ${f.parking_available === o.v ? 'bg-[#FF6B35] text-white border-[#FF6B35]' : 'border-gray-200 text-gray-600'}`}
              >
                {o.l}
              </button>
            ))}
          </div>
          {f.parking_available === 'PAID' && (
            <input className={ic} type="number" placeholder={L.parkingPriceDay} value={f.parking_price} onChange={e => s('parking_price', e.target.value)} />
          )}
        </div>

        {/* Languages */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">🌐 {L.languages}</p>
          <div className="flex flex-wrap gap-2">
            {LANGS.map(l => (
              <button
                key={l.v}
                onClick={() => tl('spoken_languages', l.v)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all
                  ${f.spoken_languages.includes(l.v) ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]' : 'bg-white text-gray-600 border-gray-200'}`}
              >
                {l.l}
              </button>
            ))}
          </div>
        </div>

        {/* Times */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">🕐 {L.timesTitle}</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lc}>{L.checkinFrom}</label><input className={ic} type="time" value={f.checkin_from} onChange={e => s('checkin_from', e.target.value)} /></div>
            <div><label className={lc}>{L.checkinUntil}</label><input className={ic} type="time" value={f.checkin_until} onChange={e => s('checkin_until', e.target.value)} /></div>
            <div><label className={lc}>{L.checkoutFrom}</label><input className={ic} type="time" value={f.checkout_from} onChange={e => s('checkout_from', e.target.value)} /></div>
            <div><label className={lc}>{L.checkoutUntil}</label><input className={ic} type="time" value={f.checkout_until} onChange={e => s('checkout_until', e.target.value)} /></div>
          </div>
        </div>

        {/* Rules */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">📋 {L.rules}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{L.childrenAllowed}</span>
              <Tog val={f.children_allowed} onChange={v => s('children_allowed', v)} />
            </div>
            <div>
              <span className="text-sm text-gray-600 block mb-1">{L.pets}</span>
              <div className="flex gap-2">
                {[
                  { v: 'YES',        l: L.petsYes },
                  { v: 'ON_REQUEST', l: L.petsOnReq },
                  { v: 'NO',         l: L.petsNo },
                ].map(o => (
                  <button
                    key={o.v}
                    onClick={() => s('pets_policy', o.v)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all
                      ${f.pets_policy === o.v ? 'bg-[#FF6B35] text-white border-[#FF6B35]' : 'border-gray-200 text-gray-600'}`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StepLayout>
  );
}
