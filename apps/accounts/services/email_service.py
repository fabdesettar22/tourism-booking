# apps/accounts/services/email_service.py

from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
import logging

logger = logging.getLogger('apps.accounts')


# ═══════════════════════════════════════════════════════════
# HELPER — HTML Email Template
# ═══════════════════════════════════════════════════════════

def _render_email_template(title: str, preheader: str, body_html: str,
                           cta_text: str = '', cta_url: str = '') -> str:
    """
    يولّد HTML email بتصميم MYBRIDGE الاحترافي.
    متوافق مع Gmail / Outlook / Apple Mail.
    """
    site_url = getattr(settings, 'WAITLIST_SITE_URL', 'https://www.mybridge.my')
    
    cta_button = ''
    if cta_text and cta_url:
        cta_button = f'''
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:24px auto;">
          <tr>
            <td style="background:#FF6B35;border-radius:8px;">
              <a href="{cta_url}" target="_blank"
                 style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;
                        font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">
                {cta_text}
              </a>
            </td>
          </tr>
        </table>
        '''
    
    return f'''
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>{title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <!-- Preheader (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;">{preheader}</div>
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f5f5f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1A1A2E 0%,#2d2d44 100%);padding:32px 24px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;letter-spacing:1px;">MYBRIDGE</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;font-style:italic;">The link youneed</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding:40px 32px;color:#333333;font-size:15px;line-height:1.7;">
              {body_html}
              {cta_button}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background:#1A1A2E;padding:24px;text-align:center;">
              <p style="margin:0 0 8px;color:rgba(255,255,255,0.7);font-size:12px;">MYBRIDGE</p>
              <p style="margin:0 0 4px;color:rgba(255,255,255,0.5);font-size:11px;font-style:italic;">The link youneed</p>
              <p style="margin:8px 0 4px;color:rgba(255,255,255,0.4);font-size:10px;">YOUNEED TRAVEL & TOURS SDN. BHD.</p>
              <p style="margin:0 0 8px;color:rgba(255,255,255,0.4);font-size:10px;">202301025671 (1519594-T) | No. Lesen: MOTAC L/N/12084</p>
              <a href="{site_url}" style="color:#FF6B35;font-size:11px;text-decoration:none;">www.mybridge.my</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
'''


def _send_html_email(to_email: str, subject: str, html_content: str, text_fallback: str):
    """يرسل إيميل بصيغة HTML مع نسخة نصية."""
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'contact@mybridge.my')
    from_name  = getattr(settings, 'SENDGRID_FROM_NAME', 'MYBRIDGE')
    
    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_fallback,
            from_email=f'{from_name} <{from_email}>',
            to=[to_email],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        logger.info(f"✅ Email sent to {to_email}: {subject[:50]}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send email to {to_email}: {e}")
        return False


# ═══════════════════════════════════════════════════════════
# SUPPLIER EMAILS — (كما كانت — بدون تغيير)
# ═══════════════════════════════════════════════════════════

def send_supplier_verification_email(user, token):
    """إيميل تأكيد الإيميل للمورد الجديد."""
    verification_url = (
        f"{getattr(settings, 'SUPPLIER_FRONTEND_URL', 'https://www.mybridge.my')}"
        f"/verify-email?token={token}&email={user.email}"
    )
    subject = "تأكيد بريدك الإلكتروني — MYBRIDGE"
    message = f"""
مرحباً {user.get_full_name() or user.username}،

شكراً لتسجيلك في منصة MYBRIDGE.

لتأكيد بريدك الإلكتروني، انقر على الرابط التالي:
{verification_url}

الرابط صالح لمدة 24 ساعة.

إذا لم تقم بهذا التسجيل، تجاهل هذا الإيميل.

فريق MYBRIDGE
    """
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info(f"Verification email sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send verification email to {user.email}: {e}")


def send_supplier_pending_email(user, supplier):
    """إيميل للمورد يخبره أن طلبه قيد المراجعة."""
    subject = "تم استلام طلبك — MYBRIDGE"
    message = f"""
مرحباً {user.get_full_name() or user.username}،

تم استلام طلب تسجيل {supplier.company_name} بنجاح.

سيقوم فريقنا بمراجعة طلبك خلال 1-3 أيام عمل.
سنتواصل معك عبر هذا البريد الإلكتروني بالنتيجة.

فريق MYBRIDGE
    """
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Failed to send pending email to {user.email}: {e}")


