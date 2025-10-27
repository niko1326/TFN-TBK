// SYSTEM ANALITYCZNY ZAMÓWIEŃ E-COMMERCE - WERSJA FUNKCYJNA

// Funkcja tworząca nowe zamówienie
const createOrder = (id, customerId, items, discount, region) => ({
    id,
    customerId,
    items,
    discount,
    region,
    timestamp: Date.now(),
    processed: false
});

// Funkcja dodająca zamówienie do listy
const addOrder = (orders, customerId, items, discount, region) => {
    const newId = orders.length + 1;
    const newOrder = createOrder(newId, customerId, items, discount, region);
    return [...orders, newOrder];
};

// Walidacja zamówienia
const validateOrder = (order) => {
    const errors = [];
    
    if (!order.customerId || order.customerId.length < 3) {
        errors.push("Invalid customer ID");
    }
    
    if (!order.items || order.items.length === 0) {
        errors.push("No items in order");
    }
    
    const itemErrors = order.items.flatMap(item => {
        const itemErrs = [];
        if (!item.price || item.price <= 0) {
            itemErrs.push(`Invalid price for item: ${item.name}`);
        }
        if (!item.quantity || item.quantity <= 0) {
            itemErrs.push(`Invalid quantity for item: ${item.name}`);
        }
        return itemErrs;
    });
    
    errors.push(...itemErrors);
    
    if (order.discount && (order.discount < 0 || order.discount > 100)) {
        errors.push("Invalid discount percentage");
    }
    
    return errors;
};

// Obliczanie całkowitej wartości zamówienia
const calculateOrderTotal = (order) => {
    const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    const discountAmount = order.discount ? subtotal * (order.discount / 100) : 0;
    
    const totalBeforeTax = subtotal - discountAmount;
    
    const taxRate = {
        "EU": 0.23,
        "US": 0.08,
        "Asia": 0.15
    }[order.region] || 0;
    
    const tax = totalBeforeTax * taxRate;
    
    return totalBeforeTax + tax;
};

// Przetwarzanie zamówień
const processOrders = (orders) => {
    const { processed, failed, errors } = orders.reduce((acc, order) => {
        if (order.processed) {
            return { ...acc, processed: [...acc.processed, order] };
        }
        
        const validationErrors = validateOrder(order);
        if (validationErrors.length === 0) {
            const total = calculateOrderTotal(order);
            const processedOrder = { ...order, processed: true, total };
            return { ...acc, processed: [...acc.processed, processedOrder] };
        } else {
            return {
                ...acc,
                failed: acc.failed + 1,
                errors: [...acc.errors, { orderId: order.id, errors: validationErrors }]
            };
        }
    }, { processed: [], failed: 0, errors: [] });
    
    return {
        processedOrders: processed,
        processedCount: processed.length,
        failedCount: failed,
        processingErrors: errors
    };
};

// Filtrowanie zamówień według klienta i regionu
const getCustomerOrdersByRegion = (orders, customerId, region) =>
    orders.filter(order => 
        order.customerId === customerId && 
        order.region === region && 
        order.processed
    );

// Obliczanie statystyk sprzedaży według regionów
const calculateRegionalStats = (orders) => {
    const initialStats = orders
        .filter(order => order.processed)
        .reduce((acc, order) => {
            const region = order.region;
            const existing = acc[region] || { totalRevenue: 0, orderCount: 0, itemsSold: 0 };
            const itemsSold = order.items.reduce((sum, item) => sum + item.quantity, 0);
            return {
                ...acc,
                [region]: {
                    totalRevenue: existing.totalRevenue + order.total,
                    orderCount: existing.orderCount + 1,
                    itemsSold: existing.itemsSold + itemsSold
                }
            };
        }, {});
    
    return Object.fromEntries(
        Object.entries(initialStats).map(([region, stats]) => [
            region,
            {
                ...stats,
                averageOrderValue: stats.orderCount > 0 ? stats.totalRevenue / stats.orderCount : 0
            }
        ])
    );
};

// Znajdowanie najbardziej dochodowych klientów
const getTopCustomers = (orders, limit) => {
    const customerTotals = orders
        .filter(order => order.processed)
        .reduce((acc, order) => {
            const customerId = order.customerId;
            const existing = acc[customerId] || { totalSpent: 0, orderCount: 0 };
            return {
                ...acc,
                [customerId]: {
                    customerId,
                    totalSpent: existing.totalSpent + order.total,
                    orderCount: existing.orderCount + 1
                }
            };
        }, {});
    
    return Object.values(customerTotals)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, limit);
};

// Generowanie raportu sprzedaży
const generateSalesReport = (orders, startDate, endDate) => {
    const filteredOrders = orders.filter(order => 
        order.processed && 
        order.timestamp >= startDate && 
        order.timestamp <= endDate
    );
    
    const summary = filteredOrders.reduce((acc, order) => ({
        totalOrders: acc.totalOrders + 1,
        totalRevenue: acc.totalRevenue + order.total,
        totalItems: acc.totalItems + order.items.reduce((sum, item) => sum + item.quantity, 0)
    }), { totalOrders: 0, totalRevenue: 0, totalItems: 0 });
    
    const averageOrderValue = summary.totalOrders > 0 ? summary.totalRevenue / summary.totalOrders : 0;
    
    const regionalBreakdown = filteredOrders.reduce((acc, order) => {
        const region = order.region;
        const existing = acc[region] || { orders: 0, revenue: 0 };
        return {
            ...acc,
            [region]: {
                orders: existing.orders + 1,
                revenue: existing.revenue + order.total
            }
        };
    }, {});
    
    const productSales = filteredOrders.flatMap(order => order.items).reduce((acc, item) => {
        const existing = acc[item.name] || { quantity: 0, revenue: 0 };
        return {
            ...acc,
            [item.name]: {
                name: item.name,
                quantity: existing.quantity + item.quantity,
                revenue: existing.revenue + (item.price * item.quantity)
            }
        };
    }, {});
    
    const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue);
    
    return {
        period: { start: startDate, end: endDate },
        summary: { ...summary, averageOrderValue },
        regionalBreakdown,
        topProducts
    };
};

// Przykład użycia (funkcyjne, bez mutacji globalnego stanu):
let orders = [];

orders = addOrder(orders, "CUST001", [
    { name: "Laptop", price: 1200, quantity: 1 },
    { name: "Mouse", price: 25, quantity: 2 }
], 10, "EU");

orders = addOrder(orders, "CUST002", [
    { name: "Keyboard", price: 80, quantity: 1 },
    { name: "Monitor", price: 300, quantity: 2 }
], 5, "US");

orders = addOrder(orders, "CUST001", [
    { name: "Headphones", price: 150, quantity: 1 }
], 0, "EU");

const { processedOrders, processedCount, failedCount, processingErrors } = processOrders(orders);
console.log("Processing:", { processed: processedCount, failed: failedCount });
console.log("Top Customers:", getTopCustomers(processedOrders, 5));
console.log("Regional Stats:", calculateRegionalStats(processedOrders));
