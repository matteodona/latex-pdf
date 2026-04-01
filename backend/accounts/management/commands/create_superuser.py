from django.core.management.base import BaseCommand

from accounts.models import User


class Command(BaseCommand):
    help = 'Crea un superutente approvato (equivalente a scripts/createSuperUser.js).'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str)
        parser.add_argument('password', type=str)

    def handle(self, *args, **options):
        username = options['username']
        password = options['password']
        if User.objects.filter(username=username).exists():
            self.stderr.write(self.style.ERROR(f'L\'utente "{username}" esiste già.'))
            return
        User.objects.create_superuser(
            username=username,
            password=password,
            role=User.Role.SUPERUSER,
            status=User.Status.APPROVED,
        )
        self.stdout.write(self.style.SUCCESS('Superutente creato con successo.'))
        self.stdout.write(f'  username: {username}')
