"""
apps/advertising/urls.py

URL routing للنظام الإعلاني.
"""

from django.urls import path
from . import views

app_name = 'advertising'

urlpatterns = [
    # ═══ Public Endpoints ═══════════════════════════
    
    # GET /api/v1/advertising/ads/?placement=HOME_HERO_TOP&lang=ar
    path('ads/', views.list_active_ads, name='list-ads'),
    
    # POST /api/v1/advertising/ads/<uid>/track/
    path('ads/<uuid:creative_uid>/track/', views.track_ad_event, name='track-event'),
    
    # GET /api/v1/advertising/placements/
    path('placements/', views.list_placements, name='list-placements'),
    
    # ═══ Admin Endpoints (للأدمن فقط) ════════════════
    
    # GET    /api/v1/advertising/admin/ads/         — قائمة كل الإعلانات
    # POST   /api/v1/advertising/admin/ads/         — إنشاء إعلان جديد
    path('admin/ads/', views.admin_list_ads, name='admin-list'),
    path('admin/ads/create/', views.admin_create_ad, name='admin-create'),
    
    # GET    /api/v1/advertising/admin/ads/<id>/    — تفاصيل
    # PATCH  /api/v1/advertising/admin/ads/<id>/    — تعديل
    # DELETE /api/v1/advertising/admin/ads/<id>/    — حذف
    path('admin/ads/<int:ad_id>/', views.admin_ad_detail, name='admin-detail'),
    
    # POST /api/v1/advertising/admin/ads/<id>/toggle/  — تفعيل/إيقاف
    path('admin/ads/<int:ad_id>/toggle/', views.admin_toggle_ad, name='admin-toggle'),
    
    # GET /api/v1/advertising/admin/stats/  — إحصائيات عامة
    path('admin/stats/', views.admin_stats, name='admin-stats'),
]
