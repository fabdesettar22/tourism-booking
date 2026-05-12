import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars, faXmark, faChevronDown,
  faBuilding, faUserTie,
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
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
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

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
  const isSolid     = variant === 'solid';
  const isGlass     = !isSolid && !scrolled;

  const navBg = isSolid
    ? 'bg-white/97 shadow-lg shadow-[#0C1440]/6 border border-[#F26522]/18'
    : scrolled
      ? 'bg-white/96 backdrop-blur-xl shadow-xl shadow-[#0C1440]/8 border border-[#F26522]/20 nav-scrolled'
      : 'bg-[#0C1440]/15 backdrop-blur-md border border-white/12';

  const linkCls = isGlass
    ? 'text-white/90 hover:text-white hover:bg-white/10'
    : 'text-gray-700 hover:text-[#F26522] hover:bg-[#F26522]/8';

  const langBtnCls = isGlass
    ? 'border-white/25 text-white/90 hover:bg-white/10 hover:border-white/40'
    : 'border-gray-200 text-gray-700 hover:border-[#F26522] hover:text-[#F26522]';

  const registerBtnCls = isGlass
    ? 'border-white/30 text-white/90 hover:bg-white/10'
    : 'border-[#F26522]/60 text-[#0C1440] hover:bg-[#F26522]/8 hover:border-[#F26522]';

  const loginBtnBg = isGlass
    ? 'bg-[#F26522] hover:bg-[#D94E15] text-[#0C1440]'
    : 'bg-[#F26522] hover:bg-[#D94E15] text-[#0C1440]';

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-3 left-3 right-3 z-50 rounded-2xl transition-all duration-500 ${navBg}`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[auto_1fr_auto] lg:grid-cols-3 items-center h-14 gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0 justify-self-start">
            <img src="/IMG_7936.PNG" alt="MYBRIDGE" className="h-9 w-auto" />
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-0.5 justify-self-center">
            {navLinks.map((link) => (
              <a
                key={link.key}
                href={link.href}
                onClick={(e) => { e.preventDefault(); navigate(link.href); }}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 tracking-wide ${linkCls}`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Side */}
          <div className={`flex items-center gap-2 justify-self-end ${isRTL ? 'flex-row-reverse' : ''}`}>

            {/* Language */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition-all duration-200 ${langBtnCls}`}
              >
                {currentLang?.code.toUpperCase()}
                <FontAwesomeIcon icon={faChevronDown} className="text-[9px]" />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                    className="absolute top-full mt-1.5 right-0 bg-white/98 backdrop-blur-xl border border-[#F26522]/20 rounded-xl shadow-xl shadow-black/10 overflow-hidden z-50 min-w-[140px]"
                  >
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => { onLangChange(l.code); setLangOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[#F26522]/10 hover:text-[#0C1440] font-medium ${
                          lang === l.code ? 'text-[#F26522] font-semibold bg-[#F26522]/8' : 'text-gray-700'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Supplier / Agency */}
            <div className="hidden lg:flex items-center gap-1.5">
              <button
                onClick={handleSupplier}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all duration-200 ${registerBtnCls}`}
              >
                <FontAwesomeIcon icon={faBuilding} className="text-[10px]" />
                {t('nav.supplier')}
              </button>
              <button
                onClick={handleAgency}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all duration-200 ${registerBtnCls}`}
              >
                <FontAwesomeIcon icon={faUserTie} className="text-[10px]" />
                {t('nav.agency')}
              </button>
            </div>

            {/* Sign In — Gold CTA */}
            <button
              onClick={handleLogin}
              className={`text-sm font-bold px-5 py-2 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${loginBtnBg}`}
            >
              {t('nav.signIn')}
            </button>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${isGlass ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} />
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
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="lg:hidden overflow-hidden"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className="bg-white/98 backdrop-blur-xl rounded-xl mt-2 mb-2 py-2 px-2 border border-[#F26522]/15 shadow-lg">
                {navLinks.map((link) => (
                  <a
                    key={link.key}
                    href={link.href}
                    onClick={(e) => { e.preventDefault(); navigate(link.href); setMenuOpen(false); }}
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:text-[#F26522] hover:bg-[#F26522]/8 rounded-lg font-medium transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="border-t border-[#F26522]/10 mt-2 pt-2 space-y-1">
                  <button
                    onClick={() => { handleSupplier(); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#0C1440] font-semibold hover:bg-[#F26522]/8 rounded-lg flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faBuilding} className="text-[#F26522]" /> {t('nav.supplier')}
                  </button>
                  <button
                    onClick={() => { handleAgency(); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#0C1440] font-semibold hover:bg-[#F26522]/8 rounded-lg flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faUserTie} className="text-[#F26522]" /> {t('nav.agency')}
                  </button>
                  <button
                    onClick={() => { handleLogin(); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm bg-[#F26522] text-[#0C1440] font-bold hover:bg-[#D94E15] rounded-lg"
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
