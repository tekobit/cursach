from django.contrib import admin
from .models import FavouriteCurrencyPair, UserConversionHistory, ChangedCurrency

@admin.register(FavouriteCurrencyPair)
class FavouriteCurrencyPairAdmin(admin.ModelAdmin):
    list_display = ('user', 'from_currency', 'to_currency', 'order')
    list_filter = ('user',)
    search_fields = ('user__username', 'from_currency', 'to_currency')

@admin.register(UserConversionHistory)
class UserConversionHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'from_currency', 'to_currency', 'amount', 'timestamp')
    list_filter = ('user', 'timestamp')
    search_fields = ('user__username', 'from_currency', 'to_currency')
    date_hierarchy = 'timestamp'

@admin.register(ChangedCurrency)
class ChangedCurrencyAdmin(admin.ModelAdmin):
    list_display = ('user', 'from_currency', 'to_currency', 'from_value', 'to_value', 'created_at')
    list_filter = ('user', 'created_at', 'from_currency', 'to_currency')
    search_fields = ('user__username', 'from_currency', 'to_currency')