import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import type { PublicHotelListItem } from '../../services/publicApi';

interface Props {
  hotel: PublicHotelListItem;
  lang: 'ar' | 'en' | 'ms';
}

const FAV_KEY = 'mybridge.favoriteHotels';

function isFavorite(id: number): boolean {
  try {
    const list = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
    return Array.isArray(list) && list.includes(id);
  } catch {
    return false;
  }
}

function toggleFavorite(id: number): boolean {
  try {
    const list = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
    const arr = Array.isArray(list) ? list : [];
    const idx = arr.indexOf(id);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(id);
    localStorage.setItem(FAV_KEY, JSON.stringify(arr));
    return idx < 0;  // true if added
  } catch {
    return false;
  }
}

export function HotelCard({ hotel, lang }: Props) {
  const isRTL = lang === 'ar';
  const [fav, setFav] = useState(false);

  useEffect(() => { setFav(isFavorite(hotel.id)); }, [hotel.id]);

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFav(toggleFavorite(hotel.id));
  };


  return (
    <Link
      to={`/hotels/${hotel.id}`}
      className="group block"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Image (Airbnb-style: rounded square, big) */}
      <div className="relative aspect-square rounded-2xl bg-gray-100 overflow-hidden">
        {hotel.image ? (
          <img
            src={hotel.image}
            alt={hotel.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">
            🏨
          </div>
        )}

        {/* Favorite heart button (top right) */}
        <button
          onClick={handleFav}
          className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} w-9 h-9 rounded-full flex items-center justify-center transition-all
            ${fav ? 'bg-white' : 'bg-black/20 hover:bg-black/30 backdrop-blur-sm'}`}
          aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`w-4 h-4 ${fav ? 'fill-rose-500 text-rose-500' : 'text-white'}`}
            strokeWidth={2}
          />
        </button>
      </div>

      {/* Content (clean Airbnb style — no card border, transparent bg) */}
      <div className="pt-3 px-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-[15px] line-clamp-1 group-hover:underline">
            {hotel.name}
          </h3>
          <div className="flex items-center gap-1 shrink-0 text-sm">
            <Star className="w-4 h-4 fill-gray-900 text-gray-900" />
            <span className="font-medium text-gray-900">{hotel.stars}.0</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
          {hotel.city_name}{hotel.country_name ? `, ${hotel.country_name}` : ''}
        </p>
      </div>
    </Link>
  );
}
