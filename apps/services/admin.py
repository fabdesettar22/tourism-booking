from django.contrib import admin
from django import forms
from .models import Service, ServiceCategory
from apps.locations.models import Country, City


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']


class ServiceForm(forms.ModelForm):
    country = forms.ModelChoiceField(
        queryset=Country.objects.all().order_by('name'),
        label="الدولة",
        required=True,
        empty_label="اختر الدولة"
    )
    city = forms.ModelChoiceField(
        queryset=City.objects.none(),
        label="المدينة",
        required=True,
        empty_label="اختر المدينة"
    )

    class Meta:
        model = Service
        fields = [
            'country', 'city', 'category', 'name', 'description',
            'base_price', 'currency', 'discount_percentage',
            'breakfast_included', 'vehicle_type', 'max_participants',
            'is_optional', 'is_transfer', 'relative_day', 'category_data'
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['city'].queryset = City.objects.none()

        if 'country' in self.data:
            try:
                country_id = int(self.data.get('country'))
                self.fields['city'].queryset = City.objects.filter(country_id=country_id).order_by('name')
            except (ValueError, TypeError):
                pass
        elif self.instance.pk and self.instance.city:
            self.fields['city'].queryset = City.objects.filter(country=self.instance.city.country)

        self.fields['country'].widget.attrs.update({'onchange': 'this.form.submit()'})
        self.fields['city'].widget.attrs.update({'onchange': 'this.form.submit()'})


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    form = ServiceForm
    list_display = ['name', 'category', 'city', 'base_price', 'currency', 'relative_day', 'is_optional']
    list_filter = ['category', 'city__country', 'is_optional', 'is_transfer']
    search_fields = ['name', 'description']
    ordering = ['city__name', 'category__name', 'name']