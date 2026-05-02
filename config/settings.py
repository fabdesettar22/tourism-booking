# config/settings.py

import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import dj_database_url
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-change-this-in-production-2026')

DEBUG = os.getenv('DEBUG', 'False') == 'True'

# ALLOWED_HOSTS — production-safe (no '*' default)
ALLOWED_HOSTS = [h.strip() for h in os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',') if h.strip()]
# Render automatically sets RENDER_EXTERNAL_HOSTNAME (e.g. 'mybridge-api.onrender.com')
RENDER_HOST = os.getenv('RENDER_EXTERNAL_HOSTNAME')
if RENDER_HOST:
    ALLOWED_HOSTS.append(RENDER_HOST)

INSTALLED_APPS = [
    # Django Core
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third Party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'cloudinary_storage',
    'cloudinary',

    # Project Apps
    'apps.accounts',
    'apps.locations',
    'apps.hotels',
    'apps.rooms',
    'apps.pricing',
    'apps.services',
    'apps.packages',
    'apps.bookings',
    'apps.notifications',
    'apps.settings_app',
    'apps.providers',
    'apps.suppliers',
    'apps.waitlist',
    'apps.blog',
     'apps.hero_hotels',
    'apps.advertising',
    'apps.waitlist_agency',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',          # يجب أن يبقى أول middleware
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ─── Database ─────────────────────────────────────────────
DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL'),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# ─── Auth ─────────────────────────────────────────────────
AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ─── Localization ─────────────────────────────────────────
LANGUAGE_CODE = 'ar'
TIME_ZONE     = 'Asia/Kuala_Lumpur'
USE_I18N      = True
USE_TZ        = True

# ─── Static & Media ───────────────────────────────────────
STATIC_URL          = '/static/'
STATICFILES_DIRS    = [BASE_DIR / 'static']
STATIC_ROOT         = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL  = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'



# ═══════════════════════════════════════════════════════════
# CLOUDINARY (production media files - Render disk is ephemeral)
# ═══════════════════════════════════════════════════════════
CLOUDINARY_CLOUD_NAME  = os.getenv('CLOUDINARY_CLOUD_NAME', '')
CLOUDINARY_API_KEY     = os.getenv('CLOUDINARY_API_KEY', '')
CLOUDINARY_API_SECRET  = os.getenv('CLOUDINARY_API_SECRET', '')

if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    CLOUDINARY_STORAGE = {
        'CLOUD_NAME': CLOUDINARY_CLOUD_NAME,
        'API_KEY':    CLOUDINARY_API_KEY,
        'API_SECRET': CLOUDINARY_API_SECRET,
        'SECURE':     True,
    }
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
    print("[settings] ✅ Cloudinary storage enabled")
else:
    print("[settings] ⚠️ Cloudinary credentials missing — using local MEDIA_ROOT")

# ═══════════════════════════════════════════════════════════
# PRODUCTION SECURITY (only when DEBUG=False)
# ═══════════════════════════════════════════════════════════
if not DEBUG:
    # Behind Render's HTTPS proxy
    SECURE_PROXY_SSL_HEADER     = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE       = True
    CSRF_COOKIE_SECURE          = True
    SECURE_SSL_REDIRECT         = False  # Render handles redirect
    SECURE_HSTS_SECONDS         = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD         = True
    SECURE_REFERRER_POLICY      = 'same-origin'
    X_FRAME_OPTIONS             = 'DENY'

# ═══════════════════════════════════════════════════════════
# CSRF_TRUSTED_ORIGINS (required for Vercel frontend POST/PUT)
# ═══════════════════════════════════════════════════════════
_csrf_extra = [o.strip() for o in os.getenv('CSRF_TRUSTED_ORIGINS', '').split(',') if o.strip()]
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
] + _csrf_extra

# ─── DRF ──────────────────────────────────────────────────
# config/settings.py — أضف في REST_FRAMEWORK:
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    # ── Throttling (Rate Limiting) ────────────────────────
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '200/hour',   # زوار غير مسجلين (مرفوعة لدعم النماذج العامة)
        'user': '1000/hour',  # مستخدمين مسجلين
        'login': '20/hour',   # خاص بـ Login — 20 محاولة/ساعة
    },
}

