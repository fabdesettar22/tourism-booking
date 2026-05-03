// frontend/src/components/layout/Header.tsx

import { Search, Bell, Mail, LogOut, ChevronDown, User, Shield, Building2, CheckCheck, Settings } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { apiFetch, BASE } from '../../services/apiFetch';
import { useLanguage } from '../../hooks/useLanguage';
import { LANGUAGES, type Language } from '../../i18n/index';
import type { AuthUser } from '../../services/authService';

interface Props {
  user?: AuthUser | null;
  onLogout?: () => void;
  onNavigate?: (tab: string) => void;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  link: string;
  created_at: string;
}

const ROLE_STYLE: Record<string, { color: string; icon: React.ReactNode }> = {
  super_admin: { color: 'bg-purple-100 text-purple-700',   icon: <Shield className="w-3 h-3" /> },
  admin:       { color: 'bg-blue-100 text-blue-700',       icon: <Shield className="w-3 h-3" /> },
  agency:      { color: 'bg-emerald-100 text-emerald-700', icon: <Building2 className="w-3 h-3" /> },
  tourist:     { color: 'bg-gray-100 text-gray-700',       icon: <User className="w-3 h-3" /> },
};

const NOTIF_ICONS: Record<string, string> = {
  new_booking:     '📋',
  booking_status:  '🔄',
  new_agency:      '🏢',
  agency_approved: '✅',
  agency_rejected: '❌',
};