def send_supplier_approved_email(user, supplier):
    """إيميل للمورد يخبره بقبول طلبه."""
    login_url = f"{getattr(settings, 'SUPPLIER_FRONTEND_URL', 'https://www.mybridge.my')}/login"
    subject   = "🎉 تم قبول طلبك — MYBRIDGE"
    message   = f"""
مرحباً {user.get_full_name() or user.username}،

يسعدنا إخبارك بأنه تم قبول طلب تسجيل {supplier.company_name} في منصة MYBRIDGE.

يمكنك الآن تسجيل الدخول وإدارة بياناتك عبر:
{login_url}

مرحباً بك في عائلة MYBRIDGE!

فريق MYBRIDGE
    """
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Failed to send approval email to {user.email}: {e}")


def send_supplier_rejected_email(user, supplier, reason):
    """إيميل للمورد يخبره برفض طلبه مع السبب."""
    subject = "بخصوص طلب تسجيلك — MYBRIDGE"
    message = f"""
مرحباً {user.get_full_name() or user.username}،

بعد مراجعة طلب تسجيل {supplier.company_name}،
نأسف لإخبارك بأنه لم يتم قبول الطلب للسبب التالي:

{reason}

إذا كنت تعتقد أن هناك خطأ أو تريد إعادة التقديم،
يرجى التواصل معنا على: contact@mybridge.my

فريق MYBRIDGE
    """
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Failed to send rejection email to {user.email}: {e}")


def send_admin_new_supplier_notification(supplier):
    """إشعار للمسؤول عند تسجيل مورد جديد."""
    from django.contrib.auth import get_user_model
    User = get_user_model()

    admin_emails = list(
        User.objects.filter(
            role__in=['super_admin', 'admin'],
            is_active=True
        ).values_list('email', flat=True)
    )

    if not admin_emails:
        return

    admin_url = f"{getattr(settings, 'FRONTEND_URL', 'https://www.mybridge.my')}/admin/suppliers/{supplier.id}/review"
    subject   = f"[مورد جديد] {supplier.company_name} — بانتظار المراجعة"
    message   = f"""
مورد جديد بانتظار المراجعة:

الاسم:    {supplier.company_name}
النوع:    {supplier.get_supplier_type_display()}
الدولة:   {supplier.country}
الإيميل:  {supplier.email}

للمراجعة والبت:
{admin_url}
    """
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=admin_emails,
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Failed to send admin notification: {e}")


# ═══════════════════════════════════════════════════════════
# AGENCY EMAILS — 🆕 جديدة (كلها HTML احترافي)
# ═══════════════════════════════════════════════════════════

def send_agency_pending_email(agency):
    """
    إيميل للوكالة بعد التسجيل الأولي — يخبرها بأن الطلب قيد المراجعة.
    
    يُستدعى من: AgencyRegisterView (بعد إنشاء Agency)
    """
    subject = f"تم استلام طلب تسجيل وكالتك — MYBRIDGE"
    
    body_html = f'''
    <h2 style="margin:0 0 16px;color:#1A1A2E;font-size:22px;">مرحباً {agency.contact_person_name or agency.name}،</h2>
    
    <p style="margin:0 0 16px;">
      شكراً لتقديم طلب تسجيل وكالتكم <strong style="color:#FF6B35;">{agency.name}</strong> في منصة MYBRIDGE.
    </p>
    
    <p style="margin:0 0 16px;">
      لقد استلمنا طلبكم بنجاح مع جميع الوثائق المطلوبة:
    </p>
    
    <ul style="margin:0 0 16px;padding-right:20px;color:#555;">
      <li style="margin-bottom:6px;">الرخصة التجارية ✓</li>
      <li style="margin-bottom:6px;">الشهادة الضريبية ✓</li>
      <li style="margin-bottom:6px;">هوية المالك ✓</li>
    </ul>
    
    <div style="background:#FFF5F0;border-right:4px solid #FF6B35;padding:16px;margin:24px 0;border-radius:4px;">
      <p style="margin:0 0 8px;color:#1A1A2E;font-weight:bold;">⏱️ المدة المتوقعة للمراجعة</p>
      <p style="margin:0;color:#555;font-size:14px;">1 إلى 3 أيام عمل</p>
    </div>
    
    <p style="margin:0 0 8px;">
      سيقوم فريقنا بمراجعة طلبكم وسنتواصل معكم عبر هذا البريد الإلكتروني بالنتيجة.
    </p>
    
    <p style="margin:24px 0 0;color:#888;font-size:13px;">
      رقم المرجع: <code style="background:#f5f5f5;padding:2px 8px;border-radius:4px;">{agency.id}</code>
    </p>
    '''
    
    text_fallback = f"""
مرحباً {agency.contact_person_name or agency.name}،

تم استلام طلب تسجيل وكالتكم {agency.name} بنجاح.

المدة المتوقعة للمراجعة: 1-3 أيام عمل.

سنتواصل معكم قريباً.

رقم المرجع: {agency.id}

فريق MYBRIDGE
contact@mybridge.my
"""
    
    html = _render_email_template(
        title="طلب التسجيل قيد المراجعة",
        preheader=f"استلمنا طلب {agency.name} وسنراجعه خلال 1-3 أيام عمل",
        body_html=body_html,
    )
    
    return _send_html_email(agency.email, subject, html, text_fallback)


