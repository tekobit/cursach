from django.urls import path
from .views import login_view,register_view,logout_view,index

# конфигурация URL для приложения
urlpatterns = [
    path("", index, name="converter"),
    path("register/", register_view, name="register"),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout')
]