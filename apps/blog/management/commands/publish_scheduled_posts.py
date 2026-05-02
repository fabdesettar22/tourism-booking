from django.core.management.base import BaseCommand
from apps.blog.services import publish_due_scheduled


class Command(BaseCommand):
    help = 'Publish blog posts whose scheduled_at has arrived. Run via cron / Celery beat every 5 min.'

    def handle(self, *args, **opts):
        n = publish_due_scheduled()
        self.stdout.write(self.style.SUCCESS(f'Published {n} scheduled post(s)'))
