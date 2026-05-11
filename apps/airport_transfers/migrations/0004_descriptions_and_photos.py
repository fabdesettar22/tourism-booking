# Trimmed manually — drop RenameIndex + AlterField on Airport.id
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('airport_transfers', '0003_country_city'),
    ]

    operations = [
        migrations.AddField(
            model_name='airporttransfer',
            name='description_ar',
            field=models.TextField(blank=True, verbose_name='الوصف بالعربية'),
        ),
        migrations.AddField(
            model_name='airporttransfer',
            name='description_en',
            field=models.TextField(blank=True, verbose_name='الوصف بالإنجليزية'),
        ),
        migrations.CreateModel(
            name='AirportTransferPhoto',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='airport_transfers/photos/%Y/%m/', verbose_name='الصورة')),
                ('is_primary', models.BooleanField(default=False, verbose_name='الصورة الرئيسية')),
                ('order', models.PositiveSmallIntegerField(default=0, verbose_name='الترتيب')),
                ('caption', models.CharField(blank=True, max_length=200, verbose_name='تعليق')),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('transfer', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='photos',
                    to='airport_transfers.airporttransfer',
                    verbose_name='الخدمة',
                )),
            ],
            options={
                'db_table': 'airport_transfer_photo',
                'ordering': ['order', 'uploaded_at'],
                'indexes': [models.Index(fields=['transfer', 'is_primary'], name='airport_tra_transfe_0009a7_idx')],
            },
        ),
    ]
