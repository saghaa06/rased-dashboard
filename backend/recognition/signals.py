from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import UserProfile

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance, is_admin=instance.is_superuser, is_agent=not instance.is_superuser)
    else:
        profile, _ = UserProfile.objects.get_or_create(user=instance)
        if instance.is_superuser:
            profile.is_admin = True
            profile.is_agent = False
            profile.save()