def send_agency_approved_email(agency, activation_token):
    """
    إيميل للوكالة عند القبول — مع رابط التفعيل لإنشاء username + password.
    
    يُستدعى من: HQAgencyApproveView (بعد الموافقة وتوليد token)
    """
    site_url = getattr(settings, 'WAITLIST_SITE_URL', 'https://www.mybridge.my')
    activation_url = f"{site_url}/activate-agency?token={activation_token.token}"
    
    subject = f"🎉 تهانينا! تم قبول وكالتكم — MYBRIDGE"
    
    body_html = f'''
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:64px;height:64px;background:#4CAF50;border-radius:50%;line-height:64px;font-size:32px;">✓</div>
    </div>
    
    <h2 style="margin:0 0 16px;color:#1A1A2E;font-size:24px;text-align:center;">
      تهانينا {agency.contact_person_name or agency.name}!
    </h2>
    
    <p style="margin:0 0 16px;text-align:center;font-size:16px;">
      تم قبول طلب تسجيل وكالتكم <strong style="color:#FF6B35;">{agency.name}</strong> في منصة MYBRIDGE.
    </p>
    
    <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin:24px 0;">
      <h3 style="margin:0 0 12px;color:#1A1A2E;font-size:16px;">📋 تفاصيل الاعتماد:</h3>
      <p style="margin:0 0 6px;color:#555;font-size:14px;">
        <strong>نسبة العمولة:</strong> {agency.commission_rate}%
      </p>
      <p style="margin:0 0 6px;color:#555;font-size:14px;">
        <strong>نوع الوكالة:</strong> {agency.get_agency_type_display()}
      </p>
      <p style="margin:0;color:#555;font-size:14px;">
        <strong>العملة الافتراضية:</strong> {agency.get_currency_display()}
      </p>
    </div>
    
    <div style="background:#FFF5F0;border-right:4px solid #FF6B35;padding:16px;margin:24px 0;border-radius:4px;">
      <p style="margin:0 0 8px;color:#1A1A2E;font-weight:bold;">🔐 الخطوة التالية: تفعيل حسابك</p>
      <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">
        اضغط على الزر أدناه لإنشاء اسم المستخدم وكلمة المرور الخاصة بك، والبدء في استخدام المنصة.
      </p>
    </div>
    
    <p style="margin:16px 0 8px;color:#888;font-size:12px;">
      ⏰ هذا الرابط صالح لمدة <strong>7 أيام</strong> من تاريخ الإرسال.
    </p>
    
    <p style="margin:0 0 0;color:#888;font-size:12px;">
      إذا لم يعمل الزر، انسخ الرابط التالي في متصفحك:<br>
      <a href="{activation_url}" style="color:#FF6B35;word-break:break-all;">{activation_url}</a>
    </p>
    '''
    
    text_fallback = f"""
🎉 تهانينا!

تم قبول طلب تسجيل وكالتكم {agency.name} في منصة MYBRIDGE.

تفاصيل الاعتماد:
- نسبة العمولة: {agency.commission_rate}%
- نوع الوكالة: {agency.get_agency_type_display()}
- العملة الافتراضية: {agency.get_currency_display()}

الخطوة التالية: تفعيل حسابك
افتح الرابط التالي لإنشاء username و password:
{activation_url}

⏰ الرابط صالح لمدة 7 أيام.

فريق MYBRIDGE
contact@mybridge.my
"""
    
    html = _render_email_template(
        title="تم قبول وكالتكم",
        preheader=f"اضغط لتفعيل حساب {agency.name} وبدء استخدام المنصة",
        body_html=body_html,
        cta_text="تفعيل حسابي الآن",
        cta_url=activation_url,
    )
    
    return _send_html_email(agency.email, subject, html, text_fallback)


