
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
import json

from converter.models import FavouriteCurrencyPair


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

    return JsonResponse({"success": True}, status=201)


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
