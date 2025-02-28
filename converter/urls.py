from django.urls import path

from . import views

# конфигурация URL для приложения
urlpatterns = [
    path("", views.index, name="index"),
]