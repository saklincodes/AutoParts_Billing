var AppDB = (function () {
  var SUPABASE_URL = 'https://hnytahwhzxnezwmtfpdb.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_1OblpXHpDSB1hB2JuppKKQ_MtQWvhB2';

  var INITIAL_PRODUCTS = [
    { id: 1, name: 'Brake Pad Set - Front', sku: 'BP-9921', price: 1250, stock_qty: 14, low_stock_qty: 5, category: 'parts', brand: 'OEM', description: 'High-friction pads for heavy-duty SUVs.' },
    { id: 2, name: 'Oil Filter - Synthetic', sku: 'OF-4402', price: 450, stock_qty: 8, low_stock_qty: 5, category: 'fluids', brand: 'K&N', description: 'Premium synthetic media oil filter.' },
    { id: 3, name: 'Ceramic Brake Pads', sku: 'CBP-7812', price: 2450, stock_qty: 2, low_stock_qty: 5, category: 'parts', brand: 'Brembo', description: 'High-performance ceramic brake pads.' },
    { id: 4, name: 'Platinum Battery 12V', sku: 'BAT-750', price: 8500, stock_qty: 24, low_stock_qty: 3, category: 'parts', brand: 'Bosch', description: '750 CCA, Maintenance-free lead-acid.' },
    { id: 5, name: 'Iridium Spark Plug', sku: 'SPK-0022', price: 780, stock_qty: 148, low_stock_qty: 20, category: 'parts', brand: 'NGK', description: 'Long-lasting ignition for performance engines.' }
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
    try {
      localStorage.removeItem('supabase_url');
      localStorage.removeItem('supabase_anon_key');
      localStorage.removeItem('cloud_api_url');
    } catch (e) {}

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

  function fetchSupabaseRest(endpoint, options) {
    options = options || {};
    var headers = Object.assign({
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }, options.headers || {});

    var fullUrl = SUPABASE_URL + '/rest/v1/' + endpoint;
    return fetch(fullUrl, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
    }).then(function(res) {
      if (!res.ok) {
        return res.text().then(function(t) { throw new Error('Supabase Error ' + res.status + ': ' + t); });
      }
      var contentType = res.headers.get('content-type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        return res.json();
      }
      return null;
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
      return fetchSupabaseRest('products?select=*&order=id.desc')
        .then(function (apiItems) {
          if (Array.isArray(apiItems) && apiItems.length > 0) {
            initDB();
            setItem('products', apiItems);
            return apiItems;
          }
          throw new Error('Empty or invalid Supabase response');
        })
        .catch(function (err) {
          console.warn('Supabase fetch fallback to local storage:', err);
          initDB();
          var items = getItem('products', INITIAL_PRODUCTS);
          items.sort(function(a, b) { return (Number(b.id) || 0) - (Number(a.id) || 0); });
          return items;
        });
    },

    getProduct: function (id) {
      return fetchSupabaseRest('products?id=eq.' + id + '&select=*')
        .then(function (res) {
          if (Array.isArray(res) && res.length > 0) return res[0];
          throw new Error();
        })
        .catch(function () {
          return AppDB.getProducts().then(function(items) {
            return items.find(function(p) { return Number(p.id) === Number(id); }) || null;
          });
        });
    },

    saveProduct: function (product) {
      var isEdit = Boolean(product.id);
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
      if (isEdit) payload.id = product.id;

      var endpoint = isEdit ? ('products?id=eq.' + product.id) : 'products';
      var method = isEdit ? 'PATCH' : 'POST';

      return fetchSupabaseRest(endpoint, {
        method: method,
        body: payload
      })
      .then(function (res) {
        var savedItem = Array.isArray(res) && res.length > 0 ? res[0] : (res || payload);
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
      return fetchSupabaseRest('products?id=eq.' + id, { method: 'DELETE' })
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
      return fetchSupabaseRest('customers?select=*&order=id.desc')
        .then(function(items) {
          if (Array.isArray(items)) {
            setItem('customers', items);
            return items;
          }
          throw new Error();
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
      var endpoint = isEdit ? ('customers?id=eq.' + customer.id) : 'customers';
      var method = isEdit ? 'PATCH' : 'POST';

      return fetchSupabaseRest(endpoint, {
        method: method,
        body: customer
      })
      .then(function(res) {
        var saved = Array.isArray(res) && res.length > 0 ? res[0] : (res || customer);
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
      var invoice_no = 'INV-' + Date.now();
      var subtotal = 0;
      var items = invoiceData.items || [];
      var processedItems = [];

      items.forEach(function (item) {
        var qty = item.quantity || 1;
        var unitPrice = item.unit_price || 0;
        subtotal += qty * unitPrice;
        processedItems.push({
          product_id: item.product_id,
          product_name: item.product_name || 'Item',
          quantity: qty,
          unit_price: unitPrice,
          total_price: qty * unitPrice
        });
      });

      var discount = invoiceData.discount || 0;
      var tax = invoiceData.tax || 0;
      var total_amount = subtotal - discount + tax;

      var invPayload = {
        invoice_no: invoice_no,
        customer_name: invoiceData.customer_name || 'Walk-in Customer',
        customer_phone: invoiceData.customer_phone || '',
        vehicle_no: invoiceData.vehicle_no || '',
        payment_method: invoiceData.payment_method || 'Cash',
        subtotal: subtotal,
        discount: discount,
        tax: tax,
        total_amount: total_amount,
        status: invoiceData.status || 'paid'
      };

      return fetchSupabaseRest('invoices', { method: 'POST', body: invPayload })
      .then(function(savedInvArr) {
        var savedInv = Array.isArray(savedInvArr) && savedInvArr.length > 0 ? savedInvArr[0] : null;
        if (!savedInv) throw new Error('Failed to create invoice');

        var itemPromises = processedItems.map(function(it) {
          it.invoice_id = savedInv.id;
          return fetchSupabaseRest('invoice_items', { method: 'POST', body: it });
        });

        var stockPromises = processedItems.map(function(it) {
          if (it.product_id) {
            return AppDB.getProduct(it.product_id).then(function(p) {
              if (p) {
                var newQty = Math.max(0, (p.stock_qty || 0) - it.quantity);
                return fetchSupabaseRest('products?id=eq.' + p.id, {
                  method: 'PATCH',
                  body: { stock_qty: newQty }
                });
              }
            }).catch(function() {});
          }
        });

        return Promise.all(itemPromises.concat(stockPromises)).then(function() {
          return { id: savedInv.id, invoice_no: savedInv.invoice_no, total_amount: savedInv.total_amount };
        });
      })
      .catch(function() {
        initDB();
        var products = getItem('products', []);
        var invoices = getItem('invoices', []);

        processedItems = [];
        subtotal = 0;
        items.forEach(function (item) {
          var prodIdx = products.findIndex(function(p) { return Number(p.id) === Number(item.product_id); });
          if (prodIdx !== -1) {
            var product = products[prodIdx];
            var qty = item.quantity || 1;
            var unitPrice = item.unit_price || product.price;
            subtotal += qty * unitPrice;
            product.stock_qty = Math.max(0, product.stock_qty - qty);
            products[prodIdx] = product;

            processedItems.push({
              product_id: product.id,
              product_name: product.name,
              quantity: qty,
              unit_price: unitPrice,
              total_price: qty * unitPrice
            });
          }
        });
        setItem('products', products);

        total_amount = subtotal - discount + tax;
        var invRecord = {
          id: invoices.length + 1,
          invoice_no: invoice_no,
          customer_name: invoiceData.customer_name || 'Walk-in Customer',
          subtotal: subtotal,
          discount: discount,
          tax: tax,
          total_amount: total_amount,
          status: invoiceData.status || 'paid',
          items: processedItems,
          created_at: new Date().toISOString()
        };

        invoices.push(invRecord);
        setItem('invoices', invoices);
        return { id: invRecord.id, invoice_no: invoice_no, total_amount: total_amount };
      });
    },

    getInvoices: function () {
      return fetchSupabaseRest('invoices?select=*&order=id.desc')
        .then(function(items) {
          if (Array.isArray(items)) {
            setItem('invoices', items);
            return items;
          }
          throw new Error();
        })
        .catch(function() {
          initDB();
          var invoices = getItem('invoices', []);
          invoices.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
          return invoices;
        });
    },

    getInvoiceDetail: function (id) {
      return fetchSupabaseRest('invoices?id=eq.' + id + '&select=*,invoice_items(*)')
        .then(function(res) {
          if (Array.isArray(res) && res.length > 0) {
            var inv = res[0];
            inv.items = inv.invoice_items || [];
            return inv;
          }
          throw new Error();
        })
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
      return fetchSupabaseRest('invoices?select=*&order=id.desc&limit=' + limit)
        .then(function(items) {
          if (Array.isArray(items)) return items;
          throw new Error();
        })
        .catch(function() {
          return AppDB.getInvoices().then(function (invoices) {
            return invoices.slice(0, limit);
          });
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
      return fetchSupabaseRest('shop_settings?id=eq.1&select=*')
        .then(function(res) {
          if (Array.isArray(res) && res.length > 0) {
            setItem('shop_settings', res[0]);
            return res[0];
          }
          throw new Error();
        })
        .catch(function() {
          initDB();
          return getItem('shop_settings', INITIAL_SETTINGS);
        });
    },

    saveShopSettings: function (settings) {
      var current = getItem('shop_settings', INITIAL_SETTINGS);
      Object.keys(settings).forEach(function (k) { current[k] = settings[k]; });
      current.id = 1;

      return fetchSupabaseRest('shop_settings?id=eq.1', {
        method: 'PATCH',
        body: current
      })
      .then(function() {
        setItem('shop_settings', current);
        return current;
      })
      .catch(function() {
        initDB();
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
      var qtyChange = parseInt(data.quantity_change || data.qty) || 0;
      var reason = data.reason || data.type || 'audit';
      var payload = {
        product_id: data.product_id,
        product_name: data.product_name || '',
        quantity_change: qtyChange,
        reason: reason,
        notes: data.notes || ''
      };

      return fetchSupabaseRest('stock_adjustments', { method: 'POST', body: payload })
      .then(function(res) {
        var saved = Array.isArray(res) && res.length > 0 ? res[0] : payload;
        if (data.product_id) {
          AppDB.getProduct(data.product_id).then(function(p) {
            if (p) {
              var newQty = Math.max(0, (p.stock_qty || 0) + qtyChange);
              fetchSupabaseRest('products?id=eq.' + p.id, {
                method: 'PATCH',
                body: { stock_qty: newQty }
              });
            }
          });
        }
        return saved;
      })
      .catch(function() {
        initDB();
        var products = getItem('products', []);
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
        adjustments.push(record);
        setItem('stockAdjustments', adjustments);
        return record;
      });
    },

    createStockAdjustment: function (data) {
      return this.addStockAdjustment(data);
    },

    getStockAdjustments: function () {
      return fetchSupabaseRest('stock_adjustments?select=*&order=id.desc')
        .then(function (data) {
          if (Array.isArray(data)) {
            setItem('stockAdjustments', data);
            return data;
          }
          throw new Error();
        })
        .catch(function () {
          initDB();
          return getItem('stockAdjustments', []);
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
