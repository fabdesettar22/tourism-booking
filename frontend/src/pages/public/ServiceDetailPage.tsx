import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, ArrowRight, X, ChevronLeft, ChevronRight, Loader2, Clock, Users, Car } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { fetchPublicServiceById, type PublicServiceDetail } from '../../services/publicApi';

export function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang, isRTL, t } = useLanguage();

  const [service, setService] = useState<PublicServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchPublicServiceById(id)
      .then(setService)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const photos = service
    ? (service.photos.length > 0
        ? service.photos.filter(p => p.image).map(p => ({ url: p.image!, caption: p.caption }))
        : service.image ? [{ url: service.image, caption: '' }] : [])
    : [];

  const closeLightbox = () => setLightboxIdx(null);
  const prevPhoto = () => setLightboxIdx(i => (i === null ? null : (i - 1 + photos.length) % photos.length));
  const nextPhoto = () => setLightboxIdx(i => (i === null ? null : (i + 1) % photos.length));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35]" />
    </div>
  );

  if (error || !service) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        {t('serviceDetail.notFound')}
      </h1>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-2.5 bg-[#FF6B35] text-white rounded-xl mt-6 hover:bg-[#e07a38] transition-colors"
      >
        {t('serviceDetail.backHome')}
      </button>
    </div>
  );

  const typeLabel = t(`serviceDetail.types.${service.service_type}`) || service.service_type;
  const priceUnit = service.price_per ? t(`serviceDetail.pricePer.${service.price_per}`) : '';

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Back */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-[#FF6B35] transition-colors text-sm"
        >
          {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {t('serviceDetail.back')}
        </button>
      </div>

      {/* Gallery */}
      <div className="max-w-6xl mx-auto px-4 mt-4">
        {photos.length > 0 ? (
          <div className="grid grid-cols-4 gap-2 rounded-3xl overflow-hidden h-[400px]">
            <button
              onClick={() => setLightboxIdx(0)}
              className="col-span-4 sm:col-span-2 row-span-2 relative bg-gray-200 overflow-hidden group"
            >
              <img src={photos[0].url} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </button>
            {photos.slice(1, 5).map((p, i) => (
              <button
                key={i}
                onClick={() => setLightboxIdx(i + 1)}
                className="hidden sm:block relative bg-gray-200 overflow-hidden group"
              >
                <img src={p.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {i === 3 && photos.length > 5 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg">
                    +{photos.length - 5}
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="aspect-[16/9] bg-gray-100 rounded-3xl flex items-center justify-center text-gray-300 text-7xl">
            🎯
          </div>
        )}
      </div>

      {/* Content + Booking sidebar */}
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm p-6 sm:p-10">
          <span className="inline-block px-3 py-1 bg-orange-100 text-[#FF6B35] rounded-full text-xs font-semibold mb-3">
            {typeLabel}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{service.name}</h1>
          <div className="flex items-center gap-1.5 mt-3 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{service.city_name}{service.country_name ? `, ${service.country_name}` : ''}</span>
          </div>

          {service.description && (
            <div className="border-t border-gray-100 pt-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {t('serviceDetail.about')}
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{service.description}</p>
            </div>
          )}

          {/* Quick info */}
          <div className="border-t border-gray-100 pt-6 mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {service.duration_hours && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#FF6B35]" />
                <div>
                  <p className="text-xs text-gray-500">{t('serviceDetail.duration')}</p>
                  <p className="font-semibold text-gray-900">
                    {service.duration_hours} {t('serviceDetail.hour')}
                  </p>
                </div>
              </div>
            )}
            {service.max_participants > 0 && (
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#FF6B35]" />
                <div>
                  <p className="text-xs text-gray-500">{t('serviceDetail.max')}</p>
                  <p className="font-semibold text-gray-900">{service.max_participants}</p>
                </div>
              </div>
            )}
            {service.vehicle_type && (
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-[#FF6B35]" />
                <div>
                  <p className="text-xs text-gray-500">{t('serviceDetail.vehicle')}</p>
                  <p className="font-semibold text-gray-900">{service.vehicle_type}</p>
                </div>
              </div>
            )}
          </div>

          {/* Locations */}
          {(service.pickup_location || service.dropoff_location || service.meeting_point) && (
            <div className="border-t border-gray-100 pt-6 mt-6 space-y-3">
              {service.pickup_location && (
                <div>
                  <p className="text-xs text-gray-500">{t('serviceDetail.pickup')}</p>
                  <p className="font-medium text-gray-800">{service.pickup_location}</p>
                </div>
              )}
              {service.dropoff_location && (
                <div>
                  <p className="text-xs text-gray-500">{t('serviceDetail.dropoff')}</p>
                  <p className="font-medium text-gray-800">{service.dropoff_location}</p>
                </div>
              )}
              {service.meeting_point && (
                <div>
                  <p className="text-xs text-gray-500">{t('serviceDetail.meetingPoint')}</p>
                  <p className="font-medium text-gray-800">{service.meeting_point}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Price box */}
        <aside className="bg-white rounded-3xl shadow-sm p-6 h-fit lg:sticky lg:top-6">
          {service.final_price !== null && (
            <>
              <p className="text-xs text-gray-500 mb-1">
                {t('serviceDetail.price')}
              </p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-bold text-[#FF6B35]">
                  {Number(service.final_price).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 2 })}
                </span>
                <span className="text-sm text-gray-500 font-medium">{service.currency}</span>
              </div>
              <p className="text-sm text-gray-500 mb-6">{priceUnit}</p>
            </>
          )}
          <button
            disabled
            className="w-full py-3 bg-[#FF6B35] text-white rounded-xl font-semibold opacity-50 cursor-not-allowed"
            title={t('serviceDetail.bookingSoon')}
          >
            {t('serviceDetail.bookNow')}
          </button>
          <p className="text-xs text-gray-400 mt-3 text-center">
            {t('serviceDetail.bookingDev')}
          </p>
        </aside>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && photos[lightboxIdx] && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button onClick={closeLightbox} className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full">
            <X className="w-6 h-6" />
          </button>
          {photos.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prevPhoto(); }} className="absolute left-4 text-white p-3 hover:bg-white/10 rounded-full">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); nextPhoto(); }} className="absolute right-4 text-white p-3 hover:bg-white/10 rounded-full">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <img
            src={photos[lightboxIdx].url}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default ServiceDetailPage;
