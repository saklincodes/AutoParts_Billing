# AutoParts Billing - Project Context

## Monorepo Structure
```
E:\Autoparts_Billing\          ← Django backend + HTML source
├── billing/                   ← Django app (views.py, urls.py, models.py, api/)
├── stitch_autoparts_billing_pro/ ← HTML template source (35+ screens)
├── autoparts_billing_api/     ← DRF serializers
├── manage.py
├── db.sqlite3
│
E:\autoparts_billing_app\      ← Capacitor Android app
├── www/                       ← HTML files (copied from Django source, then modified)
├── android/                   ← Android project
├── capacitor.config.json
├── putul-release-key.keystore
└── .github/workflows/build-apk.yml
```
Both point to same GitHub remote: `saklincodes/AutoParts_Billing.git`

## Tech Stack
- **Backend**: Django 5.x + Django REST Framework (Python 3.12)
- **Frontend**: HTML + Tailwind CSS + Material Symbols (no framework, static HTML)
- **Mobile**: Capacitor 8.x Android (wraps www/ HTML in WebView)
- **CI**: GitHub Actions builds APK on push to main

## What Has Been Done (17 Feature Integrations)

### Django API Endpoints (/api/)
- `dashboard/stats/` — revenue, orders, low stock count
- `dashboard/recent-invoices/` — last 5 invoices
- `products/` + `products/search_min/` — full & minimal product list
- `invoices/` — create invoice + list
- `invoice-detail/{id}/` — single invoice with items
- `customers/` — list + create
- `reports/` — revenue chart data, top products
- `settings/` — GET/PUT shop info
- `stock-adjustments/` — list + create (supports `product` or `product_id`)

### Django Page Views (/api/pages/)
All 27 URLs tested and return 200:
- `dashboard/`, `billing/`, `inventory/`, `customers/`, `reports/`, `settings/`
- `invoice-preview/`, `quick-billing/`, `stock-adjustment/`
- `add-product/`, `edit-product/`, `vehicle-profile/`
- `user-management/`, `suppliers/`, `purchase-entry/`, `purchase-returns/`
- Also desktop variants for each

### Frontend Features (each page has live API integration)
- **Dashboard** — live stats, revenue, orders, low stock, recent invoices
- **New Billing** — product search (search_min), cart, create invoice → preview redirect
- **Inventory** — live product list, search, low stock indicator
- **Customers** — live list, search, add via prompt → POST
- **Reports** — revenue chart (SVG), top products pie, period filter, export modal
- **Settings** — load/save shop info via prompt + PUT, dark mode (localStorage)
- **Invoice Preview** — fetch invoice + shop settings for header
- **Quick Billing** — POS-style search, cart, create invoice
- **Stock Adjustment** — product picker, reason type (damage/return/restock/audit), qty ±, save

### Bugs Found & Fixed (Deep Audit)
1. `localhost:8000` hardcoded → `/api` (5 pages)
2. Search inputs missing IDs → added (customers, inventory, quick billing)
3. Settings page no API → added loadSettings + saveSetting
4. StockAdjustment model missing `restock`/`audit` → added + migration 0003
5. StockAdjustment view `product_id` vs `product` → view accepts either
6. Inventory search JS fragile selector → `getElementById('productSearch')`
7. 8 pages had `href="#"` → real API URLs
8. Stock Adjustment nav link → points to self (not inventory)
9. Inventory FAB → now has add-product + stock-adjustment buttons

## Capacitor App Status
- www/ HTML is a COPY of Django HTML, with modifications:
  - `API_BASE` = `http://192.168.1.103:8000/api` (absolute URL for mobile)
  - Nav links use absolute URLs (e.g., `http://192.168.1.103:8000/api/pages/...`)
- CI build succeeds (keystore path: `../../putul-release-key.keystore` from android/app/)
- Server must be running and accessible from mobile (same WiFi or public IP)

## How to Run
```bash
# Django dev server
E:\python312\python.exe manage.py runserver 0.0.0.0:8000 --noreload --insecure

# Build APK
cd E:\autoparts_billing_app
git push origin main    # GitHub Actions handles build

# Or build locally (needs RAM)
cd android
./gradlew assembleRelease --no-daemon
```

## Key URLs (when server is running)
- `http://localhost:8000/` — Django root
- `http://localhost:8000/api/pages/dashboard/` — mobile dashboard
- `http://192.168.1.103:8000/` — access from other devices on network

## Editor/Config
- `RULES.md` at project root contains additional instructions
- `start_server.bat` starts the Django server
