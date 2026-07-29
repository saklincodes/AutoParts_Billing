from django.db import models
from django.db.models import Sum, Count, Q, F, DecimalField
from django.db.models.functions import TruncDate, TruncMonth, TruncYear
from django.shortcuts import render
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response

from .models import (
    Customer, Category, Supplier, Product, ShopSetting,
    Invoice, InvoiceItem, Purchase, PurchaseItem, StockAdjustment
)
from .serializers import (
    CustomerSerializer, CategorySerializer, SupplierSerializer,
    ProductSerializer, ProductMinSerializer,
    InvoiceListSerializer, InvoiceDetailSerializer,
    InvoiceItemCreateSerializer,
    PurchaseSerializer, PurchaseItemSerializer,
    StockAdjustmentSerializer, DashboardStatsSerializer
)


@api_view(['GET'])
def dashboard_stats(request):
    today = timezone.now().date()
    first_of_month = today.replace(day=1)

    today_revenue = Invoice.objects.filter(
        date__date=today, status='paid'
    ).aggregate(total=Sum('total_amount'))['total'] or 0

    monthly_sales = Invoice.objects.filter(
        date__date__gte=first_of_month, status='paid'
    ).aggregate(total=Sum('total_amount'))['total'] or 0

    low_stock_count = Product.objects.filter(stock_qty__lte=models.F('low_stock_qty')).count()
    total_products = Product.objects.count()
    total_customers = Customer.objects.count()
    pending_invoices = Invoice.objects.filter(status='pending').count()

    data = {
        'today_revenue': float(today_revenue),
        'monthly_sales': float(monthly_sales),
        'low_stock_count': low_stock_count,
        'total_products': total_products,
        'total_customers': total_customers,
        'pending_invoices': pending_invoices,
    }
    return Response(data)


@api_view(['GET'])
def reports_data(request):
    period = request.query_params.get('period', 'weekly')

    today = timezone.now().date()
    if period == 'daily':
        start_date = today - timedelta(days=6)
        trunc_fn = TruncDate('date')
        fmt = '%a'
    elif period == 'monthly':
        start_date = today - timedelta(days=30)
        trunc_fn = TruncDate('date')
        fmt = '%d %b'
    elif period == 'yearly':
        start_date = today - timedelta(days=365)
        trunc_fn = TruncMonth('date')
        fmt = '%b'
    else:
        start_date = today - timedelta(days=7)
        trunc_fn = TruncDate('date')
        fmt = '%a'

    sales_qs = Invoice.objects.filter(
        date__date__gte=start_date, status='paid'
    ).annotate(period_date=trunc_fn).values('period_date').annotate(
        total=Sum('total_amount')
    ).order_by('period_date')

    sales_history = []
    for s in sales_qs:
        sales_history.append({
            'label': s['period_date'].strftime(fmt) if s['period_date'] else '',
            'amount': float(s['total']),
        })

    total_revenue = Invoice.objects.filter(
        date__date__gte=start_date, status='paid'
    ).aggregate(total=Sum('total_amount'))['total'] or 0

    last_start = start_date - (today - start_date) if period != 'yearly' else start_date - timedelta(days=365)
    prev_revenue = Invoice.objects.filter(
        date__date__gte=last_start, date__date__lt=start_date, status='paid'
    ).aggregate(total=Sum('total_amount'))['total'] or 0

    change_pct = 0
    if prev_revenue > 0:
        change_pct = round((float(total_revenue) - float(prev_revenue)) / float(prev_revenue) * 100, 1)

    items_sold = InvoiceItem.objects.filter(
        invoice__date__date__gte=start_date, invoice__status='paid'
    ).aggregate(total=Sum('quantity'))['total'] or 0

    avg_per_order = 0
    order_count = Invoice.objects.filter(
        date__date__gte=start_date, status='paid'
    ).count()
    if order_count > 0 and items_sold > 0:
        avg_per_order = round(items_sold / order_count, 1)

    top_products = InvoiceItem.objects.filter(
        invoice__date__date__gte=start_date, invoice__status='paid'
    ).values('product_name').annotate(
        total_qty=Sum('quantity'),
        total_rev=Sum('subtotal')
    ).order_by('-total_qty')[:5]

    top_products_data = []
    for p in top_products:
        top_products_data.append({
            'name': p['product_name'],
            'qty': p['total_qty'],
            'revenue': float(p['total_rev']),
        })

    return Response({
        'total_revenue': float(total_revenue),
        'change_pct': change_pct,
        'items_sold': items_sold,
        'avg_per_order': avg_per_order,
        'sales_history': sales_history,
        'top_products': top_products_data,
    })


