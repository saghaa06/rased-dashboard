from django.contrib import admin
from .models import AdminSetting, Camera, RecognizedPlate, UserProfile

@admin.register(RecognizedPlate)
class RecognizedPlateAdmin(admin.ModelAdmin):
    list_display = ('plate_text', 'gate', 'direction', 'entry_method', 'confidence', 'created_at', 'entered_by')
    list_filter = ('entry_method', 'direction', 'gate', 'vehicle_type')
    search_fields = ('plate_text', 'gate', 'entered_by__username')

@admin.register(Camera)
class CameraAdmin(admin.ModelAdmin):
    list_display = ('name', 'gate_number', 'url', 'is_active', 'created_at')
    list_filter = ('is_active', 'gate_number')
    search_fields = ('name', 'url')

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_admin', 'is_agent', 'assigned_gate', 'created_at')
    list_filter = ('is_admin', 'is_agent')
    search_fields = ('user__username', 'assigned_gate')

@admin.register(AdminSetting)
class AdminSettingAdmin(admin.ModelAdmin):
    list_display = ('confidence_threshold', 'history_retention_days', 'capture_interval_seconds', 'updated_at')
