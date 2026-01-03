import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'imh.settings')
django.setup()

from imh_ims.models import Item

total = Item.objects.count()
active = Item.objects.filter(is_active=True).count()

print(f'Total items: {total}')
print(f'Active items: {active}')

if active > 0:
    print('\nSample active items:')
    for item in Item.objects.filter(is_active=True)[:10]:
        print(f'  - {item.name} (Code: {item.short_code}, Active: {item.is_active})')
else:
    print('\nNo active items found!')
    print('Sample items (including inactive):')
    for item in Item.objects.all()[:5]:
        print(f'  - {item.name} (Code: {item.short_code}, Active: {item.is_active})')
