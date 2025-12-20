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
    PurchaseRequest, PurchaseRequestLine, InventoryTransaction
)

fake = Faker()


class Command(BaseCommand):
    help = 'Generate large amounts of realistic test data for all tables'

    def add_arguments(self, parser):
        parser.add_argument(
            '--categories',
            type=int,
            default=50,
            help='Number of categories to create (default: 50)'
        )
        parser.add_argument(
            '--vendors',
            type=int,
            default=20,
            help='Number of vendors to create (default: 20)'
        )
        parser.add_argument(
            '--locations',
            type=int,
            default=30,
            help='Number of locations to create (default: 30)'
        )
        parser.add_argument(
            '--items',
            type=int,
            default=1000,
            help='Number of items to create (default: 1000)'
        )
        parser.add_argument(
            '--stock-percentage',
            type=float,
            default=0.6,
            help='Percentage of item-location combinations to create stock for (default: 0.6)'
        )
        parser.add_argument(
            '--requisitions',
            type=int,
            default=500,
            help='Number of requisitions to create (default: 500)'
        )
        parser.add_argument(
            '--count-sessions',
            type=int,
            default=200,
            help='Number of count sessions to create (default: 200)'
        )
        parser.add_argument(
            '--purchase-requests',
            type=int,
            default=300,
            help='Number of purchase requests to create (default: 300)'
        )
        parser.add_argument(
            '--transactions',
            type=int,
            default=2000,
            help='Number of transactions to create (default: 2000)'
        )
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
            self.stdout.write(self.style.SUCCESS('All data cleared.'))

        with transaction.atomic():
            # Generate base data
            categories = self.generate_categories(options['categories'])
            vendors = self.generate_vendors(options['vendors'])
            locations = self.generate_locations(options['locations'])
            
            # Generate dependent data
            items = self.generate_items(options['items'], categories, vendors)
            stock_levels = self.generate_stock_levels(
                items, locations, options['stock_percentage']
            )
            
            # Get users for relationships
            users = list(User.objects.all())
            if not users:
                self.stdout.write(self.style.ERROR('No users found. Please create users first.'))
                return
            
            # Generate transactional data
            requisitions = self.generate_requisitions(
                options['requisitions'], locations, users, items
            )
            count_sessions = self.generate_count_sessions(
                options['count_sessions'], locations, users, items
            )
            purchase_requests = self.generate_purchase_requests(
                options['purchase_requests'], vendors, users, items
            )
            self.generate_transactions(
                options['transactions'], items, locations, users,
                requisitions, count_sessions
            )

        self.stdout.write(self.style.SUCCESS('\n[SUCCESS] Test data generation completed!'))

    def generate_categories(self, count):
        self.stdout.write(f'Generating {count} categories...')
        categories = []
        category_names = [
            'Cleaning Supplies', 'Linens', 'Electronics', 'Furniture',
            'Appliances', 'Tools', 'Safety Equipment', 'Office Supplies',
            'Food & Beverage', 'Medical Supplies', 'Maintenance', 'HVAC',
            'Plumbing', 'Electrical', 'Paint & Supplies', 'Hardware',
            'Flooring', 'Lighting', 'Window Treatments', 'Bathroom Supplies',
            'Kitchen Supplies', 'Bedroom Supplies', 'Outdoor Equipment',
            'Recreational', 'Storage Solutions', 'Packaging', 'Labels & Tags',
            'Cables & Wires', 'Batteries', 'Light Bulbs', 'Filters',
            'Chemicals', 'Paper Products', 'Disposables', 'Reusables',
            'Textiles', 'Carpet & Rugs', 'Wall Coverings', 'Ceiling Materials',
            'Doors & Windows', 'Hardware Fasteners', 'Adhesives', 'Sealants',
            'Insulation', 'Roofing Materials', 'Landscaping', 'Pest Control',
            'Fire Safety', 'Security Equipment', 'Signage'
        ]
        
        # Create top-level categories
        for i in range(min(count, len(category_names))):
            cat = Category.objects.create(
                name=category_names[i] if i < len(category_names) else f'Category {i+1}',
                is_active=fake.boolean(chance_of_getting_true=90)
            )
            categories.append(cat)
        
        # Create some subcategories
        remaining = count - len(categories)
        for i in range(remaining):
            parent = choice(categories) if categories else None
            cat = Category.objects.create(
                name=fake.word().capitalize() + ' ' + fake.word().capitalize(),
                parent_category=parent if parent and fake.boolean(chance_of_getting_true=30) else None,
                is_active=fake.boolean(chance_of_getting_true=90)
            )
            categories.append(cat)
        
        self.stdout.write(self.style.SUCCESS(f'  [OK] Created {len(categories)} categories'))
        return categories

    def generate_vendors(self, count):
        self.stdout.write(f'Generating {count} vendors...')
        vendors = []
        for i in range(count):
            vendor = Vendor.objects.create(
                name=fake.company(),
                contact_info=fake.address(),
                phone=fake.phone_number(),
                email=fake.email(),
                is_active=fake.boolean(chance_of_getting_true=85)
            )
            vendors.append(vendor)
        
        self.stdout.write(self.style.SUCCESS(f'  [OK] Created {len(vendors)} vendors'))
        return vendors

    def generate_locations(self, count):
        self.stdout.write(f'Generating {count} locations...')
        locations = []
        location_types = ['STOREROOM', 'CLOSET', 'CART', 'ROOM', 'OTHER']
        
        # Create top-level locations
        for i in range(min(count // 2, 15)):
            loc = Location.objects.create(
                property_id=fake.bothify(text='PROP-####'),
                name=f'{fake.word().capitalize()} {choice(["Main", "North", "South", "East", "West"])} {choice(location_types)}',
                type=choice(location_types),
                floorplan_id=fake.bothify(text='FP-####') if fake.boolean(chance_of_getting_true=60) else '',
                coordinates=f'{randint(0, 1000)},{randint(0, 1000)}' if fake.boolean(chance_of_getting_true=40) else '',
                is_active=fake.boolean(chance_of_getting_true=90)
            )
            locations.append(loc)
        
        # Create child locations
        remaining = count - len(locations)
        for i in range(remaining):
            parent = choice(locations) if locations else None
            loc = Location.objects.create(
                property_id=parent.property_id if parent else fake.bothify(text='PROP-####'),
                name=f'{fake.word().capitalize()} {choice(["Closet", "Room", "Area", "Section"])}',
                type=choice(location_types),
                parent_location=parent if parent and fake.boolean(chance_of_getting_true=40) else None,
                floorplan_id=parent.floorplan_id if parent and fake.boolean(chance_of_getting_true=50) else '',
                coordinates=f'{randint(0, 1000)},{randint(0, 1000)}' if fake.boolean(chance_of_getting_true=30) else '',
                is_active=fake.boolean(chance_of_getting_true=90)
            )
            locations.append(loc)
        
        self.stdout.write(self.style.SUCCESS(f'  [OK] Created {len(locations)} locations'))
        return locations

    def generate_items(self, count, categories, vendors):
        self.stdout.write(f'Generating {count} items...')
        items = []
        units = ['ea', 'case', 'roll', 'liter', 'box', 'pack', 'bottle', 'can', 'gallon', 'pound', 'oz', 'sheet', 'pair']
        existing_codes = set(Item.objects.values_list('short_code', flat=True))
        
        batch_size = 100
        for i in range(0, count, batch_size):
            batch = []
            for j in range(i, min(i + batch_size, count)):
                # Generate unique short code
                code = f'ITEM-{randint(1000, 9999)}'
                while code in existing_codes:
                    code = f'ITEM-{randint(1000, 9999)}'
                existing_codes.add(code)
                
                category = choice(categories) if categories and fake.boolean(chance_of_getting_true=80) else None
                vendor = choice(vendors) if vendors and fake.boolean(chance_of_getting_true=70) else None
                
                item = Item(
                    name=fake.catch_phrase() + ' ' + fake.word().capitalize(),
                    short_code=code,
                    category=category,
                    default_vendor=vendor,
                    unit_of_measure=choice(units),
                    cost=Decimal(str(round(uniform(0.50, 500.00), 2))),
                    lead_time_days=randint(0, 30),
                    is_active=fake.boolean(chance_of_getting_true=90),
                    photo_url=fake.image_url() if fake.boolean(chance_of_getting_true=30) else ''
                )
                batch.append(item)
            
            Item.objects.bulk_create(batch)
            # In SQLite, bulk_create sets the pk attribute, but we need to refresh for other fields
            # For now, just use the batch items as they should have IDs set
            items.extend(batch)
            self.stdout.write(f'  Created {len(items)}/{count} items...', ending='\r')
        
        self.stdout.write(self.style.SUCCESS(f'  [OK] Created {len(items)} items'))
        return items

    def generate_stock_levels(self, items, locations, percentage):
        self.stdout.write(f'Generating stock levels ({percentage*100}% of combinations)...')
        stock_levels = []
        total_combinations = len(items) * len(locations)
        target_count = int(total_combinations * percentage)
        
        # Get existing stock level combinations
        existing = set(
            StockLevel.objects.values_list('item_id', 'location_id')
        )
        
        combinations = []
        # Get item IDs from database to ensure we have them
        item_ids = {item.short_code: item.id for item in Item.objects.filter(short_code__in=[item.short_code for item in items])}
        
        for item in items:
            item_id = item_ids.get(item.short_code)
            if not item_id:
                continue
            
            for location in locations:
                if (item_id, location.id) not in existing:
                    combinations.append((item, location))
        
        # Sample the target percentage
        selected = sample(combinations, min(target_count, len(combinations))) if combinations else []
        
        batch_size = 500
        for i in range(0, len(selected), batch_size):
            batch = []
            for item, location in selected[i:i+batch_size]:
                on_hand = Decimal(str(round(uniform(0, 1000), 2)))
                par_min = Decimal(str(round(uniform(10, 100), 2)))
                par_max_multiplier = Decimal(str(round(uniform(1.5, 3.0), 2)))
                par_max = Decimal(str(round(float(par_min) * float(par_max_multiplier), 2)))
                
                reserved_max = float(on_hand) * 0.3
                reserved_qty = Decimal(str(round(uniform(0, reserved_max), 2)))
                
                stock = StockLevel(
                    item=item,
                    location=location,
                    on_hand_qty=on_hand,
                    reserved_qty=reserved_qty,
                    par_min=par_min,
                    par_max=par_max,
                    last_counted_at=fake.date_time_between(start_date='-6m', end_date='now') if fake.boolean(chance_of_getting_true=40) else None,
                    last_counted_by=choice(User.objects.all()) if fake.boolean(chance_of_getting_true=30) else None
                )
                batch.append(stock)
            
            StockLevel.objects.bulk_create(batch)
            stock_levels.extend(batch)
            self.stdout.write(f'  Created {len(stock_levels)}/{target_count} stock levels...', ending='\r')
        
        self.stdout.write(self.style.SUCCESS(f'  [OK] Created {len(stock_levels)} stock levels'))
        return stock_levels

    def generate_requisitions(self, count, locations, users, items):
        self.stdout.write(f'Generating {count} requisitions...')
        requisitions = []
        statuses = ['PENDING', 'PICKED', 'COMPLETED', 'CANCELLED']
        status_weights = [0.3, 0.2, 0.4, 0.1]
        
        for i in range(count):
            from_loc = choice(locations)
            to_loc = choice([loc for loc in locations if loc != from_loc])
            status = fake.random.choices(statuses, weights=status_weights)[0]
            
            created_at = fake.date_time_between(start_date='-6m', end_date='now')
            needed_by = created_at + timedelta(days=randint(1, 14)) if fake.boolean(chance_of_getting_true=60) else None
            completed_at = created_at + timedelta(days=randint(1, 7)) if status in ['COMPLETED', 'CANCELLED'] else None
            
            req = Requisition.objects.create(
                from_location=from_loc,
                to_location=to_loc,
                requested_by=choice(users),
                status=status,
                created_at=created_at,
                needed_by=needed_by,
                completed_at=completed_at,
                notes=fake.text(max_nb_chars=200) if fake.boolean(chance_of_getting_true=40) else ''
            )
            requisitions.append(req)
            
            # Create requisition lines
            num_lines = randint(2, 10)
            selected_items = sample(items, min(num_lines, len(items)))
            for item in selected_items:
                qty_requested = Decimal(str(round(uniform(1, 100), 2)))
                qty_picked = qty_requested if status in ['PICKED', 'COMPLETED'] else Decimal('0')
                if status == 'COMPLETED':
                    qty_picked = qty_requested
                elif status == 'PICKED':
                    qty_picked = qty_requested * Decimal(str(round(uniform(0.5, 1.0), 2)))
                
                RequisitionLine.objects.create(
                    requisition=req,
                    item=item,
                    qty_requested=qty_requested,
                    qty_picked=qty_picked
                )
            
            if (i + 1) % 50 == 0:
                self.stdout.write(f'  Created {i + 1}/{count} requisitions...', ending='\r')
        
        self.stdout.write(self.style.SUCCESS(f'  [OK] Created {len(requisitions)} requisitions'))
        return requisitions

    def generate_count_sessions(self, count, locations, users, items):
        self.stdout.write(f'Generating {count} count sessions...')
        count_sessions = []
        statuses = ['IN_PROGRESS', 'COMPLETED', 'APPROVED', 'CANCELLED']
        status_weights = [0.1, 0.3, 0.5, 0.1]
        
        for i in range(count):
            location = choice(locations)
            counted_by = choice(users)
            status = fake.random.choices(statuses, weights=status_weights)[0]
            
            started_at = fake.date_time_between(start_date='-6m', end_date='now')
            completed_at = started_at + timedelta(hours=randint(1, 48)) if status in ['COMPLETED', 'APPROVED'] else None
            approved_by = choice(users) if status == 'APPROVED' else None
            approved_at = completed_at + timedelta(hours=randint(1, 24)) if approved_by else None
            
            session = CountSession.objects.create(
                location=location,
                counted_by=counted_by,
                status=status,
                started_at=started_at,
                completed_at=completed_at,
                approved_by=approved_by,
                approved_at=approved_at,
                notes=fake.text(max_nb_chars=200) if fake.boolean(chance_of_getting_true=30) else ''
            )
            count_sessions.append(session)
            
            # Create count lines
            num_lines = randint(5, 20)
            # Get items that have stock at this location
            location_items = list(
                Item.objects.filter(stock_levels__location=location).distinct()
            )
            if not location_items:
                location_items = sample(items, min(num_lines, len(items)))
            else:
                location_items = sample(location_items, min(num_lines, len(location_items)))
            
            for item in location_items:
                try:
                    stock = StockLevel.objects.get(item=item, location=location)
                    expected_qty = stock.on_hand_qty
                except StockLevel.DoesNotExist:
                    expected_qty = Decimal(str(round(uniform(0, 100), 2)))
                
                # Create variance
                variance_pct = uniform(-0.1, 0.1)  # ±10% variance
                counted_qty = expected_qty * (1 + Decimal(str(variance_pct)))
                counted_qty = max(Decimal('0'), counted_qty)
                
                reason_codes = ['LOST', 'DAMAGED', 'VENDOR_ERROR', 'DATA_ERROR', 'THEFT', 'OTHER', '']
                reason_code = choice(reason_codes) if abs(counted_qty - expected_qty) > Decimal('0.5') else ''
                
                CountLine.objects.create(
                    count_session=session,
                    item=item,
                    expected_qty=expected_qty,
                    counted_qty=counted_qty,
                    reason_code=reason_code,
                    notes=fake.text(max_nb_chars=100) if reason_code else ''
                )
            
            if (i + 1) % 50 == 0:
                self.stdout.write(f'  Created {i + 1}/{count} count sessions...', ending='\r')
        
        self.stdout.write(self.style.SUCCESS(f'  [OK] Created {len(count_sessions)} count sessions'))
        return count_sessions

    def generate_purchase_requests(self, count, vendors, users, items):
        self.stdout.write(f'Generating {count} purchase requests...')
        purchase_requests = []
        statuses = ['DRAFT', 'SUBMITTED', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED']
        status_weights = [0.2, 0.15, 0.2, 0.15, 0.25, 0.05]
        
        for i in range(count):
            vendor = choice(vendors)
            status = fake.random.choices(statuses, weights=status_weights)[0]
            
            created_at = fake.date_time_between(start_date='-6m', end_date='now')
            submitted_at = created_at + timedelta(days=randint(0, 7)) if status != 'DRAFT' else None
            
            pr = PurchaseRequest.objects.create(
                vendor=vendor,
                status=status,
                requested_by=choice(users),
                created_at=created_at,
                submitted_at=submitted_at,
                notes=fake.text(max_nb_chars=200) if fake.boolean(chance_of_getting_true=30) else ''
            )
            purchase_requests.append(pr)
            
            # Create purchase request lines
            num_lines = randint(3, 15)
            selected_items = sample(items, min(num_lines, len(items)))
            for item in selected_items:
                qty = Decimal(str(round(uniform(1, 500), 2)))
                unit_cost = item.cost * Decimal(str(round(uniform(0.8, 1.2), 2))) if item.cost else Decimal(str(round(uniform(1, 100), 2)))
                
                PurchaseRequestLine.objects.create(
                    purchase_request=pr,
                    item=item,
                    qty=qty,
                    unit_cost=unit_cost
                )
            
            if (i + 1) % 50 == 0:
                self.stdout.write(f'  Created {i + 1}/{count} purchase requests...', ending='\r')
        
        self.stdout.write(self.style.SUCCESS(f'  [OK] Created {len(purchase_requests)} purchase requests'))
        return purchase_requests

    def generate_transactions(self, count, items, locations, users, requisitions, count_sessions):
        self.stdout.write(f'Generating {count} transactions...')
        transactions = []
        transaction_types = ['RECEIVE', 'ISSUE', 'TRANSFER', 'ADJUST', 'COUNT_ADJUST']
        type_weights = [0.25, 0.25, 0.20, 0.15, 0.15]
        
        batch_size = 200
        for i in range(0, count, batch_size):
            batch = []
            for j in range(i, min(i + batch_size, count)):
                item = choice(items)
                trans_type = fake.random.choices(transaction_types, weights=type_weights)[0]
                timestamp = fake.date_time_between(start_date='-1y', end_date='now')
                
                from_location = None
                to_location = None
                requisition = None
                count_session = None
                receipt_id = ''
                work_order_id = ''
                
                if trans_type == 'RECEIVE':
                    to_location = choice(locations)
                    receipt_id = fake.bothify(text='REC-#######') if fake.boolean(chance_of_getting_true=70) else ''
                elif trans_type == 'ISSUE':
                    from_location = choice(locations)
                    work_order_id = fake.bothify(text='WO-#######') if fake.boolean(chance_of_getting_true=60) else ''
                elif trans_type == 'TRANSFER':
                    from_location = choice(locations)
                    to_location = choice([loc for loc in locations if loc != from_location])
                elif trans_type == 'ADJUST':
                    from_location = choice(locations)
                elif trans_type == 'COUNT_ADJUST':
                    from_location = choice(locations)
                    if count_sessions:
                        count_session = choice(count_sessions) if fake.boolean(chance_of_getting_true=40) else None
                
                # Link to requisition if applicable
                if trans_type in ['TRANSFER', 'ISSUE'] and requisitions:
                    requisition = choice(requisitions) if fake.boolean(chance_of_getting_true=30) else None
                
                qty = Decimal(str(round(uniform(0.1, 500), 2)))
                cost = item.cost * qty if item.cost else Decimal(str(round(uniform(1, 1000), 2)))
                
                trans = InventoryTransaction(
                    item=item,
                    from_location=from_location,
                    to_location=to_location,
                    qty=qty,
                    type=trans_type,
                    timestamp=timestamp,
                    user=choice(users),
                    cost=cost if trans_type == 'RECEIVE' else None,
                    notes=fake.text(max_nb_chars=150) if fake.boolean(chance_of_getting_true=20) else '',
                    requisition=requisition,
                    receipt_id=receipt_id,
                    work_order_id=work_order_id,
                    count_session=count_session
                )
                batch.append(trans)
            
            InventoryTransaction.objects.bulk_create(batch)
            transactions.extend(batch)
            self.stdout.write(f'  Created {len(transactions)}/{count} transactions...', ending='\r')
        
        self.stdout.write(self.style.SUCCESS(f'  [OK] Created {len(transactions)} transactions'))

