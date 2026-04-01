import { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Upload, Trash2, Edit, ChevronLeft, ChevronRight, Image as ImageIcon, Grid, List, Star } from 'lucide-react';

interface Country {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
  country: number;
}

interface Hotel {
  id: number;
  name: string;
  city: number;
  country?: string;
  address: string;
  stars: number;
  description?: string;
  image?: string;
}

export function HotelsManagement() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // فلاتر
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<number | null>(null);
  const [selectedCityFilter, setSelectedCityFilter] = useState<number | null>(null);
  const [selectedStarsFilter, setSelectedStarsFilter] = useState<number | null>(null);

  // ترقيم الصفحات
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'table' ? 20 : 12;

  // Modal
  const [showHotelModal, setShowHotelModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    city: '',
    address: '',
    stars: 3,
    description: '',
  });
  const [hotelImage, setHotelImage] = useState<File | null>(null);

  const BASE_URL = 'http://localhost:8000';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [countriesRes, citiesRes, hotelsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/locations/countries/`),
        fetch(`${BASE_URL}/api/locations/cities/`),
        fetch(`${BASE_URL}/api/hotels/`)
      ]);
      if (countriesRes.ok) setCountries(await countriesRes.json());
      if (citiesRes.ok) setCities(await citiesRes.json());
      if (hotelsRes.ok) {
        const data = await hotelsRes.json();
        setHotels(Array.isArray(data) ? data : data.results || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredHotels = hotels.filter(hotel => {
    const matchesSearch = hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         hotel.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = selectedCountryFilter === null || countries.find(c => c.id === selectedCountryFilter)?.name === hotel.country;
    const matchesCity = selectedCityFilter === null || hotel.city === selectedCityFilter;
    const matchesStars = selectedStarsFilter === null || hotel.stars === selectedStarsFilter;
    return matchesSearch && matchesCountry && matchesCity && matchesStars;
  });

  const totalPages = Math.ceil(filteredHotels.length / itemsPerPage);
  const paginatedHotels = filteredHotels.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openEditModal = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setFormData({
      name: hotel.name,
      country: '', 
      city: hotel.city.toString(),
      address: hotel.address,
      stars: hotel.stars,
      description: hotel.description || '',
    });
    setHotelImage(null);
    setShowHotelModal(true);
  };

   const saveHotel = async () => {
    if (!formData.name || !formData.city) {
      alert("يرجى إدخال اسم الفندق والمدينة");
      return;
    }

    const form = new FormData();
    form.append('name', formData.name);
    form.append('city', formData.city);           // يجب أن يكون رقم المدينة
    form.append('address', formData.address || '');
    form.append('stars', formData.stars.toString());
    if (formData.description) form.append('description', formData.description);
    if (hotelImage) form.append('image', hotelImage);

    const url = editingHotel 
      ? `${BASE_URL}/api/hotels/${editingHotel.id}/` 
      : `${BASE_URL}/api/hotels/`;

    const method = editingHotel ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, { 
        method, 
        body: form 
      });

      if (res.ok) {
        const data = await res.json();
        if (editingHotel) {
          setHotels(hotels.map(h => h.id === data.id ? data : h));
        } else {
          setHotels([...hotels, data]);
        }
        setShowHotelModal(false);
        setEditingHotel(null);
        setFormData({ name: '', country: '', city: '', address: '', stars: 3, description: '' });
        setHotelImage(null);
        alert(editingHotel ? '✅ تم التعديل بنجاح' : '✅ تمت الإضافة بنجاح');
      } else {
        const errorText = await res.text();
        console.error("Save failed:", errorText);
        alert(`❌ فشل الحفظ - الخطأ: ${res.status} ${errorText}`);
      }
    } catch (err) {
      console.error("Network error:", err);
      alert('❌ خطأ في الاتصال بالسيرفر');
    }
  };

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${BASE_URL}${imagePath}`;
  };

  const deleteHotel = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفندق؟')) return;
    const res = await fetch(`${BASE_URL}/api/hotels/${id}/`, { method: 'DELETE' });
    if (res.ok) {
      setHotels(hotels.filter(h => h.id !== id));
      alert('✅ تم الحذف بنجاح');
    }
  };

  if (loading) return <div className="p-10 text-center">جاري التحميل...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">إدارة الفنادق</h1>
        <div className="flex border rounded-xl overflow-hidden">
          <button onClick={() => { setViewMode('card'); setCurrentPage(1); }} className={`px-5 py-2 flex items-center gap-2 ${viewMode === 'card' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'}`}>
            <Grid className="w-4 h-4" /> بطاقات
          </button>
          <button onClick={() => { setViewMode('table'); setCurrentPage(1); }} className={`px-5 py-2 flex items-center gap-2 ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'}`}>
            <List className="w-4 h-4" /> جدول
          </button>
        </div>
        <button onClick={() => { setEditingHotel(null); setShowHotelModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> إضافة فندق
        </button>
      </div>

      {/* الفلاتر */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="ابحث عن فندق أو عنوان..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pr-10 pl-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="w-full md:w-52">
          <select value={selectedCountryFilter || ''} onChange={e => setSelectedCountryFilter(e.target.value ? Number(e.target.value) : null)} className="w-full border p-3 rounded-xl">
            <option value="">كل الدول</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="w-full md:w-52">
          <select value={selectedCityFilter || ''} onChange={e => setSelectedCityFilter(e.target.value ? Number(e.target.value) : null)} className="w-full border p-3 rounded-xl">
            <option value="">كل المدن</option>
            {cities.filter(c => !selectedCountryFilter || c.country === selectedCountryFilter).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <button onClick={() => { setSearchQuery(''); setSelectedCountryFilter(null); setSelectedCityFilter(null); setSelectedStarsFilter(null); }} className="px-6 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50">
          مسح الفلاتر
        </button>
      </div>

      {/* باقي الواجهة (البطاقات + الجدول) كما هي */}

      {/* Modal إضافة / تعديل فندق - تصفية هرمية صحيحة */}
      {showHotelModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-8">
            <h2 className="text-xl font-semibold mb-6">
              {editingHotel ? 'تعديل الفندق' : 'إضافة فندق جديد'}
            </h2>
            <div className="space-y-4">
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border p-3 rounded-xl" placeholder="اسم الفندق" />

              {/* الدولة */}
              <select 
                value={formData.country} 
                onChange={e => setFormData({ ...formData, country: e.target.value, city: '' })} 
                className="w-full border p-3 rounded-xl bg-gray-50"
              >
                <option value="">-- اختر الدولة --</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              {/* المدينة - تظهر فقط مدن الدولة المختارة */}
              <select 
                value={formData.city} 
                onChange={e => setFormData({ ...formData, city: e.target.value })} 
                className="w-full border p-3 rounded-xl bg-gray-50"
              >
                <option value="">-- اختر المدينة --</option>
                {cities
                  .filter(c => !formData.country || c.country === Number(formData.country))
                  .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full border p-3 rounded-xl" placeholder="العنوان" />

              <div>
                <label className="text-sm text-gray-500 mb-1 block">عدد النجوم</label>
                <select value={formData.stars} onChange={e => setFormData({ ...formData, stars: Number(e.target.value) })} className="w-full border p-3 rounded-xl">
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} ★</option>)}
                </select>
              </div>

              <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border p-3 rounded-xl" placeholder="وصف الفندق" rows={3} />

              <label className="border-2 border-dashed flex flex-col items-center p-4 rounded-xl cursor-pointer">
                <input type="file" className="hidden" onChange={e => setHotelImage(e.target.files?.[0] || null)} />
                <Upload className="text-gray-400" />
                <span className="text-xs mt-2 text-gray-500">
                  {hotelImage ? hotelImage.name : (editingHotel?.image ? "صورة موجودة - يمكن تغييرها" : "ارفع صورة للفندق")}
                </span>
              </label>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => { setShowHotelModal(false); setEditingHotel(null); }} className="flex-1 py-4 border rounded-xl">إلغاء</button>
              <button onClick={saveHotel} className="flex-1 py-4 bg-blue-600 text-white rounded-xl">
                {editingHotel ? 'حفظ التعديل' : 'إضافة الفندق'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}