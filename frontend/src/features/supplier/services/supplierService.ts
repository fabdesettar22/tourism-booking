import { apiFetch } from '../../../services/apiFetch';
import type { HotelOnboardingStatus, Step0Data, Step1Data, Step2ServicesData, Step2DescriptionData, HotelRoomType, PropertyImage, AmenityGroup, HotelPricePlan, Step5PricingData, Step6AvailabilityData, Step7FinalData, SupplierWaitlistData } from '../../../types/supplier';

const V1 = '/api/v1';
const EP = {
  status: `${V1}/suppliers/hotel/onboarding/status/`,
  step0: `${V1}/suppliers/hotel/onboarding/step0/`,
  step1: `${V1}/suppliers/hotel/onboarding/step1/`,
  step2Amenities: `${V1}/suppliers/hotel/onboarding/step2/amenities/`,
  step2Services: `${V1}/suppliers/hotel/onboarding/step2/services/`,
  step2Desc: `${V1}/suppliers/hotel/onboarding/step2/description/`,
  rooms: `${V1}/suppliers/hotel/onboarding/rooms/`,
  room: (id:string) => `${V1}/suppliers/hotel/onboarding/rooms/${id}/`,
  images: `${V1}/suppliers/hotel/onboarding/images/`,
  image: (id:string) => `${V1}/suppliers/hotel/onboarding/images/${id}/`,
  imageSetMain: (id:string) => `${V1}/suppliers/hotel/onboarding/images/${id}/set-main/`,
  step5Pricing: `${V1}/suppliers/hotel/onboarding/step5/pricing/`,
  step5Plans: `${V1}/suppliers/hotel/onboarding/step5/plans/`,
  step6: `${V1}/suppliers/hotel/onboarding/step6/availability/`,
  step7: `${V1}/suppliers/hotel/onboarding/step7/final/`,
  waitlist: `${V1}/suppliers/waitlist/`,
};

async function get<T>(url:string):Promise<T> {
  const res = await apiFetch(url);
  if(!res.ok){ const e=await res.json().catch(()=>({})); throw new Error(e?.detail||`HTTP ${res.status}`); }
  return res.json();
}
async function post<T>(url:string,body:unknown):Promise<T> {
  const res = await apiFetch(url,{method:'POST',body:JSON.stringify(body)});
  if(!res.ok){ const e=await res.json().catch(()=>({})); throw e; }
  return res.json();
}
async function patch<T>(url:string,body:unknown):Promise<T> {
  const res = await apiFetch(url,{method:'PATCH',body:JSON.stringify(body)});
  if(!res.ok){ const e=await res.json().catch(()=>({})); throw e; }
  return res.json();
}
async function del(url:string):Promise<void> {
  const res = await apiFetch(url,{method:'DELETE'});
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
}
async function postForm<T>(url:string,fd:FormData):Promise<T> {
  const res = await apiFetch(url,{method:'POST',body:fd});
  if(!res.ok){ const e=await res.json().catch(()=>({})); throw e; }
  return res.json();
}

export const supplierService = {
  getStatus: ()=>get<HotelOnboardingStatus>(EP.status),
  saveStep0: (d:Step0Data)=>post<{message:string;hotel_id:string}>(EP.step0,d),
  getStep1: ()=>get<Step1Data>(EP.step1),
  saveStep1: (d:Partial<Step1Data>)=>post<{message:string;data:Step1Data}>(EP.step1,d),
  getAmenities: ()=>get<{amenities:AmenityGroup[];selected_ids:string[]}>(EP.step2Amenities),
  saveAmenities: (ids:string[])=>post<{message:string}>(EP.step2Amenities,{amenity_ids:ids}),
  getServices: ()=>get<Step2ServicesData>(EP.step2Services),
  saveServices: (d:Partial<Step2ServicesData>)=>post<{message:string}>(EP.step2Services,d),
  getDescription: ()=>get<Step2DescriptionData>(EP.step2Desc),
  saveDescription: (d:Partial<Step2DescriptionData>)=>post<{message:string}>(EP.step2Desc,d),
  getRooms: ()=>get<{count:number;rooms:HotelRoomType[];step_complete:boolean}>(EP.rooms),
  addRoom: (d:Partial<HotelRoomType>)=>post<{message:string;room_id:string;data:HotelRoomType}>(EP.rooms,d),
  updateRoom: (id:string,d:Partial<HotelRoomType>)=>patch<{message:string;data:HotelRoomType}>(EP.room(id),d),
  deleteRoom: (id:string)=>del(EP.room(id)),
  getImages: ()=>get<{count:number;images:PropertyImage[];step_complete:boolean}>(EP.images),
  uploadImage: (file:File)=>{ const fd=new FormData(); fd.append('image',file); return postForm<{message:string;images:PropertyImage[]}>(EP.images,fd); },
  deleteImage: (id:string)=>del(EP.image(id)),
  setMainImage: (id:string)=>post<{message:string}>(EP.imageSetMain(id),{}),
  getPricing: ()=>get<Step5PricingData>(EP.step5Pricing),
  savePricing: (d:Partial<Step5PricingData>)=>post<{message:string}>(EP.step5Pricing,d),
  getPricePlans: ()=>get<{plans:HotelPricePlan[];step_complete:boolean}>(EP.step5Plans),
  savePricePlans: (plans:Partial<HotelPricePlan>[])=>post<{message:string;plans:HotelPricePlan[]}>(EP.step5Plans,plans),
  getAvailability: ()=>get<Step6AvailabilityData>(EP.step6),
  saveAvailability: (d:Partial<Step6AvailabilityData>)=>post<{message:string}>(EP.step6,d),
  getFinal: ()=>get<Step7FinalData>(EP.step7),
  saveFinal: (d:Partial<Step7FinalData>)=>post<{message:string;completion_pct:number;content_status:string}>(EP.step7,d),
  joinWaitlist: (d:SupplierWaitlistData)=>post<{message:string;waitlist_id:string}>(EP.waitlist,d),
};
