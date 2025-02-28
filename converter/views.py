import requests
from django.shortcuts import render
import json
from django.core.cache import cache
from decouple import config


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
        cache.set("currency_exchange_rates_cache", rates,timeout=3600) # data updates hourly
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
