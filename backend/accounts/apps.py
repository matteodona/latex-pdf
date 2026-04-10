from pathlib import Path

from django.apps import AppConfig
from django.conf import settings


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        engine = settings.DATABASES['default'].get('ENGINE', '')
        if 'sqlite' in engine:
            db_path = settings.DATABASES['default']['NAME']
            path = Path(db_path)
            path.parent.mkdir(parents=True, exist_ok=True)
