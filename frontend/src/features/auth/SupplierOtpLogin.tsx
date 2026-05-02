import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, KeyRound, ArrowRight, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { requestOtp, verifyOtp } from '../../services/otpApi';

interface Props {
  onSuccess?: () => void;
}

export function SupplierOtpLogin({ onSuccess }: Props) {
  const { lang, isRTL } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Labels
  const T = {
    ar: {
      title:        'دخول لوحة المورد',
      subtitle:     'لا حاجة لكلمة سر — سيصلك رمز عبر إيميلك',
      emailLabel:   'البريد الإلكتروني',
      emailPlaceholder: 'example@email.com',
      sendCode:     'إرسال الرمز',
      sending:      'جارٍ الإرسال...',
      codeTitle:    'أدخل الرمز',
      codeSubtitle: 'أرسلنا رمزاً من 6 أرقام إلى',
      verify:       'دخول',
      verifying:    'جارٍ التحقق...',
      resend:       'إعادة إرسال الرمز',
      resendIn:     (s: number) => `إعادة الإرسال خلال ${s} ث`,
      changeEmail:  'تغيير الإيميل',
      backToLogin:  'العودة',
      noAccount:    'لا يوجد حساب؟',
      register:     'سجّل كمورد جديد',
    },
    en: {
      title:        'Supplier Portal Login',
      subtitle:     'No password needed — we\'ll email you a code',
      emailLabel:   'Email Address',
      emailPlaceholder: 'example@email.com',
      sendCode:     'Send Code',
      sending:      'Sending...',
      codeTitle:    'Enter Code',
      codeSubtitle: 'We sent a 6-digit code to',
      verify:       'Sign In',
      verifying:    'Verifying...',
      resend:       'Resend Code',
      resendIn:     (s: number) => `Resend in ${s}s`,
      changeEmail:  'Change Email',
      backToLogin:  'Back',
      noAccount:    'Don\'t have an account?',
      register:     'Register as a supplier',
    },
    ms: {
      title:        'Log Masuk Portal Pembekal',
      subtitle:     'Tiada kata laluan diperlukan — kami akan emelkan kod kepada anda',
      emailLabel:   'E-mel',
      emailPlaceholder: 'example@email.com',
      sendCode:     'Hantar Kod',
      sending:      'Menghantar...',
      codeTitle:    'Masukkan Kod',
      codeSubtitle: 'Kami menghantar kod 6 digit ke',
      verify:       'Log Masuk',
      verifying:    'Mengesahkan...',
      resend:       'Hantar Semula',
      resendIn:     (s: number) => `Hantar semula dalam ${s}s`,
      changeEmail:  'Tukar E-mel',
      backToLogin:  'Kembali',
      noAccount:    'Tiada akaun?',
      register:     'Daftar sebagai pembekal',
    },
  }[lang];

  // Countdown timer for resend
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleRequestOtp = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const res = await requestOtp(email);
      setInfo(res.message);
      setStep('code');
      setSecondsLeft(60);
      // Focus first input after next render
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل طلب الرمز');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (idx: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[idx] = digit;
    setCode(newCode);

    // Auto-advance
    if (digit && idx < 5) {
      codeRefs.current[idx + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (digit && idx === 5 && newCode.every(d => d)) {
      handleVerify(newCode.join(''));
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split('');
      setCode(newCode);
      handleVerify(pasted);
    }
  };

  const handleCodeKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async (codeValue?: string) => {
    const fullCode = codeValue || code.join('');
    if (fullCode.length !== 6) return;

    setLoading(true);
    setError('');
    try {
      const res = await verifyOtp(email, fullCode);
      // حفظ الـ JWT tokens والمستخدم
      localStorage.setItem('access_token', res.tokens.access);
      localStorage.setItem('refresh_token', res.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(res.user));

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/supplier');
        // إعادة تحميل لتحديث الـ state
        window.location.reload();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'الرمز غير صحيح');
      // مسح الرمز عند الفشل
      setCode(['', '', '', '', '', '']);
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0) return;
    setCode(['', '', '', '', '', '']);
    await handleRequestOtp();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {step === 'email' ? (
              <Mail className="w-8 h-8 text-[#FF6B35]" />
            ) : (
              <KeyRound className="w-8 h-8 text-[#FF6B35]" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'email' ? T.title : T.codeTitle}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {step === 'email' ? T.subtitle : (
              <>
                {T.codeSubtitle}<br />
                <strong className="text-gray-800">{email}</strong>
              </>
            )}
          </p>
        </div>

        {/* Email step */}
        {step === 'email' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                {T.emailLabel}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRequestOtp()}
                placeholder={T.emailPlaceholder}
                disabled={loading}
                autoFocus
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 outline-none transition"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              onClick={handleRequestOtp}
              disabled={loading || !email.trim()}
              className="w-full h-12 bg-[#FF6B35] hover:bg-[#e07a38] text-white font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {T.sending}</>
              ) : (
                <>{T.sendCode} {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}</>
              )}
            </button>
          </div>
        )}

        {/* Code step */}
        {step === 'code' && (
          <div className="space-y-5">
            {info && (
              <p className="text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg text-center">
                {info}
              </p>
            )}

            {/* 6 boxes */}
            <div className="flex justify-center gap-2" dir="ltr">
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { codeRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleCodeChange(idx, e.target.value)}
                  onKeyDown={e => handleCodeKeyDown(idx, e)}
                  onPaste={handleCodePaste}
                  disabled={loading}
                  className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-gray-200 focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 outline-none transition"
                />
              ))}
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg text-center">{error}</p>
            )}

            <button
              onClick={() => handleVerify()}
              disabled={loading || code.some(d => !d)}
              className="w-full h-12 bg-[#FF6B35] hover:bg-[#e07a38] text-white font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {T.verifying}</>
              ) : (
                T.verify
              )}
            </button>

            {/* Resend + Change email */}
            <div className="flex items-center justify-between text-sm pt-2">
              <button
                onClick={() => { setStep('email'); setCode(['', '', '', '', '', '']); setError(''); }}
                className="text-gray-500 hover:text-gray-700 underline"
              >
                {T.changeEmail}
              </button>
              <button
                onClick={handleResend}
                disabled={secondsLeft > 0 || loading}
                className="text-[#FF6B35] hover:text-[#e07a38] font-semibold flex items-center gap-1 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {secondsLeft > 0 ? T.resendIn(secondsLeft) : T.resend}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            {T.noAccount}{' '}
            <button
              onClick={() => navigate('/register/supplier')}
              className="text-[#FF6B35] font-semibold hover:underline"
            >
              {T.register}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SupplierOtpLogin;
