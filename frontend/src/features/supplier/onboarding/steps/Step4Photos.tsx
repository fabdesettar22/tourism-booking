import { useState, useEffect, useRef } from 'react';
import { StepLayout } from '../components/StepLayout';
import { supplierService } from '../../services/supplierService';
import type { PropertyImage } from '../../../../types/supplier';
interface Props { onNext:()=>void; onBack:()=>void; onRefresh:()=>Promise<void>; setSaving:(v:boolean)=>void; setError:(e:string|null)=>void; saving:boolean; error:string|null; }
export function Step4Photos({onNext,onBack,onRefresh,setSaving,setError,saving,error}:Props) {
  const [images,setImages]=useState<PropertyImage[]>([]);
  const [loading,setLoading]=useState(true);
  const [uploading,setUploading]=useState(false);
  const ref=useRef<HTMLInputElement>(null);
  const load=()=>supplierService.getImages().then(({images:i})=>setImages(i));
  useEffect(()=>{ load().finally(()=>setLoading(false)); },[]);
  const handleUpload=async(files:FileList)=>{ if(!files.length) return; setUploading(true);setError(null); for(const f of Array.from(files)){ try{ await supplierService.uploadImage(f); }catch{ setError('فشل رفع إحدى الصور.'); } } await load(); await onRefresh(); setUploading(false); };
  const del=async(id:string)=>{ try{ await supplierService.deleteImage(id); setImages(i=>i.filter(x=>x.id!==id)); await onRefresh(); }catch{ setError('تعذر الحذف.'); }};
  const setMain=async(id:string)=>{ try{ await supplierService.setMainImage(id); await load(); }catch{ setError('تعذر التعيين.'); }};
  if(loading) return <div className="flex justify-center py-20"><div className="w-7 h-7 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"/></div>;
  return (
    <StepLayout title="صور العقار" icon="📷" subtitle={`${images.length}/5 صور مرفوعة`} onBack={onBack} onNext={onNext} nextLabel="التالي — التسعير →" saving={saving} canProceed={images.length>=5} error={error}>
      <div onClick={()=>ref.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#FF6B35] hover:bg-orange-50/20 transition-all mb-4">
        <input ref={ref} type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={e=>e.target.files&&handleUpload(e.target.files)}/>
        {uploading?<div className="flex flex-col items-center gap-2"><div className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"/><p className="text-sm text-gray-500">جارٍ الرفع...</p></div>:<><div className="text-3xl mb-2">📸</div><p className="text-sm font-medium text-gray-700">انقر لرفع الصور</p><p className="text-xs text-gray-400 mt-1">JPG أو PNG · حتى 47MB</p></>}
      </div>
      {images.length>0&&<div className="grid grid-cols-3 gap-3">{images.map(img=>(
        <div key={img.id} className="relative group rounded-xl overflow-hidden border-2 border-gray-100 aspect-square bg-gray-50">
          <img src={img.image} alt="" className="w-full h-full object-cover"/>
          {img.is_main&&<div className="absolute top-2 right-2 bg-[#FF6B35] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">رئيسية</div>}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {!img.is_main&&<button onClick={()=>setMain(img.id)} className="p-1.5 bg-white rounded-lg text-gray-700 hover:bg-[#FF6B35] hover:text-white transition-colors"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button>}
            <button onClick={()=>del(img.id)} className="p-1.5 bg-white rounded-lg text-gray-700 hover:bg-red-500 hover:text-white transition-colors"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
          </div>
        </div>
      ))}</div>}
      {images.length<5&&<p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">⚠️ تحتاج {5-images.length} صورة إضافية.</p>}
    </StepLayout>
  );
}
