from django.urls import path

from . import views

urlpatterns = [
    path('health', views.health),
    path('auth/register', views.register),
    path('auth/check', views.auth_check),
    path('templates', views.template_list),
    path('templates/<slug:slug>/compile', views.compile_template_by_slug),
    path('admin/pending-users', views.admin_pending_users),
    path('admin/users', views.admin_users),
    path('admin/users/<int:id>/approve', views.admin_approve_user),
    path('admin/users/<int:id>/reject', views.admin_reject_user),
    path('admin/users/<int:id>', views.admin_delete_user),
]
