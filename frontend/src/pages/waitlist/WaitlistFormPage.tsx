// src/pages/waitlist/WaitlistFormPage.tsx
import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faArrowRight, faCheckCircle,
  faUser, faEnvelope, faPhone, faBuilding, faLocationDot,
  faTriangleExclamation, faUpload, faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../../hooks/useLanguage';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { CountryCityPicker } from '../../components/forms/CountryCityPicker';

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// ── Subtype Configs ────────────────────────────────────────
const SUBTYPES: Record<string, {
  en: { label: string; options: { v: string; l: string }[]; fields: { key: string; label_en: string; label_ar: string; label_ms: string; type: string; options?: { v: string; l_en: string; l_ar: string; l_ms: string }[] }[] };
  ar: { label: string };
  ms: { label: string };
}> = {
  property: {
    en: {
      label: 'Property Type',
      options: [
        { v: 'HOTEL', l: 'Hotel' }, { v: 'GUESTHOUSE', l: 'Guesthouse' }, { v: 'BED_BREAKFAST', l: 'Bed & Breakfast' },
        { v: 'HOMESTAY', l: 'Homestay' }, { v: 'HOSTEL', l: 'Hostel' }, { v: 'CONDO_HOTEL', l: 'Condo Hotel' },
        { v: 'RESORT', l: 'Resort' }, { v: 'CAPSULE_HOTEL', l: 'Capsule Hotel' }, { v: 'FLOATING', l: 'Floating House' },
        { v: 'MOTEL', l: 'Motel' }, { v: 'LODGE', l: 'Lodge' }, { v: 'RIAD', l: 'Riad' },
      ],
      fields: [
        { key: 'rooms_count', label_en: 'Number of Rooms/Units', label_ar: 'عدد الغرف / الوحدات', label_ms: 'Bilangan Bilik/Unit', type: 'number' },
        { key: 'star_rating', label_en: 'Star Rating (1-5)', label_ar: 'تصنيف النجوم (1-5)', label_ms: 'Penarafan Bintang', type: 'number' },
        { key: 'listed_online', label_en: 'Listed on Booking/Agoda/Airbnb?', label_ar: 'مسجل في Booking/Agoda/Airbnb؟', label_ms: 'Disenaraikan di Booking/Agoda/Airbnb?', type: 'boolean' },
      ],
    },
    ar: { label: 'نوع العقار' },
    ms: { label: 'Jenis Hartanah' },
  },
  transport: {
    en: {
      label: 'Transport Type',
      options: [
        { v: 'BUS', l: 'Tourist Bus' }, { v: 'PRIVATE_CAR', l: 'Private Car with Driver' },
        { v: 'MINIBUS', l: 'Minibus' }, { v: 'HELICOPTER', l: 'Helicopter' },
        { v: 'BOAT', l: 'Boat / Yacht' }, { v: 'FERRY', l: 'Ferry' },
        { v: 'MOTORCYCLE', l: 'Motorcycle' }, { v: 'TAXI', l: 'Taxi' },
      ],
      fields: [
        { key: 'vehicles_count', label_en: 'Number of Vehicles', label_ar: 'عدد المركبات', label_ms: 'Bilangan Kenderaan', type: 'number' },
        { key: 'has_license', label_en: 'Tourism License?', label_ar: 'لديك رخصة سياحية؟', label_ms: 'Lesen Pelancongan?', type: 'boolean' },
        // 🆕 الأسعار
        { key: 'price_airport_transfer', label_en: 'Airport Transfer Price (MYR)', label_ar: 'سعر نقل المطار (رينغيت)', label_ms: 'Harga Pemindahan Lapangan Terbang (MYR)', type: 'number' },
        { key: 'price_hourly', label_en: 'Hourly Rate (MYR)', label_ar: 'سعر الساعة (رينغيت)', label_ms: 'Harga Sejam (MYR)', type: 'number' },
        { key: 'price_intercity', label_en: 'Intercity Trip Price (MYR)', label_ar: 'سعر الرحلة بين المدن (رينغيت)', label_ms: 'Harga Antara Bandar (MYR)', type: 'number' },
        { key: 'price_full_day', label_en: 'Full Day Price (8h, MYR)', label_ar: 'سعر اليوم الكامل (8 ساعات، رينغيت)', label_ms: 'Harga Sehari Penuh (8 jam, MYR)', type: 'number' },
      ],
    },
    ar: { label: 'نوع النقل' },
    ms: { label: 'Jenis Pengangkutan' },
  },
  restaurant: {
    en: {
      label: 'Restaurant Type',
      options: [
        { v: 'TRADITIONAL', l: 'Traditional Restaurant' }, { v: 'CAFE', l: 'Cafe' },
        { v: 'FAST_FOOD', l: 'Fast Food' }, { v: 'BUFFET', l: 'Buffet' },
        { v: 'FLOATING', l: 'Floating Restaurant' }, { v: 'HEALTHY', l: 'Healthy / Vegetarian' },
        { v: 'ASIAN', l: 'Specialized Asian' }, { v: 'GRILLS', l: 'Grill Restaurant' },
        { v: 'ENTERTAINMENT', l: 'Entertainment Restaurant' },
      ],
      fields: [
        { key: 'capacity', label_en: 'Seating Capacity', label_ar: 'الطاقة الاستيعابية', label_ms: 'Kapasiti Tempat Duduk', type: 'number' },
        { key: 'is_halal', label_en: 'Halal Certified?', label_ar: 'حلال معتمد؟', label_ms: 'Halal Diperakui?', type: 'boolean' },
        // 🆕 الأسعار
        { key: 'price_per_person', label_en: 'Avg Meal Price per Person (MYR)', label_ar: 'متوسط سعر الوجبة للشخص (رينغيت)', label_ms: 'Purata Harga Hidangan / Orang (MYR)', type: 'number' },
        { key: 'price_set_menu', label_en: 'Set Menu Price (MYR, optional)', label_ar: 'سعر القائمة الثابتة (رينغيت، اختياري)', label_ms: 'Harga Menu Set (MYR, pilihan)', type: 'number' },
      ],
    },
    ar: { label: 'نوع المطعم' },
    ms: { label: 'Jenis Restoran' },
  },
  guide: {
    en: {
      label: 'Specialties (multiple)',
      options: [
        { v: 'GENERAL', l: 'General Guide' }, { v: 'NATURE', l: 'Nature / Adventure' },
        { v: 'HISTORICAL', l: 'Historical / Cultural' }, { v: 'DIVING', l: 'Diving & Water Activities' },
        { v: 'FOOD', l: 'Food Tourism' }, { v: 'PHOTOGRAPHY', l: 'Photography' },
        { v: 'HALAL', l: 'Islamic / Halal Tourism' },
      ],
      fields: [
        { key: 'experience_years', label_en: 'Years of Experience', label_ar: 'سنوات الخبرة', label_ms: 'Tahun Pengalaman', type: 'number' },
        { key: 'accepts_groups', label_en: 'Accept Groups?', label_ar: 'تقبل مجموعات؟', label_ms: 'Terima Kumpulan?', type: 'boolean' },
        { key: 'has_license', label_en: 'Guide License?', label_ar: 'رخصة مرشد؟', label_ms: 'Lesen Pemandu?', type: 'boolean' },
        // 🆕 الأسعار
        { key: 'price_half_day', label_en: 'Half Day Price (4h, MYR)', label_ar: 'سعر نصف يوم (4 ساعات، رينغيت)', label_ms: 'Harga Separuh Hari (4 jam, MYR)', type: 'number' },
        { key: 'price_full_day', label_en: 'Full Day Price (8h, MYR)', label_ar: 'سعر يوم كامل (8 ساعات، رينغيت)', label_ms: 'Harga Sehari Penuh (8 jam, MYR)', type: 'number' },
        { key: 'price_hourly', label_en: 'Hourly Rate (MYR)', label_ar: 'سعر الساعة (رينغيت)', label_ms: 'Harga Sejam (MYR)', type: 'number' },
      ],
    },
    ar: { label: 'التخصصات (يمكن اختيار أكثر من واحد)' },
    ms: { label: 'Kepakaran (boleh pilih lebih satu)' },
  },
  activity: {
    en: {
      label: 'Activity Types (multiple)',
      options: [
        { v: 'DIVING', l: 'Diving & Water' }, { v: 'CLIMBING', l: 'Climbing & Adventure' },
        { v: 'THEME_PARK', l: 'Theme Park' }, { v: 'SPORTS', l: 'Sports' },
        { v: 'CULTURAL', l: 'Cultural Shows' }, { v: 'YOGA', l: 'Yoga & Meditation' },
        { v: 'CYCLING', l: 'Cycling' }, { v: 'FISHING', l: 'Fishing' },
        { v: 'ECO_TOURISM', l: 'Eco Tourism' },
      ],
      fields: [
        { key: 'capacity', label_en: 'Max Capacity (persons)', label_ar: 'الطاقة الاستيعابية', label_ms: 'Kapasiti Maksimum', type: 'number' },
        { key: 'suitable_kids', label_en: 'Suitable for Kids?', label_ar: 'مناسب للأطفال؟', label_ms: 'Sesuai untuk Kanak?', type: 'boolean' },
        { key: 'has_insurance', label_en: 'Has Insurance?', label_ar: 'لديك تأمين؟', label_ms: 'Ada Insurans?', type: 'boolean' },
        { key: 'has_license', label_en: 'Has License?', label_ar: 'لديك رخصة؟', label_ms: 'Ada Lesen?', type: 'boolean' },
        // 🆕 الأسعار
        { key: 'price_per_person', label_en: 'Price per Person (MYR)', label_ar: 'سعر النشاط للشخص (رينغيت)', label_ms: 'Harga / Orang (MYR)', type: 'number' },
        { key: 'price_per_group', label_en: 'Price per Group (MYR, optional)', label_ar: 'سعر النشاط للمجموعة (رينغيت، اختياري)', label_ms: 'Harga / Kumpulan (MYR, pilihan)', type: 'number' },
        { key: 'min_group_size', label_en: 'Minimum Group Size', label_ar: 'الحد الأدنى للأشخاص', label_ms: 'Saiz Kumpulan Minimum', type: 'number' },
      ],
    },
    ar: { label: 'أنواع الأنشطة (يمكن اختيار أكثر من واحد)' },
    ms: { label: 'Jenis Aktiviti (boleh pilih lebih satu)' },
  },
  wellness: {
    en: {
      label: 'Wellness Types (multiple)',
      options: [
        { v: 'SPA', l: 'Traditional Spa' }, { v: 'SALON', l: 'Beauty Salon' },
        { v: 'YOGA_CENTER', l: 'Yoga & Meditation Center' }, { v: 'GYM', l: 'Gym' },
        { v: 'ALTERNATIVE', l: 'Alternative Medicine' }, { v: 'HAMMAM', l: 'Hammam' },
        { v: 'NUTRITION', l: 'Nutrition Center' },
      ],
      fields: [
        { key: 'capacity', label_en: 'Capacity (persons at once)', label_ar: 'السعة في نفس الوقت', label_ms: 'Kapasiti Serentak', type: 'number' },
        { key: 'is_halal_certified', label_en: 'Halal Certified?', label_ar: 'حلال معتمد؟', label_ms: 'Halal Diperakui?', type: 'boolean' },
        { key: 'has_license', label_en: 'Has License?', label_ar: 'لديك رخصة؟', label_ms: 'Ada Lesen?', type: 'boolean' },
        // 🆕 الأسعار
        { key: 'price_per_session', label_en: 'Price per Session (MYR)', label_ar: 'سعر الجلسة (رينغيت)', label_ms: 'Harga / Sesi (MYR)', type: 'number' },
        { key: 'session_duration_min', label_en: 'Session Duration (minutes)', label_ar: 'مدة الجلسة (دقيقة)', label_ms: 'Tempoh Sesi (minit)', type: 'number' },
        { key: 'price_package', label_en: 'Package Price (MYR, optional)', label_ar: 'سعر الباقة (رينغيت، اختياري)', label_ms: 'Harga Pakej (MYR, pilihan)', type: 'number' },
      ],
    },
    ar: { label: 'أنواع الخدمات (يمكن اختيار أكثر من واحد)' },
    ms: { label: 'Jenis Wellness (boleh pilih lebih satu)' },
  },
  other: {
    en: {
      label: 'Service Types (multiple)',
      options: [
        { v: 'PHOTOGRAPHY', l: 'Photography / Video' }, { v: 'EVENTS', l: 'Events & Parties' },
        { v: 'SHOPPING', l: 'Shopping & Crafts' }, { v: 'RELIGIOUS', l: 'Religious Services' },
        { v: 'MEDICAL', l: 'Medical Tourism' }, { v: 'EDUCATIONAL', l: 'Educational Courses' },
        { v: 'PROTOCOL', l: 'Protocol & Translation' },
      ],
      fields: [
        { key: 'service_description', label_en: 'Brief Service Description', label_ar: 'وصف مختصر للخدمة', label_ms: 'Penerangan Ringkas', type: 'textarea' },
        { key: 'has_license', label_en: 'Has License / Certificate?', label_ar: 'لديك رخصة أو شهادة؟', label_ms: 'Ada Lesen/Sijil?', type: 'boolean' },
        // 🆕 الأسعار
        { key: 'base_price', label_en: 'Base Price (MYR)', label_ar: 'السعر الأساسي (رينغيت)', label_ms: 'Harga Asas (MYR)', type: 'number' },
        { key: 'pricing_notes', label_en: 'Additional Pricing Notes', label_ar: 'ملاحظات إضافية للتسعير', label_ms: 'Nota Tambahan Harga', type: 'textarea' },
      ],
    },
    ar: { label: 'أنواع الخدمات (يمكن اختيار أكثر من واحد)' },
    ms: { label: 'Jenis Perkhidmatan (boleh pilih lebih satu)' },
  },
};

