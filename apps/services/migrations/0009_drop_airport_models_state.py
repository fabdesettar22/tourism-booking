"""يزيل Airport و AirportTransfer من حالة Django (state) بدون لمس DB.

الجداول `airport` و `airport_transfer` تبقى موجودة بكل بياناتها — فقط Django
يتوقّف عن نسبتها لتطبيق `services`. التطبيق الجديد `apps.airport_transfers`
سيعيد إعلانها في 0001 الخاصة به (state-only أيضاً).
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('services', '0008_seed_airports_transfers'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.DeleteModel(name='AirportTransfer'),
                migrations.DeleteModel(name='Airport'),
            ],
            database_operations=[],
        ),
    ]
