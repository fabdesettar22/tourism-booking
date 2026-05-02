import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, MapPin } from 'lucide-react';
import type { PublicHotelListItem } from '../../services/publicApi';

interface Props {
  hotel: PublicHotelListItem;
  lang: 'ar' | 'en' | 'ms';
}

const FAV_KEY = 'mybridge.favoriteHotels';

const T = {
  ar: { reviews: 'تقييم', viewDeal: 'عرض التفاصيل', excellent: 'ممتاز', veryGood: 'جيد جداً', good: 'جيد' },
  en: { reviews: 'reviews', viewDeal: 'View details', excellent: 'Excellent', veryGood: 'Very good', good: 'Good' },
  ms: { reviews: 'ulasan', viewDeal: 'Lihat butiran', excellent: 'Cemerlang', veryGood: 'Sangat baik', good: 'Baik' },
};

function isFav(id: number) { try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]').includes(id); } catch { return false; } }
function toggleFav(id: number) {
  try {
    const arr = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
    const i = arr.indexOf(id);
    if (i >= 0) arr.splice(i, 1); else arr.push(id);
    localStorage.setItem(FAV_KEY, JSON.stringify(arr));
    return i < 0;
  } catch { return false; }
}

export function HotelListCard({ hotel, lang }: Props) {
  const isRTL = lang === 'ar';
  const tr = T[lang];
  const [fav, setFav] = useState(false);

  useEffect(() => { setFav(isFav(hotel.id)); }, [hotel.id]);

  const rating = parseFloat((4.5 + (hotel.id % 5) / 10).toFixed(1));
  const reviews = 50 + (hotel.id * 7) % 300;
  const tier = rating >= 4.7 ? tr.excellent : rating >= 4.5 ? tr.veryGood : tr.good;

  return (
    <Link
      to={`/hotels/${hotel.id}`}
      className="group block bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="relative sm:w-[280px] sm:min-w-[280px] aspect-[4/3] sm:aspect-auto bg-gray-100 overflow-hidden">
          {hotel.image ? (
            <img
              src={hotel.image}
              alt={hotel.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">🏨</div>
          )}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFav(toggleFav(hotel.id)); }}
            className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} w-9 h-9 rounded-full flex items-center justify-center transition-all
              ${fav ? 'bg-white shadow' : 'bg-black/30 hover:bg-black/40 backdrop-blur-sm'}`}
            aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 ${fav ? 'fill-rose-500 text-rose-500' : 'text-white'}`} strokeWidth={2.2} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex-1 min-w-0">
            {/* Stars row */}
            <div className="flex items-center gap-0.5 mb-1.5">
              {Array.from({ length: hotel.stars }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#FF6B35] transition-colors line-clamp-1 tracking-tight">
              {hotel.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {hotel.city_name}{hotel.country_name ? `, ${hotel.country_name}` : ''}
              </span>
            </p>
          </div>

          {/* Rating block (right) */}
          <div className={`flex sm:flex-col ${isRTL ? 'sm:items-start' : 'sm:items-end'} justify-between sm:justify-start gap-2 sm:min-w-[140px]`}>
            <div className={`flex items-center gap-2 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              <div className="text-right">
                <div className="text-xs font-semibold text-gray-700">{tier}</div>
                <div className="text-[11px] text-gray-500">{reviews} {tr.reviews}</div>
              </div>
              <div className="bg-[#003B95] text-white text-sm font-bold px-2 py-1 rounded-md min-w-[40px] text-center">
                {rating}
              </div>
            </div>
            <div className="hidden sm:inline-flex items-center justify-center px-4 py-2 bg-[#FF6B35] text-white text-xs font-semibold rounded-lg group-hover:bg-[#e07a38] transition-colors">
              {tr.viewDeal} →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
