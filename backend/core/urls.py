from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from plots.views import PlotViewSet  # <--- THIS IS LINE 4

router = DefaultRouter()
router.register(r'plots', PlotViewSet, basename='plot')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]