const MULTIPLE_SELECT_TYPES = ['guide', 'activity', 'wellness', 'other'];
const ENDPOINT_MAP: Record<string, string> = {
  property: 'property', transport: 'transport', restaurant: 'restaurant',
  guide: 'guide', activity: 'activity', wellness: 'wellness', other: 'other',
};

const HOW_DID_YOU_HEAR = [
  { v: 'SOCIAL_MEDIA', en: 'Social Media', ar: 'وسائل التواصل الاجتماعي', ms: 'Media Sosial' },
  { v: 'REFERRAL', en: 'Referral', ar: 'توصية من شخص', ms: 'Rujukan' },
  { v: 'GOOGLE', en: 'Google Search', ar: 'بحث على Google', ms: 'Carian Google' },
  { v: 'EVENT', en: 'Event / Expo', ar: 'معرض أو فعالية', ms: 'Acara / Pameran' },
  { v: 'OTHER', en: 'Other', ar: 'أخرى', ms: 'Lain-lain' },
];

const MALAYSIA_CITIES = [
  'Kuala Lumpur', 'Langkawi', 'Penang', 'Melaka', 'Johor Bahru',
  'Kota Kinabalu', 'Kuching', 'Ipoh', 'Shah Alam', 'Putrajaya',
  'Petaling Jaya', 'Subang Jaya', 'Cyberjaya', 'Seremban', 'Alor Setar',
];

