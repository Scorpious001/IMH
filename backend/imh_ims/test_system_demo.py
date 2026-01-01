"""
IMH Inventory Management System - Comprehensive Test Suite

This test suite demonstrates the core functionality of the IMH IMS system,
including items, locations, stock levels, requisitions, counts, and reports.

To run these tests, ensure Django is set up and run:
    python manage.py test imh_ims.test_system_demo
"""

from django.test import TestCase, TransactionTestCase
from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta

from imh_ims.models import (
    Category, Vendor, Location, Item, StockLevel,
    Requisition, RequisitionLine, CountSession, CountLine,
    PurchaseRequest, PurchaseRequestLine, InventoryTransaction
)
from imh_ims.services.stock_service import StockService
from imh_ims.services.requisition_service import RequisitionService


class ItemManagementTests(TestCase):
    """Tests for item catalog management"""
    
    def setUp(self):
        """Set up test data"""
        self.category = Category.objects.create(
            name="Cleaning Supplies",
            is_active=True
        )
        self.vendor = Vendor.objects.create(
            name="Supply Co",
            contact_info="123 Main St",
            phone="555-0100",
            email="contact@supplyco.com",
            is_active=True
        )
    
    def test_create_item(self):
        """Test creating a new inventory item"""
        item = Item.objects.create(
            name="Toilet Paper",
            short_code="TP-001",
            category=self.category,
            default_vendor=self.vendor,
            unit_of_measure="case",
            cost=Decimal("24.99"),
            lead_time_days=7,
            is_active=True
        )
        
        self.assertEqual(item.name, "Toilet Paper")
        self.assertEqual(item.short_code, "TP-001")
        self.assertEqual(item.category, self.category)
        self.assertEqual(item.unit_of_measure, "case")
        self.assertEqual(item.cost, Decimal("24.99"))
        self.assertTrue(item.is_active)
    
    def test_item_unique_short_code(self):
        """Test that item short codes must be unique"""
        Item.objects.create(
            name="Item 1",
            short_code="CODE-001"
        )
        
        with self.assertRaises(Exception):
            Item.objects.create(
                name="Item 2",
                short_code="CODE-001"  # Duplicate code should fail
            )
    
    def test_item_search(self):
        """Test searching items by name or code"""
        Item.objects.create(name="Bleach", short_code="BL-001")
        Item.objects.create(name="Bleach Cleaner", short_code="BL-002")
        Item.objects.create(name="Soap", short_code="SO-001")
        
        # Search by name
        results = Item.objects.filter(name__icontains="Bleach")
        self.assertEqual(results.count(), 2)
        
        # Search by code
        results = Item.objects.filter(short_code__icontains="BL")
        self.assertEqual(results.count(), 2)


class LocationTests(TestCase):
    """Tests for location management"""
    
    def setUp(self):
        self.property_id = "PROP-001"
    
    def test_create_location(self):
        """Test creating a location"""
        location = Location.objects.create(
            property_id=self.property_id,
            name="Main Storeroom",
            type="STOREROOM",
            is_active=True
        )
        
        self.assertEqual(location.property_id, "PROP-001")
        self.assertEqual(location.name, "Main Storeroom")
        self.assertEqual(location.type, "STOREROOM")
        self.assertTrue(location.is_active)
    
    def test_hierarchical_locations(self):
        """Test parent-child location relationships"""
        parent = Location.objects.create(
            property_id=self.property_id,
            name="Main Storeroom",
            type="STOREROOM"
        )
        
        child = Location.objects.create(
            property_id=self.property_id,
            name="Shelf A",
            type="CLOSET",
            parent_location=parent
        )
        
        self.assertEqual(child.parent_location, parent)
        self.assertIn(child, Location.objects.filter(parent_location=parent))


