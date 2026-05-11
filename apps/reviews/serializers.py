from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id", "user_name", "hotel", "service", "rating", "title",
            "comment", "language", "verified", "created_at",
        ]
        read_only_fields = ["id", "verified", "created_at"]

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def validate(self, data):
        h = data.get("hotel")
        s = data.get("service")
        if (h is None) == (s is None):
            raise serializers.ValidationError(
                "Provide exactly one of hotel or service."
            )
        return data

    def create(self, validated):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated["user"] = request.user
        return super().create(validated)
