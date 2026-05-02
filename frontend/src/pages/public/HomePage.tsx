import { useState, useEffect } from "react";
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
    const h = ()=>setScrolled(window.scrollY>20);
    window.addEventListener("scroll", h);
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

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white border-b border-gray-100 ${scrolled?"shadow-md":""}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[auto_1fr_auto] lg:grid-cols-3 items-center h-16 gap-4">
          {/* Logo (col 1) */}
          <a href="/" onClick={e=>{ e.preventDefault(); navigate('/'); }}
            className="flex items-center flex-shrink-0 justify-self-start">
            <img src="/IMG_7936.PNG" alt="MYBRIDGE" className="h-10 w-auto"/>
          </a>

          {/* Desktop Links (col 2 — centered) */}
          <div className="hidden lg:flex items-center gap-1 justify-self-center">
            {navLinks.map(link=>(
              <a key={link.key} href={link.href}
                onClick={e=>{ e.preventDefault(); navigate(link.href); }}
                className="px-3 py-2 text-sm font-medium rounded-lg transition-colors text-gray-700 hover:text-[#F26522] hover:bg-orange-50">
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Side (col 3) */}
          <div className={`flex items-center gap-2 justify-self-end ${isRTL?'flex-row-reverse':''}`}>
            <div className="relative">
              <button onClick={()=>setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition-all border-gray-200 text-gray-700 hover:border-[#F26522] hover:text-[#F26522]">
                {currentLang?.code.toUpperCase()}
                <FontAwesomeIcon icon={faChevronDown} className="text-[9px]"/>
              </button>
              {langOpen && (
                <div className="absolute top-full mt-1 right-0 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50 min-w-[140px]">
                  {LANGUAGES.map(l=>(
                    <button key={l.code} onClick={()=>{ onLangChange(l.code); setLangOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-orange-50 hover:text-[#F26522] ${lang===l.code?"text-[#F26522] font-semibold bg-orange-50":"text-gray-700"}`}>
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-1.5">
              <button onClick={onSupplier}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all border-[#F26522] text-[#F26522] hover:bg-orange-50">
                <FontAwesomeIcon icon={faBuilding} className="text-[10px]"/>
                {t("nav.supplier")}
              </button>
              <button onClick={onAgency}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all border-[#F26522] text-[#F26522] hover:bg-orange-50">
                <FontAwesomeIcon icon={faUserTie} className="text-[10px]"/>
                {t("nav.agency")}
              </button>
            </div>

            <button onClick={onLogin}
              className="bg-[#F26522] hover:bg-[#DD5618] text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
              {t("nav.signIn")}
            </button>

            <button onClick={()=>setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-700">
              <FontAwesomeIcon icon={menuOpen?faXmark:faBars}/>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 py-3 px-2" dir={isRTL?"rtl":"ltr"}>
            {navLinks.map(link=>(
              <a key={link.key} href={link.href}
                onClick={e=>{ e.preventDefault(); navigate(link.href); setMenuOpen(false); }}
                className="block px-4 py-2.5 text-sm text-gray-700 hover:text-[#FF6B35] hover:bg-orange-50 rounded-lg">
                {link.label}
              </a>
            ))}
            <div className="border-t border-gray-100 mt-2 pt-2 space-y-1">
              <button onClick={onSupplier} className="w-full text-left px-4 py-2.5 text-sm text-[#FF6B35] font-semibold hover:bg-orange-50 rounded-lg flex items-center gap-2">
                <FontAwesomeIcon icon={faBuilding}/> {t("nav.supplier")}
              </button>
              <button onClick={onAgency} className="w-full text-left px-4 py-2.5 text-sm text-[#FF6B35] font-semibold hover:bg-orange-50 rounded-lg flex items-center gap-2">
                <FontAwesomeIcon icon={faUserTie}/> {t("nav.agency")}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// ═══════════════════════════════════════════════════════
// HERO SECTION — النسخة الأصلية (Hero Hotel Cards الدوّارة)
// ═══════════════════════════════════════════════════════
const HeroSection = ({ t, isRTL }: { t:(k:string)=>string; isRTL:boolean }) => {
  const [heroHotels, setHeroHotels] = useState<HeroHotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    fetch(HERO_HOTELS_API)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setHeroHotels(data.results || []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error loading hero hotels:', err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (heroHotels.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx(p => (p + 1) % heroHotels.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroHotels.length]);

  if (isLoading) {
    return (
      <section className="relative min-h-[680px] flex items-center justify-center bg-[#0F2742]">
        <div className="text-white flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"/>
          <p className="text-sm text-white/70">Loading...</p>
        </div>
      </section>
    );
  }

  if (heroHotels.length === 0) {
    return (
      <section className="relative min-h-[680px] flex items-center justify-center bg-[#0F2742]">
        <div className="text-white text-center px-4">
          <FontAwesomeIcon icon={faHotel} className="text-[#FF6B35] text-4xl mb-4"/>
          <p className="text-lg text-white/80 mb-2">No hotels available</p>
          <p className="text-xs text-white/50">Add hotel cards from Django Admin</p>
        </div>
      </section>
    );
  }

  const currentHotel = heroHotels[currentIdx];

  return (
    <section className="relative min-h-[680px] flex items-center overflow-hidden">
      {/* خلفية Hero — صورة أو فيديو */}
      {heroHotels.map((hotel, i) => (
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
      <div className="absolute inset-0 bg-gradient-to-r from-[#0F2742]/90 via-[#0F2742]/70 to-[#0F2742]/45"/>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          <div className={isRTL?"text-right":""}>
            <span className="inline-block bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-white/20 backdrop-blur-sm">
              <FontAwesomeIcon icon={faMapMarkedAlt} className={isRTL?"ml-2":"mr-2"}/>
              {t("hero.discover")}
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-medium text-white leading-[1.05] mb-6 tracking-tight">
              {t("hero.title")}<br/>
              <span className="text-[#C9A961] italic">{t("hero.titleSpan")}</span>
            </h1>
            <p className="text-white/70 text-lg mb-8 leading-relaxed max-w-lg">
              {t("hero.subtitle")}
            </p>

            {/* 🆕 CTA buttons — Supplier + Agency */}
            <div className={`flex flex-col sm:flex-row gap-3 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              <a
                href="/register/supplier"
                className="group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-[#FF6B35] hover:bg-[#e07a38] text-white font-semibold text-sm rounded-xl shadow-xl shadow-[#FF6B35]/20 transition-all hover:shadow-2xl hover:shadow-[#FF6B35]/30 hover:-translate-y-0.5"
              >
                <FontAwesomeIcon icon={faBuilding} className="text-white/90" />
                {t("hero.cta_supplier")}
                <FontAwesomeIcon icon={isRTL ? faArrowLeft : faArrowRight} className="text-xs opacity-80 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a
                href="/register/agency"
                className="group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-[#FF6B35] hover:bg-[#e07a38] text-white font-semibold text-sm rounded-xl shadow-xl shadow-[#FF6B35]/20 transition-all hover:shadow-2xl hover:shadow-[#FF6B35]/30 hover:-translate-y-0.5"
              >
                <FontAwesomeIcon icon={faBriefcase} className="text-white/90" />
                {t("hero.cta_agency")}
                <FontAwesomeIcon icon={isRTL ? faArrowLeft : faArrowRight} className="text-xs opacity-80 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>

          <div className="relative">
            <div
              key={currentHotel.id}
              className="relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl transition-all duration-700 animate-fade-in"
              style={{ minHeight: 420 }}
            >
              {/* media البطاقة — صورة أو فيديو */}
              {currentHotel.card_media_kind === 'video' && currentHotel.card_video ? (
                <video
                  src={currentHotel.card_video}
                  autoPlay muted loop playsInline preload="metadata"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
                  style={{backgroundImage:`url(${currentHotel.card_image || ''})`}}/>
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/85"/>

              <div className={`relative z-10 h-full flex flex-col justify-end p-7 ${isRTL?"text-right":""}`} style={{minHeight:420}}>
                {/* Top-right badge: location (hotel) أو type tag (others) */}
                {currentHotel.card_type === 'hotel' && currentHotel.location ? (
                  <div className={`absolute top-5 ${isRTL?"right-5":"left-5"} bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-3 py-1.5 flex items-center gap-1.5`}>
                    <FontAwesomeIcon icon={faLocationDot} className="text-[#FF6B35] text-xs"/>
                    <span className="text-white text-xs font-semibold">{currentHotel.location}</span>
                  </div>
                ) : currentHotel.card_type === 'sponsor' ? (
                  <div className={`absolute top-5 ${isRTL?"right-5":"left-5"} bg-[#C9A961]/90 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1`}>
                    <span className="text-white text-[10px] font-bold uppercase tracking-wider">Sponsored</span>
                  </div>
                ) : currentHotel.card_type === 'partner' ? (
                  <div className={`absolute top-5 ${isRTL?"right-5":"left-5"} bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-3 py-1`}>
                    <span className="text-white text-[10px] font-bold uppercase tracking-wider">Partner</span>
                  </div>
                ) : null}

                <div className={`flex items-center gap-3 mb-4 ${isRTL?"flex-row-reverse":""}`}>
                  {currentHotel.logo && (
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                      <img
                        src={currentHotel.logo}
                        alt={`${currentHotel.name} logo`}
                        className="w-10 h-10 object-contain"
                        onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none';}}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-bold text-white leading-tight">{currentHotel.name}</h3>
                  </div>
                </div>

                {/* Stars — للفنادق فقط */}
                {currentHotel.card_type === 'hotel' && currentHotel.stars ? (
                  <div className={`flex items-center gap-1 mb-4 ${isRTL?"justify-end":""}`}>
                    {Array.from({length:5}).map((_,i)=>(
                      <FontAwesomeIcon
                        key={i}
                        icon={faStar}
                        className={`text-sm ${i < (currentHotel.stars||0) ? "text-[#FFD700]" : "text-white/20"}`}
                      />
                    ))}
                    <span className="text-white/80 text-xs font-semibold ml-2 mr-2">{currentHotel.stars}.0</span>
                  </div>
                ) : null}

                {currentHotel.description && (
                  <p className="text-white/85 text-sm leading-relaxed mb-3">
                    {currentHotel.description}
                  </p>
                )}

                {/* CTA — اختياري */}
                {currentHotel.cta_text && currentHotel.link_url && (
                  <a
                    href={currentHotel.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 mt-2 px-5 py-2.5 bg-[#FF6B35] hover:bg-[#e07a38] text-white text-sm font-semibold rounded-xl transition-colors w-fit shadow-lg"
                  >
                    {currentHotel.cta_text} →
                  </a>
                )}
              </div>
            </div>

            <div className={`flex items-center gap-2 mt-5 ${isRTL?"justify-end":"justify-start"}`}>
              {heroHotels.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  aria-label={`Show hotel ${i+1}`}
                  className={`h-2 rounded-full transition-all ${i===currentIdx?"bg-[#FF6B35] w-8":"bg-white/40 w-2 hover:bg-white/60"}`}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

// ══ DESTINATIONS ════════════════════════════════════════
const DestinationsSection = ({ t, isRTL }: { t:(k:string)=>string; isRTL:boolean }) => (
  <section className="py-24 bg-white" dir={isRTL?"rtl":"ltr"}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className={`mb-10 ${isRTL?"text-right":""}`}>
        <p className="text-[#C9A961] text-xs font-semibold uppercase tracking-[0.25em] mb-1">
          <FontAwesomeIcon icon={faLocationDot} className={isRTL?"ml-1":"mr-1"}/> {t("destinations.label")}
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-medium text-gray-900 tracking-tight">{t("destinations.title")}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {DESTINATIONS.slice(0,7).map(dest=>(
          <a key={dest.name} href="#" className="mb-card mb-card-img group relative rounded-2xl overflow-hidden border border-gray-100">
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
        <div className="bg-[#0F2742] rounded-2xl p-6 flex flex-col justify-between hover:bg-[#163556] transition-colors cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#C9A961]/10 rounded-full -translate-y-8 translate-x-8" />
          <p className="font-display text-white text-lg leading-snug relative">Crafting Your Perfect <span className="italic text-[#C9A961]">Travel</span> Experience</p>
          <a href="/destinations" className="mt-4 bg-[#C9A961] text-[#0F2742] text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 hover:bg-[#d4b67a] transition-colors w-fit relative">
            {t("destinations.browseAll")} <FontAwesomeIcon icon={isRTL?faChevronLeft:faChevronRight} className="text-xs"/>
          </a>
        </div>
      </div>
    </div>
  </section>
);

// ══ MALAYSIA ════════════════════════════════════════════
const MalaysiaSection = ({ t, isRTL }: { t:(k:string)=>string; isRTL:boolean }) => (
  <section className="py-24 bg-[#0F2742]" dir={isRTL?"rtl":"ltr"}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className={isRTL?"text-right":""}>
          <p className="text-[#C9A961] text-xs font-semibold uppercase tracking-[0.25em] mb-4">
            <FontAwesomeIcon icon={faMapMarkedAlt} className={isRTL?"ml-2":"mr-2"}/>
            {t("malaysia.label")}
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-medium text-white mb-5 leading-[1.1] tracking-tight">
            {t("malaysia.title")}<br/>
            <span className="text-[#C9A961] italic">{t("malaysia.titleSpan")}</span>
          </h2>
          <p className="text-white/55 mb-10 leading-relaxed">{t("malaysia.desc")}</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { num:"30M+",  key:"stats.tourists" },
              { num:"4000+", key:"stats.hotels"   },
              { num:"13",    key:"stats.states"   },
              { num:"#1",    key:"stats.ranking"  },
            ].map(s=>(
              <div key={s.num} className="mb-stat bg-white/5 border border-white/10 rounded-2xl p-5 text-center hover:bg-white/10 transition-colors">
                <div className="font-display text-3xl font-medium text-[#C9A961] mb-1">{s.num}</div>
                <div className="text-xs text-white/45">{t(s.key)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {MALAYSIA_DESTINATIONS.map(dest=>(
            <div key={dest.key} className="mb-card mb-card-img group rounded-2xl overflow-hidden border border-white/10 hover:border-[#FF6B35]/50 cursor-pointer">
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
        </div>
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
    <section className="py-24 bg-[#FAF8F3]" dir={isRTL?"rtl":"ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className={isRTL?"text-right":""}>
            <span className="inline-block bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">{t("why.label")}</span>
            <h2 className="font-display text-3xl md:text-4xl font-medium text-gray-900 tracking-tight mb-4">{t("why.title")}</h2>
            <p className="text-gray-500 mb-8 text-sm leading-relaxed">{t("why.subtitle")}</p>
            <div className={`flex gap-3 ${isRTL?"justify-end":""}`}>
              <a href="#" className="bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2">
                <FontAwesomeIcon icon={faGooglePlay}/> {t("why.googlePlay")}
              </a>
              <a href="#" className="bg-white text-gray-900 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2 border border-gray-200">
                <FontAwesomeIcon icon={faAppStore}/> {t("why.appStore")}
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {features.map(f=>(
              <div key={f.titleKey} className="mb-feature bg-white rounded-2xl p-6 hover:bg-orange-50 group border border-gray-100">
                <div className="mb-icon-wrap w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#FF6B35]">
                  <FontAwesomeIcon icon={f.icon} className="text-[#FF6B35] group-hover:text-white transition-colors text-lg"/>
                </div>
                <h3 className={`font-bold text-gray-900 text-sm mb-2 group-hover:text-orange-700 transition-colors ${isRTL?"text-right":""}`}>{t(f.titleKey)}</h3>
                <p className={`text-xs text-gray-500 leading-relaxed ${isRTL?"text-right":""}`}>{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ══ SUPPLIER CTA ════════════════════════════════════════
const SupplierCTASection = ({ onSupplier, t, isRTL }: { onSupplier?:()=>void; t:(k:string)=>string; isRTL:boolean }) => (
  <section className="py-24 bg-[#0F2742]" dir={isRTL?"rtl":"ltr"}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className={isRTL?"text-right":""}>
          <span className="inline-block bg-orange-500/20 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <FontAwesomeIcon icon={faBuilding} className={isRTL?"ml-1":"mr-1"}/> {t("supplierCta.label")}
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-medium text-white mb-5 leading-[1.1] tracking-tight">
            {t("supplierCta.title")}<br/>
            <span className="text-[#FF6B35]">{t("supplierCta.titleSpan")}</span>
          </h2>
          <p className="text-white/55 mb-8 leading-relaxed">{t("supplierCta.desc")}</p>
          <div className={`grid grid-cols-2 gap-3 mb-10 ${isRTL?"text-right":""}`}>
            {[t("supplierCta.f1"),t("supplierCta.f2"),t("supplierCta.f3"),t("supplierCta.f4")].map(f=>(
              <div key={f} className="flex items-center gap-2 text-sm text-white/70">
                <div className="w-5 h-5 bg-[#FF6B35] rounded-full flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-white text-[9px]"/>
                </div>
                {f}
              </div>
            ))}
          </div>
          <button onClick={onSupplier}
            className="mb-btn bg-[#FF6B35] hover:bg-[#e07a38] text-white font-bold px-8 py-4 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-orange-500/25">
            <FontAwesomeIcon icon={faBuilding}/> {t("supplierCta.cta")}
            <FontAwesomeIcon icon={faArrowRight}/>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { num:"2,400+",  key:"supplierCta.stat1Label", icon:faHotel       },
            { num:"18,000+", key:"supplierCta.stat2Label", icon:faCheckCircle },
            { num:"4",       key:"supplierCta.stat3Label", icon:faGlobe       },
            { num:"98%",     key:"supplierCta.stat4Label", icon:faUsers       },
          ].map(s=>(
            <div key={s.num} className="mb-stat bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors">
              <FontAwesomeIcon icon={s.icon} className="text-[#FF6B35] text-2xl mb-3"/>
              <div className="text-3xl font-bold text-[#FF6B35] mb-1">{s.num}</div>
              <div className="text-sm text-white/50">{t(s.key)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

// ══ TESTIMONIALS ════════════════════════════════════════
const TestimonialsSection = ({ t, isRTL }: { t:(k:string)=>string; isRTL:boolean }) => (
  <section className="py-24 bg-white" dir={isRTL?"rtl":"ltr"}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <span className="inline-block bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">{t("testimonials.label")}</span>
        <h2 className="font-display text-3xl md:text-4xl font-medium text-gray-900 tracking-tight">{t("testimonials.title")}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map(testimonial=>(
          <div key={testimonial.name} className="bg-gray-50 rounded-2xl p-6 hover:bg-orange-50 transition-colors border border-gray-100 hover:border-orange-200">
            <div className="flex items-center gap-1.5 mb-4">
              {[1,2,3,4,5].map(s=>(
                <FontAwesomeIcon key={s} icon={faStar} className="text-amber-400 text-sm"/>
              ))}
            </div>
            <p className={`text-sm text-gray-600 leading-relaxed mb-6 ${isRTL?"text-right":""}`}>"{testimonial.text}"</p>
            <div className={`flex items-center gap-3 ${isRTL?"flex-row-reverse":""}`}>
              <div className="w-10 h-10 rounded-full bg-[#FF6B35] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {testimonial.avatar}
              </div>
              <div className={isRTL?"text-right":""}>
                <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                <p className="text-xs text-gray-500">{testimonial.location}</p>
              </div>
            </div>
          </div>
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
        <div className={isRTL?"text-right":""}>
          <p className="text-[#C9A961] text-xs font-semibold uppercase tracking-[0.25em] mb-1">{t("news.label")}</p>
          <h2 className="font-display text-3xl md:text-4xl font-medium text-gray-900 tracking-tight">{t("news.title")}</h2>
        </div>
        <a href="/blog" className="hidden sm:flex items-center gap-1.5 text-[#FF6B35] font-semibold text-sm bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 transition-colors">
          {t("news.viewMore")} <FontAwesomeIcon icon={isRTL?faChevronLeft:faChevronRight} className="text-xs"/>
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {NEWS.map((post,i)=>(
          <div key={post.id} className={`mb-card mb-card-img bg-white rounded-2xl overflow-hidden border border-gray-100 group ${i===0?"md:col-span-1":""}`}>
            <div className="relative overflow-hidden aspect-video">
              <img src={post.image} alt={post.title} className="w-full h-full object-cover"/>
              <div className="absolute top-3 left-3">
                <span className="bg-white text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">{post.category}</span>
              </div>
            </div>
            <div className="p-5">
              <div className={`flex items-center gap-3 text-xs text-gray-400 mb-3 ${isRTL?"flex-row-reverse":""}`}>
                <span>{post.date}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300"/>
                <span>{post.readTime} read</span>
              </div>
              <h3 className={`font-bold text-gray-900 text-sm leading-snug mb-4 line-clamp-2 group-hover:text-[#FF6B35] transition-colors ${isRTL?"text-right":""}`}>{post.title}</h3>
              <div className={`flex items-center justify-between ${isRTL?"flex-row-reverse":""}`}>
                <span className="text-xs text-gray-400">{post.author}</span>
                <a href="#" className="text-xs text-[#FF6B35] font-semibold border border-orange-200 px-3 py-1.5 rounded-xl hover:bg-orange-50 transition-colors">
                  {t("news.read")}
                </a>
              </div>
            </div>
          </div>
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
        <div className="bg-[#0F2742] rounded-3xl p-10 md:p-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6B35]/10 rounded-full -translate-y-32 translate-x-32"/>
          <div className={`relative z-10 ${isRTL?"text-right":""}`}>
            <span className="inline-block bg-[#FF6B35]/20 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <FontAwesomeIcon icon={faBell} className={isRTL?"ml-1":"mr-1"}/> MYBRIDGE
            </span>
            <h2 className="text-3xl font-bold text-white mb-3">{t("newsletter.title")}</h2>
            <p className="text-white/55 text-sm">{t("newsletter.subtitle")}</p>
          </div>
          <div className={`relative z-10 flex gap-3 ${isRTL?"flex-row-reverse":""}`}>
            <div className="flex-1 relative">
              <FontAwesomeIcon icon={faEnvelope} className={`absolute ${isRTL?"right-3":"left-3"} top-1/2 -translate-y-1/2 text-gray-400 text-sm`}/>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder={t("newsletter.placeholder")}
                className={`w-full bg-white text-gray-900 text-sm rounded-xl ${isRTL?"pr-9 pl-4":"pl-9 pr-4"} py-4 outline-none placeholder-gray-400 border-0`}/>
            </div>
            <button className="bg-[#FF6B35] hover:bg-[#e07a38] text-white text-sm font-bold px-6 py-4 rounded-xl transition-colors whitespace-nowrap">
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
  <footer className="bg-gray-900 text-gray-400" dir={isRTL?"rtl":"ltr"}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
        <div className="col-span-2">
          <div className={`flex items-center gap-2 mb-3 ${isRTL?"flex-row-reverse":""}`}>
            <img src="/logo.svg" alt="MYBRIDGE" className="h-8 w-auto brightness-0 invert"/>
            <span className="text-white font-bold text-lg">MYBRIDGE</span>
          </div>
          <p className="text-xs text-gray-500 italic mb-4">{t("footer.tagline")}</p>
          <div className={`space-y-1 text-xs text-gray-500 ${isRTL?"text-right":""}`}>
            <p className="font-medium text-gray-400">{t("footer.license")}</p>
            <p>{t("footer.company")}</p>
            <p>{t("footer.regNo")}</p>
            <p className="text-[#FF6B35]">www.mybridge.my</p>
          </div>
          <div className={`mt-4 ${isRTL?"text-right":""}`}>
            <p className="text-xs flex items-center gap-2">
              <FontAwesomeIcon icon={faEnvelope} className="flex-shrink-0 text-[#FF6B35]"/>
              {t("footer.email")}
            </p>
            <p className="text-xs flex items-center gap-2 mt-1">
              <FontAwesomeIcon icon={faPhone} className="flex-shrink-0 text-[#FF6B35]"/>
              +60 12 345 6789
            </p>
          </div>
        </div>
        {[
          { title:t("footer.support"),  items:[t("footer.helpCenter"),t("footer.liveChat"),t("footer.security")] },
          { title:t("footer.company2"), items:[t("footer.aboutUs"),t("footer.careers"),t("footer.contact")] },
          { title:t("footer.services"), items:[t("footer.hotels"),t("footer.guide"),t("footer.transport")] },
          { title:t("footer.legal"),    items:[t("footer.terms"),t("footer.privacy"),t("footer.cookies")] },
        ].map(col=>(
          <div key={col.title} className={isRTL?"text-right":""}>
            <h4 className="text-white font-bold text-sm mb-4">{col.title}</h4>
            <ul className="space-y-2.5">
              {col.items.map(item=>(
                <li key={item}>
                  <a href="#" className="text-sm hover:text-orange-400 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs">{t("footer.copyright")}</p>
        <div className="flex items-center gap-3">
          {[
            {icon:faFacebook,  href:"#"},
            {icon:faInstagram, href:"#"},
            {icon:faTwitter,   href:"#"},
            {icon:faWhatsapp,  href:"#"},
          ].map((s,i)=>(
            <a key={i} href={s.href} className="w-8 h-8 bg-gray-800 hover:bg-[#FF6B35] rounded-lg flex items-center justify-center transition-colors">
              <FontAwesomeIcon icon={s.icon} className="text-gray-400 hover:text-white text-sm"/>
            </a>
          ))}
        </div>
        <div className={`flex items-center gap-4 ${isRTL?"flex-row-reverse":""}`}>
          {[t("footer.terms"),t("footer.privacy"),t("footer.cookies")].map(item=>(
            <a key={item} href="#" className="text-xs hover:text-orange-400 transition-colors">{item}</a>
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
const FeaturedHotelsSection = ({ lang, isRTL, hidden }: { lang: Language; isRTL: boolean; hidden?: boolean }) => {
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

  const title = lang === 'ar' ? 'فنادق مختارة' : lang === 'ms' ? 'Hotel Pilihan' : 'Featured Hotels';
  const subtitle = lang === 'ar'
    ? 'أفضل الفنادق المُعتمَدة على منصتنا'
    : lang === 'ms'
    ? 'Hotel terbaik yang disahkan di platform kami'
    : 'Best verified hotels on our platform';
  const seeAll = lang === 'ar' ? 'عرض الكل ←' : lang === 'ms' ? 'Lihat Semua ←' : 'See all →';

  return (
    <section className="bg-white py-14" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">{title}</h2>
            <p className="text-gray-500 mt-2">{subtitle}</p>
          </div>
          <button className="text-sm font-semibold text-[#FF6B35] hover:underline whitespace-nowrap">
            {seeAll}
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-gray-100 rounded-2xl animate-pulse" />
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
const FeaturedServicesSection = ({ lang, isRTL, externalFilter, hidden }: {
  lang: Language;
  isRTL: boolean;
  externalFilter?: string;  // فلتر من CategoryPills
  hidden?: boolean;
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

  const title = lang === 'ar' ? 'خدمات سياحية' : lang === 'ms' ? 'Perkhidmatan Pelancongan' : 'Tourism Services';
  const subtitle = lang === 'ar'
    ? 'نقل، جولات، أنشطة، ومطاعم — كل ما تحتاجه لرحلتك'
    : lang === 'ms'
    ? 'Pengangkutan, lawatan, aktiviti & restoran'
    : 'Transport, tours, activities & restaurants';

  const seeAll = lang === 'ar' ? 'عرض الكل ←' : lang === 'ms' ? 'Lihat Semua ←' : 'See all →';

  return (
    <section className="bg-gray-50 py-14" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">{title}</h2>
            <p className="text-gray-500 mt-2">{subtitle}</p>
          </div>
          <button className="text-sm font-semibold text-[#FF6B35] hover:underline whitespace-nowrap">
            {seeAll}
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {lang === 'ar' ? 'لا توجد خدمات في هذه الفئة بعد.' : lang === 'ms' ? 'Tiada perkhidmatan dalam kategori ini lagi.' : 'No services in this category yet.'}
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
    <div className="min-h-screen bg-white">
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
      <section className="bg-white py-2" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-4">
          <AdSlot placement="HOME_HERO_TOP" />
        </div>
      </section>

      {/* 5. Featured Hotels */}
      {cfgGet('show_hotels') && (
        <FeaturedHotelsSection lang={lang} isRTL={isRTL} />
      )}

      {/* 6. Featured Services */}
      {cfgGet('show_services') && (
        <FeaturedServicesSection lang={lang} isRTL={isRTL} />
      )}

      {/* 8. Trust Section */}
      {cfgGet('show_trust_section') && (
        <TrustSection lang={lang} isRTL={isRTL} config={cfg} />
      )}

      {/* 9. Banner Ad */}
      <section className="bg-white py-8" dir={isRTL ? 'rtl' : 'ltr'}>
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