def page_purchase_entry(request):
    return render(request, 'purchase_entry_desktop/code.html')


def page_purchase_returns(request):
    return render(request, 'purchase_returns_desktop/code.html')


def page_suppliers(request):
    return render(request, 'suppliers_desktop/code.html')


def page_user_management(request):
    return render(request, 'user_management/code.html')


def page_vehicle_profile(request):
    return render(request, 'vehicle_profile/code.html')


def page_add_product(request):
    return render(request, 'add_edit_product/code.html')


@api_view(['GET', 'PUT'])
def shop_settings(request):
    setting = ShopSetting.objects.first()
    if not setting:
        setting = ShopSetting.objects.create(shop_name='My Auto Parts Shop')

    if request.method == 'PUT':
        for field in ['shop_name', 'address', 'phone', 'email', 'tax_rate', 'currency', 'receipt_footer']:
            if field in request.data:
                setattr(setting, field, request.data[field])
        setting.save()
        return Response({'status': 'saved'})

    return Response({
        'shop_name': setting.shop_name,
        'address': setting.address or '',
        'phone': setting.phone or '',
        'email': setting.email or '',
        'tax_rate': float(setting.tax_rate),
        'currency': setting.currency,
        'receipt_footer': setting.receipt_footer or '',
    })


def page_dashboard(request):
    return render(request, 'dashboard/code.html')


def page_billing(request):
    return render(request, 'new_billing_1/code.html')


def page_inventory(request):
    return render(request, 'inventory/code.html')


def page_customers(request):
    return render(request, 'customers/code.html')


@api_view(['GET'])
def invoice_detail(request, invoice_id):
    try:
        invoice = Invoice.objects.prefetch_related('items', 'items__product').get(pk=invoice_id)
    except Invoice.DoesNotExist:
        return Response(status=404)
    serializer = InvoiceDetailSerializer(invoice)
    return Response(serializer.data)


def page_stock_adjustment(request):
    return render(request, 'stock_adjustment/code.html')


def page_quick_billing(request):
    return render(request, 'quick_billing/code.html')


def page_invoice_preview(request, invoice_id=None):
    return render(request, 'invoice_preview_1/code.html', {'invoice_id': invoice_id})


def page_reports(request):
    return render(request, 'reports/code.html')


def page_settings(request):
    return render(request, 'settings/code.html')


