import { useEffect, useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { fetchTestimonials, type Testimonial } from '../../services/homepageConfig';
import type { Language } from '../../i18n';

interface Props {
  lang: Language;
  isRTL: boolean;
}

export function TestimonialsCarousel({ lang, isRTL }: Props) {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  // Auto-rotate
  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setIdx(p => (p + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length]);

  if (loading) return null;
  if (items.length === 0) return null;

  const T = {
    title:    lang === 'ar' ? 'يقولون عنّا'      : lang === 'ms' ? 'Apa Kata Mereka' : 'What Travelers Say',
    subtitle: lang === 'ar' ? 'تجارب حقيقية من عملاء حقيقيين' : lang === 'ms' ? 'Pengalaman sebenar dari pelanggan' : 'Real experiences from real customers',
  };

  const current = items[idx];
  const text = current.text[lang] || current.text.en || current.text.ar || '';

  const prev = () => setIdx(p => (p - 1 + items.length) % items.length);
  const next = () => setIdx(p => (p + 1) % items.length);

  return (
    <section className="bg-white py-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">{T.title}</h2>
          <p className="text-gray-500 mt-2">{T.subtitle}</p>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div className="bg-gradient-to-br from-orange-50 via-white to-amber-50 rounded-3xl p-8 sm:p-12 border border-gray-100 shadow-sm">
            {/* Quote icon */}
            <Quote className="w-10 h-10 text-[#FF6B35]/20 mb-4" />

            {/* Text */}
            <p className="text-lg sm:text-xl text-gray-800 leading-relaxed font-medium min-h-[100px]">
              "{text}"
            </p>

            {/* Author */}
            <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-100">
              {current.avatar_url ? (
                <img src={current.avatar_url} alt={current.name} className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#FF6B35] text-white flex items-center justify-center font-bold text-lg">
                  {current.name.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <p className="font-bold text-gray-900">{current.name}</p>
                <p className="text-sm text-gray-500">
                  {current.location}{current.country_code ? ` ${countryFlag(current.country_code)}` : ''}
                </p>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < current.rating ? 'fill-amber-500 text-amber-500' : 'text-gray-200'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Nav arrows (only if more than 1) */}
          {items.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute top-1/2 -translate-y-1/2 -start-4 sm:-start-6 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:scale-110 transition-transform"
              >
                {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
              <button
                onClick={next}
                className="absolute top-1/2 -translate-y-1/2 -end-4 sm:-end-6 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:scale-110 transition-transform"
              >
                {isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </>
          )}
        </div>

        {/* Dots */}
        {items.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-2 rounded-full transition-all ${i === idx ? 'bg-[#FF6B35] w-8' : 'bg-gray-300 w-2 hover:bg-gray-400'}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function countryFlag(iso: string): string {
  const code = iso.toUpperCase();
  if (code.length !== 2) return '';
  // Convert 2-letter code to flag emoji
  const offset = 0x1F1E6 - 65;
  return String.fromCodePoint(code.charCodeAt(0) + offset, code.charCodeAt(1) + offset);
}
