from django.apps import AppConfig


# корректирование конфигурации
class ConverterConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'converter'
