from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
import json

from converter.models import UserConversionHistory


@login_required
def get_history(request):
    if request.method == "GET":
        # последние 7 записей
        history_entries = UserConversionHistory.objects.filter(user=request.user)[:7]
        data = [
            {
                "from": entry.from_currency,
                "to": entry.to_currency,
                "amount": entry.amount,
                "date": entry.timestamp.isoformat()
            }
            for entry in history_entries
        ]
        return JsonResponse(data, safe=False)
    return JsonResponse({"error": "Invalid request method"}, status=405)


@require_POST
@login_required
def clear_user_history(request):
    UserConversionHistory.objects.filter(user=request.user).delete()
    return JsonResponse({"success": True})


@require_POST
@login_required
def add_history_entry(request):
    try:
        data = json.loads(request.body)
        from_currency = data.get("from")
        to_currency = data.get("to")
        amount_str = data.get("amount")

        if not all([from_currency, to_currency, amount_str]):
            return JsonResponse({"error": "Missing data"}, status=400)

        try:
            amount = float(amount_str)
        except ValueError:
            return JsonResponse({"error": "Invalid amount format"}, status=400)

        entry, created = UserConversionHistory.objects.update_or_create(
            user=request.user,
            from_currency=from_currency,
            to_currency=to_currency,
            amount=amount,
            defaults={"timestamp": timezone.now()}  # Обновим время, если уже есть
        )

        max_history_size = 150
        user_history_count = UserConversionHistory.objects.filter(user=request.user).count()
        if user_history_count > max_history_size:
            oldest_entries = UserConversionHistory.objects.filter(user=request.user).order_by('timestamp')[
                             :user_history_count - max_history_size]
            for entry in oldest_entries:
                entry.delete()

        return JsonResponse({"success": True}, status=201)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": "An unexpected error occured"}, status=500)


@require_POST
@login_required
def delete_history_entry(request):
    try:
        data = json.loads(request.body)
        from_currency = data.get("from")
        to_currency = data.get("to")
        amount = data.get("amount")

        if not all([from_currency, to_currency, amount]):
            return JsonResponse({"error": "Missing data"}, status=400)

        try:
            amount = float(amount)
        except ValueError:
            return JsonResponse({"error": "Invalid amount format"}, status=400)

        deleted_count, _ = UserConversionHistory.objects.filter(
            user=request.user,
            from_currency=from_currency,
            to_currency=to_currency,
            amount=amount
        ).delete()

        if deleted_count == 0:
            return JsonResponse({"error": "No matching entry found"}, status=404)

        return JsonResponse({"success": True})
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": "An unexpected error occurred"}, status=500)