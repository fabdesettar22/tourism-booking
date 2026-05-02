import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { blogApi, type BlogCategory } from '../../services/blogApi';

const EMPTY: Partial<BlogCategory> = {
  name_ar: '', name_en: '', name_ms: '', slug: '',
  target_audience: 'all', color: '#FF6B35', icon: '', order: 0,
};

export function CategoryManagement() {
  const { isRTL } = useLanguage();
  const [items, setItems] = useState<BlogCategory[]>([]);
  const [editing, setEditing] = useState<Partial<BlogCategory> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    blogApi.adminCategoriesList().then(setItems).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async () => {
    if (!editing) return;
    if (editing.id) await blogApi.adminCategoriesUpdate(editing.id, editing);
    else await blogApi.adminCategoriesCreate(editing);
    setEditing(null);
    load();
  };

  const remove = async (id: number) => {
    if (!confirm('Delete category?')) return;
    await blogApi.adminCategoriesDelete(id);
    load();
  };

  return (
    <div className="p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-medium tracking-tight">Blog Categories</h1>
        <button onClick={() => setEditing({ ...EMPTY })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> New Category
        </button>
      </div>

      {editing && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={editing.name_en || ''} onChange={e => setEditing({ ...editing, name_en: e.target.value })}
                   placeholder="Name (EN)" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input value={editing.name_ar || ''} onChange={e => setEditing({ ...editing, name_ar: e.target.value })}
                   placeholder="Name (AR)" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input value={editing.name_ms || ''} onChange={e => setEditing({ ...editing, name_ms: e.target.value })}
                   placeholder="Name (MS)" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input value={editing.slug || ''} onChange={e => setEditing({ ...editing, slug: e.target.value })}
                   placeholder="slug" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <select value={editing.target_audience || 'all'}
                    onChange={e => setEditing({ ...editing, target_audience: e.target.value as any })}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
              <option value="all">All</option><option value="tourist">Tourist</option>
              <option value="partner">Partner</option><option value="supplier">Supplier</option>
            </select>
            <input type="color" value={editing.color || '#FF6B35'} onChange={e => setEditing({ ...editing, color: e.target.value })}
                   className="px-1 py-1 border border-gray-200 rounded-lg h-10" />
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
              <th className="px-4 py-3">Color</th>
              <th className="px-4 py-3">Name (EN)</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Audience</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><span className="inline-block w-4 h-4 rounded" style={{ background: c.color }} /></td>
                <td className="px-4 py-3 font-semibold">{c.name_en}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{c.slug}</td>
                <td className="px-4 py-3 text-xs">{c.target_audience}</td>
                <td className="px-4 py-3">{c.order}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing({ ...c })} className="p-1.5 text-gray-500 hover:text-[#0F2742]"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => remove(c.id)} className="p-1.5 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>
    </div>
  );
}