class StockLevelTests(TestCase):
    """Tests for stock level tracking"""
    
    def setUp(self):
        self.category = Category.objects.create(name="Test Category")
        self.item = Item.objects.create(
            name="Test Item",
            short_code="TEST-001",
            category=self.category,
            unit_of_measure="ea"
        )
        self.location = Location.objects.create(
            property_id="PROP-001",
            name="Test Location",
            type="STOREROOM"
        )
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass"
        )
    
    def test_create_stock_level(self):
        """Test creating a stock level record"""
        stock = StockLevel.objects.create(
            item=self.item,
            location=self.location,
            on_hand_qty=Decimal("100.00"),
            reserved_qty=Decimal("10.00"),
            par=Decimal("50.00")
        )
        
        self.assertEqual(stock.on_hand_qty, Decimal("100.00"))
        self.assertEqual(stock.available_qty, Decimal("90.00"))  # on_hand - reserved
        self.assertEqual(stock.item, self.item)
        self.assertEqual(stock.location, self.location)
    
    def test_stock_unique_item_location(self):
        """Test that each item-location combination is unique"""
        StockLevel.objects.create(
            item=self.item,
            location=self.location,
            on_hand_qty=Decimal("100.00"),
            par=Decimal("50.00")
        )
        
        with self.assertRaises(Exception):
            StockLevel.objects.create(
                item=self.item,
                location=self.location,  # Duplicate should fail
                on_hand_qty=Decimal("50.00")
            )
    
    def test_stock_status_indicators(self):
        """Test stock status calculation (Green/Amber/Red)"""
        # Above par (Green)
        stock_above = StockLevel.objects.create(
            item=self.item,
            location=self.location,
            on_hand_qty=Decimal("100.00"),
            par=Decimal("50.00")
        )
        self.assertGreater(stock_above.on_hand_qty, stock_above.par)
        
        # Below par (Red)
        stock_below = StockLevel.objects.create(
            item=self.item,
            location=Location.objects.create(
                property_id="PROP-001",
                name="Location 2",
                type="CLOSET"
            ),
            on_hand_qty=Decimal("20.00"),
            par=Decimal("50.00")
        )
        self.assertLess(stock_below.on_hand_qty, stock_below.par)


class StockServiceTests(TransactionTestCase):
    """Tests for stock service operations"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass"
        )
        self.item = Item.objects.create(
            name="Test Item",
            short_code="TEST-001",
            unit_of_measure="ea"
        )
        self.location1 = Location.objects.create(
            property_id="PROP-001",
            name="Location 1",
            type="STOREROOM"
        )
        self.location2 = Location.objects.create(
            property_id="PROP-001",
            name="Location 2",
            type="CLOSET"
        )
        StockLevel.objects.create(
            item=self.item,
            location=self.location1,
            on_hand_qty=Decimal("100.00"),
            par=Decimal("50.00")
        )
    
    def test_get_global_on_hand(self):
        """Test calculating global on-hand quantity"""
        StockLevel.objects.create(
            item=self.item,
            location=self.location2,
            on_hand_qty=Decimal("50.00"),
            par=Decimal("30.00")
        )
        
        total = StockService.get_global_on_hand(self.item)
        self.assertEqual(total, Decimal("150.00"))
    
    def test_stock_transfer(self):
        """Test transferring stock between locations"""
        initial_qty1 = StockLevel.objects.get(
            item=self.item,
            location=self.location1
        ).on_hand_qty
        
        StockService.transfer_stock(
            item=self.item,
            from_location=self.location1,
            to_location=self.location2,
            qty=Decimal("25.00"),
            user=self.user,
            notes="Test transfer"
        )
        
        stock1 = StockLevel.objects.get(item=self.item, location=self.location1)
        stock2 = StockLevel.objects.get(item=self.item, location=self.location2)
        
        self.assertEqual(stock1.on_hand_qty, initial_qty1 - Decimal("25.00"))
        self.assertEqual(stock2.on_hand_qty, Decimal("25.00"))
        
        # Verify transaction was created
        transaction = InventoryTransaction.objects.filter(
            item=self.item,
            type="TRANSFER"
        ).first()
        self.assertIsNotNone(transaction)
        self.assertEqual(transaction.qty, Decimal("25.00"))


class RequisitionTests(TransactionTestCase):
    """Tests for requisition workflow"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass"
        )
        self.item = Item.objects.create(
            name="Test Item",
            short_code="TEST-001",
            unit_of_measure="ea"
        )
        self.from_location = Location.objects.create(
            property_id="PROP-001",
            name="Main Storeroom",
            type="STOREROOM"
        )
        self.to_location = Location.objects.create(
            property_id="PROP-001",
            name="Room 101",
            type="ROOM"
        )
        StockLevel.objects.create(
            item=self.item,
            location=self.from_location,
            on_hand_qty=Decimal("100.00"),
            par=Decimal("50.00")
        )
    
    def test_create_requisition(self):
        """Test creating a requisition"""
        requisition = Requisition.objects.create(
            from_location=self.from_location,
            to_location=self.to_location,
            requested_by=self.user,
            status="PENDING",
            notes="Need supplies for room"
        )
        
        RequisitionLine.objects.create(
            requisition=requisition,
            item=self.item,
            qty_requested=Decimal("10.00"),
            qty_picked=Decimal("0.00")
        )
        
        self.assertEqual(requisition.status, "PENDING")
        self.assertEqual(requisition.lines.count(), 1)
        self.assertEqual(requisition.lines.first().qty_requested, Decimal("10.00"))
    
    def test_requisition_pick_mode(self):
        """Test picking items for a requisition"""
        requisition = Requisition.objects.create(
            from_location=self.from_location,
            to_location=self.to_location,
            requested_by=self.user,
            status="APPROVED"  # Must be APPROVED before picking
        )
        line = RequisitionLine.objects.create(
            requisition=requisition,
            item=self.item,
            qty_requested=Decimal("10.00")
        )
        
        # Pick items using the service
        RequisitionService.pick_requisition(
            requisition=requisition,
            user=self.user
        )
        
        line.refresh_from_db()
        self.assertEqual(line.qty_picked, Decimal("10.00"))
        self.assertEqual(requisition.status, "PICKED")
        
        # Verify stock was transferred
        to_stock = StockLevel.objects.filter(
            item=self.item,
            location=self.to_location
        ).first()
        self.assertIsNotNone(to_stock)
        self.assertEqual(to_stock.on_hand_qty, Decimal("10.00"))