# ─── JWT ──────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME'   : timedelta(hours=12),
    'REFRESH_TOKEN_LIFETIME'  : timedelta(days=30),
    'ROTATE_REFRESH_TOKENS'   : True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN'       : True,       # يحدّث last_login عند كل refresh
    'AUTH_HEADER_TYPES'       : ('Bearer',),
    'USER_ID_FIELD'           : 'id',
    'USER_ID_CLAIM'           : 'user_id',
    'TOKEN_OBTAIN_PAIR_SERIALIZER': 'rest_framework_simplejwt.serializers.TokenObtainPairSerializer',
}


# ─── Cache (Redis if available, else LocMemCache) ─────────
REDIS_URL = os.getenv("REDIS_URL", "")

if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
                "IGNORE_EXCEPTIONS": True,
            },
            "KEY_PREFIX": "ynt",
            "TIMEOUT": 60 * 15,
        },
        "prices": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
                "IGNORE_EXCEPTIONS": True,
            },
            "KEY_PREFIX": "ynt_prices",
            "TIMEOUT": 60 * 60,
        },
        "sessions": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
                "IGNORE_EXCEPTIONS": True,
            },
            "KEY_PREFIX": "ynt_sess",
            "TIMEOUT": 60 * 60 * 24 * 7,
        },
    }
    SESSION_ENGINE = "django.contrib.sessions.backends.cache"
    SESSION_CACHE_ALIAS = "sessions"
else:
    # Fallback: LocMemCache (no Redis needed)
    CACHES = {
        "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"},
        "prices": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"},
        "sessions": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"},
    }
    SESSION_ENGINE = "django.contrib.sessions.backends.db"

# Cache Timeouts
CACHE_TTL = {
    "hotel_prices":    60 * 60,       # ساعة
    "search_results":  60 * 15,       # 15 دقيقة
    "package_list":    60 * 30,       # 30 دقيقة
    "agency_stats":    60 * 5,        # 5 دقائق
    "site_settings":   60 * 60 * 24,  # يوم كامل
}

# ─── CORS ─────────────────────────────────────────────────
_extra_cors = [o for o in os.getenv('CORS_ALLOWED_ORIGINS', '').split(',') if o]
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
] + _extra_cors

CORS_ALLOW_CREDENTIALS = True  # ضروري لإرسال Authorization header

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'origin',
    'x-csrftoken',
    'x-requested-with',
]

# ─── Media Files (Development) ────────────────────────────
# في الإنتاج استبدل بـ S3 أو Cloudflare R2
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024   # 5MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024   # 5MB

# ─── Misc ─────────────────────────────────────────────────
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
# ─── Logging ──────────────────────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} {name} — {message}',
            'style': '{',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        # File handlers — disabled in production (Render Free has ephemeral disk)
        # Use Render dashboard logs or external service (Logtail, Papertrail) instead.
        'null': {
            'class': 'logging.NullHandler',
        },
    },
    'loggers': {
        'apps.accounts': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps.bookings': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps.notifications': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}
# ─── Email ────────────────────────────────────────────────
EMAIL_BACKEND       = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST          = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT          = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS       = True
EMAIL_HOST_USER     = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL  = os.getenv('DEFAULT_FROM_EMAIL', 'contact@mybridge.my')

# ─── Frontend URLs (للإيميلات) ────────────────────────────
FRONTEND_URL          = os.getenv('FRONTEND_URL', 'http://localhost:3000')
SUPPLIER_FRONTEND_URL = os.getenv('SUPPLIER_FRONTEND_URL', 'http://localhost:3001')
# ─── SendGrid ─────────────────────────────────────────────
SENDGRID_FROM_NAME   = os.getenv('SENDGRID_FROM_NAME', 'MYBRIDGE')

# ─── Waitlist ─────────────────────────────────────────────
WAITLIST_SITE_NAME   = 'MYBRIDGE'
WAITLIST_SITE_URL    = os.getenv('WAITLIST_SITE_URL', 'https://www.mybridge.my')
