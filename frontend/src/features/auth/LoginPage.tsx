// src/features/auth/LoginPage.tsx
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope, faLock, faEye, faEyeSlash,
  faArrowRight, faBuilding, faUserTie,
  faTriangleExclamation, faShieldHalved, faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { login, saveAuth } from '../../services/authService';
import type { AuthUser } from '../../services/authService';
import { useLanguage } from '../../hooks/useLanguage';
import { LANGUAGES, type Language } from '../../i18n/index';

interface Props {
  onSuccess:    (user: AuthUser) => void;
  supplierMode?: boolean;
}

export function LoginPage({ onSuccess, supplierMode = false }: Props) {
  const { t, isRTL, lang, changeLang } = useLanguage();

  const [form, setForm]       = useState({ username: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');
  const [shake, setShake]     = useState(false);
  const [capsOn, setCapsOn]   = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus email on mount
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!form.username || !form.password) {
      setError(t('auth.errorMissingFields'));
      triggerShake();
      return;
    }
    setLoading(true); setError('');
    try {
      const data = await login(form.username, form.password);
      saveAuth(data);
      setSuccess(true);
      // Small delay to show success checkmark
      setTimeout(() => onSuccess(data.user), 500);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message || t('auth.errorGeneric'));
      triggerShake();
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const handlePwdKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsOn(e.getModifierState && e.getModifierState('CapsLock'));
    if (e.key === 'Enter') handleSubmit();
  };

  const iconSideCls = isRTL ? 'right-3' : 'left-3';
  const eyeSideCls  = isRTL ? 'left-3'  : 'right-3';
  const inputPad    = isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10';

  return (
    <>
      <style>{`
        @keyframes mb-bg-shift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes mb-orb-1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,-30px) scale(1.1); } }
        @keyframes mb-orb-2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-50px,35px) scale(1.15); } }
        @keyframes mb-orb-3 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(25px,40px) scale(0.9); } }
        @keyframes mb-fade-up { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mb-shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-10px)} 40%,80%{transform:translateX(10px)} }
        .mb-bg { background-size: 200% 200%; animation: mb-bg-shift 20s ease-in-out infinite; }
        .mb-orb-1 { animation: mb-orb-1 18s ease-in-out infinite; }
        .mb-orb-2 { animation: mb-orb-2 22s ease-in-out infinite; }
        .mb-orb-3 { animation: mb-orb-3 26s ease-in-out infinite; }
        .mb-card-enter { animation: mb-fade-up 0.6s ease-out both; }
        .mb-shake { animation: mb-shake 0.45s ease-in-out; }
        .mb-panel { transition: transform 0.25s ease, background 0.25s ease, border-color 0.25s ease; }
        .mb-panel:hover { transform: translateY(-3px); background: rgba(255,255,255,0.28); border-color: rgba(255,255,255,0.55); }
        .mb-panel:hover .mb-panel-icon { transform: scale(1.08); }
        .mb-panel-icon { transition: transform 0.25s ease; }
        .mb-input-wrap { transition: background 0.2s, border-color 0.2s; }
        .mb-input-wrap:hover { background: rgba(255,255,255,0.26); border-color: rgba(255,255,255,0.45); }
        .mb-input-wrap:focus-within { background: rgba(255,255,255,0.3); border-color: rgba(255,255,255,0.7); }
        .mb-btn { transition: transform 0.15s, box-shadow 0.2s; }
        .mb-btn:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(0,0,0,0.12); }
        .mb-btn:not(:disabled):active { transform: scale(0.98); }
        .mb-lang-btn { transition: background 0.2s; }
        .mb-lang-btn:hover { background: rgba(255,255,255,0.3); }
        @media (prefers-reduced-motion: reduce) {
          .mb-bg, .mb-orb-1, .mb-orb-2, .mb-orb-3, .mb-card-enter { animation: none; }
        }
      `}</style>

      <div
        className="mb-bg min-h-screen relative overflow-hidden p-4 md:p-8 flex items-center justify-center"
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{ background: 'linear-gradient(135deg, #FF5722 0%, #FF6B35 25%, #FF8F3C 50%, #FFA647 75%, #FFB547 100%)' }}
      >

        {/* Floating orbs */}
        <div className="mb-orb-1 absolute rounded-full pointer-events-none" style={{ top: '10%', left: '12%', width: 240, height: 240, background: 'rgba(255,255,255,0.2)', filter: 'blur(40px)' }} />
        <div className="mb-orb-2 absolute rounded-full pointer-events-none" style={{ bottom: '10%', right: '15%', width: 260, height: 260, background: 'rgba(255,255,255,0.15)', filter: 'blur(45px)' }} />
        <div className="mb-orb-3 absolute rounded-full pointer-events-none" style={{ top: '50%', right: '40%', width: 160, height: 160, background: 'rgba(255,255,255,0.12)', filter: 'blur(35px)' }} />

        {/* Language switcher */}
        <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} z-10 flex gap-1.5`}>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => changeLang(l.code as Language)}
              className="mb-lang-btn text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer"
              style={{
                background: lang === l.code ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.2)',
                border: `1px solid ${lang === l.code ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.35)'}`,
                color: 'white',
              }}
            >
              {l.code.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Content wrapper */}
        <div className="relative w-full max-w-5xl">

          {/* Brand header */}
          <Link to="/" className="mb-card-enter inline-flex items-center gap-2 mb-6" style={{ animationDelay: '0s' }}>
            <img src="/logo.svg" alt="MYBRIDGE" className="h-9 w-auto drop-shadow" />
            <span className="font-semibold text-white text-lg">MYBRIDGE</span>
          </Link>

          {/* Grid */}
          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4">

            {/* ─── LEFT: Login Card ─── */}
            <div
              className={`mb-card-enter ${shake ? 'mb-shake' : ''} rounded-2xl p-6 md:p-8 flex flex-col justify-center`}
              style={{
                animationDelay: '0.1s',
                background: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(22px)',
                WebkitBackdropFilter: 'blur(22px)',
                border: '1px solid rgba(255,255,255,0.4)',
              }}
            >
              <div className="w-11 h-11 bg-white/95 rounded-xl flex items-center justify-center mb-3 shadow-sm">
                <FontAwesomeIcon
                  icon={supplierMode ? faBuilding : faShieldHalved}
                  className="text-[#FF6B35] text-lg"
                />
              </div>

              <h1 className="text-2xl font-semibold text-white mb-1">
                {supplierMode ? t('auth.titleSupplier') : t('auth.title')}
              </h1>
              <p className="text-sm text-white/85 mb-6">
                {supplierMode ? t('auth.subtitleSupplier') : t('auth.subtitle')}
              </p>

              {/* Error banner */}
              {error && (
                <div className="mb-4 px-3 py-2.5 rounded-lg flex items-center gap-2 text-xs" style={{ background: 'rgba(255,200,200,0.25)', border: '1px solid rgba(255,180,180,0.5)', color: 'white' }}>
                  <FontAwesomeIcon icon={faTriangleExclamation} className="text-xs flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Email field */}
              <label className="block text-[10px] font-semibold text-white/85 mb-1.5 uppercase tracking-wider">
                {t('auth.emailOrUsername')}
              </label>
              <div className="mb-input-wrap relative h-11 rounded-lg mb-3 flex items-center" style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}>
                <FontAwesomeIcon icon={faEnvelope} className={`absolute ${iconSideCls} text-white/70 text-sm`} />
                <input
                  ref={emailInputRef}
                  type="text"
                  autoComplete="username"
                  placeholder={t('auth.emailPlaceholder')}
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  disabled={loading || success}
                  className={`w-full h-full ${inputPad} bg-transparent border-0 outline-none text-sm text-white placeholder-white/60`}
                />
              </div>

              {/* Password field */}
              <label className="block text-[10px] font-semibold text-white/85 mb-1.5 uppercase tracking-wider">
                {t('auth.password')}
              </label>
              <div className="mb-input-wrap relative h-11 rounded-lg mb-2 flex items-center" style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}>
                <FontAwesomeIcon icon={faLock} className={`absolute ${iconSideCls} text-white/70 text-sm`} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onKeyDown={handlePwdKeyEvent}
                  onKeyUp={e => setCapsOn(e.getModifierState && e.getModifierState('CapsLock'))}
                  disabled={loading || success}
                  className={`w-full h-full ${inputPad} bg-transparent border-0 outline-none text-sm text-white placeholder-white/60`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  aria-label={showPwd ? t('auth.hidePassword') : t('auth.showPassword')}
                  className={`absolute ${eyeSideCls} text-white/70 hover:text-white`}
                >
                  <FontAwesomeIcon icon={showPwd ? faEyeSlash : faEye} className="text-sm" />
                </button>
              </div>

              {/* Caps Lock warning */}
              {capsOn && (
                <div className="flex items-center gap-1.5 text-[11px] mb-2" style={{ color: '#FFE8B0' }}>
                  <FontAwesomeIcon icon={faTriangleExclamation} className="text-[10px]" />
                  {t('auth.capsLockWarning')}
                </div>
              )}

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between mb-4 mt-1">
                <label className="flex items-center gap-1.5 text-xs text-white/90 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="w-3.5 h-3.5 cursor-pointer"
                    style={{ accentColor: 'white' }}
                  />
                  {t('auth.rememberMe')}
                </label>
                <a href="#" className="text-xs text-white/90 hover:text-white border-b border-white/40 hover:border-white">
                  {t('auth.forgotPassword')}
                </a>
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={loading || success}
                className="mb-btn w-full h-11 bg-white rounded-lg flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-80 cursor-pointer"
                style={{ color: '#FF6B35' }}
              >
                {success ? (
                  <><FontAwesomeIcon icon={faCheck} /> {t('auth.signIn')}</>
                ) : loading ? (
                  <><div className="w-4 h-4 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" /> {t('auth.signingIn')}</>
                ) : (
                  <>{t('auth.signIn')} <FontAwesomeIcon icon={faArrowRight} className={isRTL ? 'rotate-180' : ''} /></>
                )}
              </button>

              {/* Trust badge */}
              <div className="flex items-center justify-center gap-1.5 mt-4 text-[10px] text-white/80">
                <FontAwesomeIcon icon={faShieldHalved} className="text-[9px]" />
                {t('auth.secureConnection')}
              </div>
            </div>

            {/* ─── RIGHT: Supplier + Agency Panels ─── */}
            <div className="flex flex-col gap-4">

              {/* Supplier */}
              <Link
                to="/register/supplier"
                className="mb-card-enter mb-panel flex-1 rounded-2xl p-6 flex flex-col items-center justify-center text-center no-underline"
                style={{
                  animationDelay: '0.25s',
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(22px)',
                  WebkitBackdropFilter: 'blur(22px)',
                  border: '1px solid rgba(255,255,255,0.35)',
                }}
              >
                <div className="mb-panel-icon w-12 h-12 bg-white/95 rounded-xl flex items-center justify-center mb-3 shadow-sm">
                  <FontAwesomeIcon icon={faBuilding} className="text-[#FF6B35] text-xl" />
                </div>
                <div className="text-sm font-semibold text-white mb-0.5">{t('auth.supplier')}</div>
                <div className="text-[11px] text-white/85 mb-3">{t('auth.supplierDesc')}</div>
                <div className="text-xs text-white border border-white/50 rounded-full px-3 py-1">
                  {t('auth.register')} {isRTL ? '←' : '→'}
                </div>
              </Link>

              {/* Agency */}
              <Link
                to="/register/agency"
                className="mb-card-enter mb-panel flex-1 rounded-2xl p-6 flex flex-col items-center justify-center text-center no-underline"
                style={{
                  animationDelay: '0.4s',
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(22px)',
                  WebkitBackdropFilter: 'blur(22px)',
                  border: '1px solid rgba(255,255,255,0.35)',
                }}
              >
                <div className="mb-panel-icon w-12 h-12 bg-white/95 rounded-xl flex items-center justify-center mb-3 shadow-sm">
                  <FontAwesomeIcon icon={faUserTie} className="text-[#FF6B35] text-xl" />
                </div>
                <div className="text-sm font-semibold text-white mb-0.5">{t('auth.agency')}</div>
                <div className="text-[11px] text-white/85 mb-3">{t('auth.agencyDesc')}</div>
                <div className="text-xs text-white border border-white/50 rounded-full px-3 py-1">
                  {t('auth.register')} {isRTL ? '←' : '→'}
                </div>
              </Link>

            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-[11px] text-white/75 mt-6">
            {t('auth.trustedBy')} · © 2026 MYBRIDGE
          </div>

        </div>
      </div>
    </>
  );
}
