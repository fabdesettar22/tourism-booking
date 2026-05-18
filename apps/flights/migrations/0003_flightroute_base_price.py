from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('flights', '0002_remove_flightbookingrequest_flights_boo_status_f15866_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='flightroute',
            name='base_price',
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text='Manual ticket price before commission (MYR or route currency).',
                max_digits=12,
                null=True,
            ),
        ),
    ]
