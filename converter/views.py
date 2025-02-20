import requests
from django.shortcuts import render
import json
from django.core.cache import cache
from decouple import config
from django.http import HttpResponse


def index(request):
    SECRET_KEY = config("SECRET_KEY")
    URL = config("URL")

    rates = cache.get("currency_exchange_rates_cache")
    if not rates:
        response = requests.get(f"{URL}?app_id={SECRET_KEY}")
        data = response.json()
        rates = data['rates']
        cache.set("currency_exchange_rates_cache", rates,timeout=3600) # 3600 cause api data updates hourly
    with open("resources/currencies.json", 'r', encoding='utf-8') as file:
        currencies = json.load(file)
    with open("resources/default_currencies.json", 'r', encoding='utf-8') as file:
        default_currencies = json.load(file)

    context = {
        'currencies': currencies,
        'default_currency_1': default_currencies[0],
        'default_currency_2': default_currencies[1],
        'rates': rates
    }
    return render(request, "converter.html", context)
