// src/pages/auth/RegisterAgencyPage.tsx
import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { CountryCityPicker } from '../../components/forms/CountryCityPicker';
import { useLanguage } from '../../hooks/useLanguage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserTie, faEnvelope, faArrowRight, faArrowLeft,
  faCheckCircle, faUser, faPhone, faBuilding, faMapMarkerAlt,
  faGlobe, faIdCard, faFileContract, faImage,
  faUpload, faFilePdf, faTimesCircle, faBriefcase,
} from '@fortawesome/free-solid-svg-icons';

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// ════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════

interface TextForm {
  name: string;
  registration_number: string;
  country: string;
  city: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  contact_person_name: string;
  contact_person_position: string;
  contact_person_phone: string;
}

interface FilesForm {
  trade_license:     File | null;
  owner_id_document: File | null;
  logo:              File | null;
}

// ════════════════════════════════════════════════════════════════
// Component
// ════════════════════════════════════════════════════════════════

export function RegisterAgencyPage() {
  const navigate = useNavigate();
  const { lang, changeLang, t, isRTL } = useLanguage();

  const [step, setStep]       = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const [form, setForm] = useState<TextForm>({
    name: '',
    registration_number: '',
    country: 'Malaysia',
    city: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    contact_person_name: '',
    contact_person_position: '',
    contact_person_phone: '',
  });

  const [files, setFiles] = useState<FilesForm>({
    trade_license: null,
    owner_id_document: null,
    logo: null,
  });

  const set = <K extends keyof TextForm>(k: K, v: TextForm[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const setFile = <K extends keyof FilesForm>(k: K, f: File | null) =>
    setFiles(p => ({ ...p, [k]: f }));

  // ──────────────────────────────────────────────────────────
  // Validation per step
  // ──────────────────────────────────────────────────────────

  const validateStep1 = (): string | null => {
    if (!form.name.trim())                return t('registerAgency.errNameRequired');
    if (!form.registration_number.trim()) return t('registerAgency.errRegistrationRequired');
    if (!form.country.trim())             return t('registerAgency.errCountryRequired');
    if (!form.city.trim())                return t('registerAgency.errCityRequired');
    if (!form.address.trim())             return t('registerAgency.errAddressRequired');
    return null;
  };

  const validateStep2 = (): string | null => {
    if (!form.email.trim())                   return t('registerAgency.errEmailRequired');
    if (!/\S+@\S+\.\S+/.test(form.email))     return t('registerAgency.errEmailInvalid');
    if (!form.phone.trim())                   return t('registerAgency.errPhoneRequired');
    if (!form.contact_person_name.trim())     return t('registerAgency.errContactNameRequired');
    if (!form.contact_person_position.trim()) return t('registerAgency.errContactPositionRequired');
    if (!form.contact_person_phone.trim())    return t('registerAgency.errContactPhoneRequired');
    return null;
  };

  const validateStep3 = (): string | null => {
    if (!files.trade_license)     return t('registerAgency.errTradeLicenseRequired');
    if (!files.owner_id_document) return t('registerAgency.errOwnerIdRequired');
    const MAX_DOC  = 5 * 1024 * 1024;
    const MAX_LOGO = 2 * 1024 * 1024;
    if (files.trade_license.size > MAX_DOC)       return t('registerAgency.errTradeLicenseSize');
    if (files.owner_id_document.size > MAX_DOC)   return t('registerAgency.errOwnerIdSize');
    if (files.logo && files.logo.size > MAX_LOGO) return t('registerAgency.errLogoSize');
    return null;
  };

  // ──────────────────────────────────────────────────────────
  // Submit — uses FormData for multipart upload
  // ──────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setError('');
    const err = validateStep3();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      // نصوص
      (Object.keys(form) as (keyof TextForm)[]).forEach(k => {
        const v = form[k];
        if (v !== null && v !== undefined && String(v).trim() !== '') {
          fd.append(k, String(v));
        }
      });
      // ملفات
      if (files.trade_license)     fd.append('trade_license',     files.trade_license);
      if (files.owner_id_document) fd.append('owner_id_document', files.owner_id_document);
      if (files.logo)              fd.append('logo',              files.logo);

      const res = await fetch(`${BASE}/api/v1/waitlist-agency/register/`, {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg  = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' — ');
        setError(msg || `${t('registerAgency.errGeneric')} ${res.status}`);
        return;
      }

      setSuccess(true);
    } catch {
      setError(t('registerAgency.errConnection'));
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────
  // Shared styles
  // ──────────────────────────────────────────────────────────

  const iconSideCls = isRTL
    ? 'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm'
    : 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm';

  const inputCls = isRTL
    ? 'w-full h-12 pl-4 pr-10 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-colors bg-white'
    : 'w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-colors bg-white';

  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide';

  // ──────────────────────────────────────────────────────────
  // SUCCESS SCREEN
  // ──────────────────────────────────────────────────────────

  if (success) return (
    <div className="min-h-screen bg-[#F9FAFB]" dir={isRTL ? 'rtl' : 'ltr'}>
      <PublicNavbar
        variant="solid"
        lang={lang} onLangChange={changeLang} t={t} isRTL={isRTL}
        onLogin={() => navigate('/supplier')}
        onSupplier={() => navigate('/register/supplier')}
        onAgency={() => navigate('/register/agency')}
      />
      <div className="pt-16 flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-4xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('registerAgency.successTitle')}</h2>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">
            {t('registerAgency.successDescP1')}{' '}
            <span className="font-bold text-gray-800">You Need Travel</span>
            {t('registerAgency.successDescP2')}{' '}
            <span className="font-bold text-[#FF6B35]">{form.email}</span>{' '}
            {t('registerAgency.successDescP3')}
          </p>
          <div className={`bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
            <p className="text-xs font-semibold text-orange-800 mb-1">{t('registerAgency.successNoteLabel')}</p>
            <p className="text-xs text-orange-700 leading-relaxed">
              {t('registerAgency.successNoteText')}
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-[#FF6B35] hover:bg-[#e07a38] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {t('registerAgency.backToHome')} <FontAwesomeIcon icon={isRTL ? faArrowLeft : faArrowRight} />
          </button>
        </div>
      </div>
    </div>
  );

  // ──────────────────────────────────────────────────────────
  // MAIN RENDER
  // ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F9FAFB]" dir={isRTL ? 'rtl' : 'ltr'}>
      <PublicNavbar
        variant="solid"
        lang={lang} onLangChange={changeLang} t={t} isRTL={isRTL}
        onLogin={() => navigate('/supplier')}
        onSupplier={() => navigate('/register/supplier')}
        onAgency={() => navigate('/register/agency')}
      />

      <div className="pt-20 pb-10 flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
        <div className="w-full max-w-2xl">

          {/* Hero */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#FF6B35] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FontAwesomeIcon icon={faUserTie} className="text-white text-2xl" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('registerAgency.pageTitle')}</h1>
            <p className="text-gray-500 text-sm">{t('registerAgency.pageSubtitle')}</p>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-8 flex-wrap">
            {[
              { n: 1, label: t('registerAgency.step1Label') },
              { n: 2, label: t('registerAgency.step2Label') },
              { n: 3, label: t('registerAgency.step3Label') },
            ].map(({ n, label }, i) => (
              <div key={n} className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${step >= n ? 'bg-[#FF6B35] text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                  {step > n ? <FontAwesomeIcon icon={faCheckCircle} /> : n}
                </div>
                <span className={`text-xs font-medium hidden sm:inline ${step >= n ? 'text-[#FF6B35]' : 'text-gray-400'}`}>
                  {label}
                </span>
                {i < 2 && <div className={`w-6 md:w-10 h-0.5 ${step > n ? 'bg-[#FF6B35]' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">

            {error && (
              <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                <FontAwesomeIcon icon={faTimesCircle} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ═══════ STEP 1 — Agency Info ═══════ */}
            {step === 1 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FontAwesomeIcon icon={faBuilding} className="text-[#FF6B35]" />
                  {t('registerAgency.sectionAgencyInfo')}
                </h3>

                <div>
                  <label className={labelCls}>{t('registerAgency.nameLabel')}</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faBuilding} className={iconSideCls} />
                    <input className={inputCls} placeholder={t('registerAgency.namePlaceholder')}
                      value={form.name} onChange={e => set('name', e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>{t('registerAgency.registrationLabel')}</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faIdCard} className={iconSideCls} />
                    <input className={inputCls} placeholder={t('registerAgency.registrationPlaceholder')}
                      value={form.registration_number} onChange={e => set('registration_number', e.target.value)} />
                  </div>
                </div>

                <CountryCityPicker
                  lang={lang}
                  isRTL={isRTL}
                  required
                  countryLabel={t('registerAgency.countryLabel')}
                  cityLabel={t('registerAgency.cityLabel')}
                  cityName={form.city}
                  onCountryChange={(_iso, country) => {
                    // نحفظ اسم الدولة (للتوافق مع Backend)
                    set('country', country?.label || '');
                    set('city', '');
                  }}
                  onCityChange={(cityName) => {
                    set('city', cityName);
                  }}
                />

                <div>
                  <label className={labelCls}>{t('registerAgency.addressLabel')}</label>
                  <textarea
                    className="w-full min-h-[80px] p-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-colors bg-white resize-none"
                    placeholder={t('registerAgency.addressPlaceholder')}
                    value={form.address} onChange={e => set('address', e.target.value)} />
                </div>

                <div>
                  <label className={labelCls}>{t('registerAgency.websiteLabel')}</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faGlobe} className={iconSideCls} />
                    <input className={inputCls} type="url" placeholder={t('registerAgency.websitePlaceholder')}
                      value={form.website} onChange={e => set('website', e.target.value)} />
                  </div>
                </div>

                <button
                  onClick={() => {
                    const err = validateStep1();
                    if (err) { setError(err); return; }
                    setError(''); setStep(2);
                  }}
                  className="w-full bg-[#FF6B35] hover:bg-[#e07a38] text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  {t('registerAgency.next')} <FontAwesomeIcon icon={isRTL ? faArrowLeft : faArrowRight} />
                </button>
              </div>
            )}

            {/* ═══════ STEP 2 — Contact ═══════ */}
            {step === 2 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FontAwesomeIcon icon={faPhone} className="text-[#FF6B35]" />
                  {t('registerAgency.sectionContact')}
                </h3>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-3 uppercase">{t('registerAgency.agencyContactHeader')}</p>
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>{t('registerAgency.emailLabel')}</label>
                      <div className="relative">
                        <FontAwesomeIcon icon={faEnvelope} className={iconSideCls} />
                        <input className={inputCls} type="email" placeholder={t('registerAgency.emailPlaceholder')}
                          value={form.email} onChange={e => set('email', e.target.value)} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{t('registerAgency.emailHelp')}</p>
                    </div>
                    <div>
                      <label className={labelCls}>{t('registerAgency.phoneLabel')}</label>
                      <div className="relative">
                        <FontAwesomeIcon icon={faPhone} className={iconSideCls} />
                        <input className={inputCls} placeholder={t('registerAgency.phonePlaceholder')}
                          value={form.phone} onChange={e => set('phone', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-3 uppercase">{t('registerAgency.contactPersonHeader')}</p>
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>{t('registerAgency.contactNameLabel')}</label>
                      <div className="relative">
                        <FontAwesomeIcon icon={faUser} className={iconSideCls} />
                        <input className={inputCls} placeholder={t('registerAgency.contactNamePlaceholder')}
                          value={form.contact_person_name} onChange={e => set('contact_person_name', e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>{t('registerAgency.contactPositionLabel')}</label>
                        <div className="relative">
                          <FontAwesomeIcon icon={faBriefcase} className={iconSideCls} />
                          <input className={inputCls} placeholder={t('registerAgency.contactPositionPlaceholder')}
                            value={form.contact_person_position} onChange={e => set('contact_person_position', e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>{t('registerAgency.contactPhoneLabel')}</label>
                        <div className="relative">
                          <FontAwesomeIcon icon={faPhone} className={iconSideCls} />
                          <input className={inputCls} placeholder={t('registerAgency.contactPhonePlaceholder')}
                            value={form.contact_person_phone} onChange={e => set('contact_person_phone', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => { setError(''); setStep(1); }}
                    className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={isRTL ? faArrowRight : faArrowLeft} /> {t('registerAgency.back')}
                  </button>
                  <button
                    onClick={() => {
                      const err = validateStep2();
                      if (err) { setError(err); return; }
                      setError(''); setStep(3);
                    }}
                    className="flex-1 bg-[#FF6B35] hover:bg-[#e07a38] text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {t('registerAgency.next')} <FontAwesomeIcon icon={isRTL ? faArrowLeft : faArrowRight} />
                  </button>
                </div>
              </div>
            )}

            {/* ═══════ STEP 3 — Documents ═══════ */}
            {step === 3 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <FontAwesomeIcon icon={faFileContract} className="text-[#FF6B35]" />
                  {t('registerAgency.sectionDocuments')}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {t('registerAgency.documentsHint')}
                </p>

                <FileUploadField
                  label={t('registerAgency.tradeLicenseLabel')}
                  icon={faFileContract}
                  file={files.trade_license}
                  onChange={f => setFile('trade_license', f)}
                  accept=".pdf,.jpg,.jpeg,.png"
                  description={t('registerAgency.tradeLicenseDesc')}
                  clickToUploadText={t('registerAgency.clickToUpload')}
                />

                <FileUploadField
                  label={t('registerAgency.ownerIdLabel')}
                  icon={faIdCard}
                  file={files.owner_id_document}
                  onChange={f => setFile('owner_id_document', f)}
                  accept=".pdf,.jpg,.jpeg,.png"
                  description={t('registerAgency.ownerIdDesc')}
                  clickToUploadText={t('registerAgency.clickToUpload')}
                />

                <FileUploadField
                  label={t('registerAgency.logoLabel')}
                  icon={faImage}
                  file={files.logo}
                  onChange={f => setFile('logo', f)}
                  accept=".jpg,.jpeg,.png,.webp"
                  description={t('registerAgency.logoDesc')}
                  clickToUploadText={t('registerAgency.clickToUpload')}
                />

                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mt-4">
                  <p className="text-xs font-semibold text-orange-800 mb-1">{t('registerAgency.beforeSubmit')}</p>
                  <p className="text-xs text-orange-700 leading-relaxed">
                    {t('registerAgency.beforeSubmitText')}
                  </p>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => { setError(''); setStep(2); }}
                    disabled={loading}
                    className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={isRTL ? faArrowRight : faArrowLeft} /> {t('registerAgency.back')}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-[#FF6B35] hover:bg-[#e07a38] text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('registerAgency.submitting')}</>
                      : <>{t('registerAgency.submit')} <FontAwesomeIcon icon={faCheckCircle} /></>}
                  </button>
                </div>
              </div>
            )}

            <p className="text-center text-sm text-gray-500 mt-6">
              {t('registerAgency.haveAccount')}{' '}
              <Link to="/dashboard" className="text-[#FF6B35] font-semibold hover:underline">{t('registerAgency.loginHere')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// FileUploadField — مكوّن مستقل لرفع الملفات مع preview
// ════════════════════════════════════════════════════════════════

interface FileUploadFieldProps {
  label: string;
  icon: any;
  file: File | null;
  onChange: (f: File | null) => void;
  accept: string;
  description?: string;
  clickToUploadText: string;
}

function FileUploadField({ label, icon, file, onChange, accept, description, clickToUploadText }: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}
      </label>

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl p-5 hover:border-[#FF6B35] hover:bg-orange-50/50 transition-all text-center group"
        >
          <FontAwesomeIcon icon={faUpload} className="text-gray-400 text-2xl mb-2 group-hover:text-[#FF6B35] transition-colors" />
          <div className="text-sm font-semibold text-gray-700 mb-1">{clickToUploadText}</div>
          {description && <div className="text-xs text-gray-500">{description}</div>}
        </button>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={file.type === 'application/pdf' ? faFilePdf : faImage} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{file.name}</div>
            <div className="text-xs text-gray-500">{formatSize(file.size)}</div>
          </div>
          <button
            type="button"
            onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ''; }}
            className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
            aria-label="Delete"
          >
            <FontAwesomeIcon icon={faTimesCircle} className="text-xl" />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0] || null;
          onChange(f);
        }}
      />
    </div>
  );
}
