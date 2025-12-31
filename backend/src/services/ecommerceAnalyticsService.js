/**
 * E-commerce Analytics Service
 * Real-time dashboard data, revenue tracking, funnel analysis, custom reports,
 * export functionality, and scheduled report generation
 */

const Timestamp = require('firebase-admin').firestore.Timestamp;

/**
 * Get real-time dashboard metrics
 */
async function getDashboardMetrics(db, dateRange = 'last30days') {
  const endDate = new Date();
  let startDate = new Date();

  if (dateRange === 'last7days') startDate.setDate(endDate.getDate() - 7);
  else if (dateRange === 'last30days') startDate.setDate(endDate.getDate() - 30);
  else if (dateRange === 'last90days') startDate.setDate(endDate.getDate() - 90);
  else if (dateRange === 'year') startDate.setFullYear(endDate.getFullYear() - 1);

  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);

  // Fetch orders in date range
  const ordersSnapshot = await db
    .collection('orders')
    .where('createdAt', '>=', startTimestamp)
    .where('createdAt', '<=', endTimestamp)
    .get();

  const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Calculate metrics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Completed orders
  const completedOrders = orders.filter(o => o.status === 'concluido');
  const completionRate = totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0;

  // Cart abandonment (orders that were started but not completed)
  const cartSnapshot = await db.collection('carts').get();
  const cartCount = cartSnapshot.size;
  const cartAbandonment = totalOrders > 0 ? (cartCount / (totalOrders + cartCount)) * 100 : 0;

  return {
    dateRange,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    totalOrders,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    averageOrderValue: parseFloat(avgOrderValue.toFixed(2)),
    completedOrders: completedOrders.length,
    completionRate: parseFloat(completionRate.toFixed(2)),
    cartAbandonment: parseFloat(cartAbandonment.toFixed(2)),
  };
}

/**
 * Get revenue metrics with daily/weekly/monthly aggregation
 */
async function getRevenueMetrics(db, granularity = 'daily', dateRange = 'last30days') {
  const endDate = new Date();
  let startDate = new Date();

  if (dateRange === 'last7days') startDate.setDate(endDate.getDate() - 7);
  else if (dateRange === 'last30days') startDate.setDate(endDate.getDate() - 30);
  else if (dateRange === 'last90days') startDate.setDate(endDate.getDate() - 90);
  else if (dateRange === 'year') startDate.setFullYear(endDate.getFullYear() - 1);

  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);

  const ordersSnapshot = await db
    .collection('orders')
    .where('createdAt', '>=', startTimestamp)
    .where('createdAt', '<=', endTimestamp)
    .get();

  const orders = ordersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Group by granularity
  const grouped = {};

  orders.forEach(order => {
    const date = new Date(order.createdAt.toDate());
    let key;

    if (granularity === 'daily') {
      key = date.toISOString().split('T')[0];
    } else if (granularity === 'weekly') {
      const week = Math.floor((date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      key = `Week ${week + 1}`;
    } else if (granularity === 'monthly') {
      key = date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
    }

    if (!grouped[key]) {
      grouped[key] = { revenue: 0, count: 0 };
    }
    grouped[key].revenue += order.total || 0;
    grouped[key].count += 1;
  });

  // Convert to array and add average
  const data = Object.entries(grouped).map(([period, metrics]) => ({
    period,
    revenue: parseFloat(metrics.revenue.toFixed(2)),
    orderCount: metrics.count,
    averageOrderValue: parseFloat((metrics.revenue / metrics.count).toFixed(2)),
  }));

  return {
    granularity,
    dateRange,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    data,
    totalRevenue: parseFloat(data.reduce((sum, d) => sum + d.revenue, 0).toFixed(2)),
  };
}

/**
 * Get funnel metrics (cart -> checkout -> payment)
 */
async function getFunnelMetrics(db, dateRange = 'last30days') {
  const endDate = new Date();
  let startDate = new Date();

  if (dateRange === 'last7days') startDate.setDate(endDate.getDate() - 7);
  else if (dateRange === 'last30days') startDate.setDate(endDate.getDate() - 30);
  else if (dateRange === 'last90days') startDate.setDate(endDate.getDate() - 90);

  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);

  // Get all carts (step 1)
  const cartsSnapshot = await db
    .collection('carts')
    .where('lastUpdated', '>=', startTimestamp)
    .where('lastUpdated', '<=', endTimestamp)
    .get()
    .catch(() => ({ size: 0 }));
  const cartCount = cartsSnapshot.size;

  // Get all checkouts started (step 2)
  const ordersSnapshot = await db
    .collection('orders')
    .where('createdAt', '>=', startTimestamp)
    .where('createdAt', '<=', endTimestamp)
    .get();
  const checkoutCount = ordersSnapshot.size;

  // Get completed payments (step 3)
  const paidOrders = ordersSnapshot.docs.filter(doc => doc.data().paymentStatus === 'pago');
  const paymentCount = paidOrders.length;

  const cartToCheckout = cartCount > 0 ? (checkoutCount / cartCount) * 100 : 0;
  const checkoutToPayment = checkoutCount > 0 ? (paymentCount / checkoutCount) * 100 : 0;
  const overallConversion = cartCount > 0 ? (paymentCount / cartCount) * 100 : 0;

  return {
    dateRange,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    funnel: [
      {
        step: 1,
        name: 'Carrinho',
        users: cartCount,
        percentage: 100,
      },
      {
        step: 2,
        name: 'Checkout',
        users: checkoutCount,
        percentage: parseFloat(cartToCheckout.toFixed(2)),
      },
      {
        step: 3,
        name: 'Pagamento Confirmado',
        users: paymentCount,
        percentage: parseFloat(checkoutToPayment.toFixed(2)),
      },
    ],
    cartAbandonment: parseFloat((100 - cartToCheckout).toFixed(2)),
    overallConversion: parseFloat(overallConversion.toFixed(2)),
  };
}

