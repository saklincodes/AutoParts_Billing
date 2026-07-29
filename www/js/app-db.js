var AppDB = (function () {
  var DB_NAME = 'AutoPartsBillingDB';
  var DB_VERSION = 1;
  var db = null;

  var INITIAL_PRODUCTS = [
    { name: 'Brake Pad Set - Front', sku: 'BP-9921', price: 1250, stock_qty: 14, low_stock_qty: 5, category: 'parts', brand: 'OEM', description: 'High-friction pads for heavy-duty SUVs.' },
    { name: 'Oil Filter - Synthetic', sku: 'OF-4402', price: 450, stock_qty: 8, low_stock_qty: 5, category: 'fluids', brand: 'K&N', description: 'Premium synthetic media oil filter.' },
    { name: 'Ceramic Brake Pads', sku: 'CBP-7812', price: 2450, stock_qty: 2, low_stock_qty: 5, category: 'parts', brand: 'Brembo', description: 'High-performance ceramic brake pads.' },
    { name: 'Platinum Battery 12V', sku: 'BAT-750', price: 8500, stock_qty: 24, low_stock_qty: 3, category: 'parts', brand: 'Bosch', description: '750 CCA, Maintenance-free lead-acid.' },
    { name: 'Iridium Spark Plug', sku: 'SPK-0022', price: 780, stock_qty: 148, low_stock_qty: 20, category: 'parts', brand: 'NGK', description: 'Long-lasting ignition for performance engines.' },
    { name: 'K&N High-Flow Oil Filter', sku: 'KN-204', price: 1150, stock_qty: 12, low_stock_qty: 5, category: 'fluids', brand: 'K&N', description: 'High-flow oil filter with premium filtration.' },
    { name: 'Full Synthetic 5W-30 (1qt)', sku: 'SY-530', price: 560, stock_qty: 48, low_stock_qty: 10, category: 'fluids', brand: 'Castrol', description: 'Fully synthetic motor oil.' },
    { name: 'LED Headlamp Bulb', sku: 'LED-HB1', price: 1200, stock_qty: 30, low_stock_qty: 5, category: 'parts', brand: 'Philips', description: 'Ultra-bright LED headlamp bulb.' },
    { name: 'Wiper Blade Set', sku: 'WPR-24', price: 450, stock_qty: 18, low_stock_qty: 5, category: 'parts', brand: 'Bosch', description: 'All-weather silicone wiper blades.' },
    { name: 'Premium Air Filter', sku: 'AF-8801', price: 850, stock_qty: 22, low_stock_qty: 5, category: 'parts', brand: 'K&N', description: 'High-performance reusable air filter.' }
  ];

  var INITIAL_CUSTOMERS = [
    { name: 'John Cooper', phone: '9876543210', vehicle_no: 'WB-01-AB-1234', total_visits: 5, total_spent: 12500, is_premium: true },
    { name: 'City Motors', phone: '8765432109', vehicle_no: 'WB-02-CD-5678', total_visits: 12, total_spent: 45000, is_premium: true },
    { name: 'Sarah Miller', phone: '7654321098', vehicle_no: 'WB-03-EF-9012', total_visits: 3, total_spent: 3200, is_premium: false }
  ];

  var INITIAL_SETTINGS = {
    shop_name: 'Putul Auto Parts and Autoscan',
    address: '123 Mechanics Row, Kolkata',
    phone: '+91 98765 43210',
    email: 'contact@putulauto.com',
    printer_ip: '192.168.1.145',
    printer_type: 'thermal'
  };

  function openDB() {
    return new Promise(function (resolve, reject) {
      if (db) { resolve(db); return; }
      var request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = function () { reject(request.error); };
      request.onsuccess = function () {
        db = request.result;
        resolve(db);
      };
      request.onupgradeneeded = function (e) {
        var d = e.target.result;
        if (!d.objectStoreNames.contains('products')) {
          var ps = d.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
          ps.createIndex('sku', 'sku', { unique: false });
          ps.createIndex('name', 'name', { unique: false });
        }
        if (!d.objectStoreNames.contains('customers')) {
          var cs = d.createObjectStore('customers', { keyPath: 'id', autoIncrement: true });
          cs.createIndex('name', 'name', { unique: false });
          cs.createIndex('phone', 'phone', { unique: false });
        }
        if (!d.objectStoreNames.contains('invoices')) {
          d.createObjectStore('invoices', { keyPath: 'id', autoIncrement: true });
        }
        if (!d.objectStoreNames.contains('stockAdjustments')) {
          d.createObjectStore('stockAdjustments', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  function getAll(storeName) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, 'readonly');
        var store = tx.objectStore(storeName);
        var req = store.getAll();
        req.onerror = function () { reject(req.error); };
        req.onsuccess = function () { resolve(req.result || []); };
      });
    });
  }

  function getById(storeName, id) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, 'readonly');
        var store = tx.objectStore(storeName);
        var req = store.get(Number(id));
        req.onerror = function () { reject(req.error); };
        req.onsuccess = function () { resolve(req.result); };
      });
    });
  }

  function put(storeName, data) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, 'readwrite');
        var store = tx.objectStore(storeName);
        var req = store.put(data);
        req.onerror = function () { reject(req.error); };
        req.onsuccess = function () { resolve(req.result); };
      });
    });
  }

  function add(storeName, data) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, 'readwrite');
        var store = tx.objectStore(storeName);
        data.created_at = new Date().toISOString();
        var req = store.add(data);
        req.onerror = function () { reject(req.error); };
        req.onsuccess = function () { resolve(req.result); };
      });
    });
  }

  function remove(storeName, id) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, 'readwrite');
        var store = tx.objectStore(storeName);
        var req = store.delete(Number(id));
        req.onerror = function () { reject(req.error); };
        req.onsuccess = function () { resolve(); };
      });
    });
  }

  function generateId(prefix) {
    var now = new Date();
    var ts = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0') +
      now.getMilliseconds().toString().padStart(3, '0');
    return prefix + '-' + ts;
  }

  function pad(n) { return n.toString().padStart(2, '0'); }

  function formatDate(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function initDB() {
    var inited = localStorage.getItem('appdb_inited');
    if (inited === 'true') return Promise.resolve();
    return openDB().then(function () {
      var proms = INITIAL_PRODUCTS.map(function (p) { return add('products', p); });
      proms = proms.concat(INITIAL_CUSTOMERS.map(function (c) { return add('customers', c); }));
      return Promise.all(proms);
    }).then(function () {
      var s = JSON.parse(JSON.stringify(INITIAL_SETTINGS));
      localStorage.setItem('shop_settings', JSON.stringify(s));
      localStorage.setItem('appdb_inited', 'true');
    });
  }

  return {
    init: function () { return initDB(); },
    openDB: openDB,

    getProducts: function () { return getAll('products'); },
    getProduct: function (id) { return getById('products', id); },
    saveProduct: function (product) {
      if (product.id) return put('products', product);
      return add('products', product);
    },
    deleteProduct: function (id) { return remove('products', id); },
    searchProducts: function (query) {
      return getAll('products').then(function (products) {
        if (!query) return products;
        var q = query.toLowerCase();
        return products.filter(function (p) {
          return p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            (p.brand && p.brand.toLowerCase().includes(q));
        });
      });
    },
    searchProductsMin: function (query) {
      return this.searchProducts(query).then(function (products) {
        return products.map(function (p) {
          return { id: p.id, name: p.name, sku: p.sku, price: p.price, stock_qty: p.stock_qty, brand: p.brand };
        });
      });
    },

    getCustomers: function () { return getAll('customers'); },
    getCustomer: function (id) { return getById('customers', id); },
    saveCustomer: function (customer) {
      if (customer.id) return put('customers', customer);
      return add('customers', customer);
    },
    searchCustomers: function (query) {
      return getAll('customers').then(function (customers) {
        if (!query) return customers;
        var q = query.toLowerCase();
        return customers.filter(function (c) {
          return c.name.toLowerCase().includes(q) ||
            (c.phone && c.phone.includes(q)) ||
            (c.vehicle_no && c.vehicle_no.toLowerCase().includes(q));
        });
      });
    },

    createInvoice: function (invoiceData) {
      var self = this;
      return openDB().then(function (db) {
        return new Promise(function (resolve, reject) {
          var tx = db.transaction(['invoices', 'products', 'customers'], 'readwrite');
          var invStore = tx.objectStore('invoices');
          var prodStore = tx.objectStore('products');
          var custStore = tx.objectStore('customers');

          var invoice_no = generateId('INV');
          var subtotal = 0;
          var items = invoiceData.items || [];
          var processedItems = [];

          items.forEach(function (item) {
            var prodReq = prodStore.get(Number(item.product_id));
            prodReq.onsuccess = function () {
              var product = prodReq.result;
              if (!product) { reject(new Error('Product not found: ' + item.product_id)); return; }
              var qty = item.quantity || 1;
              var unitPrice = item.unit_price || product.price;
              var lineSubtotal = qty * unitPrice;
              subtotal += lineSubtotal;

              product.stock_qty -= qty;
              prodStore.put(product);

              processedItems.push({
                product_id: product.id,
                product_name: product.name,
                product_sku: product.sku,
                quantity: qty,
                unit_price: unitPrice,
                subtotal: lineSubtotal
              });
            };
          });

          tx.oncomplete = function () {
            var discount = invoiceData.discount || 0;
            var tax = invoiceData.tax || 0;
            var total_amount = subtotal - discount + tax;

            var invRecord = {
              invoice_no: invoice_no,
              customer_id: invoiceData.customer_id || null,
              customer_name: invoiceData.customer_name || 'Walk-in Customer',
              subtotal: subtotal,
              discount: discount,
              tax: tax,
              total_amount: total_amount,
              status: invoiceData.status || 'paid',
              items: JSON.stringify(processedItems),
              created_at: new Date().toISOString()
            };

            var invReq = invStore.add(invRecord);
            invReq.onsuccess = function () {
              var newId = invReq.result;

              if (invoiceData.customer_id) {
                var custReq = custStore.get(Number(invoiceData.customer_id));
                custReq.onsuccess = function () {
                  var cust = custReq.result;
                  if (cust) {
                    cust.total_visits = (cust.total_visits || 0) + 1;
                    cust.total_spent = (cust.total_spent || 0) + total_amount;
                    custStore.put(cust);
                  }
                };
              }

              resolve({ id: newId, invoice_no: invoice_no, total_amount: total_amount });
            };
            invReq.onerror = function () { reject(invReq.error); };
          };

          tx.onerror = function () { reject(tx.error); };
        });
      });
    },

    getInvoices: function () {
      return getAll('invoices').then(function (invoices) {
        return invoices.sort(function (a, b) {
          return new Date(b.created_at) - new Date(a.created_at);
        });
      });
    },

    getInvoiceDetail: function (id) {
      return getById('invoices', id).then(function (inv) {
        if (!inv) return null;
        inv.items = inv.items ? JSON.parse(inv.items) : [];
        return inv;
      });
    },

    getRecentInvoices: function (limit) {
      limit = limit || 5;
      return this.getInvoices().then(function (invoices) {
        return invoices.slice(0, limit);
      });
    },

    getReportsData: function (period) {
      period = period || 'weekly';
      var self = this;
      return self.getInvoices().then(function (invoices) {
        var now = new Date();
        var startDate;
        var labelFmt;
        var truncFn;

        switch (period) {
          case 'daily':
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 6);
            labelFmt = function (d) { var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; return days[d.getDay()]; };
            break;
          case 'monthly':
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 30);
            labelFmt = function (d) { return pad(d.getDate()) + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]; };
            break;
          case 'yearly':
            startDate = new Date(now);
            startDate.setFullYear(startDate.getFullYear() - 1);
            labelFmt = function (d) { return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]; };
            break;
          default:
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
            labelFmt = function (d) { var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; return days[d.getDay()]; };
        }

        var filtered = invoices.filter(function (inv) {
          var d = new Date(inv.created_at);
          return d >= startDate && inv.status === 'paid';
        });

        var total_revenue = 0;
        var items_sold = 0;

        var salesMap = {};
        filtered.forEach(function (inv) {
          var d = new Date(inv.created_at);
          var key = labelFmt(d);
          salesMap[key] = (salesMap[key] || 0) + inv.total_amount;
          total_revenue += inv.total_amount;
          var invItems = inv.items ? JSON.parse(inv.items) : [];
          invItems.forEach(function (it) { items_sold += it.quantity; });
        });

        var sales_history = Object.keys(salesMap).map(function (key) {
          return { label: key, amount: salesMap[key] };
        }).sort(function (a, b) {
          return a.label.localeCompare(b.label);
        });

        var avg_per_order = filtered.length > 0 ? Math.round(items_sold / filtered.length) : 0;

        var productQtyMap = {};
        filtered.forEach(function (inv) {
          var invItems = inv.items ? JSON.parse(inv.items) : [];
          invItems.forEach(function (it) {
            productQtyMap[it.product_name] = (productQtyMap[it.product_name] || 0) + it.quantity;
          });
        });

        var top_products = Object.keys(productQtyMap).map(function (name) {
          return { name: name, qty: productQtyMap[name] };
        }).sort(function (a, b) { return b.qty - a.qty; }).slice(0, 5);

        var prevStart = new Date(startDate);
        if (period === 'yearly') {
          prevStart.setFullYear(prevStart.getFullYear() - 1);
        } else {
          var diff = now.getTime() - startDate.getTime();
          prevStart.setTime(startDate.getTime() - diff);
        }

        var prevRevenue = 0;
        invoices.forEach(function (inv) {
          var d = new Date(inv.created_at);
          if (d >= prevStart && d < startDate && inv.status === 'paid') {
            prevRevenue += inv.total_amount;
          }
        });

        var change_pct = 0;
        if (prevRevenue > 0) {
          change_pct = Math.round(((total_revenue - prevRevenue) / prevRevenue) * 100 * 10) / 10;
        }

        return {
          total_revenue: total_revenue,
          items_sold: items_sold,
          avg_per_order: avg_per_order,
          change_pct: change_pct,
          sales_history: sales_history,
          top_products: top_products
        };
      });
    },

    getShopSettings: function () {
      try {
        var s = localStorage.getItem('shop_settings');
        return s ? JSON.parse(s) : JSON.parse(JSON.stringify(INITIAL_SETTINGS));
      } catch (e) {
        return JSON.parse(JSON.stringify(INITIAL_SETTINGS));
      }
    },

    saveShopSettings: function (settings) {
      var current = this.getShopSettings();
      Object.keys(settings).forEach(function (k) { current[k] = settings[k]; });
      localStorage.setItem('shop_settings', JSON.stringify(current));
      return Promise.resolve(current);
    },

    updateShopSetting: function (field, value) {
      var current = this.getShopSettings();
      current[field] = value;
      localStorage.setItem('shop_settings', JSON.stringify(current));
      return Promise.resolve(current);
    },

    getStockAdjustments: function () {
      return getAll('stockAdjustments').then(function (items) {
        return items.sort(function (a, b) {
          return new Date(b.created_at) - new Date(a.created_at);
        });
      });
    },

    createStockAdjustment: function (data) {
      var self = this;
      return openDB().then(function (db) {
        return new Promise(function (resolve, reject) {
          var tx = db.transaction(['stockAdjustments', 'products'], 'readwrite');
          var adjStore = tx.objectStore('stockAdjustments');
          var prodStore = tx.objectStore('products');

          var prodReq = prodStore.get(Number(data.product_id));
          prodReq.onsuccess = function () {
            var product = prodReq.result;
            if (!product) { reject(new Error('Product not found')); return; }

            product.stock_qty += data.quantity_change;
            prodStore.put(product);

            var adjRecord = {
              product_id: product.id,
              product_name: product.name,
              quantity_change: data.quantity_change,
              reason: data.reason || 'other',
              notes: data.notes || '',
              created_at: new Date().toISOString()
            };

            var adjReq = adjStore.add(adjRecord);
            adjReq.onsuccess = function () {
              adjRecord.id = adjReq.result;
              resolve(adjRecord);
            };
            adjReq.onerror = function () { reject(adjReq.error); };
          };
          prodReq.onerror = function () { reject(prodReq.error); };

          tx.onerror = function () { reject(tx.error); };
        });
      });
    },

    exportBackupJSON: function () {
      var self = this;
      return Promise.all([
        self.getProducts(),
        self.getCustomers(),
        self.getInvoices(),
        self.getStockAdjustments()
      ]).then(function (results) {
        var backup = {
          version: 1,
          exported_at: new Date().toISOString(),
          products: results[0],
          customers: results[1],
          invoices: results[2],
          stockAdjustments: results[3],
          settings: self.getShopSettings()
        };
        return JSON.stringify(backup, null, 2);
      });
    },

    importBackupJSON: function (jsonStr) {
      var data;
      try { data = JSON.parse(jsonStr); } catch (e) { return Promise.reject(new Error('Invalid JSON')); }
      if (!data.version) return Promise.reject(new Error('Invalid backup format'));

      var self = this;
      return openDB().then(function (db) {
        return new Promise(function (resolve, reject) {
          var tx = db.transaction(['products', 'customers', 'invoices', 'stockAdjustments'], 'readwrite');

          var clearStore = function (name) {
            return new Promise(function (res, rej) {
              var s = tx.objectStore(name);
              var req = s.clear();
              req.onsuccess = res;
              req.onerror = rej;
            });
          };

          Promise.all([
            clearStore('products'),
            clearStore('customers'),
            clearStore('invoices'),
            clearStore('stockAdjustments')
          ]).then(function () {
            var pStore = tx.objectStore('products');
            (data.products || []).forEach(function (p) {
              var record = {};
              Object.keys(p).forEach(function (k) { if (k !== 'id') record[k] = p[k]; });
              pStore.add(record);
            });

            var cStore = tx.objectStore('customers');
            (data.customers || []).forEach(function (c) {
              var record = {};
              Object.keys(c).forEach(function (k) { if (k !== 'id') record[k] = c[k]; });
              cStore.add(record);
            });

            var iStore = tx.objectStore('invoices');
            (data.invoices || []).forEach(function (inv) {
              var record = {};
              Object.keys(inv).forEach(function (k) { if (k !== 'id') record[k] = inv[k]; });
              iStore.add(record);
            });

            var aStore = tx.objectStore('stockAdjustments');
            (data.stockAdjustments || []).forEach(function (a) {
              var record = {};
              Object.keys(a).forEach(function (k) { if (k !== 'id') record[k] = a[k]; });
              aStore.add(record);
            });
          });

          tx.oncomplete = function () {
            if (data.settings) {
              localStorage.setItem('shop_settings', JSON.stringify(data.settings));
            }
            resolve();
          };
          tx.onerror = function () { reject(tx.error); };
        });
      });
    },

    formatCurrency: function (amount) {
      return '\u20b9' + Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    },

    getInitials: function (name) {
      return name.split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2) || '?';
    },

    getAvatarBg: function (name) {
      var colors = ['bg-secondary-container', 'bg-primary-fixed', 'bg-secondary-fixed-dim', 'bg-primary-container', 'bg-tertiary-fixed'];
      var hash = 0;
      for (var i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      return colors[Math.abs(hash) % colors.length];
    },

    initBackButton: function () {
      if (typeof window.Capacitor !== 'undefined' && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.addListener('backButton', function (info) {
          if (info.canGoBack) {
            window.history.back();
          } else {
            window.Capacitor.Plugins.App.exitApp();
          }
        });
      }
    }
  };
})();

document.addEventListener('DOMContentLoaded', function () {
  if (typeof AppDB !== 'undefined' && AppDB.initBackButton) {
    AppDB.initBackButton();
  }
});