// ── Documents Config ───────────────────────────────────────
const DOCS_CONFIG: Record<string, { key: string; label_en: string; label_ar: string; label_ms: string; required: boolean }[]> = {
  property:   [{ key: 'property_photo',    label_en: 'Property Photo',              label_ar: 'صورة العقار',                label_ms: 'Foto Hartanah',         required: true },  { key: 'license_doc',       label_en: 'Operating License',           label_ar: 'رخصة التشغيل',              label_ms: 'Lesen Operasi',         required: true  }],
  transport:  [{ key: 'vehicle_license',   label_en: 'Vehicle License',             label_ar: 'رخصة المركبة',               label_ms: 'Lesen Kenderaan',       required: true },  { key: 'tourism_license',   label_en: 'Tourism License',             label_ar: 'رخصة النقل السياحي',        label_ms: 'Lesen Pelancongan',     required: false }],
  restaurant: [{ key: 'restaurant_license', label_en: 'Restaurant License',         label_ar: 'رخصة المطعم',                label_ms: 'Lesen Restoran',        required: true },  { key: 'halal_certificate', label_en: 'Halal Certificate (if any)',  label_ar: 'شهادة الحلال (إن وجدت)',    label_ms: 'Sijil Halal (jika ada)', required: false }],
  guide:      [{ key: 'id_document',       label_en: 'ID Document',                 label_ar: 'بطاقة الهوية',               label_ms: 'Dokumen ID',            required: true },  { key: 'guide_license',     label_en: 'Guide License',               label_ar: 'رخصة المرشد',               label_ms: 'Lesen Pemandu',         required: true  }],
  activity:   [{ key: 'activity_license',  label_en: 'Activity License',            label_ar: 'رخصة النشاط',                label_ms: 'Lesen Aktiviti',        required: true },  { key: 'insurance_doc',     label_en: 'Insurance Doc',               label_ar: 'وثيقة التأمين',             label_ms: 'Dokumen Insurans',      required: true  }],
  wellness:   [{ key: 'wellness_license',  label_en: 'Operating License',           label_ar: 'رخصة التشغيل',              label_ms: 'Lesen Operasi',         required: true },  { key: 'staff_certificates', label_en: 'Staff Certificates',         label_ar: 'شهادات الكوادر',            label_ms: 'Sijil Kakitangan',      required: false }],
  other:      [{ key: 'id_document',       label_en: 'ID Document',                 label_ar: 'بطاقة الهوية',               label_ms: 'Dokumen ID',            required: true },  { key: 'service_proof',     label_en: 'Service Proof',               label_ar: 'إثبات الخدمة',              label_ms: 'Bukti Perkhidmatan',    required: false }],
};

