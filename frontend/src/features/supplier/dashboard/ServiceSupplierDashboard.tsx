import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, MapPin, DollarSign, Loader2,
  CheckCircle2, AlertCircle, Image as ImageIcon, FileText, Tag,
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { fetchSupplierMe, type SupplierMeResponse } from '../../../services/supplierProfileApi';
import { clearAuth } from '../../../services/authService';

const SERVICE_TYPE_LABELS: Record<string, { ar: string; en: string; ms: string }> = {
  transport: { ar: 'نقل',     en: 'Transport',  ms: 'Pengangkutan' },
  meal:      { ar: 'مطعم',    en: 'Restaurant', ms: 'Restoran' },
  tour:      { ar: 'جولة',    en: 'Tour',       ms: 'Lawatan' },
  activity:  { ar: 'نشاط',    en: 'Activity',   ms: 'Aktiviti' },
  other:     { ar: 'خدمة أخرى', en: 'Other Service', ms: 'Perkhidmatan Lain' },
};

interface Props {
  onLogout?: () => void;
}

export function ServiceSupplierDashboard({ onLogout }: Props) {
  const { lang, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState<SupplierMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSupplierMe()
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'فشل التحميل'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    clearAuth();
    if (onLogout) onLogout();
    else navigate('/supplier');
    window.location.reload();
  };

  const T = {
    ar: {
      welcome:        'مرحباً',
      logout:         'تسجيل الخروج',
      overview:       'نظرة عامة',
      serviceInfo:    'معلومات الخدمة',
      status:         'الحالة',
      active:         'مُفعَّلة (تظهر للسائح)',
      inactive:       'بانتظار التفعيل من الإدارة',
      missingItems:   'البنود الناقصة:',
      type:           'النوع',
      city:           'المدينة',
      basePrice:      'السعر الأساسي',
      finalPrice:     'السعر النهائي للسائح',
      desc:           'الوصف',
      noDesc:         'لا يوجد وصف',
      photo:          'الصورة الرئيسية',
      noPhoto:        'لا توجد صورة',
      adminNote:      'تعديل الأسعار والصور والوصف ميزة قريبة',
    },
    en: {
      welcome:      'Welcome',
      logout:       'Sign Out',
      overview:     'Overview',
      serviceInfo:  'Service Information',
      status:       'Status',
      active:       'Active (visible to tourists)',
      inactive:     'Awaiting admin activation',
      missingItems: 'Missing items:',
      type:         'Type',
      city:         'City',
      basePrice:    'Base Price',
      finalPrice:   'Final Tourist Price',
      desc:         'Description',
      noDesc:       'No description',
      photo:        'Primary Photo',
      noPhoto:      'No photo',
      adminNote:    'Editing prices/photos/description coming soon',
    },
    ms: {
      welcome:      'Selamat datang',
      logout:       'Log Keluar',
      overview:     'Tinjauan',
      serviceInfo:  'Maklumat Perkhidmatan',
      status:       'Status',
      active:       'Aktif (boleh dilihat oleh pelancong)',
      inactive:     'Menunggu pengaktifan oleh admin',
      missingItems: 'Bahagian yang hilang:',
      type:         'Jenis',
      city:         'Bandar',
      basePrice:    'Harga Asas',
      finalPrice:   'Harga Akhir Pelancong',
      desc:         'Penerangan',
      noDesc:       'Tiada penerangan',
      photo:        'Gambar Utama',
      noPhoto:      'Tiada gambar',
      adminNote:    'Penyuntingan harga/gambar/penerangan akan datang',
    },
  }[lang];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35]" />
    </div>
  );

  if (error || !data || !data.linked || data.linked.kind !== 'service') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-700">{error || 'لا توجد خدمة مرتبطة بحسابك'}</p>
        <button onClick={handleLogout} className="mt-6 px-6 py-2 bg-gray-100 rounded-xl">
          {T.logout}
        </button>
      </div>
    </div>
  );

  const service = data.linked.data;
  const typeLabel = SERVICE_TYPE_LABELS[service.service_type]?.[lang] || service.service_type;

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">{T.welcome}</p>
            <h1 className="text-lg font-bold text-gray-900">
              {data.user.first_name || data.supplier.company_name}
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{T.logout}</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Status banner */}
        <div className={`rounded-3xl p-6 ${
          service.is_active
            ? 'bg-emerald-50 border border-emerald-200'
            : 'bg-amber-50 border border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            {service.is_active ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            ) : (
              <AlertCircle className="w-7 h-7 text-amber-600" />
            )}
            <div className="flex-1">
              <p className={`font-bold ${service.is_active ? 'text-emerald-800' : 'text-amber-800'}`}>
                {service.is_active ? T.active : T.inactive}
              </p>
              {!service.is_active && service.missing_for_activation?.length > 0 && (
                <p className="text-xs text-amber-700 mt-1">
                  {T.missingItems} {service.missing_for_activation.join('، ')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Service overview */}
        <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">{T.serviceInfo}</h2>

          {/* Header with image */}
          <div className="flex flex-col sm:flex-row gap-6 mb-6 pb-6 border-b border-gray-100">
            <div className="w-full sm:w-48 aspect-[4/3] rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0">
              {service.image ? (
                <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <ImageIcon className="w-12 h-12" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <span className="inline-block px-3 py-1 bg-orange-100 text-[#FF6B35] rounded-full text-xs font-semibold mb-2">
                <Tag className="w-3 h-3 inline-block mr-1" />
                {typeLabel}
              </span>
              <h3 className="text-2xl font-bold text-gray-900">{service.name}</h3>
              {service.city_name && (
                <p className="flex items-center gap-1.5 mt-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {service.city_name}
                </p>
              )}
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {service.base_price && (
              <div>
                <p className="text-xs text-gray-500 mb-1">{T.basePrice}</p>
                <p className="text-lg font-bold text-gray-900">
                  {service.base_price} {service.currency}
                </p>
              </div>
            )}
            {service.final_price !== null && (
              <div>
                <p className="text-xs text-gray-500 mb-1">{T.finalPrice}</p>
                <p className="text-lg font-bold text-[#FF6B35]">
                  {service.final_price} {service.currency}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {T.desc}
            </p>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {service.description || T.noDesc}
            </p>
          </div>
        </div>

        {/* Coming soon note */}
        <p className="text-xs text-gray-400 text-center">
          ℹ️ {T.adminNote}
        </p>
      </main>
    </div>
  );
}

export default ServiceSupplierDashboard;
