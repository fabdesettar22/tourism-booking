from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    PublicBlogPostViewSet, public_related_posts,
    PublicCategoryListView, PublicTagListView,
    AdminBlogPostViewSet, AdminCategoryViewSet, AdminTagViewSet,
    admin_upload_image, admin_stats,
)

public_router = DefaultRouter()
public_router.register(r'posts', PublicBlogPostViewSet, basename='blog-post')

admin_router = DefaultRouter()
admin_router.register(r'posts', AdminBlogPostViewSet, basename='admin-blog-post')
admin_router.register(r'categories', AdminCategoryViewSet, basename='admin-blog-category')
admin_router.register(r'tags', AdminTagViewSet, basename='admin-blog-tag')

urlpatterns = [
    # Public
    path('posts/related/<slug:slug>/', public_related_posts, name='blog-related'),
    path('categories/', PublicCategoryListView.as_view(), name='blog-categories'),
    path('tags/', PublicTagListView.as_view(), name='blog-tags'),
    path('', include(public_router.urls)),

    # Admin
    path('admin/upload-image/', admin_upload_image, name='blog-upload-image'),
    path('admin/stats/', admin_stats, name='blog-stats'),
    path('admin/', include(admin_router.urls)),
]
