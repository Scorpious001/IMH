"""
Full Seed Data Command
Generates comprehensive, realistic seed data for the IMH IMS system.
This includes users, categories, vendors, locations, items, stock levels with par levels,
transactions, requisitions, count sessions, and purchase requests.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.contrib.auth.models import User
from decimal import Decimal
from random import choice, randint, uniform, sample
from datetime import timedelta
from faker import Faker

from imh_ims.models import (
    Category, Vendor, Location, Item, StockLevel,
    Requisition, RequisitionLine, CountSession, CountLine,
    PurchaseRequest, PurchaseRequestLine, InventoryTransaction,
    UserProfile
)

fake = Faker()


class Command(BaseCommand):
    help = 'Generate comprehensive seed data for the IMH IMS system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear all existing data before generating new data'
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing all existing data...'))
            InventoryTransaction.objects.all().delete()
            PurchaseRequestLine.objects.all().delete()
            PurchaseRequest.objects.all().delete()
            CountLine.objects.all().delete()
            CountSession.objects.all().delete()
            RequisitionLine.objects.all().delete()
            Requisition.objects.all().delete()
            StockLevel.objects.all().delete()
            Item.objects.all().delete()
            Location.objects.all().delete()
            Vendor.objects.all().delete()
            Category.objects.all().delete()
            UserProfile.objects.all().delete()
            # Don't delete all users, just non-superuser test users
            User.objects.filter(is_superuser=False, username__in=['demo_user', 'manager', 'staff1', 'staff2']).delete()
            self.stdout.write(self.style.SUCCESS('All data cleared.'))

        with transaction.atomic():
            # Step 1: Create users
            users = self.create_users()
            
            # Step 2: Create base data
            categories = self.create_categories()
            vendors = self.create_vendors()
            locations = self.create_locations()
            
            # Step 3: Create items
            items = self.create_items(categories, vendors)
            
            # Step 4: Create stock levels with par levels (some below par for alerts)
            stock_levels = self.create_stock_levels(items, locations, users)
            
            # Step 5: Create historical transactions (for usage trends)
            transactions = self.create_transactions(items, locations, users)
            
            # Step 6: Create requisitions
            requisitions = self.create_requisitions(locations, users, items)
            
            # Step 7: Create count sessions
            count_sessions = self.create_count_sessions(locations, users, items)
            
            # Step 8: Create purchase requests
            purchase_requests = self.create_purchase_requests(vendors, users, items)

        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('SEED DATA GENERATION COMPLETE!'))
        self.stdout.write(self.style.SUCCESS('='*60))
        self.stdout.write(f'\nCreated:')
        self.stdout.write(f'  - {len(users)} users')
        self.stdout.write(f'  - {len(categories)} categories')
        self.stdout.write(f'  - {len(vendors)} vendors')
        self.stdout.write(f'  - {len(locations)} locations')
        self.stdout.write(f'  - {len(items)} items')
        self.stdout.write(f'  - {len(stock_levels)} stock levels')
        self.stdout.write(f'  - {len(transactions)} transactions')
        self.stdout.write(f'  - {len(requisitions)} requisitions')
        self.stdout.write(f'  - {len(count_sessions)} count sessions')
        self.stdout.write(f'  - {len(purchase_requests)} purchase requests')
        self.stdout.write(f'\nLogin credentials:')
        self.stdout.write(self.style.SUCCESS('  Username: admin / Password: admin123'))
        self.stdout.write(self.style.SUCCESS('  Username: manager / Password: manager123'))
        self.stdout.write(self.style.SUCCESS('  Username: staff1 / Password: staff123'))

    def create_users(self):
        """Create users with different roles"""
        self.stdout.write('Creating users...')
        users = []
        
        # Admin user
        admin, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@imh.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin.set_password('admin123')
            admin.save()
        users.append(admin)
        
        # Manager user
        manager, created = User.objects.get_or_create(
            username='manager',
            defaults={
                'email': 'manager@imh.com',
                'first_name': 'Manager',
                'last_name': 'User'
            }
        )
        if created:
            manager.set_password('manager123')
            manager.save()
            profile, _ = UserProfile.objects.get_or_create(user=manager)
            profile.is_admin = True
            profile.save()
        users.append(manager)
        
        # Staff users
        for i in range(1, 3):
            username = f'staff{i}'
            staff, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f'{username}@imh.com',
                    'first_name': f'Staff{i}',
                    'last_name': 'User'
                }
            )
            if created:
                staff.set_password('staff123')
                staff.save()
            users.append(staff)
        
        self.stdout.write(self.style.SUCCESS(f'  [OK] Created/updated {len(users)} users'))
        return users

    def create_categories(self):
        """Create comprehensive categories"""
        self.stdout.write('Creating categories...')
        categories = []
        
        category_data = [
            # Cleaning & Maintenance
            ('Cleaning Supplies', None),
            ('Disinfectants', 'Cleaning Supplies'),
            ('Paper Products', 'Cleaning Supplies'),
            ('Trash Bags', 'Cleaning Supplies'),
            ('Linens', None),
            ('Bed Linens', 'Linens'),
            ('Bath Linens', 'Linens'),
            ('Table Linens', 'Linens'),
            # Electronics
            ('Electronics', None),
            ('TVs & Displays', 'Electronics'),
            ('Audio Equipment', 'Electronics'),
            ('Cables & Adapters', 'Electronics'),
            # Furniture
            ('Furniture', None),
            ('Bedroom Furniture', 'Furniture'),
            ('Living Room Furniture', 'Furniture'),
            ('Office Furniture', 'Furniture'),
            # Appliances
            ('Appliances', None),
            ('Kitchen Appliances', 'Appliances'),
            ('HVAC Equipment', 'Appliances'),
            # Safety & Security
            ('Safety Equipment', None),
            ('Fire Safety', 'Safety Equipment'),
            ('Security Equipment', 'Safety Equipment'),
            # Office & Supplies
            ('Office Supplies', None),
            ('Stationery', 'Office Supplies'),
            ('Printing Supplies', 'Office Supplies'),
            # Food & Beverage
            ('Food & Beverage', None),
            ('Beverages', 'Food & Beverage'),
            ('Snacks', 'Food & Beverage'),
            # Medical
            ('Medical Supplies', None),
            ('First Aid', 'Medical Supplies'),
            ('Medications', 'Medical Supplies'),
            # Maintenance
            ('Maintenance Supplies', None),
            ('Plumbing', 'Maintenance Supplies'),
            ('Electrical', 'Maintenance Supplies'),
            ('Paint & Supplies', 'Maintenance Supplies'),
            ('Hardware', 'Maintenance Supplies'),
        ]
        
        category_map = {}
        for name, parent_name in category_data:
            parent = category_map.get(parent_name) if parent_name else None
            cat, created = Category.objects.get_or_create(
                name=name,
                defaults={
                    'parent_category': parent,
                    'is_active': True
                }
            )
            category_map[name] = cat
            categories.append(cat)
        
        self.stdout.write(self.style.SUCCESS(f'  [OK] Created {len(categories)} categories'))
        return categories

    def create_vendors(self):
        """Create vendors"""
        self.stdout.write('Creating vendors...')
        vendors = []
        
        vendor_names = [
            'ABC Supply Co', 'Global Distributors', 'Premier Supplies',
            'Quality Products Inc', 'Reliable Vendors LLC', 'Top Shelf Supplies',
            'Elite Distributors', 'Prime Source', 'Best Value Co',
            'Professional Supplies', 'Standard Equipment', 'Premium Goods',
            'Trusted Suppliers', 'Main Street Vendors', 'Corporate Supply'
        ]
        
        for name in vendor_names:
            vendor, created = Vendor.objects.get_or_create(
                name=name,
                defaults={
                    'contact_info': fake.address(),
                    'phone': fake.phone_number(),
                    'email': fake.email(),
                    'is_active': True
                }
            )
            vendors.append(vendor)
        
        self.stdout.write(self.style.SUCCESS(f'  [OK] Created {len(vendors)} vendors'))
        return vendors

    def create_locations(self):
        """Create locations hierarchy"""
        self.stdout.write('Creating locations...')
        locations = []
        
        # Main storerooms
        main_storerooms = [
            ('Main Storeroom', 'STOREROOM', 'PROP-001'),
            ('North Wing Storeroom', 'STOREROOM', 'PROP-001'),
            ('South Wing Storeroom', 'STOREROOM', 'PROP-001'),
            ('Basement Storeroom', 'STOREROOM', 'PROP-001'),
        ]
        
        parent_map = {}
        for name, loc_type, prop_id in main_storerooms:
            loc, created = Location.objects.get_or_create(
                name=name,
                defaults={
                    'property_id': prop_id,
                    'type': loc_type,
                    'is_active': True
                }
            )
            parent_map[name] = loc
            locations.append(loc)
        
        # Room locations
        room_types = ['Guest Room', 'Suite', 'Conference Room', 'Office', 'Lobby', 'Restaurant', 'Kitchen', 'Laundry']
        for i, room_type in enumerate(room_types):
            for floor in range(1, 4):
                name = f'{room_type} {floor}{chr(64+i%26+1)}'
                loc, created = Location.objects.get_or_create(
                    name=name,
                    defaults={
                        'property_id': 'PROP-001',
                        'type': 'ROOM',
                        'is_active': True
                    }
                )
                locations.append(loc)
        
        # Closets
        for i in range(1, 11):
            loc, created = Location.objects.get_or_create(
                name=f'Supply Closet {i}',
                defaults={
                    'property_id': 'PROP-001',
                    'type': 'CLOSET',
                    'is_active': True
                }
            )
            locations.append(loc)
        
        # Carts
        for i in range(1, 6):
            loc, created = Location.objects.get_or_create(
                name=f'Housekeeping Cart {i}',
                defaults={
                    'property_id': 'PROP-001',
                    'type': 'CART',
                    'is_active': True
                }
            )
            locations.append(loc)
        
        self.stdout.write(self.style.SUCCESS(f'  [OK] Created {len(locations)} locations'))
        return locations

    def create_items(self, categories, vendors):
        """Create items"""
        self.stdout.write('Creating items...')
        items = []
        
        item_templates = [
            # Cleaning Supplies
            ('Toilet Paper', 'TP', 'Cleaning Supplies', 'case', 25.00),
            ('Paper Towels', 'PT', 'Cleaning Supplies', 'case', 30.00),
            ('Trash Bags 30gal', 'TB30', 'Trash Bags', 'box', 15.00),
            ('Trash Bags 13gal', 'TB13', 'Trash Bags', 'box', 12.00),
            ('All-Purpose Cleaner', 'APC', 'Cleaning Supplies', 'bottle', 8.50),
            ('Glass Cleaner', 'GC', 'Cleaning Supplies', 'bottle', 7.00),
            ('Bleach', 'BL', 'Disinfectants', 'bottle', 5.00),
            ('Disinfectant Wipes', 'DW', 'Disinfectants', 'case', 35.00),
            # Linens
            ('Bath Towel', 'BT', 'Bath Linens', 'ea', 12.00),
            ('Hand Towel', 'HT', 'Bath Linens', 'ea', 8.00),
            ('Washcloth', 'WC', 'Bath Linens', 'ea', 4.00),
            ('Bath Mat', 'BM', 'Bath Linens', 'ea', 15.00),
            ('Queen Sheet Set', 'QSS', 'Bed Linens', 'set', 45.00),
            ('King Sheet Set', 'KSS', 'Bed Linens', 'set', 55.00),
            ('Pillow', 'PIL', 'Bed Linens', 'ea', 20.00),
            ('Comforter', 'COM', 'Bed Linens', 'ea', 80.00),
            # Electronics
            ('HDMI Cable', 'HDMI', 'Cables & Adapters', 'ea', 15.00),
            ('USB Cable', 'USB', 'Cables & Adapters', 'ea', 8.00),
            ('Remote Control', 'RC', 'Electronics', 'ea', 25.00),
            # Furniture
            ('Desk Chair', 'DC', 'Office Furniture', 'ea', 150.00),
            ('Office Desk', 'OD', 'Office Furniture', 'ea', 300.00),
            # Appliances
            ('Coffee Maker', 'CM', 'Kitchen Appliances', 'ea', 80.00),
            ('Microwave', 'MW', 'Kitchen Appliances', 'ea', 120.00),
            # Safety
            ('Fire Extinguisher', 'FE', 'Fire Safety', 'ea', 75.00),
            ('Smoke Detector', 'SD', 'Fire Safety', 'ea', 35.00),
            # Office
            ('Printer Paper', 'PP', 'Printing Supplies', 'ream', 12.00),
            ('Ink Cartridge', 'IC', 'Printing Supplies', 'ea', 45.00),
            # Food & Beverage
            ('Bottled Water', 'BW', 'Beverages', 'case', 8.00),
            ('Coffee Pods', 'CP', 'Beverages', 'box', 15.00),
            # Medical
            ('Bandages', 'BAN', 'First Aid', 'box', 5.00),
            ('Antiseptic', 'ANT', 'First Aid', 'bottle', 8.00),
            # Maintenance
            ('Light Bulb LED', 'LB', 'Electrical', 'ea', 6.00),
            ('Batteries AA', 'BAT', 'Hardware', 'pack', 8.00),
        ]
        
        existing_codes = set(Item.objects.values_list('short_code', flat=True))
        
        for name, code, cat_name, unit, cost in item_templates:
            if code in existing_codes:
                continue
                
            category = next((c for c in categories if c.name == cat_name), None)
            vendor = choice(vendors) if vendors else None
            
            item = Item.objects.create(
                name=name,
                short_code=code,
                category=category,
                default_vendor=vendor,
                unit_of_measure=unit,
                cost=Decimal(str(cost)),
                lead_time_days=randint(1, 14),
                is_active=True
            )
            items.append(item)
            existing_codes.add(code)
        
        # Generate additional random items to reach ~400 total
        current_count = len(items)
        target_count = 400
        additional_count = max(0, target_count - current_count)
        units = ['ea', 'case', 'roll', 'liter', 'box', 'pack', 'bottle', 'can', 'gallon', 'pound', 'oz', 'sheet', 'pair', 'set', 'dozen']
        
        self.stdout.write(f'  Generating {additional_count} additional items to reach ~400 total...')
        
        batch_size = 100
        for i in range(0, additional_count, batch_size):
            batch = []
            for j in range(i, min(i + batch_size, additional_count)):
            code = f'ITEM-{randint(1000, 9999)}'
            while code in existing_codes:
                code = f'ITEM-{randint(1000, 9999)}'
            existing_codes.add(code)
            
            category = choice(categories) if categories else None
            vendor = choice(vendors) if vendors else None
            
                item = Item(
                    name=fake.catch_phrase() + ' ' + fake.word().capitalize(),
                    short_code=code,
                    category=category,
                    default_vendor=vendor,
                    unit_of_measure=choice(units),
                    cost=Decimal(str(round(uniform(1.00, 200.00), 2))),
                    lead_time_days=randint(1, 21),
                    is_active=True
                )
                batch.append(item)
                existing_codes.add(code)
            
            Item.objects.bulk_create(batch)
            items.extend(batch)
            self.stdout.write(f'  Created {len(items)}/{target_count} items...', ending='\r')
        
        self.stdout.write(self.style.SUCCESS(f'  [OK] Created {len(items)} items'))
        return items

    def create_stock_levels(self, items, locations, users):
        """Create stock levels with par levels - some below par for alerts"""
        self.stdout.write('Creating stock levels...')
        stock_levels = []
        
        # Create stock for main storerooms (higher quantities)
        main_storerooms = Location.objects.filter(type='STOREROOM')
        other_locations = Location.objects.exclude(type='STOREROOM')
        
        batch = []
        total_items = len(items)
        for idx, item in enumerate(items):
            # Each item should have stock in at least one main storeroom
            storeroom_count = 2 if idx < total_items * 0.8 else 1  # Most items in 2 storerooms, some in 1
            for storeroom in main_storerooms[:storeroom_count]:
                on_hand = Decimal(str(round(uniform(50, 500), 2)))
                par = Decimal(str(round(uniform(30, 200), 2)))
                reserved = Decimal(str(round(uniform(0, float(on_hand) * 0.2), 2)))
                
                stock = StockLevel(
                    item=item,
                    location=storeroom,
                    on_hand_qty=on_hand,
                    reserved_qty=reserved,
                    par=par,
                    last_counted_at=timezone.now() - timedelta(days=randint(0, 90)) if uniform(0, 1) > 0.5 else None,
                    last_counted_by=choice(users) if uniform(0, 1) > 0.3 else None
                )
                batch.append(stock)
            
            # Some items in other locations (lower quantities, some below par)
            # More locations for more items to create better distribution
            location_count = randint(2, 8) if idx < total_items * 0.7 else randint(1, 4)
            for location in sample(list(other_locations), min(location_count, len(other_locations))):
                # 30% chance of being below par for alerts
                if uniform(0, 1) < 0.3:
                    par = Decimal(str(round(uniform(10, 50), 2)))
                    on_hand = Decimal(str(round(uniform(1, float(par) * 0.8), 2)))  # Below par
                elif uniform(0, 1) < 0.2:  # 20% at risk (80-100% of par)
                    par = Decimal(str(round(uniform(10, 50), 2)))
                    on_hand = Decimal(str(round(uniform(float(par) * 0.8, float(par) * 0.99), 2)))  # At risk
                else:
                    par = Decimal(str(round(uniform(5, 30), 2)))
                    on_hand = Decimal(str(round(uniform(float(par) * 0.8, float(par) * 1.5), 2)))
                
                reserved = Decimal(str(round(uniform(0, float(on_hand) * 0.15), 2)))
                
                stock = StockLevel(
                    item=item,
                    location=location,
                    on_hand_qty=on_hand,
                    reserved_qty=reserved,
                    par=par,
                    last_counted_at=timezone.now() - timedelta(days=randint(0, 60)) if uniform(0, 1) > 0.6 else None,
                    last_counted_by=choice(users) if uniform(0, 1) > 0.4 else None
                )
                batch.append(stock)
            
            if len(batch) >= 200:
                StockLevel.objects.bulk_create(batch)
                stock_levels.extend(batch)
                batch = []
            
            if (idx + 1) % 50 == 0:
                self.stdout.write(f'  Created stock for {idx + 1}/{total_items} items...', ending='\r')
        
        if batch:
            StockLevel.objects.bulk_create(batch)
            stock_levels.extend(batch)
        
        self.stdout.write(self.style.SUCCESS(f'  [OK] Created {len(stock_levels)} stock levels'))
        return stock_levels

    def create_transactions(self, items, locations, users):
        """Create historical transactions for usage trends"""
        self.stdout.write('Creating transactions...')
        transactions = []
        
        # Get stock levels to create realistic transactions
        stock_levels = list(StockLevel.objects.all())
        
        # Scale transactions based on number of items (more items = more transactions)
        transaction_count = min(2000, len(items) * 5)  # ~5 transactions per item, max 2000
        
        batch = []
        for i in range(transaction_count):
            # 60% issues, 25% receives, 10% transfers, 5% adjusts
            trans_type = fake.random.choices(
                ['ISSUE', 'RECEIVE', 'TRANSFER', 'ADJUST'],
                weights=[60, 25, 10, 5]
            )[0]
            
            item = choice(items)
            timestamp = fake.date_time_between(start_date='-1y', end_date='now')
            user = choice(users)
            
            from_location = None
            to_location = None
            receipt_id = ''
            work_order_id = ''
            
            if trans_type == 'ISSUE':
                # Issue from a location that has stock
                item_stocks = [s for s in stock_levels if s.item == item]
                if item_stocks:
                    from_location = choice(item_stocks).location
                    work_order_id = fake.bothify(text='WO-#######') if uniform(0, 1) > 0.4 else ''
                else:
                    from_location = choice(locations)
                qty = Decimal(str(round(uniform(1, 50), 2)))
                cost = None
            elif trans_type == 'RECEIVE':
                to_location = choice(locations)
                receipt_id = fake.bothify(text='REC-#######') if uniform(0, 1) > 0.3 else ''
                qty = Decimal(str(round(uniform(10, 200), 2)))
                cost = item.cost * qty if item.cost else Decimal(str(round(uniform(50, 1000), 2)))
            elif trans_type == 'TRANSFER':
                from_location = choice(locations)
                to_location = choice([loc for loc in locations if loc != from_location])
                qty = Decimal(str(round(uniform(5, 100), 2)))
                cost = None
            else:  # ADJUST
                from_location = choice(locations)
                qty = Decimal(str(round(uniform(-20, 20), 2)))
                cost = None
            
            trans = InventoryTransaction(
                item=item,
                from_location=from_location,
                to_location=to_location,
                qty=qty,
                type=trans_type,
                timestamp=timestamp,
                user=user,
                cost=cost,
                receipt_id=receipt_id,
                work_order_id=work_order_id,
                notes=fake.text(max_nb_chars=100) if uniform(0, 1) > 0.7 else ''
            )
            batch.append(trans)
            
            if len(batch) >= 200:
                InventoryTransaction.objects.bulk_create(batch)
                transactions.extend(batch)
                batch = []
            
            if (i + 1) % 200 == 0:
                self.stdout.write(f'  Created {len(transactions)}/{transaction_count} transactions...', ending='\r')
        
        if batch:
            InventoryTransaction.objects.bulk_create(batch)
            transactions.extend(batch)
        
        self.stdout.write(self.style.SUCCESS(f'  [OK] Created {len(transactions)} transactions'))
        return transactions

    def create_requisitions(self, locations, users, items):
        """Create requisitions"""
        self.stdout.write('Creating requisitions...')
        requisitions = []
        
        statuses = ['PENDING', 'PICKED', 'COMPLETED', 'CANCELLED']
        status_weights = [0.2, 0.2, 0.5, 0.1]
        
        # Scale requisitions based on items
        requisition_count = min(300, len(items) * 0.75)  # ~0.75 requisitions per item, max 300
        
        for i in range(int(requisition_count)):
            from_loc = choice(locations)
            to_loc = choice([loc for loc in locations if loc != from_loc])
            status = fake.random.choices(statuses, weights=status_weights)[0]
            
            created_at = fake.date_time_between(start_date='-6m', end_date='now')
            needed_by = created_at + timedelta(days=randint(1, 14)) if uniform(0, 1) > 0.3 else None
            completed_at = created_at + timedelta(days=randint(1, 7)) if status in ['COMPLETED', 'CANCELLED'] else None
            
            req = Requisition.objects.create(
                from_location=from_loc,
                to_location=to_loc,
                requested_by=choice(users),
                status=status,
                created_at=created_at,
                needed_by=needed_by,
                completed_at=completed_at,
                notes=fake.text(max_nb_chars=150) if uniform(0, 1) > 0.6 else ''
            )
            
            # Create requisition lines
            num_lines = randint(2, 8)
            selected_items = sample(items, min(num_lines, len(items)))
            for item in selected_items:
                qty_requested = Decimal(str(round(uniform(1, 50), 2)))
                qty_picked = qty_requested if status in ['PICKED', 'COMPLETED'] else Decimal('0')
                if status == 'PICKED':
                    qty_picked = qty_requested * Decimal(str(round(uniform(0.7, 1.0), 2)))
                
                RequisitionLine.objects.create(
                    requisition=req,
                    item=item,
                    qty_requested=qty_requested,
                    qty_picked=qty_picked
                )
            
            requisitions.append(req)
        
        self.stdout.write(self.style.SUCCESS(f'  [OK] Created {len(requisitions)} requisitions'))
        return requisitions

    def create_count_sessions(self, locations, users, items):
        """Create count sessions"""
        self.stdout.write('Creating count sessions...')
        count_sessions = []
        
        statuses = ['IN_PROGRESS', 'COMPLETED', 'APPROVED', 'CANCELLED']
        status_weights = [0.1, 0.2, 0.6, 0.1]
        
        # Scale count sessions based on items
        count_session_count = min(150, len(items) * 0.375)  # ~0.375 sessions per item, max 150
        
        for i in range(int(count_session_count)):
            location = choice(locations)
            counted_by = choice(users)
            status = fake.random.choices(statuses, weights=status_weights)[0]
            
            started_at = fake.date_time_between(start_date='-6m', end_date='now')
            completed_at = started_at + timedelta(hours=randint(2, 24)) if status in ['COMPLETED', 'APPROVED'] else None
            approved_by = choice(users) if status == 'APPROVED' else None
            approved_at = completed_at + timedelta(hours=randint(1, 48)) if approved_by else None
            
            session = CountSession.objects.create(
                location=location,
                counted_by=counted_by,
                status=status,
                started_at=started_at,
                completed_at=completed_at,
                approved_by=approved_by,
                approved_at=approved_at,
                notes=fake.text(max_nb_chars=150) if uniform(0, 1) > 0.7 else ''
            )
            
            # Create count lines
            location_items = list(Item.objects.filter(stock_levels__location=location).distinct())
            if not location_items:
                location_items = sample(items, min(10, len(items)))
            else:
                location_items = sample(location_items, min(10, len(location_items)))
            
            for item in location_items:
                try:
                    stock = StockLevel.objects.get(item=item, location=location)
                    expected_qty = stock.on_hand_qty
                except StockLevel.DoesNotExist:
                    expected_qty = Decimal(str(round(uniform(0, 50), 2)))
                
                # Create variance
                variance_pct = uniform(-0.15, 0.15)  # ±15% variance
                counted_qty = expected_qty * (1 + Decimal(str(variance_pct)))
                counted_qty = max(Decimal('0'), counted_qty)
                
                reason_codes = ['LOST', 'DAMAGED', 'VENDOR_ERROR', 'DATA_ERROR', 'THEFT', 'OTHER', '']
                reason_code = choice(reason_codes) if abs(counted_qty - expected_qty) > Decimal('1.0') else ''
                
                CountLine.objects.create(
                    count_session=session,
                    item=item,
                    expected_qty=expected_qty,
                    counted_qty=counted_qty,
                    reason_code=reason_code,
                    notes=fake.text(max_nb_chars=80) if reason_code else ''
                )
            
            count_sessions.append(session)
        
        self.stdout.write(self.style.SUCCESS(f'  [OK] Created {len(count_sessions)} count sessions'))
        return count_sessions

    def create_purchase_requests(self, vendors, users, items):
        """Create purchase requests"""
        self.stdout.write('Creating purchase requests...')
        purchase_requests = []
        
        statuses = ['DRAFT', 'SUBMITTED', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED']
        status_weights = [0.15, 0.15, 0.2, 0.15, 0.3, 0.05]
        
        # Scale purchase requests based on items
        purchase_request_count = min(200, len(items) * 0.5)  # ~0.5 requests per item, max 200
        
        for i in range(int(purchase_request_count)):
            vendor = choice(vendors)
            status = fake.random.choices(statuses, weights=status_weights)[0]
            
            created_at = fake.date_time_between(start_date='-6m', end_date='now')
            submitted_at = created_at + timedelta(days=randint(0, 5)) if status != 'DRAFT' else None
            
            pr = PurchaseRequest.objects.create(
                vendor=vendor,
                status=status,
                requested_by=choice(users),
                created_at=created_at,
                submitted_at=submitted_at,
                notes=fake.text(max_nb_chars=150) if uniform(0, 1) > 0.7 else ''
            )
            
            # Create purchase request lines
            num_lines = randint(3, 12)
            selected_items = sample(items, min(num_lines, len(items)))
            for item in selected_items:
                qty = Decimal(str(round(uniform(10, 200), 2)))
                unit_cost = item.cost * Decimal(str(round(uniform(0.85, 1.15), 2))) if item.cost else Decimal(str(round(uniform(1, 100), 2)))
                
                PurchaseRequestLine.objects.create(
                    purchase_request=pr,
                    item=item,
                    qty=qty,
                    unit_cost=unit_cost
                )
            
            purchase_requests.append(pr)
        
        self.stdout.write(self.style.SUCCESS(f'  [OK] Created {len(purchase_requests)} purchase requests'))
        return purchase_requests