def send_agency_rejected_email(agency, reason: str):
    """
    إيميل للوكالة عند الرفض مع السبب.
    
    يُستدعى من: HQAgencyRejectView
    """
    subject = f"بخصوص طلب تسجيل وكالتكم — MYBRIDGE"
    
    body_html = f'''
    <h2 style="margin:0 0 16px;color:#1A1A2E;font-size:22px;">مرحباً {agency.contact_person_name or agency.name}،</h2>
    
    <p style="margin:0 0 16px;">
      شكراً لاهتمامكم بالانضمام إلى منصة MYBRIDGE.
    </p>
    
    <p style="margin:0 0 16px;">
      بعد مراجعة طلب تسجيل وكالتكم <strong>{agency.name}</strong>،
      نأسف لإبلاغكم بأنه لم يتم قبول الطلب للسبب التالي:
    </p>
    
    <div style="background:#FEF2F2;border-right:4px solid #DC2626;padding:16px;margin:24px 0;border-radius:4px;">
      <p style="margin:0;color:#991B1B;font-size:14px;line-height:1.7;white-space:pre-wrap;">{reason}</p>
    </div>
    
    <p style="margin:16px 0;">
      إذا كنتم تعتقدون أن هناك خطأ، أو ترغبون في إعادة التقديم بعد معالجة الملاحظات،
      يرجى التواصل معنا:
    </p>
    
    <p style="margin:0 0 16px;text-align:center;">
      <a href="mailto:contact@mybridge.my" style="color:#FF6B35;font-weight:bold;">contact@mybridge.my</a>
    </p>
    
    <p style="margin:24px 0 0;color:#666;font-size:13px;">
      رقم المرجع: <code style="background:#f5f5f5;padding:2px 8px;border-radius:4px;">{agency.id}</code>
    </p>
    '''
    
    text_fallback = f"""
مرحباً {agency.contact_person_name or agency.name}،

بعد مراجعة طلب تسجيل وكالتكم {agency.name}،
نأسف لإبلاغكم بأنه لم يتم قبول الطلب للسبب التالي:

{reason}

إذا كنتم تعتقدون أن هناك خطأ، يرجى التواصل معنا:
contact@mybridge.my

رقم المرجع: {agency.id}

فريق MYBRIDGE
"""
    
    html = _render_email_template(
        title="بخصوص طلب التسجيل",
        preheader=f"نتيجة مراجعة طلب {agency.name}",
        body_html=body_html,
    )
    
    return _send_html_email(agency.email, subject, html, text_fallback)


