from django.contrib import admin
from .models import Customer, Category, Supplier, Product, Invoice, InvoiceItem, Purchase, PurchaseItem, StockAdjustment, ShopSetting

admin.site.register(ShopSetting)
admin.site.register(Customer)
admin.site.register(Category)
admin.site.register(Supplier)
admin.site.register(Product)
admin.site.register(Invoice)
admin.site.register(InvoiceItem)
admin.site.register(Purchase)
admin.site.register(PurchaseItem)
admin.site.register(StockAdjustment)
