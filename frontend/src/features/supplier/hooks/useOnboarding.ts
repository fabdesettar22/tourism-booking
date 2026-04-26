import { useState, useEffect, useCallback } from 'react';
import { supplierService } from '../services/supplierService';
import type { HotelOnboardingStatus, OnboardingStepsStatus } from '../../../types/supplier';

export type OnboardingStep = 0|1|'2a'|'2b'|'2c'|3|4|'5a'|'5b'|6|7;
const STEPS:OnboardingStep[] = [0,1,'2a','2b','2c',3,4,'5a','5b',6,7];

function getFirstIncomplete(s:OnboardingStepsStatus):OnboardingStep {
  if(!s.step0_property_type) return 0;
  if(!s.step1_basic_info)    return 1;
  if(!s.step2_amenities)     return '2a';
  if(!s.step2_services)      return '2b';
  if(!s.step2_description)   return '2c';
  if(!s.step3_rooms)         return 3;
  if(!s.step4_photos)        return 4;
  if(!s.step5_pricing)       return '5a';
  if(!s.step6_availability)  return 6;
  if(!s.step7_final)         return 7;
  return 7;
}

export function useOnboarding() {
  const [status,setStatus]       = useState<HotelOnboardingStatus|null>(null);
  const [currentStep,setStep]    = useState<OnboardingStep>(0);
  const [loading,setLoading]     = useState(true);
  const [saving,setSaving]       = useState(false);
  const [error,setError]         = useState<string|null>(null);

  const refreshStatus = useCallback(async()=>{
    try { const d=await supplierService.getStatus(); setStatus(d); return d; }
    catch { setError('فشل تحميل البيانات'); return null; }
  },[]);

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      const d=await refreshStatus();
      if(d) setStep(getFirstIncomplete(d.steps_status));
      setLoading(false);
    })();
  },[refreshStatus]);

  const goToStep = useCallback((s:OnboardingStep)=>{ setStep(s); setError(null); window.scrollTo({top:0,behavior:'smooth'}); },[]);
  const goNext   = useCallback(()=>{ const i=STEPS.indexOf(currentStep); if(i<STEPS.length-1) goToStep(STEPS[i+1]); },[currentStep,goToStep]);
  const goPrev   = useCallback(()=>{ const i=STEPS.indexOf(currentStep); if(i>0) goToStep(STEPS[i-1]); },[currentStep,goToStep]);

  return { status, currentStep, loading, saving, error, goToStep, goNext, goPrev, refreshStatus, setSaving, setError,
    currentStepIndex: STEPS.indexOf(currentStep), totalSteps: STEPS.length };
}
