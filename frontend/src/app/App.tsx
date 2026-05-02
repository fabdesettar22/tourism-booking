// src/app/App.tsx
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { HotelOnboardingWizard }  from '../features/supplier/onboarding/HotelOnboardingWizard';
import { LoginPage }              from '../features/auth/LoginPage';
import { HomePage }               from '../pages/public/HomePage';
import { RegisterAgencyPage }     from '../pages/auth/RegisterAgencyPage';
import { AgencyActivationPage }  from '../pages/auth/AgencyActivationPage';
import { SupplierTypePage }       from '../pages/waitlist/SupplierTypePage';
import { WaitlistFormPage }       from '../pages/waitlist/WaitlistFormPage';
import { Sidebar }                from '../components/layout/Sidebar';
import { Header }                 from '../components/layout/Header';
import { DashboardContent }       from '../features/dashboard/DashboardContent';
import { AgencyDashboard }        from '../features/dashboard/AgencyDashboard';
import { BookingsManagement }     from '../features/bookings/BookingsManagement';
import { AgenciesManagement }     from '../features/agencies/AgenciesManagement';
import { RegistrationRequests }   from '../features/registrations/RegistrationRequests';
import { CustomersManagement }    from '../features/agencies/CustomersManagement';
import { PackagesManagement }     from '../features/tours/PackagesManagement';
import { DestinationsManagement } from '../features/destinations/DestinationsManagement';
import { HotelsManagement }       from '../features/hotels/HotelsManagement';
import { ServicesManagement }     from '../features/tours/ServicesManagement';
import { FinancialReports }       from '../features/analytics/FinancialReports';
import { ExtranetManagement }     from '../features/hotels/ExtranetManagement';
import { AnalyticsReports }       from '../features/analytics/AnalyticsReports';
import { SettingsPage }           from '../pages/admin/SettingsPage';
import { AdsManagement } from '../features/advertising/AdsManagement';
import { HomepageManagement } from '../features/homepage/HomepageManagement';
import { HeroHotelsManagement } from '../features/heroHotels/HeroHotelsManagement';
import { DestinationsAdminPage } from '../features/destinationsAdmin/DestinationsAdminPage';
import { BlogModule }            from '../features/blog/BlogModule';
import { CategoryManagement as BlogCategoryManagement } from '../features/blog/CategoryManagement';
import { TagManagement as BlogTagManagement }           from '../features/blog/TagManagement';
import { BlogListPage }          from '../pages/public/blog/BlogListPage';
import { BlogDetailPage }        from '../pages/public/blog/BlogDetailPage';
import { getStoredUser, clearAuth } from '../services/authService';
import type { AuthUser }          from '../services/authService';
import { useLanguage }            from '../hooks/useLanguage';
import { ComingSoonPage }         from '../pages/public/ComingSoonPage';
import { HotelDetailPage }        from '../pages/public/HotelDetailPage';
import { HotelsListPage }         from '../pages/public/HotelsListPage';
import { ServiceDetailPage }      from '../pages/public/ServiceDetailPage';
import { SupplierOtpLogin }       from '../features/auth/SupplierOtpLogin';
import { ServiceSupplierDashboard } from '../features/supplier/dashboard/ServiceSupplierDashboard';
import { fetchSupplierMe }        from '../services/supplierProfileApi';
import type { SupplierMeResponse } from '../services/supplierProfileApi';

// ═══════════════════════════════════════════════════════════
// LOGIN ROUTE — صفحة Login المستقلة
// ═══════════════════════════════════════════════════════════

