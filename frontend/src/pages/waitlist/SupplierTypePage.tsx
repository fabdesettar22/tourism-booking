import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight, faChevronRight, faArrowLeft,
  faBuilding, faCar, faUtensils, faCompass,
  faBiking, faSpa, faEllipsisH, faCheckCircle,
  faHotel, faUsers, faGlobe, faStar,
} from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../../hooks/useLanguage';
import { PublicNavbar } from '../../components/layout/PublicNavbar';

const SUPPLIER_TYPES = [
  {
    key:'property', icon:faBuilding, color:'#FF6B35', bgLight:'#fff8f5',
    en:{title:'Property',           sub:'Hotels, resorts, guesthouses, homestays...'},
    ar:{title:'عقار',               sub:'فنادق، منتجعات، شقق، بيوت ضيافة...'},
    ms:{title:'Hartanah',           sub:'Hotel, resort, guesthouse, homestay...'},
  },
  {
    key:'transport', icon:faCar, color:'#1A1A2E', bgLight:'#f5f5f8',
    en:{title:'Transport',          sub:'Bus, private car, boat, ferry, taxi...'},
    ar:{title:'نقل',                sub:'باص، سيارة خاصة، قارب، فيري، تاكسي...'},
    ms:{title:'Pengangkutan',       sub:'Bas, kereta persendirian, bot, feri...'},
  },
  {
    key:'restaurant', icon:faUtensils, color:'#e07a38', bgLight:'#fff8f0',
    en:{title:'Restaurant',         sub:'Traditional, cafe, buffet, floating...'},
    ar:{title:'مطعم',               sub:'تقليدي، كافيه، بوفيه، عائم...'},
    ms:{title:'Restoran',           sub:'Tradisional, kafe, bufet, terapung...'},
  },
  {
    key:'guide', icon:faCompass, color:'#2196F3', bgLight:'#f0f7ff',
    en:{title:'Tour Guide',         sub:'General, historical, diving, halal...'},
    ar:{title:'مرشد سياحي',         sub:'عام، تاريخي، غوص، سياحة إسلامية...'},
    ms:{title:'Pemandu Pelancongan',sub:'Umum, sejarah, menyelam, halal...'},
  },
  {
    key:'activity', icon:faBiking, color:'#4CAF50', bgLight:'#f0fff0',
    en:{title:'Activities',         sub:'Diving, climbing, sports, eco-tourism...'},
    ar:{title:'أنشطة وترفيه',       sub:'غوص، تسلق، رياضات، سياحة بيئية...'},
    ms:{title:'Aktiviti',           sub:'Menyelam, mendaki, sukan, eko-pelancongan...'},
  },
  {
    key:'wellness', icon:faSpa, color:'#9C27B0', bgLight:'#faf0ff',
    en:{title:'Wellness & Spa',     sub:'Spa, salon, yoga, gym, hammam...'},
    ar:{title:'سبا وعافية',         sub:'سبا، صالون، يوغا، صالة رياضية...'},
    ms:{title:'Wellness & Spa',     sub:'Spa, salun, yoga, gim, hammam...'},
  },
  {
    key:'other', icon:faEllipsisH, color:'#607D8B', bgLight:'#f5f7f8',
    en:{title:'Other Services',     sub:'Photography, events, shopping, medical...'},
    ar:{title:'خدمات أخرى',         sub:'تصوير، فعاليات، تسوق، خدمات طبية...'},
    ms:{title:'Perkhidmatan Lain',  sub:'Fotografi, acara, membeli-belah...'},
  },
];

const FEATURES = [
  { icon:faCheckCircle, en:'Free listing',     ar:'إدراج مجاني',       ms:'Penyenaraian percuma' },
  { icon:faGlobe,       en:'Arabic support',   ar:'دعم عربي',          ms:'Sokongan Arab'        },
  { icon:faUsers,       en:'2,400+ partners',  ar:'+2,400 شريك',       ms:'2,400+ rakan kongsi'  },
  { icon:faStar,        en:'98% satisfaction', ar:'98% رضا الشركاء',   ms:'98% kepuasan'         },
];

