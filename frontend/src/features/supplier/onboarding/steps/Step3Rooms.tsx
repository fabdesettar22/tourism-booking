import { useState, useEffect } from 'react';
import { StepLayout } from '../components/StepLayout';
import { supplierService } from '../../services/supplierService';
import type { HotelRoomType, BedType } from '../../../../types/supplier';
import { useLanguage } from '../../../../hooks/useLanguage';

const ic = "w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]";
const lc = "block text-xs font-medium text-gray-600 mb-1";
const RT  = ['DOUBLE','TWIN','SINGLE','TRIPLE','SUITE','FAMILY','STUDIO','DELUXE'];
const BDT = ['SINGLE','QUEEN','KING','FULL','BUNK','SOFA_BED'];
const BI  = ['SHOWER','TOILET','HAIRDRYER','BATHTUB','FREE_TOILETRIES','BIDET'];
const RA  = ['AC','TV','LINENS','DESK','SAFE','WARDROBE','BALCONY','KETTLE'];

const emptyR = () => ({
  room_unit_type:'DOUBLE', room_count:1,
  beds: [{ type:'QUEEN' as BedType, count:1 }],
  max_guests:2, area_sqm:'', smoking_allowed:false,
  bathroom_private:true,
  bathroom_items:['SHOWER','TOILET'], room_amenities:['AC','TV'],
  room_name:'DOUBLE', cost_price_per_night:'', cost_currency:'MYR',
  occupancy_prices:[],
});

interface Props {
  onNext: () => void; onBack: () => void;
  onRefresh: () => Promise<void>;
  setSaving: (v: boolean) => void; setError: (e: string|null) => void;
  saving: boolean; error: string|null;
}

