import sqlite3
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.utils.dateparse import parse_datetime
from django.utils import timezone

from accounts.models import User


class Command(BaseCommand):
    help = (
        'Migra utenti dalla tabella SQLite accounts_user verso il DB corrente '
        '(tipicamente PostgreSQL).'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--sqlite-path',
            type=str,
            default='data/db.sqlite3',
            help='Percorso del file SQLite sorgente (default: data/db.sqlite3).',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Mostra cosa verrebbe migrato senza scrivere sul DB target.',
        )
        parser.add_argument(
            '--update-existing',
            action='store_true',
            help='Aggiorna anche gli utenti gia\' presenti (default: skip).',
        )

    def handle(self, *args, **options):
        sqlite_path = Path(options['sqlite_path']).resolve()
        dry_run = bool(options['dry_run'])
        update_existing = bool(options['update_existing'])

        if not sqlite_path.is_file():
            raise CommandError(f'File SQLite non trovato: {sqlite_path}')

        rows = self._read_rows(sqlite_path)
        if not rows:
            self.stdout.write(self.style.WARNING('Nessun utente trovato nel DB SQLite.'))
            return

        source_count = len(rows)
        created = 0
        updated = 0
        skipped = 0

        for row in rows:
            username = row['username']
            defaults = self._build_defaults(row)

            existing = User.objects.filter(username=username).first()
            if existing is None:
                created += 1
                if not dry_run:
                    User.objects.create(username=username, **defaults)
                continue

            if update_existing:
                updated += 1
                if not dry_run:
                    for field, value in defaults.items():
                        setattr(existing, field, value)
                    existing.save(
                        update_fields=[
                            'password',
                            'role',
                            'status',
                            'is_active',
                            'is_staff',
                            'is_superuser',
                            'created_at',
                            'last_login',
                        ]
                    )
            else:
                skipped += 1

        self.stdout.write(f'Sorgente SQLite: {sqlite_path}')
        self.stdout.write(f'Utenti sorgente: {source_count}')
        self.stdout.write(f'Creati: {created}')
        self.stdout.write(f'Aggiornati: {updated}')
        self.stdout.write(f'Skippati: {skipped}')

        if dry_run:
            self.stdout.write(self.style.WARNING('Dry-run attivo: nessuna modifica salvata.'))
            return

        target_count = User.objects.count()
        self.stdout.write(f'Utenti nel target dopo migrazione: {target_count}')
        if target_count < created:
            raise CommandError(
                'Verifica fallita: il numero di utenti target sembra incoerente con i creati.'
            )
        self.stdout.write(self.style.SUCCESS('Migrazione utenti completata.'))

    def _read_rows(self, sqlite_path: Path) -> list[dict]:
        query = (
            'SELECT id, username, password, role, status, is_active, is_staff, '
            'is_superuser, created_at, last_login FROM accounts_user ORDER BY id ASC'
        )
        try:
            conn = sqlite3.connect(str(sqlite_path))
            conn.row_factory = sqlite3.Row
            rows = conn.execute(query).fetchall()
            return [dict(r) for r in rows]
        except sqlite3.Error as exc:
            raise CommandError(f'Errore lettura SQLite: {exc}') from exc
        finally:
            try:
                conn.close()
            except Exception:
                pass

    def _build_defaults(self, row: dict) -> dict:
        created_at = parse_datetime(row.get('created_at') or '')
        last_login = parse_datetime(row.get('last_login') or '')
        return {
            'password': row.get('password') or '',
            'role': row.get('role') or User.Role.USER,
            'status': row.get('status') or User.Status.PENDING,
            'is_active': bool(row.get('is_active', True)),
            'is_staff': bool(row.get('is_staff', False)),
            'is_superuser': bool(row.get('is_superuser', False)),
            'created_at': created_at or timezone.now(),
            'last_login': last_login,
        }
