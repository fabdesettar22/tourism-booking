from django.contrib import admin
from .models import BlogPost, BlogCategory, BlogTag, BlogRelatedHotel, BlogRelatedService, BlogRevision


class RelatedHotelInline(admin.TabularInline):
    model = BlogRelatedHotel
    extra = 0
    autocomplete_fields = ['hotel']


class RelatedServiceInline(admin.TabularInline):
    model = BlogRelatedService
    extra = 0
    autocomplete_fields = ['service']


class RevisionInline(admin.TabularInline):
    model = BlogRevision
    extra = 0
    readonly_fields = ['title', 'edited_by', 'created_at']
    can_delete = False
    show_change_link = True


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'category', 'language', 'status',
                    'published_at', 'view_count', 'is_featured')
    list_filter = ('status', 'language', 'category', 'is_featured')
    search_fields = ('title', 'content', 'author__email')
    readonly_fields = ('view_count', 'read_time', 'created_at', 'updated_at',
                       'translation_group')
    autocomplete_fields = ['author', 'category', 'tags']
    inlines = [RelatedHotelInline, RelatedServiceInline, RevisionInline]
    actions = ['publish_selected', 'unpublish_selected']

    def publish_selected(self, request, queryset):
        from . import services
        for p in queryset:
            services.publish_post(p, by_user=request.user)
    publish_selected.short_description = 'Publish selected posts'

    def unpublish_selected(self, request, queryset):
        from . import services
        for p in queryset:
            services.unpublish_post(p)
    unpublish_selected.short_description = 'Unpublish selected posts'


@admin.register(BlogCategory)
class BlogCategoryAdmin(admin.ModelAdmin):
    list_display = ('name_en', 'slug', 'target_audience', 'order')
    list_editable = ('order',)
    search_fields = ('name_en', 'name_ar', 'name_ms', 'slug')


@admin.register(BlogTag)
class BlogTagAdmin(admin.ModelAdmin):
    list_display = ('name_en', 'slug')
    search_fields = ('name_en', 'name_ar', 'name_ms', 'slug')


@admin.register(BlogRevision)
class BlogRevisionAdmin(admin.ModelAdmin):
    list_display = ('post', 'edited_by', 'created_at')
    readonly_fields = ('post', 'title', 'content', 'edited_by', 'created_at')
    search_fields = ('post__title',)
