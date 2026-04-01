from django.contrib import admin
from django import forms
from .models import Country, City


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']
    ordering = ['name']


class CityForm(forms.ModelForm):
    class Meta:
        model = City
        fields = ['country', 'name', 'description']


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    form = CityForm
    list_display = ['name', 'country']
    list_filter = ['country']
    search_fields = ['name', 'description']
    ordering = ['country__name', 'name']