from django.contrib import admin
from django import forms
from .models import Hotel
from apps.locations.models import Country, City


class HotelForm(forms.ModelForm):
    country = forms.ModelChoiceField(
        queryset=Country.objects.all().order_by('name'),
        label="الدولة",
        required=True,
        empty_label="اختر الدولة",
    )

    class Meta:
        model = Hotel
        fields = ['country', 'city', 'name', 'address', 'stars', 'description', 'image']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # نبدأ دائماً بقائمة مدن فارغة
        self.fields['city'].queryset = City.objects.none()

        # إذا اختار المستخدم دولة (بعد إعادة تحميل الصفحة)
        if 'country' in self.data:
            try:
                country_id = int(self.data.get('country'))
                self.fields['city'].queryset = City.objects.filter(
                    country_id=country_id
                ).order_by('name')
            except (ValueError, TypeError):
                pass

        # إذا كنا نعدل فندق موجود
        elif self.instance.pk and self.instance.city:
            self.fields['city'].queryset = City.objects.filter(
                country=self.instance.city.country
            ).order_by('name')

        # جعل حقل الدولة يعيد تحميل الصفحة تلقائياً عند التغيير
        self.fields['country'].widget.attrs.update({
            'onchange': 'this.form.submit()'
        })


@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    form = HotelForm
    list_display = ['name', 'city', 'stars', 'get_country']
    list_filter = ['city__country', 'stars']
    search_fields = ['name', 'address']
    ordering = ['name']

    def get_country(self, obj):
        return obj.city.country if obj.city else '-'
    get_country.short_description = 'الدولة'