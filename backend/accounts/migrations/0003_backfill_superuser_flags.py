from django.db import migrations


def mark_superusers(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(role='superuser').update(
        is_staff=True,
        is_superuser=True,
        is_active=True,
        status='approved',
    )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_groups_user_is_active_user_is_staff_and_more'),
    ]

    operations = [
        migrations.RunPython(mark_superusers, reverse_code=noop),
    ]