export function SupplierTypePage() {
  const navigate        = useNavigate();
  const { lang, isRTL } = useLanguage();

  const getLabel = (type: typeof SUPPLIER_TYPES[0]) =>
    type[lang as 'en'|'ar'|'ms'] ?? type.en;

  const L = {
    badge:    lang==='ar'?'انضم كمورد':lang==='ms'?'Sertai sebagai Pembekal':'Join as Supplier',
    title:    lang==='ar'?'ما نوع خدمتك؟':lang==='ms'?'Apakah jenis perkhidmatan anda?':'What type of service do you offer?',
    subtitle: lang==='ar'?'اختر نوع خدمتك لإكمال نموذج التسجيل. سنتواصل معك عند إطلاق المنصة.':lang==='ms'?'Pilih jenis perkhidmatan anda untuk mengisi borang pendaftaran.':'Select your service type to complete the registration form. We will contact you when the platform launches.',
    signin:   lang==='ar'?'تسجيل الدخول':lang==='ms'?'Log Masuk':'Sign In',
    already:  lang==='ar'?'لديك حساب بالفعل؟':lang==='ms'?'Sudah ada akaun?':'Already have an account?',
    back:     lang==='ar'?'العودة للرئيسية':lang==='ms'?'Kembali ke Utama':'Back to Home',
    brand:    lang==='ar'?'لماذا MYBRIDGE؟':lang==='ms'?'Mengapa MYBRIDGE?':'Why MYBRIDGE?',
    brandSub: lang==='ar'?'انضم لآلاف الموردين الماليزيين':lang==='ms'?'Sertai ribuan pembekal Malaysia':'Join thousands of Malaysian suppliers',
  };

  const { lang: navLang, changeLang, t: navT, isRTL: navRTL } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F9FAFB]" dir={isRTL?'rtl':'ltr'}>

      <PublicNavbar
        variant="solid"
        onLogin={()=>navigate('/supplier')}
        onSupplier={()=>navigate('/register/supplier')}
        onAgency={()=>navigate('/register/agency')}
        lang={navLang}
        onLangChange={changeLang}
        t={navT}
        isRTL={navRTL}
      />

      <div className="pt-16">

        {/* Main Content */}
        <div className="flex-1 p-6 lg:p-10">

          {/* Header */}
          <div className={`mb-8 ${isRTL?'text-right':''}`}>
            <span className="inline-block bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
              {L.badge}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{L.title}</h1>
            <p className="text-gray-500 text-sm leading-relaxed max-w-lg">{L.subtitle}</p>
          </div>

          {/* Type Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {SUPPLIER_TYPES.map(type => {
              const label = getLabel(type);
              return (
                <button
                  key={type.key}
                  onClick={() => navigate(`/register/supplier/${type.key}`)}
                  className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-[#FF6B35] hover:shadow-lg transition-all duration-200 text-left w-full"
                  style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                >
                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110"
                    style={{ background: type.bgLight }}
                  >
                    <FontAwesomeIcon icon={type.icon} className="text-xl" style={{ color: type.color }}/>
                  </div>
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base mb-0.5 group-hover:text-[#FF6B35] transition-colors">
                      {label.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{label.sub}</p>
                  </div>
                  {/* Arrow */}
                  <FontAwesomeIcon
                    icon={isRTL?faArrowLeft:faChevronRight}
                    className="text-gray-300 group-hover:text-[#FF6B35] transition-colors flex-shrink-0 text-sm"
                  />
                </button>
              );
            })}
          </div>

          {/* Already registered */}
          <p className={`text-sm text-gray-400 ${isRTL?'text-right':''}`}>
            {L.already}{' '}
            <Link to="/supplier" className="text-[#FF6B35] font-semibold hover:underline">{L.signin}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