export function Step3Rooms({ onNext, onBack, onRefresh, setSaving, setError, saving, error }: Props) {
  const { t } = useLanguage();
  const [rooms, setRooms] = useState<HotelRoomType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyR());
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    supplierService.getRooms()
      .then(({ rooms: r }) => setRooms(r))
      .finally(() => setLoading(false));
  }, []);

  const s = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const tl = (k: string, v: string) => setForm(f => ({
    ...f,
    [k]: (f as Record<string, string[]>)[k].includes(v)
      ? (f as Record<string, string[]>)[k].filter((i: string) => i !== v)
      : [...(f as Record<string, string[]>)[k], v],
  }));
  const addBed    = () => setForm(f => ({ ...f, beds: [...f.beds, { type: 'SINGLE' as BedType, count: 1 }] }));
  const removeBed = (i: number) => setForm(f => ({ ...f, beds: f.beds.filter((_, x) => x !== i) }));
  const setBed    = (i: number, k: string, v: unknown) => setForm(f => ({
    ...f,
    beds: f.beds.map((b: { type: BedType; count: number }, x: number) => x === i ? { ...b, [k]: v } : b),
  }));

  const handleAdd = async () => {
    if (!form.cost_price_per_night) { setError(t('supplierOnboarding.rooms.costRequired')); return; }
    setAdding(true); setError(null);
    try {
      const r = await supplierService.addRoom(form as never);
      setRooms(x => [...x, r.data]);
      setShowForm(false); setForm(emptyR());
      await onRefresh();
    } catch (e: unknown) {
      const err = e as Record<string, string[]>;
      setError(Object.values(err).flat().join(' — ') || t('supplierOnboarding.rooms.genericError'));
    } finally {
      setAdding(false);
    }
  };

  const del = async (id: string) => {
    try {
      await supplierService.deleteRoom(id);
      setRooms(r => r.filter(x => x.id !== id));
      await onRefresh();
    } catch {
      setError(t('supplierOnboarding.rooms.deleteFailed'));
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-7 h-7 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <StepLayout
      title={t('supplierOnboarding.rooms.title')}
      icon="🛏"
      subtitle={t('supplierOnboarding.rooms.subtitleN').replace('{n}', String(rooms.length))}
      onBack={onBack}
      onNext={onNext}
      nextLabel={t('supplierOnboarding.rooms.nextLabel')}
      saving={saving}
      canProceed={rooms.length > 0}
      error={error}
    >
      {rooms.length > 0 && (
        <div className="space-y-2 mb-4">
          {rooms.map(r => (
            <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-xl">🛏</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {t(`supplierOnboarding.rooms.types.${r.room_unit_type}`)} × {r.room_count}
                  </p>
                  <p className="text-xs text-gray-500">
                    {r.cost_price_per_night} {r.cost_currency} {t('supplierOnboarding.rooms.perNight')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => del(r.id)}
                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 border-2 border-dashed border-[#FF6B35] rounded-xl text-[#FF6B35] text-sm font-medium hover:bg-orange-50"
        >
          {t('supplierOnboarding.rooms.addRoom')}
        </button>
      )}

      {showForm && (
        <div className="border-2 border-orange-200 rounded-xl p-4 space-y-4 bg-orange-50/20">
          <div className="flex justify-between">
            <p className="text-sm font-bold text-gray-700">{t('supplierOnboarding.rooms.newRoom')}</p>
            <button onClick={() => { setShowForm(false); setForm(emptyR()); }} className="text-xs text-gray-400">
              {t('supplierOnboarding.rooms.cancel')}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lc}>{t('supplierOnboarding.rooms.type')}</label>
              <select className={ic} value={form.room_unit_type} onChange={e => s('room_unit_type', e.target.value)}>
                {RT.map(rt => <option key={rt} value={rt}>{t(`supplierOnboarding.rooms.types.${rt}`)}</option>)}
              </select>
            </div>
            <div>
              <label className={lc}>{t('supplierOnboarding.rooms.count')}</label>
              <input className={ic} type="number" min="1" value={form.room_count} onChange={e => s('room_count', Number(e.target.value))} />
            </div>
            <div>
              <label className={lc}>{t('supplierOnboarding.rooms.maxGuests')}</label>
              <input className={ic} type="number" min="1" value={form.max_guests} onChange={e => s('max_guests', Number(e.target.value))} />
            </div>
            <div>
              <label className={lc}>{t('supplierOnboarding.rooms.area')}</label>
              <input className={ic} type="number" value={form.area_sqm} onChange={e => s('area_sqm', e.target.value)} placeholder="28" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={lc}>{t('supplierOnboarding.rooms.beds')}</label>
              <button onClick={addBed} className="text-xs text-[#FF6B35]">{t('supplierOnboarding.rooms.addBed')}</button>
            </div>
            {form.beds.map((b: { type: BedType; count: number }, i: number) => (
              <div key={i} className="flex gap-2 mb-2">
                <select className={ic + ' flex-1'} value={b.type} onChange={e => setBed(i, 'type', e.target.value)}>
                  {BDT.map(bt => <option key={bt} value={bt}>{t(`supplierOnboarding.rooms.bedTypes.${bt}`)}</option>)}
                </select>
                <input className={ic + ' w-16'} type="number" min="1" max="4" value={b.count} onChange={e => setBed(i, 'count', Number(e.target.value))} />
                {form.beds.length > 1 && <button onClick={() => removeBed(i)} className="px-2 text-red-400">✕</button>}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className={lc}>{t('supplierOnboarding.rooms.costPerNight')}</label>
              <input className={ic} type="number" value={form.cost_price_per_night} onChange={e => s('cost_price_per_night', e.target.value)} placeholder="200" />
            </div>
            <div className="w-24">
              <label className={lc}>{t('supplierOnboarding.rooms.currency')}</label>
              <select className={ic} value={form.cost_currency} onChange={e => s('cost_currency', e.target.value)}>
                {['MYR', 'USD', 'EUR', 'AED'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={lc}>{t('supplierOnboarding.rooms.bathroomItems')}</label>
            <div className="flex flex-wrap gap-2">
              {BI.map(x => (
                <button
                  key={x}
                  onClick={() => tl('bathroom_items', x)}
                  className={`px-2 py-1 rounded-full text-xs border transition-all ${
                    form.bathroom_items.includes(x)
                      ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={lc}>{t('supplierOnboarding.rooms.roomAmenities')}</label>
            <div className="flex flex-wrap gap-2">
              {RA.map(x => (
                <button
                  key={x}
                  onClick={() => tl('room_amenities', x)}
                  className={`px-2 py-1 rounded-full text-xs border transition-all ${
                    form.room_amenities.includes(x)
                      ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="w-full py-2.5 bg-[#FF6B35] text-white rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {adding ? t('supplierOnboarding.rooms.adding') : t('supplierOnboarding.rooms.addBtn')}
          </button>
        </div>
      )}
    </StepLayout>
  );
}
