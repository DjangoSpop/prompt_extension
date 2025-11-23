"""
Prompt History v2 Permissions
Owner-only access with optional staff moderation
"""
from rest_framework import permissions


class IsOwnerOrReadOnlyStaff(permissions.BasePermission):
    """
    Object-level permission to only allow owners to edit/delete
    Staff can view if ENABLE_HISTORY_MODERATION is enabled
    """

    def has_object_permission(self, request, view, obj):
        # Staff can view if moderation enabled
        from django.conf import settings
        if request.method in permissions.SAFE_METHODS:
            if getattr(settings, 'ENABLE_HISTORY_MODERATION', False) and request.user.is_staff:
                return True

        # Owner has full access
        return obj.user == request.user
