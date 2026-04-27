import { useState, useEffect } from 'react';
import {
  Search, Edit, User, Phone, Mail,
  X, Loader2, CheckCircle2, XCircle, AlertTriangle,
  ChevronLeft, ChevronRight, Eye, Calendar,
  Shield, Users, UserPlus, Building2
} from 'lucide-react';
import { apiFetch } from '../../services/apiFetch';
import type { AuthUser } from '../../services/authService';
import { useLanguage } from '../../hooks/useLanguage';

interface Agency { id: number; name: string; }

interface StaffUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  agency: number | null;
  agency_name: string | null;
  is_active: boolean;
  date_joined: string;
  password?: string;
}

type ToastType = 'success' | 'error' | 'warning';
interface Toast { id: number; type: ToastType; message: string; }

const DATE_LOCALE: Record<string, string> = { ar: 'ar-SA', en: 'en-US', ms: 'ms-MY' };

const ROLE_VALUES = ['super_admin', 'admin', 'agency', 'tourist'] as const;
const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin:       'bg-blue-100 text-blue-700',
  agency:      'bg-emerald-100 text-emerald-700',
  tourist:     'bg-gray-100 text-gray-600',
};

const emptyForm = () => ({
  username: '', email: '', first_name: '', last_name: '',
  phone: '', role: 'tourist', agency: '', is_active: true, password: '',
});

function ToastList({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-sm px-4">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium ${t.type==='success'?'bg-emerald-500':t.type==='error'?'bg-red-500':'bg-amber-500'}`}>
          {t.type==='success'?<CheckCircle2 className="w-5 h-5 shrink-0"/>:t.type==='error'?<XCircle className="w-5 h-5 shrink-0"/>:<AlertTriangle className="w-5 h-5 shrink-0"/>}
          <span className="flex-1">{t.message}</span>
          <button onClick={()=>remove(t.id)}><X className="w-4 h-4 opacity-70 hover:opacity-100"/></button>
        </div>
      ))}
    </div>
  );
}

interface Props { user?: AuthUser | null; }

