import { useLanguage } from '../../../hooks/useLanguage';
import { LegalLayout } from './LegalLayout';

const CONTENT = {
  ar: {
    title: 'سياسة الخصوصية',
    sections: [
      { h: '1. مقدمة', p: 'تحترم You Need Travel (mybridge.my) خصوصيتك وتلتزم بحماية بياناتك الشخصية وفقاً لقانون حماية البيانات الشخصية الماليزي PDPA 2010. توضح هذه السياسة كيف نجمع بياناتك ونستخدمها ونشاركها ونحميها.' },
      { h: '2. البيانات التي نجمعها', p: 'نجمع: الاسم الكامل، البريد الإلكتروني، رقم الهاتف، الجنسية، تفاصيل السفر والحجوزات، بيانات الدفع (تُعالج عبر مزوّدين معتمدين)، عنوان IP، نوع المتصفح والجهاز، وسجل التصفح داخل المنصة.' },
      { h: '3. أغراض الاستخدام', p: 'نستخدم بياناتك لـ: معالجة الحجوزات والدفعات، التواصل بشأن الخدمة، تحسين تجربة المستخدم، إرسال إشعارات وعروض (يمكنك إلغاء الاشتراك)، الالتزام بالمتطلبات القانونية والمحاسبية، ومنع الاحتيال.' },
      { h: '4. الأساس القانوني للمعالجة', p: 'نعالج بياناتك بناءً على: موافقتك الصريحة، تنفيذ عقد الحجز، الالتزامات القانونية في ماليزيا، أو المصلحة المشروعة في تشغيل المنصة وتأمينها.' },
      { h: '5. مشاركة البيانات', p: 'نشارك بياناتك مع: الموردين والوكالات الشريكة لتنفيذ حجزك، مزوّدي الدفع (Stripe / FPX / بطاقات)، خدمات التحليلات (Google Analytics بشكل مجهول)، والجهات الحكومية إذا طُلب ذلك قانونياً. لا نبيع بياناتك لأي طرف ثالث لأغراض تسويقية.' },
      { h: '6. النقل الدولي للبيانات', p: 'قد تُنقل بياناتك إلى دول خارج ماليزيا (خوادم سحابية)، ونتأكّد من وجود ضمانات حماية كافية وفقاً لـ PDPA.' },
      { h: '7. الاحتفاظ بالبيانات', p: 'نحتفظ ببيانات الحجز لمدة 7 سنوات (للالتزامات الضريبية الماليزية). البيانات التسويقية تُحذف عند إلغاء اشتراكك. بيانات الحساب تُحذف عند إغلاقه ما لم يستوجب القانون الاحتفاظ بها.' },
      { h: '8. حقوقك', p: 'لك الحق في: الوصول إلى بياناتك، تصحيحها، طلب حذفها، الاعتراض على المعالجة، تقييد المعالجة، نقل البيانات، وسحب الموافقة في أي وقت. للممارسة: privacy@mybridge.my' },
      { h: '9. أمان البيانات', p: 'نطبّق إجراءات أمنية تقنية وتنظيمية: تشفير TLS، تجزئة كلمات المرور، تحكّم في الوصول بالأدوار، نسخ احتياطي مشفّر، ومراجعات أمنية دورية.' },
      { h: '10. خصوصية الأطفال', p: 'لا توجَّه المنصة للأطفال دون 18 عاماً ولا نجمع بياناتهم عن قصد. إذا اكتشفنا ذلك سنحذف البيانات فوراً.' },
      { h: '11. ملفات الارتباط', p: 'نستخدم ملفات الارتباط (cookies) لتشغيل المنصة وتحسينها. للمزيد راجع سياسة ملفات الارتباط.' },
      { h: '12. التحديثات والتواصل', p: 'قد نُحدّث هذه السياسة من وقت لآخر، وستظهر آخر تاريخ تحديث أعلى الصفحة. للاستفسارات: privacy@mybridge.my' },
    ],
  },
  en: {
    title: 'Privacy Policy',
    sections: [
      { h: '1. Introduction', p: 'You Need Travel (mybridge.my) respects your privacy and is committed to protecting your personal data in accordance with Malaysia\'s Personal Data Protection Act 2010 (PDPA). This Policy explains how we collect, use, share and protect your data.' },
      { h: '2. Data We Collect', p: 'We collect: full name, email, phone number, nationality, travel and booking details, payment data (processed via certified providers), IP address, browser and device type, and browsing history within the platform.' },
      { h: '3. Purposes of Use', p: 'We use your data to: process bookings and payments, communicate about the service, improve user experience, send notifications and offers (you may opt out), comply with legal and accounting requirements, and prevent fraud.' },
      { h: '4. Legal Basis for Processing', p: 'We process your data based on: your explicit consent, performance of the booking contract, legal obligations in Malaysia, or legitimate interest in operating and securing the platform.' },
      { h: '5. Data Sharing', p: 'We share your data with: suppliers and partner agencies to fulfil your booking, payment providers (Stripe / FPX / card networks), analytics services (Google Analytics, anonymised), and government authorities where legally required. We do not sell your data to any third party for marketing.' },
      { h: '6. International Data Transfer', p: 'Your data may be transferred to countries outside Malaysia (cloud servers); we ensure adequate safeguards are in place in accordance with PDPA.' },
      { h: '7. Data Retention', p: 'We keep booking data for 7 years (Malaysian tax obligations). Marketing data is deleted upon unsubscription. Account data is deleted upon account closure unless retention is required by law.' },
      { h: '8. Your Rights', p: 'You have the right to: access your data, correct it, request its deletion, object to processing, restrict processing, data portability, and withdraw consent at any time. To exercise: privacy@mybridge.my' },
      { h: '9. Data Security', p: 'We apply technical and organisational security measures: TLS encryption, password hashing, role-based access control, encrypted backups, and periodic security reviews.' },
      { h: '10. Children\'s Privacy', p: 'The platform is not directed to children under 18, and we do not knowingly collect their data. If discovered, we will delete the data immediately.' },
      { h: '11. Cookies', p: 'We use cookies to operate and improve the platform. See our Cookies Policy for details.' },
      { h: '12. Updates & Contact', p: 'We may update this Policy from time to time; the latest update date is shown at the top of the page. For questions: privacy@mybridge.my' },
    ],
  },
  ms: {
    title: 'Dasar Privasi',
    sections: [
      { h: '1. Pengenalan', p: 'You Need Travel (mybridge.my) menghormati privasi anda dan komited melindungi data peribadi anda menurut Akta Perlindungan Data Peribadi Malaysia 2010 (PDPA). Dasar ini menerangkan cara kami mengumpul, menggunakan, berkongsi dan melindungi data anda.' },
      { h: '2. Data yang Dikumpul', p: 'Kami mengumpul: nama penuh, e-mel, nombor telefon, kewarganegaraan, butiran perjalanan dan tempahan, data pembayaran (diproses melalui pembekal yang diperakui), alamat IP, jenis pelayar dan peranti, serta sejarah pelayaran dalam platform.' },
      { h: '3. Tujuan Penggunaan', p: 'Kami menggunakan data anda untuk: memproses tempahan dan pembayaran, berkomunikasi mengenai perkhidmatan, menambah baik pengalaman pengguna, menghantar notifikasi dan tawaran (anda boleh berhenti melanggan), memenuhi keperluan undang-undang dan perakaunan, serta mencegah penipuan.' },
      { h: '4. Asas Undang-undang Pemprosesan', p: 'Kami memproses data anda berdasarkan: persetujuan jelas anda, pelaksanaan kontrak tempahan, kewajipan undang-undang di Malaysia, atau kepentingan sah dalam mengendali dan melindungi platform.' },
      { h: '5. Perkongsian Data', p: 'Kami berkongsi data anda dengan: pembekal dan agensi rakan kongsi untuk memenuhi tempahan, pembekal pembayaran (Stripe / FPX / kad), perkhidmatan analitik (Google Analytics, tanpa nama), dan pihak berkuasa kerajaan jika dikehendaki oleh undang-undang. Kami tidak menjual data anda kepada mana-mana pihak ketiga untuk tujuan pemasaran.' },
      { h: '6. Pemindahan Data Antarabangsa', p: 'Data anda mungkin dipindahkan ke negara di luar Malaysia (pelayan awan); kami memastikan perlindungan yang mencukupi mengikut PDPA.' },
      { h: '7. Pengekalan Data', p: 'Data tempahan disimpan selama 7 tahun (kewajipan cukai Malaysia). Data pemasaran dipadam apabila anda berhenti melanggan. Data akaun dipadam apabila akaun ditutup melainkan diperlukan oleh undang-undang.' },
      { h: '8. Hak Anda', p: 'Anda berhak untuk: mengakses data, membetulkannya, meminta penghapusan, membantah pemprosesan, menghadkan pemprosesan, kebolehpindahan data, dan menarik balik persetujuan pada bila-bila masa. Untuk melaksanakan: privacy@mybridge.my' },
      { h: '9. Keselamatan Data', p: 'Kami melaksanakan langkah keselamatan teknikal dan organisasi: penyulitan TLS, hashing kata laluan, kawalan akses berdasarkan peranan, sandaran tersulit, dan semakan keselamatan berkala.' },
      { h: '10. Privasi Kanak-kanak', p: 'Platform tidak ditujukan kepada kanak-kanak di bawah 18 tahun, dan kami tidak mengumpul data mereka secara sengaja. Jika ditemui, kami akan memadam data dengan serta-merta.' },
      { h: '11. Kuki', p: 'Kami menggunakan kuki untuk mengendali dan menambah baik platform. Lihat Dasar Kuki kami untuk butiran.' },
      { h: '12. Kemaskini & Hubungan', p: 'Kami mungkin mengemaskini Dasar ini dari semasa ke semasa; tarikh kemaskini terkini dipaparkan di bahagian atas halaman. Untuk soalan: privacy@mybridge.my' },
    ],
  },
};

export function PrivacyPage() {
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
