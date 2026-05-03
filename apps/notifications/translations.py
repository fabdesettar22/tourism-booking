"""
ترجمات إشعارات النظام — تُستخدم وقت الإنشاء (write-time) لتوليد الرسالة
بلغة المستلم المفضّلة (User.language).

الاستخدام:
    from apps.notifications.translations import nt
    title   = nt('new_booking.title',   user.language)
    message = nt('new_booking.message', user.language, name=client, n=count)
"""
from typing import Any


_T: dict[str, dict[str, str]] = {
    # ── Bookings ──────────────────────────────────────
    'new_booking.title': {
        'ar': 'حجز جديد',
        'en': 'New Booking',
        'ms': 'Tempahan Baru',
    },
    'new_booking.message_admin': {
        'ar': 'حجز جديد من {name} — {n} فرد',
        'en': 'New booking from {name} — {n} guests',
        'ms': 'Tempahan baru daripada {name} — {n} orang',
    },
    'new_booking.title_agency': {
        'ar': 'تم استلام حجزك',
        'en': 'Booking received',
        'ms': 'Tempahan diterima',
    },
    'new_booking.message_agency': {
        'ar': 'تم استلام حجز {name} بنجاح وهو قيد المراجعة',
        'en': 'Booking for {name} received and is under review',
        'ms': 'Tempahan untuk {name} diterima dan sedang dikaji semula',
    },

    # ── Booking status change ─────────────────────────
    'booking_status.title': {
        'ar': 'تم تحديث حالة الحجز',
        'en': 'Booking status updated',
        'ms': 'Status tempahan dikemas kini',
    },
    'booking_status.message': {
        'ar': 'حجز {name} أصبح {status}',
        'en': 'Booking for {name} is now {status}',
        'ms': 'Tempahan untuk {name} kini {status}',
    },

    # ── Booking statuses (reused inside booking_status.message) ──
    'status.confirmed': {'ar': 'مؤكد',   'en': 'confirmed', 'ms': 'disahkan'},
    'status.cancelled': {'ar': 'ملغي',   'en': 'cancelled', 'ms': 'dibatalkan'},
    'status.completed': {'ar': 'مكتمل',  'en': 'completed', 'ms': 'selesai'},
    'status.pending'  : {'ar': 'معلق',   'en': 'pending',   'ms': 'menunggu'},

    # ── Agency lifecycle ──────────────────────────────
    'new_agency.title': {
        'ar': 'طلب انضمام وكالة جديدة',
        'en': 'New agency application',
        'ms': 'Permohonan agensi baru',
    },
    'new_agency.message': {
        'ar': 'وكالة "{name}" تطلب الانضمام للمنصة',
        'en': 'Agency "{name}" is requesting to join the platform',
        'ms': 'Agensi "{name}" memohon untuk menyertai platform',
    },
    'agency_approved.title': {
        'ar': '🎉 تمت الموافقة على وكالتك',
        'en': '🎉 Your agency has been approved',
        'ms': '🎉 Agensi anda telah diluluskan',
    },
    'agency_approved.message': {
        'ar': 'تهانينا! تمت الموافقة على وكالة "{name}"، يمكنك الآن البدء',
        'en': 'Congratulations! Agency "{name}" was approved — you may now start',
        'ms': 'Tahniah! Agensi "{name}" telah diluluskan — anda boleh memulakan sekarang',
    },
    'agency_rejected.title': {
        'ar': 'تم رفض طلب وكالتك',
        'en': 'Your agency application was rejected',
        'ms': 'Permohonan agensi anda ditolak',
    },
    'agency_rejected.message': {
        'ar': 'نأسف، تم رفض طلب وكالة "{name}". {reason}',
        'en': 'We are sorry, agency "{name}" was rejected. {reason}',
        'ms': 'Maaf, agensi "{name}" telah ditolak. {reason}',
    },

    # ── Supplier lifecycle ────────────────────────────
    'new_supplier.title': {
        'ar': 'مورّد جديد',
        'en': 'New supplier',
        'ms': 'Pembekal baru',
    },
    'new_supplier.message': {
        'ar': 'مورّد "{name}" طلب الانضمام',
        'en': 'Supplier "{name}" applied to join',
        'ms': 'Pembekal "{name}" memohon untuk menyertai',
    },
    'supplier_approved.title': {
        'ar': '🎉 تمت الموافقة على حسابك',
        'en': '🎉 Your supplier account was approved',
        'ms': '🎉 Akaun pembekal anda telah diluluskan',
    },
    'supplier_approved.message': {
        'ar': 'تمت الموافقة على عرضك "{name}"، أصبح ظاهراً للسائحين',
        'en': 'Your listing "{name}" was approved and is now visible to tourists',
        'ms': 'Penyenaraian "{name}" telah diluluskan dan kini boleh dilihat oleh pelancong',
    },
    'supplier_rejected.title': {
        'ar': 'تم رفض الطلب',
        'en': 'Application rejected',
        'ms': 'Permohonan ditolak',
    },
    'supplier_rejected.message': {
        'ar': 'نأسف، تم رفض عرض "{name}". {reason}',
        'en': 'We are sorry, listing "{name}" was rejected. {reason}',
        'ms': 'Maaf, penyenaraian "{name}" telah ditolak. {reason}',
    },
}


_FALLBACK = 'ar'
_SUPPORTED = {'ar', 'en', 'ms'}


def nt(key: str, lang: str | None = None, **params: Any) -> str:
    """يرجع الترجمة المُهيَّأة بالـ params. يقع على العربية إن لم يجد."""
    lang = lang if lang in _SUPPORTED else _FALLBACK
    table = _T.get(key)
    if table is None:
        return key  # المفتاح غير موجود — يُرجع كما هو ليُلاحَظ
    template = table.get(lang) or table.get(_FALLBACK) or key
    if params:
        try:
            return template.format(**params)
        except (KeyError, IndexError):
            return template
    return template
