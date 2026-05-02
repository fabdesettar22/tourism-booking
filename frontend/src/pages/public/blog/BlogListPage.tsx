import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Search, Calendar, Clock, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { PublicNavbar } from '../../../components/layout/PublicNavbar';
import { blogApi, type BlogPostListItem, type BlogCategory, type BlogLang } from '../../../services/blogApi';

const T = {
  ar: { title: 'المدونة', subtitle: 'قصص ونصائح ودلائل من ماليزيا', home: 'الرئيسية', blog: 'المدونة',
        search: 'ابحث في المقالات...', allCategories: 'كل الفئات', empty: 'لا توجد مقالات',
        readTime: 'دقيقة قراءة', views: 'مشاهدة', prev: 'السابق', next: 'التالي', featured: 'مميز' },
  en: { title: 'The Journal', subtitle: 'Stories, tips, and guides from Malaysia', home: 'Home', blog: 'Blog',
        search: 'Search articles...', allCategories: 'All categories', empty: 'No articles yet',
        readTime: 'min read', views: 'views', prev: 'Prev', next: 'Next', featured: 'Featured' },
  ms: { title: 'Jurnal', subtitle: 'Kisah, tip dan panduan dari Malaysia', home: 'Utama', blog: 'Blog',
        search: 'Cari artikel...', allCategories: 'Semua kategori', empty: 'Tiada artikel lagi',
        readTime: 'min baca', views: 'tontonan', prev: 'Sebelum', next: 'Seterusnya', featured: 'Pilihan' },
};

function formatDate(iso: string | null, lang: BlogLang) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : lang === 'ms' ? 'ms-MY' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' });
}

function categoryName(c: BlogCategory | null, lang: BlogLang): string {
  if (!c) return '';
  return c[`name_${lang}`] || c.name_en;
}

export function BlogListPage() {
  const { lang, isRTL, changeLang, t } = useLanguage();
  const tr = T[lang];
  const ChevStart = isRTL ? ChevronRight : ChevronLeft;
  const ChevEnd = isRTL ? ChevronLeft : ChevronRight;

  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<string>('');
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const pageSize = 12;

  useEffect(() => { blogApi.categories().then(setCategories).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true);
    blogApi.list({
      lang,
      category: activeCat || undefined,
      search: search || undefined,
      page,
      page_size: pageSize,
    })
      .then(r => { setPosts(r.results); setCount(r.count); })
      .catch(() => { setPosts([]); setCount(0); })
      .finally(() => setLoading(false));
  }, [lang, activeCat, search, page]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const featured = useMemo(() => posts.find(p => p.is_featured), [posts]);
  const rest = useMemo(() => featured ? posts.filter(p => p.id !== featured.id) : posts, [posts, featured]);

  return (
    <div className="min-h-screen bg-[#FAF8F3]" dir={isRTL ? 'rtl' : 'ltr'}>
      <PublicNavbar lang={lang} onLangChange={changeLang} t={t} isRTL={isRTL} variant="solid" />

      {/* Hero */}
      <div className="relative pt-28 pb-16 bg-[#0F2742] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.08]"
             style={{ backgroundImage: "radial-gradient(circle at 30% 20%, #C9A961 0, transparent 60%)" }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-xs text-white/60 mb-4">
            <Link to="/" className="hover:text-white">{tr.home}</Link>
            <ChevEnd className="w-3.5 h-3.5" />
            <span className="text-white">{tr.blog}</span>
          </nav>
          <p className="text-[#C9A961] text-xs font-semibold uppercase tracking-[0.3em] mb-4">— Editorial</p>
          <h1 className="font-display text-5xl md:text-6xl font-medium text-white mb-3 tracking-tight">
            {tr.title}
          </h1>
          <p className="text-white/70 text-lg max-w-2xl">{tr.subtitle}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { setActiveCat(''); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                !activeCat ? 'bg-[#0F2742] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tr.allCategories}
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => { setActiveCat(c.slug); setPage(1); }}
                style={activeCat === c.slug ? { backgroundColor: c.color } : undefined}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                  activeCat === c.slug ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {categoryName(c, lang)}
              </button>
            ))}
          </div>
          <div className={`relative ${isRTL ? 'mr-auto' : 'ml-auto'} w-full sm:w-72`}>
            <Search className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3' : 'left-3'} w-4 h-4 text-gray-400`} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder={tr.search}
              className={`w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C9A961]`}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[16/10] bg-gray-200 rounded-2xl mb-4" />
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-3" />
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-full mb-1" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
            <div className="text-5xl mb-3">📰</div>
            <p className="text-gray-700">{tr.empty}</p>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured && page === 1 && (
              <Link to={`/blog/${featured.slug}`}
                    className="group block mb-12 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="aspect-[16/10] lg:aspect-auto bg-gray-100 overflow-hidden">
                  {featured.cover_image ? (
                    <img src={featured.cover_image} alt={featured.title}
                         className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : <div className="w-full h-full bg-gradient-to-br from-[#0F2742] to-[#163556]" />}
                </div>
                <div className="p-8 lg:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[#C9A961] text-[10px] font-bold uppercase tracking-[0.25em]">★ {tr.featured}</span>
                    {featured.category && (
                      <span style={{ color: featured.category.color }} className="text-xs font-semibold">
                        {categoryName(featured.category, lang)}
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-3xl md:text-4xl font-medium text-gray-900 mb-3 tracking-tight group-hover:text-[#0F2742]">
                    {featured.title}
                  </h2>
                  <p className="text-gray-600 mb-5 line-clamp-3">{featured.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(featured.published_at, lang)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {featured.read_time} {tr.readTime}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {featured.view_count}</span>
                  </div>
                </div>
              </Link>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {rest.map(post => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="group block">
                  <div className="aspect-[16/10] rounded-2xl bg-gray-100 overflow-hidden mb-5">
                    {post.cover_image ? (
                      <img src={post.cover_image} alt={post.title}
                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : <div className="w-full h-full bg-gradient-to-br from-[#0F2742] to-[#163556]" />}
                  </div>
                  {post.category && (
                    <p style={{ color: post.category.color }} className="text-[10px] font-bold uppercase tracking-[0.25em] mb-2">
                      {categoryName(post.category, lang)}
                    </p>
                  )}
                  <h3 className="font-display text-xl font-medium text-gray-900 mb-2 tracking-tight line-clamp-2 group-hover:text-[#0F2742]">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.excerpt}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{formatDate(post.published_at, lang)}</span>
                    <span>·</span>
                    <span>{post.read_time} {tr.readTime}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-16">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 disabled:opacity-40 hover:border-gray-300 disabled:hover:border-gray-200"
                >
                  <ChevStart className="w-4 h-4" /> {tr.prev}
                </button>
                <span className="px-4 text-sm text-gray-600">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 disabled:opacity-40 hover:border-gray-300 disabled:hover:border-gray-200"
                >
                  {tr.next} <ChevEnd className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
