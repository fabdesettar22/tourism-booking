// frontend/src/pages/auth/AgencyActivationPage.tsx
//
// صفحة تفعيل الوكالة بعد قبول الطلب

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2, XCircle, Loader2, Eye, EyeOff, AlertCircle,
  Building2, Mail, User, Lock, KeyRound,
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api/v1/accounts';

type CheckState =
  | { status: 'checking' }
  | { status: 'invalid'; error: string }
  | { status: 'valid'; agency_name: string; email: string; expires_at: string };

export function AgencyActivationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [checkState, setCheckState] = useState<CheckState>({ status: 'checking' });

  const [username, setUsername]               = useState('');
  const [password, setPassword]               = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [submitting, setSubmitting]           = useState(false);
  const [formError, setFormError]             = useState<string | null>(null);
  const [success, setSuccess]                 = useState(false);

  useEffect(() => {
    if (!token) {
      setCheckState({ status: 'invalid', error: 'لا يوجد رمز تفعيل في الرابط.' });
      return;
    }

    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          API_BASE + '/agency/activate/check/?token=' + encodeURIComponent(token),
          { signal: ac.signal }
        );
        const data = await res.json();
        if (ac.signal.aborted) return;

        if (data.valid === true) {
          setCheckState({
            status: 'valid',
            agency_name: data.agency_name,
            email: data.email,
            expires_at: data.expires_at,
          });
        } else {
          setCheckState({
            status: 'invalid',
            error: data.error ?? 'رمز التفعيل غير صالح.',
          });
        }
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        setCheckState({
          status: 'invalid',
          error: 'فشل الاتصال بالخادم. تأكّد من اتصالك بالإنترنت.',
        });
      }
    })();

    return () => ac.abort();
  }, [token]);

  const validateForm = (): string | null => {
    if (username.trim().length < 3)
      return 'اسم المستخدم يجب ألا يقلّ عن 3 أحرف.';
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return 'اسم المستخدم يقبل أحرف إنكليزية وأرقام و _ فقط.';
    if (password.length < 8)
      return 'كلمة المرور يجب ألا تقلّ عن 8 أحرف.';
    if (password !== passwordConfirm)
      return 'كلمتا المرور غير متطابقتين.';
    return null;
  };

  const handleSubmit = async () => {
    setFormError(null);
    const err = validateForm();
    if (err) { setFormError(err); return; }

    setSubmitting(true);
    try {
      const res = await fetch(API_BASE + '/agency/activate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          username: username.trim(),
          password,
          password_confirm: passwordConfirm,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const firstErr = typeof data === 'object' && data !== null
          ? (data.detail ?? (Object.values(data)[0] as any)?.[0] ?? 'فشل التفعيل.')
          : 'فشل التفعيل.';
        setFormError(String(firstErr));
        setSubmitting(false);
        return;
      }

      try {
        localStorage.setItem('access_token', data.tokens.access);
        localStorage.setItem('refresh_token', data.tokens.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
      } catch {}

      setSuccess(true);
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
    } catch {
      setFormError('خطأ في الاتصال بالخادم.');
      setSubmitting(false);
    }
  };

  if (checkState.status === 'checking') {
    return (
      <ActivationShell>
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
          <p className="text-white/90 text-sm">جاري التحقّق من رمز التفعيل...</p>
        </div>
      </ActivationShell>
    );
  }

  if (checkState.status === 'invalid') {
    return (
      <ActivationShell>
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-400/50 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white">رمز التفعيل غير صالح</h2>
          <p className="text-white/80 text-sm leading-relaxed max-w-sm">
            {checkState.error}
          </p>
          <div className="mt-2 space-y-2 text-right w-full">
            <p className="text-white/70 text-xs font-semibold">الأسباب المحتملة:</p>
            <ul className="text-white/70 text-xs space-y-1 list-disc pr-5">
              <li>انتهت صلاحية الرابط (7 أيام)</li>
              <li>تم استخدام الرابط سابقاً</li>
              <li>الرابط غير مكتمل</li>
            </ul>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-6 py-2.5 bg-white text-[#FF6B35] rounded-xl font-semibold text-sm hover:bg-white/90 transition-all"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </ActivationShell>
    );
  }

  if (success) {
    return (
      <ActivationShell>
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white">تم تفعيل الحساب بنجاح</h2>
          <p className="text-white/80 text-sm">جاري تحويلك إلى لوحة التحكم...</p>
          <Loader2 className="w-5 h-5 text-white/60 animate-spin mt-2" />
        </div>
      </ActivationShell>
    );
  }

  return (
    <ActivationShell>
      <div className="text-center mb-5">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 items-center justify-center mb-3">
          <Building2 className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">مرحباً بك في MYBRIDGE</h1>
        <p className="text-white/85 text-sm mt-1">{checkState.agency_name}</p>
        <p className="text-white/65 text-xs mt-1 flex items-center justify-center gap-1">
          <Mail className="w-3 h-3" /> {checkState.email}
        </p>
      </div>

      <div className="bg-white/10 border border-white/20 rounded-xl p-3 mb-5 text-white/85 text-xs leading-relaxed">
        تم قبول طلب تسجيل وكالتك. أنشئ اسم مستخدم وكلمة مرور لإكمال تفعيل حسابك.
      </div>

      {formError && (
        <div className="bg-red-500/15 border border-red-400/40 rounded-xl p-3 mb-4 text-red-100 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-white/90 text-xs font-semibold mb-1.5">
            اسم المستخدم
          </label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              dir="ltr"
              placeholder="my_agency"
              className="w-full h-11 pr-10 pl-3 bg-white/15 backdrop-blur-md border border-white/25 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/60 focus:bg-white/20"
            />
          </div>
          <p className="text-white/50 text-[11px] mt-1">أحرف إنكليزية، أرقام، و _ فقط</p>
        </div>

        <div>
          <label className="block text-white/90 text-xs font-semibold mb-1.5">
            كلمة المرور
          </label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              dir="ltr"
              placeholder="••••••••"
              className="w-full h-11 pr-10 pl-10 bg-white/15 backdrop-blur-md border border-white/25 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/60 focus:bg-white/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-white/50 text-[11px] mt-1">8 أحرف على الأقل</p>
        </div>

        <div>
          <label className="block text-white/90 text-xs font-semibold mb-1.5">
            تأكيد كلمة المرور
          </label>
          <div className="relative">
            <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              dir="ltr"
              placeholder="••••••••"
              className="w-full h-11 pr-10 pl-3 bg-white/15 backdrop-blur-md border border-white/25 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/60 focus:bg-white/20"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-2 w-full h-11 bg-white text-[#FF6B35] rounded-xl font-bold text-sm hover:bg-white/95 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري التفعيل...
            </>
          ) : (
            'تفعيل الحساب والدخول'
          )}
        </button>
      </div>

      <p className="text-white/50 text-[11px] text-center mt-5">
        © {new Date().getFullYear()} MYBRIDGE · You Need Travel
      </p>
    </ActivationShell>
  );
}

function ActivationShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #FF5722 0%, #FF6B35 25%, #FF8F3C 50%, #FFA647 75%, #FFB547 100%)',
        backgroundSize: '200% 200%',
        animation: 'mb-bg-shift 20s ease-in-out infinite',
      }}
    >
      <div
        className="absolute top-[10%] left-[8%] w-64 h-64 rounded-full"
        style={{ background: 'rgba(255,255,255,0.2)', filter: 'blur(45px)', animation: 'mb-orb-1 18s ease-in-out infinite' }}
      />
      <div
        className="absolute bottom-[10%] right-[10%] w-72 h-72 rounded-full"
        style={{ background: 'rgba(255,255,255,0.15)', filter: 'blur(50px)', animation: 'mb-orb-2 22s ease-in-out infinite' }}
      />
      <div
        className="absolute top-[45%] right-[40%] w-40 h-40 rounded-full"
        style={{ background: 'rgba(255,255,255,0.12)', filter: 'blur(35px)', animation: 'mb-orb-3 26s ease-in-out infinite' }}
      />

      <div
        className="relative w-full max-w-md bg-white/15 backdrop-blur-2xl border border-white/25 rounded-3xl p-7 shadow-2xl"
        style={{ animation: 'mb-fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        {children}
      </div>

      <style>{`
        @keyframes mb-bg-shift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes mb-orb-1 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,-30px) scale(1.1); } }
        @keyframes mb-orb-2 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-50px,35px) scale(1.15); } }
        @keyframes mb-orb-3 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(25px,40px) scale(0.9); } }
      `}</style>
    </div>
  );
}
