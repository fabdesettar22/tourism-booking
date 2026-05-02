import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, ArrowLeft, ArrowRight, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { fetchPublicHotelById, type PublicHotelDetail } from '../../services/publicApi';

export function HotelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang, isRTL } = useLanguage();

  const [hotel, setHotel] = useState<PublicHotelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchPublicHotelById(id)
      .then(setHotel)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  // Photos: prefer .photos[], fallback to single .image
  const photos = hotel
    ? (hotel.photos.length > 0
        ? hotel.photos.filter(p => p.image).map(p => ({ url: p.image!, caption: p.caption }))
        : hotel.image ? [{ url: hotel.image, caption: '' }] : [])
    : [];

  const closeLightbox = () => setLightboxIdx(null);
  const prevPhoto = () => setLightboxIdx(i => (i === null ? null : (i - 1 + photos.length) % photos.length));
  const nextPhoto = () => setLightboxIdx(i => (i === null ? null : (i + 1) % photos.length));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35]" />
    </div>
  );

  if (error || !hotel) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        {lang === 'ar' ? 'الفندق غير موجود' : lang === 'ms' ? 'Hotel tidak dijumpai' : 'Hotel not found'}
      </h1>
      <p className="text-gray-500 mb-6">
        {lang === 'ar' ? 'الرابط الذي اتبعته قد يكون غير صحيح أو الفندق لم يعد متاحاً.' : 'This hotel may not exist or is no longer available.'}
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-2.5 bg-[#FF6B35] text-white rounded-xl hover:bg-[#e07a38] transition-colors"
      >
        {lang === 'ar' ? 'العودة للرئيسية' : lang === 'ms' ? 'Pulang ke Laman Utama' : 'Back to Home'}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Back button */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-[#FF6B35] transition-colors text-sm"
        >
          {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {lang === 'ar' ? 'رجوع' : lang === 'ms' ? 'Kembali' : 'Back'}
        </button>
      </div>

      {/* Gallery */}
      <div className="max-w-6xl mx-auto px-4 mt-4">
        {photos.length > 0 ? (
          <div className="grid grid-cols-4 gap-2 rounded-3xl overflow-hidden h-[400px]">
            {/* Main photo */}
            <button
              onClick={() => setLightboxIdx(0)}
              className="col-span-4 sm:col-span-2 row-span-2 relative bg-gray-200 overflow-hidden group"
            >
              <img src={photos[0].url} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </button>

            {/* Thumbnails */}
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
            🏨
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-10">
          {/* Header */}
          <div className="flex flex-wrap items-start gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{hotel.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-gray-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{hotel.city_name}{hotel.country_name ? `, ${hotel.country_name}` : ''}</span>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: hotel.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              {hotel.address && (
                <p className="text-sm text-gray-500 mt-2">{hotel.address}</p>
              )}
            </div>
          </div>

          {/* Description */}
          {hotel.description && (
            <div className="border-t border-gray-100 pt-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {lang === 'ar' ? 'عن الفندق' : lang === 'ms' ? 'Mengenai Hotel' : 'About this hotel'}
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {hotel.description}
              </p>
            </div>
          )}

          {/* Amenities */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="border-t border-gray-100 pt-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {lang === 'ar' ? 'المرافق' : lang === 'ms' ? 'Kemudahan' : 'Amenities'}
              </h2>
              <div className="flex flex-wrap gap-2">
                {hotel.amenities.map((a, i) => (
                  <span key={i} className="px-3 py-1.5 bg-orange-50 text-[#FF6B35] rounded-full text-sm font-medium">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Check-in/out */}
          {(hotel.check_in_time || hotel.check_out_time) && (
            <div className="border-t border-gray-100 pt-6 grid grid-cols-2 gap-4">
              {hotel.check_in_time && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {lang === 'ar' ? 'وقت الدخول' : lang === 'ms' ? 'Daftar Masuk' : 'Check-in'}
                  </p>
                  <p className="font-semibold text-gray-900">{hotel.check_in_time}</p>
                </div>
              )}
              {hotel.check_out_time && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {lang === 'ar' ? 'وقت المغادرة' : lang === 'ms' ? 'Daftar Keluar' : 'Check-out'}
                  </p>
                  <p className="font-semibold text-gray-900">{hotel.check_out_time}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && photos[lightboxIdx] && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                className="absolute left-4 text-white p-3 hover:bg-white/10 rounded-full"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                className="absolute right-4 text-white p-3 hover:bg-white/10 rounded-full"
              >
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

export default HotelDetailPage;
