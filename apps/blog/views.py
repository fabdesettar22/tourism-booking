from django.db.models import Q
from rest_framework import viewsets, status, permissions, filters, generics
from rest_framework.decorators import action, api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from .models import BlogPost, BlogCategory, BlogTag, BlogRevision
from .serializers import (
    BlogPostListSerializer, BlogPostDetailSerializer, BlogPostWriteSerializer,
    BlogCategorySerializer, BlogTagSerializer, BlogRevisionSerializer,
)
from .permissions import IsBlogEditor
from . import services


class PublicPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 50


class AdminPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# ════════════════════════════════════════════════════════════════════════
# Public — AllowAny
# ════════════════════════════════════════════════════════════════════════

class PublicBlogPostViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = BlogPostDetailSerializer
    lookup_field = 'slug'
    pagination_class = PublicPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content', 'excerpt']
    ordering = ['-published_at']

    def get_queryset(self):
        qs = (BlogPost.objects.published()
              .select_related('category', 'author')
              .prefetch_related('tags', 'related_hotels__hotel__city',
                                'related_services__service'))
        params = self.request.query_params
        if lang := params.get('lang'):
            qs = qs.filter(language=lang)
        if cat := params.get('category'):
            qs = qs.filter(Q(category__slug=cat) | Q(category_id=cat if cat.isdigit() else 0))
        if tag := params.get('tag'):
            qs = qs.filter(tags__slug=tag)
        if params.get('featured') in ('true', '1'):
            qs = qs.filter(is_featured=True)
        return qs.distinct()

    def get_serializer_class(self):
        return BlogPostListSerializer if self.action == 'list' else BlogPostDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        services.increment_views(instance.slug)
        instance.view_count += 1
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=['get'], url_path='translations')
    def translations(self, request, slug=None):
        post = self.get_object()
        if not post.translation_group:
            return Response([])
        siblings = (BlogPost.objects.published()
                    .filter(translation_group=post.translation_group)
                    .exclude(pk=post.pk))
        return Response([
            {'language': p.language, 'slug': p.slug, 'title': p.title}
            for p in siblings
        ])


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def public_related_posts(request, slug):
    try:
        post = BlogPost.objects.published().get(slug=slug)
    except BlogPost.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    related = services.find_related_posts(post, limit=3)
    return Response(BlogPostListSerializer(related, many=True).data)


class PublicCategoryListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = BlogCategorySerializer
    queryset = BlogCategory.objects.all()
    pagination_class = None


class PublicTagListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = BlogTagSerializer
    queryset = BlogTag.objects.all()
    pagination_class = None


# ════════════════════════════════════════════════════════════════════════
# Admin — IsAdminUser
# ════════════════════════════════════════════════════════════════════════

class AdminBlogPostViewSet(viewsets.ModelViewSet):
    permission_classes = [IsBlogEditor]
    pagination_class = AdminPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content', 'author__email']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = (BlogPost.objects.all()
              .select_related('category', 'author')
              .prefetch_related('tags'))
        p = self.request.query_params
        if s := p.get('status'):
            qs = qs.filter(status=s)
        if lang := p.get('language'):
            qs = qs.filter(language=lang)
        if cat := p.get('category'):
            qs = qs.filter(category_id=cat) if cat.isdigit() else qs.filter(category__slug=cat)
        return qs

    def get_serializer_class(self):
        if self.action in ('list',):
            return BlogPostListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return BlogPostWriteSerializer
        return BlogPostDetailSerializer

    def perform_destroy(self, instance):
        services.soft_delete_post(instance)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        post = self.get_object()
        services.publish_post(post, by_user=request.user)
        return Response(BlogPostDetailSerializer(post).data)

    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        post = self.get_object()
        services.unpublish_post(post)
        return Response(BlogPostDetailSerializer(post).data)

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        post = self.get_object()
        new = services.duplicate_post(post, by_user=request.user)
        return Response(BlogPostDetailSerializer(new).data, status=201)

    @action(detail=True, methods=['get'])
    def revisions(self, request, pk=None):
        post = self.get_object()
        return Response(BlogRevisionSerializer(post.revisions.all(), many=True).data)

    @action(detail=True, methods=['post'], url_path='restore/(?P<revision_id>[^/.]+)')
    def restore(self, request, pk=None, revision_id=None):
        post = self.get_object()
        try:
            rev = post.revisions.get(pk=revision_id)
        except BlogRevision.DoesNotExist:
            return Response({'detail': 'Revision not found'}, status=404)
        services.restore_revision(post, rev, by_user=request.user)
        return Response(BlogPostDetailSerializer(post).data)


@api_view(['POST'])
@permission_classes([IsBlogEditor])
@parser_classes([MultiPartParser, FormParser])
def admin_upload_image(request):
    """Image upload from inline rich-text editor. Returns {url}."""
    f = request.FILES.get('image') or request.FILES.get('file')
    if not f:
        return Response({'detail': 'No image provided'}, status=400)
    from django.core.files.storage import default_storage
    from django.utils import timezone
    path = f'blog/inline/{timezone.now():%Y/%m}/{f.name}'
    saved = default_storage.save(path, f)
    return Response({'url': default_storage.url(saved)})


@api_view(['GET'])
@permission_classes([IsBlogEditor])
def admin_stats(request):
    return Response(services.stats_summary())


class AdminCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsBlogEditor]
    serializer_class = BlogCategorySerializer
    queryset = BlogCategory.objects.all()
    pagination_class = None


class AdminTagViewSet(viewsets.ModelViewSet):
    permission_classes = [IsBlogEditor]
    serializer_class = BlogTagSerializer
    queryset = BlogTag.objects.all()
    pagination_class = None
