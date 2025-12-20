from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    ItemViewSet, LocationViewSet, StockViewSet,
    StockTransferView, StockIssueView, StockAdjustView,
    RequisitionViewSet, RequisitionPickView, RequisitionCompleteView,
    ReceiveView, ReceivingHistoryView,
    CountSessionViewSet, CountLineView, CountCompleteView, CountApproveView,
    AlertsView, SuggestedOrdersView, UsageTrendsView,
    CategoriesViewSet, VendorsViewSet, ParLevelsView,
    LoginView, LogoutView, UserInfoView, CSRFTokenView
)

router = DefaultRouter()
router.register(r'items', ItemViewSet, basename='item')
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'stock', StockViewSet, basename='stock')
router.register(r'requisitions', RequisitionViewSet, basename='requisition')
router.register(r'counts/sessions', CountSessionViewSet, basename='countsession')
router.register(r'settings/categories', CategoriesViewSet, basename='category')
router.register(r'settings/vendors', VendorsViewSet, basename='vendor')

urlpatterns = [
    path('', include(router.urls)),
    
    # Authentication
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/user/', UserInfoView.as_view(), name='auth-user'),
    path('auth/csrf/', CSRFTokenView.as_view(), name='auth-csrf'),
    
    # Stock operations
    path('stock/transfer/', StockTransferView.as_view(), name='stock-transfer'),
    path('stock/issue/', StockIssueView.as_view(), name='stock-issue'),
    path('stock/adjust/', StockAdjustView.as_view(), name='stock-adjust'),
    
    # Requisitions
    path('requisitions/<int:requisition_id>/pick/', RequisitionPickView.as_view(), name='requisition-pick'),
    path('requisitions/<int:requisition_id>/complete/', RequisitionCompleteView.as_view(), name='requisition-complete'),
    
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
    
    # Settings
    path('settings/par-levels/', ParLevelsView.as_view(), name='par-levels'),
]

