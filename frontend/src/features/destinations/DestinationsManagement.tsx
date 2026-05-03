import { apiFetch } from '../../services/apiFetch';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import {
  Plus, Search, MapPin, Upload, Trash2, Edit,
  ChevronLeft, ChevronRight, Grid, List,
  Globe, Building2, CheckCircle2,
  XCircle, AlertTriangle, X, Loader2
} from 'lucide-react';

// ─── Types ──────────────────────────────────────
interface Country { id: number; name?: string; label?: string; name_en?: string; name_ar?: string; iso2?: string; }
interface City {
  id: number; name: string; country: number; country_id?: number; label?: string; name_ar?: string; name_en?: string;
  description?: string; image?: string;
}
type ToastType = 'success' | 'error' | 'warning';
interface Toast { id: number; type: ToastType; message: string; }

// ─── Toast Component ─────────────────────────────
function ToastNotification({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-sm px-4">
      {toasts.map(t => (
        <div key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium
            transition-all duration-300 animate-in slide-in-from-top-4
            ${t.type === 'success' ? 'bg-emerald-500' : t.type === 'error' ? 'bg-red-500' : 'bg-amber-500'}`}>
          {t.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> :
           t.type === 'error'   ? <XCircle className="w-5 h-5 shrink-0" /> :
                                  <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Delete Confirm Modal ────────────────────────
function DeleteModal({ cityName, onConfirm, onCancel, loading }:
  { cityName: string; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl w-full max-w-sm mx-4 p-8 shadow-2xl text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-bold mb-2">{t('destinationsAdmin.deleteModal.title')}</h3>
        <p className="text-gray-500 mb-6">
          {t('destinationsAdmin.deleteModal.confirmText')}{' '}
          <span className="font-semibold text-gray-800">"{cityName}"</span>
          {t('destinationsAdmin.deleteModal.irreversible')}
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 border-2 rounded-xl font-medium hover:bg-gray-50 transition-colors">
            {t('destinationsAdmin.deleteModal.cancel')}
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {t('destinationsAdmin.deleteModal.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className={`bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────
function EmptyState({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <MapPin className="w-12 h-12 text-gray-300" />
      </div>
      <h3 className="text-xl font-bold text-gray-700 mb-2">
        {hasFilters ? t('destinationsAdmin.empty.noResults') : t('destinationsAdmin.empty.noCities')}
      </h3>
      <p className="text-gray-400 mb-6 max-w-xs">
        {hasFilters ? t('destinationsAdmin.empty.tryFilters') : t('destinationsAdmin.empty.startAdding')}
      </p>
      {hasFilters && (
        <button onClick={onReset}
          className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
          {t('destinationsAdmin.empty.reset')}
        </button>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────
export function DestinationsManagement() {
  const { t, isRTL } = useLanguage();
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<City | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc'>('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'table' ? 8 : 12;

  const [showCityModal, setShowCityModal] = useState(false);
  const [modalCountryCities, setModalCountryCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [newCountryName, setNewCountryName] = useState('');
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [newCityName, setNewCityName] = useState('');
  const [newCityDescription, setNewCityDescription] = useState('');
  const [cityImage, setCityImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // ─── Toast helpers ───
  const addToast = (type: ToastType, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => { fetchData(); }, []);

  // ─── تحميل ديناميكي للمدن عند تغيير فلتر الدولة ───
  useEffect(() => {
    if (selectedCountryFilter === null) return;
    
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/v1/locations/cities/?country_id=${selectedCountryFilter}&limit=2000`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.results || []);
          setCities(list);
          setCurrentPage(1);
        }
      } catch (e) {
        console.error('فشل تحميل مدن الدولة', e);
        addToast('error', 'فشل تحميل مدن الدولة');
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedCountryFilter]);

  const fetchData = async () => {
    try {
      const [cRes, ciRes] = await Promise.all([
        apiFetch(`/api/v1/locations/countries/`),
        apiFetch(`/api/v1/locations/cities/?limit=1000`)
      ]);
      if (cRes.ok && ciRes.ok) {
        setCountries(await cRes.json());
        setCities(await ciRes.json());
      } else {
        addToast('error', t('destinationsAdmin.toasts.loadFail'));
      }
    } catch {
      addToast('error', t('destinationsAdmin.toasts.connectFail'));
    } finally {
      setLoading(false);
    }
  };

  const hasFilters = !!(searchQuery || selectedCountryFilter);
  const filteredCities = cities
    .filter(city => {
      const matchesSearch =
        city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (countries.find(c => c.id === (city.country_id || city.country))?.label || countries.find(c => c.id === (city.country_id || city.country))?.name_ar || countries.find(c => c.id === (city.country_id || city.country))?.name_en || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCountry = selectedCountryFilter === null || (city.country_id || city.country) === selectedCountryFilter;
      return matchesSearch && matchesCountry;
    })
    .sort((a, b) => sortBy === 'name-asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

  const totalPages = Math.ceil(filteredCities.length / itemsPerPage);
  const paginatedCities = filteredCities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const resetFilters = () => { setSearchQuery(''); setSelectedCountryFilter(null); setCurrentPage(1); };

  const getImageUrl = (p?: string) => (!p ? null : p.startsWith('http') ? p : `/${p}`);

  const handleImageChange = (file: File | null) => {
    setCityImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = e => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const openAddModal = () => {
    setEditingCity(null); setNewCityName(''); setNewCityDescription('');
    setCityImage(null); setImagePreview(null); setSelectedCountryId(null);
    setShowCityModal(true);
  };
  const openEditModal = (city: City) => {
    setEditingCity(city); setSelectedCountryId(city.country);
    setNewCityName(city.name); setNewCityDescription(city.description || '');
    setCityImage(null); setImagePreview(getImageUrl(city.image));
    setShowCityModal(true);
  };

  const saveCity = async () => {
    if (!selectedCountryId || !newCityName.trim()) {
      addToast('warning', t('destinationsAdmin.toasts.pickCountryAndName'));
      return;
    }
    setSaving(true);
    const fd = new FormData();
    fd.append('name', newCityName);
    fd.append('country', selectedCountryId.toString());
    if (newCityDescription) fd.append('description', newCityDescription);
    if (cityImage) fd.append('image', cityImage);

    const url = editingCity
      ? `/api/v1/locations/cities/${editingCity.id}/`
      : `/api/v1/locations/cities/`;
    const method = editingCity ? 'PUT' : 'POST';

    try {
      const res = await apiFetch(url, { method, body: fd });
      if (res.ok) {
        const data = await res.json();
        setCities(prev => editingCity ? prev.map(c => c.id === data.id ? data : c) : [...prev, data]);
        setShowCityModal(false);
        const msg = editingCity
          ? t('destinationsAdmin.toasts.cityEdited').replace('{name}', data.name)
          : t('destinationsAdmin.toasts.cityAdded').replace('{name}', data.name);
        addToast('success', `✅ ${msg}`);
      } else {
        addToast('error', t('destinationsAdmin.toasts.saveFail'));
      }
    } catch {
      addToast('error', t('destinationsAdmin.toasts.connectFail'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const res = await apiFetch(`/api/v1/locations/cities/${deleteTarget.id}/`, { method: 'DELETE' });
      if (res.ok) {
        setCities(prev => prev.filter(c => c.id !== deleteTarget.id));
        addToast('success', `✅ ${t('destinationsAdmin.toasts.cityDeleted').replace('{name}', deleteTarget.name)}`);
      } else {
        addToast('error', t('destinationsAdmin.toasts.deleteFail'));
      }
    } catch {
      addToast('error', t('destinationsAdmin.toasts.connectFail'));
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      <p className="text-gray-500">{t('destinationsAdmin.loadingMsg')}</p>
    </div>
  );

  const align = isRTL ? 'text-right' : 'text-left';

  return (
    <div className="max-w-7xl mx-auto space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <ToastNotification toasts={toasts} remove={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('destinationsAdmin.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('destinationsAdmin.subtitle')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowCountryModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
            <Globe className="w-4 h-4" /> {t('destinationsAdmin.addCountry')}
          </button>
          <button onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
            <Plus className="w-4 h-4" /> {t('destinationsAdmin.addCity')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={<Globe className="w-6 h-6 text-blue-600" />}      label={t('destinationsAdmin.stats.totalCountries')} value={countries.length}        color="bg-blue-50" />
        <StatCard icon={<Building2 className="w-6 h-6 text-purple-600" />} label={t('destinationsAdmin.stats.totalCities')}    value={cities.length}           color="bg-purple-50" />
        <StatCard icon={<MapPin className="w-6 h-6 text-orange-600" />}    label={t('destinationsAdmin.stats.filtered')}       value={filteredCities.length}   color="bg-orange-50" />
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center shadow-sm">
        <div className="flex-1 relative w-full">
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
          <input type="text" placeholder={t('destinationsAdmin.searchPlaceholder')}
            value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`} />
        </div>
        <select value={selectedCountryFilter || ''} onChange={e => { setSelectedCountryFilter(e.target.value ? Number(e.target.value) : null); setCurrentPage(1); }}
          className="border p-2.5 rounded-xl text-sm md:w-48 w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">{t('destinationsAdmin.allCountries')}</option>
          {countries.map(c => <option key={c.id} value={c.id}>{c.label || c.name_ar || c.name_en || c.name || `Country ${c.id}`}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          className="border p-2.5 rounded-xl text-sm md:w-44 w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="name-asc">{t('destinationsAdmin.sortAsc')}</option>
          <option value="name-desc">{t('destinationsAdmin.sortDesc')}</option>
        </select>
        <div className="flex border rounded-xl overflow-hidden shrink-0">
          <button onClick={() => { setViewMode('card'); setCurrentPage(1); }}
            className={`px-4 py-2.5 flex items-center gap-1.5 text-sm transition-colors ${viewMode === 'card' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}>
            <Grid className="w-4 h-4" /> {t('destinationsAdmin.cardsView')}
          </button>
          <button onClick={() => { setViewMode('table'); setCurrentPage(1); }}
            className={`px-4 py-2.5 flex items-center gap-1.5 text-sm transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}>
            <List className="w-4 h-4" /> {t('destinationsAdmin.tableView')}
          </button>
        </div>
        {hasFilters && (
          <button onClick={resetFilters}
            className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 whitespace-nowrap shrink-0 transition-colors">
            {t('destinationsAdmin.clearFilters')}
          </button>
        )}
      </div>

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {paginatedCities.length === 0
            ? <EmptyState hasFilters={hasFilters} onReset={resetFilters} />
            : paginatedCities.map(city => {
              const country = countries.find(c => c.id === city.country);
              const imgUrl = getImageUrl(city.image);
              return (
                <div key={city.id}
                  className="group bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative">
                  <div className="h-44 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                    {imgUrl
                      ? <img src={imgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={city.name} />
                      : <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                          <MapPin className="w-12 h-12 mb-1" />
                          <span className="text-xs">{t('destinationsAdmin.card.noImage')}</span>
                        </div>
                    }
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button onClick={() => openEditModal(city)}
                        className="bg-white text-blue-600 p-2.5 rounded-full hover:bg-blue-50 shadow-lg transition-colors" title={t('destinationsAdmin.card.edit')}>
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(city)}
                        className="bg-white text-red-500 p-2.5 rounded-full hover:bg-red-50 shadow-lg transition-colors" title={t('destinationsAdmin.card.delete')}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} bg-white/90 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-full text-gray-700 shadow`}>
                      {country?.name}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-lg">{city.name}</h3>
                    {city.description && (
                      <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{city.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className={`px-6 py-4 ${align} text-xs font-semibold text-gray-500 uppercase tracking-wider`}>{t('destinationsAdmin.table.image')}</th>
                <th className={`px-6 py-4 ${align} text-xs font-semibold text-gray-500 uppercase tracking-wider`}>{t('destinationsAdmin.table.city')}</th>
                <th className={`px-6 py-4 ${align} text-xs font-semibold text-gray-500 uppercase tracking-wider`}>{t('destinationsAdmin.table.country')}</th>
                <th className={`px-6 py-4 ${align} text-xs font-semibold text-gray-500 uppercase tracking-wider`}>{t('destinationsAdmin.table.description')}</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('destinationsAdmin.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedCities.length === 0
                ? <tr><td colSpan={5}><EmptyState hasFilters={hasFilters} onReset={resetFilters} /></td></tr>
                : paginatedCities.map(city => {
                  const country = countries.find(c => c.id === city.country);
                  const imgUrl = getImageUrl(city.image);
                  return (
                    <tr key={city.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        {imgUrl
                          ? <img src={imgUrl} className="w-11 h-11 object-cover rounded-xl shadow-sm" alt="" />
                          : <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-gray-300" />
                            </div>
                        }
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{city.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                          <Globe className="w-3 h-3" /> {country?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs line-clamp-2">{city.description || <span className="text-gray-300">—</span>}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => openEditModal(city)}
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title={t('destinationsAdmin.card.edit')}>
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(city)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title={t('destinationsAdmin.card.delete')}>
                            <Trash2 className="w-4 h-4" />
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border rounded-2xl px-6 py-4 shadow-sm">
          <span className="text-sm text-gray-500">
            {t('destinationsAdmin.pagination.showing')
              .replace('{from}', String((currentPage - 1) * itemsPerPage + 1))
              .replace('{to}',   String(Math.min(currentPage * itemsPerPage, filteredCities.length)))
              .replace('{total}',String(filteredCities.length))}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
              className="flex items-center gap-1 px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors">
              {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {t('destinationsAdmin.pagination.prev')}
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setCurrentPage(p)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors
                    ${currentPage === p ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                  {p}
                </button>
              ))}
            </div>
            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors">
              {t('destinationsAdmin.pagination.next')}
              {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          cityName={deleteTarget.name}
          loading={deletingId === deleteTarget.id}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* City Modal */}
      {showCityModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{editingCity ? t('destinationsAdmin.cityModal.titleEdit') : t('destinationsAdmin.cityModal.titleNew')}</h2>
              <button onClick={() => setShowCityModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('destinationsAdmin.cityModal.country')}</label>
                <select value={selectedCountryId || ''} onChange={e => setSelectedCountryId(Number(e.target.value))}
                  className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm">
                  <option value="">{t('destinationsAdmin.cityModal.countryPlaceholder')}</option>
                  {countries.map(c => <option key={c.id} value={c.id}>{c.label || c.name_ar || c.name_en || c.name || `Country ${c.id}`}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('destinationsAdmin.cityModal.cityName')}</label>
                <input value={newCityName} onChange={e => setNewCityName(e.target.value)}
                  className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder={t('destinationsAdmin.cityModal.cityNamePlaceholder')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('destinationsAdmin.cityModal.description')}</label>
                <textarea value={newCityDescription} onChange={e => setNewCityDescription(e.target.value)}
                  className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" rows={3}
                  placeholder={t('destinationsAdmin.cityModal.descriptionPlaceholder')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('destinationsAdmin.cityModal.image')}</label>
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageChange(e.target.files?.[0] || null)} />
                  {imagePreview
                    ? <div className="relative rounded-xl overflow-hidden h-40 border-2 border-blue-300">
                        <img src={imagePreview} className="w-full h-full object-cover" alt="preview" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-lg">{t('destinationsAdmin.cityModal.changeImage')}</span>
                        </div>
                      </div>
                    : <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors">
                        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">{t('destinationsAdmin.cityModal.uploadHint')}</p>
                        <p className="text-xs text-gray-400 mt-1">{t('destinationsAdmin.cityModal.uploadFormats')}</p>
                      </div>
                  }
                </label>
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setShowCityModal(false)}
                className="flex-1 py-3 border-2 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm">
                {t('destinationsAdmin.cityModal.cancel')}
              </button>
              <button onClick={saveCity} disabled={saving}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 text-sm shadow-sm shadow-blue-200">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingCity ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingCity ? t('destinationsAdmin.cityModal.saveEdit') : t('destinationsAdmin.cityModal.addCity')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Country Modal */}
      {showCountryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{t('destinationsAdmin.countryModal.title')}</h2>
              <button onClick={() => setShowCountryModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('destinationsAdmin.countryModal.countryName')}</label>
              <input value={newCountryName} onChange={e => setNewCountryName(e.target.value)}
                className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder={t('destinationsAdmin.countryModal.countryPlaceholder')} />
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setShowCountryModal(false)}
                className="flex-1 py-3 border-2 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm">
                {t('destinationsAdmin.countryModal.cancel')}
              </button>
              <button onClick={async () => {
                if (!newCountryName.trim()) { addToast('warning', t('destinationsAdmin.toasts.countryNameRequired')); return; }
                try {
                  const res = await apiFetch(`/api/v1/locations/countries/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newCountryName }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setCountries(prev => [...prev, data]);
                    setNewCountryName('');
                    setShowCountryModal(false);
                    addToast('success', `✅ ${t('destinationsAdmin.toasts.countryAdded').replace('{name}', data.name)}`);
                  } else { addToast('error', t('destinationsAdmin.toasts.countryAddFail')); }
                } catch { addToast('error', t('destinationsAdmin.toasts.connectFail')); }
              }}
                className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors text-sm flex items-center justify-center gap-2">
                <Globe className="w-4 h-4" /> {t('destinationsAdmin.countryModal.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
