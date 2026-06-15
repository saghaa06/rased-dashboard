from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

VEHICLE_TYPE_CHOICES = [
    (1, 'Tourisme'), (2, 'Camion'), (3, 'Camionnette'), (4, 'Autocar'),
    (5, 'Tracteur routier'), (6, 'Autre tracteur'), (7, 'Spécial'),
    (8, 'Remorque'), (9, 'Moto')
]

DIRECTION_CHOICES = [
    ('in', 'Entrée'),
    ('out', 'Sortie'),
]

ENTRY_METHOD_CHOICES = [
    ('auto', 'Automatique'),
    ('manual', 'Manuel'),
]

GATE_CHOICES = [
    (1, 'Portail 1'),
    (2, 'Portail 2'),
    (3, 'Portail 3'),
]

class AdminSetting(models.Model):
    confidence_threshold = models.FloatField(default=0.40)
    history_retention_days = models.PositiveIntegerField(default=30)
    capture_interval_seconds = models.PositiveIntegerField(default=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Paramètre administration'
        verbose_name_plural = 'Paramètres administration'

    @classmethod
    def get_solo(cls):
        setting = cls.objects.first()
        if not setting:
            setting = cls.objects.create()
        return setting

    def __str__(self):
        return 'Paramètres système'

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    is_admin = models.BooleanField(default=False)
    is_agent = models.BooleanField(default=True)
    assigned_gate = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.username} - {"Admin" if self.is_admin else "Agent"}'

    @property
    def role(self):
        if self.is_admin:
            return 'admin'
        return 'agent'

class Camera(models.Model):
    name = models.CharField(max_length=50)
    url = models.URLField()
    gate_number = models.PositiveSmallIntegerField(choices=GATE_CHOICES, default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class RecognizedPlate(models.Model):
    image = models.ImageField(upload_to='uploads/', blank=True, null=True)
    plate_text = models.CharField(max_length=20, blank=True)
    confidence = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    exit_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.FloatField(null=True, blank=True)
    entered_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='entered_plates')
    box_x = models.IntegerField(null=True, blank=True, default=0)
    box_y = models.IntegerField(null=True, blank=True, default=0)
    box_w = models.IntegerField(null=True, blank=True, default=0)
    box_h = models.IntegerField(null=True, blank=True, default=0)
    vehicle_type = models.IntegerField(null=True, blank=True, choices=VEHICLE_TYPE_CHOICES)
    gate = models.CharField(max_length=20, blank=True, null=True)
    direction = models.CharField(max_length=10, choices=DIRECTION_CHOICES, default='in')
    entry_method = models.CharField(max_length=10, choices=ENTRY_METHOD_CHOICES, default='auto')
    wilaya = models.IntegerField(null=True, blank=True)
    annee = models.IntegerField(null=True, blank=True)
    numero_enregistrement = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if self.exit_time and self.created_at:
            diff = self.exit_time - self.created_at
            self.duration_minutes = diff.total_seconds() / 60.0
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.plate_text or "Non identifié"} - {self.created_at.strftime("%Y-%m-%d %H:%M:%S")}'
