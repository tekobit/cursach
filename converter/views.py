import requests
from django.shortcuts import render
import json
from django.core.cache import cache
from decouple import config
from django.shortcuts import render, redirect
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import logout,login
from django.contrib.auth.forms import AuthenticationForm

from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from .models import FavouriteCurrencyPair
import json


def index(request):
    # получаем секретный ключ приложения и URL
    APP_ID = config("APP_ID")
    URL = config("URL")

    # получаем кэшированные курсы валют из БД или из API и сохраняем в кэше, если кэш пуст
    rates = cache.get("currency_exchange_rates_cache")
    if not rates:
        response = requests.get(f"{URL}?app_id={APP_ID}")
        data = response.json()
        rates = data['rates']
        cache.set("currency_exchange_rates_cache", rates,timeout=3600)
    with open("resources/currencies.json", 'r', encoding='utf-8') as file:
        currencies = json.load(file)
    with open("resources/default_currencies.json", 'r', encoding='utf-8') as file:
        default_currencies = json.load(file)

    # формируем контекст для шаблона
    context = {
        'currencies': currencies,
        'default_currency_1': default_currencies[0],
        'default_currency_2': default_currencies[1],
        'rates': rates
    }
    # отдаем шаблон с контекстом
    return render(request, "converter.html", context)


# yourapp/views.py


def register_view(request):
    if request.method == "POST":
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect("converter")
    else:
        form = UserCreationForm()
    return render(request, "register.html", {"form": form})


def login_view(request):
    if request.method == "POST":
        form = AuthenticationForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect("converter")
    else:
        form = AuthenticationForm()
    return render(request, "login.html", {"form": form})

def logout_view(request):
    logout(request)
    return redirect("converter")


@login_required
def get_favourites(request):
    favourites = FavouriteCurrencyPair.objects.filter(user=request.user)
    data = [
        {"from": f.from_currency, "to": f.to_currency}
        for f in favourites
    ]
    return JsonResponse(data, safe=False)

@require_POST
@login_required
def add_favourite(request):
    data = json.loads(request.body)
    from_currency = data.get("from")
    to_currency = data.get("to")

    existing = FavouriteCurrencyPair.objects.filter(user=request.user).count()
    if existing >= 6:
        return JsonResponse({"error": "Максимум 6 пар"}, status=400)

    pair, created = FavouriteCurrencyPair.objects.get_or_create(
        user=request.user,
        from_currency=from_currency,
        to_currency=to_currency,
        defaults={"order": existing}
    )
    if not created:
        return JsonResponse({"error": "Уже добавлено"}, status=400)

    return JsonResponse({"success": True})

@require_POST
@login_required
def remove_favourite(request):
    data = json.loads(request.body)
    from_currency = data.get("from")
    to_currency = data.get("to")

    FavouriteCurrencyPair.objects.filter(
        user=request.user,
        from_currency=from_currency,
        to_currency=to_currency
    ).delete()

    return JsonResponse({"success": True})