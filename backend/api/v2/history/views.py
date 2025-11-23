"""
Prompt History v2 Views
JWT-authenticated, user-bound CRUD + Enhancement endpoint
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from decimal import Decimal
import uuid

from .models import PromptHistory
from .serializers import (
    PromptHistorySerializer,
    PromptHistoryCreateSerializer,
    PromptHistoryUpdateSerializer,
    EnhanceRequestSerializer,
    EnhanceResponseSerializer,
)
from .permissions import IsOwnerOrReadOnlyStaff
from .services import PromptEnhancementService, InsufficientCreditsError


class PromptHistoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Prompt History CRUD operations
    All operations are scoped to the authenticated user
    """
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnlyStaff]
    lookup_field = 'id'

    def get_queryset(self):
        """
        Filter by user and non-deleted items
        Support filtering by intent_category, source, date range
        """
        queryset = PromptHistory.objects.filter(
            user=self.request.user,
            is_deleted=False
        )

        # Filter by intent_category
        intent_category = self.request.query_params.get('intent_category')
        if intent_category:
            queryset = queryset.filter(intent_category=intent_category)

        # Filter by source
        source = self.request.query_params.get('source')
        if source:
            queryset = queryset.filter(source=source)

        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)

        # Search by keyword
        keyword = self.request.query_params.get('q')
        if keyword:
            queryset = queryset.filter(
                Q(original_prompt__icontains=keyword) |
                Q(optimized_prompt__icontains=keyword) |
                Q(tags__contains=[keyword])
            )

        return queryset.order_by('-created_at')

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return PromptHistoryCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PromptHistoryUpdateSerializer
        return PromptHistorySerializer

    def perform_create(self, serializer):
        """Bind to current user on create"""
        # Handle idempotency
        idempotency_key = self.request.headers.get('X-Idempotency-Key')
        if idempotency_key:
            # Check if we already created this
            existing = PromptHistory.objects.filter(
                user=self.request.user,
                meta__idempotency_key=idempotency_key,
                is_deleted=False
            ).first()
            if existing:
                # Return existing instead of creating new
                serializer.instance = existing
                return

        # Add idempotency key to meta if provided
        meta = serializer.validated_data.get('meta', {})
        if idempotency_key:
            meta['idempotency_key'] = idempotency_key

        serializer.save(user=self.request.user, meta=meta)

    def perform_destroy(self, instance):
        """Soft delete instead of hard delete"""
        instance.soft_delete()

    @action(detail=True, methods=['post'], url_path='enhance')
    def enhance(self, request, id=None):
        """
        Enhancement endpoint: POST /api/v2/history/{id}/enhance/
        Runs optimization pipeline, debits credits, fills optimized_prompt
        """
        # Get the history object
        history = self.get_object()

        # Validate request
        request_serializer = EnhanceRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)

        model = request_serializer.validated_data['model']
        style = request_serializer.validated_data['style']

        # Handle idempotency
        idempotency_key = request.headers.get('X-Idempotency-Key')
        if idempotency_key:
            # Check if we already enhanced this
            if history.optimized_prompt and history.meta.get('enhance_idempotency_key') == idempotency_key:
                # Return existing enhancement
                response_serializer = EnhanceResponseSerializer(history)
                return Response(response_serializer.data)

        try:
            # Run enhancement service
            service = PromptEnhancementService()
            result = service.enhance_prompt(
                user=request.user,
                history=history,
                model=model,
                style=style
            )

            # Update history with enhancement
            meta = history.meta.copy()
            if idempotency_key:
                meta['enhance_idempotency_key'] = idempotency_key

            history.mark_enhanced(
                optimized_prompt=result['optimized_prompt'],
                model=result['model'],
                tokens=result['tokens'],
                credits_spent=result['credits_spent']
            )
            history.meta = meta
            history.save(update_fields=['meta'])

            # Return response
            response_serializer = EnhanceResponseSerializer(history)
            return Response(response_serializer.data)

        except InsufficientCreditsError as e:
            return Response(
                {
                    'error': 'insufficient_credits',
                    'message': str(e),
                    'required_credits': e.required_credits,
                    'current_credits': e.current_credits,
                },
                status=status.HTTP_402_PAYMENT_REQUIRED
            )
        except Exception as e:
            return Response(
                {
                    'error': 'enhancement_failed',
                    'message': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
