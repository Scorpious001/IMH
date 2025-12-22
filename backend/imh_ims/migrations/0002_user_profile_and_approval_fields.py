# Generated manually for user profile and approval fields

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('imh_ims', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Create UserProfile model
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(choices=[('SUPERVISOR', 'Supervisor'), ('MANAGER', 'Manager'), ('ADMIN', 'Admin')], default='SUPERVISOR', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['user__username'],
            },
        ),
        # Add approval fields to Requisition
        migrations.AddField(
            model_name='requisition',
            name='approved_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='requisition',
            name='approved_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='approved_requisitions', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='requisition',
            name='denial_reason',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='requisition',
            name='denied_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='requisition',
            name='denied_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='denied_requisitions', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='requisition',
            name='status',
            field=models.CharField(choices=[('PENDING', 'Pending'), ('APPROVED', 'Approved'), ('DENIED', 'Denied'), ('PICKED', 'Picked'), ('COMPLETED', 'Completed'), ('CANCELLED', 'Cancelled')], default='PENDING', max_length=20),
        ),
        # Add approval fields to PurchaseRequest
        migrations.AddField(
            model_name='purchaserequest',
            name='approved_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='purchaserequest',
            name='approved_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='approved_purchase_requests', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='purchaserequest',
            name='denial_reason',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='purchaserequest',
            name='denied_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='purchaserequest',
            name='denied_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='denied_purchase_requests', to=settings.AUTH_USER_MODEL),
        ),
    ]

