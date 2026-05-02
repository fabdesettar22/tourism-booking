import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, Calendar, Clock, Eye, ArrowLeft, Star, MapPin } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { PublicNavbar } from '../../../components/layout/PublicNavbar';
import {
  blogApi, type BlogPostDetail, type BlogPostListItem, type BlogTranslation, type BlogLang,
} from '../../../services/blogApi';

const T = {
  ar: { back: 'العودة للمدونة', readTime: 'دقيقة قراءة', views: 'مشاهدة',
        relatedHotels: 'فنادق ذُكرت في المقال', relatedServices: 'خدمات ذُكرت في المقال',
        relatedPosts: 'مقالات قد تعجبك', bookNow: 'احجز الآن', readIn: 'اقرأ بـ', notFound: 'المقال غير موجود' },
  en: { back: 'Back to Blog', readTime: 'min read', views: 'views',
        relatedHotels: 'Hotels in this article', relatedServices: 'Services in this article',
        relatedPosts: 'You might also like', bookNow: 'Book now', readIn: 'Read in', notFound: 'Article not found' },
  ms: { back: 'Kembali', readTime: 'min baca', views: 'tontonan',
        relatedHotels: 'Hotel disebut', relatedServices: 'Perkhidmatan disebut',
        relatedPosts: 'Mungkin anda suka', bookNow: 'Tempah', readIn: 'Baca dalam', notFound: 'Tiada artikel' },
};

const LANG_LABEL: Record<BlogLang, string> = { ar: 'العربية', en: 'English', ms: 'Bahasa Melayu' };

function formatDate(iso: string | null, lang: BlogLang) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(
    lang === 'ar' ? 'ar-SA' : lang === 'ms' ? 'ms-MY' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' });
}

