# Generated migration for permissions system

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('imh_ims', '0002_user_profile_and_approval_fields'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Create ModulePermission model
        migrations.CreateModel(
            name='ModulePermission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('module', models.CharField(choices=[('catalog', 'Catalog'), ('stock', 'Stock'), ('vendors', 'Vendors'), ('requisitions', 'Requisitions'), ('receiving', 'Receiving'), ('counts', 'Counts'), ('reports', 'Reports')], max_length=50)),
                ('action', models.CharField(choices=[('view', 'View'), ('create', 'Create'), ('edit', 'Edit'), ('delete', 'Delete')], max_length=50)),
                ('name', models.CharField(editable=False, max_length=100, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['module', 'action'],
                'unique_together': {('module', 'action')},
            },
        ),
        migrations.AddIndex(
            model_name='modulepermission',
            index=models.Index(fields=['module', 'action'], name='imh_ims_module_module_8a1b2d_idx'),
        ),
        # Create UserPermission model
        migrations.CreateModel(
            name='UserPermission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('granted_at', models.DateTimeField(auto_now_add=True)),
                ('granted_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='granted_permissions', to=settings.AUTH_USER_MODEL)),
                ('permission', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_permissions', to='imh_ims.modulepermission')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='module_permissions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['user', 'permission'],
                'unique_together': {('user', 'permission')},
            },
        ),
        migrations.AddIndex(
            model_name='userpermission',
            index=models.Index(fields=['user', 'permission'], name='imh_ims_user_user_id_9c3d4e_idx'),
        ),
        # Initialize default permissions
        migrations.RunPython(
            code=lambda apps, schema_editor: _initialize_permissions(apps, schema_editor),
            reverse_code=migrations.RunPython.noop,
        ),
    ]


def _initialize_permissions(apps, schema_editor):
    """Initialize all permission combinations"""
    Permission = apps.get_model('imh_ims', 'ModulePermission')
    
    modules = ['catalog', 'stock', 'vendors', 'requisitions', 'receiving', 'counts', 'reports']
    actions = ['view', 'create', 'edit', 'delete']
    
    for module in modules:
        for action in actions:
            Permission.objects.get_or_create(
                module=module,
                action=action,
                defaults={'name': f"{module}.{action}"}
            )