function LoginRoute() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  // إذا المستخدم مسجّل دخولاً بالفعل، أعِد توجيهه
  useEffect(() => {
    const stored = getStoredUser();
    const token  = localStorage.getItem('access_token');
    if (stored && token) {
      if (stored.role === 'supplier') {
        navigate('/supplier', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } else {
      setChecking(false);
    }
  }, [navigate]);

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <LoginPage
      onSuccess={(u: AuthUser) => {
        // بعد Login ناجح: وجّه حسب الدور
        if (u.role === 'supplier') {
          navigate('/supplier', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════
// SUPPLIER PORTAL
// ═══════════════════════════════════════════════════════════

function SupplierPortal() {
  const navigate        = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<SupplierMeResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    const token  = localStorage.getItem('access_token');
    if (stored && token && stored.role === 'supplier') {
      setUser(stored);
      setLoadingProfile(true);
      fetchSupplierMe()
        .then(setProfile)
        .catch(() => setProfile(null))
        .finally(() => setLoadingProfile(false));
    }
  }, []);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setProfile(null);
    navigate('/supplier');
  };

  // غير مسجَّل دخولاً → شاشة OTP
  if (!user) {
    return <SupplierOtpLogin onSuccess={() => { window.location.reload(); }} />;
  }

  // جارٍ تحميل البروفايل
  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // مورد فندق → HotelOnboardingWizard
  if (profile?.linked?.kind === 'hotel') {
    return <HotelOnboardingWizard onLogout={handleLogout}/>;
  }

  // مورد خدمة → ServiceSupplierDashboard
  if (profile?.linked?.kind === 'service') {
    return <ServiceSupplierDashboard onLogout={handleLogout} />;
  }

  // قديم/Legacy: مورد بدون كيان مرتبط (HotelOnboardingWizard من الصفر)
  return <HotelOnboardingWizard onLogout={handleLogout}/>;
}

// ═══════════════════════════════════════════════════════════
// ADMIN / AGENCY APP
// ═══════════════════════════════════════════════════════════

function AdminApp() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser]           = useState<AuthUser | null>(null);
  const [checking, setChecking]   = useState(true);

  // ═══ كل الـ Hooks في الأعلى (قبل أي return) ═══

  // Hook 1: تحميل المستخدم من localStorage
  useEffect(() => {
    const stored = getStoredUser();
    const token  = localStorage.getItem('access_token');
    if (stored && token) {
      setUser(stored);
    }
    setChecking(false);
  }, []);

  // Hook 2: إذا لم يكن مسجّل دخولاً، أعِد توجيهه لـ /login
  useEffect(() => {
    if (!checking && !user) {
      navigate('/login', { replace: true });
    }
  }, [checking, user, navigate]);

  // Hook 3: إذا كان supplier، أعِد توجيهه لـ /supplier
  useEffect(() => {
    if (!checking && user?.role === 'supplier') {
      navigate('/supplier', { replace: true });
    }
  }, [checking, user, navigate]);

  // ═══ الآن الـ returns (بعد كل الـ Hooks) ═══

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setActiveTab('dashboard');
    navigate('/login', { replace: true });
  };

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  // إذا لا يوجد user، لا نعرض شيء (useEffect سيُحوّله)
  if (!user) return null;

  // إذا supplier، لا نعرض شيء (useEffect سيُحوّله)
  if (user.role === 'supplier') return null;

  const isAdmin = user.role === 'super_admin' || user.role === 'admin';

  // حالة خاصة: وكالة غير معتمدة
  if (user.role === 'agency' && user.agency === null) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-10 max-w-md w-full text-center">
        <span className="text-4xl block mb-4">⏳</span>
        <h2 className="text-2xl font-bold text-white mb-2">طلبك قيد المراجعة</h2>
        <p className="text-blue-200 text-sm mb-6">سيتواصل معك فريقنا قريباً.</p>
        <button onClick={handleLogout} className="w-full bg-white/10 border border-white/20 text-white font-medium rounded-xl py-3 text-sm">
          تسجيل الخروج
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':    return isAdmin ? <DashboardContent /> : <AgencyDashboard user={user} />;
      case 'bookings':     return <BookingsManagement />;
      case 'packages':     return <PackagesManagement user={user} />;
      case 'customers':    return <CustomersManagement user={user} />;
      case 'financial':    return <FinancialReports />;
      case 'settings':     return <SettingsPage user={user} onLogout={handleLogout} onUserUpdate={u => setUser(u)} />;
      case 'destinations': return isAdmin ? <DestinationsManagement /> : null;
      case 'hotels':       return isAdmin ? <HotelsManagement /> : null;
      case 'extranet':     return isAdmin ? <ExtranetManagement /> : null;
      case 'services':     return isAdmin ? <ServicesManagement /> : null;
      case 'registrations': return isAdmin ? <RegistrationRequests /> : null;
      case 'agencies':     return isAdmin ? <AgenciesManagement /> : null;
      case 'analytics':    return isAdmin ? <AnalyticsReports /> : null;
      case 'advertising':  return isAdmin ? <AdsManagement /> : null;
      case 'homepage':     return isAdmin ? <HomepageManagement /> : null;
      case 'hero_hotels':  return isAdmin ? <HeroHotelsManagement /> : null;
      case 'home_destinations': return isAdmin ? <DestinationsAdminPage /> : null;
      case 'blog':         return isAdmin ? <BlogModule /> : null;
      case 'blog_categories': return isAdmin ? <BlogCategoryManagement /> : null;
      case 'blog_tags':    return isAdmin ? <BlogTagManagement /> : null;
      default:             return isAdmin ? <DashboardContent /> : <AgencyDashboard user={user} />;
    }
  };

  return (
    <div className="fixed inset-0 flex bg-background" dir="rtl">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout}/>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header user={user} onLogout={handleLogout} onNavigate={setActiveTab}/>
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HOMEPAGE WRAPPER — لاستبدال window.location بـ navigate
// ═══════════════════════════════════════════════════════════