export function CustomersManagement({ user }: Props = {}) {
  const { t, lang, isRTL } = useLanguage();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const getRoleLabel = (role: string) => t(`customersMgmt.roles.${role}`);
  const getRoleColor = (role: string) => ROLE_COLORS[role] || ROLE_COLORS.tourist;

  const [users, setUsers]             = useState<StaffUser[]>([]);
  const [agencies, setAgencies]       = useState<Agency[]>([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [toasts, setToasts]           = useState<Toast[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter]   = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal]     = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [viewUser, setViewUser]       = useState<StaffUser | null>(null);
  const [form, setForm]               = useState(emptyForm());

  const itemsPerPage = 10;

  const addToast = (type: ToastType, message: string) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 4000);
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [uRes, aRes] = await Promise.all([
        apiFetch('/api/v1/accounts/users/'),
        isAdmin ? apiFetch('/api/v1/accounts/agencies/') : Promise.resolve(null),
      ]);
      if (uRes.ok) setUsers(await uRes.json());
      if (aRes?.ok) setAgencies(await aRes.json());
    } catch { addToast('error', t('customersMgmt.loadFail')); }
    finally { setLoading(false); }
  };

  const filtered = users.filter(u => {
    const fullName = `${u.first_name} ${u.last_name} ${u.username}`.toLowerCase();
    const matchSearch = fullName.includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openAdd = () => {
    setEditingUser(null);
    setForm({ ...emptyForm(), role: isAdmin ? 'tourist' : 'agency' });
    setShowModal(true);
  };

  const openEdit = (u: StaffUser) => {
    setEditingUser(u);
    setForm({
      username: u.username, email: u.email,
      first_name: u.first_name, last_name: u.last_name,
      phone: u.phone, role: u.role,
      agency: u.agency?.toString() || '',
      is_active: u.is_active, password: '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.username.trim()) { addToast('warning', t('customersMgmt.toasts.usernameRequired')); return; }
    if (!editingUser && !form.password) { addToast('warning', t('customersMgmt.toasts.passwordRequired')); return; }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        username:   form.username,
        email:      form.email,
        first_name: form.first_name,
        last_name:  form.last_name,
        phone:      form.phone,
        is_active:  form.is_active,
      };
      if (isAdmin) {
        payload.role = form.role;
        if (form.agency) payload.agency = Number(form.agency);
      }
      if (form.password) payload.password = form.password;

      const url    = editingUser ? `/api/v1/accounts/users/${editingUser.id}/` : '/api/v1/accounts/users/create/';
      const method = editingUser ? 'PATCH' : 'POST';
      const res    = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        addToast('error', Object.values(err).flat().join(' | ') as string);
        return;
      }
      const saved: StaffUser = await res.json();
      setUsers(p => editingUser ? p.map(u => u.id === saved.id ? saved : u) : [...p, saved]);
      setShowModal(false);
      const msg = editingUser
        ? t('customersMgmt.toasts.edited').replace('{name}', saved.username)
        : t('customersMgmt.toasts.added').replace('{name}', saved.username);
      addToast('success', msg);
    } catch { addToast('error', t('customersMgmt.toasts.connectError')); }
    finally { setSaving(false); }
  };

  const toggleActive = async (u: StaffUser) => {
    try {
      const res = await apiFetch(`/api/v1/accounts/users/${u.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !u.is_active }),
      });
      if (res.ok) {
        setUsers(p => p.map(s => s.id === u.id ? { ...s, is_active: !s.is_active } : s));
        const msg = !u.is_active
          ? t('customersMgmt.toasts.activated').replace('{name}', u.username)
          : t('customersMgmt.toasts.deactivated').replace('{name}', u.username);
        addToast('success', msg);
      }
    } catch { addToast('error', t('customersMgmt.toasts.connectError')); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      <p className="text-gray-500">{t('customersMgmt.loadingMsg')}</p>
    </div>
  );

  const HEADERS_ADMIN: Record<string, string[]> = {
    ar: ['المستخدم','البريد الإلكتروني','الدور','الوكالة','تاريخ الانضمام','الحالة','إجراءات'],
    en: ['User','Email','Role','Agency','Joined','Status','Actions'],
    ms: ['Pengguna','E-mel','Peranan','Agensi','Tarikh Sertai','Status','Tindakan'],
  };
  const HEADERS_AGENCY: Record<string, string[]> = {
    ar: ['الموظف','البريد الإلكتروني','الهاتف','تاريخ الانضمام','الحالة','إجراءات'],
    en: ['Staff','Email','Phone','Joined','Status','Actions'],
    ms: ['Kakitangan','E-mel','Telefon','Tarikh Sertai','Status','Tindakan'],
  };
  const headers = isAdmin
    ? (HEADERS_ADMIN[lang] || HEADERS_ADMIN.en)
    : (HEADERS_AGENCY[lang] || HEADERS_AGENCY.en);
  const align = isRTL ? 'text-right' : 'text-left';

  return (
    <div className="max-w-7xl mx-auto space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <ToastList toasts={toasts} remove={id => setToasts(p => p.filter(x => x.id !== id))} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? t('customersMgmt.titleAdmin') : t('customersMgmt.titleAgency')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin
              ? t('customersMgmt.subtitleAdmin')
              : t('customersMgmt.subtitleAgency')
                  .replace('{agency}', user?.agency_name || '-')
                  .replace('{n}', String(users.length))
            }
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm">
          <UserPlus className="w-4 h-4"/>
          {isAdmin ? t('customersMgmt.addUser') : t('customersMgmt.addStaff')}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isAdmin ? (
          ROLE_VALUES.map(role => (
            <div key={role} className="bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getRoleColor(role)}`}>
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{users.filter(u => u.role === role).length}</p>
                <p className="text-sm text-gray-500">{getRoleLabel(role)}</p>
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{users.length}</p>
                <p className="text-sm text-gray-500">{t('customersMgmt.statsAgency.total')}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{users.filter(u => u.is_active).length}</p>
                <p className="text-sm text-gray-500">{t('customersMgmt.statsAgency.active')}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-50">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{users.filter(u => !u.is_active).length}</p>
                <p className="text-sm text-gray-500">{t('customersMgmt.statsAgency.inactive')}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-50">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 truncate text-base">{user?.agency_name || '-'}</p>
                <p className="text-sm text-gray-500">{t('customersMgmt.statsAgency.agency')}</p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-white border rounded-2xl p-4 flex flex-col md:flex-row gap-3 shadow-sm">
        <div className="flex-1 relative">
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
          <input type="text" placeholder={isAdmin ? t('customersMgmt.searchAdmin') : t('customersMgmt.searchAgency')}
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`} />
        </div>
        {isAdmin && (
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className="border p-2.5 rounded-xl text-sm md:w-44 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">{t('customersMgmt.allRoles')}</option>
            {ROLE_VALUES.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
          </select>
        )}
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className={`px-5 py-4 ${align} text-xs font-semibold text-gray-500 uppercase tracking-wider`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.length === 0 ? (
              <tr><td colSpan={headers.length} className="py-16 text-center">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400 text-sm">
                  {isAdmin ? t('customersMgmt.empty.noResults') : t('customersMgmt.empty.noStaff')}
                </p>
              </td></tr>
            ) : paginated.map(u => {
              const fullName = `${u.first_name} ${u.last_name}`.trim() || u.username;
              const initials = fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
              return (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{fullName}</p>
                        <p className="text-xs text-gray-400">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{u.email || '-'}</td>
                  {isAdmin ? (
                    <>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getRoleColor(u.role)}`}>{getRoleLabel(u.role)}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{u.agency_name || '-'}</td>
                    </>
                  ) : (
                    <td className="px-5 py-3 text-sm text-gray-600" dir="ltr">{u.phone || '-'}</td>
                  )}
                  <td className="px-5 py-3 text-sm text-gray-500">
                    {new Date(u.date_joined).toLocaleDateString(DATE_LOCALE[lang] || 'en-US')}
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleActive(u)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer transition-colors ${u.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                      {u.is_active ? t('customersMgmt.statusActive') : t('customersMgmt.statusInactive')}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setViewUser(u)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"><Eye className="w-4 h-4"/></button>
                      <button onClick={() => openEdit(u)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"><Edit className="w-4 h-4"/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border rounded-2xl px-6 py-4 shadow-sm">
          <span className="text-sm text-gray-500">
            {t('customersMgmt.pagination')
              .replace('{from}', String((currentPage-1)*itemsPerPage+1))
              .replace('{to}', String(Math.min(currentPage*itemsPerPage, filtered.length)))
              .replace('{total}', String(filtered.length))}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(p-1, 1))} disabled={currentPage===1}
              className="flex items-center gap-1 px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">
              {isRTL ? <ChevronRight className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>}
              {t('customersMgmt.prev')}
            </button>
            {Array.from({length: Math.min(totalPages, 5)}, (_, i) => i+1).map(p => (
              <button key={p} onClick={() => setCurrentPage(p)}
                className={`w-9 h-9 rounded-xl text-sm font-medium ${currentPage===p?'bg-blue-600 text-white':'hover:bg-gray-100 text-gray-600'}`}>{p}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))} disabled={currentPage===totalPages}
              className="flex items-center gap-1 px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">
              {t('customersMgmt.next')}
              {isRTL ? <ChevronLeft className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
            </button>
          </div>
        </div>
      )}

      {viewUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">{isAdmin ? t('customersMgmt.viewModal.titleAdmin') : t('customersMgmt.viewModal.titleAgency')}</h2>
              <button onClick={() => setViewUser(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5"/></button>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
                {`${viewUser.first_name?.[0]||''}${viewUser.last_name?.[0]||''}`.toUpperCase() || viewUser.username[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold">{`${viewUser.first_name} ${viewUser.last_name}`.trim() || viewUser.username}</h3>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getRoleColor(viewUser.role)}`}>
                  {getRoleLabel(viewUser.role)}
                </span>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { icon: <User className="w-4 h-4"/>,     label: t('customersMgmt.viewModal.username'), value: viewUser.username },
                { icon: <Mail className="w-4 h-4"/>,     label: t('customersMgmt.viewModal.email'),    value: viewUser.email || '-' },
                { icon: <Phone className="w-4 h-4"/>,    label: t('customersMgmt.viewModal.phone'),    value: viewUser.phone || '-' },
                { icon: <Calendar className="w-4 h-4"/>, label: t('customersMgmt.viewModal.joined'),   value: new Date(viewUser.date_joined).toLocaleDateString(DATE_LOCALE[lang] || 'en-US') },
                ...(isAdmin && viewUser.agency_name ? [{ icon: <Building2 className="w-4 h-4"/>, label: t('customersMgmt.viewModal.agency'), value: viewUser.agency_name }] : []),
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-400">{item.icon}</span>
                  <span className="text-gray-500 w-32">{item.label}</span>
                  <span className="font-medium text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setViewUser(null)} className="w-full mt-6 py-3 border-2 rounded-xl font-medium hover:bg-gray-50 text-sm">{t('customersMgmt.viewModal.close')}</button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">
                {editingUser
                  ? (isAdmin ? t('customersMgmt.formModal.titleEditAdmin') : t('customersMgmt.formModal.titleEditAgency'))
                  : (isAdmin ? t('customersMgmt.formModal.titleNewAdmin') : t('customersMgmt.formModal.titleNewAgency'))}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5"/></button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('customersMgmt.formModal.firstName')}</label>
                  <input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})}
                    className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder={t('customersMgmt.formModal.firstNamePh')}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('customersMgmt.formModal.lastName')}</label>
                  <input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})}
                    className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder={t('customersMgmt.formModal.lastNamePh')}/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('customersMgmt.formModal.username')}</label>
                <input value={form.username} onChange={e => setForm({...form, username: e.target.value})}
                  className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder={t('customersMgmt.formModal.usernamePh')} dir="ltr"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('customersMgmt.formModal.email')}</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder={t('customersMgmt.formModal.emailPh')} dir="ltr"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('customersMgmt.formModal.phone')}</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder={t('customersMgmt.formModal.phonePh')} dir="ltr"/>
              </div>

              {isAdmin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('customersMgmt.formModal.role')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {ROLE_VALUES.map(r => (
                        <button key={r} type="button" onClick={() => setForm({...form, role: r})}
                          className={`py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all ${align} ${form.role === r ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-200'}`}>
                          {getRoleLabel(r)}
                        </button>
                      ))}
                    </div>
                  </div>
                  {(form.role === 'agency') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('customersMgmt.formModal.agency')}</label>
                      <select value={form.agency} onChange={e => setForm({...form, agency: e.target.value})}
                        className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                        <option value="">{t('customersMgmt.formModal.selectAgency')}</option>
                        {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  )}
                </>
              )}

              {!isAdmin && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-blue-500 shrink-0"/>
                  <div>
                    <p className="text-sm font-medium text-blue-800">{t('customersMgmt.formModal.agencyNotice').replace('{agency}', user?.agency_name || '-')}</p>
                    <p className="text-xs text-blue-500">{t('customersMgmt.formModal.agencyRoleNotice')}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {editingUser ? t('customersMgmt.formModal.passwordNew') : t('customersMgmt.formModal.passwordRequired')}
                </label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder={t('customersMgmt.formModal.passwordPh')} dir="ltr"/>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})}
                  className="w-5 h-5 accent-blue-600 rounded"/>
                <span className="text-sm font-medium text-gray-700">{t('customersMgmt.formModal.activeLabel')}</span>
              </label>
            </div>

            <div className="flex gap-3 p-6 border-t">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border-2 rounded-xl font-medium hover:bg-gray-50 text-sm">{t('customersMgmt.formModal.cancel')}</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-60 text-sm">
                {saving
                  ? (<><Loader2 className="w-4 h-4 animate-spin"/>{t('customersMgmt.formModal.saving')}</>)
                  : (<><UserPlus className="w-4 h-4"/>{editingUser
                      ? t('customersMgmt.formModal.saveEdit')
                      : (isAdmin ? t('customersMgmt.formModal.addUser') : t('customersMgmt.formModal.addStaff'))}</>)
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
