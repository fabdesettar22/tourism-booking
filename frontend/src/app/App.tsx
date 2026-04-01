import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardContent } from './components/DashboardContent';
import { BookingsManagement } from './components/BookingsManagement';
import { AgenciesManagement } from './components/AgenciesManagement';
import { CustomersManagement } from './components/CustomersManagement';
import { PackagesManagement } from './components/PackagesManagement';
import { DestinationsManagement } from './components/DestinationsManagement';
import { HotelsManagement } from './components/HotelsManagement';
import { ServicesManagement } from './components/ServicesManagement';
import { FinancialReports } from './components/FinancialReports';
import { AnalyticsReports } from './components/AnalyticsReports';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />;
      case 'bookings':
        return <BookingsManagement />;
      case 'agencies':
        return <AgenciesManagement />;
      case 'customers':
        return <CustomersManagement />;
      case 'packages':
        return <PackagesManagement />;
      case 'destinations':
        return <DestinationsManagement />;
      case 'hotels':
        return <HotelsManagement />;
      case 'services':
        return <ServicesManagement />;
      case 'financial':
        return <FinancialReports />;
      case 'analytics':
        return <AnalyticsReports />;
      case 'settings':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="mb-2">الإعدادات</h2>
              <p className="text-muted-foreground">
                هذا القسم قيد التطوير
              </p>
            </div>
          </div>
        );
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="size-full flex bg-background" dir="rtl">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}