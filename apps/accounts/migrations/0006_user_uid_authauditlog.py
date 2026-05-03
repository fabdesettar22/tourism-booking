# Generated for tourism_booking — manual edit to backfill User.uid safely.
import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def backfill_user_uid(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    for u in User.objects.filter(uid__isnull=True).only('id'):
        User.objects.filter(pk=u.pk).update(uid=uuid.uuid4())


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_alter_agency_email'),
    ]

    operations = [
        # 1) أضف uid قابل لـ NULL (لا default متعدّد، نستخدم RunPython لاحقاً)
        migrations.AddField(
            model_name='user',
            name='uid',
            field=models.UUIDField(null=True, editable=False, verbose_name='UUID المستخدم'),
        ),

        # 2) املأ كل صف بـ UUID فريد
        migrations.RunPython(backfill_user_uid, reverse_code=migrations.RunPython.noop),

        # 3) فعّل default + unique بعد التأكد من عدم وجود NULL
        migrations.AlterField(
            model_name='user',
            name='uid',
            field=models.UUIDField(
                default=uuid.uuid4, editable=False, unique=True,
                verbose_name='UUID المستخدم',
            ),
        ),

        # 4) أنشئ AuthAuditLog
        migrations.CreateModel(
            name='AuthAuditLog',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('action', models.CharField(choices=[
                    ('LOGIN_SUCCESS', 'دخول ناجح'),
                    ('LOGIN_FAIL', 'دخول فاشل'),
                    ('LOGOUT', 'خروج'),
                    ('TOKEN_REFRESH', 'تحديث توكن'),
                    ('LOCKOUT', 'إيقاف الحساب'),
                ], db_index=True, max_length=20)),
                ('ip_address', models.CharField(blank=True, default='', max_length=45)),
                ('user_agent', models.CharField(blank=True, default='', max_length=1024)),
                ('timestamp', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('tenant', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.PROTECT,
                    related_name='auth_events', to='accounts.agency',
                    verbose_name='الوكالة (tenant)',
                )),
                ('user', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='auth_events', to=settings.AUTH_USER_MODEL,
                    verbose_name='المستخدم',
                )),
            ],
            options={
                'verbose_name': 'حدث مصادقة',
                'verbose_name_plural': 'سجل المصادقة',
                'db_table': 'auth_audit_log',
                'ordering': ['-timestamp'],
                'indexes': [
                    models.Index(fields=['user', '-timestamp'], name='auth_audit__user_id_db87dc_idx'),
                    models.Index(fields=['action', '-timestamp'], name='auth_audit__action_abe196_idx'),
                ],
            },
        ),
    ]
