from django.urls import path
from . import views

# конфигурация URL для приложения
urlpatterns = [
    path("", views.index, name="converter"),
    path("register/", views.register_view, name="register"),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    path("api/favourites/", views.get_favourites, name="get_favourites"),
    path("api/favourites/add/", views.add_favourite, name="add_favourite"),
    path("api/favourites/remove/", views.remove_favourite, name="remove_favourite"),

    path("api/history/", views.get_history, name="get_history"),
    path("api/history/add/", views.add_history_entry, name="add_history_entry"),
    path("api/history/clear/", views.clear_user_history, name="clear_whole_user_history"),
    path('api/history/delete/', views.delete_history_entry, name='delete_history_entry'),

    path('api/changed/add/', views.add_changed_currency,name="add_changed_currency"),
    path('api/changed/remove/', views.remove_changed_currency,name="remove_changed_currency"),
    path('api/changed/', views.get_changed_currencies,name="get_changed_currencies"),
]