export function Header({ user, onLogout, onNavigate }: Props) {
  const { t, lang, changeLang, isRTL } = useLanguage();
  const [showMenu, setShowMenu]           = useState(false);
  const [showNotif, setShowNotif]         = useState(false);
  const [showLang, setShowLang]           = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loadingNotif, setLoadingNotif]   = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef<number>(0);
  const [toast, setToast]                 = useState<{ title: string; message: string } | null>(null);

  // ── Time ago using current language ──
  const timeAgo = (dateStr: string): string => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60)    return t('header.timeAgo.now');
    if (diff < 3600)  return t('header.timeAgo.minute').replace('{n}', String(Math.floor(diff / 60)));
    if (diff < 86400) return t('header.timeAgo.hour').replace('{n}', String(Math.floor(diff / 3600)));
    return t('header.timeAgo.day').replace('{n}', String(Math.floor(diff / 86400)));
  };

  const roleStyle = user ? (ROLE_STYLE[user.role] ?? ROLE_STYLE.tourist) : null;
  const roleLabel = user ? t(`header.roles.${user.role}`) || user.role : '';
  const fullName  = user ? `${user.first_name} ${user.last_name}`.trim() || user.username : '';
  const initials  = fullName
    ? fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const avatarSrc = user?.avatar
    ? (user.avatar.startsWith('http') ? user.avatar : `${BASE}${user.avatar}`)
    : null;

  // ── Polling كل 15 ثانية + Toast عند إشعار جديد ───────
  useEffect(() => {
    if (!user) return;
    let isFirstRun = true;
    const fetchUnread = async () => {
      try {
        const res = await apiFetch('/api/v1/notifications/unread-count/');
        if (!res.ok) return;
        const data = await res.json();
        const newCount = data.count;
        if (!isFirstRun && newCount > prevUnreadRef.current) {
          try {
            const latestRes = await apiFetch('/api/v1/notifications/');
            if (latestRes.ok) {
              const list = await latestRes.json();
              const newest = Array.isArray(list) ? list[0] : (list.results?.[0] ?? null);
              if (newest && !newest.is_read) {
                setToast({ title: newest.title, message: newest.message });
                setTimeout(() => setToast(null), 5000);
              }
            }
          } catch {}
        }
        prevUnreadRef.current = newCount;
        setUnreadCount(newCount);
        isFirstRun = false;
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const openNotifications = async () => {
    setShowNotif(!showNotif);
    setShowMenu(false);
    setShowLang(false);
    if (!showNotif) {
      setLoadingNotif(true);
      try {
        const res = await apiFetch('/api/v1/notifications/');
        if (res.ok) setNotifications(await res.json());
      } catch {}
      finally { setLoadingNotif(false); }
    }
  };

  const markRead = async (id: number) => {
    await apiFetch(`/api/v1/notifications/${id}/mark-read/`, { method: 'POST' });
    setNotifications(p => p.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(p => Math.max(0, p - 1));
  };

  const markAllRead = async () => {
    await apiFetch('/api/v1/notifications/mark-all-read/', { method: 'POST' });
    setNotifications(p => p.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const tabFromLink = (link: string): string | null => {
    if (!link) return null;
    try {
      const u = new URL(link, window.location.origin);
      const tabParam = u.searchParams.get('tab');
      if (tabParam) return tabParam;
      const seg = u.pathname.replace(/^\/+|\/+$/g, '').split('/')[0];
      return seg || null;
    } catch {
      return null;
    }
  };

  const onNotifClick = (n: Notification) => {
    if (!n.is_read) markRead(n.id);
    const tab = tabFromLink(n.link);
    if (tab && onNavigate) {
      onNavigate(tab);
      setShowNotif(false);
    }
  };

  const currentLangObj = LANGUAGES.find(l => l.code === lang);
  // Side classes depending on RTL
  const dropdownSide  = isRTL ? 'left-0' : 'right-0';
  const searchIconSide = isRTL ? 'right-3' : 'left-3';
  const searchPad      = isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4';

  return (
    <header className="h-16 border-b border-border bg-card px-4 md:px-6 flex items-center justify-between relative z-30">

      {/* Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="w-10 lg:hidden shrink-0" />
        <div className="relative flex-1">
          <Search className={`absolute ${searchIconSide} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
          <input
            type="text"
            placeholder={t('header.searchPlaceholder')}
            className={`w-full h-10 ${searchPad} bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm`}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 md:gap-2">

        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => { setShowLang(!showLang); setShowMenu(false); setShowNotif(false); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-accent transition-colors"
            title={currentLangObj?.label}
          >
            <span className="text-base leading-none">{currentLangObj?.flag}</span>
            <span className="text-xs font-medium text-foreground hidden md:inline">
              {currentLangObj?.label}
            </span>
            <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${showLang ? 'rotate-180' : ''}`} />
          </button>

          {showLang && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowLang(false)} />
              <div className={`absolute ${dropdownSide} top-full mt-2 w-44 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50 py-1`}>
                {LANGUAGES.map(L => (
                  <button
                    key={L.code}
                    onClick={() => { changeLang(L.code as Language); setShowLang(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      lang === L.code ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-base">{L.flag}</span>
                    <span className="flex-1 text-start">{L.label}</span>
                    {lang === L.code && (
                      <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Mail */}
        <button className="relative p-2 hover:bg-accent rounded-lg transition-colors">
          <Mail className="w-5 h-5 text-foreground" />
        </button>

        {/* Bell + Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={openNotifications}
            className="relative p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-blue-600' : 'text-foreground'}`} />
            {unreadCount > 0 && (
              <span className={`absolute -top-0.5 ${isRTL ? '-right-0.5' : '-left-0.5'} min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1`}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <>
              <div className="fixed inset-0" onClick={() => setShowNotif(false)} />
              <div className={`absolute ${dropdownSide} top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50`} dir={isRTL ? 'rtl' : 'ltr'}>

                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-sm">{t('header.notifications')}</h3>
                    {unreadCount > 0 && (
                      <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {t('header.newCount').replace('{n}', String(unreadCount))}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> {t('header.markAllRead')}
                    </button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {loadingNotif ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                      <Bell className="w-10 h-10 mb-2 text-gray-200" />
                      <p className="text-sm">{t('header.noNotifications')}</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={(e) => { e.stopPropagation(); onNotifClick(n); }}
                        className={`flex items-start gap-3 px-4 py-3 border-b last:border-0 cursor-pointer transition-colors
                          ${n.is_read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'}`}
                      >
                        <span className="text-xl shrink-0 mt-0.5">{NOTIF_ICONS[n.type] || '🔔'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium leading-snug ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                              {n.title}
                            </p>
                            {!n.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t bg-gray-50 text-center">
                    <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                      {t('header.viewAll')}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        {user && <div className="w-px h-6 bg-border mx-1" />}

        {/* User Menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => { setShowMenu(!showMenu); setShowNotif(false); setShowLang(false); }}
              className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-xl hover:bg-accent transition-colors"
            >
              {avatarSrc ? (
                <img src={avatarSrc} className="w-8 h-8 rounded-full object-cover border-2 border-border shrink-0" alt={fullName} />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {initials}
                </div>
              )}

              <div className={`${isRTL ? 'text-right' : 'text-left'} hidden md:block`}>
                <p className="text-sm font-semibold text-foreground leading-none mb-0.5">{fullName}</p>
                <div className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${roleStyle?.color}`}>
                  {roleStyle?.icon}
                  {roleLabel}
                </div>
              </div>

              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform hidden md:block ${showMenu ? 'rotate-180' : ''}`} />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0" onClick={() => setShowMenu(false)} />
                <div className={`absolute ${dropdownSide} top-full mt-2 w-56 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50`} dir={isRTL ? 'rtl' : 'ltr'}>

                  <div className="px-4 py-3 border-b border-border bg-accent/30">
                    <div className="flex items-center gap-3">
                      {avatarSrc ? (
                        <img src={avatarSrc} className="w-10 h-10 rounded-full object-cover border shrink-0" alt={fullName} />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.email || user.username}</p>
                        {user.agency_name && (
                          <p className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {user.agency_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { setShowMenu(false); onNavigate?.('settings'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors border-b border-border"
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    {t('header.profileSettings')}
                  </button>

                  {(user.role === 'super_admin' || user.role === 'admin') && (
                    <button
                      onClick={() => { setShowMenu(false); onNavigate?.('settings'); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors border-b border-border"
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      {t('header.systemSettings')}
                    </button>
                  )}

                  <button
                    onClick={() => { setShowMenu(false); onLogout?.(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('header.logout')}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-white border border-blue-200 rounded-2xl shadow-2xl p-4 w-80 max-w-[90vw] flex items-start gap-3 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => setToast(null)}
          style={{ animation: 'toast-in 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-xl">🔔</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{toast.title}</p>
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{toast.message}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setToast(null); }}
            className="text-gray-400 hover:text-gray-600 shrink-0 w-6 h-6 flex items-center justify-center text-lg"
            aria-label={t('header.close')}
          >
            ×
          </button>
        </div>
      )}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </header>
  );
}
