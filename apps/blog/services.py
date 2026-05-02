"""Business logic for the blog module. Views call into here — no ORM in views."""
import re
import uuid
from django.db import transaction
from django.db.models import F, Q
from django.utils import timezone
from django.utils.text import slugify as dj_slugify

try:
    from slugify import slugify as unicode_slugify
except ImportError:  # pragma: no cover
    unicode_slugify = None

try:
    import bleach
    BLEACH_AVAILABLE = True
except ImportError:  # pragma: no cover
    BLEACH_AVAILABLE = False

from .models import BlogPost, BlogRevision, BlogRelatedHotel, BlogRelatedService


ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4',
    'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre',
    'figure', 'figcaption', 'span', 'div', 'hr',
]
ALLOWED_ATTRS = {
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    '*': ['class', 'dir', 'style'],
}


def sanitize_html(html: str) -> str:
    if not html:
        return ''
    if not BLEACH_AVAILABLE:
        return html
    return bleach.clean(html, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS, strip=True)


def calc_read_time(html: str) -> int:
    if not html:
        return 0
    text = re.sub(r'<[^>]+>', ' ', html)
    words = len(text.split())
    return max(1, round(words / 200))


def make_unique_slug(title: str, lang: str = 'en', exclude_pk=None) -> str:
    base = (unicode_slugify(title) if unicode_slugify else dj_slugify(title, allow_unicode=True)) or 'post'
    base = base[:180]
    candidate = f'{base}-{lang}' if lang and lang != 'en' else base
    n = 1
    qs = BlogPost.all_objects.all()
    if exclude_pk:
        qs = qs.exclude(pk=exclude_pk)
    while qs.filter(slug=candidate).exists():
        n += 1
        candidate = f'{base}-{lang}-{n}' if lang and lang != 'en' else f'{base}-{n}'
    return candidate


@transaction.atomic
def publish_post(post: BlogPost, *, by_user=None) -> BlogPost:
    post.status = 'published'
    if not post.published_at:
        post.published_at = timezone.now()
    if not post.translation_group:
        post.translation_group = uuid.uuid4()
    post.save()
    if by_user:
        BlogRevision.objects.create(
            post=post, title=post.title, content=post.content, edited_by=by_user,
        )
    return post


@transaction.atomic
def unpublish_post(post: BlogPost) -> BlogPost:
    post.status = 'draft'
    post.save(update_fields=['status', 'updated_at'])
    return post


@transaction.atomic
def soft_delete_post(post: BlogPost) -> None:
    post.deleted_at = timezone.now()
    post.save(update_fields=['deleted_at', 'updated_at'])


@transaction.atomic
def duplicate_post(post: BlogPost, *, by_user) -> BlogPost:
    new_title = f'{post.title} (Copy)'
    new = BlogPost.objects.create(
        title=new_title,
        slug=make_unique_slug(new_title, post.language),
        content=post.content,
        excerpt=post.excerpt,
        cover_image=post.cover_image,
        author=by_user,
        category=post.category,
        status='draft',
        language=post.language,
        meta_title=post.meta_title,
        meta_description=post.meta_description,
        read_time=post.read_time,
    )
    new.tags.set(post.tags.all())
    return new


@transaction.atomic
def restore_revision(post: BlogPost, revision: BlogRevision, *, by_user) -> BlogPost:
    post.title = revision.title
    post.content = revision.content
    post.save()
    BlogRevision.objects.create(
        post=post, title=post.title, content=post.content, edited_by=by_user,
    )
    return post


def increment_views(slug: str) -> None:
    BlogPost.objects.filter(slug=slug).update(view_count=F('view_count') + 1)


@transaction.atomic
def set_related_hotels(post: BlogPost, hotel_ids: list[int]) -> None:
    post.related_hotels.all().delete()
    BlogRelatedHotel.objects.bulk_create([
        BlogRelatedHotel(post=post, hotel_id=hid, order=i)
        for i, hid in enumerate(hotel_ids)
    ])


@transaction.atomic
def set_related_services(post: BlogPost, service_ids: list[int]) -> None:
    post.related_services.all().delete()
    BlogRelatedService.objects.bulk_create([
        BlogRelatedService(post=post, service_id=sid, order=i)
        for i, sid in enumerate(service_ids)
    ])


def find_related_posts(post: BlogPost, limit: int = 3):
    qs = BlogPost.objects.published().exclude(pk=post.pk).filter(language=post.language)
    if post.category_id:
        same_cat = qs.filter(category_id=post.category_id)
        if same_cat.exists():
            return same_cat[:limit]
    tag_ids = list(post.tags.values_list('id', flat=True))
    if tag_ids:
        return qs.filter(tags__in=tag_ids).distinct()[:limit]
    return qs[:limit]


def publish_due_scheduled() -> int:
    """Run by Celery beat: publish posts whose scheduled_at has arrived."""
    now = timezone.now()
    due = BlogPost.objects.filter(status='scheduled', scheduled_at__lte=now)
    count = 0
    for post in due:
        post.status = 'published'
        post.published_at = post.scheduled_at or now
        if not post.translation_group:
            post.translation_group = uuid.uuid4()
        post.save()
        count += 1
    return count


def stats_summary() -> dict:
    qs = BlogPost.objects.all()
    return {
        'total': qs.count(),
        'published': qs.filter(status='published').count(),
        'drafts': qs.filter(status='draft').count(),
        'scheduled': qs.filter(status='scheduled').count(),
        'total_views': qs.aggregate(s=models.Sum('view_count'))['s'] or 0,
    }


# late import to avoid circulars when building stats
from django.db import models  # noqa: E402
