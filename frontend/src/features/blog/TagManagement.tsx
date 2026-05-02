import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { blogApi, type BlogTag } from '../../services/blogApi';

export function TagManagement() {
  const { isRTL } = useLanguage();
  const [items, setItems] = useState<BlogTag[]>([]);
  const [editing, setEditing] = useState<Partial<BlogTag> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    blogApi.adminTagsList().then(setItems).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async () => {
    if (!editing) return;
    if (editing.id) await blogApi.adminTagsUpdate(editing.id, editing);
    else await blogApi.adminTagsCreate(editing);
    setEditing(null);
    load();
  };
  const remove = async (id: number) => {
    if (!confirm('Delete tag?')) return;
    await blogApi.adminTagsDelete(id);
    load();
  };

  return (
    <div className="p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-medium tracking-tight">Blog Tags</h1>
        <button onClick={() => setEditing({ name_en: '', name_ar: '', name_ms: '', slug: '' })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> New Tag
        </button>
      </div>

      {editing && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input value={editing.name_en || ''} onChange={e => setEditing({ ...editing, name_en: e.target.value })}
                   placeholder="Name (EN)" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input value={editing.name_ar || ''} onChange={e => setEditing({ ...editing, name_ar: e.target.value })}
                   placeholder="Name (AR)" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input value={editing.name_ms || ''} onChange={e => setEditing({ ...editing, name_ms: e.target.value })}
                   placeholder="Name (MS)" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input value={editing.slug || ''} onChange={e => setEditing({ ...editing, slug: e.target.value })}
                   placeholder="slug" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="px-4 py-2 bg-[#0F2742] text-white rounded-xl text-sm flex items-center gap-1">
              <Save className="w-4 h-4" /> Save
            </button>
            <button onClick={() => setEditing(null)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm flex items-center gap-1">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? <div className="p-12 text-center">Loading...</div> :
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3">Name (EN)</th>
              <th className="px-4 py-3">AR</th>
              <th className="px-4 py-3">MS</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold">{t.name_en}</td>
                <td className="px-4 py-3">{t.name_ar}</td>
                <td className="px-4 py-3">{t.name_ms}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{t.slug}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing({ ...t })} className="p-1.5 text-gray-500 hover:text-[#0F2742]"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => remove(t.id)} className="p-1.5 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>
    </div>
  );
}
