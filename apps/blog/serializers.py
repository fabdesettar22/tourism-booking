from rest_framework import serializers
from .models import BlogPost, BlogCategory, BlogTag, BlogRelatedHotel, BlogRelatedService, BlogRevision


class BlogCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogCategory
        fields = ['id', 'name_ar', 'name_en', 'name_ms', 'slug',
                  'target_audience', 'color', 'icon', 'order']


class BlogTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogTag
        fields = ['id', 'name_ar', 'name_en', 'name_ms', 'slug']


class _AuthorMini(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField()

    def get_full_name(self, obj):
        full = (getattr(obj, 'first_name', '') or '') + ' ' + (getattr(obj, 'last_name', '') or '')
        return full.strip() or obj.email


class _RelatedHotelOut(serializers.ModelSerializer):
    hotel_id = serializers.IntegerField(source='hotel.id', read_only=True)
    name = serializers.CharField(source='hotel.name', read_only=True)
    image = serializers.SerializerMethodField()
    city_name = serializers.SerializerMethodField()
    stars = serializers.IntegerField(source='hotel.stars', read_only=True)

    class Meta:
        model = BlogRelatedHotel
        fields = ['hotel_id', 'name', 'image', 'city_name', 'stars', 'order']

    def get_image(self, obj):
        img = getattr(obj.hotel, 'image', None)
        return img.url if img else None

    def get_city_name(self, obj):
        city = getattr(obj.hotel, 'city', None)
        return city.name if city else None


class _RelatedServiceOut(serializers.ModelSerializer):
    service_id = serializers.IntegerField(source='service.id', read_only=True)
    name = serializers.CharField(source='service.name', read_only=True)
    image = serializers.SerializerMethodField()
    service_type = serializers.CharField(source='service.service_type', read_only=True)

    class Meta:
        model = BlogRelatedService
        fields = ['service_id', 'name', 'image', 'service_type', 'order']

    def get_image(self, obj):
        img = getattr(obj.service, 'image', None)
        return img.url if img else None


class BlogPostListSerializer(serializers.ModelSerializer):
    category = BlogCategorySerializer(read_only=True)
    tags = BlogTagSerializer(many=True, read_only=True)
    author = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = [
            'id', 'slug', 'title', 'excerpt', 'cover_image',
            'category', 'tags', 'language', 'status',
            'published_at', 'read_time', 'view_count',
            'is_featured', 'author',
        ]

    def get_author(self, obj):
        return _AuthorMini(obj.author).data


class BlogRevisionSerializer(serializers.ModelSerializer):
    edited_by_email = serializers.EmailField(source='edited_by.email', read_only=True)

    class Meta:
        model = BlogRevision
        fields = ['id', 'title', 'created_at', 'edited_by_email']


class BlogPostDetailSerializer(BlogPostListSerializer):
    related_hotels = _RelatedHotelOut(many=True, read_only=True)
    related_services = _RelatedServiceOut(many=True, read_only=True)

    class Meta(BlogPostListSerializer.Meta):
        fields = BlogPostListSerializer.Meta.fields + [
            'content', 'meta_title', 'meta_description', 'og_image',
            'translation_group', 'scheduled_at', 'updated_at', 'created_at',
            'related_hotels', 'related_services',
        ]


class BlogPostWriteSerializer(serializers.ModelSerializer):
    related_hotel_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, write_only=True,
    )
    related_service_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, write_only=True,
    )
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=BlogTag.objects.all(), source='tags', required=False,
    )

    class Meta:
        model = BlogPost
        fields = [
            'id', 'slug', 'title', 'content', 'excerpt', 'cover_image',
            'category', 'tag_ids', 'status', 'language', 'translation_group',
            'published_at', 'scheduled_at',
            'meta_title', 'meta_description', 'og_image',
            'is_featured',
            'related_hotel_ids', 'related_service_ids',
        ]
        read_only_fields = ['id', 'translation_group']
        extra_kwargs = {'slug': {'required': False, 'allow_blank': True}}

    def create(self, validated_data):
        from . import services
        related_hotels = validated_data.pop('related_hotel_ids', [])
        related_services = validated_data.pop('related_service_ids', [])
        tags = validated_data.pop('tags', [])
        request = self.context.get('request')
        validated_data['author'] = request.user if request else None
        post = BlogPost.objects.create(**validated_data)
        if tags:
            post.tags.set(tags)
        if related_hotels:
            services.set_related_hotels(post, related_hotels)
        if related_services:
            services.set_related_services(post, related_services)
        return post

    def update(self, instance, validated_data):
        from . import services
        related_hotels = validated_data.pop('related_hotel_ids', None)
        related_services = validated_data.pop('related_service_ids', None)
        tags = validated_data.pop('tags', None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if tags is not None:
            instance.tags.set(tags)
        if related_hotels is not None:
            services.set_related_hotels(instance, related_hotels)
        if related_services is not None:
            services.set_related_services(instance, related_services)
        return instance
