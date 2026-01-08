from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    ItemViewSet, LocationViewSet, StockViewSet,
    StockTransferView, StockIssueView, StockAdjustView,
    RequisitionViewSet, RequisitionPickView, RequisitionCompleteView,
    RequisitionApproveView, RequisitionDenyView,
    ReceiveView, ReceivingHistoryView,
    CountSessionViewSet, CountLineView, CountCompleteView, CountApproveView,
    AlertsView, SuggestedOrdersView, UsageTrendsView, GeneralUsageView, LowParTrendsView, EnvironmentalImpactView,
    DashboardStatsView,
    CategoriesViewSet, VendorsViewSet, ParLevelsView, CategoryParLevelsView, BulkApplyCategoryParLevelsView,
    LoginView, LogoutView, UserInfoView, CSRFTokenView,
    UserViewSet, PurchaseRequestViewSet, PurchaseRequestApproveView, PurchaseRequestDenyView,
    DepartmentViewSet, PhysicalChangeRequestViewSet, RequestedItemViewSet,
    SynergyEnigmaSyncView, SynergyEnigmaPushView,
    AppDownloadView, AppVersionView
)

router = DefaultRouter()
router.register(r'items', ItemViewSet, basename='item')
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'stock', StockViewSet, basename='stock')
router.register(r'requisitions', RequisitionViewSet, basename='requisition')
router.register(r'counts/sessions', CountSessionViewSet, basename='countsession')
router.register(r'settings/categories', CategoriesViewSet, basename='category')
router.register(r'settings/vendors', VendorsViewSet, basename='vendor')
router.register(r'settings/users', UserViewSet, basename='user')
router.register(r'settings/departments', DepartmentViewSet, basename='department')
router.register(r'purchase-requests', PurchaseRequestViewSet, basename='purchaserequest')
router.register(r'physical-change-requests', PhysicalChangeRequestViewSet, basename='physicalchangerequest')
router.register(r'requested-items', RequestedItemViewSet, basename='requesteditem')

urlpatterns = [
    # Stock operations - must come before router to avoid conflicts
    path('stock/transfer/', StockTransferView.as_view(), name='stock-transfer'),
    path('stock/issue/', StockIssueView.as_view(), name='stock-issue'),
    path('stock/adjust/', StockAdjustView.as_view(), name='stock-adjust'),
    
    # Router URLs (includes stock ViewSet)
    path('', include(router.urls)),
    
    # Authentication
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/user/', UserInfoView.as_view(), name='auth-user'),
    path('auth/csrf/', CSRFTokenView.as_view(), name='auth-csrf'),
    
    # Requisitions
    path('requisitions/<int:requisition_id>/pick/', RequisitionPickView.as_view(), name='requisition-pick'),
    path('requisitions/<int:requisition_id>/complete/', RequisitionCompleteView.as_view(), name='requisition-complete'),
    path('requisitions/<int:requisition_id>/approve/', RequisitionApproveView.as_view(), name='requisition-approve'),
    path('requisitions/<int:requisition_id>/deny/', RequisitionDenyView.as_view(), name='requisition-deny'),
    
    # Receiving
    path('receiving/receive/', ReceiveView.as_view(), name='receive'),
    path('receiving/history/', ReceivingHistoryView.as_view(), name='receiving-history'),
    
    # Counts
    path('counts/sessions/<int:session_id>/lines/', CountLineView.as_view(), name='count-line'),
    path('counts/sessions/<int:session_id>/complete/', CountCompleteView.as_view(), name='count-complete'),
    path('counts/sessions/<int:session_id>/approve/', CountApproveView.as_view(), name='count-approve'),
    
    # Reports
    path('reports/alerts/', AlertsView.as_view(), name='alerts'),
    path('reports/suggested-orders/', SuggestedOrdersView.as_view(), name='suggested-orders'),
    path('reports/usage-trends/', UsageTrendsView.as_view(), name='usage-trends'),
    path('reports/general-usage/', GeneralUsageView.as_view(), name='general-usage'),
    path('reports/low-par-trends/', LowParTrendsView.as_view(), name='low-par-trends'),
    path('reports/environmental-impact/', EnvironmentalImpactView.as_view(), name='environmental-impact'),
    
    # Dashboard
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    
    # Settings
    path('settings/par-levels/', ParLevelsView.as_view(), name='par-levels'),
    path('settings/categories/<int:category_id>/par-levels/', CategoryParLevelsView.as_view(), name='category-par-levels'),
    path('settings/categories/<int:category_id>/par-levels/bulk-apply/', BulkApplyCategoryParLevelsView.as_view(), name='bulk-apply-category-par-levels'),
    
    # Purchase Requests
    path('purchase-requests/<int:purchase_request_id>/approve/', PurchaseRequestApproveView.as_view(), name='purchase-request-approve'),
    path('purchase-requests/<int:purchase_request_id>/deny/', PurchaseRequestDenyView.as_view(), name='purchase-request-deny'),
    
    # App Download
    path('app/download/', AppDownloadView.as_view(), name='app-download'),
    path('app/version/', AppVersionView.as_view(), name='app-version'),
    
    # Synergy/Enigma Integration
    path('integrations/synergy-enigma/sync/', SynergyEnigmaSyncView.as_view(), name='synergy-enigma-sync'),
    path('integrations/synergy-enigma/push/', SynergyEnigmaPushView.as_view(), name='synergy-enigma-push'),
]

