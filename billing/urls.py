from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'customers', views.CustomerViewSet)
router.register(r'products', views.ProductViewSet)
router.register(r'categories', views.CategoryViewSet)
router.register(r'suppliers', views.SupplierViewSet)
router.register(r'invoices', views.InvoiceViewSet)
router.register(r'purchases', views.PurchaseViewSet)
router.register(r'stock-adjustments', views.StockAdjustmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    path('dashboard/recent-invoices/', views.recent_invoices, name='recent-invoices'),
    path('pages/dashboard/', views.page_dashboard, name='page-dashboard'),
    path('pages/billing/', views.page_billing, name='page-billing'),
    path('pages/quick-billing/', views.page_quick_billing, name='page-quick-billing'),
    path('pages/stock-adjustment/', views.page_stock_adjustment, name='page-stock-adjustment'),
    path('pages/purchase-entry/', views.page_purchase_entry, name='page-purchase-entry'),
    path('pages/purchase-returns/', views.page_purchase_returns, name='page-purchase-returns'),
    path('pages/suppliers/', views.page_suppliers, name='page-suppliers'),
    path('pages/user-management/', views.page_user_management, name='page-user-management'),
    path('pages/vehicle-profile/', views.page_vehicle_profile, name='page-vehicle-profile'),
    path('pages/add-product/', views.page_add_product, name='page-add-product'),
    path('pages/inventory/', views.page_inventory, name='page-inventory'),
    path('pages/customers/', views.page_customers, name='page-customers'),
    path('settings/', views.shop_settings, name='shop-settings'),
    path('reports/data/', views.reports_data, name='reports-data'),
    path('pages/reports/', views.page_reports, name='page-reports'),
    path('pages/settings/', views.page_settings, name='page-settings'),
    path('invoice-detail/<int:invoice_id>/', views.invoice_detail, name='invoice-detail'),
    path('pages/invoice-preview/<int:invoice_id>/', views.page_invoice_preview, name='page-invoice-preview'),
]
