"""يُعلن Airport و AirportTransfer كملك لتطبيق airport_transfers.

استخدام SeparateDatabaseAndState يحافظ على الجداول الموجودة (`airport` و
`airport_transfer`) كما هي — Django يُحدّث حالته فقط، لا يُنشئ جداول جديدة.
"""
from decimal import Decimal
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        # نعتمد على state-deletion في تطبيق services أولاً لتجنّب تكرار الأسماء
        ('services',  '0009_drop_airport_models_state'),
        ('hotels',    '0001_initial'),
        ('locations', '0001_initial'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name='Airport',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                        ('code', models.CharField(max_length=10, unique=True, verbose_name='رمز المطار')),
                        ('name', models.CharField(max_length=120, verbose_name='اسم المطار')),
                        ('is_active', models.BooleanField(default=True, verbose_name='نشط')),
                        ('city', models.ForeignKey(
                            blank=True, null=True,
                            on_delete=django.db.models.deletion.PROTECT,
                            related_name='airports',
                            to='locations.city',
                            verbose_name='المدينة',
                        )),
                    ],
                    options={
                        'verbose_name': 'مطار',
                        'verbose_name_plural': 'المطارات',
                        'db_table': 'airport',
                        'ordering': ['code'],
                    },
                ),
                migrations.CreateModel(
                    name='AirportTransfer',
                    fields=[
                        ('service', models.OneToOneField(
                            on_delete=django.db.models.deletion.CASCADE,
                            primary_key=True, serialize=False,
                            related_name='airport_transfer',
                            to='services.service',
                            verbose_name='الخدمة',
                        )),
                        ('price_pax_1_2',     models.DecimalField(max_digits=12, decimal_places=2, verbose_name='سعر 1-2 شخص (MYR)')),
                        ('price_pax_3_4',     models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='سعر 3-4 أشخاص (MYR)')),
                        ('price_pax_5_6',     models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='سعر 5-6 أشخاص (MYR)')),
                        ('price_pax_7_8',     models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='سعر 7-8 أشخاص (MYR)')),
                        ('price_pax_10_12',   models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='سعر 10-12 شخص (MYR)')),
                        ('price_pax_14',      models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='سعر 14 شخص (MYR)')),
                        ('price_pax_40_bus',  models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='سعر 40 شخص — حافلة كاملة (MYR)')),
                        ('margin_pct_1_2',    models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('10'), verbose_name='نسبة الربح % لشريحة 1-2')),
                        ('margin_pct_3_4',    models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('10'), verbose_name='نسبة الربح % لشريحة 3-4')),
                        ('margin_pct_5_6',    models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('10'), verbose_name='نسبة الربح % لشريحة 5-6')),
                        ('margin_pct_7_8',    models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('10'), verbose_name='نسبة الربح % لشريحة 7-8')),
                        ('margin_pct_10_12',  models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('10'), verbose_name='نسبة الربح % لشريحة 10-12')),
                        ('margin_pct_14',     models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('10'), verbose_name='نسبة الربح % لشريحة 14')),
                        ('margin_pct_40_bus', models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('10'), verbose_name='نسبة الربح % لحافلة 40')),
                        ('tour_guide_fee_myr', models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='رسم مرشد سياحي (MYR)')),
                        ('currency', models.CharField(max_length=3, default='MYR', editable=False, verbose_name='العملة')),
                        ('notes',    models.TextField(blank=True, verbose_name='ملاحظات')),
                        ('airport', models.ForeignKey(
                            on_delete=django.db.models.deletion.PROTECT,
                            related_name='transfers',
                            to='airport_transfers.airport',
                            verbose_name='المطار',
                        )),
                        ('hotel', models.ForeignKey(
                            on_delete=django.db.models.deletion.PROTECT,
                            related_name='airport_transfers',
                            to='hotels.hotel',
                            verbose_name='الفندق',
                        )),
                    ],
                    options={
                        'verbose_name': 'نقل من/إلى المطار',
                        'verbose_name_plural': 'النقل من/إلى المطار',
                        'db_table': 'airport_transfer',
                        'ordering': ['airport__code', 'hotel__name'],
                        'unique_together': {('airport', 'hotel')},
                        'indexes': [models.Index(fields=['airport', 'hotel'], name='airport_tra_airport_idx')],
                    },
                ),
            ],
            database_operations=[],
        ),
    ]