def send_admin_new_agency_notification(agency):
    """
    إشعار للمسؤولين عند تسجيل وكالة جديدة بانتظار المراجعة.
    
    يُستدعى من: AgencyRegisterView
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    admin_emails = list(
        User.objects.filter(
            role__in=['super_admin', 'admin'],
            is_active=True
        ).values_list('email', flat=True)
    )
    
    if not admin_emails:
        logger.warning("No admin emails found to notify about new agency")
        return False
    
    subject = f"[وكالة جديدة] {agency.name} — بانتظار المراجعة"
    
    body_html = f'''
    <h2 style="margin:0 0 16px;color:#1A1A2E;font-size:20px;">🔔 وكالة جديدة بانتظار المراجعة</h2>
    
    <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin:16px 0;">
      <p style="margin:0 0 10px;"><strong>الاسم:</strong> {agency.name}</p>
      <p style="margin:0 0 10px;"><strong>الاسم (EN):</strong> {agency.name_en or '—'}</p>
      <p style="margin:0 0 10px;"><strong>الدولة:</strong> {agency.country}</p>
      <p style="margin:0 0 10px;"><strong>المدينة:</strong> {agency.city}</p>
      <p style="margin:0 0 10px;"><strong>الإيميل:</strong> {agency.email}</p>
      <p style="margin:0 0 10px;"><strong>الهاتف:</strong> {agency.phone}</p>
      <p style="margin:0 0 10px;"><strong>السجل التجاري:</strong> {agency.registration_number}</p>
      <p style="margin:0 0 10px;"><strong>نوع الوكالة:</strong> {agency.get_agency_type_display()}</p>
      <p style="margin:0;"><strong>جهة الاتصال:</strong> {agency.contact_person_name} ({agency.contact_person_position})</p>
    </div>
    
    <p style="margin:16px 0;color:#555;">
      يرجى تسجيل الدخول إلى لوحة الإدارة لمراجعة الوثائق واتخاذ القرار.
    </p>
    
    <p style="margin:0;color:#888;font-size:12px;">
      رقم المرجع: <code style="background:#f5f5f5;padding:2px 8px;border-radius:4px;">{agency.id}</code>
    </p>
    '''
    
    text_fallback = f"""
🔔 وكالة جديدة بانتظار المراجعة

الاسم: {agency.name}
الدولة: {agency.country} — {agency.city}
الإيميل: {agency.email}
الهاتف: {agency.phone}
السجل التجاري: {agency.registration_number}
جهة الاتصال: {agency.contact_person_name} ({agency.contact_person_position})

رقم المرجع: {agency.id}

