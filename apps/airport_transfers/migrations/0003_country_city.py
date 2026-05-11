# Generated 2026-05-08 — manually trimmed (drop RenameIndex + AlterField on Airport.id)
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('airport_transfers', '0002_tour_guide_margin_pct'),
        ('locations', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='airporttransfer',
            name='country',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='airport_transfers',
                to='locations.country', verbose_name='الدولة',
            ),
        ),
        migrations.AddField(
            model_name='airporttransfer',
            name='city',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='airport_transfers',
                to='locations.city', verbose_name='المدينة',
            ),
        ),
    ]
