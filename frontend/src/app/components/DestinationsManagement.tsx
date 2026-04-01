import { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Upload, Trash2, Edit, ChevronLeft, ChevronRight, Image as ImageIcon, Grid, List } from 'lucide-react';

interface Country {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
  country: number;
  description?: string;
  image?: string;
}

export function DestinationsManagement() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  // عرض البطاقات أو الجدول
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // فلاتر
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<number | null>(null);
  const [hasImageOnly, setHasImageOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc'>('name-asc');

  // ترقيم الصفحات
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'table' ? 7 : 15;

  // Modals
  const [showCityModal, setShowCityModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);

  // Form data
  const [newCountryName, setNewCountryName] = useState('');
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [newCityName, setNewCityName] = useState('');
  const [newCityDescription, setNewCityDescription] = useState('');
  const [cityImage, setCityImage] = useState<File | null>(null);

  const BASE_URL = 'http://localhost:8000';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [countriesRes, citiesRes] = await Promise.all([
        fetch(`${BASE_URL}/api/locations/countries/`),
        fetch(`${BASE_URL}/api/locations/cities/`)
      ]);
      if (countriesRes.ok && citiesRes.ok) {
        setCountries(await countriesRes.json());
        setCities(await citiesRes.json());
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCities = cities
    .filter(city => {
      const matchesSearch = 
        city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        countries.find(c => c.id === city.country)?.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCountry = selectedCountryFilter === null || city.country === selectedCountryFilter;
      const matchesImage = !hasImageOnly || !!city.image;
      return matchesSearch && matchesCountry && matchesImage;
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      return 0;
    });

  const totalPages = Math.ceil(filteredCities.length / itemsPerPage);
  const paginatedCities = filteredCities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openEditModal = (city: City) => {
    setEditingCity(city);
    setSelectedCountryId(city.country);
    setNewCityName(city.name);
    setNewCityDescription(city.description || '');
    setCityImage(null);
    setShowCityModal(true);
  };

  const saveCity = async () => {
    if (!selectedCountryId || !newCityName.trim()) return alert("يرجى إكمال البيانات");
    const formData = new FormData();
    formData.append('name', newCityName);
    formData.append('country', selectedCountryId.toString());
    if (newCityDescription) formData.append('description', newCityDescription);
    if (cityImage) formData.append('image', cityImage);

    const url = editingCity ? `${BASE_URL}/api/locations/cities/${editingCity.id}/` : `${BASE_URL}/api/locations/cities/`;
    const method = editingCity ? 'PUT' : 'POST';

    const res = await fetch(url, { method, body: formData });
    if (res.ok) {
      const data = await res.json();
      if (editingCity) {
        setCities(cities.map(c => c.id === data.id ? data : c));
      } else {
        setCities([...cities, data]);
      }
      setShowCityModal(false);
      setEditingCity(null);
      setNewCityName('');
      setNewCityDescription('');
      setCityImage(null);
      setSelectedCountryId(null);
      alert(editingCity ? '✅ تم التعديل بنجاح' : '✅ تمت الإضافة بنجاح');
    }
  };

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${BASE_URL}${imagePath}`;
  };

  const deleteCity = async (cityId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه المدينة؟')) return;
    const res = await fetch(`${BASE_URL}/api/locations/cities/${cityId}/`, { method: 'DELETE' });
    if (res.ok) {
      setCities(cities.filter(c => c.id !== cityId));
      alert('✅ تم الحذف بنجاح');
    }
  };

  if (loading) return <div className="p-10 text-center">جاري التحميل...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">إدارة الوجهات</h1>
        
        {/* زر التبديل بين البطاقات والجدول */}
        <div className="flex border rounded-xl overflow-hidden">
          <button
            onClick={() => { setViewMode('card'); setCurrentPage(1); }}
            className={`px-5 py-2 flex items-center gap-2 transition-colors ${viewMode === 'card' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'}`}
          >
            <Grid className="w-4 h-4" />
            بطاقات
          </button>
          <button
            onClick={() => { setViewMode('table'); setCurrentPage(1); }}
            className={`px-5 py-2 flex items-center gap-2 transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'}`}
          >
            <List className="w-4 h-4" />
            جدول
          </button>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setShowCountryModal(true)} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> إضافة دولة
          </button>
          <button onClick={() => { setEditingCity(null); setShowCityModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> إضافة مدينة
          </button>
        </div>
      </div>

      {/* الفلاتر */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث عن مدينة أو دولة..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="w-full md:w-52">
          <select
            value={selectedCountryFilter || ''}
            onChange={e => setSelectedCountryFilter(e.target.value ? Number(e.target.value) : null)}
            className="w-full border p-3 rounded-xl"
          >
            <option value="">كل الدول</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <button
          onClick={() => { setSearchQuery(''); setSelectedCountryFilter(null); setHasImageOnly(false); }}
          className="px-6 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50"
        >
          مسح الفلاتر
        </button>
      </div>

      {/* عرض البطاقات */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {paginatedCities.map(city => {
            const country = countries.find(c => c.id === city.country);
            return (
              <div key={city.id} className="group border rounded-2xl overflow-hidden shadow-sm bg-white transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl relative">
                <div className="h-52 bg-gray-100 relative">
                  {city.image ? (
                    <img src={getImageUrl(city.image)} className="w-full h-full object-cover" alt={city.name} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                      <MapPin className="w-16 h-16 mb-2" />
                      <span className="text-xs">بدون صورة</span>
                    </div>
                  )}
                </div>

                <div className="absolute top-4 left-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity delay-1000">
                  <button onClick={() => openEditModal(city)} className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600" title="تعديل">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteCity(city.id)} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600" title="حذف">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-xl">{city.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{country?.name}</p>
                  {city.description && (
                    <p className="text-sm text-gray-600 mt-4 line-clamp-3">{city.description}</p>
                  )}
                  
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* عرض الجدول - 20 سطر */}
      {viewMode === 'table' && (
        <div className="border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-right">الصورة</th>
                <th className="px-6 py-4 text-right">اسم المدينة</th>
                <th className="px-6 py-4 text-right">الدولة</th>
                <th className="px-6 py-4 text-right">الوصف</th>
                <th className="px-6 py-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCities.map(city => {
                const country = countries.find(c => c.id === city.country);
                return (
                  <tr key={city.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {city.image ? (
                        <img src={getImageUrl(city.image)} className="w-10 h-10 object-cover rounded-lg" alt="" />
                      ) : (
                        <MapPin className="w-10 h-10 text-gray-300" />
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium">{city.name}</td>
                    <td className="px-6 py-4 text-gray-500">{country?.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 line-clamp-2 max-w-xs">{city.description || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => openEditModal(city)} className="text-blue-600 hover:text-blue-700">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => deleteCity(city.id)} className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ترقيم الصفحات */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="flex items-center gap-1 px-4 py-2 border rounded-xl disabled:opacity-40">
            <ChevronRight className="w-4 h-4" /> السابق
          </button>
          <span className="text-sm text-gray-500">الصفحة {currentPage} من {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="flex items-center gap-1 px-4 py-2 border rounded-xl disabled:opacity-40">
            التالي <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modals (نفس السابق) */}
      {showCityModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-8">
            <h2 className="text-xl font-semibold mb-6">
              {editingCity ? 'تعديل المدينة' : 'إضافة مدينة جديدة'}
            </h2>
            <div className="space-y-4">
              <select value={selectedCountryId || ''} onChange={e => setSelectedCountryId(Number(e.target.value))} className="w-full border p-3 rounded-xl bg-gray-50">
                <option value="">-- اختر الدولة --</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input value={newCityName} onChange={e => setNewCityName(e.target.value)} className="w-full border p-3 rounded-xl" placeholder="اسم المدينة" />
              <textarea value={newCityDescription} onChange={e => setNewCityDescription(e.target.value)} className="w-full border p-3 rounded-xl" placeholder="وصف المدينة" rows={3} />
              <label className="border-2 border-dashed flex flex-col items-center p-4 rounded-xl cursor-pointer">
                <input type="file" className="hidden" onChange={e => setCityImage(e.target.files?.[0] || null)} />
                <Upload className="text-gray-400" />
                <span className="text-xs mt-2 text-gray-500">
                  {cityImage ? cityImage.name : (editingCity?.image ? "صورة موجودة - يمكن تغييرها" : "ارفع صورة للمدينة")}
                </span>
              </label>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => { setShowCityModal(false); setEditingCity(null); }} className="flex-1 py-4 border rounded-xl">إلغاء</button>
              <button onClick={saveCity} className="flex-1 py-4 bg-blue-600 text-white rounded-xl">
                {editingCity ? 'حفظ التعديل' : 'إضافة المدينة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCountryModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 p-8">
            <h2 className="text-xl font-semibold mb-6">إضافة دولة جديدة</h2>
            <input value={newCountryName} onChange={e => setNewCountryName(e.target.value)} className="w-full border p-3 rounded-xl" placeholder="اسم الدولة" />
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowCountryModal(false)} className="flex-1 py-4 border rounded-xl">إلغاء</button>
              <button onClick={async () => {
                if (!newCountryName.trim()) return;
                const res = await fetch(`${BASE_URL}/api/locations/countries/`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: newCountryName }),
                });
                if (res.ok) {
                  const data = await res.json();
                  setCountries([...countries, data]);
                  setNewCountryName('');
                  setShowCountryModal(false);
                  alert('✅ تمت إضافة الدولة بنجاح');
                }
              }} className="flex-1 py-4 bg-black text-white rounded-xl">حفظ الدولة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}