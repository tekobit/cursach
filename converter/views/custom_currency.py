from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
import json

from converter.models import ChangedCurrency


@login_required
def add_changed_currency(request):
    if request.method == "POST":
        data = json.loads(request.body)

        ChangedCurrency.objects.create(
            user=request.user,
            from_currency=data['from'],
            to_currency=data['to'],
            from_value=data['fromValue'],
            to_value=data['toValue'],
        )
        return JsonResponse({"status": "ok"})

@login_required
def remove_changed_currency(request):
    if request.method == "POST":
        data = json.loads(request.body)
        ChangedCurrency.objects.filter(
            user=request.user,
            from_currency=data['from'],
            to_currency=data['to']
        ).delete()
        return JsonResponse({"status": "ok"})

@login_required
def get_changed_currencies(request):
    changed = ChangedCurrency.objects.filter(user=request.user)
    result = [{
        "from": c.from_currency,
        "to": c.to_currency,
        "fromValue": c.from_value,
        "toValue": c.to_value,
    } for c in changed]
    return JsonResponse({"data": result})
