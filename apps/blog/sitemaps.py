"""Sitemap definitions for SEO."""
from django.contrib.sitemaps import Sitemap
from .models import BlogPost


class BlogPostSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.8

    def items(self):
        return BlogPost.objects.filter(status="published")

    def lastmod(self, obj):
        return obj.updated_at if hasattr(obj, "updated_at") else obj.published_at

    def location(self, obj):
        return f"/blog/{obj.slug}"


class StaticViewSitemap(Sitemap):
    changefreq = "monthly"
    priority = 0.5

    def items(self):
        return ["", "blog", "register/supplier", "register/agency"]

    def location(self, item):
        return f"/{item}"
