import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGlobe, faBars, faXmark, faChevronRight, faChevronLeft, faLocationDot,
  faArrowRight, faArrowLeft, faStar, faUsers, faShield,
  faHeadset, faTag, faMapMarkedAlt, faHotel, faBuilding, faBriefcase,
  faCheckCircle, faPhone, faEnvelope, faBell, faUserTie,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { faGooglePlay, faAppStore, faFacebook, faInstagram, faTwitter, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { useLanguage } from "../../hooks/useLanguage";
import { LANGUAGES, type Language } from "../../i18n/index";
import { AdSlot } from "../../features/advertising/AdSlot";
import { AdPopup } from "../../features/advertising/AdPopup";
import { HotelCard } from "../../components/public/HotelCard";
import { ServiceCard } from "../../components/public/ServiceCard";
import { FeaturedDestinations } from "../../components/public/FeaturedDestinations";
import { CityDetailModal } from "../../components/public/CityDetailModal";
import { TrustSection } from "../../components/public/TrustSection";
import { StatsBanner } from "../../components/public/StatsBanner";
import { TestimonialsCarousel } from "../../components/public/TestimonialsCarousel";
import { fetchHomepageConfig, type HomepageConfig } from "../../services/homepageConfig";
import { Search } from "lucide-react";
import {
  fetchPublicHotels, fetchPublicServices,
  type PublicHotelListItem, type PublicServiceListItem,
} from "../../services/publicApi";

// ═══ SHARED ANIMATION HELPERS ═══════════════════════════
const AnimatedSection = ({
  children, className = '', delay = 0,
}: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface Destination { name:string; tours:number; activities:number; image:string; }
interface Testimonial { name:string; location:string; text:string; rating:number; avatar:string; }
interface NewsPost { id:number; category:string; date:string; readTime:string; title:string; author:string; image:string; }

// ═══════════════════════════════════════════════════════
// HERO HOTEL — تأتي الآن من Django API (card_image + hero_image منفصلان)
// ═══════════════════════════════════════════════════════
interface HeroHotel {
  id: number;
  card_type: 'hotel' | 'partner' | 'sponsor' | 'custom';
  name: string;
  logo: string | null;
  stars: number | null;
  description: string;
  location: string;
  card_image: string | null;
  card_video: string | null;
  hero_image: string | null;
  hero_video: string | null;
  card_media_kind: 'image' | 'video' | 'none';
  hero_media_kind: 'image' | 'video' | 'none';
  link_url: string;
  cta_text: string;
  display_order: number;
}

// API endpoint
const HERO_HOTELS_API = `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/hero-hotels/`;

const DESTINATIONS: Destination[] = [
  { name:"Kuala Lumpur", tours:120, activities:85,  image:"https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&q=80" },
  { name:"Langkawi",     tours:98,  activities:72,  image:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80" },
  { name:"Penang",       tours:86,  activities:64,  image:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
  { name:"Melaka",       tours:74,  activities:51,  image:"https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=400&q=80" },
  { name:"Sabah",        tours:62,  activities:90,  image:"https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=400&q=80" },
  { name:"Sarawak",      tours:55,  activities:78,  image:"https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=400&q=80" },
  { name:"Putrajaya",    tours:44,  activities:32,  image:"https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&q=80" },
];

const TESTIMONIALS: Testimonial[] = [
  { name:"Sara Mohamed",   location:"Algiers",     text:"Best platform for planning trips to Malaysia. Everything was smooth and the support team speaks Arabic!", rating:5, avatar:"SM" },
  { name:"Karim Benali",   location:"Oran",        text:"Found an amazing hotel in Langkawi at a great price. MYBRIDGE is truly the link I needed!", rating:5, avatar:"KB" },
  { name:"Amina Cherif",   location:"Constantine", text:"The tour guides were excellent and the booking process was very easy. Highly recommend!", rating:5, avatar:"AC" },
];

const NEWS: NewsPost[] = [
  { id:1, category:"Travel Tips", date:"15 Apr 2026", readTime:"5 mins", title:"Top 10 Halal Restaurants in Kuala Lumpur You Must Try",       author:"MYBRIDGE Team", image:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80" },
  { id:2, category:"Guide",       date:"10 Apr 2026", readTime:"7 mins", title:"Complete Guide to Visiting Langkawi on a Budget",              author:"MYBRIDGE Team", image:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80" },
  { id:3, category:"Culture",     date:"05 Apr 2026", readTime:"4 mins", title:"Malaysian Culture & Customs Every Algerian Should Know",        author:"MYBRIDGE Team", image:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80" },
];

const MALAYSIA_DESTINATIONS = [
  { key:"kl", image:"https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&q=80" },
  { key:"lk", image:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80" },
  { key:"pg", image:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
  { key:"ml", image:"https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=400&q=80" },
];

// ══ NAVBAR ══════════════════════════════════════════════
interface NavbarProps {
  onLogin?:()=>void; onSupplier?:()=>void; onAgency?:()=>void;
  lang:Language; onLangChange:(l:Language)=>void; t:(k:string)=>string; isRTL:boolean;
}

const PublicNavbar = ({ onLogin, onSupplier, onAgency, lang, onLangChange, t, isRTL }: NavbarProps) => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(()=>{
    const h = ()=>setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", h, { passive: true });
    return ()=>window.removeEventListener("scroll", h);
  },[]);

  const navLinks = [
    { key:"nav.home",         label: t("nav.home"),         href:"/"             },
    { key:"nav.tours",        label: t("nav.tours"),        href:"/tours"        },
    { key:"nav.destinations", label: t("nav.destinations"), href:"/destinations" },
    { key:"nav.activities",   label: t("nav.activities"),   href:"/activities"   },
    { key:"nav.hotels",       label: t("nav.hotels"),       href:"/hotels"       },
    { key:"nav.blog",         label: t("nav.blog"),         href:"/blog"         },
  ];

  const currentLang = LANGUAGES.find(l=>l.code===lang);
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

          {/* ── Logo ── */}
          <a href="/" onClick={e=>{ e.preventDefault(); navigate('/'); }}
            className="flex-shrink-0 flex items-center">
            <img src="/IMG_7936.PNG" alt="MYBRIDGE" className="h-9 w-auto"/>
          </a>

          {/* ── Desktop Nav Links ── */}
          <nav className="hidden lg:flex items-center flex-1 justify-center gap-0">
            {navLinks.map(link=>(
              <a key={link.key} href={link.href}
                onClick={e=>{ e.preventDefault(); navigate(link.href); }}
                className={`relative group px-3.5 py-2.5 text-[13px] font-medium tracking-wide transition-colors duration-200 ${
                  isGlass ? 'text-white/80 hover:text-white' : 'text-[#1E2A78]/75 hover:text-[#1E2A78]'
                }`}
              >
                {link.label}
                {/* Animated underline */}
                <span className={`absolute bottom-1 left-3.5 right-3.5 h-[1.5px] rounded-full origin-center
                  scale-x-0 group-hover:scale-x-100 transition-transform duration-250 ease-out
                  ${isGlass ? 'bg-white/55' : 'bg-[#F26522]'}`}
                />
              </a>
            ))}
          </nav>

          {/* ── Right Side ── */}
          <div className={`flex items-center gap-1 ml-auto ${isRTL ? 'flex-row-reverse' : ''}`}>

            {/* Language picker */}
            <div className="relative">
              <button
                onClick={()=>setLangOpen(!langOpen)}
                className={`flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors duration-200 ${
                  isGlass
                    ? 'text-white/75 hover:text-white hover:bg-white/10'
                    : 'text-gray-500 hover:text-[#1E2A78]'
                }`}
              >
                {currentLang?.code.toUpperCase()}
                <FontAwesomeIcon icon={faChevronDown} className={`text-[8px] opacity-60 transition-transform duration-200 ${langOpen?'rotate-180':''}`}/>
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
                    {LANGUAGES.map(l=>(
                      <button key={l.code} onClick={()=>{ onLangChange(l.code); setLangOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors font-medium ${
                          lang===l.code
                            ? 'text-[#F26522] bg-[#F26522]/6 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-[#1E2A78]'
                        }`}>
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
            <button onClick={onSupplier}
              className={`hidden lg:flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-xl transition-colors duration-200 ${
                isGlass
                  ? 'text-white/75 hover:text-white hover:bg-white/10'
                  : 'text-[#1E2A78]/70 hover:text-[#F26522] hover:bg-[#F26522]/8'
              }`}>
              <FontAwesomeIcon icon={faBuilding} className="text-[9px]"/>
              {t("nav.supplier")}
            </button>

            {/* Agency — text-only */}
            <button onClick={onAgency}
              className={`hidden lg:flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-xl transition-colors duration-200 ${
                isGlass
                  ? 'text-white/75 hover:text-white hover:bg-white/10'
                  : 'text-[#1E2A78]/70 hover:text-[#F26522] hover:bg-[#F26522]/8'
              }`}>
              <FontAwesomeIcon icon={faUserTie} className="text-[9px]"/>
              {t("nav.agency")}
            </button>

            {/* Sign In — solid orange pill */}
            <button onClick={onLogin}
              className="bg-[#F26522] hover:bg-[#D94E15] text-white text-[13px] font-bold
                px-5 py-2.5 rounded-xl ml-1
                shadow-[0_4px_14px_rgba(242,101,34,0.35)] hover:shadow-[0_6px_20px_rgba(242,101,34,0.45)]
                hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm
                transition-all duration-200">
              {t("nav.signIn")}
            </button>

            {/* Mobile toggle */}
            <button onClick={()=>setMenuOpen(!menuOpen)}
              className={`lg:hidden p-2 rounded-xl ml-1 transition-colors ${
                isGlass ? 'text-white hover:bg-white/10' : 'text-[#1E2A78] hover:bg-gray-100'
              }`}>
              <FontAwesomeIcon icon={menuOpen?faXmark:faBars} className="text-base"/>
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="lg:hidden overflow-hidden"
              dir={isRTL?"rtl":"ltr"}
            >
              <div className="bg-white rounded-2xl mt-1.5 mb-2 py-2 px-1.5 border border-gray-100 shadow-lg">
                {navLinks.map(link=>(
                  <a key={link.key} href={link.href}
                    onClick={e=>{ e.preventDefault(); navigate(link.href); setMenuOpen(false); }}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#1E2A78] hover:text-[#F26522] hover:bg-[#F26522]/6 rounded-xl font-medium transition-colors">
                    {link.label}
                  </a>
                ))}
                <div className="border-t border-gray-100 mt-2 pt-2 space-y-1">
                  <button onClick={()=>{ onSupplier?.(); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-[#1E2A78] font-semibold hover:bg-[#F26522]/6 rounded-xl flex items-center gap-2.5 transition-colors">
                    <FontAwesomeIcon icon={faBuilding} className="text-[#F26522] text-sm"/> {t("nav.supplier")}
                  </button>
                  <button onClick={()=>{ onAgency?.(); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-[#1E2A78] font-semibold hover:bg-[#F26522]/6 rounded-xl flex items-center gap-2.5 transition-colors">
                    <FontAwesomeIcon icon={faUserTie} className="text-[#F26522] text-sm"/> {t("nav.agency")}
                  </button>
                  <button onClick={()=>{ onLogin?.(); setMenuOpen(false); }}
                    className="w-full px-4 py-3 text-sm bg-[#F26522] text-white font-bold hover:bg-[#D94E15] rounded-xl transition-colors shadow-sm">
                    {t("nav.signIn")}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

// Static fallback shown when Django API is unreachable
const FALLBACK_HERO_HOTEL: HeroHotel = {
  id: 0,
  card_type: 'hotel',
  name: 'Mandarin Oriental',
  logo: null,
  stars: 5,
  description: 'An iconic luxury retreat in the heart of Kuala Lumpur, overlooking the Petronas Twin Towers.',
  location: 'Kuala Lumpur',
  card_image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
  card_video: null,
  hero_image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1600&q=85',
  hero_video: null,
  card_media_kind: 'image',
  hero_media_kind: 'image',
  link_url: '/hotels',
  cta_text: 'Explore',
  display_order: 0,
};

// ═══════════════════════════════════════════════════════
// HERO SECTION — النسخة الأصلية (Hero Hotel Cards الدوّارة)
// ═══════════════════════════════════════════════════════
const HeroSection = ({ t, isRTL }: { t:(k:string)=>string; isRTL:boolean }) => {
  const [heroHotels, setHeroHotels] = useState<HeroHotel[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    fetch(HERO_HOTELS_API)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => { setHeroHotels(data.results || []); })
      .catch(() => { /* silently fall back to static card */ });
  }, []);

  const displayHotels = heroHotels.length > 0 ? heroHotels : [FALLBACK_HERO_HOTEL];
  const currentHotel = displayHotels[currentIdx] ?? FALLBACK_HERO_HOTEL;

  useEffect(() => {
    if (displayHotels.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx(p => (p + 1) % displayHotels.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayHotels.length]);

  return (
    <section className="relative min-h-[680px] flex items-center overflow-hidden">
      {/* خلفية Hero — صورة أو فيديو */}
      {displayHotels.map((hotel, i) => (
        <div key={hotel.id}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === currentIdx ? 1 : 0 }}>
          {hotel.hero_media_kind === 'video' && hotel.hero_video ? (
            <video
              src={hotel.hero_video}
              autoPlay muted loop playsInline preload="metadata"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-cover bg-center"
              style={{backgroundImage:`url(${hotel.hero_image || ''})`}}/>
          )}
        </div>
      ))}
      {/* Premium gradient overlay — deep navy with warm fade */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#06111E]/92 via-[#0C1440]/72 to-[#0C1440]/35"/>
      {/* Subtle gold vignette at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#F26522]/8 to-transparent"/>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className={isRTL ? "text-right" : ""}
          >

            {/* ── Badge with live dot ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className={`inline-flex items-center gap-2.5 mb-7 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {/* live dot */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F26522] opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F26522]" />
              </span>
              <span className="text-[#F26522]/90 text-[11px] font-bold tracking-[0.18em] uppercase">
                {t("hero.discover")}
              </span>
              <span className="w-8 h-px bg-gradient-to-r from-[#F26522]/60 to-transparent" />
            </motion.div>

            {/* ── Main title ── */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.45 }}
              className="font-display text-5xl md:text-[72px] font-light text-white leading-[1.02] mb-2 tracking-[-0.01em]"
            >
              {t("hero.title")}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.55 }}
              className="mb-2"
            >
              <span className="font-display text-5xl md:text-[72px] text-[#F26522] italic font-medium leading-[1.02] tracking-[-0.01em]">
                The link you<span className="not-italic font-black text-white">need</span>
              </span>
            </motion.div>

            {/* ── Accent line under title ── */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className={`h-[2px] w-24 bg-gradient-to-r from-[#F26522] to-transparent mb-7 ${isRTL ? 'mr-0 ml-auto' : ''}`}
              style={{ transformOrigin: isRTL ? 'right' : 'left' }}
            />

            {/* ── Subtitle ── */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.65 }}
              className="text-white/55 text-[17px] mb-9 leading-[1.75] max-w-md font-light"
            >
              {t("hero.subtitle")}
            </motion.p>

            {/* ── CTA Buttons ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.9 }}
              className={`flex flex-col sm:flex-row gap-3 ${isRTL ? 'sm:flex-row-reverse' : ''}`}
            >
              <a
                href="/register/supplier"
                className="group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-[#F26522] hover:bg-[#D94E15] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#F26522]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#F26522]/40 hover:-translate-y-0.5 active:translate-y-0"
              >
                <FontAwesomeIcon icon={faBuilding} className="text-white/80" />
                {t("hero.cta_supplier")}
                <FontAwesomeIcon icon={isRTL ? faArrowLeft : faArrowRight} className="text-[10px] opacity-70 group-hover:translate-x-1 transition-transform duration-200" />
              </a>
              <a
                href="/register/agency"
                className="group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-white/8 hover:bg-white/14 text-white font-semibold text-sm rounded-xl border border-white/18 hover:border-white/32 transition-all duration-300 backdrop-blur-sm hover:-translate-y-0.5 active:translate-y-0"
              >
                <FontAwesomeIcon icon={faBriefcase} className="text-white/70" />
                {t("hero.cta_agency")}
                <FontAwesomeIcon icon={isRTL ? faArrowLeft : faArrowRight} className="text-[10px] opacity-70 group-hover:translate-x-1 transition-transform duration-200" />
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            className="relative"
          >
            {/* ── Glow ring behind card ── */}
            <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-br from-[#F26522]/30 via-transparent to-[#1E2A78]/20 blur-xl opacity-70 pointer-events-none" />

            <div
              key={currentHotel.id}
              className="relative rounded-3xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.5)] transition-all duration-700"
              style={{ minHeight: 480 }}
            >
              {/* ── Full background image ── */}
              {currentHotel.card_media_kind === 'video' && currentHotel.card_video ? (
                <video
                  src={currentHotel.card_video}
                  autoPlay muted loop playsInline preload="metadata"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <img
                  src={currentHotel.card_image || ''}
                  alt={currentHotel.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* ── Light top scrim ── */}
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent" />

              {/* ── FLOATING WHITE CARD at bottom ── */}
              <div className={`absolute inset-x-0 bottom-0 z-10 p-3 ${isRTL ? 'text-right' : ''}`}>
                <div className="bg-[#1E2A78]/45 backdrop-blur-xl rounded-2xl px-5 py-4 border border-[#3D52C4]/40 shadow-[0_-8px_40px_rgba(30,42,120,0.35)]">

                  {/* Row 1: logo + name (left) | location (right) */}
                  <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                        {currentHotel.logo ? (
                          <img
                            src={currentHotel.logo}
                            alt=""
                            className="w-8 h-8 object-contain"
                            onError={e => {
                              const el = e.currentTarget as HTMLImageElement;
                              el.style.display = 'none';
                              const parent = el.parentElement;
                              if (parent) {
                                parent.innerHTML = `<span style="font-size:15px;font-weight:700;color:white;font-family:serif">${(currentHotel.name||'').charAt(0)||'?'}</span>`;
                              }
                            }}
                          />
                        ) : (
                          <span className="text-[15px] font-bold text-white font-display">
                            {(currentHotel.name||'').charAt(0)||'?'}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-[22px] font-semibold text-white leading-tight tracking-tight">
                        {currentHotel.name}
                      </h3>
                    </div>
                    <div className={`flex items-center gap-1.5 flex-shrink-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <FontAwesomeIcon icon={faLocationDot} className="text-[#F26522] text-[10px]" />
                      <span className="text-white/70 text-[10px] font-semibold uppercase tracking-[0.15em]">
                        {currentHotel.location || 'Malaysia'}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: stars */}
                  {currentHotel.card_type === 'hotel' && currentHotel.stars ? (
                    <div className={`flex items-center gap-0.5 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {Array.from({ length: currentHotel.stars }).map((_, i) => (
                        <FontAwesomeIcon key={i} icon={faStar} className="text-[#F26522] text-[9px]" />
                      ))}
                    </div>
                  ) : null}

                  {/* Row 4: description */}
                  {currentHotel.description && (
                    <p className="text-white/55 text-xs leading-relaxed line-clamp-1 mb-3">
                      {currentHotel.description}
                    </p>
                  )}

                  {/* Row 4: divider + CTA */}
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="flex-1 h-px bg-gradient-to-r from-[#F26522]/40 to-transparent" />
                    <a
                      href={currentHotel.link_url || '#'}
                      target={currentHotel.link_url ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 bg-[#F26522] hover:bg-[#D94E15] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-[#F26522]/30 transition-all duration-200 hover:-translate-y-0.5 flex-shrink-0"
                    >
                      {currentHotel.cta_text || 'Explore'}
                      <FontAwesomeIcon icon={isRTL ? faArrowLeft : faArrowRight} className="text-[9px] group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>

                </div>
              </div>
            </div>

            {/* ── Pagination dots ── */}
            <div className={`flex items-center gap-2 mt-4 ${isRTL ? 'justify-end' : 'justify-start'}`}>
              {displayHotels.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  aria-label={`Show hotel ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIdx ? 'bg-[#F26522] w-8' : 'bg-white/30 w-1.5 hover:bg-white/55'}`}
                />
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

// ══ DESTINATIONS ════════════════════════════════════════
const DestinationsSection = ({ t, isRTL }: { t:(k:string)=>string; isRTL:boolean }) => (
  <section className="py-24 bg-[#FAF9F5]" dir={isRTL?"rtl":"ltr"}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <AnimatedSection className={`mb-12 ${isRTL?"text-right":""}`}>
        <p className="text-[#F26522] text-[11px] font-semibold uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
          <FontAwesomeIcon icon={faLocationDot}/> {t("destinations.label")}
        </p>
        <h2 className="font-display text-4xl md:text-5xl font-light text-[#0C1440] tracking-tight">{t("destinations.title")}</h2>
      </AnimatedSection>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {DESTINATIONS.slice(0,7).map(dest=>(
          <a key={dest.name} href="#" className="luxury-card mb-card-img group relative rounded-2xl overflow-hidden">
            <div className="aspect-[3/4] overflow-hidden">
              <img src={dest.image} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"/>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 p-3 ${isRTL?"text-right":""}`}>
              <h3 className="font-bold text-white text-sm">{dest.name}</h3>
              <p className="text-xs text-white/70">{dest.tours} {t("destinations.tours")}</p>
            </div>
          </a>
        ))}
        <div className="bg-[#0C1440] rounded-2xl p-6 flex flex-col justify-between hover:bg-[#163556] transition-colors cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#F26522]/10 rounded-full -translate-y-8 translate-x-8" />
          <p className="font-display text-white text-lg leading-snug relative">Crafting Your Perfect <span className="italic text-[#F26522]">Travel</span> Experience</p>
          <a href="/destinations" className="mt-4 bg-[#F26522] text-[#0C1440] text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 hover:bg-[#d4b67a] transition-colors w-fit relative">
            {t("destinations.browseAll")} <FontAwesomeIcon icon={isRTL?faChevronLeft:faChevronRight} className="text-xs"/>
          </a>
        </div>
      </div>
    </div>
  </section>
);

// ══ MALAYSIA ════════════════════════════════════════════
const MalaysiaSection = ({ t, isRTL }: { t:(k:string)=>string; isRTL:boolean }) => (
  <section className="py-24 bg-[#080D30]" dir={isRTL?"rtl":"ltr"}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <AnimatedSection className={isRTL?"text-right":""}>
          <p className="text-[#F26522] text-[11px] font-semibold uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faMapMarkedAlt}/>
            {t("malaysia.label")}
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-white mb-5 leading-[1.1] tracking-tight">
            {t("malaysia.title")}<br/>
            <span className="text-[#F26522] italic font-medium">{t("malaysia.titleSpan")}</span>
          </h2>
          <p className="text-white/45 mb-10 leading-relaxed font-light">{t("malaysia.desc")}</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { num:"30M+",  key:"stats.tourists" },
              { num:"4000+", key:"stats.hotels"   },
              { num:"13",    key:"stats.states"   },
              { num:"#1",    key:"stats.ranking"  },
            ].map(s=>(
              <div key={s.num} className="bg-white/5 border border-[#F26522]/15 rounded-2xl p-5 text-center hover:bg-white/8 hover:border-[#F26522]/30 transition-all duration-300 cursor-default">
                <div className="font-display text-3xl font-light text-[#F26522] mb-1">{s.num}</div>
                <div className="text-xs text-white/40 tracking-wide">{t(s.key)}</div>
              </div>
            ))}
          </div>
        </AnimatedSection>
        <AnimatedSection className="grid grid-cols-2 gap-4" delay={0.2}>
          {MALAYSIA_DESTINATIONS.map(dest=>(
            <div key={dest.key} className="luxury-card mb-card-img group rounded-2xl overflow-hidden cursor-pointer">
              <div className="relative overflow-hidden aspect-square">
                <img src={dest.image} alt={t(`malaysia.destinations.${dest.key}`)}
                  className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"/>
                <div className={`absolute bottom-3 ${isRTL?"right-3":"left-3"}`}>
                  <p className="text-white font-bold text-sm">{t(`malaysia.destinations.${dest.key}`)}</p>
                  <p className="text-white/65 text-xs">{t(`malaysia.destinations.${dest.key}Desc`)}</p>
                </div>
              </div>
            </div>
          ))}
        </AnimatedSection>
      </div>
    </div>
  </section>
);

// ══ WHY CHOOSE US ════════════════════════════════════════
const WhyChooseUs = ({ t, isRTL }: { t:(k:string)=>string; isRTL:boolean }) => {
  const features = [
    { icon:faMapMarkedAlt, titleKey:"why.f1Title", descKey:"why.f1Desc" },
    { icon:faShield,       titleKey:"why.f2Title", descKey:"why.f2Desc" },
    { icon:faTag,          titleKey:"why.f3Title", descKey:"why.f3Desc" },
    { icon:faHeadset,      titleKey:"why.f4Title", descKey:"why.f4Desc" },
  ];
  return (
    <section className="py-24 bg-[#FAF9F5]" dir={isRTL?"rtl":"ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <AnimatedSection className={isRTL?"text-right":""}>
            <span className="inline-block bg-[#F26522]/12 text-[#1E2A78] text-[11px] font-semibold px-4 py-1.5 rounded-full mb-5 tracking-[0.12em] uppercase border border-[#F26522]/20">{t("why.label")}</span>
            <h2 className="font-display text-4xl md:text-5xl font-light text-[#0C1440] tracking-tight mb-4">{t("why.title")}</h2>
            <p className="text-gray-500 mb-8 leading-relaxed font-light">{t("why.subtitle")}</p>
            <div className={`flex gap-3 ${isRTL?"justify-end":""}`}>
              <a href="#" className="bg-[#0C1440] text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[#163556] transition-colors flex items-center gap-2 shadow-md">
                <FontAwesomeIcon icon={faGooglePlay}/> {t("why.googlePlay")}
              </a>
              <a href="#" className="bg-white text-[#0C1440] text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 border border-gray-200 shadow-sm">
                <FontAwesomeIcon icon={faAppStore}/> {t("why.appStore")}
              </a>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-2 gap-4">
            {features.map((f, idx)=>(
              <AnimatedSection key={f.titleKey} delay={idx * 0.08}>
                <div className="luxury-card bg-white rounded-2xl p-6 group cursor-default h-full">
                  <div className="w-11 h-11 bg-[#F26522]/12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#F26522]/22 transition-colors">
                    <FontAwesomeIcon icon={f.icon} className="text-[#F26522] text-base"/>
                  </div>
                  <h3 className={`font-semibold text-[#0C1440] text-sm mb-2 ${isRTL?"text-right":""}`}>{t(f.titleKey)}</h3>
                  <p className={`text-xs text-gray-500 leading-relaxed font-light ${isRTL?"text-right":""}`}>{t(f.descKey)}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ══ SUPPLIER CTA ════════════════════════════════════════
const SupplierCTASection = ({ onSupplier, t, isRTL }: { onSupplier?:()=>void; t:(k:string)=>string; isRTL:boolean }) => (
  <section className="py-24 bg-[#080D30]" dir={isRTL?"rtl":"ltr"}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <AnimatedSection className={isRTL?"text-right":""}>
          <span className="inline-flex items-center gap-2 bg-[#F26522]/15 text-[#F26522] text-[11px] font-semibold px-4 py-1.5 rounded-full mb-5 border border-[#F26522]/25 tracking-[0.12em] uppercase">
            <FontAwesomeIcon icon={faBuilding}/> {t("supplierCta.label")}
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-light text-white mb-5 leading-[1.1] tracking-tight">
            {t("supplierCta.title")}<br/>
            <span className="text-[#F26522] italic font-medium">{t("supplierCta.titleSpan")}</span>
          </h2>
          <p className="text-white/45 mb-8 leading-relaxed font-light">{t("supplierCta.desc")}</p>
          <div className={`grid grid-cols-2 gap-3 mb-10 ${isRTL?"text-right":""}`}>
            {[t("supplierCta.f1"),t("supplierCta.f2"),t("supplierCta.f3"),t("supplierCta.f4")].map(f=>(
              <div key={f} className="flex items-center gap-2 text-sm text-white/70">
                <div className="w-5 h-5 bg-[#F26522]/20 border border-[#F26522]/40 rounded-full flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-[#F26522] text-[9px]"/>
                </div>
                {f}
              </div>
            ))}
          </div>
          <button onClick={onSupplier}
            className="mb-btn bg-[#F26522] hover:bg-[#D94E15] text-[#0C1440] font-bold px-8 py-4 rounded-xl text-sm flex items-center gap-2 shadow-xl shadow-[#F26522]/20 hover:-translate-y-0.5 transition-all duration-200">
            <FontAwesomeIcon icon={faBuilding}/> {t("supplierCta.cta")}
            <FontAwesomeIcon icon={faArrowRight}/>
          </button>
        </AnimatedSection>
        <AnimatedSection className="grid grid-cols-2 gap-4" delay={0.2}>
          {[
            { num:"2,400+",  key:"supplierCta.stat1Label", icon:faHotel       },
            { num:"18,000+", key:"supplierCta.stat2Label", icon:faCheckCircle },
            { num:"4",       key:"supplierCta.stat3Label", icon:faGlobe       },
            { num:"98%",     key:"supplierCta.stat4Label", icon:faUsers       },
          ].map(s=>(
            <div key={s.num} className="bg-white/4 border border-[#F26522]/15 rounded-2xl p-6 text-center hover:bg-white/8 hover:border-[#F26522]/28 transition-all duration-300 cursor-default">
              <FontAwesomeIcon icon={s.icon} className="text-[#F26522]/70 text-xl mb-3"/>
              <div className="font-display text-3xl font-light text-[#F26522] mb-1">{s.num}</div>
              <div className="text-xs text-white/40 tracking-wide">{t(s.key)}</div>
            </div>
          ))}
        </AnimatedSection>
      </div>
    </div>
  </section>
);

// ══ TESTIMONIALS ════════════════════════════════════════
const TestimonialsSection = ({ t, isRTL }: { t:(k:string)=>string; isRTL:boolean }) => (
  <section className="py-24 bg-[#FAF9F5]" dir={isRTL?"rtl":"ltr"}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <AnimatedSection className="text-center mb-14">
        <span className="inline-block bg-[#F26522]/12 text-[#1E2A78] text-[11px] font-semibold px-4 py-1.5 rounded-full mb-4 border border-[#F26522]/20 tracking-[0.12em] uppercase">{t("testimonials.label")}</span>
        <h2 className="font-display text-4xl md:text-5xl font-light text-[#0C1440] tracking-tight">{t("testimonials.title")}</h2>
      </AnimatedSection>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((testimonial, idx)=>(
          <AnimatedSection key={testimonial.name} delay={idx * 0.1}>
            <div className="luxury-card bg-white rounded-2xl p-7 h-full cursor-default">
              <div className="flex items-center gap-1 mb-5">
                {[1,2,3,4,5].map(s=>(
                  <FontAwesomeIcon key={s} icon={faStar} className="text-[#F26522] text-xs"/>
                ))}
              </div>
              <p className={`text-sm text-gray-600 leading-relaxed mb-7 font-light italic ${isRTL?"text-right":""}`}>"{testimonial.text}"</p>
              <div className={`flex items-center gap-3 ${isRTL?"flex-row-reverse":""}`}>
                <div className="w-10 h-10 rounded-full bg-[#F26522]/15 border border-[#F26522]/30 flex items-center justify-center text-[#1E2A78] font-bold text-sm flex-shrink-0">
                  {testimonial.avatar}
                </div>
                <div className={isRTL?"text-right":""}>
                  <p className="font-semibold text-[#0C1440] text-sm">{testimonial.name}</p>
                  <p className="text-xs text-gray-400">{testimonial.location}</p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);

// ══ NEWS ════════════════════════════════════════════════
const NewsSection = ({ t, isRTL }: { t:(k:string)=>string; isRTL:boolean }) => (
  <section className="py-24 bg-[#FAF8F3]" dir={isRTL?"rtl":"ltr"}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className={`flex items-end justify-between mb-10 ${isRTL?"flex-row-reverse":""}`}>
        <AnimatedSection className={isRTL?"text-right":""}>
          <p className="text-[#F26522] text-[11px] font-semibold uppercase tracking-[0.3em] mb-2">{t("news.label")}</p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-[#0C1440] tracking-tight">{t("news.title")}</h2>
        </AnimatedSection>
        <a href="/blog" className="hidden sm:flex items-center gap-1.5 text-[#F26522] font-semibold text-sm border border-[#F26522]/30 px-4 py-2 rounded-xl hover:bg-[#F26522]/8 transition-colors">
          {t("news.viewMore")} <FontAwesomeIcon icon={isRTL?faChevronLeft:faChevronRight} className="text-xs"/>
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {NEWS.map((post,i)=>(
          <AnimatedSection key={post.id} delay={i * 0.1}>
            <div className={`luxury-card mb-card-img bg-white rounded-2xl overflow-hidden group h-full`}>
              <div className="relative overflow-hidden aspect-video">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
                <div className="absolute top-3 left-3">
                  <span className="bg-white/95 backdrop-blur-sm text-[#0C1440] text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wide">{post.category}</span>
                </div>
              </div>
              <div className="p-5">
                <div className={`flex items-center gap-3 text-xs text-gray-400 mb-3 ${isRTL?"flex-row-reverse":""}`}>
                  <span>{post.date}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"/>
                  <span>{post.readTime} read</span>
                </div>
                <h3 className={`font-semibold text-[#0C1440] text-sm leading-snug mb-4 line-clamp-2 group-hover:text-[#F26522] transition-colors duration-200 ${isRTL?"text-right":""}`}>{post.title}</h3>
                <div className={`flex items-center justify-between ${isRTL?"flex-row-reverse":""}`}>
                  <span className="text-xs text-gray-400">{post.author}</span>
                  <a href="#" className="text-xs text-[#F26522] font-semibold border border-[#F26522]/25 px-3 py-1.5 rounded-xl hover:bg-[#F26522]/8 transition-colors">
                    {t("news.read")}
                  </a>
                </div>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);

// ══ NEWSLETTER ══════════════════════════════════════════
const NewsletterSection = ({ t, isRTL }: { t:(k:string)=>string; isRTL:boolean }) => {
  const [email, setEmail] = useState("");
  return (
    <section className="py-24 bg-white" dir={isRTL?"rtl":"ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#080D30] rounded-3xl p-10 md:p-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-center relative overflow-hidden border border-[#F26522]/15">
          {/* Gold glow corners */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F26522]/6 rounded-full -translate-y-32 translate-x-32"/>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#F26522]/4 rounded-full translate-y-24 -translate-x-24"/>
          <div className={`relative z-10 ${isRTL?"text-right":""}`}>
            <span className="inline-flex items-center gap-2 bg-[#F26522]/15 text-[#F26522] text-[11px] font-semibold px-4 py-1.5 rounded-full mb-5 border border-[#F26522]/25 tracking-[0.12em] uppercase">
              <FontAwesomeIcon icon={faBell}/> MYBRIDGE
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-light text-white mb-3">{t("newsletter.title")}</h2>
            <p className="text-white/45 font-light">{t("newsletter.subtitle")}</p>
          </div>
          <div className={`relative z-10 flex gap-3 ${isRTL?"flex-row-reverse":""}`}>
            <div className="flex-1 relative">
              <FontAwesomeIcon icon={faEnvelope} className={`absolute ${isRTL?"right-3":"left-3"} top-1/2 -translate-y-1/2 text-gray-400 text-sm`}/>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder={t("newsletter.placeholder")}
                className={`w-full bg-white/8 border border-white/12 text-white text-sm rounded-xl ${isRTL?"pr-9 pl-4":"pl-9 pr-4"} py-4 outline-none placeholder-gray-500 focus:border-[#F26522]/40 focus:bg-white/12 transition-all`}/>
            </div>
            <button className="bg-[#F26522] hover:bg-[#D94E15] text-[#0C1440] text-sm font-bold px-6 py-4 rounded-xl transition-all duration-200 whitespace-nowrap hover:-translate-y-0.5 shadow-lg shadow-[#F26522]/20">
              {t("newsletter.subscribe")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

// ══ FOOTER ══════════════════════════════════════════════
const Footer = ({ t, isRTL }: { t:(k:string)=>string; isRTL:boolean }) => (
  <footer className="bg-[#06091E] text-gray-400" dir={isRTL?"rtl":"ltr"}>
    <div className="h-px bg-gradient-to-r from-transparent via-[#F26522]/50 to-transparent"/>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-14">
        <div className="col-span-2">
          <div className={`flex items-center gap-2 mb-4 ${isRTL?"flex-row-reverse":""}`}>
            <img src="/logo.svg" alt="MYBRIDGE" className="h-8 w-auto brightness-0 invert opacity-90"/>
            <span className="font-display text-xl text-white/95 tracking-wide">MYBRIDGE</span>
          </div>
          <p className="text-xs text-[#F26522]/65 italic mb-5 leading-relaxed">{t("footer.tagline")}</p>
          <div className={`space-y-1 text-xs text-gray-600 mb-5 ${isRTL?"text-right":""}`}>
            <p className="font-medium text-gray-500">{t("footer.license")}</p>
            <p>{t("footer.company")}</p>
            <p>{t("footer.regNo")}</p>
            <p className="text-[#F26522]">www.mybridge.my</p>
          </div>
          <div className={`space-y-2 ${isRTL?"text-right":""}`}>
            <p className="text-xs flex items-center gap-2.5">
              <FontAwesomeIcon icon={faEnvelope} className="flex-shrink-0 text-[#F26522]/65 w-3"/>
              {t("footer.email")}
            </p>
            <p className="text-xs flex items-center gap-2.5">
              <FontAwesomeIcon icon={faPhone} className="flex-shrink-0 text-[#F26522]/65 w-3"/>
              +60 12 345 6789
            </p>
          </div>
        </div>
        {[
          { title:t("footer.support"),  items:[{label:t("footer.helpCenter"),href:"#"},{label:t("footer.liveChat"),href:"#"},{label:t("footer.security")  ,href:"#"}] },
          { title:t("footer.company2"), items:[{label:t("footer.aboutUs"),   href:"/about"},{label:t("footer.careers"), href:"#"},{label:t("footer.contact")   ,href:"/contact"}] },
          { title:t("footer.services"), items:[{label:t("footer.hotels"),    href:"/hotels"},{label:t("footer.guide"),href:"#"},{label:t("footer.transport"),href:"#"}] },
          { title:t("footer.legal"),    items:[{label:t("footer.terms"),     href:"/terms"}, {label:t("footer.privacy"),href:"/privacy"},{label:t("footer.cookies"),href:"/cookies"}] },
        ].map(col=>(
          <div key={col.title} className={isRTL?"text-right":""}>
            <h4 className="text-[#F26522]/75 font-semibold text-[11px] mb-4 uppercase tracking-[0.18em]">{col.title}</h4>
            <ul className="space-y-2.5">
              {col.items.map(item=>(
                <li key={item.label}>
                  <a href={item.href} className="text-sm text-gray-500 hover:text-[#F26522] transition-colors duration-200">{item.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-[#F26522]/18 to-transparent mb-6"/>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-gray-600">{t("footer.copyright")}</p>
        <div className="flex items-center gap-2.5">
          {[
            {icon:faFacebook,  href:"#"},
            {icon:faInstagram, href:"#"},
            {icon:faTwitter,   href:"#"},
            {icon:faWhatsapp,  href:"#"},
          ].map((s,i)=>(
            <a key={i} href={s.href} className="w-8 h-8 bg-white/4 hover:bg-[#F26522]/18 border border-white/8 hover:border-[#F26522]/35 rounded-xl flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5">
              <FontAwesomeIcon icon={s.icon} className="text-gray-500 text-xs"/>
            </a>
          ))}
        </div>
        <div className={`flex items-center gap-4 ${isRTL?"flex-row-reverse":""}`}>
          {[
            {label:t("footer.terms"),  href:"/terms"},
            {label:t("footer.privacy"),href:"/privacy"},
            {label:t("footer.cookies"),href:"/cookies"},
          ].map(item=>(
            <a key={item.label} href={item.href} className="text-xs text-gray-600 hover:text-[#F26522] transition-colors duration-200">{item.label}</a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

// ══ MAIN EXPORT ═════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// FeaturedHotelsSection — الفنادق المُفعَّلة من Hotel.is_active=True
// ═══════════════════════════════════════════════════════════
const FeaturedHotelsSection = ({ lang, isRTL, hidden, t }: { lang: Language; isRTL: boolean; hidden?: boolean; t: (k: string) => string }) => {
  const [hotels, setHotels] = useState<PublicHotelListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicHotels({ limit: 8 })
      .then(setHotels)
      .catch(() => setHotels([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && hotels.length === 0) return null;
  if (hidden) return null;

  const title    = t('home.featuredHotels.title');
  const subtitle = t('home.featuredHotels.subtitle');
  const seeAll   = t('home.featuredHotels.seeAll');

  return (
    <section className="bg-[#FAF9F5] py-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4">
        <AnimatedSection className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-display text-4xl font-light text-[#0C1440] tracking-tight">{title}</h2>
            <p className="text-gray-500 mt-2 font-light">{subtitle}</p>
          </div>
          <button className="text-sm font-semibold text-[#F26522] border border-[#F26522]/30 px-4 py-2 rounded-xl hover:bg-[#F26522]/8 transition-colors whitespace-nowrap">
            {seeAll}
          </button>
        </AnimatedSection>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-[#F26522]/8 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {hotels.map(h => (
              <HotelCard key={h.id} hotel={h} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════
// FeaturedServicesSection — الخدمات المُفعَّلة من Service.is_active=True
// ═══════════════════════════════════════════════════════════
const FeaturedServicesSection = ({ lang, isRTL, externalFilter, hidden, t }: {
  lang: Language;
  isRTL: boolean;
  externalFilter?: string;  // فلتر من CategoryPills
  hidden?: boolean;
  t: (k: string) => string;
}) => {
  const [services, setServices] = useState<PublicServiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const filter = externalFilter || '';

  useEffect(() => {
    setLoading(true);
    fetchPublicServices({ limit: 8, ...(filter ? { service_type: filter } : {}) })
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [filter]);

  if (!loading && services.length === 0 && !filter) return null;
  if (hidden) return null;

  const title    = t('home.services.title');
  const subtitle = t('home.services.subtitle');
  const seeAll   = t('home.services.seeAll');

  return (
    <section className="bg-white py-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4">
        <AnimatedSection className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-display text-4xl font-light text-[#0C1440] tracking-tight">{title}</h2>
            <p className="text-gray-500 mt-2 font-light">{subtitle}</p>
          </div>
          <button className="text-sm font-semibold text-[#F26522] border border-[#F26522]/30 px-4 py-2 rounded-xl hover:bg-[#F26522]/8 transition-colors whitespace-nowrap">
            {seeAll}
          </button>
        </AnimatedSection>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-[#F26522]/8 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {t('home.services.empty')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map(s => (
              <ServiceCard key={s.id} service={s} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════
// HomePage Main — Hybrid: Airbnb + GetYourGuide + Klook
// ═══════════════════════════════════════════════════════
export function HomePage({ onLogin }: { onLogin?: () => void }) {
  const navigate = useNavigate();
  const { lang, changeLang, t, isRTL } = useLanguage();

  const goToSupplier = () => navigate('/register/supplier');
  const goToAgency   = () => navigate('/register/agency');
  const shared = { t, isRTL };

  // Homepage config (admin-controlled)
  const [hpConfig, setHpConfig] = useState<HomepageConfig | null>(null);
  useEffect(() => {
    fetchHomepageConfig().then(setHpConfig).catch(() => setHpConfig(null));
  }, []);

  // Helpers using config (with fallback)
  const cfg = hpConfig;
  const cfgGet = (visibleKey: keyof HomepageConfig, defaultVisible = true): boolean =>
    cfg ? Boolean(cfg[visibleKey]) : defaultVisible;

  // City modal state
  const [selectedCity, setSelectedCity] = useState<{
    filter: { city_id?: number | null; city_name?: string };
    display: string;
    image: string;
  } | null>(null);

  return (
    <div className="min-h-screen bg-[#FAF9F5]">
      <PublicNavbar
        onLogin={onLogin}
        onSupplier={goToSupplier}
        onAgency={goToAgency}
        lang={lang}
        onLangChange={changeLang}
        t={t}
        isRTL={isRTL}
      />

      {/* 1. Hero (النسخة الأصلية — Hero Hotel Cards الدوّارة) */}
      <HeroSection t={t} isRTL={isRTL} />

      {/* 2. Stats Banner (NEW — admin-toggleable) */}
      {cfgGet('stats_visible') && (
        <StatsBanner
          lang={lang}
          isRTL={isRTL}
          customers={cfg?.stats_customers ?? 0}
          destinations={cfg?.stats_destinations ?? 15}
          suppliers={cfg?.stats_suppliers ?? 0}
          partners={cfg?.stats_partners ?? 250}
        />
      )}

      {/* 3. Featured Destinations */}
      {cfgGet('show_destinations') && (
        <FeaturedDestinations
          lang={lang}
          isRTL={isRTL}
          onSelectCity={(filter, display, image) => setSelectedCity({ filter, display, image })}
        />
      )}

      {/* 4. AdSlot */}
      <section className="bg-[#FAF9F5] py-2" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-4">
          <AdSlot placement="HOME_HERO_TOP" />
        </div>
      </section>

      {/* 5. Featured Hotels */}
      {cfgGet('show_hotels') && (
        <FeaturedHotelsSection lang={lang} isRTL={isRTL} t={t} />
      )}

      {/* 6. Featured Services */}
      {cfgGet('show_services') && (
        <FeaturedServicesSection lang={lang} isRTL={isRTL} t={t} />
      )}

      {/* 8. Trust Section */}
      {cfgGet('show_trust_section') && (
        <TrustSection lang={lang} isRTL={isRTL} config={cfg} />
      )}

      {/* 9. Banner Ad */}
      <section className="bg-[#FAF9F5] py-8" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-4">
          <AdSlot placement="HOME_BANNER_FULL" />
        </div>
      </section>

      {/* 10. Testimonials Carousel (NEW — auto-rotating) */}
      {cfgGet('show_testimonials') && (
        <TestimonialsCarousel lang={lang} isRTL={isRTL} />
      )}

      {/* 11. Supplier CTA */}
      {cfgGet('show_supplier_cta') && (
        <SupplierCTASection {...shared} onSupplier={goToSupplier} />
      )}

      {/* 12. Footer */}
      <Footer {...shared} />

      {/* Popups */}
      <AdPopup placement="POPUP_ENTRY" delay={3000} />
      <AdPopup placement="POPUP_EXIT" />

      {/* City Detail Modal */}
      <CityDetailModal
        filter={selectedCity?.filter ?? null}
        cityDisplayName={selectedCity?.display}
        cityImage={selectedCity?.image}
        lang={lang}
        isRTL={isRTL}
        onClose={() => setSelectedCity(null)}
      />
    </div>
  );
}

export default HomePage;