يرجى تسجيل الدخول إلى لوحة الإدارة لمراجعة الطلب.
"""
    
    html = _render_email_template(
        title="وكالة جديدة بانتظار المراجعة",
        preheader=f"{agency.name} — {agency.country}",
        body_html=body_html,
    )
    
    # إرسال لكل مسؤول
    success_count = 0
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'contact@mybridge.my')
    from_name  = getattr(settings, 'SENDGRID_FROM_NAME', 'MYBRIDGE')
    
    for admin_email in admin_emails:
        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_fallback,
                from_email=f'{from_name} <{from_email}>',
                to=[admin_email],
            )
            msg.attach_alternative(html, "text/html")
            msg.send(fail_silently=False)
            success_count += 1
            logger.info(f"✅ Admin notification sent to {admin_email}")
        except Exception as e:
            logger.error(f"❌ Failed to notify {admin_email}: {e}")
    
    return success_count > 0


# ═══════════════════════════════════════════════════════════
# OTP & WELCOME EMAILS — للموردين (Waitlist Approval)
# ═══════════════════════════════════════════════════════════

def send_otp_email(email: str, code: str) -> bool:
    """يرسل رمز OTP للمورد عبر الإيميل (3 لغات)."""
    subject = 'MYBRIDGE — رمز الدخول | Login Code | Kod Log Masuk'

    body_html = f'''
        <h2 style="color:#1A1A2E;margin:0 0 16px;font-size:20px;">رمز الدخول الخاص بك</h2>
        <p style="color:#444;font-size:14px;line-height:1.7;margin:0 0 20px;">
          استخدم الرمز التالي لتسجيل الدخول إلى لوحة المورد:
        </p>

        <div style="text-align:center;margin:28px 0;padding:24px;background:#f9fafb;border-radius:12px;border:2px dashed #FF6B35;">
          <p style="margin:0 0 8px;font-size:12px;color:#888;letter-spacing:1px;">YOUR LOGIN CODE</p>
          <p style="margin:0;font-size:36px;font-weight:bold;color:#FF6B35;letter-spacing:8px;font-family:monospace;">
            {code}
          </p>
        </div>

        <p style="color:#666;font-size:13px;line-height:1.6;margin:0 0 12px;">
          ⏱️ صالح لمدة <strong>10 دقائق</strong> فقط
        </p>
        <p style="color:#666;font-size:13px;line-height:1.6;margin:0 0 20px;">
          🔒 لا تشارك هذا الرمز مع أي شخص. فريق MYBRIDGE لن يطلبه منك أبداً.
        </p>

        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">

        <h3 style="color:#1A1A2E;margin:0 0 8px;font-size:15px;">English:</h3>
        <p style="color:#666;font-size:13px;line-height:1.5;margin:0 0 12px;">
          Use the code above to log in to your supplier portal. Valid for 10 minutes. Never share this code.
        </p>

        <h3 style="color:#1A1A2E;margin:0 0 8px;font-size:15px;">Bahasa Malaysia:</h3>
        <p style="color:#666;font-size:13px;line-height:1.5;margin:0 0 12px;">
          Gunakan kod di atas untuk log masuk ke portal pembekal anda. Sah selama 10 minit.
        </p>
    '''

    html = _render_email_template(
        title='رمز الدخول | Login Code',
        preheader=f'رمز دخولك: {code}',
        body_html=body_html,
    )

    text = (
        f'رمز الدخول الخاص بك: {code}\n'
        f'صالح لمدة 10 دقائق.\n\n'
        f'Your login code: {code}\n'
        f'Valid for 10 minutes.\n'
    )
    return _send_html_email(email, subject, html, text)


def send_supplier_welcome_email(user, hotel_or_service) -> bool:
    """
    إيميل ترحيب للمورد بعد موافقة الأدمن — يحوي:
    - تأكيد الموافقة
    - رابط بوّابة المورد /supplier
    - شرح الدخول عبر OTP
    """
    site_url = getattr(settings, 'WAITLIST_SITE_URL', 'https://www.mybridge.my')
    portal_url = f'{site_url}/supplier'

    entity_name = getattr(hotel_or_service, 'name', '')
    entity_label = 'فندقك' if hasattr(hotel_or_service, 'stars') else 'خدمتك'

    subject = 'MYBRIDGE — تمت الموافقة على طلبك | Application Approved'

    body_html = f'''
        <h2 style="color:#1A1A2E;margin:0 0 16px;font-size:22px;">🎉 مرحباً بك في MYBRIDGE!</h2>
        <p style="color:#444;font-size:15px;line-height:1.7;margin:0 0 16px;">
          نسعد بإبلاغك أنه <strong style="color:#10b981;">تمت الموافقة</strong> على طلب تسجيل {entity_label}:
        </p>
        <p style="color:#1A1A2E;font-size:18px;font-weight:bold;margin:0 0 24px;background:#fff7f0;padding:14px;border-radius:8px;border-right:3px solid #FF6B35;">
          {entity_name}
        </p>

        <h3 style="color:#1A1A2E;margin:24px 0 12px;font-size:17px;">📋 الخطوات التالية:</h3>
        <ol style="color:#444;font-size:14px;line-height:1.8;padding-right:20px;margin:0 0 24px;">
          <li>اضغط زر "دخول لوحة المورد" أدناه</li>
          <li>أدخل بريدك الإلكتروني (نفس الذي سجّلت به: <strong>{user.email}</strong>)</li>
          <li>سيصلك رمز دخول من 6 أرقام إلى بريدك</li>
          <li>أدخل الرمز للدخول إلى لوحتك</li>
        </ol>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:24px auto;">
          <tr>
            <td style="background:#FF6B35;border-radius:8px;">
              <a href="{portal_url}" target="_blank"
                 style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;
                        font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">
                دخول لوحة المورد ←
              </a>
            </td>
          </tr>
        </table>

        <p style="color:#888;font-size:12px;text-align:center;margin:0 0 20px;">
          أو انسخ الرابط: <a href="{portal_url}" style="color:#FF6B35;">{portal_url}</a>
        </p>

        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="color:#666;font-size:13px;line-height:1.6;margin:0;">
          🔒 <strong>لا حاجة لكلمة سر</strong> — في كل مرة ترغب بالدخول، سيُرسَل رمز جديد لإيميلك.
        </p>
    '''

    html = _render_email_template(
        title='تمت الموافقة على طلبك',
        preheader='تم اعتماد تسجيلك في MYBRIDGE — ادخل لوحتك الآن',
        body_html=body_html,
        cta_text='',
        cta_url='',
    )

    text = (
        f'تمت الموافقة على طلب {entity_name}.\n'
        f'لتسجيل الدخول، زُر: {portal_url}\n'
        f'أدخل إيميلك ({user.email}) واتبع التعليمات.\n'
    )
    return _send_html_email(user.email, subject, html, text)