export function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { lang, isRTL, changeLang, t } = useLanguage();
  const tr = T[lang];

  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [related, setRelated] = useState<BlogPostListItem[]>([]);
  const [translations, setTranslations] = useState<BlogTranslation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    blogApi.get(slug)
      .then(p => {
        setPost(p);
        document.title = p.meta_title || p.title;
        const desc = document.querySelector('meta[name="description"]') ||
                     Object.assign(document.createElement('meta'), { name: 'description' });
        desc.setAttribute('content', p.meta_description || p.excerpt);
        document.head.appendChild(desc);
        // OG
        ['og:title', 'og:description', 'og:image', 'og:type'].forEach((prop) => {
          let m = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement | null;
          if (!m) { m = document.createElement('meta'); m.setAttribute('property', prop); document.head.appendChild(m); }
          const v = prop === 'og:title' ? p.title
                  : prop === 'og:description' ? (p.meta_description || p.excerpt)
                  : prop === 'og:image' ? (p.og_image || p.cover_image || '')
                  : 'article';
          m.setAttribute('content', v || '');
        });
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    blogApi.related(slug).then(setRelated).catch(() => setRelated([]));
    blogApi.translations(slug).then(setTranslations).catch(() => setTranslations([]));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A961]" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 mb-4">{tr.notFound}</p>
          <Link to="/blog" className="text-[#0F2742] underline">{tr.back}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3]" dir={isRTL ? 'rtl' : 'ltr'}>
      <PublicNavbar lang={lang} onLangChange={changeLang} t={t} isRTL={isRTL} variant="solid" />

      {/* Cover */}
      {post.cover_image && (
        <div className="relative pt-16 bg-[#0F2742]">
          <div className="aspect-[21/9] max-h-[520px] overflow-hidden">
            <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover opacity-80" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F2742] via-transparent to-transparent pointer-events-none" />
        </div>
      )}

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-12 mb-12">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0F2742] mb-6">
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} /> {tr.back}
          </Link>

          {post.category && (
            <p style={{ color: post.category.color }} className="text-[11px] font-bold uppercase tracking-[0.3em] mb-4">
              {post.category[`name_${lang}`] || post.category.name_en}
            </p>
          )}

          <h1 className="font-display text-3xl md:text-5xl font-medium text-gray-900 leading-tight tracking-tight mb-6">
            {post.title}
          </h1>

          {post.excerpt && <p className="text-lg text-gray-600 leading-relaxed mb-8 italic">{post.excerpt}</p>}

          <div className="flex flex-wrap items-center gap-5 text-xs text-gray-500 pb-6 border-b border-gray-100 mb-8">
            <span className="font-medium text-gray-900">{post.author.full_name}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(post.published_at, lang)}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.read_time} {tr.readTime}</span>
            <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {post.view_count} {tr.views}</span>
          </div>

          {/* Content */}
          <div
            className="blog-content prose prose-lg max-w-none prose-headings:font-display prose-headings:tracking-tight prose-headings:text-gray-900 prose-a:text-[#0F2742] prose-a:underline prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-gray-100">
              {post.tags.map(tg => (
                <span key={tg.id} className="px-3 py-1 bg-gray-100 text-xs text-gray-700 rounded-full">
                  #{tg[`name_${lang}`] || tg.name_en}
                </span>
              ))}
            </div>
          )}

          {/* Translations */}
          {translations.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">{tr.readIn}:</p>
              <div className="flex flex-wrap gap-2">
                {translations.map(tr => (
                  <Link key={tr.language} to={`/blog/${tr.slug}`}
                        className="px-3 py-1 bg-[#0F2742] text-white text-xs rounded-full hover:bg-[#163556]">
                    {LANG_LABEL[tr.language]}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Related Hotels */}
        {post.related_hotels.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display text-2xl font-medium text-gray-900 tracking-tight mb-5">{tr.relatedHotels}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {post.related_hotels.map(h => (
                <Link key={h.hotel_id} to={`/hotels/${h.hotel_id}`}
                      className="group flex gap-4 bg-white rounded-2xl border border-gray-100 p-3 hover:shadow-md transition-shadow">
                  <div className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                    {h.image ? <img src={h.image} alt={h.name} className="w-full h-full object-cover" />
                             : <div className="w-full h-full flex items-center justify-center text-2xl">🏨</div>}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-center gap-0.5 mb-1">
                      {Array.from({ length: h.stars }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 group-hover:text-[#0F2742]">{h.name}</h3>
                    {h.city_name && <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {h.city_name}</p>}
                    <span className="inline-block mt-2 text-[11px] font-bold text-[#FF6B35]">{tr.bookNow} →</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related Services */}
        {post.related_services.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display text-2xl font-medium text-gray-900 tracking-tight mb-5">{tr.relatedServices}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {post.related_services.map(s => (
                <Link key={s.service_id} to={`/services/${s.service_id}`}
                      className="group flex gap-4 bg-white rounded-2xl border border-gray-100 p-3 hover:shadow-md transition-shadow">
                  <div className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                    {s.image ? <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                             : <div className="w-full h-full flex items-center justify-center text-2xl">✨</div>}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <p className="text-[10px] font-semibold text-[#C9A961] uppercase tracking-wider mb-1">{s.service_type}</p>
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-[#0F2742]">{s.name}</h3>
                    <span className="inline-block mt-2 text-[11px] font-bold text-[#FF6B35]">{tr.bookNow} →</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related Posts */}
        {related.length > 0 && (
          <section className="mb-16">
            <h2 className="font-display text-2xl font-medium text-gray-900 tracking-tight mb-5">{tr.relatedPosts}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map(r => (
                <Link key={r.id} to={`/blog/${r.slug}`} className="group block">
                  <div className="aspect-[16/10] rounded-xl bg-gray-100 overflow-hidden mb-3">
                    {r.cover_image
                      ? <img src={r.cover_image} alt={r.title}
                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full bg-gradient-to-br from-[#0F2742] to-[#163556]" />}
                  </div>
                  <h3 className="font-display text-base font-medium text-gray-900 line-clamp-2 group-hover:text-[#0F2742] tracking-tight">
                    {r.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
