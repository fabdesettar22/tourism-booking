import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone, faLocationDot, faClock, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { useLanguage } from '../../hooks/useLanguage';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';

const CONTENT = {
  ar: {
    eyebrow: 'تواصل معنا',
    title: 'نحن هنا للإجابة على أسئلتك',
    subtitle: 'سواء كنت سائحاً أو وكالة سفر أو موفّر خدمة — فريقنا جاهز لمساعدتك خلال 24 ساعة عمل.',
    back: '→ العودة للصفحة الرئيسية',
    info: { title: 'معلومات التواصل', email: 'البريد الإلكتروني', phone: 'الهاتف', whatsapp: 'واتساب', address: 'العنوان', addressVal: 'كوالالمبور، ماليزيا', hours: 'ساعات العمل', hoursVal: 'الإثنين – الجمعة • 9:00 ص – 6:00 م (GMT+8)' },
    form: { title: 'أرسل لنا رسالة', name: 'الاسم الكامل', email: 'البريد الإلكتروني', subject: 'الموضوع', message: 'الرسالة', send: 'إرسال الرسالة', success: 'تم فتح بريدك — أكمل الإرسال من هناك.' },
  },
  en: {
    eyebrow: 'Contact',
    title: 'We are here to answer your questions',
    subtitle: 'Whether you are a traveler, a travel agency, or a service provider — our team is ready to help within 24 business hours.',
    back: '← Back to Home',
    info: { title: 'Contact Information', email: 'Email', phone: 'Phone', whatsapp: 'WhatsApp', address: 'Address', addressVal: 'Kuala Lumpur, Malaysia', hours: 'Business Hours', hoursVal: 'Mon – Fri • 9:00 AM – 6:00 PM (GMT+8)' },
    form: { title: 'Send us a message', name: 'Full name', email: 'Email address', subject: 'Subject', message: 'Message', send: 'Send message', success: 'Your email client opened — complete sending from there.' },
  },
  ms: {
    eyebrow: 'Hubungi',
    title: 'Kami sedia menjawab soalan anda',
    subtitle: 'Sama ada anda pelancong, agensi pelancongan, atau penyedia perkhidmatan — pasukan kami sedia membantu dalam 24 jam bekerja.',
    back: '← Kembali ke Laman Utama',
    info: { title: 'Maklumat Hubungan', email: 'E-mel', phone: 'Telefon', whatsapp: 'WhatsApp', address: 'Alamat', addressVal: 'Kuala Lumpur, Malaysia', hours: 'Waktu Operasi', hoursVal: 'Isn – Jum • 9:00 PG – 6:00 PTG (GMT+8)' },
    form: { title: 'Hantar mesej kepada kami', name: 'Nama penuh', email: 'Alamat e-mel', subject: 'Subjek', message: 'Mesej', send: 'Hantar mesej', success: 'Klien e-mel anda dibuka — lengkapkan penghantaran dari sana.' },
  },
};

export function ContactPage() {
  const { lang, isRTL, changeLang, t } = useLanguage();
  const c = CONTENT[lang as 'ar' | 'en' | 'ms'] ?? CONTENT.en;
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const body = `${c.form.name}: ${form.name}%0D%0A${c.form.email}: ${form.email}%0D%0A%0D%0A${form.message}`;
    window.location.href = `mailto:contact@mybridge.my?subject=${encodeURIComponent(form.subject || c.form.title)}&body=${body}`;
    setSent(true);
  };

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition text-sm';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 flex flex-col">
      <PublicNavbar lang={lang} onLangChange={changeLang} t={t} isRTL={isRTL} variant="solid" />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-orange-50 via-white to-amber-50 border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <Link to="/" className="text-orange-600 hover:text-orange-700 text-sm font-medium inline-block mb-6">{c.back}</Link>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-orange-600 mb-4">{c.eyebrow}</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-5">{c.title}</h1>
            <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">{c.subtitle}</p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 grid md:grid-cols-5 gap-10">
          <aside className="md:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{c.info.title}</h2>

            <a href="mailto:contact@mybridge.my" className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-sm transition">
              <span className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0"><FontAwesomeIcon icon={faEnvelope} /></span>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 mb-1">{c.info.email}</p>
                <p className="text-sm font-medium text-gray-900 break-all">contact@mybridge.my</p>
              </div>
            </a>

            <a href="tel:+60174212823" className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-sm transition" dir="ltr">
              <span className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0"><FontAwesomeIcon icon={faPhone} /></span>
              <div>
                <p className="text-xs text-gray-500 mb-1">{c.info.phone}</p>
                <p className="text-sm font-medium text-gray-900">+60 17-421 2823</p>
              </div>
            </a>

            <a href="https://wa.me/60174212823" target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-sm transition">
              <span className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0"><FontAwesomeIcon icon={faWhatsapp} /></span>
              <div>
                <p className="text-xs text-gray-500 mb-1">{c.info.whatsapp}</p>
                <p className="text-sm font-medium text-gray-900" dir="ltr">+60 17-421 2823</p>
              </div>
            </a>

            <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100">
              <span className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0"><FontAwesomeIcon icon={faLocationDot} /></span>
              <div>
                <p className="text-xs text-gray-500 mb-1">{c.info.address}</p>
                <p className="text-sm font-medium text-gray-900">{c.info.addressVal}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100">
              <span className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0"><FontAwesomeIcon icon={faClock} /></span>
              <div>
                <p className="text-xs text-gray-500 mb-1">{c.info.hours}</p>
                <p className="text-sm font-medium text-gray-900">{c.info.hoursVal}</p>
              </div>
            </div>
          </aside>

          <div className="md:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{c.form.title}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">{c.form.name}</label>
                    <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">{c.form.email}</label>
                    <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{c.form.subject}</label>
                  <input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{c.form.message}</label>
                  <textarea required rows={6} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className={inputClass} />
                </div>
                <button type="submit" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition shadow-sm">
                  <FontAwesomeIcon icon={faPaperPlane} className="text-sm" />
                  {c.form.send}
                </button>
                {sent && <p className="text-sm text-green-700 mt-2">{c.form.success}</p>}
              </form>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
