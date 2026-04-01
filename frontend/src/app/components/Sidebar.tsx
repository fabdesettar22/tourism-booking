import { LayoutDashboard, Calendar, Building2, Users, Package, MapPin, Hotel, Briefcase, DollarSign, BarChart3, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'bookings', label: 'إدارة الحجوزات', icon: Calendar },
    { id: 'destinations', label: 'الوجهات السياحية', icon: MapPin },
    { id: 'agencies', label: 'الوكالات الشريكة', icon: Building2 },
    { id: 'customers', label: 'قاعدة العملاء', icon: Users },
    { id: 'packages', label: 'الباقات السياحية', icon: Package },
    { id: 'hotels', label: 'الفنادق', icon: Hotel },
    { id: 'services', label: 'الخدمات', icon: Briefcase },
    { id: 'financial', label: 'التقارير المالية', icon: DollarSign },
    { id: 'analytics', label: 'التحليلات والتقارير', icon: BarChart3 },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border h-full flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-sidebar-foreground">وكالة السفر</h1>
        <p className="text-sm text-sidebar-foreground/60 mt-1">لوحة الإدارة</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-right ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground">
            أ
          </div>
          <div className="flex-1">
            <p className="text-sm text-sidebar-foreground">أحمد محمد</p>
            <p className="text-xs text-sidebar-foreground/60">مدير النظام</p>
          </div>
        </div>
      </div>
    </div>
  );
}
