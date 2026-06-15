from django.apps import AppConfig


class RecognitionConfig(AppConfig):
    name = "recognition"

    def ready(self):
        try:
            import recognition.signals  # noqa: F401
        except ImportError:
            pass
