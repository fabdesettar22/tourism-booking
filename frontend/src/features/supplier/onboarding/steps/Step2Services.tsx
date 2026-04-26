import { useState, useEffect } from 'react';
import { StepLayout } from '../components/StepLayout';
import { supplierService } from '../../services/supplierService';
const ic="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]";
const lc="block text-xs font-medium text-gray-600 mb-1";
const BT=[{v:'HALAL',l:'حلال'},{v:'CONTINENTAL',l:'قاري'},{v:'BUFFET',l:'بوفيه'},{v:'ASIAN',l:'آسيوي'},{v:'AMERICAN',l:'أمريكي'}];
const LANGS=[{v:'ar',l:'العربية'},{v:'en',l:'English'},{v:'fr',l:'Français'},{v:'ms',l:'Melayu'},{v:'zh',l:'中文'}];
interface Props { onNext:()=>void; onBack:()=>void; onRefresh:()=>Promise<void>; setSaving:(v:boolean)=>void; setError:(e:string|null)=>void; saving:boolean; error:string|null; }
export function Step2Services({onNext,onBack,onRefresh,setSaving,setError,saving,error}:Props) {
  const [f,setF]=useState({breakfast_available:false,breakfast_included:false,breakfast_price:'',breakfast_currency:'MYR',breakfast_types:[] as string[],parking_available:'NO',parking_price:'',parking_price_unit:'DAY',parking_reservation:false,parking_location:'ON_SITE',parking_private:true,spoken_languages:[] as string[],checkin_from:'14:00',checkin_until:'23:00',checkout_from:'07:00',checkout_until:'12:00',children_allowed:true,pets_policy:'ON_REQUEST',pets_free:true});
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ supplierService.getServices().then(d=>setF(x=>({...x,...d}))).finally(()=>setLoading(false)); },[]);
  const s=(k:string,v:unknown)=>setF(x=>({...x,[k]:v}));
  const tl=(k:string,v:string)=>setF(x=>({...x,[k]:(x as Record<string,string[]>)[k].includes(v)?(x as Record<string,string[]>)[k].filter((i:string)=>i!==v):[...(x as Record<string,string[]>)[k],v]}));
  const handleNext=async()=>{ setSaving(true);setError(null); try{ await supplierService.saveServices(f as never); await onRefresh(); onNext(); }catch{ setError('حدث خطأ.'); }finally{ setSaving(false); }};
  const Tog=({val,onChange}:{val:boolean;onChange:(v:boolean)=>void})=>(<button onClick={()=>onChange(!val)} className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${val?'bg-[#FF6B35]':'bg-gray-200'}`}><span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${val?'left-5':'left-0.5'}`}/></button>);
  if(loading) return <div className="flex justify-center py-20"><div className="w-7 h-7 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"/></div>;
  return (
    <StepLayout title="الخدمات وقواعد المنزل" icon="🛎" subtitle="إفطار، موقف، لغات، أوقات" onBack={onBack} onNext={handleNext} nextLabel="التالي — الأوصاف →" saving={saving} error={error}>
      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2"><p className="text-sm font-semibold text-gray-700">🍳 الإفطار</p><Tog val={f.breakfast_available} onChange={v=>s('breakfast_available',v)}/></div>
          {f.breakfast_available&&<div className="space-y-2 border-r-2 border-orange-100 pr-3">
            <div className="flex items-center gap-2"><Tog val={f.breakfast_included} onChange={v=>s('breakfast_included',v)}/><span className="text-xs text-gray-600">{f.breakfast_included?'مشمول':'مدفوع'}</span></div>
            {!f.breakfast_included&&<div className="flex gap-2"><input className={ic+' flex-1'} type="number" placeholder="السعر" value={f.breakfast_price} onChange={e=>s('breakfast_price',e.target.value)}/><select className={ic+' w-20'} value={f.breakfast_currency} onChange={e=>s('breakfast_currency',e.target.value)}>{['MYR','USD','EUR'].map(c=><option key={c}>{c}</option>)}</select></div>}
            <div className="flex flex-wrap gap-2">{BT.map(b=><button key={b.v} onClick={()=>tl('breakfast_types',b.v)} className={`px-3 py-1 rounded-full text-xs border transition-all ${f.breakfast_types.includes(b.v)?'bg-[#FF6B35] text-white border-[#FF6B35]':'bg-white text-gray-600 border-gray-200'}`}>{b.l}</button>)}</div>
          </div>}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">🚗 موقف السيارات</p>
          <div className="flex gap-2 mb-2">{[{v:'NO',l:'لا يوجد'},{v:'FREE',l:'مجاني'},{v:'PAID',l:'مدفوع'}].map(o=><button key={o.v} onClick={()=>s('parking_available',o.v)} className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${f.parking_available===o.v?'bg-[#FF6B35] text-white border-[#FF6B35]':'border-gray-200 text-gray-600'}`}>{o.l}</button>)}</div>
          {f.parking_available==='PAID'&&<input className={ic} type="number" placeholder="السعر يومياً" value={f.parking_price} onChange={e=>s('parking_price',e.target.value)}/>}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">🌐 اللغات</p>
          <div className="flex flex-wrap gap-2">{LANGS.map(l=><button key={l.v} onClick={()=>tl('spoken_languages',l.v)} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${f.spoken_languages.includes(l.v)?'bg-[#1A1A2E] text-white border-[#1A1A2E]':'bg-white text-gray-600 border-gray-200'}`}>{l.l}</button>)}</div>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">🕐 أوقات الوصول والمغادرة</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lc}>وصول من</label><input className={ic} type="time" value={f.checkin_from} onChange={e=>s('checkin_from',e.target.value)}/></div>
            <div><label className={lc}>وصول حتى</label><input className={ic} type="time" value={f.checkin_until} onChange={e=>s('checkin_until',e.target.value)}/></div>
            <div><label className={lc}>مغادرة من</label><input className={ic} type="time" value={f.checkout_from} onChange={e=>s('checkout_from',e.target.value)}/></div>
            <div><label className={lc}>مغادرة حتى</label><input className={ic} type="time" value={f.checkout_until} onChange={e=>s('checkout_until',e.target.value)}/></div>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">📋 قواعد</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><span className="text-sm text-gray-600">الأطفال مسموح</span><Tog val={f.children_allowed} onChange={v=>s('children_allowed',v)}/></div>
            <div><span className="text-sm text-gray-600 block mb-1">الحيوانات</span>
              <div className="flex gap-2">{[{v:'YES',l:'مسموح'},{v:'ON_REQUEST',l:'عند الطلب'},{v:'NO',l:'لا'}].map(o=><button key={o.v} onClick={()=>s('pets_policy',o.v)} className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${f.pets_policy===o.v?'bg-[#FF6B35] text-white border-[#FF6B35]':'border-gray-200 text-gray-600'}`}>{o.l}</button>)}</div>
            </div>
          </div>
        </div>
      </div>
    </StepLayout>
  );
}
