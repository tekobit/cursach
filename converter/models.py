from django.db import models
from django.contrib.auth.models import User


class FavouriteCurrencyPair(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favourites")
    from_currency = models.CharField(max_length=10)
    to_currency = models.CharField(max_length=10)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('user', 'from_currency', 'to_currency')
        ordering = ['order']


class UserConversionHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="conversion_history")
    from_currency = models.CharField(max_length=10)
    to_currency = models.CharField(max_length=10)
    amount = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)  # автоматическая установка времени

    class Meta:
        ordering = ['-timestamp']  # новые записи - первые

    def __str__(self):
        return f"{self.user.username}: {self.amount} {self.from_currency} to {self.to_currency} at {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
