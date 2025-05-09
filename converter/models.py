from django.db import models

# Create your models here.
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