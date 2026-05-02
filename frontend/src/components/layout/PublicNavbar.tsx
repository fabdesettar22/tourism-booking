import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars, faXmark, faChevronDown,
  faBuilding, faUserTie,
} from '@fortawesome/free-solid-svg-icons';
import { LANGUAGES, type Language } from '../../i18n/index';

type NavbarVariant = 'hero' | 'solid';

interface PublicNavbarProps {
  onLogin?:     () => void;
  onSupplier?:  () => void;
  onAgency?:    () => void;
  lang:         Language;
  onLangChange: (l: Language) => void;
  t:            (k: string) => string;
  isRTL:        boolean;
  variant?:     NavbarVariant;
}

export function PublicNavbar({
  onLogin,
  onSupplier,
  onAgency,
  lang,
  onLangChange,
  t,
  isRTL,
  variant = 'hero',
}: PublicNavbarProps) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  // ── Handlers (fallback to navigate if no callback provided) ──
  const handleLogin    = () => onLogin    ? onLogin()    : navigate('/login');
  const handleSupplier = () => onSupplier ? onSupplier() : navigate('/register/supplier');
  const handleAgency   = () => onAgency   ? onAgency()   : navigate('/register/agency');

  const navLinks = [
    { key: 'nav.home',         label: t('nav.home'),         href: '/'             },
    { key: 'nav.tours',        label: t('nav.tours'),        href: '/tours'        },
    { key: 'nav.destinations', label: t('nav.destinations'), href: '/destinations' },
    { key: 'nav.activities',   label: t('nav.activities'),   href: '/activities'   },
    { key: 'nav.hotels',       label: t('nav.hotels'),       href: '/hotels'       },
    { key: 'nav.blog',         label: t('nav.blog'),         href: '/blog'         },
  ];

  const currentLang = LANGUAGES.find(l => l.code === lang);

  const isSolid = variant === 'solid';
  const useLightBg = isSolid || scrolled;

  const navBg = isSolid
    ? 'bg-white shadow-md border-b border-gray-100'
    : (scrolled ? 'bg-white shadow-md' : 'bg-transparent');

  const linkCls = isSolid
    ? 'text-gray-700 hover:text-[#FF6B35] hover:bg-orange-50'
    : (scrolled
        ? 'text-gray-600 hover:text-[#FF6B35] hover:bg-orange-50'
        : 'text-white/90 hover:text-white hover:bg-white/10');

  const langBtnCls = isSolid
    ? 'border-gray-200 text-gray-700 hover:border-[#FF6B35] hover:text-[#FF6B35]'
    : (scrolled
        ? 'border-gray-200 text-gray-600 hover:border-[#FF6B35] hover:text-[#FF6B35]'
        : 'border-white/30 text-white hover:bg-white/10');

  const registerBtnCls = isSolid
    ? 'border-[#FF6B35] text-[#FF6B35] hover:bg-orange-50'
    : (scrolled
        ? 'border-[#FF6B35] text-[#FF6B35] hover:bg-orange-50'
        : 'border-white/40 text-white hover:bg-white/10');

  const mobileToggleCls = useLightBg ? 'text-gray-700' : 'text-white';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[auto_1fr_auto] lg:grid-cols-3 items-center h-16 gap-4">

          {/* Logo (col 1) */}
          <Link to="/" className="flex items-center flex-shrink-0 justify-self-start">
            <img src="/IMG_7936.PNG" alt="MYBRIDGE" className="h-10 w-auto" />
          </Link>

          {/* Desktop Links (col 2 — centered) */}
          <div className="hidden lg:flex items-center gap-1 justify-self-center">
            {navLinks.map((link) => (
              <a
                key={link.key}
                href={link.href}
                onClick={(e) => { e.preventDefault(); navigate(link.href); }}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${linkCls}`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Side (col 3) */}
          <div className={`flex items-center gap-2 justify-self-end ${isRTL ? 'flex-row-reverse' : ''}`}>

            {/* Language */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition-all ${langBtnCls}`}
              >
                {currentLang?.code.toUpperCase()}
                <FontAwesomeIcon icon={faChevronDown} className="text-[9px]" />
              </button>
              {langOpen && (
                <div className="absolute top-full mt-1 right-0 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50 min-w-[140px]">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { onLangChange(l.code); setLangOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-orange-50 hover:text-[#FF6B35] ${
                        lang === l.code ? 'text-[#FF6B35] font-semibold bg-orange-50' : 'text-gray-700'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Supplier / Agency */}
            <div className="hidden lg:flex items-center gap-1.5">
              <button
                onClick={handleSupplier}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${registerBtnCls}`}
              >
                <FontAwesomeIcon icon={faBuilding} className="text-[10px]" />
                {t('nav.supplier')}
              </button>
              <button
                onClick={handleAgency}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${registerBtnCls}`}
              >
                <FontAwesomeIcon icon={faUserTie} className="text-[10px]" />
                {t('nav.agency')}
              </button>
            </div>

            {/* Sign In */}
            <button
              onClick={handleLogin}
              className="bg-[#FF6B35] hover:bg-[#e07a38] text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
            >
              {t('nav.signIn')}
            </button>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`lg:hidden p-2 rounded-lg ${mobileToggleCls}`}
            >
              <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div
            className="lg:hidden bg-white border-t border-gray-100 py-3 px-2"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {navLinks.map((link) => (
              <a
                key={link.key}
                href={link.href}
                onClick={(e) => { e.preventDefault(); navigate(link.href); setMenuOpen(false); }}
                className="block px-4 py-2.5 text-sm text-gray-700 hover:text-[#FF6B35] hover:bg-orange-50 rounded-lg"
              >
                {link.label}
              </a>
            ))}
            <div className="border-t border-gray-100 mt-2 pt-2 space-y-1">
              <button
                onClick={() => { handleSupplier(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-[#FF6B35] font-semibold hover:bg-orange-50 rounded-lg flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faBuilding} /> {t('nav.supplier')}
              </button>
              <button
                onClick={() => { handleAgency(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-[#FF6B35] font-semibold hover:bg-orange-50 rounded-lg flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faUserTie} /> {t('nav.agency')}
              </button>
              <button
                onClick={() => { handleLogin(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm bg-[#FF6B35] text-white font-semibold hover:bg-[#e07a38] rounded-lg"
              >
                {t('nav.signIn')}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