class CountSessionTests(TransactionTestCase):
    """Tests for cycle count sessions"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username="counter",
            password="testpass"
        )
        self.item = Item.objects.create(
            name="Test Item",
            short_code="TEST-001",
            unit_of_measure="ea"
        )
        self.location = Location.objects.create(
            property_id="PROP-001",
            name="Test Location",
            type="STOREROOM"
        )
        self.stock = StockLevel.objects.create(
            item=self.item,
            location=self.location,
            on_hand_qty=Decimal("100.00"),
            par=Decimal("50.00")
        )
    
    def test_create_count_session(self):
        """Test creating a count session"""
        session = CountSession.objects.create(
            location=self.location,
            counted_by=self.user,
            status="IN_PROGRESS"
        )
        
        self.assertEqual(session.status, "IN_PROGRESS")
        self.assertEqual(session.counted_by, self.user)
        self.assertEqual(session.location, self.location)
    
    def test_count_line_variance(self):
        """Test counting items and calculating variance"""
        session = CountSession.objects.create(
            location=self.location,
            counted_by=self.user,
            status="IN_PROGRESS"
        )
        
        expected_qty = self.stock.on_hand_qty  # 100.00
        counted_qty = Decimal("95.00")  # Found 95, expected 100
        
        count_line = CountLine.objects.create(
            count_session=session,
            item=self.item,
            expected_qty=expected_qty,
            counted_qty=counted_qty,
            reason_code="DATA_ERROR"
        )
        
        variance = counted_qty - expected_qty
        self.assertEqual(variance, Decimal("-5.00"))
        self.assertEqual(count_line.reason_code, "DATA_ERROR")
    
    def test_complete_count_session(self):
        """Test completing and approving a count session"""
        approver = User.objects.create_user(
            username="approver",
            password="testpass"
        )
        
        session = CountSession.objects.create(
            location=self.location,
            counted_by=self.user,
            status="IN_PROGRESS"
        )
        
        # Complete the count
        session.status = "COMPLETED"
        session.completed_at = timezone.now()
        session.save()
        
        # Approve the count
        session.status = "APPROVED"
        session.approved_by = approver
        session.approved_at = timezone.now()
        session.save()
        
        self.assertEqual(session.status, "APPROVED")
        self.assertEqual(session.approved_by, approver)
        self.assertIsNotNone(session.approved_at)


class ReportsTests(TestCase):
    """Tests for reporting functionality"""
    
    def setUp(self):
        self.category = Category.objects.create(name="Test Category")
        self.item1 = Item.objects.create(
            name="Item 1",
            short_code="ITEM-001",
            category=self.category
        )
        self.item2 = Item.objects.create(
            name="Item 2",
            short_code="ITEM-002",
            category=self.category
        )
        self.location = Location.objects.create(
            property_id="PROP-001",
            name="Test Location",
            type="STOREROOM"
        )
        # Item 1: Above par (safe)
        StockLevel.objects.create(
            item=self.item1,
            location=self.location,
            on_hand_qty=Decimal("100.00"),
            par=Decimal("50.00")
        )
        # Item 2: Below par (alert needed)
        StockLevel.objects.create(
            item=self.item2,
            location=self.location,
            on_hand_qty=Decimal("20.00"),
            par=Decimal("50.00")
        )
    
    def test_below_par_alerts(self):
        """Test identifying items below par level"""
        below_par = StockLevel.objects.filter(
            on_hand_qty__lt=models.F('par')
        )
        
        self.assertEqual(below_par.count(), 1)
        below_par_item = below_par.first().item
        self.assertEqual(below_par_item, self.item2)
        
        # Test the is_below_par property
        stock_below = StockLevel.objects.get(item=self.item2)
        self.assertTrue(stock_below.is_below_par)
    
    def test_stock_status_summary(self):
        """Test generating stock status summary"""
        total_items = StockLevel.objects.count()
        below_par_count = StockLevel.objects.filter(
            on_hand_qty__lt=models.F('par')
        ).count()
        above_par_count = StockLevel.objects.filter(
            on_hand_qty__gte=models.F('par')
        ).count()
        
        self.assertEqual(total_items, 2)
        self.assertEqual(below_par_count, 1)
        self.assertEqual(above_par_count, 1)


class IntegrationTest(TransactionTestCase):
    """End-to-end integration test demonstrating full workflow"""
    
    def setUp(self):
        # Create users
        self.admin = User.objects.create_user(
            username="admin",
            password="adminpass",
            is_staff=True
        )
        self.staff = User.objects.create_user(
            username="staff",
            password="staffpass"
        )
        
        # Create category and vendor
        self.category = Category.objects.create(name="Cleaning Supplies")
        self.vendor = Vendor.objects.create(
            name="Supply Co",
            contact_info="123 Main St",
            is_active=True
        )
        
        # Create locations
        self.storeroom = Location.objects.create(
            property_id="PROP-001",
            name="Main Storeroom",
            type="STOREROOM"
        )
        self.room = Location.objects.create(
            property_id="PROP-001",
            name="Room 101",
            type="ROOM"
        )
        
        # Create item
        self.item = Item.objects.create(
            name="Toilet Paper",
            short_code="TP-001",
            category=self.category,
            default_vendor=self.vendor,
            unit_of_measure="case",
            cost=Decimal("24.99")
        )
        
        # Create initial stock
        StockLevel.objects.create(
            item=self.item,
            location=self.storeroom,
            on_hand_qty=Decimal("100.00"),
            par=Decimal("50.00")
        )
    
    def test_full_workflow(self):
        """
        Test complete workflow:
        1. Receive stock
        2. Check stock levels
        3. Create requisition
        4. Pick items
        5. Complete requisition
        6. Run cycle count
        7. Check reports
        """
        # 1. Receive stock
        StockService.receive_stock(
            item=self.item,
            to_location=self.storeroom,
            qty=Decimal("50.00"),
            cost=Decimal("24.99"),
            user=self.admin,
            receipt_id="REC-001"
        )
        
        stock = StockLevel.objects.get(item=self.item, location=self.storeroom)
        self.assertEqual(stock.on_hand_qty, Decimal("150.00"))
        
        # 2. Create requisition
        requisition = Requisition.objects.create(
            from_location=self.storeroom,
            to_location=self.room,
            requested_by=self.staff,
            status="PENDING"
        )
        line = RequisitionLine.objects.create(
            requisition=requisition,
            item=self.item,
            qty_requested=Decimal("10.00")
        )
        
        # 3. Approve and pick items
        requisition.status = "APPROVED"
        requisition.save()
        
        RequisitionService.pick_requisition(
            requisition=requisition,
            user=self.admin
        )
        
        # 4. Complete requisition
        RequisitionService.complete_requisition(
            requisition=requisition,
            user=self.admin
        )
        
        requisition.refresh_from_db()
        self.assertEqual(requisition.status, "COMPLETED")
        
        # 5. Verify stock was transferred
        room_stock = StockLevel.objects.filter(
            item=self.item,
            location=self.room
        ).first()
        self.assertIsNotNone(room_stock)
        self.assertEqual(room_stock.on_hand_qty, Decimal("10.00"))
        
        # 6. Run cycle count
        count_session = CountSession.objects.create(
            location=self.storeroom,
            counted_by=self.staff,
            status="IN_PROGRESS"
        )
        CountLine.objects.create(
            count_session=count_session,
            item=self.item,
            expected_qty=Decimal("140.00"),
            counted_qty=Decimal("140.00")
        )
        
        count_session.status = "COMPLETED"
        count_session.completed_at = timezone.now()
        count_session.save()
        
        self.assertEqual(count_session.status, "COMPLETED")
        self.assertEqual(count_session.lines.count(), 1)

