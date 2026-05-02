import uuid
from django.conf import settings
from django.db import models


class BlogPostQuerySet(models.QuerySet):
    def alive(self):
        return self.filter(deleted_at__isnull=True)

    def published(self):
        return self.alive().filter(status='published')


class BlogPostManager(models.Manager.from_queryset(BlogPostQuerySet)):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class BlogCategory(models.Model):
    AUDIENCE_CHOICES = [
        ('tourist', 'Tourist'),
        ('partner', 'Partner Agency'),
        ('supplier', 'Supplier'),
        ('all', 'All'),
    ]

    name_ar = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    name_ms = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True)
    target_audience = models.CharField(max_length=10, choices=AUDIENCE_CHOICES, default='all')
    color = models.CharField(max_length=7, default='#FF6B35')
    icon = models.CharField(max_length=50, blank=True)
    order = models.PositiveSmallIntegerField(default=0, db_index=True)

    class Meta:
        db_table = 'blog_category'
        ordering = ['order', 'name_en']
        verbose_name = 'Blog Category'
        verbose_name_plural = 'Blog Categories'

    def __str__(self):
        return self.name_en

    def name_for(self, lang: str) -> str:
        return getattr(self, f'name_{lang}', self.name_en) or self.name_en


class BlogTag(models.Model):
    name_ar = models.CharField(max_length=50)
    name_en = models.CharField(max_length=50)
    name_ms = models.CharField(max_length=50)
    slug = models.SlugField(max_length=80, unique=True)

    class Meta:
        db_table = 'blog_tag'
        ordering = ['name_en']
        verbose_name = 'Blog Tag'
        verbose_name_plural = 'Blog Tags'

    def __str__(self):
        return self.name_en

    def name_for(self, lang: str) -> str:
        return getattr(self, f'name_{lang}', self.name_en) or self.name_en


class BlogPost(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('scheduled', 'Scheduled'),
    ]
    LANG_CHOICES = [('ar', 'العربية'), ('en', 'English'), ('ms', 'Bahasa Melayu')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(max_length=200, unique=True)
    title = models.CharField(max_length=300)
    content = models.TextField(help_text='HTML sanitized via bleach')
    excerpt = models.TextField(max_length=500, blank=True)
    cover_image = models.ImageField(upload_to='blog/covers/%Y/%m/', blank=True, null=True)

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='blog_posts',
    )
    category = models.ForeignKey(
        BlogCategory,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='posts',
    )
    tags = models.ManyToManyField(BlogTag, blank=True, related_name='posts')

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    language = models.CharField(max_length=2, choices=LANG_CHOICES, default='en')
    translation_group = models.UUIDField(null=True, blank=True, db_index=True)

    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    scheduled_at = models.DateTimeField(null=True, blank=True, db_index=True)

    meta_title = models.CharField(max_length=60, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)
    og_image = models.ImageField(upload_to='blog/og/', blank=True, null=True)

    read_time = models.PositiveSmallIntegerField(default=0, help_text='In minutes')
    view_count = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False, db_index=True)

    deleted_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = BlogPostManager()
    all_objects = models.Manager()

    class Meta:
        db_table = 'blog_post'
        ordering = ['-published_at', '-created_at']
        verbose_name = 'Blog Post'
        verbose_name_plural = 'Blog Posts'
        indexes = [
            models.Index(fields=['status', 'language', '-published_at']),
            models.Index(fields=['is_featured', '-published_at']),
        ]

    def __str__(self):
        return f'[{self.language}] {self.title}'


class BlogRelatedHotel(models.Model):
    post = models.ForeignKey(BlogPost, on_delete=models.CASCADE, related_name='related_hotels')
    hotel = models.ForeignKey('hotels.Hotel', on_delete=models.CASCADE, related_name='blog_mentions')
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'blog_related_hotel'
        ordering = ['order', 'id']
        unique_together = [('post', 'hotel')]
        verbose_name = 'Blog → Hotel'

    def __str__(self):
        return f'{self.post_id} ↔ hotel#{self.hotel_id}'


class BlogRelatedService(models.Model):
    post = models.ForeignKey(BlogPost, on_delete=models.CASCADE, related_name='related_services')
    service = models.ForeignKey('services.Service', on_delete=models.CASCADE, related_name='blog_mentions')
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'blog_related_service'
        ordering = ['order', 'id']
        unique_together = [('post', 'service')]
        verbose_name = 'Blog → Service'

    def __str__(self):
        return f'{self.post_id} ↔ service#{self.service_id}'


class BlogRevision(models.Model):
    post = models.ForeignKey(BlogPost, on_delete=models.CASCADE, related_name='revisions')
    title = models.CharField(max_length=300)
    content = models.TextField()
    edited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='blog_revisions',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'blog_revision'
        ordering = ['-created_at']
        verbose_name = 'Blog Revision'

    def __str__(self):
        return f'rev for {self.post_id} @ {self.created_at:%Y-%m-%d %H:%M}'
