// frontend/src/components/layout/Sidebar.tsx
import {
  LayoutDashboard, Calendar, Building2, Users, Package,
  MapPin, Hotel, Briefcase, DollarSign, BarChart3, Settings,
  Globe, ChevronRight, Menu, X, UserPlus
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../services/apiFetch';
import type { AuthUser } from '../../services/authService';
import { usePendingCount } from '../../hooks/usePendingCount';
import { useLanguage } from '../../hooks/useLanguage';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: AuthUser | null;
  onLogout?: () => void;
}

// menu items use i18n key for the label instead of hardcoded text
const ADMIN_MENU = [
  { id: 'dashboard',     labelKey: 'dashboard',     icon: LayoutDashboard },
  { id: 'registrations', labelKey: 'registrations', icon: UserPlus },
  { id: 'bookings',      labelKey: 'bookings',      icon: Calendar },
  { id: 'packages',      labelKey: 'packages',      icon: Package },
  { id: 'destinations',  labelKey: 'destinations',  icon: MapPin },
  { id: 'hotels',        labelKey: 'hotels',        icon: Hotel },
  { id: 'extranet',      labelKey: 'extranet',      icon: Hotel },
  { id: 'services',      labelKey: 'services',      icon: Briefcase },
  { id: 'agencies',      labelKey: 'agencies',      icon: Building2 },
  { id: 'customers',     labelKey: 'customers',     icon: Users },
  { id: 'financial',     labelKey: 'financial',     icon: DollarSign },
  { id: 'analytics',     labelKey: 'analytics',     icon: BarChart3 },
  { id: 'settings',      labelKey: 'settings',      icon: Settings },
];

const AGENCY_MENU = [
  { id: 'dashboard',  labelKey: 'dashboard',  icon: LayoutDashboard },
  { id: 'bookings',   labelKey: 'bookings',   icon: Calendar },
  { id: 'packages',   labelKey: 'packages',   icon: Package },
  { id: 'customers',  labelKey: 'customers',  icon: Users },
  { id: 'financial',  labelKey: 'financial',  icon: DollarSign },
  { id: 'settings',   labelKey: 'settings',   icon: Settings },
];

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-500',
  admin:       'bg-blue-500',
  agency:      'bg-emerald-500',
  tourist:     'bg-gray-500',
};

export function Sidebar({ activeTab, setActiveTab, user, onLogout }: SidebarProps) {
  const { t, isRTL } = useLanguage();
  const [siteLogo, setSiteLogo]     = useState<string | null>(null);
  const [siteName, setSiteName]     = useState<string>('You Need Travel');
  const [hovered, setHovered]       = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { counts } = usePendingCount();

  useEffect(() => {
    apiFetch('/api/v1/site-settings/')
      .then(r => r.json())
      .then(d => {
        if (d.site_logo_url) setSiteLogo(d.site_logo_url);
        if (d.site_name)     setSiteName(d.site_name);
      })
      .catch(() => {});
  }, []);

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const isAdmin   = user?.role === 'super_admin' || user?.role === 'admin';
  const menuItems = isAdmin ? ADMIN_MENU : AGENCY_MENU;
  const menuKey   = isAdmin ? 'adminMenu' : 'agencyMenu';

  const expanded = hovered || mobileOpen;

  const handleMouseEnter = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimer.current = setTimeout(() => setHovered(false), 150);
  };

  // Side determined by language direction:
  //   RTL → sidebar on the right (border on the left)
  //   LTR → sidebar on the left  (border on the right)
  const sidePosition = isRTL ? 'right-0' : 'left-0';
  const borderSide   = isRTL ? 'border-l' : 'border-r';
  const mobileTransform = mobileOpen
    ? 'translate-x-0'
    : (isRTL ? 'translate-x-full' : '-translate-x-full');

  // ── Sidebar Content (shared) ─────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className={`border-b border-sidebar-border transition-all duration-300 ${expanded ? 'p-4' : 'p-3'}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="shrink-0">
            {!isAdmin && user?.agency_logo ? (
              <img
                src={user.agency_logo}
                alt={user.agency_name || 'logo'}
                className="w-9 h-9 rounded-xl object-cover border border-sidebar-border"
              />
            ) : isAdmin && siteLogo ? (
              <img
                src={siteLogo}
                alt={siteName}
                className="w-9 h-9 rounded-xl object-cover border border-sidebar-border"
              />
            ) : (
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'w-36 opacity-100' : 'w-0 opacity-0'}`}>
            <h1 className="text-sidebar-foreground text-sm font-bold leading-none truncate whitespace-nowrap">
              {!isAdmin && user?.agency_name ? user.agency_name : siteName}
            </h1>
            <p className="text-xs text-sidebar-foreground/60 mt-0.5 whitespace-nowrap">
              {isAdmin ? t('sidebar.panelAdmin') : t('sidebar.panelAgency')}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {menuItems.map(item => {
          const Icon       = item.icon;
          const isActive   = activeTab === item.id;
          const badgeCount = item.id === 'registrations' ? counts.total : 0;
          const itemLabel  = t(`sidebar.${menuKey}.${item.labelKey}`);
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              title={!expanded ? itemLabel : undefined}
              className={`relative w-full flex items-center transition-all duration-200 text-sm
                ${expanded ? 'gap-3 px-4 py-2.5' : 'justify-center px-0 py-2.5'}
                ${isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}
            >
              <div className="relative shrink-0">
                <Icon className={`transition-all duration-200 ${isActive ? 'w-[18px] h-[18px]' : 'w-4 h-4'}`} />
                {badgeCount > 0 && !expanded && (
                  <span className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} min-w-[14px] h-[14px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none`}>
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>
              <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                {itemLabel}
              </span>
              {badgeCount > 0 && expanded && (
                <span className={`${isRTL ? 'mr-auto' : 'ml-auto'} min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none shrink-0`}>
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
              {isActive && expanded && badgeCount === 0 && (
                <ChevronRight className={`w-3.5 h-3.5 ${isRTL ? 'mr-auto rotate-180' : 'ml-auto'} shrink-0 text-sidebar-accent-foreground/60`} />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className={`lg:hidden fixed top-4 ${isRTL ? 'right-4' : 'left-4'} z-50 p-2 bg-white border border-gray-200 rounded-xl shadow-lg`}
      >
        {mobileOpen
          ? <X className="w-5 h-5 text-gray-700" />
          : <Menu className="w-5 h-5 text-gray-700" />
        }
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`
        lg:hidden fixed top-0 ${sidePosition} h-full z-50 bg-sidebar ${borderSide} border-sidebar-border shadow-2xl
        transition-transform duration-300
        ${mobileTransform}
        w-64
      `}>
        <SidebarContent />
      </div>

      {/* Desktop Sidebar */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          hidden lg:flex flex-col
          bg-sidebar ${borderSide} border-sidebar-border h-full
          transition-all duration-300 ease-in-out
          overflow-hidden shrink-0
          ${hovered ? 'w-64' : 'w-[60px]'}
        `}
      >
        <SidebarContent />
      </div>
    </>
  );
}
