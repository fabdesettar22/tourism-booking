from django.contrib import admin
from django import forms
from .models import TourPackage, PackageCity, PackageCityHotel, PackageCityService
from apps.locations.models import Country, City
from apps.services.models import Service
from apps.hotels.models import Hotel


# ====================== Inline للفنادق (داخل كل مدينة) ======================
class PackageCityHotelInline(admin.TabularInline):
    model = PackageCityHotel
    extra = 1
    fields = ['hotel', 'nights']

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "hotel":
            # قراءة city_id من المدينة الأب
            city_id = None
            if hasattr(self, 'parent_instance') and self.parent_instance and self.parent_instance.city_id:
                city_id = self.parent_instance.city_id
            elif request.POST and 'city' in request.POST:
                city_id = request.POST.get('city')

            if city_id:
                try:
                    kwargs['queryset'] = Hotel.objects.filter(city_id=int(city_id)).order_by('name')
                except (ValueError, TypeError):
                    kwargs['queryset'] = Hotel.objects.none()
            else:
                kwargs['queryset'] = Hotel.objects.none()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def get_formset(self, request, obj=None, **kwargs):
        self.parent_instance = obj
        return super().get_formset(request, obj, **kwargs)


# ====================== Inline للخدمات (داخل كل مدينة) ======================
class PackageCityServiceInline(admin.TabularInline):
    model = PackageCityService
    extra = 3
    fields = ['service', 'custom_price']

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "service":
            city_id = None
            if hasattr(self, 'parent_instance') and self.parent_instance and self.parent_instance.city_id:
                city_id = self.parent_instance.city_id
            elif request.POST and 'city' in request.POST:
                city_id = request.POST.get('city')

            if city_id:
                try:
                    kwargs['queryset'] = Service.objects.filter(city_id=int(city_id)).order_by('name')
                except (ValueError, TypeError):
                    kwargs['queryset'] = Service.objects.none()
            else:
                kwargs['queryset'] = Service.objects.none()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def get_formset(self, request, obj=None, **kwargs):
        self.parent_instance = obj
        return super().get_formset(request, obj, **kwargs)


# ====================== Inline للمدن ======================
class PackageCityInline(admin.TabularInline):
    model = PackageCity
    extra = 1
    fields = ['city', 'nights']
    inlines = [PackageCityHotelInline, PackageCityServiceInline]

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "city":
            country_id = request.POST.get('country') or request.GET.get('country')
            if country_id:
                try:
                    kwargs['queryset'] = City.objects.filter(country_id=int(country_id)).order_by('name')
                except (ValueError, TypeError):
                    kwargs['queryset'] = City.objects.none()
            else:
                kwargs['queryset'] = City.objects.none()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


class TourPackageForm(forms.ModelForm):
    country = forms.ModelChoiceField(
        queryset=Country.objects.all().order_by('name'),
        label="الدولة",
        required=True,
        empty_label="اختر الدولة"
    )

    class Meta:
        model = TourPackage
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['country'].widget.attrs.update({'onchange': 'this.form.submit()'})


@admin.register(TourPackage)
class TourPackageAdmin(admin.ModelAdmin):
    form = TourPackageForm
    inlines = [PackageCityInline]
    list_display = ['name', 'base_price', 'currency', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}