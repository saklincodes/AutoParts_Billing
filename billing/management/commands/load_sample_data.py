from django.core.management.base import BaseCommand
from billing.models import Customer, Category, Supplier, Product, Invoice, InvoiceItem


class Command(BaseCommand):
    help = 'Load sample data for testing'

    def handle(self, *args, **kwargs):
        categories = ['Engine', 'Tires', 'Lighting', 'Brakes', 'Suspension', 'Electrical', 'Filters', 'Batteries']
        for name in categories:
            Category.objects.get_or_create(name=name)

        suppliers = [
            ('Auto Parts Distributors', '01711-223344', 'info@apd.com'),
            ('Premium Auto Spares', '01722-334455', 'sales@premiumauto.com'),
            ('Direct Auto Imports', '01733-445566', 'orders@directauto.com'),
        ]
        for name, phone, email in suppliers:
            Supplier.objects.get_or_create(name=name, phone=phone, email=email)

        customers = [
            ('Rahim Mia', '01911-111111', 'Kallyanpur, Dhaka', 'DM-12-3456'),
            ('Karim Hossain', '01922-222222', 'Mirpur, Dhaka', 'DM-23-4567'),
            ('Sakib Ahmed', '01933-333333', 'Uttara, Dhaka', 'DM-34-5678'),
            ('Nasir Uddin', '01944-444444', 'Mohammadpur, Dhaka', 'DM-45-6789'),
            ('Faruk Hasan', '01955-555555', 'Shyamoli, Dhaka', 'DM-56-7890'),
        ]
        for name, phone, address, vehicle in customers:
            Customer.objects.get_or_create(name=name, phone=phone, defaults={
                'address': address, 'vehicle_no': vehicle
            })

        cat_map = {c.name: c for c in Category.objects.all()}
        supplier = Supplier.objects.first()

        products = [
            ('Engine Oil 20W50', 'EO-001', 'Engine', 450, 50, 5, 'Mobil'),
            ('Engine Oil 10W40', 'EO-002', 'Engine', 380, 30, 5, 'Castrol'),
            ('Air Filter', 'AF-001', 'Filters', 250, 100, 10, 'Bosch'),
            ('Oil Filter', 'OF-001', 'Filters', 180, 80, 10, 'Bosch'),
            ('Brake Pad Set', 'BP-001', 'Brakes', 1200, 20, 5, 'ATE'),
            ('Brake Disc', 'BD-001', 'Brakes', 2500, 15, 3, 'ATE'),
            ('LED Headlight', 'LH-001', 'Lighting', 3500, 10, 3, 'Philips'),
            ('Tail Light', 'TL-001', 'Lighting', 800, 25, 5, 'Philips'),
            ('Battery 60Ah', 'BT-001', 'Batteries', 4500, 12, 3, 'Exide'),
            ('Battery 80Ah', 'BT-002', 'Batteries', 5500, 8, 3, 'Exide'),
            ('Tire 185/65R14', 'TR-001', 'Tires', 3500, 20, 5, 'Bridgestone'),
            ('Tire 195/55R15', 'TR-002', 'Tires', 4200, 15, 5, 'Michelin'),
            ('Clutch Plate', 'CP-001', 'Engine', 1800, 15, 3, 'Valeo'),
            ('Spark Plug (x4)', 'SP-001', 'Engine', 600, 40, 10, 'NGK'),
            ('Shock Absorber', 'SA-001', 'Suspension', 2200, 10, 3, 'KYB'),
            ('Wiper Blade Set', 'WB-001', 'Electrical', 350, 60, 10, 'Bosch'),
        ]
        for name, sku, cat, price, stock, low_stock, brand in products:
            Product.objects.get_or_create(sku=sku, defaults={
                'name': name, 'category': cat_map.get(cat),
                'price': price, 'stock_qty': stock,
                'low_stock_qty': low_stock, 'brand': brand,
                'supplier': supplier, 'cost_price': price * 0.7,
            })

        customer = Customer.objects.first()
        product = Product.objects.first()
        invoice = Invoice.objects.create(
            invoice_no='INV-2026-001',
            customer=customer,
            subtotal=450,
            total_amount=450,
            status='paid',
        )
        InvoiceItem.objects.create(
            invoice=invoice, product=product,
            product_name=product.name, product_sku=product.sku,
            quantity=1, unit_price=450, subtotal=450
        )

        product2 = Product.objects.get(sku='AF-001')
        invoice2 = Invoice.objects.create(
            invoice_no='INV-2026-002',
            customer=customer,
            subtotal=700,
            total_amount=700,
            status='pending',
        )
        InvoiceItem.objects.create(
            invoice=invoice2, product=product2,
            product_name=product2.name, product_sku=product2.sku,
            quantity=2, unit_price=250, subtotal=500
        )
        InvoiceItem.objects.create(
            invoice=invoice2, product=product,
            product_name=product.name, product_sku=product.sku,
            quantity=1, unit_price=200, subtotal=200
        )

        self.stdout.write(self.style.SUCCESS('Sample data loaded successfully!'))
