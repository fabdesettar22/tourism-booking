# apps/waitlist/services.py
"""
Email service for Waitlist — يستخدم Django's built-in email system.
يعمل مع أي مزوّد SMTP (Resend, Gmail, Mailgun, SendGrid via SMTP).

الإعدادات تُقرأ من config/settings.py:
- EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD
- DEFAULT_FROM_EMAIL, EMAIL_USE_TLS
"""
import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)


def send_confirmation_email(instance) -> bool:
    """
    يرسل إيميل تأكيد للمورد بعد التسجيل في الـ Waitlist.
    يعيد True إذا نجح الإرسال، False إذا فشل.
    """
    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'contact@mybridge.my')
        from_name  = getattr(settings, 'SENDGRID_FROM_NAME', 'MYBRIDGE')
        site_url   = getattr(settings, 'WAITLIST_SITE_URL',  'https://www.mybridge.my')

        full_from = f'{from_name} <{from_email}>'
        subject   = 'MYBRIDGE — Registration Confirmed | تم تأكيد تسجيلك | Pendaftaran Disahkan'

        html_content = _build_email_html(instance, site_url)
        text_content = _build_email_text(instance)

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=full_from,
            to=[instance.email],
        )
        email.attach_alternative(html_content, 'text/html')
        email.send(fail_silently=False)

        instance.email_sent = True
        instance.save(update_fields=['email_sent'])
        logger.info(
            f'[Waitlist] إيميل أُرسل بنجاح → {instance.email} | ref: {instance.ref_number}'
        )
        return True

    except Exception as e:
        logger.error(
            f'[Waitlist] فشل إرسال إيميل إلى {instance.email}: {type(e).__name__}: {str(e)}'
        )
        return False


def _build_email_text(instance) -> str:
    """
    نسخة نصّية بسيطة (fallback للبريد الذي لا يدعم HTML).
    """
    return f"""MYBRIDGE — Registration Confirmed
تم تأكيد تسجيلك

Reference Number: {instance.ref_number}
Name: {instance.full_name}
Company: {instance.company_name}

Thank you for registering on MYBRIDGE.
شكراً لتسجيلك في منصة MYBRIDGE.

We will notify you by email when MYBRIDGE is ready.
سنتواصل معك عندما تكون المنصة جاهزة.

---
YOUNEED TRAVEL & TOURS SDN. BHD.
202301025671 (1519594-T) | No. Lesen: MOTAC L/N/12084
www.mybridge.my
"""


