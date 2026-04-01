from django.contrib import admin
from django import forms
from .models import Season, RoomPrice
from apps.locations.models import Country, City
from apps.hotels.models import Hotel
from apps.rooms.models import RoomType


class RoomPriceInline(admin.TabularInline):
    model = RoomPrice
    extra = 5
    fields = [
        'room_type',
        'price_per_night',
        'discount_percentage',
        'breakfast_included',
        'child_with_bed_price',
        'child_without_bed_price',
        'infant_with_bed_price',
        'infant_without_bed_price',
    ]
    verbose_name = "سعر غرفة"
    verbose_name_plural = "أسعار الغرف"

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "room_type":
            hotel_id = None
            if request.POST and 'hotel' in request.POST:
                hotel_id = request.POST.get('hotel')
            elif request.GET and 'hotel' in request.GET:
                hotel_id = request.GET.get('hotel')
            elif hasattr(self, 'parent_instance') and self.parent_instance and self.parent_instance.hotel_id:
                hotel_id = self.parent_instance.hotel_id

            if hotel_id:
                try:
                    hotel_id = int(hotel_id)
                    kwargs['queryset'] = RoomType.objects.filter(hotel_id=hotel_id).order_by('name')
                except (ValueError, TypeError):
                    kwargs['queryset'] = RoomType.objects.none()
            else:
                kwargs['queryset'] = RoomType.objects.none()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def get_formset(self, request, obj=None, **kwargs):
        self.parent_instance = obj
        return super().get_formset(request, obj, **kwargs)


class SeasonForm(forms.ModelForm):
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
        model = Season
        fields = ['country', 'city', 'hotel', 'name', 'valid_from', 'valid_to']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['city'].queryset = City.objects.none()
        self.fields['hotel'].queryset = Hotel.objects.none()

        # تصفية هرمية (مُصححة بالكامل)
        if 'country' in self.data:
            try:
                country_id = int(self.data.get('country'))
                self.fields['city'].queryset = City.objects.filter(country_id=country_id).order_by('name')
            except (ValueError, TypeError):
                pass
        elif self.instance.pk and self.instance.hotel and self.instance.hotel.city:
            # ← هذا هو التصحيح الرئيسي
            self.fields['city'].queryset = City.objects.filter(
                country=self.instance.hotel.city.country
            ).order_by('name')

        if 'city' in self.data:
            try:
                city_id = int(self.data.get('city'))
                self.fields['hotel'].queryset = Hotel.objects.filter(city_id=city_id).order_by('name')
            except (ValueError, TypeError):
                pass
        elif self.instance.pk and self.instance.hotel:
            self.fields['hotel'].queryset = Hotel.objects.filter(
                city=self.instance.hotel.city
            ).order_by('name')

        # إعادة تحميل الصفحة
        self.fields['country'].widget.attrs.update({'onchange': 'this.form.submit()'})
        self.fields['city'].widget.attrs.update({'onchange': 'this.form.submit()'})
        self.fields['hotel'].widget.attrs.update({'onchange': 'this.form.submit()'})


@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    form = SeasonForm
    inlines = [RoomPriceInline]
    list_display = ['name', 'valid_from', 'valid_to', 'hotel']
    list_filter = ['hotel__city__country']
    search_fields = ['name']
    ordering = ['hotel__name', 'valid_from']