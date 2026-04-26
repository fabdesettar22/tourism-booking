import { useState, useEffect } from 'react';
import { StepLayout } from '../components/StepLayout';
import { supplierService } from '../../services/supplierService';
const ic="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]";
const lc="block text-xs font-medium text-gray-600 mb-1";
interface Props { onNext:()=>void; onBack:()=>void; onRefresh:()=>Promise<void>; setSaving:(v:boolean)=>void; setError:(e:string|null)=>void; saving:boolean; error:string|null; }
export function Step5Pricing({onNext,onBack,onRefresh,setSaving,setError,saving,error}:Props) {
  const [f,setF]=useState({booking_type:'INSTANT',cancellation_deadline_days:7,cancellation_fee_type:'FIRST_NIGHT',accidental_booking_protection:true,children_pricing_enabled:true,infant_age_from:0,infant_age_to:2,infant_price:'0',infant_price_type:'FREE',children_age_from:3,children_age_to:12,children_price:'',children_price_type:'FREE',launch_discount_enabled:true,launch_discount_pct:'20',launch_discount_bookings:3,launch_discount_days:90});
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ supplierService.getPricing().then(d=>setF(x=>({...x,...d}))).finally(()=>setLoading(false)); },[]);
  const s=(k:string,v:unknown)=>setF(x=>({...x,[k]:v}));
  const handleNext=async()=>{ setSaving(true);setError(null); try{ await supplierService.savePricing(f as never); await onRefresh(); onNext(); }catch{ setError('حدث خطأ.'); }finally{ setSaving(false); }};
  const Tog=({val,onChange}:{val:boolean;onChange:(v:boolean)=>void})=>(<button onClick={()=>onChange(!val)} className={`w-10 h-5 rounded-full relative ${val?'bg-[#FF6B35]':'bg-gray-200'}`}><span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${val?'left-5':'left-0.5'}`}/></button>);
  if(loading) return <div className="flex justify-center py-20"><div className="w-7 h-7 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"/></div>;
  return (
    <StepLayout title="إعدادات التسعير" icon="💰" subtitle="نوع الحجز، إلغاء، أطفال" onBack={onBack} onNext={handleNext} nextLabel="التالي — خطط الأسعار →" saving={saving} error={error}>
      <div className="space-y-5">
        <div><p className="text-sm font-semibold text-gray-700 mb-2">نوع الحجز</p>
          <div className="grid grid-cols-2 gap-3">{[{v:'INSTANT',l:'فوري',d:'يتأكد تلقائياً'},{v:'REQUEST',l:'بطلب',d:'تقبل خلال 24 ساعة'}].map(o=>(
            <button key={o.v} onClick={()=>s('booking_type',o.v)} className={`p-4 rounded-xl border-2 text-center transition-all ${f.booking_type===o.v?'border-[#FF6B35] bg-orange-50':'border-gray-100'}`}>
              <p className={`text-sm font-semibold ${f.booking_type===o.v?'text-[#FF6B35]':'text-gray-700'}`}>{o.l}</p>
              <p className="text-xs text-gray-400">{o.d}</p>
            </button>
          ))}</div>
        </div>
        <div><p className="text-sm font-semibold text-gray-700 mb-2">سياسة الإلغاء</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lc}>إلغاء مجاني (أيام قبل)</label><select className={ic} value={f.cancellation_deadline_days} onChange={e=>s('cancellation_deadline_days',Number(e.target.value))}>{[1,5,7,14,30].map(d=><option key={d} value={d}>{d} أيام</option>)}</select></div>
            <div><label className={lc}>رسوم الإلغاء</label><select className={ic} value={f.cancellation_fee_type} onChange={e=>s('cancellation_fee_type',e.target.value)}><option value="FIRST_NIGHT">الليلة الأولى</option><option value="FULL_AMOUNT">100% كامل</option></select></div>
          </div>
        </div>
        <div><div className="flex items-center justify-between mb-2"><p className="text-sm font-semibold text-gray-700">أسعار الأطفال</p><Tog val={f.children_pricing_enabled} onChange={v=>s('children_pricing_enabled',v)}/></div>
          {f.children_pricing_enabled&&<div className="grid grid-cols-3 gap-2 border border-gray-100 rounded-xl p-3">
            <div><label className={lc}>رضيع من</label><input className={ic} type="number" value={f.infant_age_from} onChange={e=>s('infant_age_from',Number(e.target.value))}/></div>
            <div><label className={lc}>إلى</label><input className={ic} type="number" value={f.infant_age_to} onChange={e=>s('infant_age_to',Number(e.target.value))}/></div>
            <div><label className={lc}>السعر</label><select className={ic} value={f.infant_price_type} onChange={e=>s('infant_price_type',e.target.value)}><option value="FREE">مجاني</option><option value="FIXED">ثابت</option></select></div>
          </div>}
        </div>
        <div><div className="flex items-center justify-between mb-2"><div><p className="text-sm font-semibold text-gray-700">خصم الإطلاق</p><p className="text-xs text-gray-400">للحجوزات الأولى</p></div><Tog val={f.launch_discount_enabled} onChange={v=>s('launch_discount_enabled',v)}/></div>
          {f.launch_discount_enabled&&<div className="grid grid-cols-3 gap-2 border border-gray-100 rounded-xl p-3">
            <div><label className={lc}>الخصم %</label><input className={ic} type="number" min="5" max="50" value={f.launch_discount_pct} onChange={e=>s('launch_discount_pct',e.target.value)}/></div>
            <div><label className={lc}>عدد الحجوزات</label><input className={ic} type="number" value={f.launch_discount_bookings} onChange={e=>s('launch_discount_bookings',Number(e.target.value))}/></div>
            <div><label className={lc}>صلاحية (يوم)</label><input className={ic} type="number" value={f.launch_discount_days} onChange={e=>s('launch_discount_days',Number(e.target.value))}/></div>
          </div>}
        </div>
      </div>
    </StepLayout>
  );
}
