from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import BlogPost, BlogRevision
from .services import calc_read_time, make_unique_slug, sanitize_html


@receiver(pre_save, sender=BlogPost, dispatch_uid='blog_post_pre_save_clean')
def blog_post_pre_save(sender, instance: BlogPost, **kwargs):
    if instance.content:
        instance.content = sanitize_html(instance.content)
    instance.read_time = calc_read_time(instance.content)
    if not instance.slug:
        instance.slug = make_unique_slug(instance.title or 'post', instance.language, exclude_pk=instance.pk)


@receiver(post_save, sender=BlogPost, dispatch_uid='blog_post_post_save_revision')
def blog_post_create_revision(sender, instance: BlogPost, created, **kwargs):
    if instance.status != 'published':
        return
    last = BlogRevision.objects.filter(post=instance).order_by('-created_at').first()
    if last and last.title == instance.title and last.content == instance.content:
        return
    BlogRevision.objects.create(
        post=instance,
        title=instance.title,
        content=instance.content,
        edited_by=instance.author,
    )