/**
 * Build custom report with filters
 */
async function buildCustomReport(db, filters = {}) {
  let query = db.collection('orders');

  // Apply date filters
  if (filters.startDate) {
    query = query.where('createdAt', '>=', Timestamp.fromDate(new Date(filters.startDate)));
  }
  if (filters.endDate) {
    query = query.where('createdAt', '<=', Timestamp.fromDate(new Date(filters.endDate)));
  }

  const snapshot = await query.get();
  let orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Filter by product
  if (filters.productId) {
    orders = orders.filter(
      order => order.items && order.items.some(item => item.productId === filters.productId)
    );
  }

  // Filter by category
  if (filters.category) {
    orders = orders.filter(
      order => order.items && order.items.some(item => item.category === filters.category)
    );
  }

  // Filter by status
  if (filters.status) {
    orders = orders.filter(order => order.status === filters.status);
  }

  return {
    filters,
    orderCount: orders.length,
    totalRevenue: parseFloat(orders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)),
    averageOrderValue: parseFloat(
      (orders.reduce((sum, o) => sum + (o.total || 0), 0) / (orders.length || 1)).toFixed(2)
    ),
    data: orders,
  };
}

/**
 * Generate CSV export of orders
 */
function generateCSVExport(orders) {
  if (!orders || orders.length === 0) {
    return 'ID,Data,Status,Total\n';
  }

  const headers = ['ID', 'Data', 'Status', 'Subtotal', 'Taxa', 'Frete', 'Total'];
  const rows = orders.map(order => [
    order.id,
    order.createdAt ? new Date(order.createdAt.toDate()).toLocaleDateString('pt-BR') : '',
    order.status || '',
    order.subtotal || 0,
    order.tax || 0,
    order.shipping || 0,
    order.total || 0,
  ]);

  const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join(
    '\n'
  );

  return csv;
}

/**
 * Generate PDF export metadata
 */
function generatePDFExport(orders, reportTitle = 'Relatório de Pedidos') {
  if (!orders || orders.length === 0) {
    return { title: reportTitle, pages: 0, data: [] };
  }

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const avgOrderValue = totalRevenue / orders.length;

  return {
    title: reportTitle,
    generatedAt: new Date().toISOString(),
    pages: Math.ceil(orders.length / 25),
    summary: {
      totalOrders: orders.length,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      averageOrderValue: parseFloat(avgOrderValue.toFixed(2)),
    },
    data: orders,
  };
}

/**
 * Schedule report for email delivery
 */
async function scheduleReport(db, reportConfig) {
  if (!reportConfig.recipients || reportConfig.recipients.length === 0) {
    throw new Error('Recipients required');
  }

  const scheduledReportRef = await db.collection('scheduledReports').add({
    title: reportConfig.title || 'Relatório Agendado',
    type: reportConfig.type || 'revenue',
    frequency: reportConfig.frequency || 'weekly',
    recipients: reportConfig.recipients,
    format: reportConfig.format || 'csv',
    nextRunDate: Timestamp.fromDate(new Date(reportConfig.nextRunDate || Date.now() + 86400000)),
    createdAt: Timestamp.now(),
    active: true,
  });

  return {
    id: scheduledReportRef.id,
    title: reportConfig.title,
    frequency: reportConfig.frequency,
    recipients: reportConfig.recipients,
    status: 'scheduled',
  };
}

/**
 * Analyze user cohorts
 */
async function analyzeCohorts(db, dateRange = 'last90days') {
  const endDate = new Date();
  let startDate = new Date();

  if (dateRange === 'last30days') startDate.setDate(endDate.getDate() - 30);
  else if (dateRange === 'last90days') startDate.setDate(endDate.getDate() - 90);
  else if (dateRange === 'last180days') startDate.setDate(endDate.getDate() - 180);

  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);

  // Get users created in date range
  const usersSnapshot = await db
    .collection('users')
    .where('memberSince', '>=', startTimestamp)
    .where('memberSince', '<=', endTimestamp)
    .get();

  const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Get orders in same period
  const ordersSnapshot = await db
    .collection('orders')
    .where('createdAt', '>=', startTimestamp)
    .where('createdAt', '<=', endTimestamp)
    .get();

  const orderUserIds = new Set(ordersSnapshot.docs.map(doc => doc.data().userId));
  const activeCount = users.filter(u => orderUserIds.has(u.email)).length;

  return {
    dateRange,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    totalSignups: users.length,
    activeUsers: activeCount,
    retentionRate: parseFloat(((activeCount / (users.length || 1)) * 100).toFixed(2)),
  };
}

/**
 * Track custom events
 */
async function trackEvent(db, eventData) {
  if (!eventData.eventName) {
    throw new Error('Event name required');
  }

  const event = {
    eventName: eventData.eventName,
    userId: eventData.userId || 'anonymous',
    metadata: eventData.metadata || {},
    timestamp: Timestamp.now(),
  };

  const docRef = await db.collection('analyticsEvents').add(event);
  return {
    id: docRef.id,
    ...event,
    timestamp: event.timestamp.toDate().toISOString(),
  };
}

module.exports = {
  getDashboardMetrics,
  getRevenueMetrics,
  getFunnelMetrics,
  buildCustomReport,
  generateCSVExport,
  generatePDFExport,
  scheduleReport,
  analyzeCohorts,
  trackEvent,
};
