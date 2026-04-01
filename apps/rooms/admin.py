from django.contrib import admin
from django import forms
from .models import RoomType
from apps.locations.models import Country, City
from apps.hotels.models import Hotel


class RoomTypeForm(forms.ModelForm):
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
        model = RoomType
        # الحقول المطلوبة فقط (بدون الحقول المالية والموسم)
        fields = ['country', 'city', 'hotel', 'name', 'max_occupancy',
                  'description', 'image']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['city'].queryset = City.objects.none()
        self.fields['hotel'].queryset = Hotel.objects.none()

        # تصفية هرمية: دولة → مدينة → فندق
        if 'country' in self.data:
            try:
                country_id = int(self.data.get('country'))
                self.fields['city'].queryset = City.objects.filter(country_id=country_id).order_by('name')
            except (ValueError, TypeError):
                pass
        elif self.instance.pk and self.instance.hotel and self.instance.hotel.city:
            self.fields['city'].queryset = City.objects.filter(country=self.instance.hotel.city)

        if 'city' in self.data:
            try:
                city_id = int(self.data.get('city'))
                self.fields['hotel'].queryset = Hotel.objects.filter(city_id=city_id).order_by('name')
            except (ValueError, TypeError):
                pass
        elif self.instance.pk and self.instance.hotel:
            self.fields['hotel'].queryset = Hotel.objects.filter(city=self.instance.hotel.city)

        # إعادة تحميل الصفحة تلقائياً
        self.fields['country'].widget.attrs.update({'onchange': 'this.form.submit()'})
        self.fields['city'].widget.attrs.update({'onchange': 'this.form.submit()'})
        self.fields['hotel'].widget.attrs.update({'onchange': 'this.form.submit()'})


@admin.register(RoomType)
class RoomTypeAdmin(admin.ModelAdmin):
    form = RoomTypeForm
    list_display = ['name', 'hotel', 'max_occupancy', 'get_country', 'get_city']
    list_filter = ['hotel__city__country', 'hotel']
    search_fields = ['name', 'hotel__name']
    ordering = ['hotel__name', 'name']

    def get_country(self, obj):
        return obj.hotel.city.country if obj.hotel and obj.hotel.city else '-'
    get_country.short_description = 'الدولة'

    def get_city(self, obj):
        return obj.hotel.city if obj.hotel and obj.hotel.city else '-'
    get_city.short_description = 'المدينة'