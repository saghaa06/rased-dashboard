from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from recognition import views

urlpatterns = [
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_simple'),

    path('upload/', views.upload_image, name='upload_image'),
    path('capture/', views.capture_image, name='capture_image'),
    path('capture_local/', views.capture_local_image, name='capture_local_image'),
    path('history/', views.get_history, name='get_history'),
    path('history/gate/<int:gate_number>/', views.history_by_gate, name='history_by_gate'),
    path('stats/', views.get_stats, name='get_stats'),
    path('admin_stats/', views.get_admin_stats, name='get_admin_stats'),
    path('annotated/<int:record_id>/', views.get_annotated_image, name='annotated'),
    path('classify/', views.classify_vehicle, name='classify'),
    path('manual_entry/', views.manual_entry, name='manual_entry'),
    path('camera_settings/', views.camera_settings, name='camera_settings'),
    path('camera_settings/<int:camera_id>/', views.camera_detail, name='camera_detail'),
    path('admin_settings/', views.admin_settings, name='admin_settings'),
    path('user/profile/', views.get_user_profile, name='user_profile'),
]