import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Eye, Copy, FileText, CheckCircle2, Clock, Search, Globe } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import {
  blogApi, type BlogPostListItem, type BlogStats, type BlogCategory, type BlogStatus, type BlogLang,
} from '../../services/blogApi';

interface Props {
  onNew: () => void;
  onEdit: (id: string) => void;
}

const STATUS_BADGE: Record<BlogStatus, string> = {
  draft:     'bg-gray-100 text-gray-700',
  published: 'bg-green-100 text-green-700',
  scheduled: 'bg-amber-100 text-amber-700',
};

const T = {
  ar: { title: 'إدارة المدونة', subtitle: 'إنشاء، تعديل ونشر مقالات المدونة',
        new: 'مقال جديد', search: 'بحث...', total: 'إجمالي', published: 'منشورة', drafts: 'مسودات', scheduled: 'مجدولة', views: 'مشاهدات',
        all: 'الكل', allCats: 'كل الفئات', allLangs: 'كل اللغات',
        col: { title: 'العنوان', lang: 'اللغة', cat: 'الفئة', status: 'الحالة', author: 'الكاتب', date: 'التاريخ', views: 'المشاهدات', actions: 'إجراءات' },
        publish: 'نشر', unpublish: 'إلغاء النشر', edit: 'تعديل', duplicate: 'نسخ', delete: 'حذف',
        confirmDel: 'حذف هذا المقال؟', empty: 'لا توجد مقالات' },
  en: { title: 'Blog Management', subtitle: 'Create, edit and publish blog posts',
        new: 'New Post', search: 'Search...', total: 'Total', published: 'Published', drafts: 'Drafts', scheduled: 'Scheduled', views: 'Views',
        all: 'All', allCats: 'All categories', allLangs: 'All languages',
        col: { title: 'Title', lang: 'Lang', cat: 'Category', status: 'Status', author: 'Author', date: 'Date', views: 'Views', actions: 'Actions' },
        publish: 'Publish', unpublish: 'Unpublish', edit: 'Edit', duplicate: 'Duplicate', delete: 'Delete',
        confirmDel: 'Delete this post?', empty: 'No posts yet' },
  ms: { title: 'Pengurusan Blog', subtitle: 'Cipta, sunting & terbitkan artikel',
        new: 'Artikel Baharu', search: 'Cari...', total: 'Jumlah', published: 'Diterbitkan', drafts: 'Draf', scheduled: 'Dijadual', views: 'Tontonan',
        all: 'Semua', allCats: 'Semua kategori', allLangs: 'Semua bahasa',
        col: { title: 'Tajuk', lang: 'Bhs', cat: 'Kategori', status: 'Status', author: 'Penulis', date: 'Tarikh', views: 'Tontonan', actions: 'Tindakan' },
        publish: 'Terbit', unpublish: 'Nyahterbit', edit: 'Sunting', duplicate: 'Salin', delete: 'Padam',
        confirmDel: 'Padam artikel ini?', empty: 'Tiada artikel' },
};

export function BlogManagement({ onNew, onEdit }: Props) {
  const { lang, isRTL } = useLanguage();
  const tr = T[lang];

  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BlogStatus | ''>('');
  const [langFilter, setLangFilter] = useState<BlogLang | ''>('');
  const [catFilter, setCatFilter] = useState<string>('');

  const load = () => {
    setLoading(true);
    Promise.all([
      blogApi.adminList({
        status: statusFilter || undefined,
        language: langFilter || undefined,
        category: catFilter || undefined,
        search: search || undefined,
        page_size: 50,
      }),
      blogApi.adminStats().catch(() => null),
    ]).then(([list, st]) => {
      setPosts(list.results);
      setStats(st);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { blogApi.adminCategoriesList().then(setCategories).catch(() => {}); }, []);
  useEffect(() => { load(); }, [statusFilter, langFilter, catFilter, search]);

  const togglePublish = async (p: BlogPostListItem) => {
    if (p.status === 'published') await blogApi.adminUnpublish(p.id);
    else await blogApi.adminPublish(p.id);
    load();
  };

  const duplicate = async (id: string) => { await blogApi.adminDuplicate(id); load(); };
  const remove = async (id: string) => {
    if (!confirm(tr.confirmDel)) return;
    await blogApi.adminDelete(id);
    load();
  };

  const fmt = (iso: string | null) => iso ? new Date(iso).toLocaleDateString() : '—';

  return (
    <div className="p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-gray-900 tracking-tight">{tr.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{tr.subtitle}</p>
        </div>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B35] text-white rounded-xl font-semibold text-sm hover:bg-[#e07a38] transition-colors"
        >
          <Plus className="w-4 h-4" /> {tr.new}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { icon: FileText, label: tr.total, val: stats.total, color: '#0F2742' },
            { icon: CheckCircle2, label: tr.published, val: stats.published, color: '#0E7C3A' },
            { icon: Edit2, label: tr.drafts, val: stats.drafts, color: '#6B7280' },
            { icon: Clock, label: tr.scheduled, val: stats.scheduled, color: '#D97706' },
            { icon: Eye, label: tr.views, val: stats.total_views, color: '#C9A961' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-2">
                <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} /> {s.label}
              </div>
              <div className="font-display text-3xl font-medium" style={{ color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3' : 'left-3'} w-4 h-4 text-gray-400`} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tr.search}
                 className={`w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0F2742]`} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white">
          <option value="">{tr.all} — Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
        </select>
        <select value={langFilter} onChange={e => setLangFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white">
          <option value="">{tr.allLangs}</option>
          <option value="ar">العربية</option>
          <option value="en">English</option>
          <option value="ms">Bahasa Melayu</option>
        </select>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white">
          <option value="">{tr.allCats}</option>
          {categories.map(c => <option key={c.id} value={c.slug}>{c.name_en}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">{tr.empty}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">{tr.col.title}</th>
                  <th className="px-4 py-3">{tr.col.lang}</th>
                  <th className="px-4 py-3">{tr.col.cat}</th>
                  <th className="px-4 py-3">{tr.col.status}</th>
                  <th className="px-4 py-3">{tr.col.author}</th>
                  <th className="px-4 py-3">{tr.col.date}</th>
                  <th className="px-4 py-3">{tr.col.views}</th>
                  <th className="px-4 py-3 text-right">{tr.col.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 line-clamp-1">{p.title}</div>
                      <div className="text-xs text-gray-500 line-clamp-1">{p.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-700 uppercase font-semibold">
                        <Globe className="w-3 h-3" /> {p.language}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.category ? (
                        <span style={{ color: p.category.color }} className="text-xs font-semibold">
                          {p.category.name_en}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_BADGE[p.status]}`}>
                        {p.status}
                      </span>
                      {p.is_featured && <span className="ml-2 text-[#C9A961] text-xs">★</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{p.author.full_name}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{fmt(p.published_at)}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{p.view_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onEdit(p.id)} title={tr.edit}
                                className="p-1.5 text-gray-500 hover:text-[#0F2742] hover:bg-gray-100 rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => togglePublish(p)} title={p.status === 'published' ? tr.unpublish : tr.publish}
                                className="p-1.5 text-gray-500 hover:text-green-700 hover:bg-green-50 rounded">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => duplicate(p.id)} title={tr.duplicate}
                                className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={() => remove(p.id)} title={tr.delete}
                                className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
