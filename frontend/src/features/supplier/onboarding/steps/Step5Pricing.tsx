import { useState, useEffect } from 'react';
import { StepLayout } from '../components/StepLayout';
import { supplierService } from '../../services/supplierService';
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

export function Step5Pricing({ onNext, onBack, onRefresh, setSaving, setError, saving, error }: Props) {
  const { t, lang } = useLanguage();
  const [f, setF] = useState({
    booking_type: 'INSTANT', cancellation_deadline_days: 7,
    cancellation_fee_type: 'FIRST_NIGHT', accidental_booking_protection: true,
    children_pricing_enabled: true, infant_age_from: 0, infant_age_to: 2,
    infant_price: '0', infant_price_type: 'FREE',
    children_age_from: 3, children_age_to: 12, children_price: '', children_price_type: 'FREE',
    launch_discount_enabled: true, launch_discount_pct: '20',
    launch_discount_bookings: 3, launch_discount_days: 90,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supplierService.getPricing().then(d => setF(x => ({ ...x, ...d }))).finally(() => setLoading(false));
  }, []);

  const s = (k: string, v: unknown) => setF(x => ({ ...x, [k]: v }));

  const L = {
    title:           lang === 'ar' ? 'إعدادات التسعير'         : lang === 'ms' ? 'Tetapan Harga'              : 'Pricing Settings',
    subtitle:        lang === 'ar' ? 'نوع الحجز، إلغاء، أطفال'  : lang === 'ms' ? 'Jenis tempahan, batal, anak' : 'Booking type, cancellation, children',
    nextLabel:       lang === 'ar' ? 'التالي — خطط الأسعار →'   : lang === 'ms' ? 'Seterusnya — Pelan Harga →' : 'Next — Price Plans →',
    bookingType:     lang === 'ar' ? 'نوع الحجز'              : lang === 'ms' ? 'Jenis Tempahan'             : 'Booking Type',
    instant:         lang === 'ar' ? 'فوري'                   : lang === 'ms' ? 'Segera'                    : 'Instant',
    instantDesc:     lang === 'ar' ? 'يتأكد تلقائياً'          : lang === 'ms' ? 'Disahkan automatik'        : 'Auto-confirmed',
    onRequest:       lang === 'ar' ? 'بطلب'                   : lang === 'ms' ? 'Atas permintaan'           : 'On request',
    onRequestDesc:   lang === 'ar' ? 'تقبل خلال 24 ساعة'      : lang === 'ms' ? 'Diterima dalam 24 jam'     : 'Accept within 24h',
    cancelPolicy:    lang === 'ar' ? 'سياسة الإلغاء'          : lang === 'ms' ? 'Polisi Pembatalan'         : 'Cancellation Policy',
    freeCancel:      lang === 'ar' ? 'إلغاء مجاني (أيام قبل)' : lang === 'ms' ? 'Batal percuma (hari sebelum)' : 'Free cancellation (days before)',
    daysWord:        lang === 'ar' ? 'أيام'                  : lang === 'ms' ? 'hari'                     : 'days',
    cancelFee:       lang === 'ar' ? 'رسوم الإلغاء'          : lang === 'ms' ? 'Caj Pembatalan'            : 'Cancellation Fee',
    firstNight:      lang === 'ar' ? 'الليلة الأولى'          : lang === 'ms' ? 'Malam pertama'            : 'First night',
    fullAmount:      lang === 'ar' ? '100% كامل'             : lang === 'ms' ? '100% penuh'              : '100% full',
    childrenPricing: lang === 'ar' ? 'أسعار الأطفال'          : lang === 'ms' ? 'Harga Kanak-kanak'        : 'Children Pricing',
    infantFrom:      lang === 'ar' ? 'رضيع من'                : lang === 'ms' ? 'Bayi dari'                : 'Infant from',
    toAge:           lang === 'ar' ? 'إلى'                   : lang === 'ms' ? 'hingga'                  : 'to',
    price:           lang === 'ar' ? 'السعر'                  : lang === 'ms' ? 'Harga'                   : 'Price',
    free:            lang === 'ar' ? 'مجاني'                  : lang === 'ms' ? 'Percuma'                 : 'Free',
    fixed:           lang === 'ar' ? 'ثابت'                  : lang === 'ms' ? 'Tetap'                   : 'Fixed',
    launchDiscount:  lang === 'ar' ? 'خصم الإطلاق'           : lang === 'ms' ? 'Diskaun Pelancaran'       : 'Launch Discount',
    forFirstBookings: lang === 'ar' ? 'للحجوزات الأولى'       : lang === 'ms' ? 'Untuk tempahan pertama'    : 'For first bookings',
    discountPct:     lang === 'ar' ? 'الخصم %'               : lang === 'ms' ? 'Diskaun %'                : 'Discount %',
    bookingsCount:   lang === 'ar' ? 'عدد الحجوزات'          : lang === 'ms' ? 'Bilangan tempahan'         : 'Bookings count',
    validityDays:    lang === 'ar' ? 'صلاحية (يوم)'          : lang === 'ms' ? 'Sah (hari)'               : 'Valid (days)',
  };

  const handleNext = async () => {
    setSaving(true);
    setError(null);
    try {
      await supplierService.savePricing(f as never);
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
      className={`w-10 h-5 rounded-full relative ${val ? 'bg-[#FF6B35]' : 'bg-gray-200'}`}
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
    <StepLayout title={L.title} icon="💰" subtitle={L.subtitle} onBack={onBack} onNext={handleNext} nextLabel={L.nextLabel} saving={saving} error={error}>
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">{L.bookingType}</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { v: 'INSTANT', l: L.instant,   d: L.instantDesc },
              { v: 'REQUEST', l: L.onRequest, d: L.onRequestDesc },
            ].map(o => (
              <button
                key={o.v}
                onClick={() => s('booking_type', o.v)}
                className={`p-4 rounded-xl border-2 text-center transition-all
                  ${f.booking_type === o.v ? 'border-[#FF6B35] bg-orange-50' : 'border-gray-100'}`}
              >
                <p className={`text-sm font-semibold ${f.booking_type === o.v ? 'text-[#FF6B35]' : 'text-gray-700'}`}>{o.l}</p>
                <p className="text-xs text-gray-400">{o.d}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">{L.cancelPolicy}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lc}>{L.freeCancel}</label>
              <select className={ic} value={f.cancellation_deadline_days} onChange={e => s('cancellation_deadline_days', Number(e.target.value))}>
                {[1, 5, 7, 14, 30].map(d => <option key={d} value={d}>{d} {L.daysWord}</option>)}
              </select>
            </div>
            <div>
              <label className={lc}>{L.cancelFee}</label>
              <select className={ic} value={f.cancellation_fee_type} onChange={e => s('cancellation_fee_type', e.target.value)}>
                <option value="FIRST_NIGHT">{L.firstNight}</option>
                <option value="FULL_AMOUNT">{L.fullAmount}</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700">{L.childrenPricing}</p>
            <Tog val={f.children_pricing_enabled} onChange={v => s('children_pricing_enabled', v)} />
          </div>
          {f.children_pricing_enabled && (
            <div className="grid grid-cols-3 gap-2 border border-gray-100 rounded-xl p-3">
              <div><label className={lc}>{L.infantFrom}</label><input className={ic} type="number" value={f.infant_age_from} onChange={e => s('infant_age_from', Number(e.target.value))} /></div>
              <div><label className={lc}>{L.toAge}</label><input className={ic} type="number" value={f.infant_age_to} onChange={e => s('infant_age_to', Number(e.target.value))} /></div>
              <div>
                <label className={lc}>{L.price}</label>
                <select className={ic} value={f.infant_price_type} onChange={e => s('infant_price_type', e.target.value)}>
                  <option value="FREE">{L.free}</option>
                  <option value="FIXED">{L.fixed}</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-gray-700">{L.launchDiscount}</p>
              <p className="text-xs text-gray-400">{L.forFirstBookings}</p>
            </div>
            <Tog val={f.launch_discount_enabled} onChange={v => s('launch_discount_enabled', v)} />
          </div>
          {f.launch_discount_enabled && (
            <div className="grid grid-cols-3 gap-2 border border-gray-100 rounded-xl p-3">
              <div><label className={lc}>{L.discountPct}</label><input className={ic} type="number" min="5" max="50" value={f.launch_discount_pct} onChange={e => s('launch_discount_pct', e.target.value)} /></div>
              <div><label className={lc}>{L.bookingsCount}</label><input className={ic} type="number" value={f.launch_discount_bookings} onChange={e => s('launch_discount_bookings', Number(e.target.value))} /></div>
              <div><label className={lc}>{L.validityDays}</label><input className={ic} type="number" value={f.launch_discount_days} onChange={e => s('launch_discount_days', Number(e.target.value))} /></div>
            </div>
          )}
        </div>
      </div>
    </StepLayout>
  );
}
