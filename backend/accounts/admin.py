from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ('id',)
    list_display = ('username', 'role', 'status', 'is_staff', 'is_superuser', 'created_at')
    list_filter = ('role', 'status', 'is_staff', 'is_superuser')

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Permessi', {'fields': ('role', 'status', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Date', {'fields': ('last_login', 'created_at')}),
    )
    readonly_fields = ('created_at', 'last_login')

    add_fieldsets = (
        (
            None,
            {
                'classes': ('wide',),
                'fields': ('username', 'password1', 'password2', 'role', 'status', 'is_active', 'is_staff', 'is_superuser'),
            },
        ),
    )

    search_fields = ('username',)
