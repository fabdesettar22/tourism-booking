import { useLanguage } from '../../../hooks/useLanguage';
import { LegalLayout } from './LegalLayout';

const CONTENT = {
  ar: {
    title: 'شروط الاستخدام',
    sections: [
      { h: '1. مقدمة', p: 'مرحباً بك في You Need Travel (mybridge.my). باستخدامك للمنصة فإنك توافق على الالتزام بهذه الشروط. إن لم توافق على أيٍّ منها فيُرجى عدم استخدام المنصة.' },
      { h: '2. تعريفات', p: 'المنصة: موقع mybridge.my والخدمات المقدَّمة عبره. المستخدم: السائح أو الزائر النهائي. المورد: الفنادق ومقدّمو الخدمات السياحية المسجَّلون. الوكالة: الوكالات السياحية الشريكة.' },
      { h: '3. طبيعة الخدمة', p: 'تعمل You Need Travel كوسيط بين المسافرين والموردين السياحيين في ماليزيا (فنادق، نقل، مطاعم، مرشدين، أنشطة، عافية، خدمات أخرى). نحن لسنا المالك المباشر لهذه الخدمات بل نوفّر منصة لاكتشافها وحجزها.' },
      { h: '4. التسجيل والحساب', p: 'يجب أن تكون قد أتممت 18 عاماً للتسجيل. أنت مسؤول عن سرية بيانات حسابك وعن جميع النشاطات التي تتم من خلاله. يُحظر إنشاء حسابات وهمية أو انتحال صفة الغير.' },
      { h: '5. الحجوزات والدفع', p: 'تخضع جميع الحجوزات لتأكيد المورد ولشروط السعر والإلغاء المحدّدة وقت الحجز. تتقاضى المنصة عمولة تصل إلى 17% مدمجة في السعر النهائي المعروض. الأسعار تُعرض بالرنغيت الماليزي (MYR) ما لم يُذكر غير ذلك.' },
      { h: '6. الإلغاء واسترداد المبالغ', p: 'تختلف سياسة الإلغاء حسب المورد ونوع الخدمة وستُعرض بوضوح قبل تأكيد الحجز. لا تتحمّل المنصة المسؤولية المباشرة عن استرداد مبالغ حجوزات لم يُكمل فيها المورد التزاماته إلا في حدود ما هو منصوص عليه في سياسة الحماية.' },
      { h: '7. مسؤوليات المستخدم', p: 'يلتزم المستخدم بتقديم بيانات صحيحة، واحترام أنظمة ماليزيا والقوانين المحلية، وعدم استخدام المنصة في أي نشاط غير قانوني أو احتيالي.' },
      { h: '8. الملكية الفكرية', p: 'جميع المحتويات (الشعارات، النصوص، الصور، التصاميم) ملكية حصرية لـ You Need Travel أو لأصحابها المرخّصين. يُمنع نسخها أو إعادة نشرها دون إذن كتابي.' },
      { h: '9. حدود المسؤولية', p: 'لا تتحمّل المنصة المسؤولية عن الأضرار غير المباشرة أو التبعية الناتجة عن استخدام الخدمة، بما في ذلك فقدان البيانات أو الأرباح أو فرص العمل. مسؤوليتنا الإجمالية محدودة بقيمة المعاملة موضوع النزاع.' },
      { h: '10. القانون الواجب التطبيق', p: 'تخضع هذه الشروط لقوانين ماليزيا، وأي نزاع ينشأ عنها يُحال إلى المحاكم المختصة في كوالالمبور.' },
      { h: '11. تعديل الشروط', p: 'نحتفظ بحق تعديل هذه الشروط في أي وقت. سيتم إعلامك بأي تغييرات جوهرية، واستمرار استخدامك للمنصة بعد التعديل يُعدّ موافقةً عليه.' },
      { h: '12. التواصل', p: 'لأي استفسار بخصوص هذه الشروط، يمكنك التواصل معنا عبر البريد: support@mybridge.my' },
    ],
  },
  en: {
    title: 'Terms of Use',
    sections: [
      { h: '1. Introduction', p: 'Welcome to You Need Travel (mybridge.my). By using the platform you agree to be bound by these Terms. If you do not agree, please do not use the platform.' },
      { h: '2. Definitions', p: 'Platform: the mybridge.my website and the services offered through it. User: the end traveller or visitor. Supplier: hotels and tourism service providers registered on the platform. Agency: partner travel agencies.' },
      { h: '3. Nature of the Service', p: 'You Need Travel acts as an intermediary between travellers and tourism suppliers in Malaysia (hotels, transport, restaurants, guides, activities, wellness, other services). We do not directly own these services; we provide a platform to discover and book them.' },
      { h: '4. Registration & Account', p: 'You must be at least 18 years old to register. You are responsible for keeping your account credentials confidential and for all activity carried out under your account. Fake accounts and impersonation are prohibited.' },
      { h: '5. Bookings & Payment', p: 'All bookings are subject to supplier confirmation and to the price and cancellation terms shown at the time of booking. The platform charges a commission of up to 17%, already included in the final price displayed. Prices are shown in Malaysian Ringgit (MYR) unless otherwise stated.' },
      { h: '6. Cancellation & Refunds', p: 'Cancellation policies vary by supplier and service type and are clearly displayed before booking confirmation. The platform is not directly responsible for refunds where the supplier has failed to perform, except as set out in our protection policy.' },
      { h: '7. User Responsibilities', p: 'Users must provide accurate information, respect Malaysian regulations and local laws, and refrain from using the platform for any unlawful or fraudulent activity.' },
      { h: '8. Intellectual Property', p: 'All content (logos, text, images, designs) is the exclusive property of You Need Travel or its licensors. Reproduction or republication without written permission is prohibited.' },
      { h: '9. Limitation of Liability', p: 'The platform is not liable for indirect or consequential damages arising from use of the service, including loss of data, profit or business opportunity. Our aggregate liability is limited to the value of the transaction in dispute.' },
      { h: '10. Governing Law', p: 'These Terms are governed by the laws of Malaysia. Any dispute arising from them shall be referred to the competent courts of Kuala Lumpur.' },
      { h: '11. Changes to the Terms', p: 'We reserve the right to modify these Terms at any time. We will notify you of material changes; continued use of the platform after a change constitutes acceptance.' },
      { h: '12. Contact', p: 'For any question regarding these Terms, please contact us at: support@mybridge.my' },
    ],
  },
  ms: {
    title: 'Terma Penggunaan',
    sections: [
      { h: '1. Pengenalan', p: 'Selamat datang ke You Need Travel (mybridge.my). Dengan menggunakan platform ini, anda bersetuju untuk terikat dengan Terma ini. Jika anda tidak bersetuju, sila jangan gunakan platform.' },
      { h: '2. Definisi', p: 'Platform: laman web mybridge.my dan perkhidmatan yang ditawarkan melaluinya. Pengguna: pelancong atau pelawat akhir. Pembekal: hotel dan penyedia perkhidmatan pelancongan yang berdaftar. Agensi: agensi pelancongan rakan kongsi.' },
      { h: '3. Sifat Perkhidmatan', p: 'You Need Travel bertindak sebagai perantara antara pelancong dan pembekal pelancongan di Malaysia (hotel, pengangkutan, restoran, pemandu, aktiviti, kesejahteraan, perkhidmatan lain). Kami tidak memiliki perkhidmatan ini secara langsung; kami menyediakan platform untuk menerokai dan menempahnya.' },
      { h: '4. Pendaftaran & Akaun', p: 'Anda mestilah berumur sekurang-kurangnya 18 tahun untuk mendaftar. Anda bertanggungjawab menjaga kerahsiaan butiran akaun anda dan semua aktiviti yang dilakukan melaluinya. Akaun palsu dan penyamaran adalah dilarang.' },
      { h: '5. Tempahan & Pembayaran', p: 'Semua tempahan tertakluk kepada pengesahan pembekal serta terma harga dan pembatalan yang dipaparkan semasa tempahan. Platform mengenakan komisen sehingga 17% yang telah disertakan dalam harga akhir yang dipaparkan. Harga dipaparkan dalam Ringgit Malaysia (MYR) melainkan dinyatakan sebaliknya.' },
      { h: '6. Pembatalan & Bayaran Balik', p: 'Polisi pembatalan berbeza mengikut pembekal dan jenis perkhidmatan, dan dipaparkan dengan jelas sebelum pengesahan tempahan. Platform tidak bertanggungjawab secara langsung atas bayaran balik apabila pembekal gagal melaksanakan perkhidmatannya, kecuali seperti yang diperuntukkan dalam polisi perlindungan kami.' },
      { h: '7. Tanggungjawab Pengguna', p: 'Pengguna mestilah memberikan maklumat yang tepat, menghormati peraturan Malaysia dan undang-undang tempatan, serta tidak menggunakan platform untuk aktiviti yang menyalahi undang-undang atau penipuan.' },
      { h: '8. Harta Intelek', p: 'Semua kandungan (logo, teks, imej, reka bentuk) adalah hak milik eksklusif You Need Travel atau pemberi lesennya. Penghasilan semula tanpa kebenaran bertulis adalah dilarang.' },
      { h: '9. Had Tanggungan', p: 'Platform tidak bertanggungjawab atas kerugian tidak langsung atau berbangkit akibat penggunaan perkhidmatan, termasuk kehilangan data, keuntungan atau peluang perniagaan. Liabiliti agregat kami terhad kepada nilai transaksi yang dipertikaikan.' },
      { h: '10. Undang-undang Terpakai', p: 'Terma ini ditadbir oleh undang-undang Malaysia. Sebarang pertikaian akan dirujuk kepada mahkamah berwibawa di Kuala Lumpur.' },
      { h: '11. Perubahan kepada Terma', p: 'Kami berhak meminda Terma ini pada bila-bila masa. Kami akan memaklumkan perubahan penting; penggunaan berterusan platform selepas pindaan dianggap sebagai persetujuan.' },
      { h: '12. Hubungi Kami', p: 'Untuk sebarang pertanyaan mengenai Terma ini, sila hubungi kami di: support@mybridge.my' },
    ],
  },
};

export function TermsPage() {
  const { lang } = useLanguage();
  const c = CONTENT[lang as 'ar' | 'en' | 'ms'] ?? CONTENT.en;
  return (
    <LegalLayout title={c.title} lastUpdated="2026-05-03">
      {c.sections.map((s) => (
        <section key={s.h}>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{s.h}</h2>
          <p>{s.p}</p>
        </section>
      ))}
    </LegalLayout>
  );
}