def _build_email_html(instance, site_url: str) -> str:
    """
    يبني محتوى الإيميل HTML بثلاث لغات
    """
    supplier_type_labels = {
        'PROPERTY':   {'en': 'Property',          'ar': 'عقار',              'ms': 'Hartanah'},
        'TRANSPORT':  {'en': 'Transport',          'ar': 'نقل',               'ms': 'Pengangkutan'},
        'RESTAURANT': {'en': 'Restaurant',         'ar': 'مطعم',              'ms': 'Restoran'},
        'GUIDE':      {'en': 'Tour Guide',         'ar': 'مرشد سياحي',        'ms': 'Pemandu Pelancong'},
        'ACTIVITY':   {'en': 'Activity Provider',  'ar': 'مزود أنشطة',        'ms': 'Penyedia Aktiviti'},
        'WELLNESS':   {'en': 'Wellness Center',    'ar': 'مركز سبا وعافية',   'ms': 'Pusat Kesihatan'},
        'OTHER':      {'en': 'Service Provider',   'ar': 'مزود خدمات',        'ms': 'Penyedia Perkhidmatan'},
    }

    s_type  = instance.supplier_type
    labels  = supplier_type_labels.get(s_type, supplier_type_labels['OTHER'])
    ref     = instance.ref_number
    name    = instance.full_name
    company = instance.company_name

    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>MYBRIDGE — Registration Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;">

        <tr>
          <td style="background:#FF6B35;padding:30px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;letter-spacing:2px;">MYBRIDGE</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;font-style:italic;">The link youneed</p>
          </td>
        </tr>

        <tr>
          <td style="padding:30px 40px 10px;text-align:center;">
            <div style="width:70px;height:70px;background:#e8f5e9;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <span style="font-size:36px;">✅</span>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:0 40px 20px;text-align:center;">
            <div style="background:#fff8f5;border:2px solid #FF6B35;border-radius:8px;padding:12px 20px;display:inline-block;">
              <p style="margin:0;font-size:12px;color:#888;">Reference Number | رقم المرجع</p>
              <p style="margin:4px 0 0;font-size:20px;font-weight:bold;color:#FF6B35;letter-spacing:2px;">{ref}</p>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f0f0f0;">
            <h2 style="margin:0 0 12px;color:#1A1A2E;font-size:18px;">Registration Confirmed!</h2>
            <p style="margin:0 0 8px;color:#555;font-size:14px;line-height:1.7;">
              Dear <strong>{name}</strong>,<br/>
              Thank you for registering <strong>{company}</strong> as a <strong>{labels['en']}</strong> on MYBRIDGE.
            </p>
            <p style="margin:0;color:#555;font-size:14px;line-height:1.7;">
              Your registration has been received. We will notify you by email when MYBRIDGE is ready to welcome you and your customers.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f0f0f0;direction:rtl;text-align:right;">
            <h2 style="margin:0 0 12px;color:#1A1A2E;font-size:18px;">تم تأكيد تسجيلك!</h2>
            <p style="margin:0 0 8px;color:#555;font-size:14px;line-height:1.7;">
              عزيزي <strong>{name}</strong>،<br/>
              شكراً لتسجيل <strong>{company}</strong> كـ <strong>{labels['ar']}</strong> في منصة MYBRIDGE.
            </p>
            <p style="margin:0;color:#555;font-size:14px;line-height:1.7;">
              تم استلام طلبك بنجاح. سنتواصل معك عبر البريد الإلكتروني عندما تكون المنصة جاهزة لاستقبالك وعملائك.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f0f0f0;">
            <h2 style="margin:0 0 12px;color:#1A1A2E;font-size:18px;">Pendaftaran Disahkan!</h2>
            <p style="margin:0 0 8px;color:#555;font-size:14px;line-height:1.7;">
              Kepada <strong>{name}</strong>,<br/>
              Terima kasih kerana mendaftarkan <strong>{company}</strong> sebagai <strong>{labels['ms']}</strong> di MYBRIDGE.
            </p>
            <p style="margin:0;color:#555;font-size:14px;line-height:1.7;">
              Pendaftaran anda telah diterima. Kami akan memaklumkan anda melalui e-mel apabila MYBRIDGE bersedia.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 40px;background:#fff8f5;border-top:1px solid #ffe0d0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align:center;padding:8px;">
                  <p style="margin:0;font-size:12px;color:#888;">Supplier Type | نوع المورد</p>
                  <p style="margin:4px 0 0;font-size:14px;font-weight:bold;color:#1A1A2E;">{labels['en']} | {labels['ar']}</p>
                </td>
                <td style="text-align:center;padding:8px;border-left:1px solid #ffe0d0;">
                  <p style="margin:0;font-size:12px;color:#888;">Company | الشركة</p>
                  <p style="margin:4px 0 0;font-size:14px;font-weight:bold;color:#1A1A2E;">{company}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 40px;background:#1A1A2E;text-align:center;">
            <p style="margin:0 0 6px;color:#FF6B35;font-size:16px;font-weight:bold;">MYBRIDGE</p>
            <p style="margin:0 0 4px;color:rgba(255,255,255,0.5);font-size:11px;font-style:italic;">The link youneed</p>
            <p style="margin:8px 0 4px;color:rgba(255,255,255,0.4);font-size:10px;">YOUNEED TRAVEL & TOURS SDN. BHD.</p>
            <p style="margin:0;color:rgba(255,255,255,0.4);font-size:10px;">202301025671 (1519594-T) | No. Lesen: MOTAC L/N/12084</p>
            <p style="margin:8px 0 0;">
              <a href="{site_url}" style="color:#FF6B35;font-size:11px;text-decoration:none;">www.mybridge.my</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>
"""


# ═══════════════════════════════════════════════════════════
# APPROVAL / REJECTION EMAILS — للموردين في Waitlist
# ═══════════════════════════════════════════════════════════

def send_waitlist_approved_email(instance) -> bool:
    """
    إيميل للمورد عند قبول طلبه.
    يُستدعى من SupplierWaitlistApproveView.
    """
    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'contact@mybridge.my')
        from_name  = getattr(settings, 'SENDGRID_FROM_NAME',  'MYBRIDGE')
        site_url   = getattr(settings, 'WAITLIST_SITE_URL',   'https://www.mybridge.my')
        full_from  = f'{from_name} <{from_email}>'

        subject = '🎉 MYBRIDGE — تم قبول طلبك | Your application was approved'
        supplier_name = getattr(instance, 'name', '') or getattr(instance, 'business_name', '')

        html_content = f"""
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>MYBRIDGE</title>
        </head>
        <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden;">
            
            <div style="background: linear-gradient(135deg, #FF5722 0%, #FFB547 100%); padding: 40px 30px; text-align: center;">
              <div style="display: inline-block; width: 70px; height: 70px; background: white; border-radius: 50%; line-height: 70px; font-size: 36px;">✓</div>
              <h1 style="color: white; font-size: 26px; margin: 16px 0 0;">تهانينا {supplier_name}!</h1>
            </div>

            <div style="padding: 35px 30px;">
              <p style="font-size: 16px; color: #333; line-height: 1.7; margin: 0 0 16px;">
                يسرّنا إبلاغك بأنه تم <strong style="color: #FF6B35;">قبول طلب تسجيلك</strong> في منصة MYBRIDGE.
              </p>
              <p style="font-size: 15px; color: #555; line-height: 1.7; margin: 0 0 20px;">
                رقم المرجع: <code style="background: #f5f5f5; padding: 3px 10px; border-radius: 6px; color: #FF6B35;">{instance.ref_number}</code>
              </p>

              <div style="background: #FFF5EE; border: 1px solid #FFD7BD; border-radius: 10px; padding: 18px; margin: 20px 0;">
                <p style="margin: 0; color: #7A3E0B; font-size: 14px; line-height: 1.7;">
                  <strong>الخطوة التالية:</strong><br>
                  سيتواصل معك فريقنا قريباً لإكمال إعداد حسابك والبدء بإدارة خدماتك على المنصة.
                </p>
              </div>

              <p style="font-size: 14px; color: #888; margin: 24px 0 0;">
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                Congratulations! Your application to join MYBRIDGE has been <strong>approved</strong>.<br>
                Reference: <code>{instance.ref_number}</code><br>
                Our team will contact you soon to complete your account setup.
              </p>
            </div>

            <div style="background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999;">
              © MYBRIDGE · You Need Travel & Tours SDN. BHD.
            </div>
          </div>
        </body>
        </html>
        """

        text_content = f"""MYBRIDGE — تم قبول طلبك

