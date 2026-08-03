var AppDB = (function () {
  var SUPABASE_URL = 'https://hnytahwhzxnezwmtfpdb.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_1OblpXHpDSB1hB2JuppKKQ_MtQWvhB2';

  var INITIAL_PRODUCTS = [
    { id: 1, name: 'Brake Pad Set - Front', sku: 'BP-9921', price: 1250, stock_qty: 14, low_stock_qty: 5, category: 'parts', brand: 'OEM', description: 'High-friction pads for heavy-duty SUVs.' },
    { id: 2, name: 'Oil Filter - Synthetic', sku: 'OF-4402', price: 450, stock_qty: 8, low_stock_qty: 5, category: 'fluids', brand: 'K&N', description: 'Premium synthetic media oil filter.' },
    { id: 3, name: 'Ceramic Brake Pads', sku: 'CBP-7812', price: 2450, stock_qty: 2, low_stock_qty: 5, category: 'parts', brand: 'Brembo', description: 'High-performance ceramic brake pads.' },
    { id: 4, name: 'Platinum Battery 12V', sku: 'BAT-750', price: 8500, stock_qty: 24, low_stock_qty: 3, category: 'parts', brand: 'Bosch', description: '750 CCA, Maintenance-free lead-acid.' },
    { id: 5, name: 'Iridium Spark Plug', sku: 'SPK-0022', price: 780, stock_qty: 148, low_stock_qty: 20, category: 'parts', brand: 'NGK', description: 'Long-lasting ignition for performance engines.' },
    { id: 6, name: 'Engine Oil 5W-40', sku: 'EO-5W40', price: 1850, stock_qty: 25, low_stock_qty: 5, category: 'fluids', brand: 'Castrol', description: 'Fully synthetic motor oil.' },
    { id: 7, name: 'Coolant Green 1L', sku: 'CL-001', price: 350, stock_qty: 30, low_stock_qty: 10, category: 'fluids', brand: 'Servo', description: 'Engine coolant fluid.' }
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

  function getItem(key, defaultVal) {
    try {
      var val = localStorage.getItem('appdb_' + key);
      if (val !== null) {
        var parsed = JSON.parse(val);
        if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(defaultVal) && defaultVal.length > 0) {
          return defaultVal;
        }
        return parsed;
      }
    } catch (e) {}
    return defaultVal;
  }

  function setItem(key, val) {
    try {
      localStorage.setItem('appdb_' + key, JSON.stringify(val));
    } catch (e) {}
  }

  function initDB() {
    try {
      localStorage.removeItem('supabase_url');
      localStorage.removeItem('supabase_anon_key');
      localStorage.removeItem('cloud_api_url');
    } catch (e) {}

    var prods = getItem('products', []);
    if (!localStorage.getItem('appdb_inited') || !Array.isArray(prods) || prods.length === 0) {
      setItem('products', INITIAL_PRODUCTS);
      setItem('customers', INITIAL_CUSTOMERS);
      setItem('invoices', []);
      setItem('stockAdjustments', []);
      setItem('shop_settings', INITIAL_SETTINGS);
      localStorage.setItem('appdb_inited', 'true');
    }
    return Promise.resolve();
  }

  function fetchSupabaseRest(endpoint, options) {
    options = options || {};
    var headers = Object.assign({
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }, options.headers || {});

    var fullUrl = SUPABASE_URL + '/rest/v1/' + endpoint;
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var signal = controller ? controller.signal : undefined;
    var timeoutId = controller ? setTimeout(function() { controller.abort(); }, 4000) : null;

    return fetch(fullUrl, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
      signal: signal
    }).then(function(res) {
      if (timeoutId) clearTimeout(timeoutId);
      if (!res.ok) {
        return res.text().then(function(t) { throw new Error('Supabase Error ' + res.status + ': ' + t); });
      }
      var contentType = res.headers.get('content-type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        return res.json();
      }
      return null;
    }).catch(function(err) {
      if (timeoutId) clearTimeout(timeoutId);
      throw err;
    });
  }

  return {
    init: function () { return initDB(); },

    getSupabaseCredentials: function () {
      return { url: SUPABASE_URL, key: SUPABASE_ANON_KEY };
    },

    testSupabaseConnection: function () {
      var testUrl = SUPABASE_URL + '/rest/v1/products?select=id&limit=1';
      return fetch(testUrl, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
        }
      }).then(function(res) {
        if (res.ok) return true;
        throw new Error('HTTP ' + res.status);
      });
    },

    getProducts: function () {
      initDB();
      var localItems = getItem('products', INITIAL_PRODUCTS);

      return fetchSupabaseRest('products?select=*&order=id.desc')
        .then(function (apiItems) {
          if (Array.isArray(apiItems) && apiItems.length > 0) {
            setItem('products', apiItems);
            return apiItems;
          }
          return localItems;
        })
        .catch(function (err) {
          console.warn('Supabase fetch fallback to local storage:', err);
          return localItems;
        });
    },

    getProduct: function (id) {
      return this.getProducts().then(function(items) {
        return items.find(function(p) { return Number(p.id) === Number(id); }) || null;
      });
    },

    saveProduct: function (product) {
      initDB();
      var isEdit = Boolean(product.id);
      var items = getItem('products', INITIAL_PRODUCTS);

      if (!product.created_at) product.created_at = new Date().toISOString();

      var savedId;
      if (isEdit) {
        savedId = Number(product.id);
        var idx = items.findIndex(function(p) { return Number(p.id) === savedId; });
        if (idx !== -1) items[idx] = Object.assign({}, items[idx], product);
        else items.unshift(product);
      } else {
        var maxId = items.reduce(function(max, p) { return Math.max(max, Number(p.id) || 0); }, 0);
        savedId = maxId + 1;
        product.id = savedId;
        items.unshift(product);
      }
      setItem('products', items);

      var payload = {
        id: savedId,
        name: product.name,
        sku: product.sku || ('SKU-' + Math.floor(Math.random() * 8999 + 1000)),
        category: product.category || 'general',
        price: parseFloat(product.price) || 0,
        stock_qty: parseInt(product.stock_qty) || 0,
        low_stock_qty: parseInt(product.low_stock_qty) || 5,
        brand: product.brand || '',
        description: product.description || '',
        image: (product.image && product.image.length < 500000) ? product.image : ''
      };

      var endpoint = isEdit ? ('products?id=eq.' + savedId) : 'products';
      var method = isEdit ? 'PATCH' : 'POST';

      return fetchSupabaseRest(endpoint, {
        method: method,
        body: payload
      }).then(function(res) {
        if (Array.isArray(res) && res.length > 0 && res[0].id) {
          var realId = Number(res[0].id);
          var currentItems = getItem('products', []);
          var pIdx = currentItems.findIndex(function(p) { return Number(p.id) === savedId; });
          if (pIdx !== -1) {
            currentItems[pIdx] = res[0];
            setItem('products', currentItems);
          }
          return realId;
        }
        return savedId;
      }).catch(function(err) {
        console.warn('Supabase save background error (saved locally):', err);
        return savedId;
      });
    },

    deleteProduct: function (id) {
      initDB();
      var items = getItem('products', INITIAL_PRODUCTS);
      items = items.filter(function(p) { return Number(p.id) !== Number(id); });
      setItem('products', items);

      return fetchSupabaseRest('products?id=eq.' + id, { method: 'DELETE' })
        .catch(function (e) {});
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
      initDB();
      var localItems = getItem('customers', INITIAL_CUSTOMERS);

      return fetchSupabaseRest('customers?select=*&order=id.desc')
        .then(function(items) {
          if (Array.isArray(items) && items.length > 0) {
            setItem('customers', items);
            return items;
          }
          return localItems;
        })
        .catch(function() {
          return localItems;
        });
    },

    getCustomer: function (id) {
      return this.getCustomers().then(function(items) {
        return items.find(function(c) { return Number(c.id) === Number(id); }) || null;
      });
    },

    saveCustomer: function (customer) {
      initDB();
      var isEdit = Boolean(customer.id);
      var items = getItem('customers', INITIAL_CUSTOMERS);

      var savedId;
      if (isEdit) {
        savedId = Number(customer.id);
        var idx = items.findIndex(function(c) { return Number(c.id) === savedId; });
        if (idx !== -1) items[idx] = Object.assign({}, items[idx], customer);
        else items.unshift(customer);
      } else {
        var maxId = items.reduce(function(max, c) { return Math.max(max, Number(c.id) || 0); }, 0);
        savedId = maxId + 1;
        customer.id = savedId;
        items.unshift(customer);
      }
      setItem('customers', items);

      var payload = Object.assign({}, customer, { id: savedId });
      var endpoint = isEdit ? ('customers?id=eq.' + savedId) : 'customers';
      var method = isEdit ? 'PATCH' : 'POST';

      return fetchSupabaseRest(endpoint, {
        method: method,
        body: payload
      }).then(function(res) {
        if (Array.isArray(res) && res.length > 0 && res[0].id) {
          return Number(res[0].id);
        }
        return savedId;
      }).catch(function() {
        return savedId;
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
      initDB();
      var invoice_no = 'INV-' + Date.now();
      var subtotal = 0;
      var items = invoiceData.items || [];
      var processedItems = [];
      var products = getItem('products', INITIAL_PRODUCTS);
      var invoices = getItem('invoices', []);

      items.forEach(function (item) {
        var prodIdx = products.findIndex(function(p) { return Number(p.id) === Number(item.product_id); });
        var qty = item.quantity || 1;
        var unitPrice = item.unit_price || (prodIdx !== -1 ? products[prodIdx].price : 0);
        subtotal += qty * unitPrice;

        if (prodIdx !== -1) {
          products[prodIdx].stock_qty = Math.max(0, products[prodIdx].stock_qty - qty);
        }

        processedItems.push({
          product_id: item.product_id,
          product_name: item.product_name || (prodIdx !== -1 ? products[prodIdx].name : 'Item'),
          quantity: qty,
          unit_price: unitPrice,
          total_price: qty * unitPrice
        });
      });

      setItem('products', products);

      var discount = invoiceData.discount || 0;
      var tax = invoiceData.tax || 0;
      var total_amount = subtotal - discount + tax;

      var invRecord = {
        id: invoices.length + 1,
        invoice_no: invoice_no,
        customer_name: invoiceData.customer_name || 'Walk-in Customer',
        customer_phone: invoiceData.customer_phone || '',
        vehicle_no: invoiceData.vehicle_no || '',
        payment_method: invoiceData.payment_method || 'Cash',
        subtotal: subtotal,
        discount: discount,
        tax: tax,
        total_amount: total_amount,
        status: invoiceData.status || 'paid',
        items: processedItems,
        created_at: new Date().toISOString()
      };

      invoices.unshift(invRecord);
      setItem('invoices', invoices);

      var invPayload = {
        id: invRecord.id,
        invoice_no: invoice_no,
        customer_name: invRecord.customer_name,
        customer_phone: invRecord.customer_phone,
        vehicle_no: invRecord.vehicle_no,
        payment_method: invRecord.payment_method,
        subtotal: subtotal,
        discount: discount,
        tax: tax,
        total_amount: total_amount,
        status: invRecord.status
      };

      fetchSupabaseRest('invoices', { method: 'POST', body: invPayload })
      .then(function(savedInvArr) {
        var savedInv = Array.isArray(savedInvArr) && savedInvArr.length > 0 ? savedInvArr[0] : null;
        if (savedInv) {
          processedItems.forEach(function(it) {
            it.invoice_id = savedInv.id;
            fetchSupabaseRest('invoice_items', { method: 'POST', body: it });
          });
        }
      }).catch(function() {});

      return Promise.resolve({ id: invRecord.id, invoice_no: invoice_no, total_amount: total_amount });
    },

    getInvoices: function () {
      initDB();
      var localInvoices = getItem('invoices', []);

      return fetchSupabaseRest('invoices?select=*&order=id.desc')
        .then(function(items) {
          if (Array.isArray(items)) {
            setItem('invoices', items);
            return items;
          }
          return localInvoices;
        })
        .catch(function() {
          return localInvoices;
        });
    },

    getInvoiceDetail: function (id) {
      return this.getInvoices().then(function (invoices) {
        var inv = invoices.find(function(i) { return Number(i.id) === Number(id); });
        if (!inv) return null;
        var copy = Object.assign({}, inv);
        copy.items = typeof copy.items === 'string' ? JSON.parse(copy.items) : copy.items;
        return copy;
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
          salesMap[key] = (salesMap[key] || 0) + (inv.total_amount || 0);
          total_revenue += (inv.total_amount || 0);
          var invItems = typeof inv.items === 'string' ? JSON.parse(inv.items) : (inv.items || []);
          if (Array.isArray(invItems)) {
            invItems.forEach(function (it) { items_sold += (it.quantity || 1); });
          }
        });

        var sales_history = Object.keys(salesMap).map(function (key) {
          return { label: key, amount: salesMap[key] };
        });

        var avg_per_order = filtered.length > 0 ? Math.round(items_sold / filtered.length) : 0;

        var productQtyMap = {};
        filtered.forEach(function (inv) {
          var invItems = typeof inv.items === 'string' ? JSON.parse(inv.items) : (inv.items || []);
          if (Array.isArray(invItems)) {
            invItems.forEach(function (it) {
              var pName = it.product_name || 'Unknown';
              productQtyMap[pName] = (productQtyMap[pName] || 0) + (it.quantity || 1);
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
    },

    getShopSettings: function () {
      initDB();
      return getItem('shop_settings', INITIAL_SETTINGS);
    },

    saveShopSettings: function (settings) {
      initDB();
      var current = getItem('shop_settings', INITIAL_SETTINGS);
      Object.keys(settings).forEach(function (k) { current[k] = settings[k]; });
      setItem('shop_settings', current);

      fetchSupabaseRest('shop_settings?id=eq.1', {
        method: 'PATCH',
        body: current
      }).catch(function() {});

      return Promise.resolve(current);
    },

    updateShopSetting: function (field, value) {
      var obj = {};
      obj[field] = value;
      return this.saveShopSettings(obj);
    },

    addStockAdjustment: function (data) {
      initDB();
      var qtyChange = parseInt(data.quantity_change || data.qty) || 0;
      var reason = data.reason || data.type || 'audit';
      var products = getItem('products', INITIAL_PRODUCTS);
      var adjustments = getItem('stockAdjustments', []);

      var prodIdx = products.findIndex(function(p) { return Number(p.id) === Number(data.product_id); });
      if (prodIdx !== -1) {
        products[prodIdx].stock_qty = Math.max(0, products[prodIdx].stock_qty + qtyChange);
        setItem('products', products);
      }

      var record = {
        id: adjustments.length + 1,
        product_id: data.product_id,
        quantity_change: qtyChange,
        reason: reason,
        notes: data.notes || '',
        created_at: new Date().toISOString()
      };
      adjustments.unshift(record);
      setItem('stockAdjustments', adjustments);

      var payload = {
        id: record.id,
        product_id: data.product_id,
        product_name: data.product_name || '',
        quantity_change: qtyChange,
        reason: reason,
        notes: data.notes || ''
      };

      fetchSupabaseRest('stock_adjustments', { method: 'POST', body: payload })
        .catch(function() {});

      return Promise.resolve(record);
    },

    createStockAdjustment: function (data) {
      return this.addStockAdjustment(data);
    },

    getStockAdjustments: function () {
      initDB();
      var localData = getItem('stockAdjustments', []);

      return fetchSupabaseRest('stock_adjustments?select=*&order=id.desc')
        .then(function (data) {
          if (Array.isArray(data)) {
            setItem('stockAdjustments', data);
            return data;
          }
          return localData;
        })
        .catch(function () {
          return localData;
        });
    },

    formatCurrency: function (num) {
      var n = Number(num) || 0;
      return '₹' + n.toFixed(2);
    },

    getApiBaseUrl: function () {
      return SUPABASE_URL;
    }
  };
})();

/* Global Mouse Wheel Scroll Engine */
if (typeof window !== 'undefined') {
  window.addEventListener('wheel', function (e) {
    if (e.defaultPrevented) return;
    window.scrollBy(0, e.deltaY);
  }, { passive: true });
}
