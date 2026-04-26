import { useState, useEffect } from 'react';
import { StepLayout } from '../components/StepLayout';
import { supplierService } from '../../services/supplierService';
import type { AmenityGroup } from '../../../../types/supplier';
interface Props { onNext:()=>void; onBack:()=>void; onRefresh:()=>Promise<void>; setSaving:(v:boolean)=>void; setError:(e:string|null)=>void; saving:boolean; error:string|null; }
export function Step2Amenities({onNext,onBack,onRefresh,setSaving,setError,saving,error}:Props) {
  const [groups,setGroups]=useState<AmenityGroup[]>([]);
  const [selected,setSelected]=useState<string[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ supplierService.getAmenities().then(({amenities,selected_ids})=>{ setGroups(amenities); setSelected(selected_ids); }).finally(()=>setLoading(false)); },[]);
  const toggle=(id:string)=>setSelected(p=>p.includes(id)?p.filter(s=>s!==id):[...p,id]);
  const handleNext=async()=>{ setSaving(true);setError(null); try{ await supplierService.saveAmenities(selected); await onRefresh(); onNext(); }catch{ setError('حدث خطأ.'); }finally{ setSaving(false); }};
  if(loading) return <div className="flex justify-center py-20"><div className="w-7 h-7 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"/></div>;
  return (
    <StepLayout title="مرافق العقار" icon="✨" subtitle={`${selected.length} مرفق مختار`} onBack={onBack} onNext={handleNext} nextLabel="التالي — الخدمات →" saving={saving} error={error}>
      <div className="space-y-5">
        {groups.map(g=>(
          <div key={g.category}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">{g.label}</h3>
              <div className="flex-1 h-px bg-gray-100"/>
              <span className="text-xs text-gray-400">{g.items.filter(i=>selected.includes(i.id)).length}/{g.items.length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {g.items.map(item=>{
                const isSel=selected.includes(item.id);
                return <button key={item.id} onClick={()=>toggle(item.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${isSel?'bg-[#FF6B35] text-white border-[#FF6B35]':'bg-white text-gray-600 border-gray-200 hover:border-[#FF6B35]'}`}>
                  {isSel&&<svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>}
                  {item.name_ar||item.name_en}
                </button>;
              })}
            </div>
          </div>
        ))}
      </div>
    </StepLayout>
  );
}
