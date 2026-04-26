// src/pages/auth/RegisterSupplierPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { useLanguage } from '../../hooks/useLanguage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBuilding, faEnvelope, faLock, faEye, faEyeSlash,
  faArrowRight, faArrowLeft, faCheckCircle,
  faUser, faPhone,
} from '@fortawesome/free-solid-svg-icons';

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export function RegisterSupplierPage() {
  const navigate = useNavigate();
  const { lang, changeLang, t, isRTL } = useLanguage();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const [form, setForm] = useState({
    email: '', password: '', password2: '',
    first_name: '', last_name: '', phone: '',
    supplier_type: 'HOTEL',
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.email || !form.password || !form.first_name) {
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
      const res = await fetch(`${BASE}/api/v1/accounts/supplier/register/step1/`, {
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
      setError('حدث خطأ في الاتصال. حاول مجدداً.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-colors bg-white";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide";

  if (success) return (
    <div className="min-h-screen bg-[#F9FAFB]" dir="rtl">
      <PublicNavbar
        variant="solid"
        lang={lang}
        onLangChange={changeLang}
        t={t}
        isRTL={isRTL}
        onLogin={() => navigate('/supplier')}
        onSupplier={() => navigate('/register/supplier')}
        onAgency={() => navigate('/register/agency')}
      />
      <div className="pt-16 flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-4xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">تم إنشاء حسابك!</h2>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">
            تم تسجيل حسابك بنجاح. يمكنك الآن تسجيل الدخول وإكمال بيانات عقارك.
          </p>
          <button
            onClick={() => navigate('/supplier')}
            className="w-full bg-[#FF6B35] hover:bg-[#e07a38] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            تسجيل الدخول الآن <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB]" dir="rtl">

      <PublicNavbar
        variant="solid"
        lang={lang}
        onLangChange={changeLang}
        t={t}
        isRTL={isRTL}
        onLogin={() => navigate('/supplier')}
        onSupplier={() => navigate('/register/supplier')}
        onAgency={() => navigate('/register/agency')}
      />

      <div className="pt-16 flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
        <div className="w-full max-w-lg">

          {/* Hero */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#FF6B35] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FontAwesomeIcon icon={faBuilding} className="text-white text-2xl" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">سجّل كمورد</h1>
            <p className="text-gray-500 text-sm">أدرج عقارك واستقبل السياح الجزائريين</p>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${step >= s ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {s}
                </div>
                <span className={`text-xs font-medium ${step >= s ? 'text-[#FF6B35]' : 'text-gray-400'}`}>
                  {s === 1 ? 'بيانات الحساب' : 'معلومات إضافية'}
                </span>
                {s < 2 && <div className={`w-8 h-0.5 ${step > s ? 'bg-[#FF6B35]' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">

            {error && (
              <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>الاسم الأول *</label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faUser} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input className={inputCls} placeholder="Ahmad" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>اسم العائلة *</label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faUser} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input className={inputCls} placeholder="Kamal" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>البريد الإلكتروني *</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faEnvelope} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input className={inputCls} type="email" placeholder="hotel@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>كلمة المرور *</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faLock} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input className={inputCls} type={showPwd ? 'text' : 'password'} placeholder="8 أحرف على الأقل" value={form.password} onChange={e => set('password', e.target.value)} />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <FontAwesomeIcon icon={showPwd ? faEyeSlash : faEye} className="text-sm" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>تأكيد كلمة المرور *</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faLock} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input className={inputCls} type={showPwd2 ? 'text' : 'password'} placeholder="أعد كتابة كلمة المرور" value={form.password2} onChange={e => set('password2', e.target.value)} />
                    <button type="button" onClick={() => setShowPwd2(!showPwd2)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <FontAwesomeIcon icon={showPwd2 ? faEyeSlash : faEye} className="text-sm" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!form.email || !form.password || !form.first_name) { setError('يرجى ملء الحقول المطلوبة'); return; }
                    if (form.password !== form.password2) { setError('كلمتا المرور غير متطابقتين'); return; }
                    setError(''); setStep(2);
                  }}
                  className="w-full bg-[#FF6B35] hover:bg-[#e07a38] text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  التالي <FontAwesomeIcon icon={faArrowRight} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className={labelCls}>رقم الهاتف</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faPhone} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input className={inputCls} placeholder="+60123456789" value={form.phone} onChange={e => set('phone', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>نوع العقار</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { v: 'HOTEL', l: 'فندق', icon: '🏨' },
                      { v: 'GUESTHOUSE', l: 'بيت ضيافة', icon: '🏡' },
                      { v: 'RESORT', l: 'منتجع', icon: '🌴' },
                      { v: 'HOSTEL', l: 'بيت شباب', icon: '🛖' },
                    ].map(tp => (
                      <button
                        key={tp.v}
                        onClick={() => set('supplier_type', tp.v)}
                        className={`p-3 rounded-xl border-2 text-center text-sm font-medium transition-all
                          ${form.supplier_type === tp.v ? 'border-[#FF6B35] bg-orange-50 text-[#FF6B35]' : 'border-gray-100 text-gray-600 hover:border-orange-200'}`}
                      >
                        <span className="block text-xl mb-1">{tp.icon}</span>{tp.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} /> السابق
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-[#FF6B35] hover:bg-[#e07a38] text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> جارٍ التسجيل...</>
                      : <>إنشاء الحساب <FontAwesomeIcon icon={faCheckCircle} /></>}
                  </button>
                </div>
              </div>
            )}

            {/* Login link */}
            <p className="text-center text-sm text-gray-500 mt-6">
              لديك حساب بالفعل؟{' '}
              <Link to="/supplier" className="text-[#FF6B35] font-semibold hover:underline">سجّل الدخول</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
