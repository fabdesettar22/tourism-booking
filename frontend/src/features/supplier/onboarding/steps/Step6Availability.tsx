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

export function Step6Availability({ onNext, onBack, onRefresh, setSaving, setError, saving, error }: Props) {
  const { t, lang } = useLanguage();
  const [f, setF] = useState({
    availability_start: 'ASAP', availability_start_date: '',
    availability_window: 365, calendar_sync_enabled: false,
    calendar_sync_url: '', allow_long_stays: true, max_nights: 90,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supplierService.getAvailability().then(d => setF(x => ({ ...x, ...d, availability_start_date: d.availability_start_date || '' }))).finally(() => setLoading(false));
  }, []);

  const s = (k: string, v: unknown) => setF(x => ({ ...x, [k]: v }));

  const L = {
    title:           lang === 'ar' ? 'التوفر والجدول الزمني'      : lang === 'ms' ? 'Ketersediaan & Jadual'        : 'Availability & Schedule',
    subtitle:        lang === 'ar' ? 'متى يكون فندقك متاحاً؟'      : lang === 'ms' ? 'Bila hotel anda tersedia?'    : 'When is your hotel available?',
    nextLabel:       lang === 'ar' ? 'التالي — الإنهاء →'        : lang === 'ms' ? 'Seterusnya — Selesai →'      : 'Next — Finish →',
    whenStart:       lang === 'ar' ? 'متى تبدأ استقبال الحجوزات؟' : lang === 'ms' ? 'Bila mula menerima tempahan?' : 'When do you start accepting bookings?',
    asap:            lang === 'ar' ? 'في أقرب وقت'              : lang === 'ms' ? 'Secepat mungkin'             : 'As soon as possible',
    asapDesc:        lang === 'ar' ? 'فور الاعتماد'              : lang === 'ms' ? 'Sebaik diluluskan'           : 'Once approved',
    specificDate:    lang === 'ar' ? 'تاريخ محدد'                : lang === 'ms' ? 'Tarikh tertentu'             : 'Specific date',
    specificDateDesc: lang === 'ar' ? 'حدد التاريخ'             : lang === 'ms' ? 'Pilih tarikh'                : 'Select date',
    date:            lang === 'ar' ? 'التاريخ'                 : lang === 'ms' ? 'Tarikh'                     : 'Date',
    bookingWindow:   lang === 'ar' ? 'نافذة الحجز المسبق'       : lang === 'ms' ? 'Tetingkap Tempahan'           : 'Advance Booking Window',
    dayWord:         lang === 'ar' ? 'يوم'                    : lang === 'ms' ? 'hari'                       : 'day',
    daysWord:        lang === 'ar' ? 'يوم'                    : lang === 'ms' ? 'hari'                       : 'days',
    maxStay:         lang === 'ar' ? 'أقصى إقامة (ليلة)'        : lang === 'ms' ? 'Penginapan Maksimum (malam)'  : 'Max Stay (nights)',
    iCalSync:        lang === 'ar' ? 'مزامنة iCal'             : lang === 'ms' ? 'Penyelarasan iCal'           : 'iCal Sync',
    iCalDesc:        lang === 'ar' ? 'ربط مع Airbnb / Google Calendar' : lang === 'ms' ? 'Sambung dengan Airbnb / Google Calendar' : 'Connect with Airbnb / Google Calendar',
    iCalUrl:         lang === 'ar' ? 'رابط iCal'               : lang === 'ms' ? 'URL iCal'                    : 'iCal URL',
  };

  const handleNext = async () => {
    setSaving(true);
    setError(null);
    try {
      await supplierService.saveAvailability(f as never);
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
    <StepLayout title={L.title} icon="📅" subtitle={L.subtitle} onBack={onBack} onNext={handleNext} nextLabel={L.nextLabel} saving={saving} error={error}>
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">{L.whenStart}</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { v: 'ASAP',          l: L.asap,         d: L.asapDesc },
              { v: 'SPECIFIC_DATE', l: L.specificDate, d: L.specificDateDesc },
            ].map(o => (
              <button
                key={o.v}
                onClick={() => s('availability_start', o.v)}
                className={`p-3 rounded-xl border-2 text-center transition-all
                  ${f.availability_start === o.v ? 'border-[#FF6B35] bg-orange-50' : 'border-gray-100'}`}
              >
                <p className={`text-sm font-semibold ${f.availability_start === o.v ? 'text-[#FF6B35]' : 'text-gray-700'}`}>{o.l}</p>
                <p className="text-xs text-gray-400">{o.d}</p>
              </button>
            ))}
          </div>
          {f.availability_start === 'SPECIFIC_DATE' && (
            <div className="mt-3">
              <label className={lc}>{L.date}</label>
              <input className={ic} type="date" value={f.availability_start_date} onChange={e => s('availability_start_date', e.target.value)} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lc}>{L.bookingWindow}</label>
            <select className={ic} value={f.availability_window} onChange={e => s('availability_window', Number(e.target.value))}>
              {[30, 90, 180, 365].map(d => <option key={d} value={d}>{d} {L.daysWord}</option>)}
            </select>
          </div>
          <div>
            <label className={lc}>{L.maxStay}</label>
            <input className={ic} type="number" min="1" value={f.max_nights} onChange={e => s('max_nights', Number(e.target.value))} />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-700">{L.iCalSync}</p>
            <p className="text-xs text-gray-400">{L.iCalDesc}</p>
          </div>
          <Tog val={f.calendar_sync_enabled} onChange={v => s('calendar_sync_enabled', v)} />
        </div>
        {f.calendar_sync_enabled && (
          <div>
            <label className={lc}>{L.iCalUrl}</label>
            <input className={ic} value={f.calendar_sync_url} onChange={e => s('calendar_sync_url', e.target.value)} placeholder="https://..." />
          </div>
        )}
      </div>
    </StepLayout>
  );
}