// ── Main Component ─────────────────────────────────────────
export function WaitlistFormPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { lang, changeLang, t, isRTL } = useLanguage();
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const config = SUBTYPES[type || ''];
  const isMulti = MULTIPLE_SELECT_TYPES.includes(type || '');
  const docs = DOCS_CONFIG[type || ''] || [];

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [refNum, setRefNum] = useState('');
  const [error, setError] = useState('');

  // Form state
  const [form, setForm] = useState<Record<string, unknown>>({
    full_name: '', email: '', phone: '', company_name: '',
    country: '', country_code: '',
    city: '', region: '', worked_before: false,
    // 🆕 المراجع الصحيحة (IDs من قاعدة البيانات)
    country_ref: null, city_ref: null,
    sync_mode: 'MANUAL', channel_name: '',
    how_did_you_hear: '', how_did_you_hear_other: '',
    subtype: isMulti ? [] : '',
  });
  const [files, setFiles] = useState<Record<string, File | null>>({});

  if (!config) {
    navigate('/register/supplier');
    return null;
  }

  const setField = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const toggleMulti = (v: string) => {
    const current = (form.subtype as string[]) || [];
    setField('subtype', current.includes(v) ? current.filter(x => x !== v) : [...current, v]);
  };

  // Labels
  const L = {
    back:     lang === 'ar' ? 'السابق' : lang === 'ms' ? 'Kembali' : 'Back',
    next:     lang === 'ar' ? 'التالي' : lang === 'ms' ? 'Seterusnya' : 'Next',
    submit:   lang === 'ar' ? 'إرسال الطلب' : lang === 'ms' ? 'Hantar Permohonan' : 'Submit Application',
    required: lang === 'ar' ? 'مطلوب' : lang === 'ms' ? 'Diperlukan' : 'Required',
    optional: lang === 'ar' ? 'اختياري' : lang === 'ms' ? 'Pilihan' : 'Optional',
    step1:    lang === 'ar' ? 'اختيار النوع' : lang === 'ms' ? 'Pilih Jenis' : 'Select Type',
    step2:    lang === 'ar' ? 'المعلومات الأساسية' : lang === 'ms' ? 'Maklumat Asas' : 'Basic Info',
    step3:    lang === 'ar' ? 'الوثائق والإرسال' : lang === 'ms' ? 'Dokumen & Hantar' : 'Documents & Submit',
    subtypeLabel: lang === 'ar'
      ? (config.ar as { label: string }).label
      : lang === 'ms'
      ? (config.ms as { label: string }).label
      : config.en.label,
  };

  const ic = "w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-colors bg-white";
  const lc = `block text-xs font-semibold text-gray-600 mb-1.5 ${isRTL ? 'text-right' : ''}`;

  // Step validation
  const canProceedStep1 = isMulti
    ? (form.subtype as string[]).length > 0
    : !!form.subtype;

  const canProceedStep2 = !!(
    form.full_name && form.email && form.phone && form.company_name && form.city
    && form.sync_mode
    && (form.sync_mode === 'MANUAL' || form.channel_name)
  );

  // Submit
  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const fd = new FormData();

      // Base fields
      const baseFields = ['full_name', 'email', 'phone', 'company_name', 'country', 'country_code', 'city', 'region', 'worked_before', 'sync_mode', 'channel_name', 'how_did_you_hear', 'how_did_you_hear_other'];
      baseFields.forEach(k => fd.append(k, String(form[k] ?? '')));

      // 🆕 إرسال IDs الصحيحة (إن وُجدت — قد لا تُرسل لو فشل المستخدم في الاختيار من القائمة)
      if (form.country_ref) fd.append('country_ref', String(form.country_ref));
      if (form.city_ref) fd.append('city_ref', String(form.city_ref));

      // Subtype field
      const subtypeKey = isMulti
        ? ({ guide: 'specialties', activity: 'activity_types', wellness: 'wellness_types', other: 'service_types' }[type!] || 'subtypes')
        : ({ property: 'property_type', transport: 'transport_type', restaurant: 'restaurant_type' }[type!] || 'type');

      if (isMulti) {
        fd.append(subtypeKey, JSON.stringify(form.subtype));
      } else {
        fd.append(subtypeKey, form.subtype as string);
      }

      // Extra fields
      config.en.fields.forEach(f => {
        if (form[f.key] !== undefined) {
          fd.append(f.key, String(form[f.key]));
        }
      });

      // Files
      docs.forEach(d => {
        if (files[d.key]) fd.append(d.key, files[d.key]!);
      });

      // UTM
      const urlParams = new URLSearchParams(window.location.search);
      ['utm_source', 'utm_medium', 'utm_campaign'].forEach(u => {
        const val = urlParams.get(u);
        if (val) fd.append(u, val);
      });

      const endpoint = ENDPOINT_MAP[type!] || 'other';
      const res = await fetch(`${BASE}/api/v1/waitlist/${endpoint}/`, {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        const msgs = Object.values(data.errors || data).flat().join(' — ');
        setError(msgs || 'An error occurred. Please try again.');
        return;
      }

      setRefNum(data.ref_number);
      setSuccess(true);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success Screen
  if (success) return (
    <div className="min-h-screen bg-[#F9FAFB]" dir={isRTL ? 'rtl' : 'ltr'}>
      <PublicNavbar
        variant="solid"
        lang={lang}
        onLangChange={changeLang}
        t={t}
        isRTL={isRTL}
        onLogin={() => navigate('/supplier')}
        onSupplier={() => navigate('/register/supplier')}
        onAgency={() => navigate('/register/agency')}
      />
      <div className="pt-16 flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-4xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {lang === 'ar' ? 'تم التسجيل بنجاح!' : lang === 'ms' ? 'Pendaftaran Berjaya!' : 'Registration Successful!'}
          </h2>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 my-4">
            <p className="text-xs text-gray-500 mb-1">
              {lang === 'ar' ? 'رقم المرجع' : lang === 'ms' ? 'Nombor Rujukan' : 'Reference Number'}
            </p>
            <p className="text-xl font-bold text-[#FF6B35] tracking-widest">{refNum}</p>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            {lang === 'ar'
              ? 'تم استلام طلبك. سنتواصل معك عبر البريد الإلكتروني عندما تكون المنصة جاهزة لاستقبالك.'
              : lang === 'ms'
              ? 'Permohonan anda telah diterima. Kami akan menghubungi anda melalui e-mel apabila platform bersedia.'
              : 'Your application has been received. We will contact you by email when the platform is ready to welcome you.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-[#FF6B35] hover:bg-[#e07a38] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {lang === 'ar' ? 'العودة للرئيسية' : lang === 'ms' ? 'Kembali ke Utama' : 'Back to Home'}
            <FontAwesomeIcon icon={isRTL ? faArrowLeft : faArrowRight} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB]" dir={isRTL ? 'rtl' : 'ltr'}>

      <PublicNavbar
        variant="solid"
        lang={lang}
        onLangChange={changeLang}
        t={t}
        isRTL={isRTL}
        onLogin={() => navigate('/supplier')}
        onSupplier={() => navigate('/register/supplier')}
        onAgency={() => navigate('/register/agency')}
      />

      <div className="pt-16 max-w-2xl mx-auto px-4 py-8">

        {/* Back button */}
        <button
          onClick={() => step > 1 ? setStep(s => (s - 1) as 1 | 2 | 3) : navigate('/register/supplier')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#FF6B35] transition-colors mb-6"
        >
          <FontAwesomeIcon icon={isRTL ? faArrowRight : faArrowLeft} className="text-xs" />
          {L.back}
        </button>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${step >= s ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 text-gray-400'}`}>
                {step > s ? <FontAwesomeIcon icon={faCheckCircle} /> : s}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step >= s ? 'text-[#FF6B35]' : 'text-gray-400'}`}>
                {s === 1 ? L.step1 : s === 2 ? L.step2 : L.step3}
              </span>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-[#FF6B35]' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
              <FontAwesomeIcon icon={faTriangleExclamation} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* ── STEP 1 — Subtype Selection ── */}
          {step === 1 && (
            <div>
              <h2 className={`text-xl font-bold text-gray-900 mb-2 ${isRTL ? 'text-right' : ''}`}>
                {L.subtypeLabel}
              </h2>
              <p className={`text-sm text-gray-500 mb-6 ${isRTL ? 'text-right' : ''}`}>
                {isMulti
                  ? (lang === 'ar' ? 'يمكنك اختيار أكثر من نوع' : lang === 'ms' ? 'Anda boleh pilih lebih daripada satu' : 'You can select multiple types')
                  : (lang === 'ar' ? 'اختر نوعاً واحداً' : lang === 'ms' ? 'Pilih satu jenis' : 'Select one type')}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {config.en.options.map(opt => {
                  const selected = isMulti
                    ? (form.subtype as string[]).includes(opt.v)
                    : form.subtype === opt.v;
                  return (
                    <button
                      key={opt.v}
                      onClick={() => isMulti ? toggleMulti(opt.v) : setField('subtype', opt.v)}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all text-center
                        ${selected ? 'border-[#FF6B35] bg-orange-50 text-[#FF6B35]' : 'border-gray-100 text-gray-700 hover:border-orange-200'}`}
                    >
                      {opt.l}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="w-full bg-[#FF6B35] hover:bg-[#e07a38] text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {L.next} <FontAwesomeIcon icon={isRTL ? faArrowLeft : faArrowRight} />
              </button>
            </div>
          )}

          {/* ── STEP 2 — Basic Info ── */}
          {step === 2 && (
            <div>
              <h2 className={`text-xl font-bold text-gray-900 mb-6 ${isRTL ? 'text-right' : ''}`}>
                {L.step2}
              </h2>

              <div className="space-y-4">
                {/* Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lc}>
                      {lang === 'ar' ? 'الاسم الكامل' : lang === 'ms' ? 'Nama Penuh' : 'Full Name'} *
                    </label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faUser} className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 text-sm`} />
                      <input
                        className={ic + (isRTL ? ' pr-9' : ' pl-9')}
                        placeholder={lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                        value={form.full_name as string}
                        onChange={e => setField('full_name', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={lc}>
                      {lang === 'ar' ? 'اسم الشركة / العقار' : lang === 'ms' ? 'Nama Syarikat' : 'Company / Property Name'} *
                    </label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faBuilding} className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 text-sm`} />
                      <input
                        className={ic + (isRTL ? ' pr-9' : ' pl-9')}
                        placeholder={lang === 'ar' ? 'اسم الشركة' : 'Company Name'}
                        value={form.company_name as string}
                        onChange={e => setField('company_name', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lc}>
                      {lang === 'ar' ? 'البريد الإلكتروني' : lang === 'ms' ? 'E-mel' : 'Email'} *
                    </label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faEnvelope} className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 text-sm`} />
                      <input
                        className={ic + (isRTL ? ' pr-9' : ' pl-9')}
                        type="email"
                        placeholder="email@example.com"
                        value={form.email as string}
                        onChange={e => setField('email', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={lc}>
                      {lang === 'ar' ? 'رقم الهاتف' : lang === 'ms' ? 'Nombor Telefon' : 'Phone Number'} *
                    </label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faPhone} className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 text-sm`} />
                      <input
                        className={ic + (isRTL ? ' pr-9' : ' pl-9')}
                        placeholder="+60 12 345 6789"
                        value={form.phone as string}
                        onChange={e => setField('phone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* City & Region */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <CountryCityPicker
                      lang={lang}
                      isRTL={isRTL}
                      required
                      countryLabel={lang === 'ar' ? 'الدولة' : lang === 'ms' ? 'Negara' : 'Country'}
                      cityLabel={lang === 'ar' ? 'المدينة' : lang === 'ms' ? 'Bandar' : 'City'}
                      countryCode={(form as any).country_code || ''}
                      cityName={form.city as string}
                      onCountryChange={(iso, country) => {
                        setField('country_code' as any, iso);
                        setField('country' as any, country?.label || '');
                        setField('city', '');
                        // 🆕 حفظ ID الدولة وتفريغ المدينة
                        setField('country_ref' as any, country?.id ?? null);
                        setField('city_ref' as any, null);
                      }}
                      onCityChange={(name, city) => {
                        setField('city', name);
                        // 🆕 حفظ ID المدينة (يأتي من API)
                        setField('city_ref' as any, city?.id ?? null);
                      }}
                    />
                  </div>
                  <div>
                    <label className={lc}>
                      {lang === 'ar' ? 'المنطقة / الحي' : lang === 'ms' ? 'Kawasan' : 'Region / Area'} ({L.optional})
                    </label>
                    <input
                      className={ic}
                      placeholder={lang === 'ar' ? 'المنطقة' : 'Region'}
                      value={form.region as string}
                      onChange={e => setField('region', e.target.value)}
                    />
                  </div>
                </div>

                {/* Extra fields */}
                {config.en.fields.map(f => (
                  <div key={f.key}>
                    <label className={lc}>
                      {lang === 'ar' ? f.label_ar : lang === 'ms' ? f.label_ms : f.label_en}
                    </label>
                    {f.type === 'boolean' ? (
                      <div className="flex gap-3">
                        {[{ v: 'true', l_en: 'Yes', l_ar: 'نعم', l_ms: 'Ya' }, { v: 'false', l_en: 'No', l_ar: 'لا', l_ms: 'Tidak' }].map(opt => (
                          <button
                            key={opt.v}
                            onClick={() => setField(f.key, opt.v === 'true')}
                            className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                              ${String(form[f.key]) === opt.v ? 'border-[#FF6B35] bg-orange-50 text-[#FF6B35]' : 'border-gray-100 text-gray-600'}`}
                          >
                            {lang === 'ar' ? opt.l_ar : lang === 'ms' ? opt.l_ms : opt.l_en}
                          </button>
                        ))}
                      </div>
                    ) : f.type === 'textarea' ? (
                      <textarea
                        className={ic + ' h-24 resize-none py-3'}
                        value={form[f.key] as string || ''}
                        onChange={e => setField(f.key, e.target.value)}
                      />
                    ) : (
                      <input
                        className={ic}
                        type="number"
                        min="0"
                        value={form[f.key] as string || ''}
                        onChange={e => setField(f.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}

                {/* ══ نمط التزامن (Sync Mode) ══ */}
                <div className="border-t pt-5">
                  <label className={lc + ' mb-3'}>
                    {lang === 'ar' ? 'كيف ستُدخل الأسعار والتوفر؟' : lang === 'ms' ? 'Bagaimana anda akan memasukkan harga & ketersediaan?' : 'How will you manage pricing & availability?'} *
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Manual option */}
                    <button
                      type="button"
                      onClick={() => { setField('sync_mode', 'MANUAL'); setField('channel_name', ''); }}
                      className={`p-4 rounded-xl border-2 text-center transition-all
                        ${form.sync_mode === 'MANUAL' ? 'border-[#FF6B35] bg-orange-50' : 'border-gray-100 hover:border-orange-200'}`}
                    >
                      <div className="text-2xl mb-1">📋</div>
                      <p className={`text-sm font-semibold ${form.sync_mode === 'MANUAL' ? 'text-[#FF6B35]' : 'text-gray-700'}`}>
                        {lang === 'ar' ? 'إدخال يدوي' : lang === 'ms' ? 'Manual' : 'Manual Entry'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {lang === 'ar' ? 'WhatsApp أو Excel' : 'WhatsApp / Excel'}
                      </p>
                    </button>

                    {/* Channel Manager option */}
                    <button
                      type="button"
                      onClick={() => setField('sync_mode', 'CHANNEL')}
                      className={`p-4 rounded-xl border-2 text-center transition-all
                        ${form.sync_mode === 'CHANNEL' ? 'border-[#FF6B35] bg-orange-50' : 'border-gray-100 hover:border-orange-200'}`}
                    >
                      <div className="text-2xl mb-1">💻</div>
                      <p className={`text-sm font-semibold ${form.sync_mode === 'CHANNEL' ? 'text-[#FF6B35]' : 'text-gray-700'}`}>
                        {lang === 'ar' ? 'نظام خارجي' : lang === 'ms' ? 'Sistem Luaran' : 'Channel Manager'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {lang === 'ar' ? 'SiteMinder, Cloudbeds...' : 'SiteMinder, Cloudbeds...'}
                      </p>
                    </button>
                  </div>

                  {/* اسم النظام — يظهر فقط عند اختيار CHANNEL */}
                  {form.sync_mode === 'CHANNEL' && (
                    <div className="mt-3">
                      <label className={lc}>
                        {lang === 'ar' ? 'اسم النظام' : lang === 'ms' ? 'Nama Sistem' : 'System Name'} *
                      </label>
                      <select
                        className={ic}
                        value={form.channel_name as string}
                        onChange={e => setField('channel_name', e.target.value)}
                      >
                        <option value="">{lang === 'ar' ? 'اختر النظام' : 'Select system'}</option>
                        <option value="SiteMinder">SiteMinder</option>
                        <option value="Cloudbeds">Cloudbeds</option>
                        <option value="RateGain">RateGain</option>
                        <option value="Yieldplanet">Yieldplanet</option>
                        <option value="STAAH">STAAH</option>
                        <option value="Hotelogix">Hotelogix</option>
                        <option value="Bokun">Bokun (للجولات)</option>
                        <option value="Rezdy">Rezdy (للأنشطة)</option>
                        <option value="Amadeus">Amadeus (GDS)</option>
                        <option value="Sabre">Sabre (GDS)</option>
                        <option value="OTHER">{lang === 'ar' ? 'نظام آخر' : 'Other'}</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1.5">
                        {lang === 'ar' ? '💡 سنتواصل معك لاحقاً لربط نظامك تلقائياً' : '💡 We will contact you later to integrate your system'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Worked Before */}
                <div>
                  <label className={lc}>
                    {lang === 'ar' ? 'هل سبق لك العمل مع منصات أخرى؟' : lang === 'ms' ? 'Pernahkah anda bekerja dengan platform lain?' : 'Have you worked with other platforms before?'}
                  </label>
                  <div className="flex gap-3">
                    {[{ v: true, en: 'Yes', ar: 'نعم', ms: 'Ya' }, { v: false, en: 'No', ar: 'لا', ms: 'Tidak' }].map(opt => (
                      <button
                        key={String(opt.v)}
                        onClick={() => setField('worked_before', opt.v)}
                        className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                          ${form.worked_before === opt.v ? 'border-[#FF6B35] bg-orange-50 text-[#FF6B35]' : 'border-gray-100 text-gray-600'}`}
                      >
                        {lang === 'ar' ? opt.ar : lang === 'ms' ? opt.ms : opt.en}
                      </button>
                    ))}
                  </div>
                </div>

                {/* How did you hear */}
                <div>
                  <label className={lc}>
                    {lang === 'ar' ? 'كيف عرفت عنا؟' : lang === 'ms' ? 'Bagaimana anda mengetahui kami?' : 'How did you hear about us?'} ({L.optional})
                  </label>
                  <select className={ic} value={form.how_did_you_hear as string} onChange={e => setField('how_did_you_hear', e.target.value)}>
                    <option value="">{lang === 'ar' ? 'اختر' : lang === 'ms' ? 'Pilih' : 'Select'}</option>
                    {HOW_DID_YOU_HEAR.map(h => (
                      <option key={h.v} value={h.v}>{lang === 'ar' ? h.ar : lang === 'ms' ? h.ms : h.en}</option>
                    ))}
                  </select>
                  {form.how_did_you_hear === 'OTHER' && (
                    <input
                      className={ic + ' mt-2'}
                      placeholder={lang === 'ar' ? 'يرجى التوضيح' : 'Please specify'}
                      value={form.how_did_you_hear_other as string}
                      onChange={e => setField('how_did_you_hear_other', e.target.value)}
                    />
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {L.back}
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  className="flex-1 bg-[#FF6B35] hover:bg-[#e07a38] text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {L.next} <FontAwesomeIcon icon={isRTL ? faArrowLeft : faArrowRight} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 — Documents ── */}
          {step === 3 && (
            <div>
              <h2 className={`text-xl font-bold text-gray-900 mb-2 ${isRTL ? 'text-right' : ''}`}>
                {L.step3}
              </h2>
              <p className={`text-sm text-gray-500 mb-6 ${isRTL ? 'text-right' : ''}`}>
                {lang === 'ar' ? 'يرجى رفع الوثائق المطلوبة (PDF أو صورة)' : lang === 'ms' ? 'Sila muat naik dokumen yang diperlukan (PDF atau gambar)' : 'Please upload the required documents (PDF or image)'}
              </p>

              <div className="space-y-4 mb-6">
                {docs.map(doc => (
                  <div key={doc.key}>
                    <label className={lc}>
                      {lang === 'ar' ? doc.label_ar : lang === 'ms' ? doc.label_ms : doc.label_en}
                      {' '}<span className={`text-xs font-normal ${doc.required ? 'text-red-500' : 'text-gray-400'}`}>
                        ({doc.required ? L.required : L.optional})
                      </span>
                    </label>
                    <div
                      onClick={() => fileRefs.current[doc.key]?.click()}
                      className={`border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all
                        ${files[doc.key] ? 'border-[#FF6B35] bg-orange-50' : 'border-gray-200 hover:border-[#FF6B35] hover:bg-orange-50/30'}`}
                    >
                      <input
                        ref={el => { fileRefs.current[doc.key] = el }}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={e => setFiles(f => ({ ...f, [doc.key]: e.target.files?.[0] || null }))}
                      />
                      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <FontAwesomeIcon icon={faUpload} className={`text-lg ${files[doc.key] ? 'text-[#FF6B35]' : 'text-gray-400'}`} />
                        <div>
                          <p className={`text-sm font-medium ${files[doc.key] ? 'text-[#FF6B35]' : 'text-gray-600'}`}>
                            {files[doc.key]
                              ? files[doc.key]!.name
                              : lang === 'ar' ? 'انقر لرفع الملف' : lang === 'ms' ? 'Klik untuk muat naik' : 'Click to upload file'}
                          </p>
                          <p className="text-xs text-gray-400">PDF, JPG, PNG</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                <p className={`text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 ${isRTL ? 'text-right' : ''}`}>
                  {lang === 'ar' ? 'ملخص الطلب' : lang === 'ms' ? 'Ringkasan Permohonan' : 'Application Summary'}
                </p>
                <div className="space-y-1.5">
                  {[
                    { l_en: 'Name', l_ar: 'الاسم', l_ms: 'Nama', v: form.full_name },
                    { l_en: 'Company', l_ar: 'الشركة', l_ms: 'Syarikat', v: form.company_name },
                    { l_en: 'Email', l_ar: 'البريد', l_ms: 'E-mel', v: form.email },
                    { l_en: 'City', l_ar: 'المدينة', l_ms: 'Bandar', v: form.city },
                  ].map(item => (
                    <div key={item.l_en} className={`flex items-center gap-2 text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-gray-400 w-16 flex-shrink-0">
                        {lang === 'ar' ? item.l_ar : lang === 'ms' ? item.l_ms : item.l_en}:
                      </span>
                      <span className="text-gray-700 font-medium">{item.v as string}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {L.back}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-[#FF6B35] hover:bg-[#e07a38] text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> {lang === 'ar' ? 'جارٍ الإرسال...' : lang === 'ms' ? 'Menghantar...' : 'Submitting...'}</>
                    : <>{L.submit} <FontAwesomeIcon icon={faCheckCircle} /></>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
