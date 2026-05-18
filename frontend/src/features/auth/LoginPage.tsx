import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope, faLock, faEye, faEyeSlash, faArrowRight, faTriangleExclamation,
  faShieldHalved, faCheck, faBuilding, faUserTie, faStar, faMapLocationDot,
} from '@fortawesome/free-solid-svg-icons';
import { login, saveAuth } from '../../services/authService';
import type { AuthUser } from '../../services/authService';
import { useLanguage } from '../../hooks/useLanguage';
import { TurnstileWidget } from '../../components/security/TurnstileWidget';
import { LANGUAGES, type Language } from '../../i18n/index';

interface Props {
  onSuccess: (user: AuthUser) => void;
  supplierMode?: boolean;
}

const HERO_URL = 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1600&q=80';
const TURNSTILE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string) || '';

export function LoginPage({ onSuccess, supplierMode = false }: Props) {
  const { t, isRTL, lang, changeLang } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [cfToken, setCfToken] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { emailInputRef.current?.focus(); }, []);

  const handleSubmit = async () => {
    if (!form.username || !form.password) {
      setError(t('auth.errorMissingFields')); triggerShake(); return;
    }
    if (TURNSTILE_KEY && !cfToken) {
      setError(t('auth.errorBotCheck') || 'Please wait for the security check to complete.');
      triggerShake(); return;
    }
    setLoading(true); setError('');
    try {
      const data = await login(form.username, form.password, cfToken);
      saveAuth(data); setSuccess(true);
      setTimeout(() => onSuccess(data.user), 500);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message || t('auth.errorGeneric'));
      triggerShake(); setLoading(false);
    }
  };

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 450); };
  const handlePwdKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsOn(e.getModifierState && e.getModifierState('CapsLock'));
    if (e.key === 'Enter') handleSubmit();
  };

  const iconSideCls = isRTL ? 'right-3' : 'left-3';
  const eyeSideCls = isRTL ? 'left-3' : 'right-3';
  const inputPad = isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10';

  return (
    <>
      <style>{`
        @keyframes mb-fade-up { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes mb-shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
        @keyframes mb-zoom { from { transform:scale(1.08); } to { transform:scale(1); } }
        .mb-enter { animation: mb-fade-up 0.55s ease-out both; }
        .mb-shake { animation: mb-shake 0.4s ease-in-out; }
        .mb-hero-img { animation: mb-zoom 12s ease-out forwards; }
        .mb-input { transition: border-color 0.2s, box-shadow 0.2s; }
        .mb-input:focus-within { border-color:#FF6B35; box-shadow:0 0 0 4px rgba(255,107,53,0.10); }
        .mb-btn { transition: transform 0.15s, box-shadow 0.2s, background 0.2s; }
        .mb-btn:not(:disabled):hover { transform:translateY(-1px); box-shadow:0 10px 24px rgba(255,107,53,0.30); }
        .mb-btn:not(:disabled):active { transform:scale(0.98); }
        .mb-pill { transition: background 0.2s, border-color 0.2s; }
        .mb-pill:hover { background:rgba(255,255,255,0.20); }
        .mb-cta { transition: border-color 0.2s, background 0.2s, color 0.2s; }
        .mb-cta:hover { border-color:#FF6B35; background:#FFF7F2; color:#FF6B35; }
        @media (prefers-reduced-motion: reduce) { .mb-enter, .mb-hero-img { animation: none; } }
      `}</style>

      <div className="min-h-screen w-full flex bg-[#F7F8FB]" dir={isRTL ? 'rtl' : 'ltr'}>

        {/* ── HERO (hidden on mobile) ── */}
        <aside className="hidden lg:flex relative w-[55%] overflow-hidden">
          <img src={HERO_URL} alt="Malaysia" className="mb-hero-img absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(15,39,66,0.78) 0%, rgba(15,39,66,0.55) 50%, rgba(255,107,53,0.55) 100%)' }} />

          {/* Top: brand */}
          <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
            <Link to="/" className="mb-enter inline-flex items-center gap-4">
              <img src="/logo.svg" alt="MYBRIDGE" className="h-24 xl:h-28 w-auto drop-shadow-lg" />
            </Link>

            {/* Middle: tagline */}
            <div className="mb-enter space-y-5" style={{ animationDelay: '0.15s' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/25 text-xs font-medium">
                <FontAwesomeIcon icon={faStar} className="text-[#C9A961]" />
                {t('auth.heroBadge')}
              </div>
              <h2 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
                {t('auth.heroTitle')}
              </h2>
              <p className="text-base text-white/85 max-w-md leading-relaxed">
                {t('auth.heroSubtitle')}
              </p>
            </div>

            {/* Bottom spacer (stats removed) */}
            <div />

          </div>
        </aside>

        {/* ── FORM SIDE ── */}
        <main className="flex-1 flex flex-col">
          {/* Top bar: lang + mobile logo */}
          <div className="flex items-center justify-between p-5 lg:p-6">
            <Link to="/" className="lg:hidden inline-flex items-center gap-2">
              <img src="/logo.svg" alt="MYBRIDGE" className="h-7 w-auto" />
              <span className="font-bold text-[#0F2742]">MYBRIDGE</span>
            </Link>
            <div className="flex gap-1.5 ms-auto">
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => changeLang(l.code as Language)}
                  className={`mb-pill text-xs font-semibold px-3 py-1.5 rounded-full border transition ${lang === l.code ? 'bg-[#0F2742] text-white border-[#0F2742]' : 'bg-white text-gray-600 border-gray-200 hover:text-[#0F2742]'}`}>
                  {l.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Form container */}
          <div className="flex-1 flex items-center justify-center px-6 py-8">
            <div className={`mb-enter w-full max-w-md ${shake ? 'mb-shake' : ''}`}>

              {/* Heading */}
              <div className="mb-7">
                <h1 className="text-3xl font-bold text-[#0F2742] mb-2">
                  {supplierMode ? t('auth.titleSupplier') : t('auth.title')}
                </h1>
                <p className="text-sm text-gray-500">
                  {supplierMode ? t('auth.subtitleSupplier') : t('auth.subtitle')}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 px-3 py-2.5 rounded-lg flex items-center gap-2 text-xs bg-red-50 border border-red-200 text-red-700">
                  <FontAwesomeIcon icon={faTriangleExclamation} />
                  {error}
                </div>
              )}

              {/* Email */}
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {t('auth.emailOrUsername')}
              </label>
              <div className="mb-input relative h-12 rounded-lg mb-4 flex items-center bg-white border border-gray-200">
                <FontAwesomeIcon icon={faEnvelope} className={`absolute ${iconSideCls} text-gray-400`} />
                <input ref={emailInputRef} type="text" autoComplete="username"
                  placeholder={t('auth.emailPlaceholder')}
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  disabled={loading || success}
                  className={`w-full h-full ${inputPad} bg-transparent border-0 outline-none text-sm text-[#0F2742] placeholder-gray-400`} />
              </div>

              {/* Password */}
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700">{t('auth.password')}</label>
                <a href="#" className="text-xs text-[#FF6B35] hover:underline">{t('auth.forgotPassword')}</a>
              </div>
              <div className="mb-input relative h-12 rounded-lg mb-2 flex items-center bg-white border border-gray-200">
                <FontAwesomeIcon icon={faLock} className={`absolute ${iconSideCls} text-gray-400`} />
                <input type={showPwd ? 'text' : 'password'} autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onKeyDown={handlePwdKeyEvent}
                  onKeyUp={e => setCapsOn(e.getModifierState && e.getModifierState('CapsLock'))}
                  disabled={loading || success}
                  className={`w-full h-full ${inputPad} bg-transparent border-0 outline-none text-sm text-[#0F2742] placeholder-gray-400`} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  aria-label={showPwd ? t('auth.hidePassword') : t('auth.showPassword')}
                  className={`absolute ${eyeSideCls} text-gray-400 hover:text-gray-600`}>
                  <FontAwesomeIcon icon={showPwd ? faEyeSlash : faEye} />
                </button>
              </div>
              {capsOn && (
                <div className="flex items-center gap-1.5 text-[11px] mb-2 text-amber-600">
                  <FontAwesomeIcon icon={faTriangleExclamation} />{t('auth.capsLockWarning')}
                </div>
              )}

              {/* Remember */}
              <label className="flex items-center gap-2 text-xs text-gray-600 mb-5 mt-3 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 cursor-pointer accent-[#FF6B35]" />
                {t('auth.rememberMe')}
              </label>

              <TurnstileWidget onToken={setCfToken} className="my-2" />

              {/* Submit */}
              <button onClick={handleSubmit} disabled={loading || success}
                className="mb-btn w-full h-12 bg-[#FF6B35] text-white rounded-lg flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-70 cursor-pointer shadow-md">
                {success ? (
                  <><FontAwesomeIcon icon={faCheck} />{t('auth.signIn')}</>
                ) : loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('auth.signingIn')}</>
                ) : (
                  <>{t('auth.signIn')}<FontAwesomeIcon icon={faArrowRight} className={isRTL ? 'rotate-180' : ''} /></>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] text-gray-400 uppercase tracking-wider">{t('auth.or')}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* CTA cards (compact) */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => navigate('/register/supplier')}
                  className="mb-cta group p-4 bg-white border-2 border-gray-200 rounded-xl text-start cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <FontAwesomeIcon icon={faBuilding} className="text-[#FF6B35]" />
                    <span className="text-sm font-semibold text-[#0F2742] group-hover:text-[#FF6B35] transition">{t('auth.supplier')}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-snug">{t('auth.supplierDesc')}</p>
                </button>
                <button onClick={() => navigate('/register/agency')}
                  className="mb-cta group p-4 bg-white border-2 border-gray-200 rounded-xl text-start cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <FontAwesomeIcon icon={faUserTie} className="text-[#FF6B35]" />
                    <span className="text-sm font-semibold text-[#0F2742] group-hover:text-[#FF6B35] transition">{t('auth.agency')}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-snug">{t('auth.agencyDesc')}</p>
                </button>
              </div>

              {/* Supplier OTP login — prominent blue button */}
              <Link to="/supplier"
                className="mb-btn mt-5 w-full h-12 bg-[#0F2742] hover:bg-[#143055] text-white rounded-lg flex items-center justify-center gap-2 text-sm font-semibold no-underline shadow-md">
                <FontAwesomeIcon icon={faBuilding} />
                {t('auth.supplierLogin')}
                <FontAwesomeIcon icon={faArrowRight} className={isRTL ? 'rotate-180' : ''} />
              </Link>

              <div className="text-center mt-4 text-xs text-gray-500">
                <FontAwesomeIcon icon={faShieldHalved} className="me-1 text-gray-400" />
                {t('auth.secureConnection')}
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center text-[11px] text-gray-400 py-5">
            © 2026 MYBRIDGE · {t('auth.trustedBy')}
          </footer>
        </main>
      </div>
    </>
  );
}

function Stat({ number, label, icon }: { number: string; label: string; icon?: any }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-2xl xl:text-3xl font-bold">
        {icon && <FontAwesomeIcon icon={icon} className="text-[#C9A961] text-base" />}
        {number}
      </div>
      <div className="text-[11px] text-white/70 mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}