@api_view(['GET'])
def recent_invoices(request):
    invoices = Invoice.objects.select_related('customer').order_by('-created_at')[:5]
    serializer = InvoiceListSerializer(invoices, many=True)
    return Response(serializer.data)


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(phone__icontains=search) |
                Q(vehicle_no__icontains=search)
            )
        return qs


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        category = self.request.query_params.get('category')
        low_stock = self.request.query_params.get('low_stock')

        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(sku__icontains=search) |
                Q(brand__icontains=search)
            )
        if category:
            qs = qs.filter(category__name__iexact=category)
        if low_stock:
            qs = qs.filter(stock_qty__lte=models.F('low_stock_qty'))
        return qs

    @action(detail=False, methods=['get'])
    def search_min(self, request):
        qs = self.get_queryset()
        serializer = ProductMinSerializer(qs, many=True)
        return Response(serializer.data)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(phone__icontains=search)
            )
        return qs


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.prefetch_related('items', 'items__product').select_related('customer').all()

    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        status = self.request.query_params.get('status')
        if status:
            qs = qs.filter(status=status)
        return qs

    def create(self, request, *args, **kwargs):
        customer_id = request.data.get('customer_id')
        items_data = request.data.get('items', [])
        discount = float(request.data.get('discount', 0))
        tax = float(request.data.get('tax', 0))

        last_invoice = Invoice.objects.order_by('-id').first()
        next_id = (last_invoice.id + 1) if last_invoice else 1
        invoice_no = f"INV-{timezone.now().year}-{next_id:03d}"

        customer = None
        if customer_id:
            customer = Customer.objects.get(id=customer_id)

        subtotal = 0
        invoice_items = []
        for item in items_data:
            serializer = InvoiceItemCreateSerializer(data=item)
            serializer.is_valid(raise_exception=True)
            product = Product.objects.get(id=serializer.validated_data['product_id'])
            qty = serializer.validated_data['quantity']
            unit_price = serializer.validated_data['unit_price']
            item_subtotal = qty * float(unit_price)
            subtotal += item_subtotal

            invoice_items.append({
                'product': product,
                'product_name': product.name,
                'product_sku': product.sku,
                'quantity': qty,
                'unit_price': unit_price,
                'subtotal': item_subtotal,
            })

            product.stock_qty -= qty
            product.save()

        total_amount = subtotal - discount + tax

        invoice = Invoice.objects.create(
            invoice_no=invoice_no,
            customer=customer,
            subtotal=subtotal,
            discount=discount,
            tax=tax,
            total_amount=total_amount,
            status='pending',
        )

        for item in invoice_items:
            InvoiceItem.objects.create(invoice=invoice, **item)

        if customer:
            customer.total_visits += 1
            customer.total_spent += total_amount
            customer.save()

        serializer = InvoiceDetailSerializer(invoice)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()
        invoice.status = 'paid'
        invoice.save()
        return Response({'status': 'Invoice marked as paid'})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        invoice = self.get_object()
        invoice.status = 'cancelled'
        invoice.save()
        return Response({'status': 'Invoice cancelled'})


class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.prefetch_related('items').select_related('supplier').all()
    serializer_class = PurchaseSerializer

    def create(self, request, *args, **kwargs):
        supplier_id = request.data.get('supplier_id')
        items_data = request.data.get('items', [])

        last_purchase = Purchase.objects.order_by('-id').first()
        next_id = (last_purchase.id + 1) if last_purchase else 1
        purchase_no = f"PUR-{timezone.now().year}-{next_id:03d}"

        supplier = None
        if supplier_id:
            supplier = Supplier.objects.get(id=supplier_id)

        total_amount = 0
        purchase_items = []
        for item in items_data:
            product = Product.objects.get(id=item['product_id'])
            qty = item['quantity']
            unit_price = item['unit_price']
            item_subtotal = qty * float(unit_price)
            total_amount += item_subtotal

            purchase_items.append({
                'product': product,
                'product_name': product.name,
                'quantity': qty,
                'unit_price': unit_price,
                'subtotal': item_subtotal,
            })

            product.stock_qty += qty
            product.save()

        purchase = Purchase.objects.create(
            purchase_no=purchase_no,
            supplier=supplier,
            total_amount=total_amount,
            notes=request.data.get('notes', ''),
        )

        for item in purchase_items:
            PurchaseItem.objects.create(purchase=purchase, **item)

        serializer = PurchaseSerializer(purchase)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class StockAdjustmentViewSet(viewsets.ModelViewSet):
    queryset = StockAdjustment.objects.select_related('product').all()
    serializer_class = StockAdjustmentSerializer

    def create(self, request, *args, **kwargs):
        product_id = request.data.get('product_id')
        quantity_change = int(request.data.get('quantity_change', 0))

        product = Product.objects.get(id=product_id)
        adjustment = StockAdjustment.objects.create(
            product=product,
            quantity_change=quantity_change,
            reason=request.data.get('reason', 'other'),
            notes=request.data.get('notes', ''),
        )

        product.stock_qty += quantity_change
        product.save()

        serializer = StockAdjustmentSerializer(adjustment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
