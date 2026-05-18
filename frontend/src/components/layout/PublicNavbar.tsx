import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars, faXmark, faChevronDown,
  faBuilding, faUserTie,
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { LANGUAGES, type Language } from '../../i18n/index';

interface PublicNavbarProps {
  onLogin?:     () => void;
  onSupplier?:  () => void;
  onAgency?:    () => void;
  lang:         Language;
  onLangChange: (l: Language) => void;
  t:            (k: string) => string;
  isRTL:        boolean;
  variant?:     'hero' | 'solid';
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
  const [scrolled, setScrolled] = useState(variant === 'solid');
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    if (variant === 'solid') return;
    const h = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, [variant]);

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
  const isGlass = !scrolled;

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-3 left-3 right-3 z-50 rounded-2xl transition-all duration-400 ${
        scrolled
          ? 'bg-white/97 backdrop-blur-2xl shadow-[0_8px_32px_rgba(30,42,120,0.12)] border border-gray-100'
          : 'bg-[#0C1440]/18 backdrop-blur-md border border-white/10'
      }`}
    >
      {/* Orange accent line — only when scrolled */}
      {scrolled && (
        <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#F26522] to-transparent" />
      )}

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className={`flex items-center h-16 gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>

          {/* Logo */}
          <a href="/" onClick={e => { e.preventDefault(); navigate('/'); }}
            className="flex-shrink-0 flex items-center">
            <img src="/IMG_7936.PNG" alt="MYBRIDGE" className="h-9 w-auto" />
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center flex-1 justify-center gap-0">
            {navLinks.map(link => (
              <a
                key={link.key}
                href={link.href}
                onClick={e => { e.preventDefault(); navigate(link.href); }}
                className={`relative group px-3.5 py-2.5 text-[13px] font-medium tracking-wide transition-colors duration-200 ${
                  isGlass ? 'text-white/80 hover:text-white' : 'text-[#1E2A78]/75 hover:text-[#1E2A78]'
                }`}
              >
                {link.label}
                <span className={`absolute bottom-1 left-3.5 right-3.5 h-[1.5px] rounded-full origin-center
                  scale-x-0 group-hover:scale-x-100 transition-transform duration-250 ease-out
                  ${isGlass ? 'bg-white/55' : 'bg-[#F26522]'}`}
                />
              </a>
            ))}
          </nav>

          {/* Right Side */}
          <div className={`flex items-center gap-1 ml-auto ${isRTL ? 'flex-row-reverse' : ''}`}>

            {/* Language picker */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className={`flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors duration-200 ${
                  isGlass
                    ? 'text-white/75 hover:text-white hover:bg-white/10'
                    : 'text-gray-500 hover:text-[#1E2A78]'
                }`}
              >
                {currentLang?.code.toUpperCase()}
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`text-[8px] opacity-60 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.16 }}
                    className="absolute top-full mt-2 right-0 bg-white border border-gray-100 rounded-xl shadow-lg shadow-[#1E2A78]/8 overflow-hidden z-50 min-w-[130px]"
                  >
                    {LANGUAGES.map(l => (
                      <button
                        key={l.code}
                        onClick={() => { onLangChange(l.code); setLangOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors font-medium ${
                          lang === l.code
                            ? 'text-[#F26522] bg-[#F26522]/6 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-[#1E2A78]'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Thin separator */}
            <div className={`hidden lg:block w-px h-4 mx-1 ${isGlass ? 'bg-white/15' : 'bg-gray-200'}`} />

            {/* Supplier — text-only */}
            <button
              onClick={handleSupplier}
              className={`hidden lg:flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-xl transition-colors duration-200 ${
                isGlass
                  ? 'text-white/75 hover:text-white hover:bg-white/10'
                  : 'text-[#1E2A78]/70 hover:text-[#F26522] hover:bg-[#F26522]/8'
              }`}
            >
              <FontAwesomeIcon icon={faBuilding} className="text-[9px]" />
              {t('nav.supplier')}
            </button>

            {/* Agency — text-only */}
            <button
              onClick={handleAgency}
              className={`hidden lg:flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-xl transition-colors duration-200 ${
                isGlass
                  ? 'text-white/75 hover:text-white hover:bg-white/10'
                  : 'text-[#1E2A78]/70 hover:text-[#F26522] hover:bg-[#F26522]/8'
              }`}
            >
              <FontAwesomeIcon icon={faUserTie} className="text-[9px]" />
              {t('nav.agency')}
            </button>

            {/* Sign In — solid orange pill */}
            <button
              onClick={handleLogin}
              className="bg-[#F26522] hover:bg-[#D94E15] text-white text-[13px] font-bold
                px-5 py-2.5 rounded-xl ml-1
                shadow-[0_4px_14px_rgba(242,101,34,0.35)] hover:shadow-[0_6px_20px_rgba(242,101,34,0.45)]
                hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm
                transition-all duration-200"
            >
              {t('nav.signIn')}
            </button>

            {/* Mobile toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`lg:hidden p-2 rounded-xl ml-1 transition-colors ${
                isGlass ? 'text-white hover:bg-white/10' : 'text-[#1E2A78] hover:bg-gray-100'
              }`}
            >
              <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} className="text-base" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="lg:hidden overflow-hidden"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className="bg-white rounded-2xl mt-1.5 mb-2 py-2 px-1.5 border border-gray-100 shadow-lg">
                {navLinks.map(link => (
                  <a
                    key={link.key}
                    href={link.href}
                    onClick={e => { e.preventDefault(); navigate(link.href); setMenuOpen(false); }}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#1E2A78] hover:text-[#F26522] hover:bg-[#F26522]/6 rounded-xl font-medium transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="border-t border-gray-100 mt-2 pt-2 space-y-1">
                  <button
                    onClick={() => { handleSupplier(); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-[#1E2A78] font-semibold hover:bg-[#F26522]/6 rounded-xl flex items-center gap-2.5 transition-colors"
                  >
                    <FontAwesomeIcon icon={faBuilding} className="text-[#F26522] text-sm" /> {t('nav.supplier')}
                  </button>
                  <button
                    onClick={() => { handleAgency(); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-[#1E2A78] font-semibold hover:bg-[#F26522]/6 rounded-xl flex items-center gap-2.5 transition-colors"
                  >
                    <FontAwesomeIcon icon={faUserTie} className="text-[#F26522] text-sm" /> {t('nav.agency')}
                  </button>
                  <button
                    onClick={() => { handleLogin(); setMenuOpen(false); }}
                    className="w-full px-4 py-3 text-sm bg-[#F26522] text-white font-bold hover:bg-[#D94E15] rounded-xl transition-colors shadow-sm"
                  >
                    {t('nav.signIn')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
