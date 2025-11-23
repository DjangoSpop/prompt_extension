"""
Prompt History v2 Serializers
"""
from rest_framework import serializers
from .models import PromptHistory


class PromptHistorySerializer(serializers.ModelSerializer):
    """
    Main serializer for Prompt History
    """

    class Meta:
        model = PromptHistory
        fields = [
            'id',
            'original_prompt',
            'optimized_prompt',
            'intent_category',
            'source',
            'tags',
            'meta',
            'model',
            'tokens',
            'credits_spent',
            'enhanced_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'optimized_prompt',
            'model',
            'tokens',
            'credits_spent',
            'enhanced_at',
            'created_at',
            'updated_at',
        ]

    def validate_tags(self, value):
        """Ensure tags is a list"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Tags must be a list")
        return value

    def validate_meta(self, value):
        """Ensure meta is a dict"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Meta must be a dictionary")
        return value


class PromptHistoryCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating prompt history
    """

    class Meta:
        model = PromptHistory
        fields = [
            'original_prompt',
            'intent_category',
            'source',
            'tags',
            'meta',
        ]

    def validate_original_prompt(self, value):
        """Ensure prompt is not empty"""
        if not value or not value.strip():
            raise serializers.ValidationError("Original prompt cannot be empty")
        return value.strip()


class PromptHistoryUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating prompt history (tags, meta, etc.)
    """

    class Meta:
        model = PromptHistory
        fields = ['tags', 'meta', 'intent_category']


class EnhanceRequestSerializer(serializers.Serializer):
    """
    Serializer for enhancement request
    """
    model = serializers.CharField(
        required=False,
        default='gpt-4o-mini',
        help_text="Model to use for enhancement"
    )
    style = serializers.CharField(
        required=False,
        default='balanced',
        help_text="Enhancement style: concise, detailed, creative, technical"
    )

    def validate_model(self, value):
        """Validate model selection"""
        allowed_models = [
            'gpt-4o-mini',
            'gpt-4o',
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022',
        ]
        if value not in allowed_models:
            raise serializers.ValidationError(
                f"Model must be one of: {', '.join(allowed_models)}"
            )
        return value

    def validate_style(self, value):
        """Validate style selection"""
        allowed_styles = ['concise', 'detailed', 'creative', 'technical', 'balanced']
        if value not in allowed_styles:
            raise serializers.ValidationError(
                f"Style must be one of: {', '.join(allowed_styles)}"
            )
        return value


class EnhanceResponseSerializer(serializers.ModelSerializer):
    """
    Serializer for enhancement response
    """

    class Meta:
        model = PromptHistory
        fields = [
            'id',
            'original_prompt',
            'optimized_prompt',
            'model',
            'tokens',
            'credits_spent',
            'enhanced_at',
        ]
        read_only_fields = fields
