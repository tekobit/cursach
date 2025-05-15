import json
import urllib.parse

from django.contrib.auth import logout
from django.contrib.auth.forms import AuthenticationForm
from django.db import IntegrityError
from django.utils.dateparse import parse_datetime

from converter.models import UserConversionHistory, FavouriteCurrencyPair, ChangedCurrency
from django.shortcuts import render, redirect
from django.contrib.auth import login
from django.contrib.auth.forms import UserCreationForm
from django.utils.timezone import make_aware



def migrate_conversion_history(request, user):
    cookie_raw = request.COOKIES.get("conversionHistory")
    if not cookie_raw:
        return
    try:
        decoded = urllib.parse.unquote(cookie_raw)
        history_list = json.loads(decoded)
        for entry in history_list:
            from_currency = entry.get("from")
            to_currency = entry.get("to")
            amount = entry.get("amount")
            date_str = entry.get("date")

            timestamp = parse_datetime(date_str)
            if timestamp and timestamp.tzinfo is None:
                timestamp = make_aware(timestamp)

            if from_currency and to_currency and amount is not None and timestamp:
                UserConversionHistory.objects.create(
                    user=user,
                    from_currency=from_currency,
                    to_currency=to_currency,
                    amount=amount,
                    timestamp=timestamp
                )
    except Exception as e:
        print("Ошибка при миграции истории из cookie:", e)


def migrate_favourites(request, user):
    favourites_raw = request.COOKIES.get("favourites")
    if not favourites_raw:
        return
    try:
        decoded = urllib.parse.unquote(favourites_raw)
        favourites_list = json.loads(decoded)
        for index, entry in enumerate(favourites_list):
            from_currency = entry.get("from")
            to_currency = entry.get("to")
            if from_currency and to_currency:
                try:
                    FavouriteCurrencyPair.objects.create(
                        user=user,
                        from_currency=from_currency,
                        to_currency=to_currency,
                        order=index
                    )
                except IntegrityError:
                    pass
    except Exception as e:
        print("Ошибка при миграции избранных пар из cookie:", e)


def migrate_changed_currencies(request, user):
    cookie_changed = request.COOKIES.get("changedCurrencies")
    if not cookie_changed:
        return
    try:
        decoded = urllib.parse.unquote(cookie_changed)
        changed_list = json.loads(decoded)
        for entry in changed_list:
            from_currency = entry.get("from")
            to_currency = entry.get("to")
            from_value = entry.get("fromValue")
            to_value = entry.get("toValue")
            old_rate = entry.get("oldChangedCurrencyRate")

            if all(val is not None for val in [from_currency, to_currency, from_value, to_value, old_rate]):
                ChangedCurrency.objects.create(
                    user=user,
                    from_currency=from_currency,
                    to_currency=to_currency,
                    from_value=from_value,
                    to_value=to_value,
                    old_changed_currency_rate=old_rate
                )
    except Exception as e:
        print("Ошибка при миграции кастомных курсов из cookie:", e)


def register_view(request):
    if request.method == "POST":
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)

            migrate_conversion_history(request, user)
            migrate_favourites(request, user)
            migrate_changed_currencies(request, user)

            response = redirect("converter")
            response.delete_cookie("conversionHistory")
            response.delete_cookie("changedCurrencies")
            response.delete_cookie("favourites")
            return response

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
