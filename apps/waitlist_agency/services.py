# apps/waitlist_agency/services.py
"""
Email service for Agency Waitlist — يستخدم Django's built-in email system.
يعمل مع أي مزوّد SMTP (Brevo, Resend, Gmail, Mailgun...).

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
    يرسل إيميل تأكيد للوكالة بعد التسجيل في الـ Waitlist.
    يعيد True إذا نجح الإرسال، False إذا فشل.
    """
    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'contact@mybridge.my')
        from_name  = getattr(settings, 'SENDGRID_FROM_NAME', 'MYBRIDGE')
        site_url   = getattr(settings, 'WAITLIST_SITE_URL',  'https://www.mybridge.my')

        full_from = f'{from_name} <{from_email}>'
        subject   = 'MYBRIDGE — Agency Registration Received | تم استلام طلب تسجيل وكالتك | Permohonan Pendaftaran Agensi Diterima'

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
            f'[AgencyWaitlist] إيميل أُرسل بنجاح → {instance.email} | ref: {instance.ref_number}'
        )
        return True

    except Exception as e:
        logger.error(
            f'[AgencyWaitlist] فشل إرسال إيميل إلى {instance.email}: {type(e).__name__}: {str(e)}'
        )
        return False


def _build_email_text(instance) -> str:
    """نسخة نصّية بسيطة (fallback للبريد الذي لا يدعم HTML)."""
    return f"""MYBRIDGE — Agency Registration Received
تم استلام طلب تسجيل وكالتك

Reference Number: {instance.ref_number}
Agency: {instance.name}
Contact: {instance.contact_person_name}

Thank you for registering your agency on MYBRIDGE.
شكراً لتسجيل وكالتك في منصة MYBRIDGE.

Our team will review your documents within 1-3 business days.
سيقوم فريقنا بمراجعة وثائقك خلال 1-3 أيام عمل.

---
YOUNEED TRAVEL & TOURS SDN. BHD.
202301025671 (1519594-T) | No. Lesen: MOTAC L/N/12084
www.mybridge.my
"""


def _build_email_html(instance, site_url: str) -> str:
    """يبني محتوى الإيميل HTML بثلاث لغات."""

    ref          = instance.ref_number
    agency_name  = instance.name
    contact_name = instance.contact_person_name
    city         = instance.city or '-'

    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>MYBRIDGE — Agency Registration Received</title>
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

        <!-- ENGLISH -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f0f0f0;">
            <h2 style="margin:0 0 12px;color:#1A1A2E;font-size:18px;">Registration Received!</h2>
            <p style="margin:0 0 8px;color:#555;font-size:14px;line-height:1.7;">
              Dear <strong>{contact_name}</strong>,<br/>
              Thank you for registering <strong>{agency_name}</strong> as a partner agency on MYBRIDGE.
            </p>
            <p style="margin:0;color:#555;font-size:14px;line-height:1.7;">
              Our team will review your submitted documents within <strong>1-3 business days</strong>. Once approved, you will receive an activation link to complete your account setup.
            </p>
          </td>
        </tr>

        <!-- ARABIC -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f0f0f0;direction:rtl;text-align:right;">
            <h2 style="margin:0 0 12px;color:#1A1A2E;font-size:18px;">تم استلام طلبك!</h2>
            <p style="margin:0 0 8px;color:#555;font-size:14px;line-height:1.7;">
              عزيزي/عزيزتي <strong>{contact_name}</strong>،<br/>
              شكراً لتسجيل <strong>{agency_name}</strong> كوكالة شريكة في منصة MYBRIDGE.
            </p>
            <p style="margin:0;color:#555;font-size:14px;line-height:1.7;">
              سيقوم فريقنا بمراجعة الوثائق المرفقة خلال <strong>1-3 أيام عمل</strong>. عند الموافقة، ستصلك رسالة برابط تفعيل الحساب لإكمال إعدادات وكالتك.
            </p>
          </td>
        </tr>

        <!-- MALAY -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f0f0f0;">
            <h2 style="margin:0 0 12px;color:#1A1A2E;font-size:18px;">Pendaftaran Diterima!</h2>
            <p style="margin:0 0 8px;color:#555;font-size:14px;line-height:1.7;">
              Kepada <strong>{contact_name}</strong>,<br/>
              Terima kasih kerana mendaftarkan <strong>{agency_name}</strong> sebagai agensi rakan di MYBRIDGE.
            </p>
            <p style="margin:0;color:#555;font-size:14px;line-height:1.7;">
              Pasukan kami akan menyemak dokumen anda dalam tempoh <strong>1-3 hari bekerja</strong>. Setelah diluluskan, anda akan menerima pautan pengaktifan akaun.
            </p>
          </td>
        </tr>

        <!-- DIVIDER INFO -->
        <tr>
          <td style="padding:20px 40px;background:#fff8f5;border-top:1px solid #ffe0d0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align:center;padding:8px;">
                  <p style="margin:0;font-size:12px;color:#888;">Agency | الوكالة</p>
                  <p style="margin:4px 0 0;font-size:14px;font-weight:bold;color:#1A1A2E;">{agency_name}</p>
                </td>
                <td style="text-align:center;padding:8px;border-left:1px solid #ffe0d0;">
                  <p style="margin:0;font-size:12px;color:#888;">City | المدينة</p>
                  <p style="margin:4px 0 0;font-size:14px;font-weight:bold;color:#1A1A2E;">{city}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- FOOTER -->
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
