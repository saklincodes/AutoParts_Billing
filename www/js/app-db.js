var AppDB = (function () {
  var INITIAL_PRODUCTS = [
    { id: 1, name: 'Brake Pad Set - Front', sku: 'BP-9921', price: 1250, stock_qty: 14, low_stock_qty: 5, category: 'parts', brand: 'OEM', description: 'High-friction pads for heavy-duty SUVs.' },
    { id: 2, name: 'Oil Filter - Synthetic', sku: 'OF-4402', price: 450, stock_qty: 8, low_stock_qty: 5, category: 'fluids', brand: 'K&N', description: 'Premium synthetic media oil filter.' },
    { id: 3, name: 'Ceramic Brake Pads', sku: 'CBP-7812', price: 2450, stock_qty: 2, low_stock_qty: 5, category: 'parts', brand: 'Brembo', description: 'High-performance ceramic brake pads.' },
    { id: 4, name: 'Platinum Battery 12V', sku: 'BAT-750', price: 8500, stock_qty: 24, low_stock_qty: 3, category: 'parts', brand: 'Bosch', description: '750 CCA, Maintenance-free lead-acid.' },
    { id: 5, name: 'Iridium Spark Plug', sku: 'SPK-0022', price: 780, stock_qty: 148, low_stock_qty: 20, category: 'parts', brand: 'NGK', description: 'Long-lasting ignition for performance engines.' },
    { id: 6, name: 'K&N High-Flow Oil Filter', sku: 'KN-204', price: 1150, stock_qty: 12, low_stock_qty: 5, category: 'fluids', brand: 'K&N', description: 'High-flow oil filter with premium filtration.' },
    { id: 7, name: 'Full Synthetic 5W-30 (1qt)', sku: 'SY-530', price: 560, stock_qty: 48, low_stock_qty: 10, category: 'fluids', brand: 'Castrol', description: 'Fully synthetic motor oil.' },
    { id: 8, name: 'LED Headlamp Bulb', sku: 'LED-HB1', price: 1200, stock_qty: 30, low_stock_qty: 5, category: 'parts', brand: 'Philips', description: 'Ultra-bright LED headlamp bulb.' },
    { id: 9, name: 'Wiper Blade Set', sku: 'WPR-24', price: 450, stock_qty: 18, low_stock_qty: 5, category: 'parts', brand: 'Bosch', description: 'All-weather silicone wiper blades.' },
    { id: 10, name: 'Premium Air Filter', sku: 'AF-8801', price: 850, stock_qty: 22, low_stock_qty: 5, category: 'parts', brand: 'K&N', description: 'High-performance reusable air filter.' }
  ];

  var INITIAL_CUSTOMERS = [
    { id: 1, name: 'John Cooper', phone: '9876543210', vehicle_no: 'WB-01-AB-1234', total_visits: 5, total_spent: 12500, is_premium: true },
    { id: 2, name: 'City Motors', phone: '8765432109', vehicle_no: 'WB-02-CD-5678', total_visits: 12, total_spent: 45000, is_premium: true },
    { id: 3, name: 'Sarah Miller', phone: '7654321098', vehicle_no: 'WB-03-EF-9012', total_visits: 3, total_spent: 3200, is_premium: false }
  ];

  var INITIAL_SETTINGS = {
    shop_name: 'Putul Auto Parts and Autoscan',
    address: '123 Mechanics Row, Kolkata',
    phone: '+91 98765 43210',
    email: 'contact@putulauto.com',
    printer_ip: '192.168.1.145',
    printer_type: 'thermal'
  };

  function getApiBase() {
    if (window.API_BASE) return window.API_BASE;
    if (window.location.protocol.startsWith('http')) {
      return '/api';
    }
    return 'http://192.168.1.103:8000/api';
  }

  function getItem(key, defaultVal) {
    try {
      var val = localStorage.getItem('appdb_' + key);
      if (val !== null) return JSON.parse(val);
    } catch (e) {}
    return defaultVal;
  }

  function setItem(key, val) {
    try {
      localStorage.setItem('appdb_' + key, JSON.stringify(val));
    } catch (e) {}
  }

  function initDB() {
    if (!localStorage.getItem('appdb_inited')) {
      setItem('products', INITIAL_PRODUCTS);
      setItem('customers', INITIAL_CUSTOMERS);
      setItem('invoices', []);
      setItem('stockAdjustments', []);
      setItem('shop_settings', INITIAL_SETTINGS);
      localStorage.setItem('appdb_inited', 'true');
    }
    return Promise.resolve();
  }

  return {
    init: function () { return initDB(); },

    getProducts: function () {
      return fetch(getApiBase() + '/products/', { mode: 'cors' })
        .then(function (res) {
          if (!res.ok) throw new Error('API error ' + res.status);
          return res.json();
        })
        .then(function (data) {
          var items = Array.isArray(data) ? data : (data.results || []);
          setItem('products', items);
          return items;
        })
        .catch(function (err) {
          console.warn('Network fetch failed, falling back to local storage', err);
          initDB();
          var items = getItem('products', INITIAL_PRODUCTS);
          items.sort(function(a, b) { return (b.id || 0) - (a.id || 0); });
          return items;
        });
    },

    getProduct: function (id) {
      return fetch(getApiBase() + '/products/' + id + '/')
        .then(function (res) {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .catch(function () {
          return AppDB.getProducts().then(function(items) {
            return items.find(function(p) { return Number(p.id) === Number(id); }) || null;
          });
        });
    },

    saveProduct: function (product) {
      var isEdit = Boolean(product.id);
      var url = isEdit ? (getApiBase() + '/products/' + product.id + '/') : (getApiBase() + '/products/');
      var method = isEdit ? 'PUT' : 'POST';

      var payload = {
        name: product.name,
        sku: product.sku || ('SKU-' + Math.floor(Math.random() * 8999 + 1000)),
        category: product.category || 'general',
        price: parseFloat(product.price) || 0,
        stock_qty: parseInt(product.stock_qty) || 0,
        low_stock_qty: parseInt(product.low_stock_qty) || 5,
        brand: product.brand || '',
        description: product.description || '',
        image: product.image || ''
      };

      return fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function (res) {
        if (!res.ok) return res.json().then(function(err) { throw new Error(JSON.stringify(err)); });
        return res.json();
      })
      .then(function (savedItem) {
        initDB();
        var items = getItem('products', INITIAL_PRODUCTS);
        if (isEdit) {
          var idx = items.findIndex(function(p) { return Number(p.id) === Number(savedItem.id); });
          if (idx !== -1) items[idx] = savedItem;
          else items.unshift(savedItem);
        } else {
          items.unshift(savedItem);
        }
        setItem('products', items);
        return savedItem.id;
      })
      .catch(function (err) {
        console.warn('API save failed, using local storage fallback', err);
        initDB();
        var items = getItem('products', INITIAL_PRODUCTS);
        if (!product.created_at) product.created_at = new Date().toISOString();

        if (product.id) {
          var idx = items.findIndex(function(p) { return Number(p.id) === Number(product.id); });
          if (idx !== -1) items[idx] = Object.assign({}, items[idx], product);
          else items.push(product);
        } else {
          var maxId = items.reduce(function(max, p) { return Math.max(max, Number(p.id) || 0); }, 0);
          product.id = maxId + 1;
          items.unshift(product);
        }
        setItem('products', items);
        return product.id;
      });
    },

    deleteProduct: function (id) {
      return fetch(getApiBase() + '/products/' + id + '/', { method: 'DELETE' })
        .catch(function (e) {})
        .then(function () {
          initDB();
          var items = getItem('products', []);
          items = items.filter(function(p) { return Number(p.id) !== Number(id); });
          setItem('products', items);
        });
    },

    searchProducts: function (query) {
      return this.getProducts().then(function (products) {
        if (!query) return products;
        var q = query.toLowerCase();
        return products.filter(function (p) {
          return (p.name && p.name.toLowerCase().includes(q)) ||
            (p.sku && p.sku.toLowerCase().includes(q)) ||
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

    getCustomers: function () {
      return fetch(getApiBase() + '/customers/')
        .then(function(res) { if (!res.ok) throw new Error(); return res.json(); })
        .then(function(data) {
          var items = Array.isArray(data) ? data : (data.results || []);
          setItem('customers', items);
          return items;
        })
        .catch(function() {
          initDB();
          return getItem('customers', INITIAL_CUSTOMERS);
        });
    },

    getCustomer: function (id) {
      return this.getCustomers().then(function(items) {
        return items.find(function(c) { return Number(c.id) === Number(id); }) || null;
      });
    },

    saveCustomer: function (customer) {
      var isEdit = Boolean(customer.id);
      var url = isEdit ? (getApiBase() + '/customers/' + customer.id + '/') : (getApiBase() + '/customers/');
      var method = isEdit ? 'PUT' : 'POST';

      return fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer)
      })
      .then(function(res) { if (!res.ok) throw new Error(); return res.json(); })
      .then(function(saved) {
        initDB();
        var items = getItem('customers', INITIAL_CUSTOMERS);
        if (isEdit) {
          var idx = items.findIndex(function(c) { return Number(c.id) === Number(saved.id); });
          if (idx !== -1) items[idx] = saved;
          else items.unshift(saved);
        } else {
          items.unshift(saved);
        }
        setItem('customers', items);
        return saved.id;
      })
      .catch(function() {
        initDB();
        var items = getItem('customers', INITIAL_CUSTOMERS);
        if (customer.id) {
          var idx = items.findIndex(function(c) { return Number(c.id) === Number(customer.id); });
          if (idx !== -1) items[idx] = Object.assign({}, items[idx], customer);
          else items.push(customer);
        } else {
          var maxId = items.reduce(function(max, c) { return Math.max(max, Number(c.id) || 0); }, 0);
          customer.id = maxId + 1;
          items.push(customer);
        }
        setItem('customers', items);
        return customer.id;
      });
    },

    searchCustomers: function (query) {
      return this.getCustomers().then(function (customers) {
        if (!query) return customers;
        var q = query.toLowerCase();
        return customers.filter(function (c) {
          return (c.name && c.name.toLowerCase().includes(q)) ||
            (c.phone && c.phone.includes(q)) ||
            (c.vehicle_no && c.vehicle_no.toLowerCase().includes(q));
        });
      });
    },

    createInvoice: function (invoiceData) {
      return fetch(getApiBase() + '/invoices/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      })
      .then(function(res) { if (!res.ok) throw new Error(); return res.json(); })
      .then(function(saved) {
        return { id: saved.id, invoice_no: saved.invoice_no, total_amount: saved.total_amount };
      })
      .catch(function() {
        initDB();
        var products = getItem('products', []);
        var customers = getItem('customers', []);
        var invoices = getItem('invoices', []);

        var invoice_no = 'INV-' + Date.now();
        var subtotal = 0;
        var items = invoiceData.items || [];
        var processedItems = [];

        items.forEach(function (item) {
          var prodIdx = products.findIndex(function(p) { return Number(p.id) === Number(item.product_id); });
          if (prodIdx !== -1) {
            var product = products[prodIdx];
            var qty = item.quantity || 1;
            var unitPrice = item.unit_price || product.price;
            var lineSubtotal = qty * unitPrice;
            subtotal += lineSubtotal;

            product.stock_qty -= qty;
            products[prodIdx] = product;

            processedItems.push({
              product_id: product.id,
              product_name: product.name,
              product_sku: product.sku,
              quantity: qty,
              unit_price: unitPrice,
              subtotal: lineSubtotal
            });
          }
        });

        setItem('products', products);

        var discount = invoiceData.discount || 0;
        var tax = invoiceData.tax || 0;
        var total_amount = subtotal - discount + tax;

        var invRecord = {
          id: invoices.length + 1,
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

        invoices.push(invRecord);
        setItem('invoices', invoices);

        return { id: invRecord.id, invoice_no: invoice_no, total_amount: total_amount };
      });
    },

    getInvoices: function () {
      return fetch(getApiBase() + '/invoices/')
        .then(function(res) { if (!res.ok) throw new Error(); return res.json(); })
        .then(function(data) {
          var items = Array.isArray(data) ? data : (data.results || []);
          setItem('invoices', items);
          return items;
        })
        .catch(function() {
          initDB();
          var invoices = getItem('invoices', []);
          invoices.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
          return invoices;
        });
    },

    getInvoiceDetail: function (id) {
      return fetch(getApiBase() + '/invoice-detail/' + id + '/')
        .then(function(res) { if (!res.ok) throw new Error(); return res.json(); })
        .catch(function() {
          return AppDB.getInvoices().then(function (invoices) {
            var inv = invoices.find(function(i) { return Number(i.id) === Number(id); });
            if (!inv) return null;
            var copy = Object.assign({}, inv);
            copy.items = typeof copy.items === 'string' ? JSON.parse(copy.items) : copy.items;
            return copy;
          });
        });
    },

    getRecentInvoices: function (limit) {
      limit = limit || 5;
      return fetch(getApiBase() + '/dashboard/recent-invoices/')
        .then(function(res) { if (!res.ok) throw new Error(); return res.json(); })
        .catch(function() {
          return AppDB.getInvoices().then(function (invoices) {
            return invoices.slice(0, limit);
          });
        });
    },

    getReportsData: function (period) {
      period = period || 'weekly';
      return fetch(getApiBase() + '/reports/data/?period=' + period)
        .then(function(res) { if (!res.ok) throw new Error(); return res.json(); })
        .catch(function() {
          return AppDB.getInvoices().then(function (invoices) {
            var now = new Date();
            var startDate;
            var labelFmt = function (d) { var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; return days[d.getDay()]; };

            switch (period) {
              case 'daily':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 6);
                break;
              case 'monthly':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 30);
                labelFmt = function (d) { return d.getDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]; };
                break;
              case 'yearly':
                startDate = new Date(now);
                startDate.setFullYear(startDate.getFullYear() - 1);
                labelFmt = function (d) { return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]; };
                break;
              default:
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
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
              var invItems = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items;
              if (Array.isArray(invItems)) {
                invItems.forEach(function (it) { items_sold += it.quantity; });
              }
            });

            var sales_history = Object.keys(salesMap).map(function (key) {
              return { label: key, amount: salesMap[key] };
            });

            var avg_per_order = filtered.length > 0 ? Math.round(items_sold / filtered.length) : 0;

            var productQtyMap = {};
            filtered.forEach(function (inv) {
              var invItems = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items;
              if (Array.isArray(invItems)) {
                invItems.forEach(function (it) {
                  productQtyMap[it.product_name] = (productQtyMap[it.product_name] || 0) + it.quantity;
                });
              }
            });

            var top_products = Object.keys(productQtyMap).map(function (name) {
              return { name: name, qty: productQtyMap[name] };
            }).sort(function (a, b) { return b.qty - a.qty; }).slice(0, 5);

            return {
              total_revenue: total_revenue,
              items_sold: items_sold,
              avg_per_order: avg_per_order,
              change_pct: 0,
              sales_history: sales_history,
              top_products: top_products
            };
          });
        });
    },

    getShopSettings: function () {
      return fetch(getApiBase() + '/settings/')
        .then(function(res) { if (!res.ok) throw new Error(); return res.json(); })
        .then(function(data) {
          setItem('shop_settings', data);
          return data;
        })
        .catch(function() {
          initDB();
          return getItem('shop_settings', INITIAL_SETTINGS);
        });
    },

    saveShopSettings: function (settings) {
      return fetch(getApiBase() + '/settings/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      .then(function(res) { if (!res.ok) throw new Error(); return res.json(); })
      .then(function(data) {
        var current = getItem('shop_settings', INITIAL_SETTINGS);
        Object.keys(settings).forEach(function (k) { current[k] = settings[k]; });
        setItem('shop_settings', current);
        return current;
      })
      .catch(function() {
        initDB();
        var current = getItem('shop_settings', INITIAL_SETTINGS);
        Object.keys(settings).forEach(function (k) { current[k] = settings[k]; });
        setItem('shop_settings', current);
        return current;
      });
    },

    updateShopSetting: function (field, value) {
      var obj = {};
      obj[field] = value;
      return this.saveShopSettings(obj);
    },

    addStockAdjustment: function (data) {
      return fetch(getApiBase() + '/stock-adjustments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(function(res) { if (!res.ok) throw new Error(); return res.json(); })
      .catch(function() {
        initDB();
        var products = getItem('products', []);
        var adjustments = getItem('stockAdjustments', []);

        var prodIdx = products.findIndex(function(p) { return Number(p.id) === Number(data.product_id); });
        if (prodIdx !== -1) {
          var qty = Number(data.qty) || 0;
          if (data.type === 'add' || data.type === 'restock') {
            products[prodIdx].stock_qty += qty;
          } else if (data.type === 'remove' || data.type === 'damage') {
            products[prodIdx].stock_qty = Math.max(0, products[prodIdx].stock_qty - qty);
          } else if (data.type === 'audit') {
            products[prodIdx].stock_qty = qty;
          }
          setItem('products', products);
        }

        var record = {
          id: adjustments.length + 1,
          product_id: data.product_id,
          type: data.type,
          qty: data.qty,
          reason: data.reason || '',
          created_at: new Date().toISOString()
        };
        adjustments.push(record);
        setItem('stockAdjustments', adjustments);
        return record;
      });
    }
  };
})();
