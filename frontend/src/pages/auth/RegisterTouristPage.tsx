// src/pages/auth/RegisterTouristPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPersonWalking, faEnvelope, faLock, faEye, faEyeSlash,
  faArrowRight, faArrowLeft, faGlobe, faCheckCircle,
  faUser, faPhone, faCalendarDays,
} from '@fortawesome/free-solid-svg-icons';

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export function RegisterTouristPage() {
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
      setError('يرجى ملء جميع الحقول المطلوبة'); return;
    }
    if (form.password !== form.password2) {
      setError('كلمتا المرور غير متطابقتين'); return;
    }
    if (form.password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return;
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
        setError(Object.values(err).flat().join(' — ') as string);
        return;
      }
      setSuccess(true);
    } catch {
      setError('حدث خطأ في الاتصال.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-colors bg-white";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide";

  const NATIONALITIES = [
    {v:'DZ',l:'🇩🇿 جزائري'},{v:'MA',l:'🇲🇦 مغربي'},{v:'TN',l:'🇹🇳 تونسي'},
    {v:'EG',l:'🇪🇬 مصري'},{v:'SA',l:'🇸🇦 سعودي'},{v:'AE',l:'🇦🇪 إماراتي'},
    {v:'MY',l:'🇲🇾 ماليزي'},{v:'OTHER',l:'🌍 أخرى'},
  ];

  if (success) return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-4xl"/>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">مرحباً بك! 🎉</h2>
        <p className="text-gray-500 mb-6 text-sm leading-relaxed">
          تم إنشاء حسابك بنجاح. ابدأ الآن باستكشاف أفضل الوجهات السياحية في ماليزيا.
        </p>
        <button onClick={() => navigate('/')}
          className="w-full bg-[#FF6B35] hover:bg-[#e07a38] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
          ابدأ الاستكشاف <FontAwesomeIcon icon={faArrowRight}/>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="MYBRIDGE" className="h-8 w-auto"/>
            <span className="font-bold text-gray-900 text-sm">MYBRIDGE</span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#FF6B35] transition-colors">
            <FontAwesomeIcon icon={faArrowLeft}/> العودة للرئيسية
          </Link>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-lg">

          {/* Hero */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#FF6B35] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FontAwesomeIcon icon={faPersonWalking} className="text-white text-2xl"/>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">سجّل كسائح</h1>
            <p className="text-gray-500 text-sm">اكتشف ماليزيا بأفضل الأسعار والعروض</p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              {icon:'🎯', text:'عروض حصرية'},
              {icon:'⚡', text:'حجز فوري'},
              {icon:'🌟', text:'دعم عربي 24/7'},
            ].map(b=>(
              <div key={b.text} className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
                <div className="text-xl mb-1">{b.icon}</div>
                <p className="text-xs font-medium text-gray-600">{b.text}</p>
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            {error && (
              <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
            )}

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>الاسم الأول *</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faUser} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"/>
                    <input className={inputCls} placeholder="محمد" value={form.first_name} onChange={e=>set('first_name',e.target.value)}/>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>اسم العائلة *</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faUser} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"/>
                    <input className={inputCls} placeholder="بن علي" value={form.last_name} onChange={e=>set('last_name',e.target.value)}/>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>البريد الإلكتروني *</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faEnvelope} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"/>
                  <input className={inputCls} type="email" placeholder="tourist@example.com" value={form.email} onChange={e=>set('email',e.target.value)}/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>رقم الهاتف</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faPhone} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"/>
                    <input className={inputCls} placeholder="+213 XXX" value={form.phone} onChange={e=>set('phone',e.target.value)}/>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>تاريخ الميلاد</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faCalendarDays} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"/>
                    <input className={inputCls} type="date" value={form.date_of_birth} onChange={e=>set('date_of_birth',e.target.value)}/>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>الجنسية</label>
                <select className={inputCls + ' pr-3'} value={form.nationality} onChange={e=>set('nationality',e.target.value)}>
                  {NATIONALITIES.map(n=><option key={n.v} value={n.v}>{n.l}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>كلمة المرور *</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faLock} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"/>
                  <input className={inputCls} type={showPwd?'text':'password'} placeholder="8 أحرف على الأقل" value={form.password} onChange={e=>set('password',e.target.value)}/>
                  <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FontAwesomeIcon icon={showPwd?faEyeSlash:faEye} className="text-sm"/>
                  </button>
                </div>
              </div>

              <div>
                <label className={labelCls}>تأكيد كلمة المرور *</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faLock} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"/>
                  <input className={inputCls} type={showPwd2?'text':'password'} placeholder="أعد كتابة كلمة المرور" value={form.password2} onChange={e=>set('password2',e.target.value)}/>
                  <button type="button" onClick={()=>setShowPwd2(!showPwd2)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FontAwesomeIcon icon={showPwd2?faEyeSlash:faEye} className="text-sm"/>
                  </button>
                </div>
              </div>

              <button onClick={handleSubmit} disabled={loading}
                className="w-full bg-[#FF6B35] hover:bg-[#e07a38] text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> جارٍ التسجيل...</> : <>إنشاء الحساب <FontAwesomeIcon icon={faCheckCircle}/></>}
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              لديك حساب بالفعل؟{' '}
              <Link to="/dashboard" className="text-[#FF6B35] font-semibold hover:underline">سجّل الدخول</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