تهانينا {supplier_name}!

تم قبول طلب تسجيلك في منصة MYBRIDGE.
رقم المرجع: {instance.ref_number}

سيتواصل معك فريقنا قريباً لإكمال إعداد حسابك.

─────────────────────
Your MYBRIDGE application has been approved.
Reference: {instance.ref_number}
Our team will contact you soon.

MYBRIDGE · You Need Travel
{site_url}
"""

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=full_from,
            to=[instance.email],
        )
        email.attach_alternative(html_content, 'text/html')
        email.send(fail_silently=False)

        logger.info(f'[Waitlist] إيميل قبول أُرسل → {instance.email} | ref={instance.ref_number}')
        return True

    except Exception as e:
        logger.error(f'[Waitlist] فشل إرسال إيميل القبول إلى {getattr(instance, "email", "?")}: {type(e).__name__}: {e}')
        return False


def send_waitlist_rejected_email(instance, reason: str) -> bool:
    """
    إيميل للمورد عند رفض طلبه.
    """
    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'contact@mybridge.my')
        from_name  = getattr(settings, 'SENDGRID_FROM_NAME',  'MYBRIDGE')
        full_from  = f'{from_name} <{from_email}>'

        subject = 'MYBRIDGE — تحديث بخصوص طلبك | Update on your application'
        supplier_name = getattr(instance, 'name', '') or getattr(instance, 'business_name', '')

        html_content = f"""
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head><meta charset="utf-8"><title>MYBRIDGE</title></head>
        <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden;">

            <div style="background: #F87171; padding: 35px 30px; text-align: center;">
              <h1 style="color: white; font-size: 22px; margin: 0;">تحديث بخصوص طلبك</h1>
            </div>

            <div style="padding: 35px 30px;">
              <p style="font-size: 15px; color: #333; line-height: 1.7; margin: 0 0 14px;">
                مرحباً {supplier_name},
              </p>
              <p style="font-size: 15px; color: #555; line-height: 1.7; margin: 0 0 16px;">
                شكراً لاهتمامك بالانضمام إلى منصة MYBRIDGE. بعد مراجعة طلبك بعناية،
                نأسف لإبلاغك بأننا لن نتمكّن من قبوله في الوقت الحالي.
              </p>

              <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 10px; padding: 18px; margin: 20px 0;">
                <p style="margin: 0 0 8px; color: #7F1D1D; font-size: 13px; font-weight: bold;">السبب:</p>
                <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.7;">{reason}</p>
              </div>

              <p style="font-size: 14px; color: #888; margin: 20px 0 0; line-height: 1.7;">
                إن كانت لديك أي أسئلة أو تودّ إعادة التقديم بعد معالجة الأسباب المذكورة،
                يسعدنا التواصل معك عبر <a href="mailto:{from_email}" style="color: #FF6B35;">{from_email}</a>.
              </p>

              <p style="font-size: 13px; color: #999; margin: 24px 0 0; line-height: 1.7;">
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                We regret that we're unable to approve your application at this time.<br>
                Reason: {reason}<br>
                Reference: {instance.ref_number}
              </p>
            </div>

            <div style="background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999;">
              © MYBRIDGE · You Need Travel & Tours SDN. BHD.
            </div>
          </div>
        </body>
        </html>
        """

        text_content = f"""MYBRIDGE — تحديث بخصوص طلبك

مرحباً {supplier_name},

نأسف لإبلاغك بأنه بعد مراجعة طلبك، لن نتمكّن من قبوله في الوقت الحالي.

السبب: {reason}

رقم المرجع: {instance.ref_number}

─────────────────────
Your MYBRIDGE application was not approved at this time.
Reason: {reason}
Reference: {instance.ref_number}

MYBRIDGE · You Need Travel
"""

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=full_from,
            to=[instance.email],
        )
        email.attach_alternative(html_content, 'text/html')
        email.send(fail_silently=False)

        logger.info(f'[Waitlist] إيميل رفض أُرسل → {instance.email} | ref={instance.ref_number}')
        return True

    except Exception as e:
        logger.error(f'[Waitlist] فشل إرسال إيميل الرفض إلى {getattr(instance, "email", "?")}: {type(e).__name__}: {e}')
        return False

