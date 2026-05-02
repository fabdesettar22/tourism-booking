import { useEffect, useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  ArrowLeft, Save, Send, Globe, Search, X, Plus, Star, Image as ImageIcon, Trash2, ChevronDown,
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import {
  blogApi, type BlogCategory, type BlogTag, type BlogLang,
  type BlogPostDetail, type BlogRelatedHotel, type BlogRelatedService,
} from '../../services/blogApi';

interface Props {
  postId?: string;       // when editing
  onBack: () => void;
}

const T = {
  ar: { back: 'رجوع', new: 'مقال جديد', edit: 'تعديل المقال', saveDraft: 'حفظ كمسودة', publish: 'نشر',
        unpublish: 'إلغاء النشر', settings: 'إعدادات المقال', titlePh: 'عنوان المقال...',
        excerptPh: 'مقتطف قصير (500 حرف)...', readTime: 'وقت القراءة', minutes: 'دقيقة',
        category: 'الفئة', tags: 'الوسوم', tagsPh: 'اكتب وسماً وضع Enter...', language: 'اللغة',
        cover: 'صورة الغلاف', uploadCover: 'رفع صورة', changeCover: 'تغيير', removeCover: 'إزالة',
        seo: 'تحسين محركات البحث', metaTitle: 'عنوان SEO (60 حرف)', metaDesc: 'وصف SEO (160 حرف)',
        relations: 'ربط بالمحتوى', hotels: 'فنادق مرتبطة', services: 'خدمات مرتبطة',
        searchHotel: 'ابحث عن فندق...', searchService: 'ابحث عن خدمة...',
        featured: 'مقال مميز', schedule: 'جدولة النشر', deletePost: 'حذف المقال',
        confirmDel: 'حذف نهائي؟', saved: '✓ تم الحفظ', noContent: '⚪ فارغ', hasContent: '✅ موجود' },
  en: { back: 'Back', new: 'New Post', edit: 'Edit Post', saveDraft: 'Save draft', publish: 'Publish',
        unpublish: 'Unpublish', settings: 'Post Settings', titlePh: 'Article title...',
        excerptPh: 'Short excerpt (500 chars)...', readTime: 'Read time', minutes: 'min',
        category: 'Category', tags: 'Tags', tagsPh: 'Type tag and press Enter...', language: 'Language',
        cover: 'Cover image', uploadCover: 'Upload', changeCover: 'Change', removeCover: 'Remove',
        seo: 'SEO', metaTitle: 'Meta title (60 chars)', metaDesc: 'Meta description (160 chars)',
        relations: 'Content links', hotels: 'Related hotels', services: 'Related services',
        searchHotel: 'Search hotel...', searchService: 'Search service...',
        featured: 'Featured post', schedule: 'Schedule publish', deletePost: 'Delete post',
        confirmDel: 'Delete permanently?', saved: '✓ Saved', noContent: '⚪ Empty', hasContent: '✅ Filled' },
  ms: { back: 'Kembali', new: 'Artikel baharu', edit: 'Sunting artikel', saveDraft: 'Simpan draf', publish: 'Terbit',
        unpublish: 'Nyahterbit', settings: 'Tetapan', titlePh: 'Tajuk...',
        excerptPh: 'Petikan ringkas (500 aksara)...', readTime: 'Masa baca', minutes: 'min',
        category: 'Kategori', tags: 'Tag', tagsPh: 'Taip tag dan Enter...', language: 'Bahasa',
        cover: 'Imej muka', uploadCover: 'Muat naik', changeCover: 'Tukar', removeCover: 'Buang',
        seo: 'SEO', metaTitle: 'Tajuk meta', metaDesc: 'Penerangan meta',
        relations: 'Pautan kandungan', hotels: 'Hotel berkaitan', services: 'Perkhidmatan berkaitan',
        searchHotel: 'Cari hotel...', searchService: 'Cari perkhidmatan...',
        featured: 'Artikel pilihan', schedule: 'Jadual', deletePost: 'Padam',
        confirmDel: 'Padam selamanya?', saved: '✓ Disimpan', noContent: '⚪ Kosong', hasContent: '✅ Lengkap' },
};

interface LangData { title: string; content: string; excerpt: string; postId?: string; }

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export function BlogEditor({ postId, onBack }: Props) {
  const { lang: uiLang, isRTL } = useLanguage();
  const tr = T[uiLang];

  // Editor language (what's being edited)
  const [editLang, setEditLang] = useState<BlogLang>('en');

  // Per-language data — for new post we keep all 3 in memory; for editing existing we load the one we edit
  const [data, setData] = useState<Record<BlogLang, LangData>>({
    ar: { title: '', content: '', excerpt: '' },
    en: { title: '', content: '', excerpt: '' },
    ms: { title: '', content: '', excerpt: '' },
  });

  // Settings (shared metadata for all languages of same translation_group)
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>('draft');
  const [translationGroup, setTranslationGroup] = useState<string | null>(null);

  // Lookups
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [allTags, setAllTags] = useState<BlogTag[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Related
  const [relatedHotels, setRelatedHotels] = useState<BlogRelatedHotel[]>([]);
  const [relatedServices, setRelatedServices] = useState<BlogRelatedService[]>([]);
  const [hotelQuery, setHotelQuery] = useState('');
  const [serviceQuery, setServiceQuery] = useState('');
  const [hotelResults, setHotelResults] = useState<any[]>([]);
  const [serviceResults, setServiceResults] = useState<any[]>([]);

  // UX
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const quillRef = useRef<ReactQuill>(null);

  const cur = data[editLang];

  // Load categories + tags
  useEffect(() => {
    blogApi.adminCategoriesList().then(setCategories).catch(() => {});
    blogApi.adminTagsList().then(setAllTags).catch(() => {});
  }, []);

  // Load existing post (single-language edit)
  useEffect(() => {
    if (!postId) return;
    blogApi.adminGet(postId).then((p: BlogPostDetail) => {
      setEditLang(p.language);
      setData(d => ({ ...d, [p.language]: { title: p.title, content: p.content, excerpt: p.excerpt, postId: p.id } }));
      setCategoryId(p.category?.id ?? null);
      setTagIds(p.tags.map(t => t.id));
      setCoverImageUrl(p.cover_image);
      setMetaTitle(p.meta_title);
      setMetaDesc(p.meta_description);
      setIsFeatured(p.is_featured);
      setScheduledAt(p.scheduled_at || '');
      setStatus(p.status as any);
      setTranslationGroup(p.translation_group);
      setRelatedHotels(p.related_hotels);
      setRelatedServices(p.related_services);
    }).catch(() => {});
  }, [postId]);

  // Hotel search
  useEffect(() => {
    if (!hotelQuery.trim()) { setHotelResults([]); return; }
    const ctrl = new AbortController();
    fetch(`${BASE}/api/v1/hotels/?search=${encodeURIComponent(hotelQuery)}`, {
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    })
      .then(r => r.ok ? r.json() : { results: [] })
      .then(d => setHotelResults((d.results || d || []).slice(0, 8)))
      .catch(() => {});
    return () => ctrl.abort();
  }, [hotelQuery]);

  // Service search
  useEffect(() => {
    if (!serviceQuery.trim()) { setServiceResults([]); return; }
    const ctrl = new AbortController();
    fetch(`${BASE}/api/v1/services/?search=${encodeURIComponent(serviceQuery)}`, {
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    })
      .then(r => r.ok ? r.json() : { results: [] })
      .then(d => setServiceResults((d.results || d || []).slice(0, 8)))
      .catch(() => {});
    return () => ctrl.abort();
  }, [serviceQuery]);

  // Quill modules with image upload via API
  const imageHandler = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = await blogApi.adminUploadImage(file);
      const editor = quillRef.current?.getEditor();
      const range = editor?.getSelection(true);
      if (editor && range) editor.insertEmbed(range.index, 'image', url, 'user');
    };
    input.click();
  };

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: { image: imageHandler },
    },
  }), []);

  // Word count → read time (client-side preview)
  const readTime = useMemo(() => {
    const text = cur.content.replace(/<[^>]+>/g, ' ');
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  }, [cur.content]);

  // Cover upload
  const onCoverPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverFile(f);
    setCoverImageUrl(URL.createObjectURL(f));
  };

  const uploadCoverIfNeeded = async (): Promise<string | null> => {
    if (!coverFile) return coverImageUrl;
    return await blogApi.adminUploadImage(coverFile);
  };

  // Save the post for the active language
  const buildPayload = (overrides: Record<string, any> = {}) => ({
    title: cur.title,
    content: cur.content,
    excerpt: cur.excerpt,
    language: editLang,
    category: categoryId,
    tag_ids: tagIds,
    meta_title: metaTitle,
    meta_description: metaDesc,
    is_featured: isFeatured,
    scheduled_at: scheduledAt || null,
    related_hotel_ids: relatedHotels.map(h => h.hotel_id),
    related_service_ids: relatedServices.map(s => s.service_id),
    translation_group: translationGroup,
    ...overrides,
  });

  const save = async (asPublished = false) => {
    setSaving(true);
    try {
      const coverUrl = await uploadCoverIfNeeded();
      const payload: any = buildPayload();
      if (asPublished) payload.status = 'published';
      if (coverUrl && (!coverUrl.startsWith('blob:'))) payload.cover_image = coverUrl;

      const targetId = cur.postId || postId;
      const result = targetId
        ? await blogApi.adminUpdate(targetId, payload)
        : await blogApi.adminCreate(payload);

      setData(d => ({ ...d, [editLang]: { ...d[editLang], postId: result.id } }));
      setStatus(result.status as any);
      setTranslationGroup(result.translation_group);

      if (asPublished && result.id && result.status !== 'published') {
        await blogApi.adminPublish(result.id);
        setStatus('published');
      }
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    const id = cur.postId || postId;
    if (!id) { await save(true); return; }
    if (status === 'published') {
      await blogApi.adminUnpublish(id);
      setStatus('draft');
    } else {
      await blogApi.adminPublish(id);
      setStatus('published');
    }
    setSavedAt(new Date());
  };

  const handleDelete = async () => {
    const id = cur.postId || postId;
    if (!id) return;
    if (!confirm(tr.confirmDel)) return;
    await blogApi.adminDelete(id);
    onBack();
  };

  const addTagFromInput = async () => {
    const name = tagInput.trim();
    if (!name) return;
    let existing = allTags.find(t => t.name_en.toLowerCase() === name.toLowerCase() ||
                                     t.name_ar === name || t.name_ms === name);
    if (!existing) {
      try {
        existing = await blogApi.adminTagsCreate({
          name_en: name, name_ar: name, name_ms: name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
        });
        setAllTags(t => [...t, existing!]);
      } catch { return; }
    }
    if (!tagIds.includes(existing.id)) setTagIds(ids => [...ids, existing!.id]);
    setTagInput('');
  };

  const langStatus = (l: BlogLang) => {
    const d = data[l];
    return (d.title || d.content) ? 'has' : 'empty';
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA]" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Toolbar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} /> {tr.back}
          </button>
          <h1 className="font-display text-lg font-medium text-gray-900 tracking-tight">
            {postId ? tr.edit : tr.new}
          </h1>

          <div className={`${isRTL ? 'mr-auto' : 'ml-auto'} flex items-center gap-2 flex-wrap`}>
            {savedAt && (
              <span className="text-xs text-green-600">{tr.saved} · {savedAt.toLocaleTimeString()}</span>
            )}
            <button
              onClick={() => save(false)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-sm font-semibold rounded-xl hover:border-[#0F2742] disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {tr.saveDraft}
            </button>
            <button
              onClick={togglePublish}
              disabled={saving}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl text-white disabled:opacity-50 ${
                status === 'published' ? 'bg-gray-700 hover:bg-gray-800' : 'bg-[#FF6B35] hover:bg-[#e07a38]'
              }`}
            >
              <Send className="w-4 h-4" /> {status === 'published' ? tr.unpublish : tr.publish}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Main editor */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          {/* Language tabs */}
          <div className="flex items-center gap-1 mb-6 border-b border-gray-100 pb-4">
            {(['ar', 'en', 'ms'] as BlogLang[]).map(l => (
              <button
                key={l}
                onClick={() => setEditLang(l)}
                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                  editLang === l
                    ? 'bg-[#0F2742] text-white'
                    : 'bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="uppercase">{l}</span>
                <span className="ml-2 text-[10px]">
                  {langStatus(l) === 'has' ? '✅' : '⚪'}
                </span>
              </button>
            ))}
            <span className={`${isRTL ? 'mr-auto' : 'ml-auto'} text-xs text-gray-500`}>
              {readTime} {tr.minutes} {tr.readTime}
            </span>
          </div>

          {/* Title */}
          <input
            value={cur.title}
            onChange={e => setData(d => ({ ...d, [editLang]: { ...d[editLang], title: e.target.value } }))}
            placeholder={tr.titlePh}
            dir={editLang === 'ar' ? 'rtl' : 'ltr'}
            className="w-full font-display text-3xl font-medium tracking-tight text-gray-900 placeholder-gray-300 focus:outline-none border-0 mb-4"
          />

          {/* Content */}
          <div dir={editLang === 'ar' ? 'rtl' : 'ltr'} className="quill-wrapper mb-6">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              modules={quillModules}
              value={cur.content}
              onChange={(v) => setData(d => ({ ...d, [editLang]: { ...d[editLang], content: v } }))}
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
              Excerpt
            </label>
            <textarea
              value={cur.excerpt}
              onChange={e => setData(d => ({ ...d, [editLang]: { ...d[editLang], excerpt: e.target.value } }))}
              placeholder={tr.excerptPh}
              maxLength={500}
              dir={editLang === 'ar' ? 'rtl' : 'ltr'}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0F2742]"
            />
            <div className="text-xs text-gray-400 text-right mt-1">{cur.excerpt.length}/500</div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* Cover */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">{tr.cover}</h3>
            {coverImageUrl ? (
              <div className="space-y-2">
                <img src={coverImageUrl} alt="cover" className="w-full aspect-[16/10] object-cover rounded-xl" />
                <div className="flex gap-2">
                  <button onClick={() => fileRef.current?.click()} className="flex-1 px-3 py-2 text-xs font-semibold border border-gray-200 rounded-lg hover:border-[#0F2742]">
                    {tr.changeCover}
                  </button>
                  <button onClick={() => { setCoverImageUrl(null); setCoverFile(null); }}
                          className="px-3 py-2 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                    {tr.removeCover}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                      className="w-full aspect-[16/10] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-[#0F2742] hover:text-[#0F2742]">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-xs font-semibold">{tr.uploadCover}</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onCoverPick} />
          </div>

          {/* Settings */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold">{tr.settings}</h3>

            <div>
              <label className="block text-xs text-gray-700 mb-1">{tr.category}</label>
              <select value={categoryId ?? ''} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="">—</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-700 mb-1">{tr.tags}</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tagIds.map(id => {
                  const t = allTags.find(t => t.id === id);
                  if (!t) return null;
                  return (
                    <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-[#FF6B35] text-xs rounded-full">
                      #{t.name_en}
                      <button onClick={() => setTagIds(ids => ids.filter(i => i !== id))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTagFromInput(); } }}
                placeholder={tr.tagsPh}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0F2742]"
              />
            </div>

            <div className="flex items-center gap-2">
              <input id="featured" type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} />
              <label htmlFor="featured" className="text-xs text-gray-700 inline-flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {tr.featured}
              </label>
            </div>

            <div>
              <label className="block text-xs text-gray-700 mb-1">{tr.schedule}</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold">{tr.seo}</h3>
            <input
              value={metaTitle}
              onChange={e => setMetaTitle(e.target.value)}
              placeholder={tr.metaTitle}
              maxLength={60}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <textarea
              value={metaDesc}
              onChange={e => setMetaDesc(e.target.value)}
              placeholder={tr.metaDesc}
              maxLength={160}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>

          {/* Related Hotels */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">{tr.hotels}</h3>
            <div className="space-y-2 mb-3">
              {relatedHotels.map(h => (
                <div key={h.hotel_id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                  <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden shrink-0">
                    {h.image && <img src={h.image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{h.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{h.city_name} · {h.stars}★</p>
                  </div>
                  <button onClick={() => setRelatedHotels(rh => rh.filter(x => x.hotel_id !== h.hotel_id))}
                          className="p-1 text-gray-400 hover:text-red-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <input
              value={hotelQuery}
              onChange={e => setHotelQuery(e.target.value)}
              placeholder={tr.searchHotel}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            {hotelResults.length > 0 && (
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto border border-gray-100 rounded-lg p-1">
                {hotelResults.map((h: any) => (
                  <button key={h.id} onClick={() => {
                    if (relatedHotels.find(r => r.hotel_id === h.id)) return;
                    setRelatedHotels(rh => [...rh, {
                      hotel_id: h.id, name: h.name, image: h.image,
                      city_name: h.city_name || (h.city?.name) || '', stars: h.stars || 3,
                      order: rh.length,
                    }]);
                    setHotelQuery(''); setHotelResults([]);
                  }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-50 rounded">
                    {h.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Related Services */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">{tr.services}</h3>
            <div className="space-y-2 mb-3">
              {relatedServices.map(s => (
                <div key={s.service_id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                  <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden shrink-0">
                    {s.image && <img src={s.image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{s.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{s.service_type}</p>
                  </div>
                  <button onClick={() => setRelatedServices(rs => rs.filter(x => x.service_id !== s.service_id))}
                          className="p-1 text-gray-400 hover:text-red-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <input
              value={serviceQuery}
              onChange={e => setServiceQuery(e.target.value)}
              placeholder={tr.searchService}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            {serviceResults.length > 0 && (
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto border border-gray-100 rounded-lg p-1">
                {serviceResults.map((s: any) => (
                  <button key={s.id} onClick={() => {
                    if (relatedServices.find(r => r.service_id === s.id)) return;
                    setRelatedServices(rs => [...rs, {
                      service_id: s.id, name: s.name, image: s.image,
                      service_type: s.service_type || '', order: rs.length,
                    }]);
                    setServiceQuery(''); setServiceResults([]);
                  }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-50 rounded">
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delete */}
          {(postId || cur.postId) && (
            <button onClick={handleDelete}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-100">
              <Trash2 className="w-4 h-4" /> {tr.deletePost}
            </button>
          )}
        </aside>
      </div>

      <style>{`
        .quill-wrapper .ql-toolbar { border-radius: 12px 12px 0 0; border-color: #E5E7EB; }
        .quill-wrapper .ql-container { border-radius: 0 0 12px 12px; border-color: #E5E7EB; min-height: 360px; font-size: 16px; font-family: inherit; }
        .quill-wrapper .ql-editor { min-height: 360px; }
        .blog-content img { max-width: 100%; height: auto; }
      `}</style>
    </div>
  );
}