function HomePageRoute() {
  const navigate = useNavigate();
  return <HomePage onLogin={() => navigate('/login')} />;
}

// ═══════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════

export default function App() {
  const { isRTL } = useLanguage();

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <Routes>
        {/* ── Public ─────────────────────────────── */}
        <Route path="/"                          element={<HomePageRoute />} />

        {/* ── Login ──────────────────────────────── */}
        <Route path="/login"                     element={<LoginRoute />} />

        {/* ── Supplier Waitlist ───────────────────── */}
        <Route path="/register/supplier"         element={<SupplierTypePage />} />
        <Route path="/register/supplier/:type"   element={<WaitlistFormPage />} />

        {/* ── Agency Register ─────────────────────── */}
        <Route path="/register/agency"           element={<RegisterAgencyPage />} />
        <Route path="/activate-agency"           element={<AgencyActivationPage />} />

        {/* ── Supplier Portal (login + onboarding) ─ */}
        <Route path="/supplier"                  element={<SupplierPortal />} />
        <Route path="/supplier/*"                element={<SupplierPortal />} />

        {/* ── Dashboard ───────────────────────────── */}
        <Route path="/dashboard"                 element={<AdminApp />} />
        <Route path="/dashboard/*"               element={<AdminApp />} />

        {/* ── Public Detail Pages ─────────────────── */}
        <Route path="/hotels/:id"   element={<HotelDetailPage />} />
        <Route path="/services/:id" element={<ServiceDetailPage />} />

        {/* ── Public Pages ────────────────────────── */}
        <Route path="/tours"        element={<ComingSoonPage pageName="Tours" />} />
        <Route path="/destinations" element={<ComingSoonPage pageName="Destinations" />} />
        <Route path="/activities"   element={<ComingSoonPage pageName="Activities" />} />
        <Route path="/hotels"       element={<HotelsListPage />} />
        <Route path="/blog"         element={<BlogListPage />} />
        <Route path="/blog/:slug"   element={<BlogDetailPage />} />

        {/* ── Fallback ────────────────────────────── */}
        <Route path="*"                          element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}