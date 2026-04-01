import { useState, useEffect } from 'react';
import { Plus, Search, X } from 'lucide-react';

export function PackagesManagement() {
  const [packages, setPackages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    base_price: '',
    currency: 'MYR',
    discount_percentage: '',
    highlights: '',
    is_active: true,
  });

  useEffect(() => {
    fetch('http://localhost:8000/api/packages/')
      .then(res => res.json())
      .then(data => {
        setPackages(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:8000/api/packages/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      const newPackage = await res.json();
      setPackages([newPackage, ...packages]);
      setShowModal(false);
      setFormData({ name: '', slug: '', description: '', base_price: '', currency: 'MYR', discount_percentage: '', highlights: '', is_active: true });
      alert('✅ تم إضافة الباقة بنجاح');
    } else {
      alert('❌ حدث خطأ');
    }
  };

  if (loading) return <div className="p-10 text-center">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">إدارة الباقات السياحية</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl"
        >
          <Plus className="w-5 h-5" />
          إضافة باقة سياحية
        </button>
      </div>

      {/* النافذة (Modal) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 p-8 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">إضافة باقة سياحية جديدة</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-black">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">اسم الباقة</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded-xl px-4 py-3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">الرابط (Slug)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full border rounded-xl px-4 py-3"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full border rounded-xl px-4 py-3"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-1">السعر الأساسي</label>
                  <input
                    type="number"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    className="w-full border rounded-xl px-4 py-3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">العملة</label>
                  <input
                    value="MYR"
                    disabled
                    className="w-full border rounded-xl px-4 py-3 bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">نسبة الخصم (%)</label>
                  <input
                    type="number"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    className="w-full border rounded-xl px-4 py-3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">المميزات الرئيسية</label>
                <textarea
                  value={formData.highlights}
                  onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                  rows={3}
                  className="w-full border rounded-xl px-4 py-3"
                  placeholder="مثال: تذكرة طيران • فندق 5 نجوم • جولات يومية"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5"
                />
                <label className="text-sm">الباقة نشطة ومتاحة للحجز</label>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 border rounded-xl text-gray-700"
                >
                  إلغاء
                </button>
                <button type="submit" className="flex-1 py-4 bg-black text-white rounded-xl">
                  حفظ وإضافة الباقة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* قائمة الباقات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div key={pkg.id} className="bg-white border rounded-2xl p-6">
            <h3 className="font-medium text-lg">{pkg.name}</h3>
            <p className="text-sm text-gray-600 mt-2 line-clamp-3">{pkg.description}</p>
            <div className="mt-6 text-2xl font-bold text-emerald-600">
              {pkg.base_price} {pkg.currency}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}