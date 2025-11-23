"""
Prompt History v2 URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PromptHistoryViewSet

app_name = 'history'

router = DefaultRouter()
router.register(r'', PromptHistoryViewSet, basename='history')

urlpatterns = [
    path('', include(router.urls)),
]
