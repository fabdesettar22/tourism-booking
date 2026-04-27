// src/pages/auth/RegisterTouristPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPersonWalking, faEnvelope, faLock, faEye, faEyeSlash,
  faArrowRight, faArrowLeft, faCheckCircle,
  faUser, faPhone, faCalendarDays,
} from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../../hooks/useLanguage';

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const NATIONALITY_CODES = ['DZ', 'MA', 'TN', 'EG', 'SA', 'AE', 'MY', 'OTHER'] as const;

export function RegisterTouristPage() {
  const { t, isRTL } = useLanguage();
  const navigate  = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    phone: '', date_of_birth: '', nationality: 'DZ',
    password: '', password2: '',
  });

  const set = (k: string, v: string) => setForm(p => ({...p, [k]: v}));

  const handleSubmit = async () => {
    if (!form.email || !form.password || !form.first_name || !form.last_name) {
      setError(t('registerTourist.errors.requiredFields')); return;
    }
    if (form.password !== form.password2) {
      setError(t('registerTourist.errors.passwordMismatch')); return;
    }
    if (form.password.length < 8) {
      setError(t('registerTourist.errors.passwordMin')); return;
    }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${BASE}/api/v1/accounts/register/tourist/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(Object.values(err).flat().join(' | ') as string);
        return;
      }
      setSuccess(true);
    } catch {
      setError(t('registerTourist.errors.connectionError'));
    } finally {
      setLoading(false);
    }
  };

  const iconSide = isRTL ? 'right-3' : 'left-3';
  const eyeSide  = isRTL ? 'left-3'  : 'right-3';
  const inputCls = isRTL
    ? "w-full h-12 pr-10 pl-10 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-colors bg-white"
    : "w-full h-12 pl-10 pr-10 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-colors bg-white";
  const inputClsSimple = isRTL
    ? "w-full h-12 pr-10 pl-4 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-colors bg-white"
    : "w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-colors bg-white";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide";
  const arrowBack = isRTL ? faArrowLeft : faArrowRight;
  const arrowForward = isRTL ? faArrowRight : faArrowLeft;

  if (success) return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-4xl"/>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('registerTourist.success.title')}</h2>
        <p className="text-gray-500 mb-6 text-sm leading-relaxed">
          {t('registerTourist.success.message')}
        </p>
        <button onClick={() => navigate('/')}
          className="w-full bg-[#FF6B35] hover:bg-[#e07a38] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
          {t('registerTourist.success.cta')} <FontAwesomeIcon icon={arrowBack}/>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="MYBRIDGE" className="h-8 w-auto"/>
            <span className="font-bold text-gray-900 text-sm">MYBRIDGE</span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#FF6B35] transition-colors">
            <FontAwesomeIcon icon={arrowForward}/> {t('registerTourist.backHome')}
          </Link>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-lg">

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#FF6B35] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FontAwesomeIcon icon={faPersonWalking} className="text-white text-2xl"/>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('registerTourist.title')}</h1>
            <p className="text-gray-500 text-sm">{t('registerTourist.subtitle')}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              {icon:'TARGET', text: t('registerTourist.benefits.exclusive')},
              {icon:'BOLT',   text: t('registerTourist.benefits.instant')},
              {icon:'STAR',   text: t('registerTourist.benefits.support')},
            ].map(b=>(
              <div key={b.text} className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
                <div className="text-xl mb-1">{b.icon === 'TARGET' ? '\u{1F3AF}' : b.icon === 'BOLT' ? '\u26A1' : '\u{1F31F}'}</div>
                <p className="text-xs font-medium text-gray-600">{b.text}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            {error && (
              <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
            )}

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{t('registerTourist.form.firstName')}</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faUser} className={`absolute ${iconSide} top-1/2 -translate-y-1/2 text-gray-400 text-sm`}/>
                    <input className={inputClsSimple} placeholder={t('registerTourist.form.firstNamePh')} value={form.first_name} onChange={e=>set('first_name',e.target.value)}/>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t('registerTourist.form.lastName')}</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faUser} className={`absolute ${iconSide} top-1/2 -translate-y-1/2 text-gray-400 text-sm`}/>
                    <input className={inputClsSimple} placeholder={t('registerTourist.form.lastNamePh')} value={form.last_name} onChange={e=>set('last_name',e.target.value)}/>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>{t('registerTourist.form.email')}</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faEnvelope} className={`absolute ${iconSide} top-1/2 -translate-y-1/2 text-gray-400 text-sm`}/>
                  <input className={inputClsSimple} type="email" placeholder={t('registerTourist.form.emailPh')} value={form.email} onChange={e=>set('email',e.target.value)} dir="ltr"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{t('registerTourist.form.phone')}</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faPhone} className={`absolute ${iconSide} top-1/2 -translate-y-1/2 text-gray-400 text-sm`}/>
                    <input className={inputClsSimple} placeholder={t('registerTourist.form.phonePh')} value={form.phone} onChange={e=>set('phone',e.target.value)} dir="ltr"/>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t('registerTourist.form.birthDate')}</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faCalendarDays} className={`absolute ${iconSide} top-1/2 -translate-y-1/2 text-gray-400 text-sm`}/>
                    <input className={inputClsSimple} type="date" value={form.date_of_birth} onChange={e=>set('date_of_birth',e.target.value)}/>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>{t('registerTourist.form.nationality')}</label>
                <select className={inputClsSimple + ' ' + (isRTL ? 'pr-3' : 'pl-3')} value={form.nationality} onChange={e=>set('nationality',e.target.value)}>
                  {NATIONALITY_CODES.map(code => (
                    <option key={code} value={code}>{t(`registerTourist.nationalities.${code}`)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>{t('registerTourist.form.password')}</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faLock} className={`absolute ${iconSide} top-1/2 -translate-y-1/2 text-gray-400 text-sm`}/>
                  <input className={inputCls} type={showPwd?'text':'password'} placeholder={t('registerTourist.form.passwordPh')} value={form.password} onChange={e=>set('password',e.target.value)} dir="ltr"/>
                  <button type="button" onClick={()=>setShowPwd(!showPwd)} className={`absolute ${eyeSide} top-1/2 -translate-y-1/2 text-gray-400`}>
                    <FontAwesomeIcon icon={showPwd?faEyeSlash:faEye} className="text-sm"/>
                  </button>
                </div>
              </div>

              <div>
                <label className={labelCls}>{t('registerTourist.form.confirmPassword')}</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faLock} className={`absolute ${iconSide} top-1/2 -translate-y-1/2 text-gray-400 text-sm`}/>
                  <input className={inputCls} type={showPwd2?'text':'password'} placeholder={t('registerTourist.form.confirmPwdPh')} value={form.password2} onChange={e=>set('password2',e.target.value)} dir="ltr"/>
                  <button type="button" onClick={()=>setShowPwd2(!showPwd2)} className={`absolute ${eyeSide} top-1/2 -translate-y-1/2 text-gray-400`}>
                    <FontAwesomeIcon icon={showPwd2?faEyeSlash:faEye} className="text-sm"/>
                  </button>
                </div>
              </div>

              <button onClick={handleSubmit} disabled={loading}
                className="w-full bg-[#FF6B35] hover:bg-[#e07a38] text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                {loading ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> {t('registerTourist.form.submitting')}</>) : (<>{t('registerTourist.form.submit')} <FontAwesomeIcon icon={faCheckCircle}/></>)}
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              {t('registerTourist.form.hasAccount')}{' '}
              <Link to="/dashboard" className="text-[#FF6B35] font-semibold hover:underline">{t('registerTourist.form.signIn')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
