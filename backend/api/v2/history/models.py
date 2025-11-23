"""
Prompt History v2 Models
User-bound prompt history with credits-based enhancement
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()


class PromptHistory(models.Model):
    """
    Stores user prompt history with enhancement capabilities
    """

    # Intent categories for filtering
    INTENT_CATEGORIES = [
        ('summary', 'Summary'),
        ('creative', 'Creative Writing'),
        ('analysis', 'Analysis'),
        ('code', 'Code Generation'),
        ('translation', 'Translation'),
        ('other', 'Other'),
    ]

    # Source tracking
    SOURCES = [
        ('extension', 'Browser Extension'),
        ('web', 'Web Application'),
        ('api', 'Direct API'),
    ]

    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='prompt_history')

    # Prompt data
    original_prompt = models.TextField(help_text="Original user prompt")
    optimized_prompt = models.TextField(blank=True, null=True, help_text="Enhanced/optimized prompt")

    # Metadata
    intent_category = models.CharField(
        max_length=20,
        choices=INTENT_CATEGORIES,
        default='other',
        db_index=True
    )
    source = models.CharField(
        max_length=20,
        choices=SOURCES,
        default='web',
        db_index=True
    )
    tags = models.JSONField(default=list, blank=True, help_text="User tags for organization")
    meta = models.JSONField(default=dict, blank=True, help_text="Additional metadata (session_id, etc.)")

    # Enhancement tracking
    model = models.CharField(max_length=50, blank=True, null=True, help_text="Model used for enhancement")
    tokens = models.IntegerField(null=True, blank=True, help_text="Tokens used in enhancement")
    credits_spent = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Credits debited for enhancement"
    )
    enhanced_at = models.DateTimeField(null=True, blank=True, help_text="When enhancement was performed")

    # Soft delete
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'prompt_history'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_deleted', '-created_at']),
            models.Index(fields=['user', 'intent_category', '-created_at']),
            models.Index(fields=['user', 'source', '-created_at']),
        ]
        verbose_name = 'Prompt History'
        verbose_name_plural = 'Prompt Histories'

    def __str__(self):
        preview = self.original_prompt[:60] + '...' if len(self.original_prompt) > 60 else self.original_prompt
        return f"{self.user.username} - {preview}"

    def soft_delete(self):
        """Perform soft delete"""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])

    def mark_enhanced(self, optimized_prompt, model, tokens, credits_spent):
        """Mark prompt as enhanced"""
        self.optimized_prompt = optimized_prompt
        self.model = model
        self.tokens = tokens
        self.credits_spent = credits_spent
        self.enhanced_at = timezone.now()
        self.save(update_fields=[
            'optimized_prompt', 'model', 'tokens',
            'credits_spent', 'enhanced_at', 'updated_at'
        ])
