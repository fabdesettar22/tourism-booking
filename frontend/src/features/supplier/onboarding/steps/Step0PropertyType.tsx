import { useState } from 'react';
import { StepLayout } from '../components/StepLayout';
import { supplierService } from '../../services/supplierService';
import type { HotelType, HotelsCount } from '../../../../types/supplier';
const TYPES=[{v:'HOTEL',l:'فندق',d:'يقدم خدمة الاستقبال',icon:'🏨'},{v:'GUESTHOUSE',l:'بيت ضيافة',d:'أجواء منزلية',icon:'🏡'},{v:'BED_BREAKFAST',l:'Bed & Breakfast',d:'إقامة مع إفطار',icon:'🍳'},{v:'HOMESTAY',l:'Homestay',d:'مع عائلة محلية',icon:'🏠'},{v:'HOSTEL',l:'بيت شباب',d:'غرف اقتصادية',icon:'🛖'},{v:'CONDO_HOTEL',l:'شقة فندقية',d:'شقة مع خدمات',icon:'🏢'},{v:'RESORT',l:'منتجع',d:'وجهة متكاملة',icon:'🌴'},{v:'CAPSULE_HOTEL',l:'فندق كبسول',d:'غرف صغيرة حديثة',icon:'📦'},{v:'FLOATING',l:'بيت عائم',d:'على الماء',icon:'⛵'},{v:'MOTEL',l:'موتيل',d:'قرب الطرق',icon:'🚗'},{v:'LODGE',l:'لودج',d:'في الطبيعة',icon:'🏕'},{v:'RIAD',l:'رياض',d:'منزل تقليدي',icon:'🏛'}] as const;
const PLATFORMS=[{v:'airbnb',l:'Airbnb'},{v:'booking',l:'Booking.com'},{v:'agoda',l:'Agoda'},{v:'tripadvisor',l:'TripAdvisor'},{v:'vrbo',l:'VRBO'},{v:'other',l:'أخرى'},{v:'none',l:'لا شيء'}];
interface Props { onNext:()=>void; onRefresh:()=>Promise<void>; setSaving:(v:boolean)=>void; setError:(e:string|null)=>void; saving:boolean; }
export function Step0PropertyType({onNext,onRefresh,setSaving,setError,saving}:Props) {
  const [ht,setHt]=useState<HotelType>('HOTEL');
  const [hc,setHc]=useState<HotelsCount>('SINGLE');
  const [lo,setLo]=useState<string[]>([]);
  const toggleP=(v:string)=>{ if(v==='none'){setLo(['none']);return;} setLo(p=>p.includes(v)?p.filter(x=>x!==v):[...p.filter(x=>x!=='none'),v]); };
  const handleNext=async()=>{ setSaving(true); setError(null); try{ await supplierService.saveStep0({hotel_type:ht,hotels_count:hc,listed_on:lo}); await onRefresh(); onNext(); }catch{ setError('حدث خطأ.'); }finally{ setSaving(false); }};
  return (
    <StepLayout title="ما نوع عقارك؟" subtitle="اختر النوع الأقرب لعقارك" icon="🏨" onNext={handleNext} nextLabel="التالي →" saving={saving}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {TYPES.map(t=>(
          <button key={t.v} onClick={()=>setHt(t.v as HotelType)} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${ht===t.v?'border-[#FF6B35] bg-orange-50':'border-gray-100 hover:border-orange-200'}`}>
            <span className="text-2xl">{t.icon}</span>
            <span className={`text-xs font-semibold ${ht===t.v?'text-[#FF6B35]':'text-gray-700'}`}>{t.l}</span>
            <span className="text-[10px] text-gray-400">{t.d}</span>
          </button>
        ))}
      </div>
      <div className="mb-5">
        <p className="text-sm font-medium text-gray-700 mb-3">عدد الفنادق</p>
        <div className="flex gap-3">
          {[{v:'SINGLE',l:'فندق واحد'},{v:'MULTIPLE',l:'متعددة'}].map(o=>(
            <button key={o.v} onClick={()=>setHc(o.v as HotelsCount)} className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${hc===o.v?'border-[#FF6B35] bg-orange-50 text-[#FF6B35]':'border-gray-100 text-gray-600'}`}>{o.l}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">مدرج في منصات أخرى؟</p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p=>(
            <button key={p.v} onClick={()=>toggleP(p.v)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${lo.includes(p.v)?'bg-[#1A1A2E] text-white border-[#1A1A2E]':'bg-white text-gray-600 border-gray-200'}`}>{p.l}</button>
          ))}
        </div>
      </div>
    </StepLayout>
  );
}
